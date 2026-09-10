// 桌面端 Node.js API 访问层
// 复用 external_mount.ts 的惰性 window.require 模式（不修改原文件）
// 所有 Node 访问必须走本模块，避免静态导入（ESLint obsidianmd/no-nodejs-modules）

import { App, FileSystemAdapter, Platform } from "obsidian";

type FsPromisesApi = {
	realpath(path: string): Promise<string>;
	stat(path: string): Promise<FsStatsApi>;
	access(path: string): Promise<void>;
};

type FsSyncApi = {
	existsSync(path: string): boolean;
	mkdirSync(path: string, options: { recursive: boolean }): void;
	rmSync(path: string, options: { recursive: boolean; force: boolean }): void;
	readFileSync(path: string): Uint8Array;
	readFileSync(path: string, encoding: "utf8"): string;
	writeFileSync(path: string, data: Uint8Array | string): void;
	chmodSync(path: string, mode: number): void;
	readdirSync(path: string): string[];
};

type FsStatsApi = {
	isFile(): boolean;
	isDirectory(): boolean;
};

type PathApi = {
	join(...parts: string[]): string;
	dirname(path: string): string;
	basename(path: string): string;
	isAbsolute(path: string): boolean;
};

type ChildProcessApi = {
	execFile(
		file: string,
		args: string[],
		callback: (error: Error | null, stdout: string, stderr: string) => void
	): unknown;
	execSync(command: string, options: { encoding: string }): string;
};

type CryptoApi = {
	createHash(algorithm: string): {
		update(data: Uint8Array): { digest(encoding: string): string };
	};
};

type NodeProcessApi = {
	platform: string;
	arch: string;
	env: Record<string, string | undefined>;
};

function getNodeModule<T>(name: string): T {
	const requireFn = (window as Window & { require?: (module: string) => unknown }).require;
	if (!requireFn) {
		throw new Error("Node modules unavailable");
	}
	return requireFn(name) as T;
}

let fsPromisesCache: FsPromisesApi | null = null;
let fsSyncCache: FsSyncApi | null = null;
let pathCache: PathApi | null = null;
let childProcessCache: ChildProcessApi | null = null;
let cryptoCache: CryptoApi | null = null;
let nodeProcessCache: NodeProcessApi | null = null;

export function getFs(): FsSyncApi {
	if (!fsSyncCache) {
		fsSyncCache = getNodeModule<FsSyncApi>("fs");
	}
	return fsSyncCache;
}

export function getFsPromises(): FsPromisesApi {
	if (!fsPromisesCache) {
		fsPromisesCache = getNodeModule<FsPromisesApi>("fs/promises");
	}
	return fsPromisesCache;
}

export function getPath(): PathApi {
	if (!pathCache) {
		pathCache = getNodeModule<PathApi>("path");
	}
	return pathCache;
}

export function getChildProcess(): ChildProcessApi {
	if (!childProcessCache) {
		childProcessCache = getNodeModule<ChildProcessApi>("child_process");
	}
	return childProcessCache;
}

export function getCrypto(): CryptoApi {
	if (!cryptoCache) {
		cryptoCache = getNodeModule<CryptoApi>("crypto");
	}
	return cryptoCache;
}

export function getNodeProcess(): NodeProcessApi {
	if (!nodeProcessCache) {
		nodeProcessCache = getNodeModule<NodeProcessApi>("process");
	}
	return nodeProcessCache;
}

export function isTerminalDesktop(): boolean {
	return Platform.isDesktopApp;
}

/**
 * 插件目录内的相对路径拼接（统一使用 "/" 分隔符）。
 * Node 的 fs API 与 require 在 Windows 上同样接受正斜杠路径；
 * 这样可以脱离 window.require 独立测试，且跨平台行为确定。
 * 涉及操作系统语义的路径（如 cwd）仍应使用 getPath().join。
 */
export function joinPath(...parts: string[]): string {
	const segments = parts
		.map((part, index) =>
			index === 0
				? part.replace(/[\\/]+$/, "")
				: part.replace(/^[\\/]+|[\\/]+$/g, "")
		)
		.filter((part, index) => index === 0 || part !== "");
	if (segments.length === 0) {
		return "";
	}
	return segments.join("/");
}

/** vault 在磁盘上的绝对路径（终端 cwd 的基础） */
export function getVaultBasePath(app: App): string {
	const adapter = app.vault.adapter;
	if (adapter instanceof FileSystemAdapter) {
		return adapter.getBasePath();
	}
	const basePath = (adapter as { getBasePath?: () => string }).getBasePath?.();
	if (basePath) {
		return basePath;
	}
	throw new Error("Vault base path unavailable");
}

/**
 * 插件目录绝对路径（node-pty 二进制安装位置）。
 * Obsidian 的 manifest.dir 是相对 vault 的完整路径（如 .obsidian/plugins/code-space），
 * 直接拼接；仅当传入裸文件夹名（回退场景）时按 configDir/plugins 组装。
 */
export function resolvePluginDir(app: App, pluginDir: string): string {
	if (/[\\/]/.test(pluginDir)) {
		return getPath().join(getVaultBasePath(app), pluginDir);
	}
	const configDir = (app.vault as { configDir?: string }).configDir;
	if (!configDir) {
		throw new Error("Vault config directory unavailable");
	}
	return getPath().join(getVaultBasePath(app), configDir, "plugins", pluginDir);
}

export type { FsSyncApi, FsPromisesApi, PathApi, ChildProcessApi, CryptoApi, NodeProcessApi, FsStatsApi };
