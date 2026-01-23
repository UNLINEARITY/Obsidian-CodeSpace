import { ItemView, WorkspaceLeaf, TFile, setIcon } from "obsidian";
import { EditorView } from "@codemirror/view";
import CodeSpacePlugin from "./main";
import { parseCodeSymbols, CodeSymbol } from "./code_parser";
import { CodeSpaceView } from "./code_view";

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
		return "code";
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
		console.debug("Code Outline: updateFromActiveView called");

		// Avoid clearing/refreshing if the outline view itself is the active view
		// This happens when the user clicks on the outline view
		const activeViewSelf = this.app.workspace.getActiveViewOfType(CodeOutlineView);
		if (activeViewSelf && activeViewSelf === this) {
			console.debug("Code Outline: Outline view is active, skipping update");
			return;
		}

		// 使用推荐的方法获取当前活动的 CodeSpaceView
		const activeView = this.app.workspace.getActiveViewOfType(CodeSpaceView);

		if (activeView && activeView.file) {
			// Check if we are already showing the outline for this file
			if (this.currentFile && this.currentFile.path === activeView.file.path) {
				console.debug("Code Outline: Already showing outline for", activeView.file.name);
				return;
			}

			// 是代码文件视图，更新大纲
			console.debug("Code Outline: Active view is code file:", activeView.file.name);
			await this.updateSymbols(activeView.file);
		} else {
			// 不是代码文件，清空大纲显示
			console.debug("Code Outline: Active view is not a code file, clearing");
			this.clear();
		}
	}

	render() {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();

		// 标题
		container.createEl("h2", {
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
				setIcon(icon, "braces");
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

	async updateSymbols(file: TFile, content?: string) {
		this.currentFile = file;

		try {
			const fileContent = content !== undefined ? content : await this.app.vault.read(file);
			this.symbols = parseCodeSymbols(file, fileContent);
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

		console.debug("Code Outline: Jumping to symbol:", symbol.name, "at line", symbol.line);

		// 在 Code Space 视图中打开文件
		const leaves = this.app.workspace.getLeavesOfType("code-space-view");

		// Define a minimal interface to satisfy TypeScript
		interface CodeSpaceViewInterface {
			file: TFile | null;
			editorView?: {
				state: {
					doc: {
						line(lineNum: number): { from: number; to: number };
					};
				};
				dispatch(transaction: {
					selection: { anchor: number; head: number };
					effects?: unknown[];
					scrollIntoView?: boolean;
				}): void;
			};
		}

		let targetLeaf = leaves.find(leaf => {
			const view = leaf.view as unknown as CodeSpaceViewInterface;
			return view.file && view.file.path === this.currentFile!.path;
		});

		// 如果没有找到已打开的视图，创建新的
		if (!targetLeaf) {
			console.debug("Code Outline: Creating new view");
			targetLeaf = this.app.workspace.getLeaf(true);
			await targetLeaf.setViewState({
				type: "code-space-view",
				active: true,
				state: { file: this.currentFile.path }
			});
		} else {
			console.debug("Code Outline: Using existing view");
		}

		// 聚焦到该视图
		await this.app.workspace.revealLeaf(targetLeaf);

		// 跳转到指定行
		const view = targetLeaf.view as unknown as CodeSpaceViewInterface;
		if (view && view.editorView) {
			console.debug("Code Outline: Jumping to line", symbol.line);
			// Small delay to ensure view is ready
			setTimeout(() => {
				try {
					if (!view.editorView) return;
					const line = view.editorView.state.doc.line(symbol.line);
					view.editorView.dispatch({
						selection: { anchor: line.from, head: line.to },
						effects: [EditorView.scrollIntoView(line.from, { x: "nearest", y: "center" })]
					});
					console.debug("Code Outline: Dispatch successful");
				} catch (error) {
					console.error("Code Outline: Failed to jump to line:", error);
				}
			}, 100);
		} else {
			console.debug("Code Outline: No editorView found");
		}
	}
}
