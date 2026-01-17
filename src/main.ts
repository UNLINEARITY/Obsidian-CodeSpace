import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";
import { CodeSpaceSettings, DEFAULT_SETTINGS, CodeSpaceSettingTab } from "./settings";

export default class CodeSpacePlugin extends Plugin {
	settings: CodeSpaceSettings;

	async onload() {
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