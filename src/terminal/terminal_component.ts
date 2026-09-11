// xterm.js 终端组件封装
// - Terminal 只 open 一次，DOM 根节点在宿主之间移动（保留滚动回溯）
// - 所有 DOM/样式访问通过 ownerDocument（支持弹出窗口）

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import type { TerminalId } from "./types";
import { buildTerminalFontFamily, readMonospaceFont, readThemeVars, themeFromVars } from "./terminal_theme";

export interface TerminalComponentOptions {
	fontSize: number;
	scrollback: number;
}

const FIT_DEBOUNCE_MS = 50;
const WEBGL_RETRY_COOLDOWN_MS = 1000;

export class TerminalComponent {
	readonly sessionId: TerminalId;

	private term: Terminal;
	private fitAddon: FitAddon;
	private webglAddon: WebglAddon | null = null;
	private container: HTMLElement | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private webglRetryHandler: (() => void) | null = null;
	private lastWebglRetryAt = 0;
	private fitTimer: number | null = null;
	private disposed = false;
	private inputHandler: ((data: string) => void) | null = null;
	private resizeHandler: ((cols: number, rows: number) => void) | null = null;
	private fontSize: number;
	private wheelListener: ((event: WheelEvent) => void) | null = null;

	constructor(sessionId: TerminalId, options: TerminalComponentOptions) {
		this.sessionId = sessionId;
		this.fontSize = options.fontSize;
		this.term = new Terminal({
			fontSize: options.fontSize,
			scrollback: options.scrollback,
			// VSCode 同款排版参数，显式声明避免默认值漂移
			letterSpacing: 0,
			lineHeight: 1,
			convertEol: false,
			cursorBlink: true,
			allowProposedApi: true,
		});
		this.fitAddon = new FitAddon();
		this.term.loadAddon(this.fitAddon);
		// Unicode 9+ 宽度表：修正 emoji 等宽字符下的光标错位（VSCode 同款默认）
		this.term.loadAddon(new Unicode11Addon());
		this.term.unicode.activeVersion = "11";
		this.term.onData((data) => {
			this.inputHandler?.(data);
		});
	}

	/** 终端 DOM 根节点（open 之后才存在；在宿主间移动的就是这个元素） */
	get containerEl(): HTMLElement | null {
		return this.container;
	}

	get isOpen(): boolean {
		return this.container !== null;
	}

	get cols(): number {
		return this.term.cols;
	}

	get rows(): number {
		return this.term.rows;
	}

	/** 用户输入回调（由会话管理器接线到 pty.write） */
	onInput(handler: (data: string) => void): void {
		this.inputHandler = handler;
	}

	/** 尺寸变化回调（由会话管理器接线到 pty.resize） */
	onResize(handler: (cols: number, rows: number) => void): void {
		this.resizeHandler = handler;
	}

	/** 输出数据（pty → 终端），未挂载时写入缓冲区，回溯不丢失 */
	write(data: string): void {
		if (this.disposed) {
			return;
		}
		this.term.write(data);
	}

	/**
	 * 挂载到宿主元素。首次调用执行 term.open()；之后调用仅移动 DOM。
	 * 宿主必须已连接到文档（ownerDocument 可用）。
	 */
	attachTo(parent: HTMLElement): void {
		if (this.disposed) {
			return;
		}
		if (!this.container) {
			this.container = parent.createDiv({ cls: "code-space-terminal-xterm" });
			// 字体与主题必须在 open 之前设置，保证首次字符宽度测量即用正确字体
			this.applyFont();
			this.refreshTheme();
			// Ctrl/Cmd+滚轮缩放本终端字号（单窗口行为，与正常终端一致，不写全局设置；
			// 阻止冒泡避免编辑器同事件二次缩放）
			this.wheelListener = (event: WheelEvent): void => {
				if (!(event.ctrlKey || event.metaKey)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				const next = Math.min(36, Math.max(9, this.fontSize + (event.deltaY < 0 ? 1 : -1)));
				if (next === this.fontSize) {
					return;
				}
				this.fontSize = next;
				this.term.options.fontSize = next;
				this.scheduleFit();
			};
			this.container.addEventListener("wheel", this.wheelListener, { passive: false });
			this.term.open(this.container);
			this.loadWebglAddon();
			this.fit();
		} else if (this.container.parentElement !== parent) {
			// 跨文档移动（弹出窗口）时，旧文档的观察器/定时器/WebGL 上下文必须重建，
			// 并按新文档的主题变量刷新配色与字体
			const crossesDocument = this.container.ownerDocument !== parent.ownerDocument;
			if (crossesDocument) {
				this.stopResizeObserver();
				this.unloadWebglAddon();
			}
			parent.appendChild(this.container);
			if (crossesDocument) {
				this.applyFont();
				this.refreshTheme();
				this.loadWebglAddon();
				this.fit();
			}
		}
		this.startResizeObserver();
		this.startWebglRetryWatch();
		// 挂载后若此前 WebGL 上下文已丢失（如同窗口内切换标签后切回），
		// 立即尝试恢复；冷却机制防止重复加载
		this.scheduleWebglRetry();
		this.term.focus();
	}

	/** 从当前宿主移除（会话保持运行，回溯保留） */
	detach(): void {
		this.stopResizeObserver();
		this.container?.remove();
	}

	focus(): void {
		if (!this.disposed && this.container) {
			this.term.focus();
		}
	}

	/** 立即按容器尺寸适配（防抖） */
	fit(): void {
		this.scheduleFit();
	}

	applySettings(options: TerminalComponentOptions): void {
		if (this.disposed) {
			return;
		}
		this.fontSize = options.fontSize;
		this.term.options.fontSize = options.fontSize;
		this.term.options.scrollback = options.scrollback;
		this.scheduleFit();
	}

	/** 依据宿主文档的主题变量刷新终端配色 */
	refreshTheme(): void {
		if (this.disposed || !this.container) {
			return;
		}
		this.term.options.theme = themeFromVars(readThemeVars(this.container));
	}

	/** 主题或字体变化时统一刷新外观（css-change 事件）；字体变化需重新测量并 fit */
	refreshAppearance(): void {
		if (this.disposed || !this.container) {
			return;
		}
		this.applyFont();
		this.refreshTheme();
		this.scheduleFit();
	}

	dispose(): void {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.stopResizeObserver();
		this.unloadWebglAddon();
		if (this.wheelListener && this.container) {
			this.container.removeEventListener("wheel", this.wheelListener);
			this.wheelListener = null;
		}
		this.term.dispose();
		this.container?.remove();
		this.container = null;
	}

	private applyFont(): void {
		if (!this.container) {
			return;
		}
		this.term.options.fontFamily = buildTerminalFontFamily(readMonospaceFont(this.container));
	}

	/**
	 * 加载 WebGL 渲染器（VSCode 级渲染质感）。
	 * WebGL 不可用或上下文丢失时静默降级为默认 DOM 渲染器。
	 */
	private loadWebglAddon(): void {
		if (this.disposed || this.webglAddon || !this.container) {
			return;
		}
		try {
			const addon = new WebglAddon();
			addon.onContextLoss(() => {
				this.unloadWebglAddon();
			});
			this.term.loadAddon(addon);
			this.webglAddon = addon;
		} catch (error) {
			// WebGL 不可用（驱动限制/无 GPU）：保持 DOM 渲染器
			console.debug("Code Space: terminal webgl renderer unavailable, using DOM renderer:", error);
			this.webglAddon = null;
		}
	}

	private unloadWebglAddon(): void {
		if (!this.webglAddon) {
			return;
		}
		try {
			this.webglAddon.dispose();
		} catch {
			// 上下文已丢失时 dispose 可能抛错，忽略
		}
		this.webglAddon = null;
	}

	private startResizeObserver(): void {
		if (!this.container || this.resizeObserver) {
			return;
		}
		const view = this.container.ownerDocument.defaultView;
		if (!view || typeof view.ResizeObserver !== "function") {
			return;
		}
		this.resizeObserver = new view.ResizeObserver(() => {
			this.scheduleFit();
		});
		this.resizeObserver.observe(this.container);
	}

	private stopResizeObserver(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.clearFitTimer();
		this.stopWebglRetryWatch();
	}

	/**
	 * 监听可见性/焦点恢复事件，在 WebGL 上下文丢失后自动重试加载
	 * （macOS 上自动显卡切换、窗口遮挡都可能触发上下文丢失）。
	 */
	private startWebglRetryWatch(): void {
		if (!this.container || this.webglRetryHandler) {
			return;
		}
		const view = this.container.ownerDocument.defaultView;
		if (!view) {
			return;
		}
		const handler = (): void => {
			if (!view.document.hidden) {
				this.scheduleWebglRetry();
			}
		};
		this.webglRetryHandler = handler;
		view.document.addEventListener("visibilitychange", handler);
		view.addEventListener("focus", handler);
	}

	private stopWebglRetryWatch(): void {
		const view = this.container?.ownerDocument.defaultView;
		if (this.webglRetryHandler && view) {
			view.document.removeEventListener("visibilitychange", this.webglRetryHandler);
			view.removeEventListener("focus", this.webglRetryHandler);
		}
		this.webglRetryHandler = null;
	}

	private scheduleWebglRetry(): void {
		if (this.disposed || this.webglAddon || !this.container) {
			return;
		}
		const now = Date.now();
		if (now - this.lastWebglRetryAt < WEBGL_RETRY_COOLDOWN_MS) {
			// 冷却期内不重复尝试，避免事件风暴下的重试循环
			return;
		}
		this.lastWebglRetryAt = now;
		this.loadWebglAddon();
	}

	private scheduleFit(): void {
		if (this.disposed || !this.container) {
			return;
		}
		const view = this.container.ownerDocument.defaultView;
		if (!view) {
			return;
		}
		if (this.fitTimer !== null) {
			view.clearTimeout(this.fitTimer);
		}
		this.fitTimer = view.setTimeout(() => {
			this.fitTimer = null;
			this.fitNow();
		}, FIT_DEBOUNCE_MS);
	}

	private clearFitTimer(): void {
		if (this.fitTimer !== null && this.container?.ownerDocument.defaultView) {
			this.container.ownerDocument.defaultView.clearTimeout(this.fitTimer);
		}
		this.fitTimer = null;
	}

	private fitNow(): void {
		if (this.disposed || !this.container || !this.container.isConnected) {
			return;
		}
		try {
			const dimensions = this.fitAddon.proposeDimensions();
			if (!dimensions || dimensions.cols <= 0 || dimensions.rows <= 0) {
				return;
			}
			if (dimensions.cols === this.term.cols && dimensions.rows === this.term.rows) {
				return;
			}
			this.fitAddon.fit();
			this.resizeHandler?.(this.term.cols, this.term.rows);
		} catch (error) {
			// 容器未连接或不可见时 fit 可能抛错，忽略
			console.debug("Code Space: terminal fit failed:", error);
		}
	}
}
