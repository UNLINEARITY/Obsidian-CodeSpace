import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
	TerminalBinaryError,
	TerminalBinaryManager,
	type BinaryIo,
	type BinaryProgressStage,
} from "../src/terminal/binary_manager";
import { WINDOWSCONOUT_PATCH } from "../src/terminal/conout_patch";

/** 内存文件系统 + 可编程下载器的假 IO 实现 */
class FakeIo implements BinaryIo {
	files = new Map<string, Uint8Array | string>();
	downloads = new Map<string, Uint8Array | string>();
	extractCalls: Array<{ zipPath: string; destDir: string }> = [];
	private extractImpl: ((zipPath: string, destDir: string) => void) | null = null;

	constructor(platform: string, arch: string) {
		// 默认：解压时生成完整的 node-pty 安装布局
		this.setExtractBehavior(() => {
			this.writeLayout(platform, arch);
		});
	}

	setExtractBehavior(impl: (zipPath: string, destDir: string) => void): void {
		this.extractImpl = impl;
	}

	writeLayout(platform: string, arch: string): void {
		const root = `C:/vault/plugins-root/code-space/node_modules/node-pty`;
		this.files.set(`${root}/lib/index.js`, "module.exports = {};");
		const prebuild = `${root}/prebuilds/${platform}-${arch}`;
		this.files.set(`${prebuild}/pty.node`, new Uint8Array([1, 2, 3]));
		if (platform === "win32") {
			this.files.set(`${prebuild}/winpty.dll`, new Uint8Array([4, 5, 6]));
		} else {
			this.files.set(`${prebuild}/spawn-helper`, new Uint8Array([7, 8, 9]));
		}
	}

	exists(path: string): boolean {
		return this.files.has(path.replace(/\\/g, "/"));
	}

	mkdir(): void { /* 内存文件系统无需创建目录 */ }

	rm(path: string): void {
		const normalized = path.replace(/\\/g, "/");
		for (const key of [...this.files.keys()]) {
			if (key === normalized || key.startsWith(`${normalized}/`)) {
				this.files.delete(key);
			}
		}
	}

	writeBytes(path: string, data: Uint8Array): void {
		this.files.set(path.replace(/\\/g, "/"), data);
	}

	writeText(path: string, text: string): void {
		this.files.set(path.replace(/\\/g, "/"), text);
	}

	chmod(): void { /* noop */ }

	sha256(bytes: Uint8Array): string {
		return createHash("sha256").update(bytes).digest("hex");
	}

	async download(url: string): Promise<Uint8Array> {
		const value = this.downloads.get(url);
		if (value === undefined) {
			throw new Error(`404 ${url}`);
		}
		return typeof value === "string" ? new TextEncoder().encode(value) : value;
	}

	async downloadText(url: string): Promise<string> {
		const value = this.downloads.get(url);
		if (value === undefined) {
			throw new Error(`404 ${url}`);
		}
		return typeof value === "string" ? value : new TextDecoder().decode(value);
	}

	async extractZip(zipPath: string, destDir: string): Promise<void> {
		this.extractCalls.push({ zipPath, destDir });
		this.extractImpl?.(zipPath, destDir);
	}
}

const PLUGIN_DIR = "C:/vault/plugins-root/code-space";

function managerWith(io: FakeIo, platform: string, arch: string): TerminalBinaryManager {
	return new TerminalBinaryManager({ pluginDir: PLUGIN_DIR, platform, arch, io });
}

function serveHappyPath(io: FakeIo, platform: string, arch: string): void {
	const zipBytes = new Uint8Array([9, 9, 9, 9]);
	io.downloads.set(
		`https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1/checksums.json`,
		JSON.stringify({ [`node-pty-${platform}-${arch}.zip`]: createHash("sha256").update(zipBytes).digest("hex") })
	);
	io.downloads.set(
		`https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1/node-pty-${platform}-${arch}.zip`,
		zipBytes
	);
}

describe("TerminalBinaryManager statics", () => {
	it("builds asset names", () => {
		expect(TerminalBinaryManager.assetName("win32", "x64")).toBe("node-pty-win32-x64.zip");
		expect(TerminalBinaryManager.assetName("darwin", "arm64")).toBe("node-pty-darwin-arm64.zip");
	});

	it("builds direct download URLs without GitHub API", () => {
		const base = TerminalBinaryManager.assetBaseUrl("UNLINEARITY", "Obsidian-CodeSpace", "pty-prebuilds-v1");
		expect(base).toBe("https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1");
	});
});

describe("TerminalBinaryManager platform support", () => {
	it("supports the v1 platform matrix", () => {
		const io = new FakeIo("win32", "x64");
		expect(managerWith(io, "win32", "x64").isPlatformSupported()).toBe(true);
		expect(managerWith(io, "win32", "arm64").isPlatformSupported()).toBe(true);
		expect(managerWith(io, "darwin", "x64").isPlatformSupported()).toBe(true);
		expect(managerWith(io, "darwin", "arm64").isPlatformSupported()).toBe(true);
		expect(managerWith(io, "linux", "x64").isPlatformSupported()).toBe(true);
	});

	it("marks unsupported platforms and refuses install", async () => {
		const io = new FakeIo("linux", "arm64");
		const manager = managerWith(io, "linux", "arm64");
		expect(manager.status).toBe("unsupported");
		await expect(manager.ensureInstalled()).rejects.toMatchObject({ kind: "unsupported" });
	});
});

describe("TerminalBinaryManager.ensureInstalled", () => {
	it("is a no-op when already installed", async () => {
		const io = new FakeIo("win32", "x64");
		io.writeLayout("win32", "x64");
		const manager = managerWith(io, "win32", "x64");
		expect(manager.refreshStatus()).toBe("ready");
		await manager.ensureInstalled();
		expect(io.downloads.size).toBe(0);
		expect(manager.status).toBe("ready");
	});

	it("downloads, verifies, extracts and patches on Windows", async () => {
		const io = new FakeIo("win32", "x64");
		serveHappyPath(io, "win32", "x64");
		const manager = managerWith(io, "win32", "x64");
		const stages: BinaryProgressStage[] = [];
		await manager.ensureInstalled((stage) => stages.push(stage));

		expect(manager.status).toBe("ready");
		expect(stages).toEqual(["checking", "downloading", "extracting", "patching"]);
		// 解压目标是插件 node_modules 目录
		expect(io.extractCalls).toEqual([
			{ zipPath: `${PLUGIN_DIR}/tmp/node-pty-win32-x64.zip`, destDir: `${PLUGIN_DIR}/node_modules` },
		]);
		// Windows 写入 ConPTY 补丁
		const patch = io.files.get(`${PLUGIN_DIR}/node_modules/node-pty/lib/windowsConoutConnection.js`);
		expect(patch).toBe(WINDOWSCONOUT_PATCH);
		// 清单已写入
		expect(io.files.get(`${PLUGIN_DIR}/node_modules/node-pty/.code-space-manifest.json`)).toBeTruthy();
		// 临时 zip 已删除
		expect(io.exists(`${PLUGIN_DIR}/tmp/node-pty-win32-x64.zip`)).toBe(false);
	});

	it("chmods spawn-helper on unix instead of patching", async () => {
		const io = new FakeIo("darwin", "arm64");
		serveHappyPath(io, "darwin", "arm64");
		const chmodSpy = vi.spyOn(io, "chmod");
		const manager = managerWith(io, "darwin", "arm64");
		await manager.ensureInstalled();

		expect(manager.status).toBe("ready");
		expect(chmodSpy).toHaveBeenCalledWith(
			`${PLUGIN_DIR}/node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper`,
			0o755
		);
		expect(io.files.get(`${PLUGIN_DIR}/node_modules/node-pty/lib/windowsConoutConnection.js`)).toBeUndefined();
	});

	it("rejects a checksum mismatch", async () => {
		const io = new FakeIo("linux", "x64");
		const zipBytes = new Uint8Array([1, 1, 2, 3]);
		io.downloads.set(
			`https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1/checksums.json`,
			JSON.stringify({ "node-pty-linux-x64.zip": "0".repeat(64) })
		);
		io.downloads.set(
			`https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1/node-pty-linux-x64.zip`,
			zipBytes
		);
		const manager = managerWith(io, "linux", "x64");
		await expect(manager.ensureInstalled()).rejects.toMatchObject({ kind: "verify" });
		expect(manager.status).toBe("error");
	});

	it("rejects when checksums.json lacks the asset entry", async () => {
		const io = new FakeIo("linux", "x64");
		io.downloads.set(
			`https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1/checksums.json`,
			JSON.stringify({ "node-pty-win32-x64.zip": "a".repeat(64) })
		);
		io.downloads.set(
			`https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases/download/pty-prebuilds-v1/node-pty-linux-x64.zip`,
			new Uint8Array([0])
		);
		const manager = managerWith(io, "linux", "x64");
		await expect(manager.ensureInstalled()).rejects.toMatchObject({ kind: "verify" });
	});

	it("surfaces download failures as kind=download", async () => {
		const io = new FakeIo("win32", "x64");
		// 不注入任何下载内容 → 404
		const manager = managerWith(io, "win32", "x64");
		await expect(manager.ensureInstalled()).rejects.toBeInstanceOf(TerminalBinaryError);
		expect(manager.status).toBe("error");
	});

	it("rejects an invalid post-extract layout", async () => {
		const io = new FakeIo("win32", "x64");
		serveHappyPath(io, "win32", "x64");
		io.setExtractBehavior(() => {
			// 解压产物缺少 prebuilds
		});
		const manager = managerWith(io, "win32", "x64");
		await expect(manager.ensureInstalled()).rejects.toMatchObject({ kind: "layout" });
	});

	it("does not run concurrent installs", async () => {
		const io = new FakeIo("win32", "x64");
		serveHappyPath(io, "win32", "x64");
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const original = io.extractZip.bind(io);
		io.extractZip = async (zipPath: string, destDir: string) => {
			await gate;
			await original(zipPath, destDir);
		};
		const manager = managerWith(io, "win32", "x64");
		const first = manager.ensureInstalled();
		const second = manager.ensureInstalled();
		release();
		await Promise.all([first, second]);
		expect(io.extractCalls.length).toBe(1);
	});
});

describe("TerminalBinaryManager.clearInstalled", () => {
	it("removes the installation and resets status", async () => {
		const io = new FakeIo("win32", "x64");
		io.writeLayout("win32", "x64");
		const manager = managerWith(io, "win32", "x64");
		expect(manager.refreshStatus()).toBe("ready");
		await manager.clearInstalled();
		expect(manager.status).toBe("not-installed");
		expect(manager.checkInstalledSync()).toBe(false);
	});
});

describe("TerminalBinaryManager.checkInstalledSync", () => {
	it("requires the native binary, not only lib/index.js", () => {
		const io = new FakeIo("win32", "x64");
		io.writeLayout("win32", "x64");
		io.files.delete(`${PLUGIN_DIR}/node_modules/node-pty/prebuilds/win32-x64/pty.node`);
		const manager = managerWith(io, "win32", "x64");
		expect(manager.checkInstalledSync()).toBe(false);
	});
});
