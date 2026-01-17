import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";
import { CodeDashboardView, VIEW_TYPE_CODE_DASHBOARD } from "./dashboard_view";

export default class CodeSpacePlugin extends Plugin {

	async onload() {
		// 1. 注册编辑器视图
		this.registerView(
			VIEW_TYPE_CODE_SPACE,
			(leaf) => new CodeSpaceView(leaf)
		);

		// 2. 注册仪表盘视图
		this.registerView(
			VIEW_TYPE_CODE_DASHBOARD,
			(leaf) => new CodeDashboardView(leaf)
		);

		// 3. 注册文件后缀接管
		try {
			this.registerExtensions(['py', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'jsx', 'tsx', 'json'], VIEW_TYPE_CODE_SPACE);
		} catch (e) {
			console.log("Extensions already registered or conflict:", e);
		}

		// 4. 添加左侧 Ribbon 图标
		this.addRibbonIcon('code-glyph', 'Open Code Space Dashboard', () => {
			this.activateDashboard();
		});

		// 5. 添加命令 (方便通过 Ctrl+P 呼出)
		this.addCommand({
			id: 'open-code-dashboard',
			name: 'Open Dashboard',
			callback: () => {
				this.activateDashboard();
			}
		});
	}

	onunload() {
		// 插件卸载时自动处理
	}

	async activateDashboard() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_CODE_DASHBOARD);

		if (leaves.length > 0) {
			// 如果已经打开了，就激活它
			leaf = leaves[0]!;
		} else {
			// 否则在右侧边栏打开 (或者主区域，看你喜好。这里先开在主区域)
			leaf = workspace.getLeaf(true); // 'true' means open in a new tab if possible
			await leaf.setViewState({ type: VIEW_TYPE_CODE_DASHBOARD, active: true });
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}