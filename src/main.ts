import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";
import { CodeSpaceSettings, DEFAULT_SETTINGS, CodeSpaceSettingTab } from "./settings";

export default class CodeSpacePlugin extends Plugin {
	settings: CodeSpaceSettings;

	async onload() {
		await this.loadSettings();

		// 1. 注册设置页
		this.addSettingTab(new CodeSpaceSettingTab(this.app, this));

		// 2. 注册编辑器视图
		this.registerView(
			VIEW_TYPE_CODE_SPACE,
			(leaf) => new CodeSpaceView(leaf)
		);

		// 3. 注册仪表盘视图
		this.registerView(
			VIEW_TYPE_CODE_DASHBOARD,
			(leaf) => new CodeDashboardView(leaf)
		);

		// 4. 动态注册文件后缀接管
		this.registerCodeExtensions();

		// 5. Ribbon Icon
		this.addRibbonIcon('code-glyph', 'Open Code Space Dashboard', () => {
			this.activateDashboard();
		});

		// 6. Command
		this.addCommand({
			id: 'open-code-dashboard',
			name: 'Open Dashboard',
			callback: () => {
				this.activateDashboard();
			}
		});
	}

	registerCodeExtensions() {
		// 解析用户设置的后缀字符串
		const exts = this.settings.extensions
			.split(',')
			.map(s => s.trim())
			.filter(s => s.length > 0);
		
		try {
			this.registerExtensions(exts, VIEW_TYPE_CODE_SPACE);
			console.log("Code Space registered extensions:", exts);
		} catch (e) {
			console.log("Code Space extension registration warning:", e);
		}
	}

	onunload() {
		// 插件卸载
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// 主动刷新所有已打开的 Dashboard
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODE_DASHBOARD);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CodeDashboardView) {
				leaf.view.render();
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
}
