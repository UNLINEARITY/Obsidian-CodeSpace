import { ItemView, WorkspaceLeaf, TFile, setIcon, moment, Menu, TextComponent, ButtonComponent, Modal, Notice, SuggestModal, App } from "obsidian";
import CodeSpacePlugin from "./main"; // 导入插件类型
import { CustomDropdown } from "./dropdown";
import { t } from "./lang/helpers";

// 创建一个简单的输入对话框
class RenameModal extends Modal {
	private result: string | null = null;
	private onSubmit: (result: string) => void;

	constructor(app: App, title: string, placeholder: string, defaultValue: string, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
		this.setTitle(title);

		const input = new TextComponent(this.contentEl);
		input.setValue(defaultValue);
		input.setPlaceholder(placeholder);

		const buttonContainer = this.contentEl.createDiv({ cls: "modal-button-container" });
		const submitBtn = new ButtonComponent(buttonContainer);
		submitBtn.setButtonText(t('MODAL_RENAME_BUTTON_SUBMIT'));
		submitBtn.onClick(() => {
			this.result = input.getValue();
			this.close();
		});

		const cancelBtn = new ButtonComponent(buttonContainer);
		cancelBtn.setButtonText(t('MODAL_RENAME_BUTTON_CANCEL'));
		cancelBtn.onClick(() => {
			this.close();
		});

		// 聚焦到输入框
		setTimeout(() => input.inputEl.focus(), 10);
	}

	onClose() {
		super.onClose();
		if (this.result !== null && this.result.trim() !== "") {
			this.onSubmit(this.result.trim());
		}
	}
}

// 文件夹选择模态框
class FolderSuggestModal extends SuggestModal<string> {
	private folders: string[] = [];
	private onSubmit: (folder: string) => void;

	constructor(app: App, onSubmit: (folder: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
		this.setPlaceholder(t('MODAL_MOVE_PLACEHOLDER'));

		// 获取所有文件夹
		const files = this.app.vault.getAllLoadedFiles();
		type AbstractFile = { path: string; children?: unknown[] };
		this.folders = (files as unknown as AbstractFile[])
			.filter((f) => f.children !== undefined) // 只保留文件夹
			.map((f) => f.path);
	}

	getSuggestions(query: string): string[] {
		if (!query) {
			return this.folders.slice(0, 20); // 默认显示前20个
		}
		const lowerQuery = query.toLowerCase();
		return this.folders.filter(folder =>
			folder.toLowerCase().includes(lowerQuery)
		);
	}

	renderSuggestion(folder: string, el: HTMLElement) {
		el.setText(folder);
	}

	onChooseSuggestion(folder: string, evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(folder);
	}
}

export const VIEW_TYPE_CODE_DASHBOARD = "code-space-dashboard";

interface DashboardState {
	searchQuery: string;
	filterExt: string;
	sortBy: 'date' | 'name' | 'type';
	sortDesc: boolean;
}

export class CodeDashboardView extends ItemView {
	plugin: CodeSpacePlugin; 
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
		return t('VIEW_TITLE');
	}

	getIcon(): string {
		return "code-glyph";
	}

	async onOpen(): Promise<void> {
		await Promise.resolve(); // Required for async function
		this.render();
		this.registerEvent(this.app.vault.on("create", () => this.render(true)));
		this.registerEvent(this.app.vault.on("delete", () => this.render(true)));
		this.registerEvent(this.app.vault.on("rename", () => this.render(true)));
		this.registerEvent(this.app.vault.on("modify", () => this.render(true)));
	}

	// 获取配置的后缀列表
	getManagedExtensions(): string[] {
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
		const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
		if (plugin && plugin.settings) {
			return plugin.settings.extensions.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
		}
		return ['py', 'js', 'c', 'cpp'];
	}

	render(keepState = false) {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();

		const root = container.createDiv({ cls: "code-dashboard-root" });

		// Header Container
		const headerContainer = root.createDiv({ cls: "code-dashboard-header-container" });
		
		// Title Group (Title + Buttons)
		const titleGroup = headerContainer.createDiv({ cls: "code-dashboard-title-group" });
		titleGroup.createEl("h1", { text: t('VIEW_TITLE') });

		// Settings Button
		new ButtonComponent(titleGroup)
			.setIcon("settings")
			.setTooltip(t('BUTTON_OPEN_SETTINGS'))
			.setClass("clickable-icon")
			.onClick((e) => {
				e.stopPropagation();
				type AppWithSetting = App & { setting: { open(): void; openTabById(id: string): void } };
				const appWithSetting = this.app as unknown as AppWithSetting;
				appWithSetting.setting.open();
				appWithSetting.setting.openTabById("code-space");
			});

		// Create File Button
		new ButtonComponent(titleGroup)
			.setIcon("plus-circle")
			.setTooltip(t('BUTTON_CREATE_FILE'))
			.setClass("clickable-icon")
			.onClick((e) => {
				e.stopPropagation();
				type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
				const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
				if (plugin) {
					plugin.createCodeFile();
				}
			});

		const codeExtensions = this.getManagedExtensions();
		let files = this.app.vault.getFiles().filter(f => codeExtensions.includes(f.extension.toLowerCase()));

		headerContainer.createEl("p", { text: `${files.length} ${t('SUBTITLE_MANAGED_FILES')}`, cls: "code-dashboard-subtitle" });

		// Toolbar
		const toolbar = root.createDiv({ cls: "code-dashboard-toolbar" });

		// 2. Search (Note: Removed Settings button from here)
		const searchContainer = toolbar.createDiv({ cls: "code-search-box" });
		const searchIcon = searchContainer.createDiv({ cls: "code-search-icon" });
		setIcon(searchIcon, "search");

		new TextComponent(searchContainer)
			.setPlaceholder(t('TOOLBAR_SEARCH_PLACEHOLDER'))
			.setValue(this.state.searchQuery)
			.onChange((value) => {
				this.state.searchQuery = value;
				this.refreshFileList(fileListContainer, files);
			});

		// 3. Filter
		const existingExts = [...new Set(files.map(f => f.extension))].sort();
		const filterContainer = toolbar.createDiv({ cls: "custom-dropdown-wrapper" });
		const filterDropdown = new CustomDropdown(filterContainer);
		filterDropdown.addOption("all", t('TOOLBAR_FILTER_ALL'));
		existingExts.forEach(ext => filterDropdown.addOption(ext, ext.toUpperCase()));
		filterDropdown.setValue(this.state.filterExt);
		filterDropdown.onChange((value: string) => {
			this.state.filterExt = value;
			this.refreshFileList(fileListContainer, files);
		});

		// 4. Sort
		const sortContainer = toolbar.createDiv({ cls: "custom-dropdown-wrapper" });
		const sortDropdown = new CustomDropdown(sortContainer);
		sortDropdown.addOption("date", t('TOOLBAR_SORT_DATE'));
		sortDropdown.addOption("name", t('TOOLBAR_SORT_NAME'));
		sortDropdown.addOption("type", t('TOOLBAR_SORT_TYPE'));
		sortDropdown.setValue(this.state.sortBy);
		sortDropdown.onChange((value: string) => {
			this.state.sortBy = value as 'date' | 'name' | 'type';
			this.refreshFileList(fileListContainer, files);
		});

		// 5. Sort Order
		const sortBtn = new ButtonComponent(toolbar)
			.setIcon(this.state.sortDesc ? "arrow-down-narrow-wide" : "arrow-up-narrow-wide")
			.setTooltip(t('TOOLBAR_SORT_TOGGLE'))
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
			empty.createDiv({ text: t('EMPTY_STATE_NO_FILES') });
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

			item.addEventListener("click", () => {
				void this.openFile(file);
			});
			item.addEventListener("contextmenu", (e) => this.showContextMenu(e, file));
		});
	}

	showContextMenu(event: MouseEvent, file: TFile) {
		const menu = new Menu();

		// Rename
		menu.addItem((item) => item.setTitle(t('MENU_RENAME')).setIcon("pencil").onClick(() => {
			new RenameModal(
				this.app,
				t('MODAL_RENAME_TITLE'),
				t('MODAL_RENAME_PLACEHOLDER'),
				file.basename,
				(newName: string) => void (async () => {
					try {
						const newPath = file.parent?.path === "/" ?
							`/${newName}.${file.extension}` :
							`${file.parent?.path}/${newName}.${file.extension}`;
						await this.app.fileManager.renameFile(file, newPath);
						new Notice(`${t('NOTICE_RENAME_SUCCESS')} ${newName}.${file.extension}`);
						this.render(true);
					} catch (error) {
						console.error("Failed to rename file:", error);
						new Notice(t('NOTICE_RENAME_FAIL'));
					}
				})()
			).open();
		}));

		// Move file to - 使用文件夹选择器
		menu.addItem((item) => item.setTitle(t('MENU_MOVE')).setIcon("folder-input").onClick(() => {
			new FolderSuggestModal(
				this.app,
				(folderPath: string) => void (async () => {
					try {
						const newPath = folderPath === "/" ?
							`/${file.name}` :
							`${folderPath}/${file.name}`;
						await this.app.fileManager.renameFile(file, newPath);
						new Notice(`${t('NOTICE_MOVE_SUCCESS')} ${newPath}`);
						this.render(true);
					} catch (error) {
						console.error("Failed to move file:", error);
						new Notice(t('NOTICE_MOVE_FAIL'));
					}
				})()
			).open();
		}));

		menu.addSeparator();

		menu.addItem((item) => item.setTitle(t('MENU_OPEN_DEFAULT')).setIcon("external-link").onClick(() => {
			type AppWithOpen = App & { openWithDefaultApp(path: string): void };
			(this.app as unknown as AppWithOpen).openWithDefaultApp(file.path);
		}));

		menu.addItem((item) => item.setTitle(t('MENU_REVEAL')).setIcon("folder-open").onClick(() => {
			const leaf = this.app.workspace.getLeavesOfType("file-explorer")[0];
			if (leaf) {
				void this.app.workspace.revealLeaf(leaf);
				type ViewWithReveal = { revealInFolder(file: TFile): void };
				(leaf.view as unknown as ViewWithReveal).revealInFolder(file);
			}
		}));

		menu.addSeparator();

		menu.addItem((item) => item.setTitle(t('MENU_DELETE')).setIcon("trash").setWarning(true).onClick(async () => {
			try {
				await this.app.fileManager.trashFile(file);
				this.render(true);
			} catch (error) {
				console.error("Failed to delete file:", error);
			}
		}));

		menu.showAtPosition({ x: event.pageX, y: event.pageY });
	}

	async openFile(file: TFile) {
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

		const ext = file.extension.toLowerCase();
		const leaf = this.app.workspace.getLeaf(true);

		if (nativeBinaryExtensions.includes(ext)) {
			// 二进制文件：直接用 Obsidian 默认方式打开
			await leaf.openFile(file);
		} else {
			// 代码文件：强制用 Code Space 打开
			await leaf.setViewState({
				type: "code-space-view",
				active: true,
				state: { file: file.path }
			});
			
			// 更新侧边栏大纲
			type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
			const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
			if (plugin) {
				await plugin.updateOutline(file);
			}
		}
		
		await this.app.workspace.revealLeaf(leaf);
	}
}
