// 独立终端视图：全屏终端页面，与编辑器内嵌面板共享全局会话组
// 关闭 Obsidian 终端标签页仅销毁宿主（会话后台存活，× 标签或 kill-all 才关闭会话）

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
		// 统一显示「终端」：不携带 shell 名与序号，
		// 且不直接改写 tabHeaderEl（会覆盖 Obsidian 标签头内的关闭按钮）
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
		const manager = plugin?.terminalManager ?? null;
		if (!plugin || !manager) {
			container.createDiv({
				cls: "code-space-terminal-empty",
				text: t("TERMINAL_NOTICE_DESKTOP_ONLY"),
			});
			return;
		}

		// 优先接管内嵌面板移交的会话组；否则本视图新建一组
		const group = manager.consumePendingGroup() ?? manager.createGroup();
		this.panel = new TerminalPanel(
			{
				settings: plugin.settings,
				app: plugin.app,
				terminalManager: plugin.terminalManager,
				// 已在终端视图中，移交动作无意义
				openTerminalView: () => { /* noop */ },
			},
			"view",
			group
		);
		this.registerEvent(this.app.workspace.on("css-change", () => {
			this.panel?.refreshTheme();
		}));
		container.appendChild(this.panel.el);

		// 打开即展示；组内无会话时新建
		await this.panel.show();
	}

	async onClose(): Promise<void> {
		// 仅销毁面板宿主，会话继续存活（可在内嵌面板或新的终端页面接管）
		this.panel?.destroy();
		this.panel = null;
	}

	getPlugin(): CodeSpacePlugin | null {
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
		const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
		return plugin ?? null;
	}
}
