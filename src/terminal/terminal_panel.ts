// 编辑器内嵌终端面板：单会话快速入口（VSCode 终端编辑器模式）
// 面板绑定一个会话：[+] 新开终端标签页 / [↗] 移交当前会话 / [×] 收起
// 会话由 TerminalManager 全局持有；收起面板不终止会话

import { App, setIcon } from "obsidian";
import { t } from "../lang/helpers";
import type { CodeSpaceSettings } from "../settings";
import type { TerminalId } from "./types";
import type { TerminalManager } from "./session_manager";

/** 面板所需的宿主结构（避免与 main.ts 循环依赖） */
export interface TerminalHostFacade {
	settings: CodeSpaceSettings;
	app: App;
	terminalManager: TerminalManager | null;
	/** 新开一个独立终端标签页 */
	openTerminalView(): Promise<void> | void;
}

const MIN_PANEL_HEIGHT = 120;
const MAX_PANEL_HEIGHT = 900;

export class TerminalPanel {
	private plugin: TerminalHostFacade;
	private rootEl: HTMLElement;
	private bodyEl: HTMLElement;
	private emptyEl: HTMLElement;
	// 面板当前绑定展示的会话（单会话模型）
	private sessionId: TerminalId | null = null;
	private unsubscribe: (() => void) | null = null;
	private dragCleanup: (() => void) | null = null;
	private destroyed = false;

	constructor(plugin: TerminalHostFacade) {
		this.plugin = plugin;

		this.rootEl = createDiv({ cls: "code-space-terminal-panel is-hidden" });

		const grip = this.rootEl.createDiv({ cls: "code-space-terminal-grip" });
		grip.setAttribute("aria-label", t("TERMINAL_RESIZE"));
		this.setupDragResize(grip);

		const header = this.rootEl.createDiv({ cls: "code-space-terminal-header" });
		const actions = header.createDiv({ cls: "code-space-terminal-actions" });

		const newTabButton = actions.createDiv({ cls: "code-space-terminal-action" });
		setIcon(newTabButton, "plus");
		newTabButton.setAttribute("aria-label", t("TERMINAL_NEW_TAB"));
		newTabButton.addEventListener("click", () => {
			void this.plugin.openTerminalView();
		});

		const popOutButton = actions.createDiv({ cls: "code-space-terminal-action" });
		setIcon(popOutButton, "external-link");
		popOutButton.setAttribute("aria-label", t("TERMINAL_PANEL_POP_OUT"));
		popOutButton.addEventListener("click", () => {
			void this.popOut();
		});

		const closeButton = actions.createDiv({ cls: "code-space-terminal-action" });
		setIcon(closeButton, "x");
		closeButton.setAttribute("aria-label", t("TERMINAL_PANEL_CLOSE"));
		closeButton.addEventListener("click", () => {
			this.setVisible(false);
		});

		this.bodyEl = this.rootEl.createDiv({ cls: "code-space-terminal-body" });
		this.emptyEl = this.bodyEl.createDiv({
			cls: "code-space-terminal-empty",
			text: t("TERMINAL_PANEL_EMPTY"),
		});

		const manager = this.manager;
		if (manager) {
			this.unsubscribe = manager.onSessionsChanged(() => this.handleSessionsChanged());
		}
	}

	get el(): HTMLElement {
		return this.rootEl;
	}

	get isVisible(): boolean {
		return !this.rootEl.hasClass("is-hidden");
	}

	get activeSessionId(): TerminalId | null {
		return this.sessionId;
	}

	private get manager(): TerminalManager | null {
		return this.plugin.terminalManager;
	}

	/** 展示面板；绑定最近的无主会话（无则新建一个） */
	async show(cwd?: string): Promise<void> {
		if (this.destroyed) {
			return;
		}
		const manager = this.manager;
		if (!manager) {
			return;
		}
		this.setVisible(true);

		let session = this.sessionId ? manager.getSession(this.sessionId) : undefined;
		if (!session) {
			session = manager.latestPanelSession() ?? undefined;
		}
		if (!session) {
			try {
				session = await manager.createSession(cwd);
			} catch {
				// 失败提示由管理器负责
				return;
			}
		}
		this.bindSession(session.info.id);
	}

	setVisible(visible: boolean): void {
		if (this.destroyed) {
			return;
		}
		this.rootEl.toggleClass("is-hidden", !visible);
		if (visible) {
			this.attachBound();
		} else {
			this.detachBound();
		}
	}

	/** 把当前会话移交给一个新的独立终端标签页，并收起面板 */
	private async popOut(): Promise<void> {
		const manager = this.manager;
		if (!manager || !this.sessionId) {
			return;
		}
		manager.markPendingClaim(this.sessionId);
		this.sessionId = null;
		try {
			await this.plugin.openTerminalView();
		} finally {
			this.setVisible(false);
		}
	}

	refreshTheme(): void {
		if (this.destroyed || !this.sessionId) {
			return;
		}
		this.manager?.getSession(this.sessionId)?.component.refreshTheme();
	}

	focus(): void {
		if (this.sessionId) {
			this.manager?.getSession(this.sessionId)?.component.focus();
		}
	}

	/** 销毁面板（仅解除挂载；会话继续存活） */
	destroy(): void {
		this.destroyed = true;
		this.detachBound();
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.rootEl.remove();
	}

	private bindSession(id: TerminalId): void {
		const manager = this.manager;
		const session = manager?.getSession(id);
		if (!manager || !session) {
			return;
		}
		this.detachBound();
		this.sessionId = id;
		manager.markAttached(id);
		this.attachBound();
	}

	private attachBound(): void {
		const session = this.sessionId ? this.manager?.getSession(this.sessionId) : undefined;
		if (session && this.isVisible) {
			this.emptyEl.remove();
			session.component.attachTo(this.bodyEl);
			session.component.focus();
		}
	}

	private detachBound(): void {
		const component = this.sessionId ? this.manager?.getSession(this.sessionId)?.component : undefined;
		// 仅当组件确实挂在本面板时才卸载（另一宿主可能正持有该 DOM）
		if (component?.containerEl && component.containerEl.parentElement === this.bodyEl) {
			component.detach();
		}
	}

	/** 绑定会话被外部关闭（kill-all/淘汰）时清空并显示空状态 */
	private handleSessionsChanged(): void {
		if (this.destroyed) {
			return;
		}
		if (this.sessionId && !this.manager?.getSession(this.sessionId)) {
			this.sessionId = null;
		}
		if (!this.sessionId) {
			this.bodyEl.appendChild(this.emptyEl);
		}
	}

	private setupDragResize(grip: HTMLElement): void {
		grip.addEventListener("mousedown", (event) => {
			if (this.destroyed || !this.isVisible) {
				return;
			}
			event.preventDefault();
			const view = this.rootEl.ownerDocument.defaultView;
			if (!view) {
				return;
			}
			const startHeight = this.rootEl.getBoundingClientRect().height;
			const startY = event.clientY;
			const onMove = (moveEvent: MouseEvent) => {
				// 向上拖动增加高度
				const nextHeight = Math.min(
					MAX_PANEL_HEIGHT,
					Math.max(MIN_PANEL_HEIGHT, startHeight + (startY - moveEvent.clientY))
				);
				this.rootEl.style.setProperty("--code-space-terminal-height", `${Math.round(nextHeight)}px`);
			};
			const onUp = () => {
				view.removeEventListener("mousemove", onMove);
				view.removeEventListener("mouseup", onUp);
				this.dragCleanup = null;
			};
			view.addEventListener("mousemove", onMove);
			view.addEventListener("mouseup", onUp);
			this.dragCleanup = onUp;
		});
	}
}
