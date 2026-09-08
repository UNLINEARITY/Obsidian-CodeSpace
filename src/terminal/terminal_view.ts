// 独立终端视图：主标签区中的完整终端（与 Dashboard 同级）
// 复用 TerminalPanel；会话由 TerminalManager 全局持有，视图关闭仅解除挂载

import { App, ItemView, WorkspaceLeaf } from "obsidian";
import type CodeSpacePlugin from "../main";
import { t } from "../lang/helpers";
import { TerminalPanel } from "./terminal_panel";

export const VIEW_TYPE_CODE_TERMINAL = "code-space-terminal";

export class CodeTerminalView extends ItemView {
	private panel: TerminalPanel | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_TERMINAL;
	}

	getDisplayText(): string {
		return t("TERMINAL_VIEW_TITLE");
	}

	getIcon(): string {
		return "terminal";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement | undefined;
		if (!container) {
			return;
		}
		container.empty();

		const plugin = this.getPlugin();
		if (!plugin || !plugin.terminalManager) {
			container.createDiv({
				cls: "code-space-terminal-empty",
				text: t("TERMINAL_NOTICE_DESKTOP_ONLY"),
			});
			return;
		}

		this.panel = new TerminalPanel(plugin, "view");
		this.registerEvent(this.app.workspace.on("css-change", () => {
			this.panel?.refreshTheme();
		}));
		container.appendChild(this.panel.el);

		// 打开即展示；无会话时创建首个会话（cwd 跟随当前活动文件）
		await this.panel.show();
	}

	async onClose(): Promise<void> {
		// 仅销毁面板，会话继续存活（可在编辑器面板中重新挂载）
		this.panel?.destroy();
		this.panel = null;
	}

	getPlugin(): CodeSpacePlugin | null {
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
		const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
		return plugin ?? null;
	}
}
