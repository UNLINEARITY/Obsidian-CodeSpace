import { Plugin, WorkspaceLeaf, Modal, Notice, TFile, TextComponent, ButtonComponent } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";
import { CodeSpaceSettings, DEFAULT_SETTINGS, CodeSpaceSettingTab } from "./settings";
import { registerCodeEmbedProcessor } from "./code_embed";

// 文件创建模态框
class CreateCodeFileModal extends Modal {
	private result: string | null = null;
	private onSubmit: (result: string) => void;

	constructor(app: any, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
		this.setTitle("Create File");

		// 文件名输入
		const nameContainer = this.contentEl.createDiv({ cls: "create-file-input-container" });
		nameContainer.createEl("label", { text: "File name:" });
		const nameInput = new TextComponent(nameContainer);
		nameInput.setPlaceholder("my_script.py");
		nameInput.inputEl.style.width = "100%";
		nameInput.inputEl.style.marginBottom = "20px";

		// 提示文本
		const hint = nameContainer.createEl("div", {
			text: "Enter file name with extension (e.g., test.py, script.js). Default: .md",
			cls: "setting-item-description"
		});
		hint.style.marginBottom = "15px";
		hint.style.fontSize = "12px";
		hint.style.color = "var(--text-muted)";

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
		console.log("Code Space: Plugin loading...");
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

		this.registerCodeExtensions();

		console.log("Code Space: About to register code embed processor...");
		// Register code embed processor
		registerCodeEmbedProcessor(this);
		console.log("Code Space: Code embed processor registered");

		this.addRibbonIcon('code-glyph', 'Open Code Space Dashboard', () => {
			this.activateDashboard();
		});

		this.addCommand({
			id: 'open-code-dashboard',
			name: 'Open Dashboard',
			callback: () => {
				this.activateDashboard();
			}
		});

		this.addCommand({
			id: 'create-code-file',
			name: 'Create Code File',
			callback: () => {
				this.createCodeFile();
			}
		});

		console.log("Code Space: Plugin fully loaded");
	}

	registerCodeExtensions() {
		const exts = this.settings.extensions
			.split(',')
			.map(s => s.trim())
			.filter(s => s.length > 0);
		
		try {
			this.registerExtensions(exts, VIEW_TYPE_CODE_SPACE);
		} catch (e) {
			console.log("Code Space extension registration warning:", e);
		}
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);

		// 重新注册扩展名（必须在刷新视图之前）
		this.registerCodeExtensions();

		// 1. 刷新 Dashboard (更新后缀列表)
		const dashboardLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_DASHBOARD);
		dashboardLeaves.forEach(leaf => {
			if (leaf.view instanceof CodeDashboardView) {
				leaf.view.render();
			}
		});

		// 2. 刷新编辑器 (更新行号设置)
		const editorLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_SPACE);
		editorLeaves.forEach(leaf => {
			if (leaf.view instanceof CodeSpaceView) {
				leaf.view.refreshSettings();
			}
		});

		// 3. 刷新所有 Markdown 视图（更新代码嵌入的行数限制）
		const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
		markdownLeaves.forEach(leaf => {
			// 触发 Markdown 视图重新渲染
			const view = leaf.view as any;
			if (view && view.render) {
				view.render();
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
			workspace.revealLeaf(leaf);
		}
	}

	createCodeFile() {
		// 打开创建文件模态框
		new CreateCodeFileModal(this.app, async (fileName: string) => {
			try {
				// 检查是否有扩展名，没有则默认 .md
				if (!fileName.includes(".")) {
					fileName = fileName + ".md";
				}

				// 在 vault 根目录创建文件
				// @ts-ignore
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
					this.app.workspace.revealLeaf(leaf);
				} else {
					// 在默认 Markdown 视图中打开
					await this.app.workspace.openLinkText(newFile.path, "", true);
				}
			} catch (error) {
				console.error("Failed to create file:", error);
				new Notice("Failed to create file. File may already exist.");
			}
		}).open();
	}
}