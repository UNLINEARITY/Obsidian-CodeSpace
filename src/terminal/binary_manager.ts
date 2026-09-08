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
		} else if (this.statusValue === "not-installed" || this.statusValue === "ready") {
			this.statusValue = this.checkInstalledSync() ? "ready" : "not-installed";
		}
		return this.statusValue;
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

		// 下载 zip 与校验和
		this.statusValue = "downloading";
		onProgress?.("downloading");
		const assetName = TerminalBinaryManager.assetName(this.platform, this.arch);
		let checksumsText: string;
		let zipBytes: Uint8Array;
		try {
			checksumsText = await this.io.downloadText(this.checksumsUrl());
			zipBytes = await this.io.download(this.assetUrl());
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
		this.statusValue = "ready";
	}

	async clearInstalled(): Promise<void> {
		// 等待进行中的安装结束，避免删除文件与解压过程竞争
		if (this.inFlight) {
			await this.inFlight.catch(() => undefined);
		}
		this.io.rm(this.installedDir);
		if (this.isPlatformSupported()) {
			this.statusValue = "not-installed";
		} else {
			this.statusValue = "unsupported";
		}
	}
}
