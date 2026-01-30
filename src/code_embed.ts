import { MarkdownRenderChild, TFile, EventRef } from "obsidian";
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

	constructor(
		containerEl: HTMLElement,
		private content: string,
		private extension: string,
		private plugin: CodeSpacePlugin
	) {
		super(containerEl);
		this.languageCompartment = new Compartment();
		this.themeCompartment = new Compartment();
	}

	onload(): void {
		const isDark = document.body.classList.contains("theme-dark");
		const langExt = LANGUAGE_PACKAGES[this.extension] || [];

		console.debug("Code Embed: CodeEmbedChild.onload - extension:", this.extension);

		const state = EditorState.create({
			doc: this.content,
			extensions: [
				this.languageCompartment.of(langExt),
				this.themeCompartment.of(syntaxHighlighting(isDark ? darkHighlightStyle : lightHighlightStyle)),
				readOnlyTheme,
				lineNumbers(),
				EditorView.editable.of(false),
			],
		});

		this.editorView = new EditorView({
			state,
			parent: this.containerEl,
		});

		// Listen for theme changes
		this.themeEventRef = this.plugin.app.workspace.on("css-change", () => {
			const isDark = document.body.classList.contains("theme-dark");
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

export function registerCodeEmbedProcessor(plugin: CodeSpacePlugin) {
	console.debug("Code Embed: Registering code embed processor...");

	// Approach: Use MutationObserver to watch for file-embed elements
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const elem = node as Element;

					// Check if this is a file-embed or contains one
					if (elem.classList.contains('file-embed') || elem.querySelector('.file-embed')) {
						console.debug("Code Embed: Found file-embed via MutationObserver!", elem);

						const embedEl = elem.classList.contains('file-embed') ? elem : elem.querySelector('.file-embed');

						if (embedEl) {
							// Get source path from the active file
							let sourcePath = "";
							const activeFile = plugin.app.workspace.getActiveFile();
							if (activeFile?.path) {
								sourcePath = activeFile.path;
							}

							console.debug("Code Embed: Using sourcePath:", sourcePath);
							void processCodeEmbed(embedEl as HTMLElement, plugin, sourcePath);
						}
					}
				}
			});
		});
	});

	// Start observing the document
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	console.debug("Code Embed: MutationObserver started");

	// Also register the markdown post processor as a backup
	plugin.registerMarkdownPostProcessor(async (el, ctx) => {
		console.debug("Code Embed: Post processor called!", "element:", el);

		// Obsidian renders embedded code files as div.file-embed with div.file-embed-title
		const embeds = el.querySelectorAll('div.file-embed');

		console.debug("Code Embed: Processing element", el.className, "found", embeds.length, "file-embed elements");

		for (let i = 0; i < embeds.length; i++) {
			const embedEl = embeds[i] as HTMLElement;
			await processCodeEmbed(embedEl, plugin, ctx.sourcePath);
		}
	});
}

async function processCodeEmbed(embedEl: HTMLElement, plugin: CodeSpacePlugin, sourcePath: string) {
	// Get the file path from the title element or src attribute
	const titleEl = embedEl.querySelector('.file-embed-title');

	// Try multiple sources for the file path
	let linkText = titleEl?.getAttribute('data-href') ||
	                titleEl?.textContent ||
	                embedEl.getAttribute('src') ||
	                embedEl.getAttribute('alt') ||
	                "";

	linkText = linkText.trim();

	console.debug("Code Embed: Processing file-embed", linkText, "title:", titleEl?.textContent, "sourcePath:", sourcePath);

	if (!linkText) return;

	// Remove any line range syntax if present (Obsidian doesn't support it for code files)
	const hashIndex = linkText.indexOf("#");
	const filePath = hashIndex !== -1 ? linkText.substring(0, hashIndex) : linkText;

	// Try to find the file using multiple methods
	let tFile: TFile | null = null;

	// Method 1: Use sourcePath if it's a valid file in the vault
	if (sourcePath && !sourcePath.startsWith("Untitled")) {
		tFile = plugin.app.metadataCache.getFirstLinkpathDest(filePath, sourcePath);
		console.debug("Code Embed: Tried with sourcePath:", sourcePath, "result:", tFile?.path);
	}

	// Method 2: Try without sourcePath (for absolute paths or files in root)
	if (!tFile) {
		tFile = plugin.app.metadataCache.getFirstLinkpathDest(filePath, "");
		console.debug("Code Embed: Tried without sourcePath, result:", tFile?.path);
	}

	// Method 3: Try to get file directly by path
	if (!tFile) {
		const abstractFile = plugin.app.vault.getAbstractFileByPath(filePath);
		tFile = abstractFile instanceof TFile ? abstractFile : null;
		console.debug("Code Embed: Tried direct path, result:", tFile?.path);
	}

	// Method 4: Search all files with matching name
	if (!tFile) {
		const allFiles = plugin.app.vault.getFiles();
		tFile = allFiles.find(f => f.name === filePath || f.path === filePath) ?? null;
		console.debug("Code Embed: Tried file search, result:", tFile?.path);
	}

	if (!tFile) {
		console.debug("Code Embed: File not found", filePath, "tried all methods");
		return;
	}

	// Check if it's a TFile (not a folder)
	if (!tFile.extension) {
		console.debug("Code Embed: Not a file", tFile.path);
		return;
	}

	console.debug("Code Embed: File found", tFile.path, "extension:", tFile.extension);

	const ext = tFile.extension.toLowerCase();
	const extensions = plugin.settings.extensions
		.split(',')
		.map((s: string) => s.trim().toLowerCase())
		.filter((s: string) => s);

	console.debug("Code Embed: Checking extension", ext, "against", extensions);

	if (!extensions.includes(ext)) {
		console.debug("Code Embed: Extension not supported", ext);
		return;
	}

	console.debug("Code Embed: Reading file content...");

	// Read file content and render
	await renderCodeEmbed(embedEl, tFile, plugin);
}

async function renderCodeEmbed(embedEl: HTMLElement, tFile: TFile, plugin: CodeSpacePlugin) {
	console.debug("Code Embed: Reading file content...");

	// Read file content
	const content = await plugin.app.vault.read(tFile);
	const ext = tFile.extension.toLowerCase();

	// 计算文件的行数
	const lineCount = content.split('\n').length;
	const maxLines = plugin.settings.maxEmbedLines || 0;

	console.debug("Code Embed: Content loaded, length:", content.length, "lines:", lineCount, "maxLines:", maxLines);

	// Replace the embed content with our custom code embed
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
		attr: { "title": t('EMBED_TOOLTIP_OPEN') }
	});

	// Allow single-click on the header to open the file
	header.addEventListener("click", (e) => {
		e.stopPropagation();
		e.preventDefault();
		void plugin.app.workspace.getLeaf(false).openFile(tFile);
	});
	header.createEl("span", { cls: "code-embed-filename", text: tFile.name });

	// 如果有行数限制，显示行数信息
	if (maxLines > 0 && lineCount > maxLines) {
		header.createEl("span", {
			cls: "code-embed-linerange",
			text: t('EMBED_LINES_SHOWING')
				.replace('{0}', String(maxLines))
				.replace('{1}', String(lineCount))
		});
	} else {
		header.createEl("span", {
			cls: "code-embed-linerange",
			text: t('EMBED_LINES_TOTAL').replace('{0}', String(lineCount))
		});
	}

	const editorContainer = embedContainer.createEl("div", {
		cls: "code-embed-editor"
	});

	// 根据行数和设置动态设置高度
	if (maxLines > 0 && lineCount > maxLines) {
		// Use CSS calc() with the CSS variable to ensure the container height
		// updates reactively when the user changes font size/line height settings.
		// Fallback to 20px if variable is missing.
		// +6px buffer for top/bottom padding.
		editorContainer.style.maxHeight = `calc(var(--code-space-embed-line-height, 20px) * ${maxLines} + 6px)`;
		editorContainer.classList.add("code-embed-scrollable");
		
		console.debug("Code Embed: Setting dynamic max height for", maxLines, "lines");
	}

	// Create the code editor
	const child = new CodeEmbedChild(editorContainer, content, ext, plugin);

	// Manually call onload since addChild is not available here
	child.onload();
}
