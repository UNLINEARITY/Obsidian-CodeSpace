import { TextFileView, WorkspaceLeaf } from "obsidian";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { ViewUpdate } from "@codemirror/view";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

export const VIEW_TYPE_CODE_SPACE = "code-space-view";

export class CodeSpaceView extends TextFileView {
	editorView: EditorView;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_SPACE;
	}

	getDisplayText(): string {
		return this.file ? this.file.name : "Code Space";
	}

	// 根据文件后缀获取对应的语言包
	getLanguageExtension() {
		const ext = this.file?.extension.toLowerCase();
		if (ext === 'py') return python();
		if (['c', 'cpp', 'h', 'hpp'].includes(ext || '')) return cpp();
		return [];
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		
		const rootEl = container.createDiv({ cls: "code-space-container" });

		// 配置 CodeMirror 状态
		const state = EditorState.create({
			doc: this.data,
			extensions: [
				basicSetup,
				this.getLanguageExtension(),
				oneDark, 
				EditorView.updateListener.of((update: ViewUpdate) => {
					if (update.docChanged) {
						this.requestSave();
					}
				}),
				EditorView.theme({
					"&": { height: "100%" },
					".cm-scroller": { overflow: "auto" }
				})
			]
		});

		// 挂载编辑器
		this.editorView = new EditorView({
			state,
			parent: rootEl
		});
	}

	async onClose(): Promise<void> {
		if (this.editorView) {
			this.editorView.destroy();
		}
	}

	// 必须实现：获取视图当前内容以便保存到磁盘
	getViewData(): string {
		return this.editorView ? this.editorView.state.doc.toString() : this.data;
	}

	// 必须实现：将磁盘文件内容加载到视图
	setViewData(data: string, clear: boolean): void {
		if (clear && this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: data }
			});
		}
		this.data = data;
	}

	// 必须实现：清理
	clear(): void {
		if (this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: "" }
			});
		}
	}
}
