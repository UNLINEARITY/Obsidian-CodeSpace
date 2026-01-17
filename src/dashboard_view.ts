import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { VIEW_TYPE_CODE_SPACE } from "./code_view";

export const VIEW_TYPE_CODE_DASHBOARD = "code-space-dashboard";

export class CodeDashboardView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_DASHBOARD;
	}

	getDisplayText(): string {
		return "Code Space Dashboard";
	}

	getIcon(): string {
		return "code-glyph"; // Obsidian 内置图标
	}

	async onOpen(): Promise<void> {
		this.render();
		// 监听文件变化，自动刷新列表
		this.registerEvent(this.app.vault.on("create", () => this.render()));
		this.registerEvent(this.app.vault.on("delete", () => this.render()));
		this.registerEvent(this.app.vault.on("rename", () => this.render()));
	}

	render() {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		
		const root = container.createDiv({ cls: "code-dashboard-root" });
		root.createEl("h2", { text: "Code Space Files" });

		const fileList = root.createDiv({ cls: "code-file-list" });

		// 获取所有代码文件
		const codeExtensions = ['py', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'jsx', 'tsx', 'json'];
		const files = this.app.vault.getFiles().filter(f => codeExtensions.includes(f.extension.toLowerCase()));

		if (files.length === 0) {
			fileList.createDiv({ text: "No code files found.", cls: "code-empty-state" });
			return;
		}

		// 渲染文件列表
		files.forEach(file => {
			const item = fileList.createDiv({ cls: "code-file-item" });
			
			// 图标
			item.createSpan({ cls: "code-file-icon", text: this.getFileIcon(file.extension) });
			
			// 文件名
			const nameSpan = item.createSpan({ cls: "code-file-name", text: file.name });
			
			// 路径 (灰色小字)
			item.createSpan({ cls: "code-file-path", text: file.parent?.path === "/" ? "" : ` (${file.parent?.path})` });

			// 点击事件
			item.addEventListener("click", () => {
				this.openFile(file);
			});
		});
	}

	getFileIcon(ext: string): string {
		switch(ext) {
			case 'py': return '🐍 ';
			case 'c': 
			case 'cpp': return '🇨 ';
			case 'js': 
			case 'ts': return '📜 ';
			default: return '📄 ';
		}
	}

	async openFile(file: TFile) {
		// 打开文件
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
	}

	async onClose(): Promise<void> {
		// 清理工作
	}
}
