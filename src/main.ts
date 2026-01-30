import { Plugin, WorkspaceLeaf, Modal, Notice, TextComponent, ButtonComponent, App, normalizePath } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";
import { CodeOutlineView, VIEW_TYPE_CODE_OUTLINE } from "./outline_view";
import { CodeSpaceSettings, DEFAULT_SETTINGS, CodeSpaceSettingTab } from "./settings";
import { registerCodeEmbedProcessor } from "./code_embed";
import { t } from "./lang/helpers";

// 文件创建模态框
class CreateCodeFileModal extends Modal {
	private result: string | null = null;
	private onSubmit: (result: string) => void;
	private basePath: string;

	constructor(app: App, basePath: string, onSubmit: (result: string) => void) {
		super(app);
		this.basePath = basePath;
		this.onSubmit = onSubmit;
		this.setTitle(t('MODAL_CREATE_TITLE'));

		// 文件名输入
		const nameContainer = this.contentEl.createDiv({ cls: "create-file-input-container" });
		nameContainer.createEl("label", { text: t('MODAL_CREATE_LABEL') });
		const nameInput = new TextComponent(nameContainer);
		
		const pathHint = this.basePath ? ` (in ${this.basePath}/)` : " (in root)";
		nameInput.setPlaceholder(`Example: script.py${pathHint}`);

		// 提示文本
		nameContainer.createEl("div", {
			text: t('MODAL_CREATE_DESC') + pathHint,
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
		setTimeout(() => nameInput.inputEl.focus(), 10);

		// 支持回车确认
		nameInput.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				e.stopPropagation();
				this.submit(nameInput.getValue());
			}
		});
	}

	private submit(value: string) {
		const fileName = value.trim();
		if (fileName) {
			this.result = fileName;
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

		this.registerCodeExtensions();

		console.debug("Code Space: About to register code embed processor...");
		// Register code embed processor
		registerCodeEmbedProcessor(this);
		console.debug("Code Space: Code embed processor registered");

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

		console.debug("Code Space: Plugin fully loaded");

		// Automatically create the outline view in the right sidebar when layout is ready
		this.app.workspace.onLayoutReady(() => {
			// void this.activateOutlineInSidebar(); // Disabled to respect user's previous state
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

		try {
			this.registerExtensions(exts, VIEW_TYPE_CODE_SPACE);
		} catch (e) {
			console.debug("Code Space extension registration warning:", e);
		}
	}

	onunload() {
		// 卸载时清理大纲视图，防止重载插件时重复创建
		const { workspace } = this.app;
		const outlineLeaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE);
		outlineLeaves.forEach(leaf => leaf.detach());
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as CodeSpaceSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// Update CSS variables
		this.updateCSSVariables();

		// 重新注册扩展名（必须在刷新视图之前）
		this.registerCodeExtensions();

		// 刷新 Dashboard (更新后缀列表)
		const dashboardLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_DASHBOARD);
		dashboardLeaves.forEach(leaf => {
			if (leaf.view instanceof CodeDashboardView) {
				leaf.view.render();
			}
		});

		// 刷新编辑器 (更新行号设置)
		const editorLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_SPACE);
		editorLeaves.forEach(leaf => {
			if (leaf.view instanceof CodeSpaceView) {
				leaf.view.refreshSettings();
			}
		});
	}
	
	updateCSSVariables() {
		// Update CSS variables for embed view
		// Use 1.5 line height ratio for consistency
		const embedFontSize = this.settings.embedFontSize;
		document.body.style.setProperty("--code-space-embed-font-size", `${embedFontSize}px`);
		document.body.style.setProperty("--code-space-embed-line-height", `${embedFontSize * 1.5}px`);
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
		// Get base path from settings
		const basePath = this.settings.newFileFolderPath || "";

		// 打开创建文件模态框
		new CreateCodeFileModal(this.app, basePath, (fileName: string) => {
			void (async () => {
				try {
					// 1. 处理扩展名
					// 检查是否有扩展名，没有则默认 .md (或者根据用户偏好？这里暂时保持 .md)
					if (!fileName.includes(".")) {
						fileName = fileName + ".md";
					}

					// 2. 决定完整路径
					let fullPath = "";
					// 如果用户输入了包含斜杠的路径，则忽略默认位置，直接使用用户输入的路径
					if (fileName.includes("/")) {
						fullPath = normalizePath(fileName);
					} else {
						// 否则使用默认位置 + 文件名
						fullPath = normalizePath(basePath + "/" + fileName);
					}

					// 3. 确保文件夹存在
					const folderPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
					if (folderPath) {
						const folder = this.app.vault.getAbstractFileByPath(folderPath);
						if (!folder) {
							await this.app.vault.createFolder(folderPath);
						}
					}

					// 4. 创建文件
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