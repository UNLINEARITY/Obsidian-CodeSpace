import { TextFileView, WorkspaceLeaf, TFile, Notice, App, setIcon, Platform } from "obsidian";
import { EditorView, keymap, highlightSpecialChars, drawSelection, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment, Extension, Prec, Transaction } from "@codemirror/state";
import { syntaxHighlighting, bracketMatching, foldGutter, indentOnInput, HighlightStyle, indentUnit, StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { cmake } from "@codemirror/legacy-modes/mode/cmake";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets } from "@codemirror/autocomplete";
import { SearchQuery, highlightSelectionMatches } from "@codemirror/search";
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
import { r } from "codemirror-lang-r";
import { tags } from "@lezer/highlight";
import CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";

export const VIEW_TYPE_CODE_SPACE = "code-space-view";

// 创建搜索高亮装饰的样式


// 自定义搜索面板类 - VS Code 风格
class CustomSearchPanel {
	panelEl: HTMLElement;
	private searchInput: HTMLInputElement;
	private replaceInput: HTMLInputElement;
	private caseSensitiveBtn: HTMLElement;
	private regexpBtn: HTMLElement;
	private wholeWordBtn: HTMLElement;
	private prevBtn: HTMLElement;
	private nextBtn: HTMLElement;
	private replaceBtn: HTMLElement;
	private replaceAllBtn: HTMLElement;
	private closeBtn: HTMLElement;

	constructor(
		private view: EditorView,
		private container: HTMLElement
	) {
		// 创建面板元素（不自动添加到 DOM）
		this.panelEl = document.createElement('div');
		this.panelEl.addClass('custom-search-panel');
		this.panelEl.addClass('is-hidden');

		// 构建面板内容
		this.buildPanelContent();

		// 将搜索面板插入到容器的最前面（显示在顶部）
		this.container.prepend(this.panelEl);
		this.setupEventListeners();
	}

	private buildPanelContent(): void {
		// 搜索行
		const searchRow = this.panelEl.createDiv({ cls: "custom-search-row" });

		// 搜索图标
		const searchIcon = searchRow.createDiv({ cls: "custom-search-icon" });
		setIcon(searchIcon, "search");

		// 搜索输入框
		this.searchInput = searchRow.createEl("input", {
			cls: "custom-search-input",
			type: "text",
			attr: { placeholder: t('SEARCH_PLACEHOLDER') }
		});

		// 选项按钮组
		const optionsGroup = searchRow.createDiv({ cls: "custom-search-options" });

		this.caseSensitiveBtn = this.createOptionButton(optionsGroup, "case-sensitive", t('SEARCH_BTN_CASE'));
		this.regexpBtn = this.createOptionButton(optionsGroup, "regex", t('SEARCH_BTN_REGEX'));
		this.wholeWordBtn = this.createOptionButton(optionsGroup, "hashtag", t('SEARCH_BTN_WHOLE'));

		// 导航按钮
		const navGroup = searchRow.createDiv({ cls: "custom-search-nav" });
		this.prevBtn = this.createNavButton(navGroup, "arrow-left", t('SEARCH_BTN_PREV'));
		this.nextBtn = this.createNavButton(navGroup, "arrow-right", t('SEARCH_BTN_NEXT'));

		// 关闭按钮
		this.closeBtn = this.createIconButton(searchRow, "x", t('SEARCH_BTN_CLOSE'));

		// 替换行
		const replaceRow = this.panelEl.createDiv({ cls: "custom-search-row custom-search-replace-row" });

		// 替换图标
		const replaceIcon = replaceRow.createDiv({ cls: "custom-search-icon" });
		setIcon(replaceIcon, "repeat");

		// 替换输入框
		this.replaceInput = replaceRow.createEl("input", {
			cls: "custom-search-input",
			type: "text",
			attr: { placeholder: t('SEARCH_REPLACE_PLACEHOLDER') }
		});

		// 替换按钮组
		const replaceBtnGroup = replaceRow.createDiv({ cls: "custom-search-replace-btns" });
		this.replaceBtn = this.createReplaceButton(replaceBtnGroup, t('SEARCH_BTN_REPLACE'), false);
		this.replaceAllBtn = this.createReplaceButton(replaceBtnGroup, t('SEARCH_BTN_REPLACE_ALL'), true);
	}

	private createPanel(): HTMLElement {
		// 这个方法不再使用，保留以避免编译错误
		return this.panelEl;
	}

	private createOptionButton(parent: HTMLElement, icon: string, tooltip: string): HTMLElement {
		const btn = parent.createDiv({ cls: "custom-search-option-btn" });
		setIcon(btn, icon);
		btn.setAttribute("aria-label", tooltip);
		btn.setAttribute("data-tooltip", tooltip);
		return btn;
	}

	private createNavButton(parent: HTMLElement, icon: string, tooltip: string): HTMLElement {
		const btn = parent.createDiv({ cls: "custom-search-nav-btn" });
		setIcon(btn, icon);
		btn.setAttribute("aria-label", tooltip);
		return btn;
	}

	private createIconButton(parent: HTMLElement, icon: string, tooltip: string): HTMLElement {
		const btn = parent.createDiv({ cls: "custom-search-icon-btn" });
		setIcon(btn, icon);
		btn.setAttribute("aria-label", tooltip);
		return btn;
	}

	private createReplaceButton(parent: HTMLElement, text: string, isAll: boolean): HTMLElement {
		const btn = parent.createEl("button", { cls: "custom-search-replace-btn", text });
		if (isAll) btn.addClass("mod-all");
		return btn;
	}

	private setupEventListeners() {
		// 关闭面板
		this.closeBtn.addEventListener("click", () => this.close());

		// 搜索输入变化时执行搜索
		let searchTimeout: ReturnType<typeof setTimeout>;
		this.searchInput.addEventListener("input", () => {
			clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => this.doSearch(), 150);
		});

		// 回车键导航
		this.searchInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				if (e.shiftKey) {
					this.findPrevious();
				} else {
					this.findNext();
				}
			}
		});

		// 替换输入回车
		this.replaceInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				if (e.shiftKey) {
					this.replace();
				} else {
					this.findNext();
				}
			}
		});

		// 选项按钮
		this.caseSensitiveBtn.addEventListener("click", () => {
			this.caseSensitiveBtn.toggleClass("active", !this.caseSensitiveBtn.hasClass("active"));
			this.doSearch();
		});

		this.regexpBtn.addEventListener("click", () => {
			this.regexpBtn.toggleClass("active", !this.regexpBtn.hasClass("active"));
			this.doSearch();
		});

		this.wholeWordBtn.addEventListener("click", () => {
			this.wholeWordBtn.toggleClass("active", !this.wholeWordBtn.hasClass("active"));
			this.doSearch();
		});

		// 导航按钮
		this.prevBtn.addEventListener("click", () => this.findPrevious());
		this.nextBtn.addEventListener("click", () => this.findNext());

		// 替换按钮
		this.replaceBtn.addEventListener("click", () => this.replace());
		this.replaceAllBtn.addEventListener("click", () => this.replaceAll());
	}

	private getQuery(): SearchQuery {
		return new SearchQuery({
			search: this.searchInput.value,
			caseSensitive: this.caseSensitiveBtn.hasClass("active"),
			regexp: this.regexpBtn.hasClass("active"),
			wholeWord: this.wholeWordBtn.hasClass("active"),
			replace: this.replaceInput.value
		});
	}

	private doSearch() {
		const query = this.getQuery();

		if (!query.search) {
			// 清空搜索时，清除选中状态
			const { from, to } = this.view.state.selection.main;
			if (from !== to) {
				this.view.dispatch({
					selection: { anchor: from, head: from }
				});
			}
			return;
		}

		// 执行搜索 - 从当前位置开始查找第一个匹配
		this.findNext();
	}

	private findNext() {
		const query = this.getQuery();
		if (!query.search) return;

		const { to } = this.view.state.selection.main;
		const searchString = this.view.state.doc.toString();

		try {
			let searchPos = to;
			let match: { from: number; to: number } | null = null;

			// 创建正则表达式用于搜索
			let regex: RegExp;
			const flags = query.caseSensitive ? "g" : "gi";
			const pattern = query.regexp ? query.search : this.escapeRegex(query.search);

			if (query.wholeWord) {
				regex = new RegExp(`\\b${pattern}\\b`, flags);
			} else {
				regex = new RegExp(pattern, flags);
			}

			// 从当前位置开始查找
			regex.lastIndex = searchPos;
			let execResult = regex.exec(searchString);

			if (execResult) {
				match = { from: execResult.index, to: execResult.index + execResult[0].length };
			} else {
				// 如果没找到，从头开始搜索
				regex.lastIndex = 0;
				execResult = regex.exec(searchString);
				if (execResult) {
					match = { from: execResult.index, to: execResult.index + execResult[0].length };
				}
			}

			if (match) {
				this.view.dispatch({
					selection: { anchor: match.from, head: match.to },
					effects: [EditorView.scrollIntoView(match.from, { x: "nearest", y: "center" })]
				});
			}
		} catch (error) {
			console.error("Search error:", error);
		}
	}

	private findPrevious() {
		const query = this.getQuery();
		if (!query.search) return;

		const { from } = this.view.state.selection.main;
		const searchString = this.view.state.doc.toString();

		try {
			let searchPos = from;

			// 创建正则表达式用于搜索
			let regex: RegExp;
			const flags = query.caseSensitive ? "g" : "gi";
			const pattern = query.regexp ? query.search : this.escapeRegex(query.search);

			if (query.wholeWord) {
				regex = new RegExp(`\\b${pattern}\\b`, flags);
			} else {
				regex = new RegExp(pattern, flags);
			}

			// 从当前位置向后查找
			let lastMatch: { from: number; to: number } | null = null;
			let execResult: RegExpExecArray | null;

			while ((execResult = regex.exec(searchString)) !== null) {
				if (execResult.index < searchPos) {
					lastMatch = { from: execResult.index, to: execResult.index + execResult[0].length };
				} else {
					break;
				}
			}

			if (lastMatch) {
				this.view.dispatch({
					selection: { anchor: lastMatch.from, head: lastMatch.to },
					effects: [EditorView.scrollIntoView(lastMatch.from, { x: "nearest", y: "center" })]
				});
			} else {
				// 循环搜索：如果前面没有匹配项，找到文档中的最后一个匹配项
				regex.lastIndex = 0;
				let finalMatch: { from: number; to: number } | null = null;
				while ((execResult = regex.exec(searchString)) !== null) {
					finalMatch = { from: execResult.index, to: execResult.index + execResult[0].length };
				}

				if (finalMatch) {
					this.view.dispatch({
						selection: { anchor: finalMatch.from, head: finalMatch.to },
						effects: [EditorView.scrollIntoView(finalMatch.from, { x: "nearest", y: "center" })]
					});
				}
			}
		} catch (error) {
			console.error("Search error:", error);
		}
	}

	private escapeRegex(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private replace() {
		const query = this.getQuery();
		// Allow empty replacement (delete match) by only requiring a search term.
		if (!query.search) return;

		const { from, to } = this.view.state.selection.main;
		const currentText = this.view.state.sliceDoc(from, to);

		// 检查当前选中的文本是否匹配搜索词
		const isMatch = query.caseSensitive ?
			currentText === query.search :
			currentText.toLowerCase() === query.search.toLowerCase();

		if (isMatch) {
			this.view.dispatch({
				changes: { from, to, insert: query.replace },
				selection: { anchor: from, head: from + query.replace.length }
			});
			this.findNext();
		} else {
			// 如果当前选中的不匹配，先查找下一个匹配项
			this.findNext();
		}
	}

	private replaceAll() {
		const query = this.getQuery();
		// Allow empty replacement (delete matches) by only requiring a search term.
		if (!query.search) return;

		const searchString = this.view.state.doc.toString();
		const changes: { from: number; to: number; insert: string }[] = [];

		try {
			let regex: RegExp;
			const flags = query.caseSensitive ? "g" : "gi";
			const pattern = query.regexp ? query.search : this.escapeRegex(query.search);

			if (query.wholeWord) {
				regex = new RegExp(`\\b${pattern}\\b`, flags);
			} else {
				regex = new RegExp(pattern, flags);
			}

			// 查找所有匹配
			let execResult: RegExpExecArray | null;

			while ((execResult = regex.exec(searchString)) !== null) {
				changes.push({
					from: execResult.index,
					to: execResult.index + execResult[0].length,
					insert: query.replace
				});
			}

			if (changes.length > 0) {
				this.view.dispatch({ changes });
			}
		} catch (error) {
			console.error("Replace all error:", error);
		}
	}

	open() {
		this.panelEl.removeClass("is-hidden");
		this.searchInput.focus();
	}

	focusReplace() {
		this.open();
		this.replaceInput.focus();
	}

	close() {
		this.panelEl.addClass("is-hidden");
	}

	toggle() {
		if (this.panelEl.hasClass("is-hidden")) {
			this.open();
		} else {
			this.close();
		}
	}

	isOpen(): boolean {
		return !this.panelEl.hasClass("is-hidden");
	}

	setSearchValue(value: string, selectValue: boolean = true) {
		this.searchInput.value = value;
		if (selectValue) {
			this.searchInput.select();
		}
	}

	destroy() {
		this.panelEl.remove();
	}
}


// Language package mapping to ensure proper bundling
const LANGUAGE_PACKAGES: Record<string, Extension> = {
	// Python
	'py': python(),
	// C/C++
	'c': cpp(),
	'cpp': cpp(),
	'h': cpp(),
	'hpp': cpp(),
	'cc': cpp(),
	'cxx': cpp(),
	// JavaScript/TypeScript/JSON
	'js': javascript({ jsx: true }),
	'ts': javascript({ jsx: true }),
	'jsx': javascript({ jsx: true }),
	'tsx': javascript({ jsx: true }),
	'json': javascript({ jsx: true }),
	'mjs': javascript({ jsx: true }),
	'cjs': javascript({ jsx: true }),
	// HTML
	'html': html(),
	'htm': html(),
	'xhtml': html(),
	// CSS
	'css': css(),
	'scss': css(),
	'sass': css(),
	'less': css(),
	// SQL
	'sql': sql(),
	// PHP
	'php': php(),
	// Rust
	'rs': rust(),
	// Java / C#
	'java': java(),
	'cs': java(),
	// Go
	'go': go(),
	// YAML
	'yaml': yaml(),
	'yml': yaml(),
	// XML
	'xml': xml(),
	// R
	'r': r(),
	// XML-based formats (reuse xml highlighter, not in default extensions)
	'urdf': xml(),   // ROS URDF robot description
	'xacro': xml(),  // ROS Xacro macro
	'svg': xml(),    // Scalable Vector Graphics
	'xsd': xml(),    // XML Schema Definition
	'xsl': xml(),    // XML Stylesheet
	'xslt': xml(),   // XSL Transformations
	'wsdl': xml(),   // Web Services Description
	'plist': xml(),  // Property List (macOS/iOS)
	'csproj': xml(), // C# Project file
	'vcxproj': xml(),// Visual C++ Project
	'props': xml(),  // MSBuild properties
	'targets': xml(),// MSBuild targets
	'config': xml(), // Generic config
	// C/C++ family (reuse cpp highlighter)
	'ino': cpp(),    // Arduino sketches
	'pde': cpp(),    // Processing sketches
	'nut': cpp(),    // Squirrel scripting
	'cu': cpp(),     // CUDA source
	'cuh': cpp(),    // CUDA header
	'glsl': cpp(),   // OpenGL Shading Language
	'vert': cpp(),   // Vertex shader
	'frag': cpp(),   // Fragment shader
	'hlsl': cpp(),   // High Level Shading Language
	'mm': cpp(),     // Objective-C++
	'swift': cpp(),  // Swift (C-like syntax)
	// Java family (reuse java highlighter)
	'kt': java(),    // Kotlin
	'kts': java(),   // Kotlin script
	'scala': java(), // Scala
	'groovy': java(),// Groovy
	'gradle': java(),// Gradle build script
	// JavaScript/TypeScript family (reuse javascript highlighter)
	'json5': javascript(),  // JSON5
	'jsonc': javascript(),  // JSON with comments
	'vue': javascript(),    // Vue single file component
	'svelte': javascript(), // Svelte component
	'astro': javascript(),  // Astro framework
	// Python family (reuse python highlighter)
	'pyx': python(),  // Cython
	'pxd': python(),  // Cython declaration
	'pxi': python(),  // Cython include
	'ipy': python(),  // IPython script
	// Config/Data formats (reuse yaml highlighter)
	'toml': yaml(),   // TOML config
	'ini': yaml(),    // INI config
	'cfg': yaml(),    // Generic config
	'conf': yaml(),   // Generic config
	// Shell scripts (using legacy-modes StreamLanguage)
	'sh': StreamLanguage.define(shell),
	'bash': StreamLanguage.define(shell),
	'zsh': StreamLanguage.define(shell),
	'ps1': StreamLanguage.define(powerShell),
	'psm1': StreamLanguage.define(powerShell),
	'psd1': StreamLanguage.define(powerShell),
	// Build systems (using legacy-modes)
	'cmake': StreamLanguage.define(cmake),
	'dockerfile': StreamLanguage.define(dockerFile),
	// Other languages (using legacy-modes)
	'diff': StreamLanguage.define(diff),
	'patch': StreamLanguage.define(diff),
	'lua': StreamLanguage.define(lua),
	'pl': StreamLanguage.define(perl),
	'pm': StreamLanguage.define(perl),
	'rb': StreamLanguage.define(ruby),
	'erb': StreamLanguage.define(ruby),
	// Plain text (no highlighting)
	'md': [],
	'txt': [],
};

// 1. 定义亮色模式高亮 (VS Code Light 风格)
const myLightHighlightStyle = HighlightStyle.define([
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

// 2. 定义暗色模式高亮 (One Dark 风格)
const myDarkHighlightStyle = HighlightStyle.define([
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

// 3. 定义基础界面主题
const baseTheme = EditorView.theme({
	"&": {
		height: "100%",
		backgroundColor: "transparent !important",
		color: "var(--text-normal)",
		fontFamily: "var(--font-monospace)"
	},
	".cm-content": {
		caretColor: "var(--text-accent) !important",
		padding: "10px 0"
	},
	// 搜索选中文本的淡红色高亮 - 最高优先级
	"&.cm-focused .cm-selectionBackground": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	".cm-selectionBackground": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	".cm-content ::selection": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	"&.cm-focused .cm-content ::selection": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	"::selection": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	"::moz-selection": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	".cm-line::selection": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	".cm-gutters": {
		backgroundColor: "var(--background-primary) !important",
		color: "var(--text-muted)",
		borderRight: "1px solid var(--background-modifier-border)",
		minWidth: "32px",
		zIndex: "10"
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--background-modifier-active-hover)"
	},
	".cm-activeLine": {
		backgroundColor: "var(--background-modifier-active-hover)"
	},
	".cm-gutterElement": {
		padding: "0 8px !important",
		backgroundColor: "var(--background-primary) !important",
	},
	// 确保活动行内的选区也是淡红色
	".cm-activeLine .cm-selectionBackground": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	".cm-activeLine::selection": {
		backgroundColor: "#FF5555 !important",
		color: "#FFFFFF !important"
	},
	// 搜索面板样式 - Obsidian 原生风格
	".cm-panel.cm-search": {
		backgroundColor: "var(--background-secondary)",
		borderTop: "1px solid var(--background-modifier-border)",
		padding: "8px 12px",
		fontFamily: "var(--font-interface)"
	},
	".cm-search": {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		flexWrap: "wrap"
	},
	// 搜索输入框
	".cm-searchQuery, .cm-replaceQuery": {
		flex: "1",
		minWidth: "120px",
		height: "30px",
		padding: "0 8px",
		backgroundColor: "var(--background-modifier-form-field)",
		border: "1px solid var(--background-modifier-border)",
		borderRadius: "5px",
		color: "var(--text-normal)",
		fontSize: "13px",
		lineHeight: "30px",
		transition: "border-color 140ms ease, box-shadow 140ms ease"
	},
	".cm-searchQuery:hover, .cm-replaceQuery:hover": {
		borderColor: "var(--background-modifier-border-hover)"
	},
	".cm-searchQuery:focus, .cm-replaceQuery:focus": {
		outline: "none",
		borderColor: "var(--interactive-accent)",
		borderWidth: "2px",
		boxShadow: "0 0 0 2px hsla(var(--interactive-accent-hsl), 0.15)"
	},
	// 搜索按钮
	".cm-search button": {
		minWidth: "30px",
		height: "30px",
		padding: "0 8px",
		backgroundColor: "var(--interactive-normal)",
		border: "1px solid var(--background-modifier-border)",
		borderRadius: "5px",
		color: "var(--text-normal)",
		fontSize: "13px",
		fontWeight: "400",
		cursor: "pointer",
		transition: "background-color 140ms ease, border-color 140ms ease",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		whiteSpace: "nowrap"
	},
	".cm-search button:hover": {
		backgroundColor: "var(--interactive-hover)",
		borderColor: "var(--background-modifier-border-hover)"
	},
	".cm-search button:active": {
		transform: "translateY(1px)"
	},
	".cm-search button.cm-search-button-active": {
		backgroundColor: "var(--interactive-accent)",
		borderColor: "var(--interactive-accent)",
		color: "var(--text-on-accent)"
	},
	".cm-search button[disabled]": {
		opacity: "0.4",
		cursor: "not-allowed",
		pointerEvents: "none"
	},
	// 搜索匹配高亮 - 金黄色 (普通匹配)
	".cm-searchMatch": {
		backgroundColor: "#FFD700 !important",
		borderRadius: "2px",
		outline: "2px solid #FFD700",
		color: "#000000 !important"
	},
	// 当前选中的搜索匹配 - 淡红色 (当前焦点)
	".cm-searchMatch-selected": {
		backgroundColor: "#FF5555 !important",
		borderRadius: "2px",
		outline: "3px solid #FF5555",
		boxShadow: "0 0 8px rgba(255, 85, 85, 0.8)",
		color: "#FFFFFF !important"
	},
	// 其他相同的词 - 金黄色
	".cm-selectionMatch": {
		backgroundColor: "rgba(255, 215, 0, 0.6) !important",
		color: "#000000 !important",
		borderRadius: "2px"
	}
});

export class CodeSpaceView extends TextFileView {
	editorView: EditorView;
	themeCompartment: Compartment;
	lineNumbersCompartment: Compartment;
	languageCompartment: Compartment;
	fontSizeCompartment: Compartment; // 新增：管理字体大小
	fontSize: number = 15; // 默认字体大小（px）
	private isDirty: boolean = false; // 新增：跟踪是否有未保存的修改
	private isSettingData: boolean = false; // 新增：标记是否正在设置数据
	private searchPanel?: CustomSearchPanel; // 自定义搜索面板
	private rootEl?: HTMLElement;
	private cleanupMobileViewportFix?: () => void;

	// 必需方法：告诉 Obsidian 这个视图可以接受哪些扩展名
	static canAcceptExtension(extension: string): boolean {
		const ext = extension.toLowerCase();

		// 检查用户是否在管理列表中添加了这个扩展名
		type WindowWithApp = Window & { app?: { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } } };
		const app = (window as unknown as WindowWithApp).app;
		const plugin = app?.plugins?.getPlugin("code-space");
		if (plugin && plugin.settings) {
			const extensions = plugin.settings.extensions
				.split(',')
				.map((s: string) => s.trim().toLowerCase())
				.filter((s: string) => s);
			return extensions.includes(ext);
		}

		// 默认支持常见的代码文件扩展名
		return ['py', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'sql', 'php', 'r'].includes(ext);
	}

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.themeCompartment = new Compartment();
		this.lineNumbersCompartment = new Compartment();
		this.languageCompartment = new Compartment();
		this.fontSizeCompartment = new Compartment();
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_SPACE;
	}

	getDisplayText(): string {
		return this.file ? this.file.name : t('VIEW_DEFAULT_TITLE');
	}

	// 重写 canSave，只有真正有未保存修改时才返回 true
	canSave(): boolean {
		return this.isDirty;
	}

	// 重写 getViewData，确保返回最新的内容

	getPlugin(): CodeSpacePlugin {
		// Access internal Obsidian API with type assertion
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin } };
		return (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
	}

	getLanguageExtension() {
		const ext = this.file?.extension.toLowerCase();
		if (!ext) return [];

		// Return the language extension from the mapping
		return LANGUAGE_PACKAGES[ext] || [];
	}

	getThemeExtension() {
		const isDark = document.body.classList.contains("theme-dark");
		return syntaxHighlighting(isDark ? myDarkHighlightStyle : myLightHighlightStyle);
	}

	getLineNumbersExtension(): Extension {
		const plugin = this.getPlugin();
		if (plugin && plugin.settings && plugin.settings.showLineNumbers) {
			return [lineNumbers(), highlightActiveLineGutter()];
		}
		return [];
	}

	getFontSizeExtension(): Extension {
		// 使用 EditorView.theme 统一设置所有元素的字体大小和行高
		const lineHeight = 1.5;
		return EditorView.theme({
			"&": {
				fontSize: `${this.fontSize}px`
			},
			".cm-content": {
				fontSize: `${this.fontSize}px`,
				lineHeight: `${lineHeight}`
			},
			".cm-gutters": {
				fontSize: `${this.fontSize}px`
			},
			".cm-line": {
				fontSize: `${this.fontSize}px`,
				lineHeight: `${lineHeight}`
			}
		});
	}

	// 供外部调用的刷新方法
	refreshSettings() {
		const plugin = this.getPlugin();
		if (plugin && plugin.settings) {
			this.fontSize = plugin.settings.editorFontSize || 16;
		}
		this.editorView.dispatch({
			effects: [
				this.lineNumbersCompartment.reconfigure(this.getLineNumbersExtension()),
				this.fontSizeCompartment.reconfigure(this.getFontSizeExtension())
			]
		});
	}

	// 切换搜索面板（供命令调用）
	toggleSearchPanel() {
		if (this.searchPanel) {
			this.searchPanel.toggle();
		}
	}

	private getSelectedTextForSearch(): string | null {
		if (!this.editorView) return null;

		const sel = this.editorView.state.selection.main;
		if (sel.empty) return null;

		const text = this.editorView.state.sliceDoc(sel.from, sel.to);
		// Avoid huge selections being dumped into the search box.
		if (text.length > 500) return null;
		return text;
	}

	private openSearchFromHotkey(mode: "find" | "replace") {
		if (!this.searchPanel) return;

		const isOpen = this.searchPanel.isOpen();
		const activeEl = document.activeElement;
		const focusInPanel = activeEl instanceof HTMLElement && this.searchPanel.panelEl.contains(activeEl);

		// Ctrl/Cmd+F acts like a toggle: if focus is already in the panel, close it.
		if (mode === "find" && isOpen && focusInPanel) {
			this.searchPanel.close();
			return;
		}

		const selected = this.getSelectedTextForSearch();

		if (mode === "replace") {
			this.searchPanel.focusReplace();
			if (selected) {
				// Do not steal focus from the replace input.
				this.searchPanel.setSearchValue(selected, false);
			}
			return;
		}

		// Find
		this.searchPanel.open();
		if (selected) {
			this.searchPanel.setSearchValue(selected, true);
		}
	}

	private setupMobileViewportFix(root: HTMLElement) {
		if (!Platform.isMobileApp) return;
		const vv = window.visualViewport;
		if (!vv) return;

		const apply = () => {
			// Use the visual viewport to avoid layout issues when the on-screen keyboard is shown.
			root.setCssProps({ height: `${vv.height}px` });
			this.editorView?.requestMeasure();
		};

		apply();

		vv.addEventListener("resize", apply);
		vv.addEventListener("scroll", apply);

		this.cleanupMobileViewportFix = () => {
			vv.removeEventListener("resize", apply);
			vv.removeEventListener("scroll", apply);
			root.setCssProps({ height: "" });
		};
	}

	// 重写 save 方法，只在真正有未保存修改时才保存
	async save(): Promise<void> {
		// 如果没有未保存修改，直接返回，不修改文件
		if (!this.isDirty) {
			return;
		}

		if (!this.file) return;

		try {
			// 先清除 dirty 状态，避免保存时触发 modify 事件被误判为外部修改
			this.isDirty = false;
			this.updateTitle();

			// 使用 Obsidian 的标准保存方法
			await this.app.vault.modify(this.file, this.editorView.state.doc.toString());

			// 更新缓存
			this.data = this.editorView.state.doc.toString();

			// 保存成功后，更新侧边栏大纲
			type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
			const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
			if (plugin && this.file) {
				void plugin.updateOutline(this.file, this.editorView.state.doc.toString());
			}
		} catch (error) {
			// 保存失败，恢复 dirty 状态
			this.isDirty = true;
			this.updateTitle();
			console.error("Code Space: Failed to save file:", error);
			new Notice(t('NOTICE_SAVE_FAIL'));
		}
	}

	// 更新标题显示未保存状态
	updateTitle() {
		if (!this.file) return;

		// 只在状态改变时更新 DOM
		const titleEl = this.containerEl.querySelector('.view-header-title');
		if (titleEl) {
			const title = this.isDirty ? `${this.file.name} ●` : this.file.name;
			// 只在标题真的改变时才更新 DOM
			if (titleEl.textContent !== title) {
				titleEl.textContent = title;
			}
		}
	}

	async onLoadFile(file: TFile): Promise<void> {
		await super.onLoadFile(file);

		// Obsidian 原生支持的二进制文件类型列表
		const nativeBinaryExtensions = [
			// 图片
			'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'psd',
			// PDF
			'pdf',
			// 音频
			'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
			// 视频
			'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
			// 压缩文件
			'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
			// Office 文档
			'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
			// 其他二进制文件
			'exe', 'dll', 'so', 'dylib', 'bin', 'dat'
		];

		// 检查当前文件是否是二进制文件
		const ext = file.extension.toLowerCase();
		if (nativeBinaryExtensions.includes(ext)) {
			console.debug(`Code Space: Detected binary file .${ext}, opening with native viewer`);

			// 先销毁编辑器，防止它保存二进制内容
			if (this.editorView) {
				this.editorView.destroy();
				this.editorView = null as unknown as EditorView;
			}

			// 使用 Obsidian 原生方式打开文件
			await this.app.workspace.openLinkText(file.path, '', true);

			// 关闭当前的 Code Space 视图（因为已经用原生查看器打开了）
			this.leaf.detach();
			return;
		}

		// Update language extension when file is loaded
		if (this.editorView) {
			console.debug("Code Space: File loaded:", file.name, "extension:", ext);
			const langExt = LANGUAGE_PACKAGES[ext] || [];
			console.debug("Code Space: Applying language extension:", langExt);
			this.editorView.dispatch({
				effects: this.languageCompartment.reconfigure(langExt)
			});
		}

		// 文件加载完成，清除 dirty 状态
		this.isDirty = false;
		this.updateTitle();
	}

	async onOpen(): Promise<void> {
		await Promise.resolve(); // Required for async function

		// 从设置中初始化字体大小
		const plugin = this.getPlugin();
		if (plugin && plugin.settings) {
			this.fontSize = plugin.settings.editorFontSize || 16;
		}

		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();

		const root = container.createDiv({ cls: "code-space-container" });
		this.rootEl = root;

		// Debug: Log file extension and language extension
		const ext = this.file?.extension.toLowerCase();
		console.debug("Code Space: Opening file", this.file?.name, "with extension:", ext);

		const baseExtensions = [
			baseTheme,
			this.fontSizeCompartment.of(this.getFontSizeExtension()), // 字体大小管理
			this.lineNumbersCompartment.of(this.getLineNumbersExtension()),
			this.languageCompartment.of([]), // Start with empty, will be updated in onLoadFile
			highlightSpecialChars(),
			history(),
			foldGutter(),
			drawSelection(),
			indentOnInput(),
			bracketMatching(),
			closeBrackets(),
			highlightActiveLine(),
			indentUnit.of("    "),
			// 不使用默认的 search 扩展，改用自定义搜索面板
			highlightSelectionMatches(), // 高亮选中文本的匹配项
			keymap.of([
				...defaultKeymap,
				...historyKeymap,
				indentWithTab
			]),
			// 使用最高优先级注册自定义快捷键，防止被 Obsidian 全局快捷键拦截
			Prec.highest(keymap.of([
				{
					key: "Mod-s",
					run: () => {
						void this.save();
						return true;
					}
				},
				{
					key: "Mod-f",
					run: () => {
						this.openSearchFromHotkey("find");
						return true;
					}
				},
				{
					key: "Mod-h",
					run: () => {
						this.openSearchFromHotkey("replace");
						return true;
					}
				},
				// macOS: Cmd+Alt+F is a common "Replace" shortcut (Cmd+H is reserved by the OS).
				{
					key: "Mod-Alt-f",
					run: () => {
						this.openSearchFromHotkey("replace");
						return true;
					}
				}
			])),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					// 如果正在设置数据，不标记为 dirty
					if (this.isSettingData) {
						return;
					}

					// 比较新旧内容，只有真的改变了才标记为 dirty
					const oldContent = update.startState.doc.toString();
					const newContent = update.state.doc.toString();

					if (oldContent !== newContent) {
						// 只有内容真的改变了才标记为 dirty
						if (!this.isDirty) {
							this.isDirty = true;
						}
					} else {
						// 内容没变，确保不是 dirty
						if (this.isDirty) {
							this.isDirty = false;
						}
					}

					// 只在状态改变时更新标题
					this.updateTitle();
				}
			})
		];

		const state = EditorState.create({
			doc: this.data,
			extensions: [
				...baseExtensions,
				this.themeCompartment.of(this.getThemeExtension())
			]
		});

		this.editorView = new EditorView({
			state,
			parent: root
		});

		console.debug("Code Space: Editor created with state");

		// 创建自定义搜索面板
		this.searchPanel = new CustomSearchPanel(this.editorView, root);
		// 兜底拦截 Ctrl/Cmd+F/H，避免被全局搜索抢占（仅限 Code Space 编辑器）
		this.registerDomEvent(window, "keydown", (event: KeyboardEvent) => {
			if (event.isComposing) return;
			if (!(event.ctrlKey || event.metaKey)) return;

			const key = event.key.toLowerCase();
			const isFind = key === "f" && !event.altKey;
			const isReplace = (key === "h" && !event.altKey) || (Platform.isMacOS && event.metaKey && event.altKey && key === "f");
			if (!isFind && !isReplace) return;
			if (!this.editorView) return;

			const activeView = this.app.workspace.getActiveViewOfType(CodeSpaceView);
			if (activeView !== this) return;

			const target = event.target as HTMLElement | null;
			if (target && this.rootEl && !this.rootEl.contains(target)) return;

			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			this.openSearchFromHotkey(isReplace ? "replace" : "find");
		}, { capture: true });

		// Mobile-only: mitigate keyboard/viewport resize glitches.
		this.setupMobileViewportFix(root);

		// 监听窗口关闭事件，自动保存未保存的内容
		this.registerDomEvent(window, "beforeunload", () => {
			if (this.isDirty && this.file) {
				console.debug("Code Space: Auto-saving before window unload...");
				void this.save();
			}
		});

		// 添加标题栏搜索按钮
		this.addAction("search", t('HEADER_ACTION_SEARCH'), () => {
			this.toggleSearchPanel();
		});

		// 添加标题栏 Outline 按钮
		this.addAction("code", t('HEADER_ACTION_OUTLINE'), () => {
			const plugin = this.getPlugin();
			if (plugin) {
				void plugin.activateOutlineInSidebar();
			}
		});

		// 添加标题栏 Play 按钮 (Open in default app)
		this.addAction("play", t('HEADER_ACTION_PLAY'), () => {
			if (this.file) {
				type AppWithOpen = App & { openWithDefaultApp(path: string): void };
				(this.app as unknown as AppWithOpen).openWithDefaultApp(this.file.path);
			}
		});

		// 设置缩放功能
		this.setupZoomHandler(root);
	}

	// 添加 Ctrl+滚轮缩放功能
	private setupZoomHandler(root: HTMLElement) {
		this.registerDomEvent(root, "wheel", (event: WheelEvent) => {
			// 检测是否按下了 Ctrl 或 Cmd 键
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault();

				// 计算缩放方向
				const delta = event.deltaY > 0 ? -1 : 1;

				// 调整字体大小（每次变化 1px，范围 9-36px）
				const newSize = Math.max(9, Math.min(36, this.fontSize + delta));

				if (newSize !== this.fontSize) {
					this.fontSize = newSize;

					// 使用 Compartment 重新配置字体大小扩展
					this.editorView.dispatch({
						effects: this.fontSizeCompartment.reconfigure(this.getFontSizeExtension())
					});

					console.debug(`Code Space: Font size changed to ${this.fontSize}px`);
				}
			}
		}, { passive: false });

		this.registerEvent(this.app.workspace.on("css-change", () => {
			this.editorView.dispatch({
				effects: this.themeCompartment.reconfigure(this.getThemeExtension())
			});
		}));

		// 监听文件修改事件（外部编辑）
		this.registerEvent(this.app.vault.on("modify", (file: TFile) => {
			// 检查修改的文件是否是当前打开的文件
			if (this.file && file.path === this.file.path) {
				// 如果有未保存的修改，不要重新加载（保护用户的编辑）
				if (this.isDirty) {
					console.debug("Code Space: File modified externally but has unsaved changes");
					new Notice(t('NOTICE_MODIFIED_EXTERNALLY'), 5000);
					return;
				}

				// 没有未保存的修改，直接刷新
				console.debug("Code Space: File modified externally, reloading...");
				void this.loadFileContent();
			}
		}));
	}

	async loadFileContent() {
		if (!this.file) return;

		try {
			// 读取文件内容
			const content = await this.app.vault.read(this.file);
			
			// 检查内容是否发生变化
			const currentContent = this.editorView.state.doc.toString();
			if (content === currentContent) {
				// 内容一致，不需要重新加载编辑器，从而保留光标位置
				// 但仍需更新缓存和状态
				this.data = content;
				this.isDirty = false;
				this.updateTitle();
				console.debug("Code Space: File content matches editor content, skipping reload to preserve cursor");
				return;
			}

			// 更新编辑器内容
			this.editorView.dispatch({
				changes: {
					from: 0,
					to: this.editorView.state.doc.length,
					insert: content
				}
			});

			// 更新缓存的文件内容
			this.data = content;

			// 清除 dirty 状态（因为内容已经从磁盘重新加载）
			this.isDirty = false;
			this.updateTitle();

			console.debug("Code Space: File content reloaded from disk");
		} catch (error) {
			console.error("Code Space: Failed to reload file content:", error);
		}
	}

	async onClose(): Promise<void> {
		// 视图关闭前自动保存（如果内容已修改）
		if (this.isDirty && this.file) {
			console.debug("Code Space: Auto-saving on close...");
			await this.save();
		}

		this.cleanupMobileViewportFix?.();
		this.cleanupMobileViewportFix = undefined;
		this.rootEl = undefined;
		// 销毁自定义搜索面板
		if (this.searchPanel) {
			this.searchPanel.destroy();
		}
		if (this.editorView) {
			this.editorView.destroy();
		}
	}

	getViewData(): string {
		return this.editorView ? this.editorView.state.doc.toString() : this.data;
	}

	setViewData(data: string, clear: boolean): void {
		// 先更新缓存
		this.data = data;

		if (clear && this.editorView) {
			// 标记为正在设置数据，避免触发 dirty
			this.isSettingData = true;

			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: data },
				annotations: [Transaction.addToHistory.of(false)]
			});

			// dispatch 完成后清除标志（使用 setTimeout 确保在事件循环中执行）
			setTimeout(() => {
				this.isSettingData = false;
			}, 0);
		}
	}

	clear(): void {
		if (this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: "" }
			});
		}
	}
}
