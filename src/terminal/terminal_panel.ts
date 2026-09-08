// 终端面板：标签栏 + 终端主体，编辑器内嵌面板与独立视图共用
// 会话由 TerminalManager 全局持有；面板仅负责展示与交互

import { App, setIcon } from "obsidian";
import { t } from "../lang/helpers";
import type { CodeSpaceSettings } from "../settings";
import type { TerminalHostKind, TerminalId } from "./types";
import type { TerminalManager, TerminalSession } from "./session_manager";

/** 面板所需的宿主结构（避免与 main.ts 循环依赖） */
export interface TerminalHostFacade {
	settings: CodeSpaceSettings;
	app: App;
	terminalManager: TerminalManager | null;
}

const MIN_PANEL_HEIGHT = 120;
const MAX_PANEL_HEIGHT = 900;

export class TerminalPanel {
	readonly hostKind: TerminalHostKind;

	private plugin: TerminalHostFacade;
	private rootEl: HTMLElement;
	private tabsEl: HTMLElement;
	private bodyEl: HTMLElement;
	private emptyEl: HTMLElement;
	private activeSessionIdValue: TerminalId | null = null;
	// 当前面板实际挂载进 body 的会话（切换标签时先卸载前一个）
	private attachedSessionId: TerminalId | null = null;
	private unsubscribe: (() => void) | null = null;
	private dragCleanup: (() => void) | null = null;
	private destroyed = false;

	constructor(plugin: TerminalHostFacade, kind: TerminalHostKind) {
		this.plugin = plugin;
		this.hostKind = kind;

		const cls = kind === "view"
			? "code-space-terminal-panel code-space-terminal-panel-view is-hidden"
			: "code-space-terminal-panel is-hidden";
		this.rootEl = createDiv({ cls });

		const grip = this.rootEl.createDiv({ cls: "code-space-terminal-grip" });
		grip.setAttribute("aria-label", t("TERMINAL_RESIZE"));
		this.setupDragResize(grip);

		const header = this.rootEl.createDiv({ cls: "code-space-terminal-header" });
		this.tabsEl = header.createDiv({ cls: "code-space-terminal-tabs" });
		const newButton = header.createDiv({ cls: "code-space-terminal-new" });
		setIcon(newButton, "plus");
		newButton.setAttribute("aria-label", t("TERMINAL_TAB_NEW"));
		newButton.addEventListener("click", () => {
			void this.newSession();
		});

		this.bodyEl = this.rootEl.createDiv({ cls: "code-space-terminal-body" });
		this.emptyEl = this.bodyEl.createDiv({
			cls: "code-space-terminal-empty",
			text: t("TERMINAL_PANEL_EMPTY"),
		});

		const manager = this.manager;
		if (manager) {
			this.unsubscribe = manager.onSessionsChanged(() => this.renderTabs());
		}
		this.renderTabs();
	}

	get el(): HTMLElement {
		return this.rootEl;
	}

	get isVisible(): boolean {
		return !this.rootEl.hasClass("is-hidden");
	}

	get activeSessionId(): TerminalId | null {
		return this.activeSessionIdValue;
	}

	private get manager(): TerminalManager | null {
		return this.plugin.terminalManager;
	}

	/** 展示面板；无会话时以 cwd 创建首个会话 */
	async show(cwd?: string): Promise<void> {
		if (this.destroyed) {
			return;
		}
		const manager = this.manager;
		if (!manager) {
			return;
		}
		this.setVisible(true);

		let session = this.activeSessionIdValue ? manager.getSession(this.activeSessionIdValue) : undefined;
		if (!session) {
			session = manager.sessions[manager.sessions.length - 1];
		}
		if (!session) {
			try {
				session = await manager.createSession(cwd);
			} catch {
				// 失败提示由管理器负责
				return;
			}
		}
		this.selectSession(session.info.id);
	}

	setVisible(visible: boolean): void {
		if (this.destroyed) {
			return;
		}
		this.rootEl.toggleClass("is-hidden", !visible);
		if (visible) {
			const session = this.activeSessionIdValue ? this.manager?.getSession(this.activeSessionIdValue) : undefined;
			if (session) {
				this.attachSession(session);
			}
		} else {
			this.detachActive();
		}
	}

	selectSession(id: TerminalId): void {
		if (this.destroyed) {
			return;
		}
		const manager = this.manager;
		const session = manager?.getSession(id);
		if (!manager || !session) {
			return;
		}
		this.activeSessionIdValue = id;
		manager.markAttached(id);
		this.renderTabs();
		if (this.isVisible) {
			this.attachSession(session);
		}
	}

	async newSession(): Promise<void> {
		if (this.destroyed) {
			return;
		}
		const manager = this.manager;
		if (!manager) {
			return;
		}
		try {
			const session = await manager.createSession();
			this.selectSession(session.info.id);
		} catch {
			// 失败提示由管理器负责
		}
	}

	refreshTheme(): void {
		if (this.destroyed || !this.activeSessionIdValue) {
			return;
		}
		this.manager?.getSession(this.activeSessionIdValue)?.component.refreshTheme();
	}

	focus(): void {
		if (this.activeSessionIdValue) {
			this.manager?.getSession(this.activeSessionIdValue)?.component.focus();
		}
	}

	/** 销毁面板（仅解除挂载；会话继续存活） */
	destroy(): void {
		this.destroyed = true;
		this.detachActive();
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.rootEl.remove();
	}

	private attachSession(session: TerminalSession): void {
		// 先卸载前一个挂载的会话组件，避免两个终端同时堆叠在主体内
		if (this.attachedSessionId && this.attachedSessionId !== session.info.id) {
			this.manager?.getSession(this.attachedSessionId)?.component.detach();
		}
		this.attachedSessionId = session.info.id;
		this.emptyEl.remove();
		session.component.attachTo(this.bodyEl);
	}

	private detachActive(): void {
		if (!this.attachedSessionId) {
			return;
		}
		const component = this.manager?.getSession(this.attachedSessionId)?.component;
		// 仅当组件确实挂在本面板时才卸载（另一宿主可能正持有该 DOM）
		if (component?.containerEl && component.containerEl.parentElement === this.bodyEl) {
			component.detach();
		}
		this.attachedSessionId = null;
	}

	private renderTabs(): void {
		if (this.destroyed) {
			return;
		}
		const manager = this.manager;
		const sessions = manager?.sessions ?? [];

		// 当前选中会话被其他宿主关闭时，自动切到最后一个会话
		if (this.activeSessionIdValue && !sessions.some((s) => s.info.id === this.activeSessionIdValue)) {
			this.activeSessionIdValue = sessions.length > 0 ? sessions[sessions.length - 1]!.info.id : null;
		}

		this.tabsEl.empty();
		for (const session of sessions) {
			this.tabsEl.appendChild(this.buildTabEl(session.info.id, session.info.title, session.info.exited));
		}

		if (this.activeSessionIdValue && this.isVisible) {
			const session = manager?.getSession(this.activeSessionIdValue);
			if (session) {
				this.attachSession(session);
			}
		} else if (!this.activeSessionIdValue) {
			this.bodyEl.appendChild(this.emptyEl);
		}
	}

	private buildTabEl(id: TerminalId, title: string, exited: boolean): HTMLElement {
		const tab = createDiv({ cls: "code-space-terminal-tab" });
		if (id === this.activeSessionIdValue) {
			tab.addClass("is-active");
		}
		if (exited) {
			tab.addClass("is-exited");
		}
		tab.createSpan({ cls: "code-space-terminal-tab-title", text: title });
		if (exited) {
			tab.createSpan({ cls: "code-space-terminal-tab-badge", text: t("TERMINAL_TAB_EXITED") });
		}
		const close = tab.createSpan({ cls: "code-space-terminal-tab-close", attr: { "aria-label": t("TERMINAL_TAB_CLOSE") } });
		setIcon(close, "x");
		close.addEventListener("click", (event) => {
			event.stopPropagation();
			this.manager?.closeSession(id);
		});
		tab.addEventListener("click", () => {
			this.selectSession(id);
		});
		return tab;
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
