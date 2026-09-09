// node-pty 原生二进制管理器
// 首次使用时从 GitHub Releases 下载平台对应的预编译 zip（N-API 产物），
// SHA-256 校验后解压到 <pluginDir>/node_modules/node-pty/，
// Windows 上额外写入 ConPTY 渲染进程补丁。

import { requestUrl } from "obsidian";
import { WINDOWSCONOUT_PATCH } from "./conout_patch";
import { getChildProcess, getCrypto, getFs, getNodeProcess, joinPath } from "./node_access";
import type { TerminalBinaryStatus } from "./types";

// 二进制资产托管在本仓库的固定 release tag 上，与插件版本号解耦
export const PTY_RELEASE_OWNER = "UNLINEARITY";
export const PTY_RELEASE_REPO = "Obsidian-CodeSpace";
export const PTY_RELEASE_TAG = "pty-prebuilds-v1";

/** v1 支持的平台-架构组合（与 CI 构建矩阵一致） */
const SUPPORTED_PLATFORMS: ReadonlySet<string> = new Set([
	"win32-x64",
	"win32-arm64",
	"darwin-x64",
	"darwin-arm64",
	"linux-x64",
]);

export type BinaryErrorKind =
	| "unavailable"
	| "unsupported"
	| "download"
	| "verify"
	| "extract"
	| "layout";

export class TerminalBinaryError extends Error {
	constructor(
		public readonly kind: BinaryErrorKind,
		message: string
	) {
		super(message);
		this.name = "TerminalBinaryError";
	}
}

/** 可注入的 IO 端口（测试时替换为假实现） */
export interface BinaryIo {
	exists(path: string): boolean;
	mkdir(path: string): void;
	rm(path: string): void;
	readdir(path: string): string[];
	readBytes(path: string): Uint8Array;
	readTextFile(path: string): string;
	writeBytes(path: string, data: Uint8Array): void;
	writeText(path: string, text: string): void;
	chmod(path: string, mode: number): void;
	sha256(bytes: Uint8Array): string;
	download(url: string): Promise<Uint8Array>;
	downloadText(url: string): Promise<string>;
	extractZip(zipPath: string, destDir: string): Promise<void>;
}

/** 安装进度阶段（由 UI 层映射为提示文案） */
export type BinaryProgressStage = "checking" | "downloading" | "extracting" | "patching";

export function createNodeIo(): BinaryIo {
	const fs = getFs();
	const crypto = getCrypto();
	const childProcess = getChildProcess();

	return {
		exists: (p) => fs.existsSync(p),
		mkdir: (p) => fs.mkdirSync(p, { recursive: true }),
		rm: (p) => fs.rmSync(p, { recursive: true, force: true }),
		readdir: (p) => fs.readdirSync(p),
		readBytes: (p) => fs.readFileSync(p),
		readTextFile: (p) => fs.readFileSync(p, "utf8"),
		writeBytes: (p, data) => fs.writeFileSync(p, data),
		writeText: (p, text) => fs.writeFileSync(p, text),
		chmod: (p, mode) => fs.chmodSync(p, mode),
		sha256: (bytes) => crypto.createHash("sha256").update(bytes).digest("hex"),
		download: async (url) => {
			const response = await requestUrl({ url });
			return new Uint8Array(response.arrayBuffer);
		},
		downloadText: async (url) => {
			const response = await requestUrl({ url });
			return response.text;
		},
		extractZip: (zipPath, destDir) => {
			return new Promise<void>((resolve, reject) => {
				const onError = (error: Error | null, stderr: string) => {
					reject(new TerminalBinaryError(
						"extract",
						stderr ? `${String(error)}: ${stderr}` : String(error)
					));
				};
				if (getNodeProcess().platform === "win32") {
					const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;
					const command = [
						"Expand-Archive",
						"-LiteralPath", quote(zipPath),
						"-DestinationPath", quote(destDir),
						"-Force"
					].join(" ");
					childProcess.execFile(
						"powershell.exe",
						["-NoProfile", "-NonInteractive", "-Command", command],
						(error, _stdout, stderr) => (error ? onError(error, stderr) : resolve())
					);
				} else {
					childProcess.execFile(
						"unzip",
						["-o", zipPath, "-d", destDir],
						(error, _stdout, stderr) => {
							if (error && (error as { code?: string }).code === "ENOENT") {
								onError(error, "unzip is required to install terminal support files on this system");
								return;
							}
							if (error) {
								onError(error, stderr);
								return;
							}
							resolve();
						}
					);
				}
			});
		}
	};
}

export interface TerminalBinaryManagerOptions {
	pluginDir: string;
	platform?: string;
	arch?: string;
	io?: BinaryIo;
}

interface BinaryManifest {
	asset: string;
	checksum: string;
	installedAt: number;
}

export class TerminalBinaryManager {
	private statusValue: TerminalBinaryStatus = "not-installed";
	private io: BinaryIo;
	private platform: string;
	private arch: string;
	private inFlight: Promise<void> | null = null;

	readonly pluginDir: string;

	constructor(options: TerminalBinaryManagerOptions) {
		this.pluginDir = options.pluginDir;
		this.platform = options.platform ?? getNodeProcess().platform;
		this.arch = options.arch ?? getNodeProcess().arch;
		this.io = options.io ?? createNodeIo();
		if (!this.isPlatformSupported()) {
			this.statusValue = "unsupported";
		}
	}

	get status(): TerminalBinaryStatus {
		return this.statusValue;
	}

	/** node-pty 安装目录（<pluginDir>/node_modules/node-pty） */
	get installedDir(): string {
		return joinPath(this.pluginDir, "node_modules", "node-pty");
	}

	private get prebuildDir(): string {
		return joinPath(this.installedDir, "prebuilds", `${this.platform}-${this.arch}`);
	}

	static assetName(platform: string, arch: string): string {
		return `node-pty-${platform}-${arch}.zip`;
	}

	static assetBaseUrl(owner: string, repo: string, tag: string): string {
		return `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}`;
	}

	assetUrl(): string {
		return `${TerminalBinaryManager.assetBaseUrl(PTY_RELEASE_OWNER, PTY_RELEASE_REPO, PTY_RELEASE_TAG)}/${TerminalBinaryManager.assetName(this.platform, this.arch)}`;
	}

	checksumsUrl(): string {
		return `${TerminalBinaryManager.assetBaseUrl(PTY_RELEASE_OWNER, PTY_RELEASE_REPO, PTY_RELEASE_TAG)}/checksums.json`;
	}

	isPlatformSupported(): boolean {
		return SUPPORTED_PLATFORMS.has(`${this.platform}-${this.arch}`);
	}

	/** 文件存在性是安装与否的权威信号（清单仅供参考） */
	checkInstalledSync(): boolean {
		if (!this.isPlatformSupported()) {
			return false;
		}
		if (!this.io.exists(joinPath(this.installedDir, "lib", "index.js"))) {
			return false;
		}
		const prebuildDir = this.prebuildDir;
		if (!this.io.exists(joinPath(prebuildDir, "pty.node"))) {
			return false;
		}
		if (this.platform === "win32") {
			return this.io.exists(joinPath(prebuildDir, "winpty.dll"));
		}
		return this.io.exists(joinPath(prebuildDir, "spawn-helper"));
	}

	/** 刷新状态（供设置页显示，无副作用） */
	refreshStatus(): TerminalBinaryStatus {
		if (!this.isPlatformSupported()) {
			this.statusValue = "unsupported";
		} else if (this.hasPendingRemoval()) {
			// 待清理标记存在：用户已请求移除，等待重启完成
			this.statusValue = "remove-pending";
		} else if (
			this.statusValue === "not-installed" ||
			this.statusValue === "ready" ||
			this.statusValue === "remove-pending"
		) {
			this.statusValue = this.checkInstalledSync() ? "ready" : "not-installed";
		}
		return this.statusValue;
	}

	/** 是否存在待重启完成的移除标记 */
	hasPendingRemoval(): boolean {
		return this.io.exists(this.pendingRemovalMarker);
	}

	/**
	 * 资产获取双路：本地开发源（<pluginDir>/dev-source/<文件名>）优先，
	 * 不存在时走 GitHub release 直链。两条路共用后续的 SHA-256 校验与解压流程。
	 */
	private resolveLocalAsset(url: string): string | null {
		const fileName = url.split("/").pop() ?? "";
		if (!fileName) {
			return null;
		}
		const localPath = joinPath(this.pluginDir, "dev-source", fileName);
		return this.io.exists(localPath) ? localPath : null;
	}

	private async fetchAssetText(url: string): Promise<string> {
		const localPath = this.resolveLocalAsset(url);
		if (localPath) {
			return this.io.readTextFile(localPath);
		}
		return this.io.downloadText(url);
	}

	private async fetchAssetBytes(url: string): Promise<Uint8Array> {
		const localPath = this.resolveLocalAsset(url);
		if (localPath) {
			return this.io.readBytes(localPath);
		}
		return this.io.download(url);
	}

	async ensureInstalled(onProgress?: (stage: BinaryProgressStage) => void): Promise<void> {
		if (this.inFlight) {
			return this.inFlight;
		}
		this.inFlight = this.runInstall(onProgress).finally(() => {
			this.inFlight = null;
		});
		return this.inFlight;
	}

	private async runInstall(onProgress?: (stage: BinaryProgressStage) => void): Promise<void> {
		if (!this.isPlatformSupported()) {
			this.statusValue = "unsupported";
			throw new TerminalBinaryError(
				"unsupported",
				`Unsupported platform: ${this.platform}-${this.arch}`
			);
		}
		if (this.checkInstalledSync()) {
			this.statusValue = "ready";
			return;
		}
		// 诊断日志：定位已安装文件未被识别的情况
		const pathProbe = joinPath(this.installedDir, "lib", "index.js");
		const ptyProbe = joinPath(this.prebuildDir, "pty.node");
		console.debug(
			`Code Space: terminal binaries not detected, downloading. dir=${this.installedDir} lib=${this.io.exists(pathProbe)} pty=${this.io.exists(ptyProbe)} platform=${this.platform}-${this.arch}`
		);

		this.statusValue = "checking";
		onProgress?.("checking");

		// 下载 zip 与校验和（dev-source 本地源优先，见 fetchAsset）
		this.statusValue = "downloading";
		onProgress?.("downloading");
		const assetName = TerminalBinaryManager.assetName(this.platform, this.arch);
		let checksumsText: string;
		let zipBytes: Uint8Array;
		try {
			checksumsText = await this.fetchAssetText(this.checksumsUrl());
			zipBytes = await this.fetchAssetBytes(this.assetUrl());
		} catch (error) {
			this.statusValue = "error";
			throw new TerminalBinaryError("download", String(error));
		}

		// SHA-256 校验（checksums.json 缺失或不含本资产条目时拒绝安装）
		let expectedChecksum: string;
		try {
			const checksums = JSON.parse(checksumsText) as Record<string, unknown>;
			const entry = checksums[assetName];
			if (typeof entry !== "string" || !/^[0-9a-f]{64}$/i.test(entry)) {
				throw new Error(`checksums.json has no valid entry for ${assetName}`);
			}
			expectedChecksum = entry.toLowerCase();
		} catch (error) {
			this.statusValue = "error";
			throw new TerminalBinaryError("verify", String(error));
		}
		const actualChecksum = this.io.sha256(zipBytes);
		if (actualChecksum !== expectedChecksum) {
			this.statusValue = "error";
			throw new TerminalBinaryError(
				"verify",
				`Checksum mismatch for ${assetName}: expected ${expectedChecksum}, got ${actualChecksum}`
			);
		}

		// 写入临时 zip 并解压
		onProgress?.("extracting");
		const tmpDir = joinPath(this.pluginDir, "tmp");
		const zipPath = joinPath(tmpDir, assetName);
		const nodeModulesDir = joinPath(this.pluginDir, "node_modules");
		try {
			this.io.mkdir(tmpDir);
			this.io.writeBytes(zipPath, zipBytes);
			this.io.mkdir(nodeModulesDir);
			await this.io.extractZip(zipPath, nodeModulesDir);
		} catch (error) {
			this.statusValue = "error";
			throw error instanceof TerminalBinaryError ? error : new TerminalBinaryError("extract", String(error));
		} finally {
			try {
				this.io.rm(zipPath);
			} catch {
				// 临时文件清理失败可忽略
			}
		}

		// 平台后处理
		if (this.platform === "win32") {
			onProgress?.("patching");
			this.io.writeText(
				joinPath(this.installedDir, "lib", "windowsConoutConnection.js"),
				WINDOWSCONOUT_PATCH
			);
		} else {
			this.io.chmod(joinPath(this.prebuildDir, "spawn-helper"), 0o755);
		}

		// 解压后布局校验
		if (!this.checkInstalledSync()) {
			this.statusValue = "error";
			throw new TerminalBinaryError("layout", "Installed node-pty layout is invalid");
		}

		this.io.writeText(
			joinPath(this.installedDir, ".code-space-manifest.json"),
			JSON.stringify({
				asset: assetName,
				checksum: expectedChecksum,
				installedAt: Date.now(),
			} satisfies BinaryManifest, null, "\t")
		);
		// 安装成功即作废待清理标记（此前请求的移除已被重新下载取代）
		try {
			this.io.rm(this.pendingRemovalMarker);
		} catch {
			// 标记不存在时忽略
		}
		this.statusValue = "ready";
	}

	/**
	 * 移除已下载的支持文件。
	 * Windows 下已被当前进程加载的原生模块（conpty.node 等）被系统锁定，
	 * 运行中无法删除——此时删除能删的部分并登记待清理标记，
	 * 下次插件加载时（native 未加载）自动完成移除。
	 */
	async clearInstalled(): Promise<{ pendingRestart: boolean }> {
		// 等待进行中的安装结束，避免删除文件与解压过程竞争
		if (this.inFlight) {
			await this.inFlight.catch(() => undefined);
		}
		const fullyRemoved = this.tryRemoveAll();
		if (fullyRemoved) {
			// 清理可能存在的历史标记
			try {
				this.io.rm(this.pendingRemovalMarker);
			} catch {
				// 标记不存在时忽略
			}
		} else {
			// 残留被锁文件：登记重启后清理
			this.io.writeText(this.pendingRemovalMarker, String(Date.now()));
		}
		if (!fullyRemoved) {
			this.statusValue = "remove-pending";
		} else if (this.isPlatformSupported()) {
			this.statusValue = "not-installed";
		} else {
			this.statusValue = "unsupported";
		}
		return { pendingRestart: !fullyRemoved };
	}

	/** 插件加载时执行：若存在待清理标记则完成移除（此时 native 未加载，删除必成功） */
	cleanupPendingRemoval(): void {
		if (!this.io.exists(this.pendingRemovalMarker)) {
			return;
		}
		try {
			this.io.rm(this.installedDir);
		} catch (error) {
			console.debug("Code Space: pending terminal cleanup failed (will retry next launch):", error);
			return;
		}
		try {
			this.io.rm(this.pendingRemovalMarker);
		} catch {
			// 忽略
		}
	}

	private get pendingRemovalMarker(): string {
		return joinPath(this.pluginDir, "node_modules", ".code-space-pty-remove-pending");
	}

	/** 尽力删除安装目录；被锁文件导致残留时返回 false */
	private tryRemoveAll(): boolean {
		const dir = this.installedDir;
		const swallow = (action: () => void): void => {
			try {
				action();
			} catch {
				// 单项失败（被锁定）忽略，继续清理其余内容
			}
		};
		try {
			this.io.rm(dir);
			return true;
		} catch {
			// 整体删除失败（通常是 native 模块被进程锁定），逐项尝试
		}
		swallow(() => this.io.rm(joinPath(dir, "lib")));
		swallow(() => this.io.rm(joinPath(dir, "package.json")));
		let prebuildEntries: string[] = [];
		try {
			prebuildEntries = this.io.readdir(joinPath(dir, "prebuilds"));
		} catch {
			// prebuilds 目录不存在
		}
		for (const entry of prebuildEntries) {
			swallow(() => this.io.rm(joinPath(dir, "prebuilds", entry)));
		}
		swallow(() => this.io.rm(joinPath(dir, "prebuilds")));
		swallow(() => this.io.rm(dir));
		// 以目录内是否仍有内容判断删净（目录已不存在视为删净）
		try {
			return this.io.readdir(dir).length === 0;
		} catch {
			return true;
		}
	}
}
