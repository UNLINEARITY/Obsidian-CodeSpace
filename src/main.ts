import { Plugin, WorkspaceLeaf, Modal, Notice, TextComponent, ButtonComponent, App, TFile, TFolder, normalizePath, Platform } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";
import { CodeOutlineView, VIEW_TYPE_CODE_OUTLINE } from "./outline_view";
import { IgnoreManagerModal } from "./ignore_manager_modal";
import { CodeSpaceSettings, CodeSpaceSettingTab, FolderSuggestModal, normalizeCodeSpaceSettings } from "./settings";
import { refreshAllCodeEmbeds, registerCodeEmbedProcessor } from "./code_embed";
import { registerNativePdfExportPatch } from "./native_pdf_export_patch";
import { TerminalManager } from "./terminal/session_manager";
import { CodeTerminalView, VIEW_TYPE_CODE_TERMINAL } from "./terminal/terminal_view";
import { t } from "./lang/helpers";

// 文件创建模态框
class CreateCodeFileModal extends Modal {
	private result: string | null = null;
	private onSubmit: (result: string) => void;
	private currentPath: string;
	private folderBtn: ButtonComponent;

	constructor(app: App, basePath: string, onSubmit: (result: string) => void) {
		super(app);
		this.currentPath = basePath;
		this.onSubmit = onSubmit;
		this.setTitle(t('MODAL_CREATE_TITLE'));

		// Input Group Container
		const inputGroup = this.contentEl.createDiv({ cls: "create-file-input-group" });

		// Filename Input
		const nameInput = new TextComponent(inputGroup);
		nameInput.setPlaceholder("Example: script.py");
		nameInput.inputEl.addClass("create-file-filename-input");

		// Folder Selection Button
		this.folderBtn = new ButtonComponent(inputGroup);
		this.updateButtonText();
		this.folderBtn.setTooltip(t('SETTINGS_NEW_FILE_LOCATION_BUTTON'));
		this.folderBtn.onClick(() => {
			new FolderSuggestModal(this.app, (folder) => {
				this.currentPath = folder.path;
				this.updateButtonText();
			}).open();
		});

		// Description
		this.contentEl.createDiv({
			text: t('MODAL_CREATE_DESC'),
			cls: "setting-item-description"
		});

		// 按钮容器
		const buttonContainer = this.contentEl.createDiv({ cls: "modal-button-container" });

		const submitBtn = new ButtonComponent(buttonContainer);
		submitBtn.setButtonText(t('MODAL_CREATE_BUTTON_SUBMIT'));
		submitBtn.setCta();
		submitBtn.onClick(() => {
			this.submit(nameInput.getValue());
		});

		const cancelBtn = new ButtonComponent(buttonContainer);
		cancelBtn.setButtonText(t('MODAL_CREATE_BUTTON_CANCEL'));
		cancelBtn.onClick(() => {
			this.close();
		});

		// 聚焦到输入框
		window.setTimeout(() => nameInput.inputEl.focus(), 10);

		// 支持回车确认
		nameInput.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				e.stopPropagation();
				this.submit(nameInput.getValue());
			}
		});
	}

	private updateButtonText() {
		// Show "/" for root, otherwise folder path
		const text = this.currentPath ? this.currentPath : "/";
		this.folderBtn.setButtonText(text);
	}

	private submit(value: string) {
		const fileName = value.trim();
		if (fileName) {
			let fullPath = "";
			// 如果用户输入了包含斜杠的路径，则忽略默认位置，直接使用用户输入的路径
			if (fileName.includes("/")) {
				fullPath = normalizePath(fileName);
			} else {
				// 否则使用选中的位置 + 文件名
				fullPath = normalizePath(this.currentPath + "/" + fileName);
			}
			this.result = fullPath;
			this.close();
		} else {
			new Notice("Please enter a file name");
		}
	}

	onClose() {
		super.onClose();
		if (this.result !== null) {
			this.onSubmit(this.result);
		}
	}
}

export default class CodeSpacePlugin extends Plugin {
	settings: CodeSpaceSettings;
	terminalManager: TerminalManager | null = null;
	private registeredExtensions: string[] = [];

	async onload() {
		console.debug("Code Space: Plugin loading...");
		await this.loadSettings();
		
		// Apply CSS variables for embed font size
		this.updateCSSVariables();

		this.addSettingTab(new CodeSpaceSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_CODE_SPACE,
			(leaf) => new CodeSpaceView(leaf)
		);

		this.registerView(
			VIEW_TYPE_CODE_DASHBOARD,
			(leaf) => new CodeDashboardView(leaf)
		);

		this.registerView(
			VIEW_TYPE_CODE_OUTLINE,
			(leaf) => new CodeOutlineView(leaf)
		);

		// 终端会话管理器与独立终端视图（仅桌面端创建）
		if (Platform.isDesktopApp) {
			this.terminalManager = new TerminalManager({
				settings: this.settings,
				app: this.app,
				manifestDir: this.manifest.dir ?? this.manifest.id,
			});
			// 完成上次会话遗留的待清理移除（此时 native 模块尚未加载，删除不会被锁定）
			this.terminalManager.binaryManager.cleanupPendingRemoval();
			this.registerView(
				VIEW_TYPE_CODE_TERMINAL,
				(leaf) => new CodeTerminalView(leaf)
			);
		}

		this.registerCodeExtensions();

		console.debug("Code Space: About to register code embed processor...");
		// Register code embed processor
		registerCodeEmbedProcessor(this);
		registerNativePdfExportPatch(this);
		console.debug("Code Space: Code embed processor registered");

		this.registerEvent(this.app.workspace.on("window-open", () => {
			this.updateCSSVariables();
		}));

		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			if (file instanceof TFile || file instanceof TFolder) {
				void this.handleIgnoredPathRename(file, oldPath);
			}
		}));

		this.registerEvent(this.app.vault.on("delete", (file) => {
			if (file instanceof TFile || file instanceof TFolder) {
				void this.handleIgnoredPathDelete(file);
			}
		}));

		this.addRibbonIcon('code-glyph', t('RIBBON_OPEN_DASHBOARD'), () => {
			void this.activateDashboard();
		});

		this.addCommand({
			id: 'open-dashboard',
			name: t('CMD_OPEN_DASHBOARD'),
			callback: () => {
				void this.activateDashboard();
			}
		});

		this.addCommand({
			id: 'create-code-file',
			name: t('CMD_CREATE_FILE'),
			callback: () => {
				this.createCodeFile();
			}
		});

		this.addCommand({
			id: 'reload-plugin',
			name: t('CMD_RELOAD_PLUGIN'),
			callback: async () => {
				await this.reloadPlugin();
			}
		});

		this.addCommand({
			id: 'toggle-outline',
			name: t('CMD_TOGGLE_OUTLINE'),
			callback: () => {
				void this.toggleOutline();
			}
		});

		// 添加代码编辑器搜索和替换命令（开关模式）
		this.addCommand({
			id: 'toggle-code-search',
			name: t('CMD_SEARCH_REPLACE'),
			checkCallback: (checking: boolean) => {
				// 检查当前是否有活动的 CodeSpaceView
				const activeView = this.app.workspace.getActiveViewOfType(CodeSpaceView);
				if (activeView) {
					if (!checking) {
						// 切换自定义搜索面板
						activeView.toggleSearchPanel();
					}
					return true;
				}
				return false;
			}
		});

		// 打开独立终端视图（桌面端、已启用且支持文件就绪时才显示）
		this.addCommand({
			id: 'open-terminal',
			name: t('CMD_OPEN_TERMINAL'),
			checkCallback: (checking: boolean) => {
				if (!Platform.isDesktopApp || !this.settings.terminalEnabled) {
					return false;
				}
				if (!this.terminalManager?.binaryManager.checkInstalledSync()) {
					return false;
				}
				if (!checking) {
					void this.activateTerminalView();
				}
				return true;
			}
		});

		// 切换当前代码编辑器中的内嵌终端面板
		this.addCommand({
			id: 'toggle-terminal-panel',
			name: t('CMD_TOGGLE_TERMINAL_PANEL'),
			checkCallback: (checking: boolean) => {
				if (!Platform.isDesktopApp || !this.settings.terminalEnabled) {
					return false;
				}
				if (!this.terminalManager?.binaryManager.checkInstalledSync()) {
					return false;
				}
				const activeView = this.app.workspace.getActiveViewOfType(CodeSpaceView);
				if (!activeView) {
					return false;
				}
				if (!checking) {
					void activeView.toggleTerminalPanel();
				}
				return true;
			}
		});

		// 关闭所有终端会话（启用且存在会话时才显示）
		this.addCommand({
			id: 'kill-all-terminals',
			name: t('CMD_KILL_TERMININALS'),
			checkCallback: (checking: boolean) => {
				if (!Platform.isDesktopApp || !this.settings.terminalEnabled) {
					return false;
				}
				const manager = this.terminalManager;
				if (!manager || manager.totalSessionCount === 0) {
					return false;
				}
				if (!checking) {
					manager.killAll();
					new Notice(t('TERMINAL_NOTICE_ALL_CLOSED'));
				}
				return true;
			}
		});

		console.debug("Code Space: Plugin fully loaded");

		// Automatically create the outline view in the right sidebar when layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.updateCSSVariables();
			//void this.activateOutlineInSidebar();
		});
	}

	async reloadPlugin() {
		const pluginId = 'code-space';

		try {
			console.debug(`Code Space: Reloading plugin...`);
			new Notice(t('NOTICE_RELOAD_START'), 2000);

			// 获取插件管理器
			type AppWithPlugins = App & { plugins: { disablePlugin(id: string): Promise<void>; enablePlugin(id: string): Promise<void> } };
			const plugins = (this.app as unknown as AppWithPlugins).plugins;

			// 禁用插件
			await plugins.disablePlugin(pluginId);
			console.debug(`Code Space: Plugin disabled`);

			// 启用插件
			await plugins.enablePlugin(pluginId);
			console.debug(`Code Space: Plugin enabled`);

			new Notice(t('NOTICE_RELOAD_SUCCESS'), 3000);
		} catch (error) {
			console.error('Code Space: Failed to reload plugin:', error);
			new Notice(`${t('NOTICE_RELOAD_FAIL')}: ${String(error)}`, 5000);
		}
	}

	registerCodeExtensions() {
		// Obsidian 原生支持的二进制文件类型列表
		// 这些文件类型应该使用 Obsidian 的原生查看器，而不是 Code Space
		const binaryExtensions = [
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

		const exts = this.settings.extensions
			.split(',')
			.map(s => s.trim())
			.filter(s => s.length > 0)
			.filter(ext => !binaryExtensions.includes(ext.toLowerCase())); // 过滤掉二进制文件扩展名

		if (exts.length === this.registeredExtensions.length && exts.every((ext, index) => ext === this.registeredExtensions[index])) {
			return;
		}

		try {
			if (this.registeredExtensions.length > 0) {
				type AppWithViewRegistry = App & {
					viewRegistry?: { unregisterExtensions(extensions: string[]): void };
				};
				const viewRegistry = (this.app as AppWithViewRegistry).viewRegistry;
				if (viewRegistry?.unregisterExtensions) {
					viewRegistry.unregisterExtensions(this.registeredExtensions);
				}
			}
			this.registerExtensions(exts, VIEW_TYPE_CODE_SPACE);
			this.registeredExtensions = exts;
		} catch (e) {
			console.debug("Code Space extension registration warning:", e);
		}
	}

	onunload() {
		// 终止全部终端会话（杀掉 PTY 进程）
		this.terminalManager?.dispose();
		this.terminalManager = null;

		// 插件卸载时保存所有打开的 Code Space 编辑器（不阻塞卸载流程）
		const { workspace } = this.app;
		const codeLeaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_SPACE);
		for (const leaf of codeLeaves) {
			if (leaf.view instanceof CodeSpaceView) {
				void leaf.view.save();
			}
		}

		// 卸载时清理大纲视图，防止重载插件时重复创建
		const outlineLeaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE);
		outlineLeaves.forEach(leaf => leaf.detach());
	}

	async loadSettings() {
		this.settings = normalizeCodeSpaceSettings(await this.loadData());
		this.settings.ignoredFiles = this.normalizeIgnoredFiles(this.settings.ignoredFiles);
	}

	async saveSettings(scope: "all" | "extensions" | "editor" | "embed" | "dashboard" | "terminal" | "none" = "all") {
		await this.saveData(this.settings);

		if (scope === "all" || scope === "embed") {
			this.updateCSSVariables();
			refreshAllCodeEmbeds(this);
		}
		if (scope === "all" || scope === "extensions") {
			this.registerCodeExtensions();
		}
		if (scope === "all" || scope === "extensions" || scope === "dashboard") {
			this.refreshDashboardViews();
		}
		if (scope === "all" || scope === "editor") {
			const editorLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_SPACE);
			editorLeaves.forEach(leaf => {
				if (leaf.view instanceof CodeSpaceView) {
					leaf.view.refreshSettings();
				}
			});
		}
		if (scope === "all" || scope === "terminal") {
			this.terminalManager?.applySettings(this.settings);
		}
	}

	async saveDashboardState() {
		await this.saveData(this.settings);
	}

	getIgnoredFiles(): string[] {
		return [...this.settings.ignoredFiles];
	}

	isIgnoredFile(fileOrPath: TFile | TFolder | string): boolean {
		const path = typeof fileOrPath === "string" ? fileOrPath : fileOrPath.path;
		const normalizedPath = this.normalizeIgnoredPath(path);
		if (!normalizedPath) {
			return false;
		}

		return this.settings.ignoredFiles.some((ignoredPath) =>
			this.isIgnoredPathMatch(normalizedPath, ignoredPath)
		);
	}

	async ignoreFile(fileOrPath: TFile | TFolder | string): Promise<boolean> {
		const normalizedPath = this.normalizeIgnoredPath(typeof fileOrPath === "string" ? fileOrPath : fileOrPath.path);
		if (!normalizedPath || this.settings.ignoredFiles.includes(normalizedPath)) {
			return false;
		}

		this.settings.ignoredFiles = this.normalizeIgnoredFiles([...this.settings.ignoredFiles, normalizedPath]);
		await this.persistIgnoredFiles();
		return true;
	}

	async unignoreFile(fileOrPath: TFile | TFolder | string): Promise<boolean> {
		const normalizedPath = this.normalizeIgnoredPath(typeof fileOrPath === "string" ? fileOrPath : fileOrPath.path);
		if (!normalizedPath || !this.settings.ignoredFiles.includes(normalizedPath)) {
			return false;
		}

		this.settings.ignoredFiles = this.settings.ignoredFiles.filter((path) => path !== normalizedPath);
		await this.persistIgnoredFiles();
		return true;
	}

	async pruneIgnoredFiles(): Promise<boolean> {
		const filtered = this.settings.ignoredFiles.filter((path) => {
			const file = this.app.vault.getAbstractFileByPath(path);
			return file instanceof TFile || file instanceof TFolder;
		});
		if (filtered.length === this.settings.ignoredFiles.length) {
			return false;
		}

		this.settings.ignoredFiles = this.normalizeIgnoredFiles(filtered);
		await this.persistIgnoredFiles();
		return true;
	}

	async openIgnoreManager() {
		await this.pruneIgnoredFiles();
		new IgnoreManagerModal(this.app, this).open();
	}

	async openManagedFile(file: TFile): Promise<void> {
		const nativeBinaryExtensions = [
			'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'psd',
			'pdf',
			'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
			'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
			'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
			'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
			'exe', 'dll', 'so', 'dylib', 'bin', 'dat'
		];

		const ext = file.extension.toLowerCase();
		const leaf = this.app.workspace.getLeaf(true);

		if (nativeBinaryExtensions.includes(ext)) {
			await leaf.openFile(file);
		} else {
			await leaf.setViewState({
				type: VIEW_TYPE_CODE_SPACE,
				active: true,
				state: { file: file.path }
			});

			await this.updateOutline(file);
		}

		await this.app.workspace.revealLeaf(leaf);
	}

	private async handleIgnoredPathRename(file: TFile | TFolder, oldPath: string): Promise<void> {
		const normalizedOldPath = this.normalizeIgnoredPath(oldPath);
		const normalizedNewPath = this.normalizeIgnoredPath(file.path);
		let changed = false;
		const updatedPaths = this.settings.ignoredFiles.map((path) => {
			if (path === normalizedOldPath) {
				changed = true;
				return normalizedNewPath;
			}

			if (file instanceof TFolder && path.startsWith(`${normalizedOldPath}/`)) {
				changed = true;
				return `${normalizedNewPath}/${path.slice(normalizedOldPath.length + 1)}`;
			}

			return path;
		});

		if (!changed) {
			return;
		}

		this.settings.ignoredFiles = this.normalizeIgnoredFiles(updatedPaths);
		await this.persistIgnoredFiles();
	}

	private async handleIgnoredPathDelete(file: TFile | TFolder): Promise<void> {
		const normalizedPath = this.normalizeIgnoredPath(file.path);
		const filtered = this.settings.ignoredFiles.filter((path) => {
			if (path === normalizedPath) {
				return false;
			}

			return !(file instanceof TFolder && path.startsWith(`${normalizedPath}/`));
		});

		if (filtered.length === this.settings.ignoredFiles.length) {
			return;
		}

		this.settings.ignoredFiles = this.normalizeIgnoredFiles(filtered);
		await this.persistIgnoredFiles();
	}

	private isIgnoredPathMatch(path: string, ignoredPath: string): boolean {
		if (path === ignoredPath) {
			return true;
		}

		const ignoredFile = this.app.vault.getAbstractFileByPath(ignoredPath);
		return ignoredFile instanceof TFolder && path.startsWith(`${ignoredPath}/`);
	}

	private normalizeIgnoredPath(path: string): string {
		return normalizePath(path).replace(/^\/+/, "").replace(/\/+$/, "");
	}

	private normalizeIgnoredFiles(paths: string[] | undefined): string[] {
		if (!Array.isArray(paths)) {
			return [];
		}

		return Array.from(new Set(
			paths
				.filter((path): path is string => typeof path === "string")
				.map((path) => this.normalizeIgnoredPath(path))
				.filter(Boolean)
		)).sort((a, b) => a.localeCompare(b));
	}

	private async persistIgnoredFiles(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshDashboardViews();
	}

	private refreshDashboardViews(): void {
		const dashboardLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_DASHBOARD);
		dashboardLeaves.forEach((leaf) => {
			if (leaf.view instanceof CodeDashboardView) {
				leaf.view.render();
			}
		});
	}

	private getKnownDocuments(): Document[] {
		const docs = new Set<Document>();
		docs.add(activeDocument);

		this.app.workspace.iterateAllLeaves((leaf) => {
			const view = leaf.view as unknown as { containerEl?: HTMLElement; contentEl?: HTMLElement } | null;
			const ownerDoc =
				view?.containerEl?.ownerDocument ??
				view?.contentEl?.ownerDocument ??
				null;
			if (ownerDoc) {
				docs.add(ownerDoc);
			}
		});

		return Array.from(docs);
	}
	
	updateCSSVariables() {
		// Update CSS variables for embed view
		// Use 1.5 line height ratio for consistency
		const embedFontSize = this.settings.embedFontSize;
		const lineHeight = `${embedFontSize * 1.5}px`;

		for (const doc of this.getKnownDocuments()) {
			const styleTargets = [doc.documentElement, doc.body];
			for (const styleTarget of styleTargets) {
				if (!styleTarget) continue;
				styleTarget.style.setProperty("--code-space-embed-font-size", `${embedFontSize}px`);
				styleTarget.style.setProperty("--code-space-embed-line-height", lineHeight);
			}
		}
	}

	async activateDashboard() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_DASHBOARD);

		if (leaves.length > 0) {
			leaf = leaves[0]!;
		} else {
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({ type: VIEW_TYPE_CODE_DASHBOARD, active: true });
		}

		if (leaf) {
			void workspace.revealLeaf(leaf);
		}
	}

	// 新开一个终端标签页：每个页面拥有独立的一组终端（页内 + 管理）
	async activateTerminalView() {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf(true);
		await leaf.setViewState({ type: VIEW_TYPE_CODE_TERMINAL, active: true });
		void workspace.revealLeaf(leaf);
	}

	async toggleOutline() {
		const { workspace } = this.app;
		const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE);

		if (existingLeaves.length > 0) {
			// 如果已经打开，则关闭
			existingLeaves[0]!.detach();
		} else {
			// 在右侧边栏创建新的大纲视图
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_CODE_OUTLINE,
					active: true
				});
				void workspace.revealLeaf(leaf);
			}
		}
	}

	async activateOutlineInSidebar() {
		const { workspace } = this.app;
		
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE)[0];
		
		// 1. 确保视图存在
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_CODE_OUTLINE,
					active: true
				});
				leaf = workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE)[0];
			}
		}

		if (!leaf) return;

		// 2. 实现 Toggle 逻辑
		const rightSplit = workspace.rightSplit;
		
		if (rightSplit.collapsed) {
			// 如果侧边栏折叠，展开并显示
			void rightSplit.expand();
			void workspace.revealLeaf(leaf);
		} else {
			// 如果侧边栏展开
			// 检查当前 Leaf 是否可见（即是否是当前选中的 Tab）
			// 使用 offsetParent 判断元素是否显示
			const isVisible = leaf.view.containerEl.offsetParent !== null;
			
			if (isVisible) {
				// 如果当前可见，则折叠侧边栏
				void rightSplit.collapse();
			} else {
				// 如果当前被遮挡（其他 Tab 激活），则显示它
				void workspace.revealLeaf(leaf);
			}
		}
	}

	async updateOutline(file: import("obsidian").TFile, content?: string) {
		const outlineLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE);
		if (outlineLeaves.length > 0) {
			const view = outlineLeaves[0]!.view;
			if (view instanceof CodeOutlineView) {
				await view.updateSymbols(file, content);
			}
		}
	}

	createCodeFile() {
		// Determine base path based on settings
		let basePath = "";
		if (this.settings.newFileLocationMode === 'current') {
			// Use the folder of the currently active file
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const parent = activeFile.parent;
				if (parent) {
					basePath = parent.path;
				}
			}
		} else {
			// Use custom folder path from settings
			basePath = this.settings.newFileFolderPath || "";
		}

		// 打开创建文件模态框
		new CreateCodeFileModal(this.app, basePath, (fullPath: string) => {
			void (async () => {
				try {
					// 1. 处理扩展名
					// 检查是否有扩展名，没有则默认 .md
					if (!fullPath.includes(".")) {
						fullPath = fullPath + ".md";
					}
					
					// fullPath is already normalized and combined by the Modal

					// 2. 确保文件夹存在
					const folderPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
					if (folderPath) {
						const folder = this.app.vault.getAbstractFileByPath(folderPath);
						if (!folder) {
							await this.app.vault.createFolder(folderPath);
						}
					}

					// 3. 创建文件
					const newFile = await this.app.vault.create(fullPath, "");
					new Notice(`${t('NOTICE_CREATE_SUCCESS')} ${fullPath}`);

					// 根据文件类型决定是否在 Code Space 中打开
					const ext = newFile.extension.toLowerCase();
					const isCodeFile = this.settings.extensions
						.split(',')
						.map(s => s.trim().toLowerCase())
						.includes(ext);

					if (isCodeFile) {
						// 在 Code Space 中打开
						const leaf = this.app.workspace.getLeaf(true);
						await leaf.setViewState({
							type: VIEW_TYPE_CODE_SPACE,
							active: true,
							state: { file: newFile.path }
						});
						void this.app.workspace.revealLeaf(leaf);
					} else {
						// 在默认 Markdown 视图中打开
						await this.app.workspace.openLinkText(newFile.path, "", true);
					}
				} catch (error) {
					console.error("Failed to create file:", error);
					new Notice(t('NOTICE_CREATE_FAIL') + ": " + String(error));
				}
			})();
		}).open();
	}
}
