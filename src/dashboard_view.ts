// SPDX-License-Identifier: AGPL-3.0-or-later
// Code Space - professional code file support for Obsidian.
// Copyright (C) 2026 unlinearity
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import { ItemView, WorkspaceLeaf, TAbstractFile, TFile, TFolder, setIcon, moment, Menu, TextComponent, ButtonComponent, Modal, Notice, SuggestModal, App, debounce } from "obsidian";
import CodeSpacePlugin from "./main"; // 导入插件类型
import { CustomDropdown, MultiSelectDropdown } from "./dropdown";
import { FolderFilterModal } from "./folder_filter_modal";
import { t } from "./lang/helpers";
import { DashboardState } from "./settings";
import { DashboardFileIndex, DashboardFileRecord } from "./dashboard_file_index";
import { DashboardVirtualGrid } from "./dashboard_virtual_grid";

type MomentFactory = (value: number) => { fromNow(): string };

function formatRelativeTime(timestamp: number): string {
	const createMoment = moment as unknown as MomentFactory;
	return createMoment(timestamp).fromNow();
}

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
		window.setTimeout(() => input.inputEl.focus(), 10);
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

	onChooseSuggestion(folder: string, _evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(folder);
	}
}

export const VIEW_TYPE_CODE_DASHBOARD = "code-space-dashboard";

export class CodeDashboardView extends ItemView {
	plugin: CodeSpacePlugin; 
	state: DashboardState;
	private activeDropdowns: Array<CustomDropdown | MultiSelectDropdown> = [];
	private refreshPending = false;
	private fileItems = new Map<string, HTMLElement>();
	private fileIndex: DashboardFileIndex | null = null;
	private visibleRecords: DashboardFileRecord[] = [];
	private virtualGrid: DashboardVirtualGrid<DashboardFileRecord> | null = null;
	private subtitleEl: HTMLElement | null = null;
	private folderFilterButton: ButtonComponent | null = null;
	private extensionFilterDropdown: MultiSelectDropdown | null = null;
	private applySearch = debounce(() => this.applyCurrentView(true), 100, true);
	private scheduleStructureRefresh = debounce(() => {
		if (!this.containerEl.isShown()) {
			this.refreshPending = true;
			return;
		}
		this.updateAvailableFilters();
		this.updateSubtitle();
		this.applyCurrentView(false);
	}, 100, true);

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		// Default state
		this.state = {
			searchQuery: "",
			filterExt: [],
			filterFolder: [],
			sortBy: "date",
			sortDesc: true
		};
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

		// Get plugin instance to access settings
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
		const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
		if (plugin) {
			this.plugin = plugin;
			// Load saved state if available
			if (this.plugin.settings && this.plugin.settings.dashboardState) {
				// Merge saved state with defaults to ensure all fields exist
				this.state = { ...this.state, ...this.plugin.settings.dashboardState };
			}
		}

		this.render();
		this.registerEvent(this.app.vault.on("create", (file) => {
			if (file instanceof TFile) this.handleFileCreated(file);
		}));
		this.registerEvent(this.app.vault.on("delete", (file) => this.handleFileDeleted(file)));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.handleFileRenamed(file, oldPath)));
		this.registerEvent(this.app.vault.on("modify", (file) => {
			if (file instanceof TFile) this.handleManagedFileModify(file);
		}));
		this.registerEvent(this.app.workspace.on("active-leaf-change", () => {
			if (this.refreshPending && this.containerEl.isShown()) {
				this.refreshPending = false;
				this.updateAvailableFilters();
				this.updateSubtitle();
				this.applyCurrentView(false);
			}
		}));
	}

	async onClose(): Promise<void> {
		this.applySearch.cancel();
		this.scheduleStructureRefresh.cancel();
		this.saveState.cancel();
		this.virtualGrid?.destroy();
		this.virtualGrid = null;
		this.destroyDropdowns();
		this.fileIndex = null;
		this.visibleRecords = [];
		this.fileItems.clear();
	}

	// Persist state to settings with debounce to avoid excessive file writes
	saveState = debounce(async () => {
		if (this.plugin) {
			this.plugin.settings.dashboardState = { ...this.state };
			await this.plugin.saveDashboardState();
		}
	}, 500, true);

	// 获取配置的后缀列表
	getManagedExtensions(): string[] {
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
		const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
		if (plugin && plugin.settings) {
			return plugin.settings.extensions.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
		}
		return ['py', 'js', 'c', 'cpp'];
	}

	private destroyDropdowns(): void {
		for (const dropdown of this.activeDropdowns) {
			dropdown.destroy();
		}
		this.activeDropdowns = [];
	}

	private handleManagedFileModify(file: TFile): void {
		const record = this.fileIndex?.upsert(file);
		if (!record) return;
		if (!this.containerEl.isShown()) {
			this.refreshPending = true;
			return;
		}

		if (this.state.sortBy === "date" && this.visibleRecords.some((candidate) => candidate.path === record.path)) {
			this.visibleRecords = this.fileIndex?.reposition(this.visibleRecords, record, this.state) ?? this.visibleRecords;
			this.virtualGrid?.setItems(this.visibleRecords, false);
			return;
		}

		const timeEl = this.fileItems.get(file.path)?.querySelector<HTMLElement>(".code-file-time");
		timeEl?.setText(formatRelativeTime(record.mtime));
	}

	private handleFileCreated(file: TFile): void {
		this.fileIndex?.upsert(file);
		this.handleIndexStructureChanged();
	}

	private handleFileDeleted(file: TAbstractFile): void {
		if (file instanceof TFile) {
			this.fileIndex?.remove(file.path);
		} else if (file instanceof TFolder) {
			this.fileIndex?.removePrefix(file.path);
		}
		this.handleIndexStructureChanged();
	}

	private handleFileRenamed(file: TAbstractFile, oldPath: string): void {
		if (file instanceof TFile) {
			this.fileIndex?.remove(oldPath);
			this.fileIndex?.upsert(file);
		} else if (file instanceof TFolder) {
			this.rebuildFileIndex();
		}
		this.handleIndexStructureChanged();
	}

	private handleIndexStructureChanged(): void {
		this.scheduleStructureRefresh();
	}

	private rebuildFileIndex(): void {
		const index = new DashboardFileIndex({
			extensions: this.getManagedExtensions(),
			ignoredPaths: this.plugin?.getIgnoredFiles() ?? [],
			externalMountPaths: (this.plugin?.settings.externalMounts ?? []).map((mount) => mount.mountPath),
		});
		index.rebuild(this.app.vault.getFiles());
		this.fileIndex = index;
	}

	private updateSubtitle(): void {
		this.subtitleEl?.setText(`${this.fileIndex?.size ?? 0} ${t('SUBTITLE_MANAGED_FILES')}`);
	}

	private updateAvailableFilters(): void {
		const folders = this.fileIndex?.getFolders() ?? [];
		const folderSet = new Set(folders);
		this.state.filterFolder = this.state.filterFolder.filter((folder) => folderSet.has(folder));
		this.folderFilterButton?.setButtonText(this.getFolderFilterLabel());

		const extensions = this.fileIndex?.getExtensions() ?? [];
		const extensionSet = new Set(extensions);
		this.state.filterExt = this.state.filterExt.filter((extension) => extensionSet.has(extension));
		this.extensionFilterDropdown?.setOptions(extensions.map((extension) => [extension, extension.toUpperCase()]));
		this.extensionFilterDropdown?.setValues(this.state.filterExt);
	}

	private getFolderFilterLabel(): string {
		const selectedCount = this.state.filterFolder.length;
		return selectedCount === 0
			? t('TOOLBAR_FILTER_FOLDER_ALL')
			: `${t('TOOLBAR_FILTER_FOLDER_LABEL')} (${selectedCount})`;
	}

	private applyCurrentView(resetScroll: boolean): void {
		if (!this.fileIndex || !this.virtualGrid) return;
		this.visibleRecords = this.fileIndex.derive(this.state);
		this.virtualGrid.setItems(this.visibleRecords, resetScroll);
	}

	render(_keepState = false) {
		this.applySearch.cancel();
		this.scheduleStructureRefresh.cancel();
		this.virtualGrid?.destroy();
		this.virtualGrid = null;
		this.destroyDropdowns();
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();
		this.rebuildFileIndex();

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

		new ButtonComponent(titleGroup)
			.setIcon("eye-off")
			.setTooltip(t("BUTTON_MANAGE_IGNORED_FILES"))
			.setClass("clickable-icon")
			.onClick((e) => {
				e.stopPropagation();
				if (this.plugin) {
					void this.plugin.openIgnoreManager();
				}
			});

		this.subtitleEl = headerContainer.createEl("p", {
			text: `${this.fileIndex?.size ?? 0} ${t('SUBTITLE_MANAGED_FILES')}`,
			cls: "code-dashboard-subtitle"
		});

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
				this.saveState();
				this.applySearch();
			});

		const normalizeFilterValues = (value: unknown): string[] => {
			if (!value) return [];
			if (Array.isArray(value)) {
				const values = value as unknown[];
				return values.filter((item): item is string => typeof item === "string");
			}
			if (typeof value === "string") {
				if (value === "all") return [];
				return [value];
			}
			return [];
		};

		this.state.filterFolder = normalizeFilterValues(this.state.filterFolder);
		this.state.filterExt = normalizeFilterValues(this.state.filterExt);

		// 3. Folder Filter
		const folderFilterContainer = toolbar.createDiv({ cls: "custom-dropdown-wrapper" });
		this.folderFilterButton = new ButtonComponent(folderFilterContainer)
			.setButtonText(this.getFolderFilterLabel())
			.setTooltip(t('TOOLBAR_FILTER_FOLDER_BUTTON'))
			.setClass("code-folder-filter-button")
			.onClick(() => {
				const folderPaths = this.fileIndex?.getFolders() ?? [];
				new FolderFilterModal(this.app, folderPaths, this.state.filterFolder, (values) => {
					const availableFolderSet = new Set(folderPaths);
					this.state.filterFolder = values.filter((value) => availableFolderSet.has(value));
					this.saveState();
					this.folderFilterButton?.setButtonText(this.getFolderFilterLabel());
					this.applyCurrentView(true);
				}).open();
			});
		const availableFolderSet = new Set(this.fileIndex?.getFolders() ?? []);
		this.state.filterFolder = this.state.filterFolder.filter((value) => availableFolderSet.has(value));
		this.folderFilterButton.setButtonText(this.getFolderFilterLabel());

		// 4. Filter
		const existingExts = this.fileIndex?.getExtensions() ?? [];
		const filterContainer = toolbar.createDiv({ cls: "custom-dropdown-wrapper" });
		this.extensionFilterDropdown = new MultiSelectDropdown(filterContainer, {
			emptyLabel: t('TOOLBAR_FILTER_ALL'),
			countLabel: (count) => `${t('TOOLBAR_FILTER_EXTENSION_LABEL')} (${count})`,
			clearLabel: t('TOOLBAR_FILTER_CLEAR')
		});
		this.activeDropdowns.push(this.extensionFilterDropdown);
		this.extensionFilterDropdown.setOptions(existingExts.map((extension) => [extension, extension.toUpperCase()]));
		const availableExtSet = new Set(existingExts);
		const normalizedExts = this.state.filterExt.filter((value) => availableExtSet.has(value));
		this.state.filterExt = normalizedExts;
		this.extensionFilterDropdown.setValues(normalizedExts);
		this.extensionFilterDropdown.onChange((values: string[]) => {
			this.state.filterExt = values;
			this.saveState();
			this.applyCurrentView(true);
		});

		// 5. Sort
		const sortContainer = toolbar.createDiv({ cls: "custom-dropdown-wrapper" });
		const sortDropdown = new CustomDropdown(sortContainer);
		this.activeDropdowns.push(sortDropdown);
		sortDropdown.addOption("date", t('TOOLBAR_SORT_DATE'));
		sortDropdown.addOption("name", t('TOOLBAR_SORT_NAME'));
		sortDropdown.addOption("type", t('TOOLBAR_SORT_TYPE'));
		sortDropdown.setValue(this.state.sortBy);
		sortDropdown.onChange((value: string) => {
			this.state.sortBy = value as 'date' | 'name' | 'type';
			this.saveState();
			this.applyCurrentView(true);
		});

		// 6. Sort Order
		const sortBtn = new ButtonComponent(toolbar)
			.setIcon(this.state.sortDesc ? "arrow-down-narrow-wide" : "arrow-up-narrow-wide")
			.setTooltip(t('TOOLBAR_SORT_TOGGLE'))
			.onClick(() => {
				this.state.sortDesc = !this.state.sortDesc;
				this.saveState();
				sortBtn.setIcon(this.state.sortDesc ? "arrow-down-narrow-wide" : "arrow-up-narrow-wide");
				this.applyCurrentView(true);
			});

		// List Container
		const fileListContainer = root.createDiv({ cls: "code-file-list-container" });
		this.virtualGrid = new DashboardVirtualGrid({
			scrollEl: root,
			containerEl: fileListContainer,
			onBeforeRender: () => this.fileItems.clear(),
			renderItem: (parent, record) => this.renderFileItem(parent, record),
			renderEmpty: (parent) => this.renderEmptyState(parent),
		});
		this.applyCurrentView(false);
	}

	private renderEmptyState(parent: HTMLElement): void {
		const empty = parent.createDiv({ cls: "code-empty-state" });
		setIcon(empty.createDiv({ cls: "code-empty-icon" }), "search-x");
		empty.createDiv({ text: t('EMPTY_STATE_NO_FILES') });
	}

	private renderFileItem(parent: HTMLElement, record: DashboardFileRecord): void {
		const file = record.file;
		const item = parent.createDiv({ cls: "code-file-item" });
		this.fileItems.set(record.path, item);
		if (record.isExternal) {
			item.addClass("code-file-item-external");
		}

		const iconBox = item.createDiv({ cls: "code-file-icon-box" });
		setIcon(iconBox, "file-code");

		const info = item.createDiv({ cls: "code-file-info" });
		const nameEl = info.createDiv({ cls: "code-file-name", text: record.name });
		nameEl.setAttr("title", record.name);
		const pathText = record.folderPath === "/" ? "" : record.folderPath;
		const pathEl = info.createDiv({ cls: "code-file-path", text: pathText });
		if (pathText) {
			pathEl.setAttr("title", pathText);
		}

		const meta = item.createDiv({ cls: "code-file-meta" });
		const tagRow = meta.createDiv({ cls: "code-file-tag-row" });
		tagRow.createDiv({ cls: "code-file-tag", text: record.extension.toUpperCase() });
		if (record.isExternal) {
			const externalBadge = tagRow.createDiv({ cls: "code-file-external-badge" });
			externalBadge.setAttr("title", t("TAG_EXTERNAL_MOUNT"));
			setIcon(externalBadge, "link");
		}
		meta.createDiv({ cls: "code-file-time", text: formatRelativeTime(record.mtime) });

		item.addEventListener("click", () => {
			void this.openFile(file);
		});
		item.addEventListener("contextmenu", (event) => this.showContextMenu(event, file));
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

		menu.addItem((item) => item.setTitle(t("MENU_IGNORE_FILE")).setIcon("eye-off").onClick(() => {
			if (!this.plugin) {
				return;
			}

			void (async () => {
				const changed = await this.plugin.ignoreFile(file);
				if (changed) {
					new Notice(t("NOTICE_IGNORE_SUCCESS"));
				}
			})();
		}));

		const parentFolder = file.parent;
		if (parentFolder && parentFolder.path !== "/") {
			menu.addItem((item) => item.setTitle(t("MENU_IGNORE_FOLDER")).setIcon("folder-x").onClick(() => {
				if (!this.plugin) {
					return;
				}

				void (async () => {
					const changed = await this.plugin.ignoreFile(parentFolder);
					if (changed) {
						new Notice(t("NOTICE_IGNORE_FOLDER_SUCCESS"));
					}
				})();
			}));
		}

		menu.addItem((item) => item.setTitle(t('MENU_DELETE')).setIcon("trash").setWarning(true).onClick(async () => {
			try {
				await this.app.fileManager.trashFile(file);
			} catch (error) {
				console.error("Failed to delete file:", error);
			}
		}));

		menu.showAtPosition({ x: event.pageX, y: event.pageY });
	}

	async openFile(file: TFile) {
		if (this.plugin) {
			await this.plugin.openManagedFile(file);
			return;
		}
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
