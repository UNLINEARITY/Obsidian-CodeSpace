import { ItemView, WorkspaceLeaf, TFile, setIcon } from "obsidian";
import CodeSpacePlugin from "./main";
import { parseCodeSymbols, CodeSymbol } from "./code_parser";

export const VIEW_TYPE_CODE_OUTLINE = "code-space-outline";

export class CodeOutlineView extends ItemView {
	plugin: CodeSpacePlugin;
	currentFile: TFile | null = null;
	symbols: CodeSymbol[] = [];

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_OUTLINE;
	}

	getDisplayText(): string {
		return "Code outline";
	}

	getIcon(): string {
		return "list";
	}

	async onOpen(): Promise<void> {
		await Promise.resolve();
		this.render();

		// 监听活动叶子节点变化，自动更新大纲
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
			void this.updateFromActiveView();
		}));

		// 监听文件变化（当用户在编辑器中切换文件时）
		this.registerEvent(this.app.workspace.on('file-open', () => {
			void this.updateFromActiveView();
		}));

		// 初始加载时检查当前活动视图
		void this.updateFromActiveView();
	}

	async updateFromActiveView() {
		// 获取当前活动的视图
		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) return;

		const activeView = activeLeaf.view;
		if (!activeView) return;

		// 检查是否是 CodeSpaceView（通过 getViewType）
		type ViewWithType = { getViewType(): string; file?: TFile };
		const typedView = activeView as unknown as ViewWithType;

		if (typedView.getViewType() === 'code-space-view' && typedView.file) {
			// 是代码文件视图，更新大纲
			await this.updateSymbols(typedView.file);
		}
	}

	render() {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();

		// 标题
		const header = container.createEl("h2", {
			text: "Code outline",
			cls: "code-outline-header"
		});

		if (!this.currentFile) {
			container.createEl("p", {
				text: "Open a code file to see its structure",
				cls: "code-outline-empty"
			});
			return;
		}

		// 文件名
		const fileName = container.createEl("div", {
			cls: "code-outline-filename"
		});
		fileName.setText(this.currentFile.name);

		// 符号列表
		const symbolsList = container.createDiv({ cls: "code-outline-list" });

		if (this.symbols.length === 0) {
			symbolsList.createEl("p", {
				text: "No symbols found in this file",
				cls: "code-outline-empty"
			});
			return;
		}

		const listInner = symbolsList.createDiv({ cls: "code-outline-list-inner" });

		this.symbols.forEach(symbol => {
			const item = listInner.createDiv({ cls: "code-outline-item" });

			// 图标
			const icon = item.createDiv({ cls: "code-outline-icon" });
			if (symbol.type === "class") {
				setIcon(icon, "box");
			} else if (symbol.type === "function") {
				setIcon(icon, "function");
			} else {
				setIcon(icon, "curly-braces");
			}

			// 名称和行号
			const info = item.createDiv({ cls: "code-outline-info" });
			info.createDiv({ cls: "code-outline-name", text: symbol.name });
			info.createDiv({ cls: "code-outline-line", text: `L${symbol.line}` });

			// 点击事件：跳转到对应行
			item.addEventListener("click", () => {
				void this.jumpToSymbol(symbol);
			});
		});
	}

	async updateSymbols(file: TFile) {
		this.currentFile = file;

		try {
			const content = await this.app.vault.read(file);
			this.symbols = parseCodeSymbols(file, content);
		} catch (error) {
			console.error("Failed to parse symbols:", error);
			this.symbols = [];
		}

		this.render();
	}

	clear() {
		this.currentFile = null;
		this.symbols = [];
		this.render();
	}

	async jumpToSymbol(symbol: CodeSymbol) {
		if (!this.currentFile) return;

		// 在 Code Space 视图中打开文件
		const leaves = this.app.workspace.getLeavesOfType("code-space-view");
		let targetLeaf = leaves.find(leaf => {
			const view = leaf.view as any;
			return view.file && view.file.path === this.currentFile!.path;
		});

		// 如果没有找到已打开的视图，创建新的
		if (!targetLeaf) {
			targetLeaf = this.app.workspace.getLeaf(true);
			await targetLeaf.setViewState({
				type: "code-space-view",
				active: true,
				state: { file: this.currentFile.path }
			});
		}

		// 聚焦到该视图
		await this.app.workspace.revealLeaf(targetLeaf);

		// 跳转到指定行
		const view = targetLeaf.view as any;
		if (view && view.editorView) {
			setTimeout(() => {
				try {
					const pos = view.editorView.state.doc.line(symbol.line).from;
					view.editorView.dispatch({
						selection: { anchor: pos, head: pos },
						scrollIntoView: true
					});
				} catch (error) {
					console.error("Failed to jump to line:", error);
				}
			}, 100);
		}
	}
}
