import { ItemView, WorkspaceLeaf, TFile, setIcon, moment } from "obsidian";

export const VIEW_TYPE_CODE_DASHBOARD = "code-space-dashboard";

export class CodeDashboardView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_DASHBOARD;
	}

	getDisplayText(): string {
		return "Code Space";
	}

	getIcon(): string {
		return "code-glyph";
	}

	async onOpen(): Promise<void> {
		this.render();
		this.registerEvent(this.app.vault.on("create", () => this.render()));
		this.registerEvent(this.app.vault.on("delete", () => this.render()));
		this.registerEvent(this.app.vault.on("rename", () => this.render()));
		this.registerEvent(this.app.vault.on("modify", () => this.render()));
	}

	render() {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		
		const root = container.createDiv({ cls: "code-dashboard-root" });
		
		// Header
		const header = root.createDiv({ cls: "code-dashboard-header" });
		header.createEl("h1", { text: "Code Space" });
		
		const codeExtensions = ['py', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'jsx', 'tsx', 'json', 'css', 'html', 'rs', 'go', 'java', 'sql', 'php', 'rb'];
		const files = this.app.vault.getFiles()
			.filter(f => codeExtensions.includes(f.extension.toLowerCase()))
			.sort((a, b) => b.stat.mtime - a.stat.mtime);

		header.createEl("p", { text: `${files.length} code files managed by Code Space`, cls: "code-dashboard-subtitle" });

		// File Grid
		const fileList = root.createDiv({ cls: "code-file-list" });

		if (files.length === 0) {
			const empty = fileList.createDiv({ cls: "code-empty-state" });
			setIcon(empty.createDiv({ cls: "code-empty-icon" }), "code");
			empty.createDiv({ text: "No code files found." });
			return;
		}

		files.forEach(file => {
			const item = fileList.createDiv({ cls: "code-file-item" });
			
			// 1. Unified Minimalist Icon
			const iconContainer = item.createDiv({ cls: "code-file-icon-box" });
			setIcon(iconContainer, "file-code"); // 使用 Obsidian 原生最简约的代码文件图标
			
			// 2. Info
			const info = item.createDiv({ cls: "code-file-info" });
			info.createDiv({ cls: "code-file-name", text: file.name });
			info.createDiv({ cls: "code-file-path", text: file.parent?.path === "/" ? "" : file.parent?.path });

			// 3. Metadata
			const meta = item.createDiv({ cls: "code-file-meta" });
			meta.createDiv({ cls: "code-file-tag", text: file.extension.toUpperCase() });
			meta.createDiv({ cls: "code-file-time", text: moment(file.stat.mtime).fromNow() });

			item.addEventListener("click", () => {
				this.openFile(file);
			});
		});
	}

	async openFile(file: TFile) {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
	}
}