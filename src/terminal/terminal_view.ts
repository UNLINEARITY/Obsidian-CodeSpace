// 独立终端视图：一个视图 = 一个全屏终端（VSCode 终端编辑器模式）
// 打开时认领弹出的待接管会话，否则新建；关闭标签页即关闭该终端

import { App, ItemView, WorkspaceLeaf } from "obsidian";
import type CodeSpacePlugin from "../main";
import { t } from "../lang/helpers";
import type { TerminalSession } from "./session_manager";

export const VIEW_TYPE_CODE_TERMINAL = "code-space-terminal";

export class CodeTerminalView extends ItemView {
	private session: TerminalSession | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_TERMINAL;
	}

	getDisplayText(): string {
		return this.session ? this.session.info.title : t("TERMINAL_VIEW_TITLE");
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

		// 优先认领面板弹出的会话；否则新建（重启/布局恢复后同样直接新建）
		this.session = manager.claimPendingSession();
		if (!this.session) {
			try {
				this.session = await manager.createSession(undefined, { viewOwned: true });
			} catch {
				// 失败提示由管理器负责；视图显示空状态
				this.renderEmpty(container);
				return;
			}
		}
		const tabHeader = (this.leaf as unknown as { tabHeaderEl?: HTMLElement }).tabHeaderEl;
		tabHeader?.setText(this.session.info.title);
		manager.markAttached(this.session.info.id);
		this.session.component.attachTo(container);
		this.session.component.focus();

		this.registerEvent(this.app.workspace.on("css-change", () => {
			this.session?.component.refreshTheme();
		}));

		// 会话被外部关闭（kill-all/淘汰）时显示空状态，避免空白死页面
		this.registerEvent(manager.onSessionsChanged(() => {
			if (this.session && !manager.getSession(this.session.info.id)) {
				this.session = null;
				this.renderEmpty(container);
			}
		}));
	}

	async onClose(): Promise<void> {
		// 关闭标签页 = 关闭该终端（终止 PTY 并销毁组件）
		if (this.session) {
			const id = this.session.info.id;
			this.session = null;
			this.getPlugin()?.terminalManager?.closeSession(id);
		}
	}

	getPlugin(): CodeSpacePlugin | null {
		type AppWithPlugins = App & { plugins: { getPlugin(id: string): CodeSpacePlugin | undefined } };
		const plugin = (this.app as unknown as AppWithPlugins).plugins.getPlugin("code-space");
		return plugin ?? null;
	}

	private renderEmpty(container: HTMLElement): void {
		container.empty();
		container.createDiv({
			cls: "code-space-terminal-empty",
			text: t("TERMINAL_PANEL_EMPTY"),
		});
	}
}
