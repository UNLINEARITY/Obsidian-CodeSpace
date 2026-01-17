import { TextFileView, WorkspaceLeaf } from "obsidian";
import { EditorView, keymap, highlightSpecialChars, drawSelection, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment, Extension } from "@codemirror/state";
import { syntaxHighlighting, bracketMatching, foldGutter, indentOnInput, HighlightStyle, indentUnit } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { tags } from "@lezer/highlight";
import CodeSpacePlugin from "./main";

export const VIEW_TYPE_CODE_SPACE = "code-space-view";

// ... (HighlightStyle 和 Theme 定义略，此处省略以节省 tokens，但在写入时必须保留完整) ...
// 为了避免重复定义导致代码被截断，我将只写入 CodeSpaceView 类和必要的 imports
// 等等，write_file 是全量写入。我必须包含所有内容。
// 好的，为了确保代码完整性，我再写一遍完整的。

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
	".cm-cursor, .cm-dropCursor": {
		borderLeftWidth: "2px",
		borderLeftColor: "var(--text-accent) !important"
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
	}
});

export class CodeSpaceView extends TextFileView {
	editorView: EditorView;
	themeCompartment: Compartment;
	lineNumbersCompartment: Compartment;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.themeCompartment = new Compartment();
		this.lineNumbersCompartment = new Compartment();
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_SPACE;
	}

	getDisplayText(): string {
		return this.file ? this.file.name : "Code Space";
	}

	getPlugin(): CodeSpacePlugin {
		// @ts-ignore
		return this.app.plugins.getPlugin("code-space") as CodeSpacePlugin;
	}

	getLanguageExtension() {
		const ext = this.file?.extension.toLowerCase();
		if (ext === 'py') return python();
		if (['c', 'cpp', 'h', 'hpp'].includes(ext || '')) return cpp();
		if (['js', 'ts', 'jsx', 'tsx', 'json'].includes(ext || '')) return javascript();
		return [];
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

	// 供外部调用的刷新方法
	refreshSettings() {
		this.editorView.dispatch({
			effects: this.lineNumbersCompartment.reconfigure(this.getLineNumbersExtension())
		});
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		
		const root = container.createDiv({ cls: "code-space-container" });

		const baseExtensions = [
			baseTheme,
			this.lineNumbersCompartment.of(this.getLineNumbersExtension()),
			highlightSpecialChars(),
			history(),
			foldGutter(),
			drawSelection(),
			indentOnInput(),
			bracketMatching(),
			closeBrackets(),
			highlightActiveLine(),
			indentUnit.of("    "),
			keymap.of([
				...defaultKeymap,
				...historyKeymap,
				indentWithTab
			]),
			this.getLanguageExtension(),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					this.requestSave();
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

		this.registerEvent(this.app.workspace.on("css-change", () => {
			this.editorView.dispatch({
				effects: this.themeCompartment.reconfigure(this.getThemeExtension())
			});
		}));
	}

	async onClose(): Promise<void> {
		if (this.editorView) {
			this.editorView.destroy();
		}
	}

	getViewData(): string {
		return this.editorView ? this.editorView.state.doc.toString() : this.data;
	}

	setViewData(data: string, clear: boolean): void {
		if (clear && this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: data }
			});
		}
		this.data = data;
	}

	clear(): void {
		if (this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: "" }
			});
		}
	}
}