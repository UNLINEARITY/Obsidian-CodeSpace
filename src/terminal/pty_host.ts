// PTY 进程封装：加载 node-pty、生成会话进程并守护生命周期

import { getChildProcess, getNodeProcess, joinPath } from "./node_access";
import type { PtyFactory, PtyLike, PtySpawnOptions } from "./types";

/** 从插件目录加载已安装的 node-pty（CommonJS 模块） */
export function loadPtyFactory(pluginDir: string): PtyFactory {
	const requireFn = (window as Window & { require?: (module: string) => unknown }).require;
	if (!requireFn) {
		throw new Error("Node modules unavailable");
	}
	const modulePath = joinPath(pluginDir, "node_modules", "node-pty");
	const ptyModule = requireFn(modulePath) as { spawn?: PtyFactory } | null;
	if (!ptyModule || typeof ptyModule.spawn !== "function") {
		throw new Error(`node-pty is not loadable at ${modulePath}`);
	}
	return ptyModule.spawn;
}

/** 在宿主环境变量上注入终端相关变量（injected 键不覆盖继承值） */
export function buildPtyEnv(
	base: Record<string, string | undefined>,
	injected: Record<string, string> = {}
): Record<string, string> {
	const env: Record<string, string> = {};
	for (const [key, value] of Object.entries(base)) {
		if (value !== undefined) {
			env[key] = value;
		}
	}
	env.TERM = "xterm-256color";
	env.COLORTERM = "truecolor";
	for (const [key, value] of Object.entries(injected)) {
		if (!(key in env)) {
			env[key] = value;
		}
	}
	return env;
}

const FALLBACK_PTY_LOCALE = "en_US.UTF-8";

/** 归一化 `defaults read -g AppleLocale` 输出：`zh_CN@rg=zzzz` → `zh_CN.UTF-8` */
export function normalizeAppleLocale(raw: string | null | undefined): string {
	const base = (raw ?? "").trim().split("@")[0]?.trim() ?? "";
	if (!base) {
		return FALLBACK_PTY_LOCALE;
	}
	return base.includes(".") ? base : `${base}.UTF-8`;
}

/** 纯函数：仅 darwin 且 env 缺失 LANG/LC_ALL 时计算需注入的 locale 变量 */
export function resolveLocaleEnv(
	env: Record<string, string | undefined>,
	platform: string,
	appleLocale: string | null | undefined
): Record<string, string> {
	if (platform !== "darwin" || env.LANG || env.LC_ALL) {
		return {};
	}
	return { LANG: normalizeAppleLocale(appleLocale) };
}

let localeEnvCache: Record<string, string> | null = null;

/**
 * 读取 macOS 系统区域并缓存（进程内仅执行一次 `defaults read`）。
 * GUI 启动的 Obsidian 常无 LANG/LC_ALL，shell 会跑在 C locale，
 * 导致中文文件名乱码、git 路径转义等问题。
 */
export function getDefaultLocaleEnv(platform: string): Record<string, string> {
	if (platform !== "darwin") {
		return {};
	}
	if (!localeEnvCache) {
		let raw: string | null = null;
		try {
			raw = getChildProcess().execSync("/usr/bin/defaults read -g AppleLocale", { encoding: "utf8" });
		} catch (error) {
			// 读取失败（命令缺失/被禁用）→ 走兜底 locale
			console.debug("Code Space: failed to read AppleLocale:", error);
		}
		localeEnvCache = resolveLocaleEnv(getNodeProcess().env, platform, raw);
	}
	return localeEnvCache;
}

type Unsubscribe = () => void;

/**
 * 单个 PTY 进程的守护封装：
 * - kill 幂等（fire-once）
 * - onData/onExit 返回退订函数，避免监听器泄漏
 */
export class PtyProcess {
	private process: PtyLike;
	private exited = false;
	private killed = false;
	private dataListeners = new Set<(data: string) => void>();
	private exitListeners = new Set<(exitCode: number) => void>();
	private dataDisposable: { dispose(): void } | null = null;
	private exitDisposable: { dispose(): void } | null = null;

	private constructor(process: PtyLike) {
		this.process = process;
		this.dataDisposable = process.onData((data) => {
			for (const listener of [...this.dataListeners]) {
				listener(data);
			}
		});
		this.exitDisposable = process.onExit(({ exitCode }) => {
			this.exited = true;
			for (const listener of [...this.exitListeners]) {
				listener(exitCode);
			}
		});
	}

	static spawn(options: PtySpawnOptions, factory: PtyFactory): PtyProcess {
		return new PtyProcess(factory(options.file, options.args, options));
	}

	/** 使用当前进程环境构建默认 spawn 选项 */
	static baseOptions(): Pick<PtySpawnOptions, "env"> {
		return { env: buildPtyEnv(getNodeProcess().env, getDefaultLocaleEnv(getNodeProcess().platform)) };
	}

	get pid(): number {
		return this.process.pid;
	}

	get hasExited(): boolean {
		return this.exited;
	}

	get cols(): number {
		return this.process.cols;
	}

	get rows(): number {
		return this.process.rows;
	}

	write(data: string): void {
		if (this.exited || this.killed) {
			return;
		}
		this.process.write(data);
	}

	resize(cols: number, rows: number): void {
		if (this.exited || this.killed) {
			return;
		}
		try {
			this.process.resize(cols, rows);
		} catch (error) {
			// 进程退出瞬间的 resize 失败可忽略
			console.debug("Code Space: pty resize failed:", error);
		}
	}

	kill(): void {
		if (this.killed) {
			return;
		}
		this.killed = true;
		try {
			this.process.kill();
		} catch (error) {
			// 进程已退出时 kill 可能抛错，忽略
			console.debug("Code Space: pty kill failed:", error);
		}
		this.disposeListeners();
	}

	onData(listener: (data: string) => void): Unsubscribe {
		this.dataListeners.add(listener);
		return () => {
			this.dataListeners.delete(listener);
		};
	}

	onExit(listener: (exitCode: number) => void): Unsubscribe {
		if (this.exited) {
			listener(-1);
			return () => { /* noop */ };
		}
		this.exitListeners.add(listener);
		return () => {
			this.exitListeners.delete(listener);
		};
	}

	dispose(): void {
		this.kill();
		this.disposeListeners();
	}

	private disposeListeners(): void {
		this.dataDisposable?.dispose();
		this.exitDisposable?.dispose();
		this.dataDisposable = null;
		this.exitDisposable = null;
		this.dataListeners.clear();
		this.exitListeners.clear();
	}
}
