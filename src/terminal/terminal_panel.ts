// 终端面板：标签栏 + 终端主体，编辑器内嵌面板与独立终端视图共用
// 每个面板宿主拥有独立的一组会话；面板销毁即整组关闭（无记忆：重开即全新一组）

import { App, setIcon } from "obsidian";
import { t } from "../lang/helpers";
import type { CodeSpaceSettings } from "../settings";
import type { TerminalHostKind, TerminalId } from "./types";
import type { TerminalManager } from "./session_manager";
import { TerminalGroup, type TerminalSession } from "./session_manager";

/** 面板所需的宿主结构（避免与 main.ts 循环依赖） */
export interface TerminalHostFacade {
	settings: CodeSpaceSettings;
	app: App;
	terminalManager: TerminalManager | null;
	/** 新开一个终端标签页（内嵌面板移交场景；终端视图传空实现） */
	openTerminalView(): Promise<void> | void;
}

const MIN_PANEL_HEIGHT = 120;
const MAX_PANEL_HEIGHT = 900;

export class TerminalPanel {
	readonly hostKind: TerminalHostKind;

	private plugin: TerminalHostFacade;
	private group: TerminalGroup | null = null;
	private rootEl: HTMLElement;
	private tabsEl: HTMLElement;
	private bodyEl: HTMLElement;
	private emptyEl: HTMLElement;
	// 选中的会话（标签栏高亮）
	private activeSessionIdValue: TerminalId | null = null;
	// 当前面板实际挂载进 body 的会话（切换标签时先卸载前一个）
	private attachedSessionId: TerminalId | null = null;
	private unsubscribe: (() => void) | null = null;
	private dragCleanup: (() => void) | null = null;
	private destroyed = false;

	constructor(plugin: TerminalHostFacade, kind: TerminalHostKind, initialGroup?: TerminalGroup) {
		this.plugin = plugin;
		this.hostKind = kind;

		const cls = kind === "view"
			? "code-space-terminal-panel code-space-terminal-panel-view is-hidden"
			: "code-space-terminal-panel is-hidden";
		this.rootEl = createDiv({ cls });

		if (kind === "embedded") {
			const grip = this.rootEl.createDiv({ cls: "code-space-terminal-grip" });
			grip.setAttribute("aria-label", t("TERMINAL_RESIZE"));
			this.setupDragResize(grip);
		}

		const header = this.rootEl.createDiv({ cls: "code-space-terminal-header" });
		this.tabsEl = header.createDiv({ cls: "code-space-terminal-tabs" });
		const actions = header.createDiv({ cls: "code-space-terminal-actions" });

		const newButton = actions.createDiv({ cls: "code-space-terminal-action" });
		setIcon(newButton, "plus");
		newButton.setAttribute("aria-label", t("TERMINAL_NEW_TAB"));
		newButton.addEventListener("click", () => {
			void this.newSession();
		});

		// 内嵌面板提供移交与收起按钮（终端视图关闭走 Obsidian 标签页）
		if (kind === "embedded") {
			const popOutButton = actions.createDiv({ cls: "code-space-terminal-action" });
			setIcon(popOutButton, "external-link");
			popOutButton.setAttribute("aria-label", t("TERMINAL_PANEL_POP_OUT"));
			popOutButton.addEventListener("click", () => {
				void this.popOutToView();
			});

			const closeButton = actions.createDiv({ cls: "code-space-terminal-action" });
			setIcon(closeButton, "x");
			closeButton.setAttribute("aria-label", t("TERMINAL_PANEL_CLOSE"));
			closeButton.addEventListener("click", () => {
				this.setVisible(false);
			});
		}

		this.bodyEl = this.rootEl.createDiv({ cls: "code-space-terminal-body" });
		this.emptyEl = this.bodyEl.createDiv({
			cls: "code-space-terminal-empty",
			text: t("TERMINAL_PANEL_EMPTY"),
		});

		const manager = this.manager;
		if (manager) {
			// 每个宿主（终端页面 / 内嵌面板）拥有独立的一组会话；
			// 面板销毁即整组关闭（无记忆：重开即全新一组）。
			// 终端视图可能传入待接管的组（内嵌面板移交的会话）
			this.group = initialGroup ?? manager.createGroup();
			const unsubscribeChanges = this.group.onSessionsChanged(() => this.renderTabs());
			this.unsubscribe = () => {
				unsubscribeChanges();
				manager.destroyGroup(this.group!);
				this.group = null;
			};
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

	/** 展示面板；无选中会话时接管最近使用的会话（无会话则新建） */
	async show(cwd?: string): Promise<void> {
		if (this.destroyed) {
			return;
		}
		const group = this.group;
		if (!group) {
			return;
		}
		this.setVisible(true);

		let session = this.activeSessionIdValue ? group.getSession(this.activeSessionIdValue) : undefined;
		if (!session) {
			session = group.latestSession() ?? undefined;
		}
		if (!session) {
			try {
				session = await group.createSession(cwd);
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
			this.attachActive();
		} else {
			this.detachActive();
		}
	}

	selectSession(id: TerminalId): void {
		if (this.destroyed) {
			return;
		}
		const group = this.group;
		const session = group?.getSession(id);
		if (!group || !session) {
			return;
		}
		this.activeSessionIdValue = id;
		group.markAttached(id);
		this.renderTabs();
		if (this.isVisible) {
			this.attachSession(session);
		}
	}

	async newSession(): Promise<void> {
		if (this.destroyed) {
			return;
		}
		const group = this.group;
		if (!group) {
			return;
		}
		try {
			const session = await group.createSession();
			this.selectSession(session.info.id);
		} catch {
			// 失败提示由管理器负责
		}
	}

	/** 把当前会话移交到一个新的终端标签页（仅内嵌面板提供） */
	private async popOutToView(): Promise<void> {
		const manager = this.manager;
		const group = this.group;
		if (!manager || !group || !this.activeSessionIdValue) {
			return;
		}
		const session = group.getSession(this.activeSessionIdValue);
		if (!session) {
			return;
		}
		// 新建目标组并转移会话（进程与组件保持存活），登记给下一个打开的终端视图
		const target = manager.createGroup();
		manager.moveSessionBetween(group, target, session.info.id);
		manager.claimGroupNextView(target);
		this.activeSessionIdValue = null;
		this.detachActive();
		try {
			await this.plugin.openTerminalView();
		} finally {
			this.setVisible(false);
			this.renderTabs();
		}
	}

	refreshTheme(): void {
		if (this.destroyed || !this.activeSessionIdValue) {
			return;
		}
		this.group?.getSession(this.activeSessionIdValue)?.component.refreshTheme();
	}

	focus(): void {
		if (this.activeSessionIdValue) {
			this.group?.getSession(this.activeSessionIdValue)?.component.focus();
		}
	}

	/** 销毁面板并关闭整组会话（宿主关闭 = 该组终端全部终止） */
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
			this.group?.getSession(this.attachedSessionId)?.component.detach();
		}
		this.attachedSessionId = session.info.id;
		this.emptyEl.remove();
		session.component.attachTo(this.bodyEl);
		session.component.focus();
	}

	private attachActive(): void {
		const session = this.activeSessionIdValue ? this.group?.getSession(this.activeSessionIdValue) : undefined;
		if (session) {
			this.attachSession(session);
		}
	}

	private detachActive(): void {
		if (!this.attachedSessionId) {
			return;
		}
		const component = this.group?.getSession(this.attachedSessionId)?.component;
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
		const group = this.group;
		const sessions = group?.sessions ?? [];

		// 当前选中会话被关闭时，自动切到剩余最近使用的会话
		if (this.activeSessionIdValue && !sessions.some((s) => s.info.id === this.activeSessionIdValue)) {
			let latest: TerminalSession | null = null;
			for (const candidate of sessions) {
				if (!latest || candidate.lastAttachedAt >= latest.lastAttachedAt) {
					latest = candidate;
				}
			}
			this.activeSessionIdValue = latest ? latest.info.id : null;
		}

		this.tabsEl.empty();
		for (const session of sessions) {
			this.tabsEl.appendChild(this.buildTabEl(session.info.id, session.info.title, session.info.exited));
		}

		if (this.activeSessionIdValue && this.isVisible) {
			const session = group?.getSession(this.activeSessionIdValue);
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
			this.group?.closeSession(id);
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
