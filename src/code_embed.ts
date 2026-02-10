import { MarkdownRenderChild, TFile, EventRef, normalizePath } from "obsidian";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { lineNumbers } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";
import { yaml } from "@codemirror/lang-yaml";
import { xml } from "@codemirror/lang-xml";
import { tags } from "@lezer/highlight";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { Compartment, Extension } from "@codemirror/state";
import CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";

// Language packages mapping
const LANGUAGE_PACKAGES: Record<string, Extension> = {
	'py': python(),
	'c': cpp(),
	'cpp': cpp(),
	'h': cpp(),
	'hpp': cpp(),
	'js': javascript({ jsx: true }),
	'ts': javascript({ jsx: true }),
	'jsx': javascript({ jsx: true }),
	'tsx': javascript({ jsx: true }),
	'json': javascript({ jsx: true }),
	'html': html(),
	'css': css(),
	'sql': sql(),
	'php': php(),
	'rs': rust(),
	'java': java(),
	'cs': java(), // Use Java mode for C# as a close approximation
	'go': go(),
	'yaml': yaml(),
	'yml': yaml(),
	'xml': xml(),
};

// Syntax highlighting styles
const lightHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: "#af00db" },
	{ tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: "#000000" },
	{ tag: [tags.function(tags.variableName), tags.labelName], color: "#795e26" },
	{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#0000ff" },
	{ tag: [tags.definition(tags.name), tags.separator], color: "#000000" },
	{ tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: "#098658" },
	{ tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: "#383838" },
	{ tag: [tags.meta, tags.comment], color: "#008000", fontStyle: "italic" },
	{ tag: tags.string, color: "#a31515" },
	{ tag: tags.atom, color: "#0000ff" },
	{ tag: tags.invalid, color: "#ff0000" },
]);

const darkHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: "#c678dd" },
	{ tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: "#abb2bf" },
	{ tag: [tags.function(tags.variableName), tags.labelName], color: "#61afef" },
	{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#d19a66" },
	{ tag: [tags.definition(tags.name), tags.separator], color: "#abb2bf" },
	{ tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: "#e5c07b" },
	{ tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: "#56b6c2" },
	{ tag: [tags.meta, tags.comment], color: "#5c6370", fontStyle: "italic" },
	{ tag: tags.string, color: "#98c379" },
	{ tag: tags.atom, color: "#d19a66" },
	{ tag: tags.invalid, color: "#f44747" },
]);

const readOnlyTheme = EditorView.theme({
	"&": {
		backgroundColor: "transparent",
		fontFamily: "var(--font-monospace), 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Source Code Pro', Consolas, 'Courier New', monospace",
		fontSize: "var(--code-space-embed-font-size, 13px) !important",
		textAlign: "left",
	},
	".cm-content": {
		padding: "8px 0",
		textAlign: "left",
	},
	".cm-focused": {
		outline: "none",
	},
	".cm-editor": {
		borderRadius: "6px",
		textAlign: "left",
	},
	".cm-scroller": {
		overflow: "auto",
		textAlign: "left",
	},
	".cm-line": {
		padding: "0 8px",
		textAlign: "left",
		lineHeight: "var(--code-space-embed-line-height, 20px) !important",
	},
	".cm-gutters": {
		backgroundColor: "transparent !important",
		color: "var(--text-muted)",
		border: "none",
		minWidth: "36px",
	},
	".cm-lineNumbers .cm-gutterElement": {
		padding: "0 8px 0 16px",
		minWidth: "20px",
		textAlign: "right",
		fontSize: "calc(var(--code-space-embed-font-size, 13px) - 1px) !important",
		color: "var(--text-muted)",
		opacity: 0.6,
		lineHeight: "var(--code-space-embed-line-height, 20px) !important",
	},
});

class CodeEmbedChild extends MarkdownRenderChild {
	private editorView: EditorView | null = null;
	private languageCompartment: Compartment;
	private themeCompartment: Compartment;
	private themeEventRef: EventRef | null = null;
	private ownerDoc: Document;

	constructor(
		containerEl: HTMLElement,
		private content: string,
		private extension: string,
		private plugin: CodeSpacePlugin,
		private startLine: number = 1
	) {
		super(containerEl);
		this.languageCompartment = new Compartment();
		this.themeCompartment = new Compartment();
		this.ownerDoc = containerEl.ownerDocument;
	}

	onload(): void {
		const isDark = this.ownerDoc.body.classList.contains("theme-dark");
		const langExt = LANGUAGE_PACKAGES[this.extension] || [];

		const state = EditorState.create({
			doc: this.content,
			extensions: [
				this.languageCompartment.of(langExt),
				this.themeCompartment.of(syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle)),
				readOnlyTheme,
				lineNumbers({ formatNumber: (n) => String(n + this.startLine - 1) }),
				EditorView.editable.of(false),
			],
		});

		this.editorView = new EditorView({
			state,
			parent: this.containerEl,
		});

		// Listen for theme changes
		this.themeEventRef = this.plugin.app.workspace.on("css-change", () => {
			const isDark = this.ownerDoc.body.classList.contains("theme-dark");
			if (this.editorView) {
				this.editorView.dispatch({
					effects: this.themeCompartment.reconfigure(syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle))
				});
			}
		});
	}

	onunload() {
		if (this.themeEventRef) {
			this.plugin.app.workspace.offref(this.themeEventRef);
			this.themeEventRef = null;
		}
		if (this.editorView) {
			this.editorView.destroy();
		}
	}
}

type PendingEmbedRequest = {
	sourcePath: string;
};

const pendingEmbedTimers = new WeakMap<HTMLElement, number>();
const pendingEmbedRequests = new WeakMap<HTMLElement, PendingEmbedRequest>();
const embedRenderTokens = new WeakMap<HTMLElement, number>();
const embedObserversByDoc = new WeakMap<Document, MutationObserver>();
const CODE_SPACE_POPOUT_STYLE_ID = "code-space-popout-styles";

function ensureCodeSpaceStylesInDocument(targetDoc: Document, plugin: CodeSpacePlugin) {
	// Some Obsidian popout windows do not automatically include plugin CSS. Copy the existing stylesheet
	// reference from the main window so the embed UI renders consistently.
	if (targetDoc.getElementById(CODE_SPACE_POPOUT_STYLE_ID)) return;

	try {
		const mainDoc = document;
		const maybeLink1 = mainDoc.querySelector('link[href*="plugins/code-space/styles.css"]');
		const maybeLink2 = mainDoc.querySelector('link[href*="/plugins/code-space/styles.css"]');
		const link =
			(maybeLink1 instanceof HTMLLinkElement ? maybeLink1 : null) ??
			(maybeLink2 instanceof HTMLLinkElement ? maybeLink2 : null);

		if (link?.href) {
			const newLink = targetDoc.createElement("link");
			newLink.id = CODE_SPACE_POPOUT_STYLE_ID;
			newLink.rel = "stylesheet";
			newLink.type = "text/css";
			newLink.href = link.href;
			targetDoc.head?.appendChild(newLink);
			return;
		}
	} catch {
		// Ignore.
	}

	// Fallback: clone the inline style tag if Obsidian injected plugin CSS as <style>.
	const styleTags = Array.from(document.querySelectorAll("style"));
	const codeSpaceStyle = styleTags.find((styleEl) => {
		const text = styleEl.textContent ?? "";
		return text.includes(".code-embed-container") || text.includes(".code-space-container");
	});

	if (codeSpaceStyle?.textContent) {
		const newStyle = targetDoc.createElement("style");
		newStyle.id = CODE_SPACE_POPOUT_STYLE_ID;
		newStyle.textContent = codeSpaceStyle.textContent;
		targetDoc.head?.appendChild(newStyle);
	}
}

function resolveSourcePathForEmbed(embedEl: HTMLElement, plugin: CodeSpacePlugin): string {
	// Use the leaf's file path (works across popout windows) instead of activeFile.
	try {
		const leaves = plugin.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const view = leaf.view as unknown as { file?: TFile; containerEl?: HTMLElement } | null;
			const containerEl = view?.containerEl;
			if (containerEl && containerEl.contains(embedEl)) {
				const filePath = view?.file?.path;
				if (filePath) return filePath;
			}
		}
	} catch {
		// Ignore and fall back.
	}

	return plugin.app.workspace.getActiveFile()?.path ?? "";
}

function installEmbedObserverForDocument(doc: Document, docWindow: Window, plugin: CodeSpacePlugin) {
	if (embedObserversByDoc.has(doc)) return;
	if (!doc.body) {
		// Popout windows may fire before body is ready; retry shortly.
		docWindow.setTimeout(() => installEmbedObserverForDocument(doc, docWindow, plugin), 80);
		return;
	}

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of Array.from(mutation.addedNodes)) {
				// Cross-window safe: use numeric constant instead of `node instanceof Element`.
				if (node.nodeType !== 1) continue;

				const elem = node as Element;
				const embeds: HTMLElement[] = [];

				if (elem.classList.contains("file-embed")) {
					embeds.push(elem as HTMLElement);
				} else {
					// Look for both div.file-embed and span.file-embed
					elem.querySelectorAll?.(".file-embed").forEach((e) => embeds.push(e as HTMLElement));
				}

				for (const embedEl of embeds) {
					const sourcePath = resolveSourcePathForEmbed(embedEl, plugin);
					// For ambiguous bare filenames, we need a real sourcePath; wait for the leaf to be ready.
					if (!sourcePath) {
						docWindow.setTimeout(() => {
							const retrySourcePath = resolveSourcePathForEmbed(embedEl, plugin);
							if (!retrySourcePath) return;
							scheduleProcessCodeEmbed(embedEl, plugin, retrySourcePath);
						}, 120);
						continue;
					}
					scheduleProcessCodeEmbed(embedEl, plugin, sourcePath);
				}
			}
		}
	});

	observer.observe(doc.body, { childList: true, subtree: true });
	embedObserversByDoc.set(doc, observer);

	// Also process any existing embeds already present in this window.
	doc.querySelectorAll(".file-embed").forEach((e) => {
		const embedEl = e as HTMLElement;
		const sourcePath = resolveSourcePathForEmbed(embedEl, plugin);
		if (!sourcePath) {
			docWindow.setTimeout(() => {
				const retrySourcePath = resolveSourcePathForEmbed(embedEl, plugin);
				if (!retrySourcePath) return;
				scheduleProcessCodeEmbed(embedEl, plugin, retrySourcePath);
			}, 120);
			return;
		}
		scheduleProcessCodeEmbed(embedEl, plugin, sourcePath);
	});
}

function scheduleProcessCodeEmbed(embedEl: HTMLElement, plugin: CodeSpacePlugin, sourcePath: string) {
	// Obsidian may update embed attributes shortly after insertion; debounce to avoid duplicate renders.
	pendingEmbedRequests.set(embedEl, { sourcePath });

	const existing = pendingEmbedTimers.get(embedEl);
	if (existing) window.clearTimeout(existing);

	const timer = window.setTimeout(() => {
		pendingEmbedTimers.delete(embedEl);
		const req = pendingEmbedRequests.get(embedEl);
		pendingEmbedRequests.delete(embedEl);

		// Token-gate async read/render so stale runs can't overwrite newer renders (prevents flicker).
		const token = (embedRenderTokens.get(embedEl) ?? 0) + 1;
		embedRenderTokens.set(embedEl, token);

		void processCodeEmbed(embedEl, plugin, req?.sourcePath ?? sourcePath, token);
	}, 40);

	pendingEmbedTimers.set(embedEl, timer);
}

export function registerCodeEmbedProcessor(plugin: CodeSpacePlugin) {
	// Install observer for the main window document to catch any embeds that the post processor misses.
	// This is necessary because registerMarkdownPostProcessor may be called before the embed element
	// is attached to the workspace leaf, causing resolveSourcePathForEmbed to fail.
	const mainWindow = window;
	const mainDoc = document;
	ensureCodeSpaceStylesInDocument(mainDoc, plugin);
	installEmbedObserverForDocument(mainDoc, mainWindow, plugin);

	// Use Obsidian's official markdown post processor so we always get a correct ctx.sourcePath.
	// This avoids races where MutationObserver runs before embed link attributes are stable.
	plugin.registerMarkdownPostProcessor((el, ctx) => {
		// Obsidian renders embedded code files as div.file-embed (edit mode) or span.file-embed (reading mode)
		// with div.file-embed-title
		const embeds = el.querySelectorAll('.file-embed');

		for (let i = 0; i < embeds.length; i++) {
			const embedEl = embeds[i] as HTMLElement;
			// Prefer ctx.sourcePath when available. When unreliable, the main window's
			// MutationObserver (installed above) will catch it after DOM stabilizes.
			const sourcePath = ctx.sourcePath;
			if (sourcePath && !sourcePath.startsWith("Untitled")) {
				scheduleProcessCodeEmbed(embedEl, plugin, sourcePath);
			}
			// If sourcePath is unreliable, rely on the main window observer to pick it up.
		}
	});

	// Re-process embeds when layout changes (includes switching between edit/reading modes).
	// Reading mode uses a different rendering engine and may not trigger post processors reliably.
	plugin.registerEvent(
		plugin.app.workspace.on("layout-change", () => {
			// Scan all markdown leaves for unprocessed embeds
			const leaves = plugin.app.workspace.getLeavesOfType("markdown");

			for (const leaf of leaves) {
				const view = leaf.view as unknown as { containerEl?: HTMLElement; file?: TFile; contentEl?: HTMLElement } | null;
				const sourcePath = view?.file?.path ?? "";

				// Try multiple container selectors for both edit and reading modes
				const possibleContainers = [
					view?.contentEl,                                    // Reading mode
					view?.containerEl?.querySelector(".markdown-preview-view"),  // Reading mode preview
					view?.containerEl?.querySelector(".markdown-source-view"),   // Edit mode source
					view?.containerEl,                                  // Fallback
				];

				for (const container of possibleContainers) {
					if (!container) continue;

					// Look for both div.file-embed (edit mode) and span.file-embed (reading mode)
					const embeds = (container as HTMLElement).querySelectorAll(".file-embed");

					for (const embed of Array.from(embeds)) {
						const embedEl = embed as HTMLElement;
						// Check if already processed
						if (embedEl.querySelector(".code-embed-container")) {
							continue;
						}

						if (sourcePath) {
							scheduleProcessCodeEmbed(embedEl, plugin, sourcePath);
						}
					}
				}
			}
		})
	);

	// Popout windows: markdown post processors are not guaranteed to be installed in new windows
	// depending on how Obsidian spins up workspace windows. Use a per-window observer to ensure embeds render.
	plugin.registerEvent(
		plugin.app.workspace.on("window-open", (win, window) => {
			try {
				const doc = win.doc ?? window.document;
				ensureCodeSpaceStylesInDocument(doc, plugin);
				installEmbedObserverForDocument(doc, window, plugin);
			} catch (e) {
				console.warn("Code Embed: Failed to install observer for popout window", e);
			}
		})
	);

	plugin.registerEvent(
		plugin.app.workspace.on("window-close", (win, window) => {
			const doc = win.doc ?? window.document;
			const observer = embedObserversByDoc.get(doc);
			if (observer) {
				observer.disconnect();
				embedObserversByDoc.delete(doc);
			}
		})
	);
}

async function processCodeEmbed(embedEl: HTMLElement, plugin: CodeSpacePlugin, sourcePath: string, renderToken: number) {
	const effectiveSourcePath = sourcePath || resolveSourcePathForEmbed(embedEl, plugin) || "";

	// If another debounced run already rendered this embed for the same file, skip.
	const lastRenderedFor = embedEl.getAttribute("data-code-space-rendered-for");

	// Get the file path from the title element or src attribute
	const titleEl = embedEl.querySelector('.file-embed-title');

	// Prefer the embed title link; avoid picking unrelated links inside embed content.
	const internalLink =
		titleEl?.querySelector<HTMLAnchorElement>("a.internal-link") ??
		embedEl.querySelector<HTMLAnchorElement>(".file-embed-title a.internal-link");

	const vaultName = typeof plugin.app.vault.getName === "function" ? plugin.app.vault.getName() : "";
	const stripVaultPrefix = (value: string) => {
		const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
		if (!vaultName) return normalized;
		if (normalized === vaultName) return "";
		if (normalized.startsWith(`${vaultName}/`)) return normalized.slice(vaultName.length + 1);
		return normalized;
	};

	const extractPathFromCandidate = (value: string | null | undefined): string => {
		if (!value) return "";
		let trimmed = value.trim();
		if (!trimmed) return "";

		// Handle Obsidian/app URLs and extract the path portion when possible.
		if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
			try {
				const url = new URL(trimmed);
				if (url.protocol === "obsidian:" || url.protocol === "app:") {
					const pathParam = url.searchParams.get("path") ?? url.searchParams.get("file");
					if (pathParam) {
						// Preserve hash fragment (line numbers) if present
						const hashPart = url.hash || "";
						return stripVaultPrefix(decodeURIComponent(pathParam)) + hashPart;
					}

					const pathFromApp = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
					if (pathFromApp && pathFromApp !== "open") {
						const hashPart = url.hash || "";
						return stripVaultPrefix(pathFromApp) + hashPart;
					}
				}

				// Ignore other URL schemes.
				return "";
			} catch {
				return "";
			}
		}

		return trimmed;
	};

	const candidates = [
		internalLink?.getAttribute("data-href"),
		titleEl?.getAttribute("data-href"),
		embedEl.getAttribute("data-href"),
		embedEl.getAttribute("data-src"),
		embedEl.getAttribute("src"),
		titleEl?.textContent,
		embedEl.getAttribute("alt"),
		internalLink?.getAttribute("href"),
	];

	let linkText = "";
	for (const candidate of candidates) {
		const path = extractPathFromCandidate(candidate);
		if (path) {
			linkText = path;
			break;
		}
	}

	// Normalize wiki-linkish strings if they leak through.
	linkText = linkText.replace(/^!?\[\[/, "").replace(/\]\]$/, "").trim();

	// Strip alias and block/heading fragments.
	const pipeIndex = linkText.indexOf("|");
	if (pipeIndex !== -1) linkText = linkText.substring(0, pipeIndex);

	const hashIndex = linkText.indexOf("#");
	const filePath = hashIndex !== -1 ? linkText.substring(0, hashIndex) : linkText;
	const hashPart = hashIndex !== -1 ? linkText.substring(hashIndex + 1) : "";
	const hadLeadingSlash = /^[\\/]/.test(filePath.trim());

	// Parse line number from hash (e.g., "#20", "#L20", "#20-40", "#L20-L40")
	let startLine = 0;
	let endLine = 0;
	if (hashPart) {
		// Try range pattern first: "20-40" or "L20-L40" or "L20-40"
		const rangeMatch = hashPart.match(/^L?(\d+)-L?(\d+)$/i);
		if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
			startLine = parseInt(rangeMatch[1], 10);
			endLine = parseInt(rangeMatch[2], 10);
			if (startLine < 1) startLine = 1;
			if (endLine < startLine) endLine = startLine;
		} else {
			// Single line pattern: "20" or "L20"
			const lineMatch = hashPart.match(/^L?(\d+)$/i);
			if (lineMatch && lineMatch[1]) {
				startLine = parseInt(lineMatch[1], 10);
				if (startLine < 1) startLine = 1;
			}
		}
	}

	// Normalize to vault-style paths.
	const normalizedFilePath = normalizePath(filePath.replace(/\\/g, "/")).trim();
	const sourceDir =
		effectiveSourcePath && effectiveSourcePath.includes("/")
			? effectiveSourcePath.substring(0, effectiveSourcePath.lastIndexOf("/"))
			: "";
	const isSourceRoot = sourceDir === "";

	if (!normalizedFilePath) return;

	// Try to find the file using multiple methods
	let tFile: TFile | null = null;

	// Explicit root path (e.g., ![[/foo.ts]]) should resolve directly.
	if (hadLeadingSlash) {
		const byPath = plugin.app.vault.getAbstractFileByPath(normalizedFilePath);
		tFile = byPath instanceof TFile ? byPath : null;
	}

	// Prefer Obsidian's own resolver for relative links (uses ctx.sourcePath rules).
	if (!tFile && effectiveSourcePath && !effectiveSourcePath.startsWith("Untitled")) {
		tFile = plugin.app.metadataCache.getFirstLinkpathDest(normalizedFilePath, effectiveSourcePath);
	}

	// Direct path fallback when the link includes folders.
	if (!tFile && normalizedFilePath.includes("/")) {
		const byPath = plugin.app.vault.getAbstractFileByPath(normalizedFilePath);
		tFile = byPath instanceof TFile ? byPath : null;
	}

	// Root-level file fallback: when the source note is in root, a bare filename should resolve to root.
	if (!tFile && !normalizedFilePath.includes("/") && isSourceRoot) {
		const byPath = plugin.app.vault.getAbstractFileByPath(normalizedFilePath);
		tFile = byPath instanceof TFile ? byPath : null;
	}

	if (!tFile) return;

	if (lastRenderedFor && lastRenderedFor === tFile.path) {
		// Already rendered for this exact file (common during fast re-renders).
		return;
	}

	// Check if it's a TFile (not a folder)
	if (!tFile.extension) {
		return;
	}

	const ext = tFile.extension.toLowerCase();
	const extensions = plugin.settings.extensions
		.split(',')
		.map((s: string) => s.trim().toLowerCase())
		.filter((s: string) => s);

	if (!extensions.includes(ext)) {
		return;
	}

	// Read file content and render
	await renderCodeEmbed(embedEl, tFile, plugin, renderToken, startLine, endLine);
	if (embedRenderTokens.get(embedEl) !== renderToken) return;
	const rangeAttr = startLine > 0 ? (endLine > 0 ? `#L${startLine}-L${endLine}` : `#L${startLine}`) : "";
	embedEl.setAttribute("data-code-space-rendered-for", tFile.path + rangeAttr);
}

async function renderCodeEmbed(embedEl: HTMLElement, tFile: TFile, plugin: CodeSpacePlugin, renderToken: number, startLine: number = 0, endLine: number = 0) {
	// Read file content
	const fullContent = await plugin.app.vault.read(tFile);
	if (embedRenderTokens.get(embedEl) !== renderToken) return;

	const ext = tFile.extension.toLowerCase();

	// 处理起始行号：截取从起始行开始的内容
	let content = fullContent;
	const fullLineCount = fullContent.split('\n').length;
	const effectiveStartLine = startLine > 0 ? Math.min(startLine, fullLineCount) : 1;
	// 如果指定了 endLine，则生效；否则为 0 表示不限制
	const effectiveEndLine = endLine > 0 ? Math.min(endLine, fullLineCount) : 0;
	// 是否使用范围模式（忽略 maxEmbedLines 限制）
	const useRangeMode = effectiveEndLine > 0 && effectiveEndLine >= effectiveStartLine;

	if (effectiveStartLine > 1 || useRangeMode) {
		const lines = fullContent.split('\n');
		const endIndex = useRangeMode ? effectiveEndLine : fullLineCount;
		content = lines.slice(effectiveStartLine - 1, endIndex).join('\n');
	}

	// 计算文件的行数
	const lineCount = content.split('\n').length;
	// 范围模式下忽略 maxEmbedLines 设置；否则使用设置值
	const maxLines = useRangeMode ? 0 : (plugin.settings.maxEmbedLines || 0);

	// Replace the embed content with our custom code embed.
	embedEl.empty();

	// Create embed container
	const embedContainer = embedEl.createDiv({
		cls: "code-embed-container",
	});

	// Prevent default single-click navigation (stop propagation to Obsidian's file-embed handler)
	embedContainer.addEventListener("click", (e) => {
		e.stopPropagation();
	});

	const header = embedContainer.createEl("div", {
		cls: "code-embed-header",
		attr: { title: t("EMBED_TOOLTIP_OPEN") },
	});

	// Allow single-click on the header to open the file
	header.addEventListener("click", (e) => {
		e.stopPropagation();
		e.preventDefault();
		void plugin.app.workspace.getLeaf(false).openFile(tFile);
	});

	header.createEl("span", { cls: "code-embed-filename", text: tFile.name });

	// Show line count badge
	if (useRangeMode) {
		// 范围模式：显示精确的行范围（如 "Lines 20-40 of 100"）
		header.createEl("span", {
			cls: "code-embed-linerange",
			text: t("EMBED_LINES_RANGE")
				.replace("{0}", String(effectiveStartLine))
				.replace("{1}", String(effectiveStartLine + lineCount - 1))
				.replace("{2}", String(fullLineCount)),
		});
	} else if (effectiveStartLine > 1) {
		// 起始行模式（显示到末尾）
		if (maxLines > 0 && lineCount > maxLines) {
			header.createEl("span", {
				cls: "code-embed-linerange",
				text: t("EMBED_LINES_RANGE_SHOWING")
					.replace("{0}", String(effectiveStartLine))
					.replace("{1}", String(effectiveStartLine + lineCount - 1))
					.replace("{2}", String(fullLineCount))
					.replace("{3}", String(maxLines)),
			});
		} else {
			header.createEl("span", {
				cls: "code-embed-linerange",
				text: t("EMBED_LINES_RANGE")
					.replace("{0}", String(effectiveStartLine))
					.replace("{1}", String(effectiveStartLine + lineCount - 1))
					.replace("{2}", String(fullLineCount)),
			});
		}
	} else if (maxLines > 0 && lineCount > maxLines) {
		header.createEl("span", {
			cls: "code-embed-linerange",
			text: t("EMBED_LINES_SHOWING")
				.replace("{0}", String(maxLines))
				.replace("{1}", String(lineCount)),
		});
	} else {
		header.createEl("span", {
			cls: "code-embed-linerange",
			text: t("EMBED_LINES_TOTAL").replace("{0}", String(lineCount)),
		});
	}

	const editorContainer = embedContainer.createEl("div", {
		cls: "code-embed-editor",
	});

	// 根据行数和设置动态设置高度
	if (maxLines > 0 && lineCount > maxLines) {
		// Use CSS calc() with the CSS variable to ensure the container height
		// updates reactively when the user changes font size/line height settings.
		// Fallback to 20px if variable is missing.
		// +6px buffer for top/bottom padding.
		editorContainer.style.maxHeight = `calc(var(--code-space-embed-line-height, 20px) * ${maxLines} + 6px)`;
		editorContainer.classList.add("code-embed-scrollable");
	}

	// Always render both CodeMirror (for interactive viewing) and static fallback (for PDF/print)
	// The static version is hidden by default via CSS and only shown in print context
	const staticContainer = embedContainer.createEl("div", {
		cls: "code-embed-static-fallback",
	});
	const pre = staticContainer.createEl("pre", { cls: "code-embed-static" });
	const code = pre.createEl("code", { cls: `language-${ext}` });
	code.textContent = content;

	// Create the code editor (interactive version)
	const child = new CodeEmbedChild(editorContainer, content, ext, plugin, effectiveStartLine);

	// Manually call onload since addChild is not available here
	child.onload();
}
