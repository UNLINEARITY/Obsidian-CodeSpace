import { Plugin, WorkspaceLeaf, Modal, Notice, TextComponent, ButtonComponent, App } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";
import { CodeOutlineView, VIEW_TYPE_CODE_OUTLINE } from "./outline_view";
import { CodeSpaceSettings, DEFAULT_SETTINGS, CodeSpaceSettingTab } from "./settings";
import { registerCodeEmbedProcessor } from "./code_embed";

// 文件创建模态框
class CreateCodeFileModal extends Modal {
	private result: string | null = null;
	private onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
		this.setTitle("Create file");

		// 文件名输入
		const nameContainer = this.contentEl.createDiv({ cls: "create-file-input-container" });
		nameContainer.createEl("label", { text: "File name:" });
		const nameInput = new TextComponent(nameContainer);
		nameInput.setPlaceholder("Example: script.py");

		// 提示文本
		nameContainer.createEl("div", {
			text: "Enter file name with extension (e.g., test.py, script.js). Default: .md",
			cls: "setting-item-description"
		});

		// 按钮容器
		const buttonContainer = this.contentEl.createDiv({ cls: "modal-button-container" });

		const submitBtn = new ButtonComponent(buttonContainer);
		submitBtn.setButtonText("Create");
		submitBtn.setCta();
		submitBtn.onClick(() => {
			const fileName = nameInput.getValue().trim();
			if (fileName) {
				this.result = fileName;
				this.close();
			} else {
				new Notice("Please enter a file name");
			}
		});

		const cancelBtn = new ButtonComponent(buttonContainer);
		cancelBtn.setButtonText("Cancel");
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
				const fileName = nameInput.getValue().trim();
				if (fileName) {
					this.result = fileName;
					this.close();
				}
			}
		});
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

		this.addRibbonIcon('code-glyph', 'Open code space dashboard', () => {
			void this.activateDashboard();
		});

		this.addCommand({
			id: 'open-dashboard',
			name: 'Open dashboard',
			callback: () => {
				void this.activateDashboard();
			}
		});

		this.addCommand({
			id: 'create-code-file',
			name: 'Create code file',
			callback: () => {
				this.createCodeFile();
			}
		});

		this.addCommand({
			id: 'reload-plugin',
			name: 'Reload plugin',
			callback: async () => {
				await this.reloadPlugin();
			}
		});

		this.addCommand({
			id: 'toggle-outline',
			name: 'Toggle code outline',
			callback: () => {
				void this.toggleOutline();
			}
		});

		// 添加代码编辑器搜索和替换命令（开关模式）
		this.addCommand({
			id: 'toggle-code-search',
			name: 'Search and replace',
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
			void this.activateOutlineInSidebar();
		});
	}

	async reloadPlugin() {
		const pluginId = 'code-space';
		const pluginName = 'Code Space';

		try {
			console.debug(`Code Space: Reloading plugin...`);
			new Notice(`Reloading ${pluginName}...`, 2000);

			// 获取插件管理器
			type AppWithPlugins = App & { plugins: { disablePlugin(id: string): Promise<void>; enablePlugin(id: string): Promise<void> } };
			const plugins = (this.app as unknown as AppWithPlugins).plugins;

			// 禁用插件
			await plugins.disablePlugin(pluginId);
			console.debug(`Code Space: Plugin disabled`);

			// 启用插件
			await plugins.enablePlugin(pluginId);
			console.debug(`Code Space: Plugin enabled`);

			new Notice(`${pluginName} reloaded successfully!`, 3000);
		} catch (error) {
			console.error('Code Space: Failed to reload plugin:', error);
			new Notice(`Failed to reload ${pluginName}: ${String(error)}`, 5000);
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
		
		// 检查是否已经有大纲视图
		const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_OUTLINE);
		if (existingLeaves.length > 0) {
			void workspace.revealLeaf(existingLeaves[0]!);
			return;
		}

		// 创建新的大纲视图
		try {
			const leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({
					type: VIEW_TYPE_CODE_OUTLINE,
					active: true
				});
				void workspace.revealLeaf(leaf);
				console.debug("Code Space: Outline created successfully");
			}
		} catch (error) {
			console.error("Code Space: Failed to create outline", error);
			new Notice("Failed to create code outline");
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
		// 打开创建文件模态框
		new CreateCodeFileModal(this.app, (fileName: string) => {
			void (async () => {
				try {
					// 检查是否有扩展名，没有则默认 .md
					if (!fileName.includes(".")) {
						fileName = fileName + ".md";
					}

					// 在 vault 根目录创建文件
					const newFile = await this.app.vault.create(fileName, "");
					new Notice(`Created ${fileName}`);

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
					new Notice("Failed to create file. File may already exist.");
				}
			})();
		}).open();
	}
}