import { ItemView, WorkspaceLeaf, TFile, setIcon, moment, Menu } from "obsidian";

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
			
			// 1. Icon
			const iconContainer = item.createDiv({ cls: "code-file-icon-box" });
			setIcon(iconContainer, "file-code");
			
			// 2. Info
			const info = item.createDiv({ cls: "code-file-info" });
			info.createDiv({ cls: "code-file-name", text: file.name });
			info.createDiv({ cls: "code-file-path", text: file.parent?.path === "/" ? "" : file.parent?.path });

			// 3. Metadata
			const meta = item.createDiv({ cls: "code-file-meta" });
			meta.createDiv({ cls: "code-file-tag", text: file.extension.toUpperCase() });
			meta.createDiv({ cls: "code-file-time", text: moment(file.stat.mtime).fromNow() });

			// 左键点击：在 Code Space 编辑器打开
			item.addEventListener("click", () => {
				this.openFile(file);
			});

			// 右键点击：上下文菜单
			item.addEventListener("contextmenu", (event) => {
				const menu = new Menu();

				menu.addItem((item) =>
					item
						.setTitle("Open in default app")
						.setIcon("external-link")
						.onClick(() => {
							// @ts-ignore (openWithDefaultApp is internal API but widely used)
							this.app.openWithDefaultApp(file.path);
						})
				);

				menu.addItem((item) =>
					item
						.setTitle("Reveal in navigation")
						.setIcon("folder-open")
						.onClick(() => {
							// 自动在左侧文件树定位
							const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
							if (leaf) {
								this.app.workspace.revealLeaf(leaf);
								// @ts-ignore
								leaf.view.revealInFolder(file);
							}
						})
				);

				menu.addSeparator();

				menu.addItem((item) =>
					item
						.setTitle("Delete")
						.setIcon("trash")
						.setWarning(true) // 红色警告样式
						.onClick(async () => {
							await this.app.vault.trash(file, true); // true = use system trash
						})
				);

				menu.showAtPosition({ x: event.pageX, y: event.pageY });
			});
		});
	}

	async openFile(file: TFile) {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
	}
}
