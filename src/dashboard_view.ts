import { ItemView, WorkspaceLeaf, TFile, setIcon, moment, Menu, TextComponent, DropdownComponent, ButtonComponent } from "obsidian";
import CodeSpacePlugin from "./main"; // 导入插件类型

export const VIEW_TYPE_CODE_DASHBOARD = "code-space-dashboard";

interface DashboardState {
	searchQuery: string;
	filterExt: string;
	sortBy: 'date' | 'name' | 'type';
	sortDesc: boolean;
}

export class CodeDashboardView extends ItemView {
	plugin: CodeSpacePlugin; // 引用插件实例
	state: DashboardState = {
		searchQuery: "",
		filterExt: "all",
		sortBy: "date",
		sortDesc: true
	};

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
		// Hack: 获取插件实例 (通过 app.plugins 如果是公开 API，或者通过全局)
		// 这里简单假设我们能通过 view 的 scope 访问，或者在 main.ts 传进来。
		// 更稳妥的方式是：view 不直接持有 plugin，而是 app.plugins.getPlugin('code-space')
		
		this.render();
		this.registerEvent(this.app.vault.on("create", () => this.render(true)));
		this.registerEvent(this.app.vault.on("delete", () => this.render(true)));
		this.registerEvent(this.app.vault.on("rename", () => this.render(true)));
		this.registerEvent(this.app.vault.on("modify", () => this.render(true)));
	}

	// 获取配置的后缀列表
	getManagedExtensions(): string[] {
		// @ts-ignore
		const plugin = this.app.plugins.getPlugin("code-space") as CodeSpacePlugin;
		if (plugin && plugin.settings) {
			return plugin.settings.extensions.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
		}
		return ['py', 'js', 'c', 'cpp']; // Fallback
	}

	render(keepState = false) {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		
		const root = container.createDiv({ cls: "code-dashboard-root" });
		
		// Header
		const header = root.createDiv({ cls: "code-dashboard-header" });
		header.createEl("h1", { text: "Code Space" });
		
		const codeExtensions = this.getManagedExtensions();
		let files = this.app.vault.getFiles().filter(f => codeExtensions.includes(f.extension.toLowerCase()));

		header.createEl("p", { text: `${files.length} code files managed`, cls: "code-dashboard-subtitle" });

		// Toolbar
		const toolbar = root.createDiv({ cls: "code-dashboard-toolbar" });
		
		// Search
		const searchContainer = toolbar.createDiv({ cls: "code-search-box" });
		const searchIcon = searchContainer.createDiv({ cls: "code-search-icon" });
		setIcon(searchIcon, "search");
		
		new TextComponent(searchContainer)
			.setPlaceholder("Search files...")
			.setValue(this.state.searchQuery)
			.onChange((value) => {
				this.state.searchQuery = value;
				this.refreshFileList(fileListContainer, files);
			});

		// Filter
		const existingExts = [...new Set(files.map(f => f.extension))].sort();
		const filterDropdown = new DropdownComponent(toolbar);
		filterDropdown.addOption("all", "All Languages");
		existingExts.forEach(ext => filterDropdown.addOption(ext, ext.toUpperCase()));
		filterDropdown.setValue(this.state.filterExt);
		filterDropdown.onChange((value) => {
			this.state.filterExt = value;
			this.refreshFileList(fileListContainer, files);
		});

		// Sort
		const sortDropdown = new DropdownComponent(toolbar);
		sortDropdown.addOption("date", "Date Modified");
		sortDropdown.addOption("name", "Name");
		sortDropdown.addOption("type", "Type");
		sortDropdown.setValue(this.state.sortBy);
		sortDropdown.onChange((value: any) => {
			this.state.sortBy = value;
			this.refreshFileList(fileListContainer, files);
		});

		// Sort Button
		const sortBtn = new ButtonComponent(toolbar)
			.setIcon(this.state.sortDesc ? "arrow-down-narrow-wide" : "arrow-up-narrow-wide")
			.setTooltip("Toggle Order")
			.onClick(() => {
				this.state.sortDesc = !this.state.sortDesc;
				sortBtn.setIcon(this.state.sortDesc ? "arrow-down-narrow-wide" : "arrow-up-narrow-wide");
				this.refreshFileList(fileListContainer, files);
			});

		// List Container
		const fileListContainer = root.createDiv({ cls: "code-file-list-container" });
		this.refreshFileList(fileListContainer, files);
	}

	refreshFileList(container: HTMLElement, allFiles: TFile[]) {
		container.empty();
		const grid = container.createDiv({ cls: "code-file-list" });

		// Filter
		let files = allFiles.filter(f => {
			const q = this.state.searchQuery.toLowerCase();
			const matchQuery = f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
			const matchExt = this.state.filterExt === 'all' || f.extension === this.state.filterExt;
			return matchQuery && matchExt;
		});

		// Sort
		files.sort((a, b) => {
			let res = 0;
			switch (this.state.sortBy) {
				case 'name': res = a.name.localeCompare(b.name); break;
				case 'type': res = a.extension.localeCompare(b.extension); break;
				case 'date': res = a.stat.mtime - b.stat.mtime; break;
			}
			return this.state.sortDesc ? -res : res;
		});

		if (files.length === 0) {
			const empty = grid.createDiv({ cls: "code-empty-state" });
			setIcon(empty.createDiv({ cls: "code-empty-icon" }), "search-x");
			empty.createDiv({ text: "No matching files found." });
			return;
		}

		files.forEach(file => {
			const item = grid.createDiv({ cls: "code-file-item" });
			
			// Icon
			const iconBox = item.createDiv({ cls: "code-file-icon-box" });
			setIcon(iconBox, "file-code");
			
			// Info
			const info = item.createDiv({ cls: "code-file-info" });
			info.createDiv({ cls: "code-file-name", text: file.name });
			info.createDiv({ cls: "code-file-path", text: file.parent?.path === "/" ? "" : file.parent?.path });

			// Meta
			const meta = item.createDiv({ cls: "code-file-meta" });
			meta.createDiv({ cls: "code-file-tag", text: file.extension.toUpperCase() });
			meta.createDiv({ cls: "code-file-time", text: moment(file.stat.mtime).fromNow() });

			item.addEventListener("click", () => this.openFile(file));
			item.addEventListener("contextmenu", (e) => this.showContextMenu(e, file));
		});
	}

	showContextMenu(event: MouseEvent, file: TFile) {
		const menu = new Menu();
		menu.addItem((item) => item.setTitle("Open in default app").setIcon("external-link").onClick(() => {
			// @ts-ignore
			this.app.openWithDefaultApp(file.path);
		}));
		menu.addItem((item) => item.setTitle("Reveal in navigation").setIcon("folder-open").onClick(() => {
			const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
			if (leaf) {
				this.app.workspace.revealLeaf(leaf);
				// @ts-ignore
				leaf.view.revealInFolder(file);
			}
		}));
		menu.addSeparator();
		menu.addItem((item) => item.setTitle("Delete").setIcon("trash").setWarning(true).onClick(async () => {
			await this.app.vault.trash(file, true);
		}));
		menu.showAtPosition({ x: event.pageX, y: event.pageY });
	}

	async openFile(file: TFile) {
		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
	}
}