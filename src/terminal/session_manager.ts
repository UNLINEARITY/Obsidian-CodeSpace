// 终端会话管理：TerminalManager 为共享服务（二进制/shell/工厂/设置下发），
// 每个宿主（终端页面 / 内嵌面板）通过 createGroup() 拥有独立的一组会话；
// 组随宿主销毁而关闭（无记忆模型：重开即全新一组）

import { App, Notice, Platform } from "obsidian";
import { t } from "../lang/helpers";
import type { CodeSpaceSettings } from "../settings";
import { TerminalBinaryManager } from "./binary_manager";
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

/**
 * 一组终端会话（归属单一宿主：终端页面或内嵌面板）。
 * 组销毁即关闭组内全部会话。
 */
export class TerminalGroup {
	private sessionsValue: TerminalSession[] = [];
	private changeListeners = new Set<() => void>();
	private disposed = false;

	constructor(private manager: TerminalManager) {}

	get sessions(): ReadonlyArray<TerminalSession> {
		return this.sessionsValue;
	}

	getSession(id: TerminalId): TerminalSession | undefined {
		return this.sessionsValue.find((session) => session.info.id === id);
	}

	onSessionsChanged(listener: () => void): () => void {
		this.changeListeners.add(listener);
		return () => {
			this.changeListeners.delete(listener);
		};
	}

	/** 组内最近使用过的会话；无会话返回 null */
	latestSession(): TerminalSession | null {
		let latest: TerminalSession | null = null;
		for (const session of this.sessionsValue) {
			if (!latest || session.lastAttachedAt >= latest.lastAttachedAt) {
				latest = session;
			}
		}
		return latest;
	}

	/** 创建新会话（容量与淘汰由管理器统一裁决） */
	createSession(cwd?: string): Promise<TerminalSession> {
		return this.manager.createSessionFor(this, cwd);
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

	/** 会话被选中展示时更新簿记 */
	markAttached(id: TerminalId): void {
		const session = this.getSession(id);
		if (session) {
			session.lastAttachedAt = Date.now();
		}
	}

	/** 销毁组：关闭全部会话（宿主关闭时调用） */
	dispose(): void {
		this.disposed = true;
		this.closeAll();
		this.changeListeners.clear();
	}

	/** 仅移出簿记（跨组移交用；不终止进程不销毁组件） */
	detachSession(id: TerminalId): TerminalSession | null {
		const index = this.sessionsValue.findIndex((session) => session.info.id === id);
		if (index < 0) {
			return null;
		}
		const [session] = this.sessionsValue.splice(index, 1);
		this.notifyChanged();
		return session ?? null;
	}

	/** 接收来自其他组的会话（跨组移交用） */
	adopt(session: TerminalSession): void {
		this.sessionsValue.push(session);
		this.notifyChanged();
	}

	/** 组内下一个会话标题（同名递增编号） */
	nextTitle(displayName: string): string {
		const prefix = `${displayName} `;
		const count = this.sessionsValue.filter((session) => session.info.title.startsWith(prefix)).length;
		return `${prefix}${count + 1}`;
	}

	/** 登记会话（由管理器创建后调用） */
	add(session: TerminalSession): void {
		this.sessionsValue.push(session);
		this.notifyChanged();
	}

	/** 会话状态变化（退出/淘汰）时通知宿主重渲染 */
	notifyChanged(): void {
		for (const listener of [...this.changeListeners]) {
			listener();
		}
	}

	private closeAll(): void {
		for (const session of this.sessionsValue) {
			session.pty.dispose();
			session.component.dispose();
		}
		this.sessionsValue = [];
		this.notifyChanged();
	}
}

export class TerminalManager {
	readonly plugin: TerminalPluginFacade;

	private groups = new Set<TerminalGroup>();
	private pendingClaimGroup: TerminalGroup | null = null;
	private binaryManagerValue: TerminalBinaryManager | null = null;
	private createQueue: Promise<unknown> = Promise.resolve();
	private disposed = false;
	private deps: TerminalManagerDeps;

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

	/** 全部组的会话总数（容量按全局总量裁决，防止资源失控） */
	get totalSessionCount(): number {
		let count = 0;
		for (const group of this.groups) {
			count += group.sessions.length;
		}
		return count;
	}

	/** 新建一组会话（每个终端页面 / 内嵌面板各持一组） */
	createGroup(): TerminalGroup {
		const group = new TerminalGroup(this);
		this.groups.add(group);
		return group;
	}

	/** 销毁组（关闭其全部会话） */
	destroyGroup(group: TerminalGroup): void {
		if (this.pendingClaimGroup === group) {
			this.pendingClaimGroup = null;
		}
		this.groups.delete(group);
		group.dispose();
	}

	/** 把会话从一个组移交到另一个组（进程与组件保持存活，仅转移簿记） */
	moveSessionBetween(from: TerminalGroup, to: TerminalGroup, id: TerminalId): boolean {
		const session = from.detachSession(id);
		if (!session) {
			return false;
		}
		to.adopt(session);
		return true;
	}

	/** 登记待接管组：下一个打开的终端视图使用该组（内嵌面板移交场景） */
	claimGroupNextView(group: TerminalGroup): void {
		this.pendingClaimGroup = group;
	}

	/** 取走待接管组（无则返回 null） */
	consumePendingGroup(): TerminalGroup | null {
		const group = this.pendingClaimGroup;
		this.pendingClaimGroup = null;
		return group;
	}

	/** 关闭全部组的全部会话 */
	killAll(): void {
		for (const group of [...this.groups]) {
			group.dispose();
		}
	}

	dispose(): void {
		this.disposed = true;
		this.killAll();
	}

	/** 设置变化下发给全部组的全部组件 */
	applySettings(settings: CodeSpaceSettings): void {
		for (const group of this.groups) {
			for (const session of group.sessions) {
				session.component.applySettings({
					fontSize: settings.terminalFontSize,
					scrollback: settings.terminalScrollback,
				});
			}
		}
	}

	/**
	 * 计算新终端的工作目录：当前活动代码文件所在目录，
	 * 无活动文件时回退 vault 根目录。
	 */
	async resolveCwdForActiveFile(): Promise<string> {
		const basePath = getVaultBasePath(this.plugin.app);
		const activeFile = this.plugin.app.workspace.getActiveFile();
		const folderPath = activeFile?.parent?.path ?? "";
		if (!folderPath) {
			return basePath;
		}
		const segments = folderPath.split("/").filter(Boolean);
		if (segments.length === 0) {
			return basePath;
		}
		const joined = getPath().join(basePath, ...segments);
		try {
			return await getFsPromises().realpath(joined);
		} catch {
			return joined;
		}
	}

	/**
	 * 为指定组创建新会话。全局会话总数达到上限时先淘汰该组内最旧的已退出会话；
	 * 没有可淘汰会话则提示并拒绝（绝不静默终止运行中的 shell）。
	 * 并发调用按顺序串行执行，避免越过会话数上限。
	 */
	createSessionFor(group: TerminalGroup, cwd?: string): Promise<TerminalSession> {
		const attempt = this.createQueue.then(
			() => this.createSessionInner(group, cwd),
			() => this.createSessionInner(group, cwd)
		);
		this.createQueue = attempt.catch(() => undefined);
		return attempt;
	}

	private async createSessionInner(group: TerminalGroup, cwd?: string): Promise<TerminalSession> {
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
		this.evictExitedSessions(group, maxSessions);
		if (this.totalSessionCount >= maxSessions) {
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
				title: group.nextTitle(shell.displayName),
				cwd: workingDir,
				shell: shell.file,
				createdAt: Date.now(),
				exited: false,
			},
			component,
			pty,
			lastAttachedAt: Date.now(),
		};

		pty.onData((data) => component.write(data));
		component.onInput((data) => pty.write(data));
		component.onResize((cols, rows) => pty.resize(cols, rows));
		pty.onExit((exitCode) => {
			session.info.exited = true;
			session.info.exitCode = exitCode;
			// 写入退出提示，避免光标停住无响应的困惑
			component.write(`\r\n\x1b[90m${t("TERMINAL_PROCESS_EXITED")} (${exitCode})\x1b[0m\r\n`);
			group.notifyChanged();
		});

		group.add(session);
		return session;
	}

	private evictExitedSessions(group: TerminalGroup, maxSessions: number): void {
		while (this.totalSessionCount >= maxSessions) {
			const oldestExitedIndex = group.sessions.findIndex((session) => session.info.exited);
			if (oldestExitedIndex < 0) {
				break;
			}
			const session = group.sessions[oldestExitedIndex];
			if (!session) {
				break;
			}
			group.closeSession(session.info.id);
		}
	}

	private async defaultEnsureBinaries(): Promise<void> {
		const manager = this.binaryManager;
		if (!manager.isPlatformSupported()) {
			this.deps.notify(t("TERMINAL_NOTICE_PLATFORM_UNSUPPORTED"));
			throw new Error("Terminal platform is not supported");
		}
		const status = manager.refreshStatus();
		if (status === "ready") {
			return;
		}
		if (status === "remove-pending") {
			this.deps.notify(t("TERMINAL_NOTICE_REMOVE_PENDING"));
			throw new Error("Terminal removal is pending a restart");
		}
		this.deps.notify(t("TERMINAL_NOTICE_NOT_INSTALLED"));
		throw new Error("Terminal support files are not installed");
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
