import { TextFileView, WorkspaceLeaf, TFile, Notice, App, setIcon } from "obsidian";
import { EditorView, keymap, highlightSpecialChars, drawSelection, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration, DecorationSet } from "@codemirror/view";
import { EditorState, Compartment, Extension, StateField, Transaction } from "@codemirror/state";
import { syntaxHighlighting, bracketMatching, foldGutter, indentOnInput, HighlightStyle, indentUnit } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets } from "@codemirror/autocomplete";
import { search, SearchQuery, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { tags } from "@lezer/highlight";
import CodeSpacePlugin from "./main";

export const VIEW_TYPE_CODE_SPACE = "code-space-view";

// 自定义搜索装饰器 StateField
const searchHighlightField = StateField.define<DecorationSet>({
	create(): DecorationSet {
		return Decoration.none;
	},
	update(decorations: DecorationSet, tr: Transaction): DecorationSet {
		// 这里会在后续实现
		return decorations;
	},
	provide: (field: StateField<DecorationSet>) => EditorView.decorations.from(field)
});

// 创建搜索高亮装饰的样式
const searchHighlightMark = Decoration.mark({ class: "search-match-highlight" });
const searchSelectedMark = Decoration.mark({ class: "search-selected-highlight" });


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
			attr: { placeholder: "Search" }
		});

		// 选项按钮组
		const optionsGroup = searchRow.createDiv({ cls: "custom-search-options" });

		this.caseSensitiveBtn = this.createOptionButton(optionsGroup, "case-sensitive", "Match case");
		this.regexpBtn = this.createOptionButton(optionsGroup, "regex", "Use regular expression");
		this.wholeWordBtn = this.createOptionButton(optionsGroup, "hashtag", "Match whole word");

		// 导航按钮
		const navGroup = searchRow.createDiv({ cls: "custom-search-nav" });
		this.prevBtn = this.createNavButton(navGroup, "arrow-left", "Previous match");
		this.nextBtn = this.createNavButton(navGroup, "arrow-right", "Next match");

		// 关闭按钮
		this.closeBtn = this.createIconButton(searchRow, "x", "Close");

		// 替换行
		const replaceRow = this.panelEl.createDiv({ cls: "custom-search-row custom-search-replace-row" });

		// 替换图标
		const replaceIcon = replaceRow.createDiv({ cls: "custom-search-icon" });
		setIcon(replaceIcon, "repeat");

		// 替换输入框
		this.replaceInput = replaceRow.createEl("input", {
			cls: "custom-search-input",
			type: "text",
			attr: { placeholder: "Replace" }
		});

		// 替换按钮组
		const replaceBtnGroup = replaceRow.createDiv({ cls: "custom-search-replace-btns" });
		this.replaceBtn = this.createReplaceButton(replaceBtnGroup, "Replace", false);
		this.replaceAllBtn = this.createReplaceButton(replaceBtnGroup, "Replace all", true);
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
				e.shiftKey ? this.findPrevious() : this.findNext();
			}
		});

		// 替换输入回车
		this.replaceInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.shiftKey ? this.replace() : this.findNext();
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

		const { from, to } = this.view.state.selection.main;
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
					scrollIntoView: true
				});
			}
		} catch (error) {
			console.error("Search error:", error);
		}
	}

	private findPrevious() {
		const query = this.getQuery();
		if (!query.search) return;

		const { from, to } = this.view.state.selection.main;
		const searchString = this.view.state.doc.toString();

		try {
			let searchPos = from;
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
					scrollIntoView: true
				});
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
		if (!query.search || !query.replace) return;

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
		if (!query.search || !query.replace) return;

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
			let offset = 0;

			while ((execResult = regex.exec(searchString)) !== null) {
				changes.push({
					from: execResult.index + offset,
					to: execResult.index + execResult[0].length + offset,
					insert: query.replace
				});
				offset += query.replace.length - execResult[0].length;
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
		color: "var(--text-normal)"
	},
	".cm-content": {
		caretColor: "var(--text-accent) !important",
		padding: "10px 0"
	},
	// 搜索选中文本的金黄色高亮 - 最高优先级
	"&.cm-focused .cm-selectionBackground": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	".cm-selectionBackground": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	".cm-content ::selection": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	"&.cm-focused .cm-content ::selection": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	"::selection": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	"::moz-selection": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	".cm-line::selection": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	".cm-gutters": {
		backgroundColor: "transparent !important",
		color: "var(--text-muted)",
		borderRight: "1px solid var(--background-modifier-border)",
		minWidth: "40px"
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--background-modifier-active-hover)"
	},
	".cm-activeLine": {
		backgroundColor: "var(--background-modifier-active-hover)"
	},
	// 确保活动行内的选区也是金黄色
	".cm-activeLine .cm-selectionBackground": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
	},
	".cm-activeLine::selection": {
		backgroundColor: "#FFD700 !important",
		color: "#000000 !important"
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
	// 搜索匹配高亮
	".cm-searchMatch": {
		backgroundColor: "hsla(45, 100%, 50%, 0.25)",
		borderRadius: "2px"
	},
	".cm-searchMatch-selected": {
		backgroundColor: "hsla(45, 100%, 50%, 0.4)",
		boxShadow: "0 0 0 1px hsla(45, 100%, 45%, 0.3)"
	},
	".cm-selectionMatch": {
		backgroundColor: "hsla(var(--interactive-accent-hsl), 0.15)",
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
		return ['py', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'sql', 'php'].includes(ext);
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
		return this.file ? this.file.name : "Code Space";
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
		// 使用 EditorView.theme 统一设置所有元素的字体大小
		return EditorView.theme({
			"&": {
				fontSize: `${this.fontSize}px`
			},
			".cm-content": {
				fontSize: `${this.fontSize}px`
			},
			".cm-gutters": {
				fontSize: `${this.fontSize}px`
			},
			".cm-line": {
				fontSize: `${this.fontSize}px`
			}
		});
	}

	// 供外部调用的刷新方法
	refreshSettings() {
		this.editorView.dispatch({
			effects: this.lineNumbersCompartment.reconfigure(this.getLineNumbersExtension())
		});
	}

	// 切换搜索面板（供命令调用）
	toggleSearchPanel() {
		if (this.searchPanel) {
			this.searchPanel.toggle();
		}
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
				void plugin.updateOutline(this.file);
			}
		} catch (error) {
			// 保存失败，恢复 dirty 状态
			this.isDirty = true;
			this.updateTitle();
			console.error("Code Space: Failed to save file:", error);
			new Notice("Failed to save file");
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
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();

		const root = container.createDiv({ cls: "code-space-container" });

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
				// 移除默认的 searchKeymap，使用我们自己的快捷键
				indentWithTab,
				{
					key: "Mod-s",
					run: () => {
						void this.save();
						return true;
					}
				}
			]),
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

		// 创建浮动搜索按钮
		this.createSearchButton(root);

		// 设置缩放功能
		this.setupZoomHandler(root);
	}

	private createSearchButton(container: HTMLElement) {
		// 创建浮动按钮容器
		const buttonContainer = container.createDiv({
			cls: "code-search-float-button"
		});

		// 设置搜索图标
		setIcon(buttonContainer, "search");

		// 点击事件：切换搜索面板
		buttonContainer.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.searchPanel?.toggle();
		});

		// 鼠标悬停提示
		buttonContainer.setAttribute("aria-label", "Search and replace");
		buttonContainer.setAttribute("data-tooltip", "Search and replace");
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
					new Notice("File modified externally. You have unsaved changes.", 5000);
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
		await Promise.resolve(); // Required for async function
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
				changes: { from: 0, to: this.editorView.state.doc.length, insert: data }
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