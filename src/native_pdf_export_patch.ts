import { MarkdownRenderChild, MarkdownRenderer, MarkdownView, TFile } from "obsidian";
import {
	createFencedCodeBlock,
	expandCodeEmbedsInMarkdown,
	resolveCodeEmbedReference,
	sliceFileContent,
} from "./code_embed_markdown";
import type CodeSpacePlugin from "./main";
import { readFileDecoded } from "./encoding";

const NATIVE_EXPORT_COMMAND_ID = "workspace:export-pdf";
const EXPORT_MODAL_SELECTOR = ".modal-container";
const EXPORT_SESSION_TTL_MS = 120000;
const POPUP_SCAN_INTERVAL_MS = 250;
const POPUP_PROCESSED_ATTR = "data-code-space-native-pdf-processed";
const NATIVE_PDF_LOG_PREFIX = "Code Space [native-pdf]";

type PrivateCommand = {
	callback?: () => unknown;
};

type PrivateCommandManager = {
	commands?: Record<string, PrivateCommand | undefined>;
	executeCommandById?: (commandId: string, ...args: unknown[]) => unknown;
};

type AppWithPrivateCommands = CodeSpacePlugin["app"] & {
	commands?: PrivateCommandManager;
};

type MutableMarkdownView = MarkdownView & {
	getViewData: () => string;
	containerEl?: HTMLElement;
	file?: TFile | null;
	printToPdf?: () => unknown;
};

type MutableVault = CodeSpacePlugin["app"]["vault"] & {
	cachedRead: (file: TFile) => Promise<string>;
};

type NativeExportSession = {
	id: number;
	sourceFile: TFile;
	ownerDoc: Document;
	ownerWindow: Window;
	fallbackMarkdown: string;
	knownModals: Set<HTMLElement>;
	trackedModals: Set<HTMLElement>;
	sawTrackedModal: boolean;
	observer: MutationObserver | null;
	timeoutId: number | null;
	restoreWindowOpen: (() => void) | null;
	popupCleanups: Set<() => void>;
	lastPopupScanSignature: string | null;
	cachedReadHits: number;
	replacementAttempts: number;
	replacementSuccesses: number;
	popupOpened: boolean;
	cleanup: () => void;
};

let nativeExportInvocationDepth = 0;
let activeNativeExportSession: NativeExportSession | null = null;
let nativeExportSessionCounter = 0;

function debugNativePdf(
	session: NativeExportSession | null,
	message: string,
	details?: Record<string, unknown>
) {
	const prefix = session
		? `${NATIVE_PDF_LOG_PREFIX} #${session.id}: ${message}`
		: `${NATIVE_PDF_LOG_PREFIX}: ${message}`;
	if (details) {
		console.debug(prefix, details);
		return;
	}
	console.debug(prefix);
}

function warnNativePdf(
	session: NativeExportSession | null,
	message: string,
	details?: Record<string, unknown>
) {
	const prefix = session
		? `${NATIVE_PDF_LOG_PREFIX} #${session.id}: ${message}`
		: `${NATIVE_PDF_LOG_PREFIX}: ${message}`;
	if (details) {
		console.warn(prefix, details);
		return;
	}
	console.warn(prefix);
}

function getModalContainers(doc: Document): Set<HTMLElement> {
	return new Set(Array.from(doc.querySelectorAll<HTMLElement>(EXPORT_MODAL_SELECTOR)));
}

function summarizeEmbed(embedEl: HTMLElement): Record<string, unknown> {
	const titleEl = embedEl.querySelector(".file-embed-title");
	const internalLink =
		titleEl?.querySelector<HTMLAnchorElement>("a.internal-link") ??
		embedEl.querySelector<HTMLAnchorElement>(".file-embed-title a.internal-link");

	return {
		className: embedEl.className,
		dataHref: embedEl.getAttribute("data-href"),
		dataSrc: embedEl.getAttribute("data-src"),
		src: embedEl.getAttribute("src"),
		title: titleEl?.textContent?.trim() ?? "",
		linkHref: internalLink?.getAttribute("href"),
		linkDataHref: internalLink?.getAttribute("data-href"),
	};
}

async function buildExpandedMarkdown(
	plugin: CodeSpacePlugin,
	view: MutableMarkdownView | null,
	sourceFile: TFile,
	fallbackMarkdown: string
): Promise<string> {
	const sourceMarkdown =
		view?.file?.path === sourceFile.path ? view.getViewData() : fallbackMarkdown;

	try {
		return await expandCodeEmbedsInMarkdown(plugin, sourceMarkdown, sourceFile);
	} catch (error) {
		warnNativePdf(activeNativeExportSession, "failed to expand markdown for native export", {
			file: sourceFile.path,
			error,
		});
		return fallbackMarkdown;
	}
}

function cleanupActiveNativeExportSession() {
	activeNativeExportSession?.cleanup();
}

function hasLiveTrackedModal(session: NativeExportSession): boolean {
	return Array.from(session.trackedModals).some((modal) => modal.isConnected);
}

function shouldKeepSessionAlive(session: NativeExportSession): boolean {
	return hasLiveTrackedModal(session) || session.popupCleanups.size > 0 || session.popupOpened;
}

function maybeCleanupSession(session: NativeExportSession, reason: string) {
	if (activeNativeExportSession !== session) {
		return;
	}

	if (shouldKeepSessionAlive(session)) {
		debugNativePdf(session, "session kept alive", {
			reason,
			liveTrackedModal: hasLiveTrackedModal(session),
			popupObserverCount: session.popupCleanups.size,
			popupOpened: session.popupOpened,
		});
		return;
	}

	debugNativePdf(session, "session eligible for cleanup", { reason });
	session.cleanup();
}

function installPopupPrintObserver(
	session: NativeExportSession,
	plugin: CodeSpacePlugin,
	popupWindow: Window
): () => void {
	let cleanedUp = false;
	let observer: MutationObserver | null = null;
	let intervalId: number | null = null;
	let unloadHandler: (() => void) | null = null;

	const cleanup = () => {
		if (cleanedUp) return;
		cleanedUp = true;
		observer?.disconnect();
		if (intervalId !== null) {
			session.ownerWindow.clearInterval(intervalId);
		}
		if (unloadHandler) {
			popupWindow.removeEventListener("beforeunload", unloadHandler);
			popupWindow.removeEventListener("unload", unloadHandler);
		}
		session.popupCleanups.delete(cleanup);
		session.popupOpened = false;
		maybeCleanupSession(session, "popup closed");
	};
	session.popupCleanups.add(cleanup);

	const scanPopup = () => {
		if (popupWindow.closed) {
			debugNativePdf(session, "popup window closed");
			cleanup();
			return;
		}

		const popupDoc = popupWindow.document;
		const popupBody = popupDoc.body;
		if (!popupBody) {
			return;
		}

		const printRoots = Array.from(popupDoc.querySelectorAll<HTMLElement>(".print"));
		const fileEmbedCount = popupDoc.querySelectorAll(".file-embed").length;
		const signature = `print:${printRoots.length}|embed:${fileEmbedCount}`;
		if (session.lastPopupScanSignature !== signature) {
			session.lastPopupScanSignature = signature;
			debugNativePdf(session, "popup scan state changed", {
				printRoots: printRoots.length,
				fileEmbeds: fileEmbedCount,
				url: popupWindow.location.href,
			});
		}

		if (printRoots.length > 0) {
			for (const root of printRoots) {
				void replacePopupCodeEmbeds(root, plugin, session.sourceFile.path);
			}
			return;
		}

		if (popupBody.querySelector(".file-embed")) {
			void replacePopupCodeEmbeds(popupBody, plugin, session.sourceFile.path);
		}
	};

	try {
		debugNativePdf(session, "attached popup observer");
		intervalId = session.ownerWindow.setInterval(scanPopup, POPUP_SCAN_INTERVAL_MS);
		const popupBody = popupWindow.document.body;
		if (popupBody) {
			observer = new MutationObserver(() => {
				scanPopup();
			});
			observer.observe(popupBody, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["class"],
			});
		}

		unloadHandler = () => cleanup();
		popupWindow.addEventListener("beforeunload", unloadHandler);
		popupWindow.addEventListener("unload", unloadHandler);
		scanPopup();
	} catch (error) {
		warnNativePdf(session, "failed to observe native PDF popup window", { error });
		cleanup();
		return cleanup;
	}

	return cleanup;
}

function extractRawReferenceFromEmbed(embedEl: HTMLElement): string {
	const titleEl = embedEl.querySelector(".file-embed-title");
	const internalLink =
		titleEl?.querySelector<HTMLAnchorElement>("a.internal-link") ??
		embedEl.querySelector<HTMLAnchorElement>(".file-embed-title a.internal-link");

	const candidates = [
		internalLink?.getAttribute("data-href"),
		titleEl?.getAttribute("data-href"),
		embedEl.getAttribute("data-href"),
		embedEl.getAttribute("data-src"),
		embedEl.getAttribute("src"),
		titleEl?.textContent,
		internalLink?.getAttribute("href"),
		embedEl.getAttribute("alt"),
	];

	for (const candidate of candidates) {
		const value = candidate?.trim();
		if (value) {
			return value.replace(/^!?\[\[/, "").replace(/\]\]$/, "").trim();
		}
	}

	return "";
}

async function replacePopupCodeEmbeds(
	rootEl: HTMLElement,
	plugin: CodeSpacePlugin,
	sourcePath: string
): Promise<void> {
	const embedEls = rootEl.classList.contains("file-embed")
		? [rootEl]
		: Array.from(rootEl.querySelectorAll<HTMLElement>(".file-embed"));

	if (embedEls.length > 0) {
		debugNativePdf(activeNativeExportSession, "attempting popup embed replacement", {
			rootClassName: rootEl.className,
			embedCount: embedEls.length,
		});
	}

	for (const embedEl of embedEls) {
		if (embedEl.getAttribute(POPUP_PROCESSED_ATTR) === "done") {
			continue;
		}
		embedEl.setAttribute(POPUP_PROCESSED_ATTR, "pending");
		if (activeNativeExportSession) {
			activeNativeExportSession.replacementAttempts += 1;
		}

		try {
			const rawReference = extractRawReferenceFromEmbed(embedEl);
			const resolved = resolveCodeEmbedReference(plugin, rawReference, sourcePath);
			if (!resolved) {
				warnNativePdf(activeNativeExportSession, "failed to resolve popup embed reference", {
					sourcePath,
					rawReference,
					embed: summarizeEmbed(embedEl),
				});
				embedEl.removeAttribute(POPUP_PROCESSED_ATTR);
				continue;
			}

			const { text: fullContent } = await readFileDecoded(plugin.app, resolved.file);
			const slicedContent = sliceFileContent(fullContent, resolved.startLine, resolved.endLine);
			const replacementEl = embedEl.ownerDocument.createDiv();
			replacementEl.className = "code-space-native-pdf-code markdown-rendered";

			const child = new MarkdownRenderChild(replacementEl);
			await MarkdownRenderer.render(
				plugin.app,
				createFencedCodeBlock(slicedContent, resolved.file.extension.toLowerCase()),
				replacementEl,
				sourcePath,
				child
			);

			embedEl.replaceWith(replacementEl);
			replacementEl.setAttribute(POPUP_PROCESSED_ATTR, "done");
			if (activeNativeExportSession) {
				activeNativeExportSession.replacementSuccesses += 1;
			}
			debugNativePdf(activeNativeExportSession, "replaced popup embed with static code block", {
				rawReference,
				resolvedPath: resolved.file.path,
				startLine: resolved.startLine,
				endLine: resolved.endLine,
			});
		} catch (error) {
			warnNativePdf(activeNativeExportSession, "failed to replace popup embed", {
				error,
				embed: summarizeEmbed(embedEl),
			});
			embedEl.removeAttribute(POPUP_PROCESSED_ATTR);
		}
	}
}

function installPopupWindowHook(session: NativeExportSession, plugin: CodeSpacePlugin) {
	const win = session.ownerWindow;
	// eslint-disable-next-line @typescript-eslint/unbound-method -- Preserve identity so cleanup never clobbers a later wrapper.
	const originalOpen = win.open;

	const wrappedOpen = ((...args: Parameters<typeof window.open>) => {
		debugNativePdf(session, "window.open intercepted", {
			url: args[0] ?? "",
			target: args[1] ?? "",
			features: args[2] ?? "",
		});
		const popupWindow = originalOpen.apply(win, args);
		if (activeNativeExportSession === session && popupWindow) {
			session.popupOpened = true;
			debugNativePdf(session, "popup window opened successfully");
			installPopupPrintObserver(session, plugin, popupWindow);
			session.restoreWindowOpen?.();
			session.restoreWindowOpen = null;
		}
		return popupWindow;
	}) as typeof window.open;
	win.open = wrappedOpen;

	session.restoreWindowOpen = () => {
		if (win.open === wrappedOpen) {
			win.open = originalOpen;
		}
	};
}

function beginNativeExportSession(
	plugin: CodeSpacePlugin,
	sourceFile: TFile,
	fallbackMarkdown: string,
	ownerDoc: Document,
	knownModals: Set<HTMLElement>
): () => void {
	cleanupActiveNativeExportSession();

	const docWindow = ownerDoc.defaultView ?? window;
	const body = ownerDoc.body;
	if (!body) {
		return () => undefined;
	}

	const session: NativeExportSession = {
		id: ++nativeExportSessionCounter,
		sourceFile,
		ownerDoc,
		ownerWindow: docWindow,
		fallbackMarkdown,
		knownModals,
		trackedModals: new Set<HTMLElement>(),
		sawTrackedModal: false,
		observer: null,
		timeoutId: null,
		restoreWindowOpen: null,
		popupCleanups: new Set<() => void>(),
		lastPopupScanSignature: null,
		cachedReadHits: 0,
		replacementAttempts: 0,
		replacementSuccesses: 0,
		popupOpened: false,
		cleanup: () => undefined,
	};

	const cleanup = () => {
		if (activeNativeExportSession !== session) {
			return;
		}

		session.observer?.disconnect();
		if (session.timeoutId !== null) {
			docWindow.clearTimeout(session.timeoutId);
		}
		for (const popupCleanup of Array.from(session.popupCleanups)) {
			popupCleanup();
		}
		session.restoreWindowOpen?.();
		debugNativePdf(session, "cleaning up native export session", {
			cachedReadHits: session.cachedReadHits,
			replacementAttempts: session.replacementAttempts,
			replacementSuccesses: session.replacementSuccesses,
			trackedModalCount: session.trackedModals.size,
		});
		activeNativeExportSession = null;
	};

	const refreshTrackedModals = () => {
		const currentModals = Array.from(ownerDoc.querySelectorAll<HTMLElement>(EXPORT_MODAL_SELECTOR));
		for (const modal of currentModals) {
			if (!session.knownModals.has(modal)) {
				session.trackedModals.add(modal);
			}
		}

		if (session.trackedModals.size > 0) {
			session.sawTrackedModal = true;
			debugNativePdf(session, "detected export modal lifecycle", {
				trackedModalCount: session.trackedModals.size,
			});
		}

		if (session.sawTrackedModal) {
			if (!hasLiveTrackedModal(session)) {
				maybeCleanupSession(session, "export modal closed");
			}
		}
	};

	session.cleanup = cleanup;
	session.timeoutId = docWindow.setTimeout(cleanup, EXPORT_SESSION_TTL_MS);
	session.observer = new MutationObserver(() => {
		refreshTrackedModals();
	});
	session.observer.observe(body, {
		childList: true,
		subtree: true,
	});

	activeNativeExportSession = session;
	debugNativePdf(session, "native export session started", {
		file: sourceFile.path,
		knownModalCount: knownModals.size,
	});
	installPopupWindowHook(session, plugin);
	refreshTrackedModals();

	return cleanup;
}

async function runPatchedNativePdfExport(
	plugin: CodeSpacePlugin,
	invokeOriginal: () => unknown,
	preferredView?: MutableMarkdownView | null
): Promise<unknown> {
	const view =
		(preferredView?.file ? preferredView : null) ??
		plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (!view?.file) {
		debugNativePdf(null, "native export invoked without active markdown view");
		return await Promise.resolve(invokeOriginal());
	}

	const ownerDoc = view.containerEl?.ownerDocument ?? activeDocument;
	const knownModals = getModalContainers(ownerDoc);
	const fallbackMarkdown = view.getViewData();
	const stopSession = beginNativeExportSession(plugin, view.file, fallbackMarkdown, ownerDoc, knownModals);
	debugNativePdf(activeNativeExportSession, "invoking original native export command", {
		file: view.file.path,
		markdownLength: fallbackMarkdown.length,
	});

	try {
		const result = await Promise.resolve(invokeOriginal());
		return result;
	} catch (error) {
		stopSession();
		throw error;
	}
}

function installCachedReadOverride(plugin: CodeSpacePlugin) {
	const vault = plugin.app.vault as MutableVault;
	const originalCachedRead = vault.cachedRead.bind(vault);

	const wrappedCachedRead = async (file: TFile) => {
		const session = activeNativeExportSession;
		if (!session || file.path !== session.sourceFile.path) {
			return await originalCachedRead(file);
		}

		session.cachedReadHits += 1;
		debugNativePdf(session, "cachedRead intercepted for source file", {
			file: file.path,
			hit: session.cachedReadHits,
		});
		const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		return await buildExpandedMarkdown(
			plugin,
			activeView,
			session.sourceFile,
			session.fallbackMarkdown
		);
	};
	vault.cachedRead = wrappedCachedRead;

	plugin.register(() => {
		if (vault.cachedRead === wrappedCachedRead) {
			vault.cachedRead = originalCachedRead;
		}
		cleanupActiveNativeExportSession();
	});
}

function installMarkdownViewPrintPatch(plugin: CodeSpacePlugin) {
	const markdownViewProto = MarkdownView.prototype as MutableMarkdownView;
	const originalPrintToPdf = markdownViewProto.printToPdf;

	if (typeof originalPrintToPdf !== "function") {
		warnNativePdf(null, "MarkdownView.printToPdf is unavailable; skipping direct print patch");
		return;
	}

	const wrappedPrintToPdf = function (this: MutableMarkdownView) {
		if (nativeExportInvocationDepth > 0) {
			return originalPrintToPdf.apply(this);
		}

		debugNativePdf(null, "intercepted MarkdownView.printToPdf", {
			file: this.file?.path ?? "",
		});
		nativeExportInvocationDepth += 1;
		return runPatchedNativePdfExport(plugin, () => originalPrintToPdf.apply(this), this)
			.finally(() => {
				nativeExportInvocationDepth = Math.max(0, nativeExportInvocationDepth - 1);
			});
	};
	markdownViewProto.printToPdf = wrappedPrintToPdf;

	plugin.register(() => {
		if (markdownViewProto.printToPdf === wrappedPrintToPdf) {
			markdownViewProto.printToPdf = originalPrintToPdf;
		}
	});
}

export function registerNativePdfExportPatch(plugin: CodeSpacePlugin) {
	installCachedReadOverride(plugin);
	installMarkdownViewPrintPatch(plugin);
	debugNativePdf(null, "registered native PDF export patch");

	const commandManager = (plugin.app as AppWithPrivateCommands).commands;
	if (!commandManager) {
		warnNativePdf(null, "app command manager not available; native export patch disabled");
		return;
	}

	const command = commandManager.commands?.[NATIVE_EXPORT_COMMAND_ID];
	if (command?.callback) {
		const originalCallback = command.callback;
		const wrappedCallback = () => {
			if (nativeExportInvocationDepth > 0) {
				return originalCallback();
			}

			debugNativePdf(null, "intercepted native export callback command");
			nativeExportInvocationDepth += 1;
			return runPatchedNativePdfExport(plugin, () => originalCallback())
				.finally(() => {
					nativeExportInvocationDepth = Math.max(0, nativeExportInvocationDepth - 1);
				});
		};
		command.callback = wrappedCallback;

		plugin.register(() => {
			if (command.callback === wrappedCallback) {
				command.callback = originalCallback;
			}
		});
		return;
	}

	if (!commandManager.executeCommandById) {
		return;
	}

	const originalExecuteCommandById = commandManager.executeCommandById.bind(commandManager);
	const wrappedExecuteCommandById = (commandId: string, ...args: unknown[]) => {
		if (commandId !== NATIVE_EXPORT_COMMAND_ID || nativeExportInvocationDepth > 0) {
			return originalExecuteCommandById(commandId, ...args);
		}

		debugNativePdf(null, "intercepted native export executeCommandById");
		nativeExportInvocationDepth += 1;
		return runPatchedNativePdfExport(plugin, () => originalExecuteCommandById(commandId, ...args))
			.finally(() => {
				nativeExportInvocationDepth = Math.max(0, nativeExportInvocationDepth - 1);
			});
	};
	commandManager.executeCommandById = wrappedExecuteCommandById;

	plugin.register(() => {
		if (commandManager.executeCommandById === wrappedExecuteCommandById) {
			commandManager.executeCommandById = originalExecuteCommandById;
		}
	});
}
