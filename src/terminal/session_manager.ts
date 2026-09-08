// 终端会话管理器：持有全部 PTY 会话（跨视图存活），管理容量、淘汰与设置下发

import { App, Notice, Platform } from "obsidian";
import { t } from "../lang/helpers";
import type { CodeSpaceSettings } from "../settings";
import { TerminalBinaryManager, type BinaryProgressStage } from "./binary_manager";
import {
	getFs,
	getFsPromises,
	getNodeProcess,
	getPath,
	getVaultBasePath,
	isTerminalDesktop,
	resolvePluginDir,
} from "./node_access";
import { buildPtyEnv, loadPtyFactory, PtyProcess } from "./pty_host";
import { resolveShell, type ResolvedShell } from "./shell_detector";
import { TerminalComponent } from "./terminal_component";
import type { PtyFactory, PtySpawnOptions, TerminalId, TerminalSessionInfo } from "./types";

/** 管理器所需的插件结构（避免与 main.ts 循环依赖） */
export interface TerminalPluginFacade {
	settings: CodeSpaceSettings;
	app: App;
	/** 插件安装目录名（manifest.dir，用于定位 node-pty 安装位置） */
	manifestDir: string;
}

export interface TerminalSession {
	info: TerminalSessionInfo;
	component: TerminalComponent;
	pty: PtyProcess;
	lastAttachedAt: number;
	/** 是否由独立终端视图持有（关闭视图即关闭会话） */
	viewOwned: boolean;
}

/** 可注入依赖（测试时替换为假实现） */
export interface TerminalManagerDeps {
	ensureBinaries(): Promise<void>;
	loadFactory(): PtyFactory;
	spawnProcess(options: PtySpawnOptions, factory: PtyFactory): PtyProcess;
	createComponent(sessionId: TerminalId, options: { fontSize: number; scrollback: number }): TerminalComponent;
	resolveShell(): Promise<ResolvedShell>;
	resolveCwd(): Promise<string>;
	buildEnv(): Record<string, string>;
	notify(message: string): void;
}

function createSessionId(): TerminalId {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class TerminalManager {
	readonly plugin: TerminalPluginFacade;

	private sessionsValue: TerminalSession[] = [];
	private binaryManagerValue: TerminalBinaryManager | null = null;
	private changeListeners = new Set<() => void>();
	private disposed = false;
	private deps: TerminalManagerDeps;
	private createQueue: Promise<unknown> = Promise.resolve();
	private pendingClaimId: TerminalId | null = null;

	constructor(plugin: TerminalPluginFacade, deps?: Partial<TerminalManagerDeps>) {
		this.plugin = plugin;
		this.deps = {
			ensureBinaries: () => this.defaultEnsureBinaries(),
			loadFactory: () => loadPtyFactory(this.pluginDir),
			spawnProcess: (options, factory) => PtyProcess.spawn(options, factory),
			createComponent: (sessionId, options) => new TerminalComponent(sessionId, options),
			resolveShell: () => this.defaultResolveShell(),
			resolveCwd: () => this.resolveCwdForActiveFile(),
			buildEnv: () => buildPtyEnv(getNodeProcess().env),
			notify: (message) => {
				new Notice(message, 4000);
			},
			...deps,
		};
	}

	/** 二进制管理器（惰性创建；需要桌面环境） */
	get binaryManager(): TerminalBinaryManager {
		if (!this.binaryManagerValue) {
			this.binaryManagerValue = new TerminalBinaryManager({ pluginDir: this.pluginDir });
		}
		return this.binaryManagerValue;
	}

	private get pluginDir(): string {
		return resolvePluginDir(this.plugin.app, this.plugin.manifestDir);
	}

	get sessions(): ReadonlyArray<TerminalSession> {
		return this.sessionsValue;
	}

	get activeCount(): number {
		return this.sessionsValue.filter((session) => !session.info.exited).length;
	}

	getSession(id: TerminalId): TerminalSession | undefined {
		return this.sessionsValue.find((session) => session.info.id === id);
	}

	/** 会话列表变化（创建/退出/关闭）订阅 */
	onSessionsChanged(listener: () => void): () => void {
		this.changeListeners.add(listener);
		return () => {
			this.changeListeners.delete(listener);
		};
	}

	/**
	 * 创建新终端会话。满员时先淘汰最旧的已退出会话；
	 * 没有可淘汰会话则提示并拒绝（绝不静默终止运行中的 shell）。
	 * 并发调用按顺序串行执行，避免越过会话数上限。
	 */
	async createSession(cwd?: string, options?: { viewOwned?: boolean }): Promise<TerminalSession> {
		const attempt = this.createQueue.then(
			() => this.createSessionInner(cwd, options),
			() => this.createSessionInner(cwd, options)
		);
		this.createQueue = attempt.catch(() => undefined);
		return attempt;
	}

	private async createSessionInner(cwd?: string, options?: { viewOwned?: boolean }): Promise<TerminalSession> {
		if (this.disposed) {
			throw new Error("Terminal manager disposed");
		}
		if (!isTerminalDesktop()) {
			this.deps.notify(t("TERMINAL_NOTICE_DESKTOP_ONLY"));
			throw new Error("Terminal is desktop only");
		}
		if (!this.plugin.settings.terminalEnabled) {
			this.deps.notify(t("TERMINAL_NOTICE_DISABLED"));
			throw new Error("Terminal is disabled");
		}

		const maxSessions = this.plugin.settings.terminalMaxSessions;
		this.evictExitedSessions(maxSessions);
		if (this.sessionsValue.length >= maxSessions) {
			this.deps.notify(t("TERMINAL_NOTICE_SESSION_LIMIT"));
			throw new Error("Terminal session limit reached");
		}

		await this.deps.ensureBinaries();

		let shell: ResolvedShell;
		let pty: PtyProcess;
		let workingDir: string;
		try {
			shell = await this.deps.resolveShell();
			const factory = this.deps.loadFactory();
			workingDir = cwd ?? await this.deps.resolveCwd();
			pty = this.deps.spawnProcess(
				{
					file: shell.file,
					args: shell.args,
					cwd: workingDir,
					env: this.deps.buildEnv(),
					cols: 80,
					rows: 24,
				},
				factory
			);
		} catch (error) {
			// shell 缺失 / node-pty 加载失败 / 进程启动失败都需要给用户可见反馈
			this.deps.notify(String(error));
			throw error;
		}

		const id = createSessionId();
		const component = this.deps.createComponent(id, {
			fontSize: this.plugin.settings.terminalFontSize,
			scrollback: this.plugin.settings.terminalScrollback,
		});
		const session: TerminalSession = {
			info: {
				id,
				title: this.buildTitle(shell.displayName),
				cwd: workingDir,
				shell: shell.file,
				createdAt: Date.now(),
				exited: false,
			},
			component,
			pty,
			lastAttachedAt: Date.now(),
			viewOwned: options?.viewOwned ?? false,
		};

		pty.onData((data) => component.write(data));
		component.onInput((data) => pty.write(data));
		component.onResize((cols, rows) => pty.resize(cols, rows));
		pty.onExit((exitCode) => {
			session.info.exited = true;
			session.info.exitCode = exitCode;
			// 写入退出提示，避免光标停住无响应的困惑
			component.write(`\r\n\x1b[90m${t("TERMINAL_PROCESS_EXITED")} (${exitCode})\x1b[0m\r\n`);
			this.notifyChanged();
		});

		this.sessionsValue.push(session);
		this.notifyChanged();
		return session;
	}

	/** 关闭会话标签：终止 PTY 并销毁组件 */
	closeSession(id: TerminalId): void {
		const index = this.sessionsValue.findIndex((session) => session.info.id === id);
		if (index < 0) {
			return;
		}
		const [session] = this.sessionsValue.splice(index, 1);
		if (session) {
			session.pty.dispose();
			session.component.dispose();
		}
		this.notifyChanged();
	}

	killAll(): void {
		if (this.sessionsValue.length === 0) {
			return;
		}
		for (const session of this.sessionsValue) {
			session.pty.dispose();
			session.component.dispose();
		}
		this.sessionsValue = [];
		this.notifyChanged();
	}

	dispose(): void {
		this.disposed = true;
		this.killAll();
		this.changeListeners.clear();
	}

	/** 会话被某个宿主选中展示时更新簿记（供后续 LRU 扩展） */
	markAttached(id: TerminalId): void {
		const session = this.getSession(id);
		if (session) {
			session.lastAttachedAt = Date.now();
		}
	}

	/** 登记待接管会话（面板弹出：移交给下一个打开的终端视图） */
	markPendingClaim(id: TerminalId): void {
		if (this.getSession(id)) {
			this.pendingClaimId = id;
		}
	}

	/** 认领待接管会话（新终端视图 onOpen 时调用；认领后清空） */
	claimPendingSession(): TerminalSession | null {
		if (this.pendingClaimId) {
			const session = this.getSession(this.pendingClaimId);
			this.pendingClaimId = null;
			if (session) {
				session.viewOwned = true;
				return session;
			}
		}
		return null;
	}

	/** 最近使用且未被终端视图持有的会话（内嵌面板接管用） */
	latestPanelSession(): TerminalSession | null {
		let latest: TerminalSession | null = null;
		for (const session of this.sessionsValue) {
			if (session.viewOwned) {
				continue;
			}
			if (!latest || session.lastAttachedAt > latest.lastAttachedAt) {
				latest = session;
			}
		}
		return latest;
	}

	/** 设置变化下发给全部组件 */
	applySettings(settings: CodeSpaceSettings): void {
		for (const session of this.sessionsValue) {
			session.component.applySettings({
				fontSize: settings.terminalFontSize,
				scrollback: settings.terminalScrollback,
			});
		}
	}

	/**
	 * 计算新终端的工作目录：当前活动代码文件所在目录（外部挂载解析到真实路径），
	 * 无活动文件时回退 vault 根目录。
	 */
	async resolveCwdForActiveFile(): Promise<string> {
		const basePath = getVaultBasePath(this.plugin.app);
		const activeFile = this.plugin.app.workspace.getActiveFile();
		const folderPath = activeFile?.parent?.path ?? "";
		if (!folderPath) {
			return basePath;
		}
		const joined = getPath().join(basePath, ...folderPath.split("/").filter(Boolean));
		try {
			return await getFsPromises().realpath(joined);
		} catch {
			return joined;
		}
	}

	private evictExitedSessions(maxSessions: number): void {
		let evicted = false;
		while (this.sessionsValue.length >= maxSessions) {
			const oldestExitedIndex = this.sessionsValue.findIndex((session) => session.info.exited);
			if (oldestExitedIndex < 0) {
				break;
			}
			const [session] = this.sessionsValue.splice(oldestExitedIndex, 1);
			if (!session) {
				break;
			}
			session.pty.dispose();
			session.component.dispose();
			evicted = true;
		}
		if (evicted) {
			// 淘汰移除了标签/终端 DOM，必须通知宿主重渲染
			this.notifyChanged();
		}
	}

	private buildTitle(displayName: string): string {
		const prefix = `${displayName} `;
		const count = this.sessionsValue.filter((session) => session.info.title.startsWith(prefix)).length;
		return `${prefix}${count + 1}`;
	}

	private notifyChanged(): void {
		for (const listener of [...this.changeListeners]) {
			listener();
		}
	}

	private async defaultEnsureBinaries(): Promise<void> {
		const manager = this.binaryManager;
		if (!manager.isPlatformSupported()) {
			this.deps.notify(t("TERMINAL_NOTICE_PLATFORM_UNSUPPORTED"));
			throw new Error("Terminal platform is not supported");
		}
		const wasReady = manager.checkInstalledSync();
		try {
			await manager.ensureInstalled((stage: BinaryProgressStage) => {
				if (stage === "downloading") {
					this.deps.notify(t("TERMINAL_NOTICE_DOWNLOADING"));
				}
			});
		} catch (error) {
			// 下载/校验/解压失败必须给用户可见反馈
			console.error("Code Space: terminal binary installation failed:", error);
			this.deps.notify(`${t("TERMINAL_NOTICE_DOWNLOAD_FAIL")}: ${String(error instanceof Error ? error.message : error)}`);
			throw error;
		}
		if (!wasReady) {
			this.deps.notify(t("TERMINAL_NOTICE_DOWNLOAD_SUCCESS"));
		}
	}

	private async defaultResolveShell(): Promise<ResolvedShell> {
		const override = this.plugin.settings.terminalShell.trim();
		const resolved = await resolveShell({
			platform: {
				isWin: Platform.isWin,
				isMacOS: Platform.isMacOS,
				isLinux: Platform.isLinux,
			},
			env: getNodeProcess().env,
			fileExists: (path) => getFs().existsSync(path),
			override,
		});
		if (override && resolved.file !== override) {
			this.deps.notify(t("TERMINAL_NOTICE_SHELL_MISSING"));
		}
		return resolved;
	}
}
