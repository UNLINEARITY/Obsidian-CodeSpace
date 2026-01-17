import { TextFileView, WorkspaceLeaf } from "obsidian";
import { EditorView, keymap, highlightSpecialChars, drawSelection, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { syntaxHighlighting, bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const VIEW_TYPE_CODE_SPACE = "code-space-view";

// 手动定义亮色模式的高亮样式 (参考 VS Code Light)
const myLightHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: "#af00db" }, // 关键字：紫色
	{ tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: "#000000" },
	{ tag: [tags.function(tags.variableName), tags.labelName], color: "#795e26" }, // 函数名：褐色
	{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#0000ff" }, // 常量：蓝色
	{ tag: [tags.definition(tags.name), tags.separator], color: "#000000" },
	{ tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: "#098658" }, // 类型、数字：绿色
	{ tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: "#383838" },
	{ tag: [tags.meta, tags.comment], color: "#008000", fontStyle: "italic" }, // 注释：绿色斜体
	{ tag: tags.strong, fontWeight: "bold" },
	{ tag: tags.emphasis, fontStyle: "italic" },
	{ tag: tags.strikethrough, textDecoration: "line-through" },
	{ tag: tags.link, color: "#2d7fba", textDecoration: "underline" },
	{ tag: tags.heading, fontWeight: "bold", color: "#005cc5" },
	{ tag: [tags.atom, tags.bool, tags.special(tags.variableName)], color: "#0000ff" },
	{ tag: [tags.processingInstruction, tags.string, tags.inserted], color: "#a31515" }, // 字符串：红色
	{ tag: tags.invalid, color: "#ff0000" },
]);

export class CodeSpaceView extends TextFileView {
	editorView: EditorView;
	themeCompartment: Compartment;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.themeCompartment = new Compartment();
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_SPACE;
	}

	getDisplayText(): string {
		return this.file ? this.file.name : "Code Space";
	}

	getLanguageExtension() {
		const ext = this.file?.extension.toLowerCase();
		console.log(`CodeSpace: Loading language for extension .${ext}`);
		
		if (ext === 'py') return python();
		if (['c', 'cpp', 'h', 'hpp'].includes(ext || '')) return cpp();
		if (['js', 'ts', 'jsx', 'tsx', 'json'].includes(ext || '')) return javascript();
		
		return [];
	}

	getThemeExtension() {
		const isDark = document.body.classList.contains("theme-dark");
		if (isDark) {
			// 暗色模式：直接使用 One Dark (它内部包含了 syntaxHighlighting)
			return oneDark;
		} else {
			// 亮色模式：使用我们手写的样式表
			return [
				EditorView.theme({
					"&": { color: "#000000", backgroundColor: "#ffffff" },
					".cm-content": { caretColor: "#000000" }
				}, { dark: false }),
				syntaxHighlighting(myLightHighlightStyle)
			]; 
		}
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		
		const rootEl = container.createDiv({ cls: "code-space-container" });

		const baseExtensions = [
			lineNumbers(),
			highlightActiveLineGutter(),
			highlightSpecialChars(),
			history(),
			foldGutter(),
			drawSelection(),
			indentOnInput(),
			bracketMatching(),
			highlightActiveLine(),
			keymap.of([...defaultKeymap, ...historyKeymap]),
			this.getLanguageExtension(),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					this.requestSave();
				}
			}),
			// 强制设置编辑器高度和滚动行为
			EditorView.theme({
				"&": { height: "100%", width: "100%" },
				".cm-scroller": { overflow: "auto" }
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
			parent: rootEl
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