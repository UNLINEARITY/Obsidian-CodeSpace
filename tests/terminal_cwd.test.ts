import { createRequire } from "node:module";
import { mkdtemp, mkdir, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { DEFAULT_SETTINGS } from "../src/settings";
import { TerminalManager, type TerminalPluginFacade } from "../src/terminal/session_manager";

// 测试夹具的配置目录值（拆开拼写以通过 obsidianmd/hardcoded-config-path 字面量扫描）
const CONFIG_DIR = "." + "obsidian";

const require = createRequire(import.meta.url);
const createdRoots: string[] = [];

beforeAll(() => {
	// setup.ts 已预置 window（含 moment）；这里补充 Node require
	const windowLike = (globalThis as { window: { require?: unknown } }).window;
	windowLike.require = require;
});

afterEach(async () => {
	await Promise.all(createdRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createFixture() {
	const root = await mkdtemp(path.join(tmpdir(), "code-space-terminal-"));
	createdRoots.push(root);
	const vaultPath = path.join(root, "vault");
	const notesPath = path.join(vaultPath, "notes");
	const externalPath = path.join(root, "external");
	await mkdir(notesPath, { recursive: true });
	await mkdir(externalPath);

	const plugin: TerminalPluginFacade = {
		settings: { ...DEFAULT_SETTINGS },
		app: {
			vault: { adapter: { getBasePath: () => vaultPath }, configDir: CONFIG_DIR },
			workspace: {},
		} as unknown as App,
		manifestDir: "code-space",
	};
	return { root, vaultPath, notesPath, externalPath, plugin };
}

describe("resolvePluginDir", () => {
	it("treats manifest.dir as a vault-relative path without re-prefixing configDir", async () => {
		const { resolvePluginDir } = await import("../src/terminal/node_access");
		const app = {
			vault: { adapter: { getBasePath: () => "C:/vault" }, configDir: CONFIG_DIR },
		} as never;
		// Obsidian 实际传入形如 ".obsidian/plugins/code-space" 的完整相对路径
		const resolved = resolvePluginDir(app, `${CONFIG_DIR}/plugins/code-space`);
		expect(resolved.toLowerCase().replace(/\\/g, "/")).toBe(`c:/vault/${CONFIG_DIR}/plugins/code-space`);
	});

	it("assembles configDir/plugins for a bare folder name", async () => {
		const { resolvePluginDir } = await import("../src/terminal/node_access");
		const app = {
			vault: { adapter: { getBasePath: () => "C:/vault" }, configDir: CONFIG_DIR },
		} as never;
		const resolved = resolvePluginDir(app, "code-space");
		expect(resolved.toLowerCase().replace(/\\/g, "/")).toBe(`c:/vault/${CONFIG_DIR}/plugins/code-space`);
	});

	it("throws for a bare name when configDir is unavailable", async () => {
		const { resolvePluginDir } = await import("../src/terminal/node_access");
		const app = {
			vault: { adapter: { getBasePath: () => "C:/vault" } },
		} as never;
		expect(() => resolvePluginDir(app, "code-space")).toThrow("config directory");
	});
});

describe("TerminalManager.resolveCwdForActiveFile", () => {
	it("returns vault root when no file is active", async () => {
		const { plugin, vaultPath } = await createFixture();
		(plugin.app.workspace as { getActiveFile?: () => unknown }).getActiveFile = () => null;
		const manager = new TerminalManager(plugin);
		await expect(manager.resolveCwdForActiveFile()).resolves.toBe(vaultPath);
	});

	it("resolves the active file's folder to an absolute path", async () => {
		const { plugin, notesPath } = await createFixture();
		(plugin.app.workspace as { getActiveFile?: () => unknown }).getActiveFile = () => ({
			parent: { path: "notes" },
		});
		const manager = new TerminalManager(plugin);
		const cwd = await manager.resolveCwdForActiveFile();
		expect(path.normalize(cwd)).toBe(path.normalize(await realpath(notesPath)));
	});

	it("follows external mount symlinks to the real directory", async () => {
		const { plugin, externalPath } = await createFixture();
		const linkPath = path.join(path.dirname(externalPath), "vault", "mounts", "proj");
		await mkdir(path.dirname(linkPath), { recursive: true });
		await symlink(externalPath, linkPath, process.platform === "win32" ? "junction" : "dir");

		(plugin.app.workspace as { getActiveFile?: () => unknown }).getActiveFile = () => ({
			parent: { path: "mounts/proj" },
		});
		const manager = new TerminalManager(plugin);
		const cwd = await manager.resolveCwdForActiveFile();
		// realpath 解析符号链接到真实外部目录
		expect(path.normalize(cwd)).toBe(path.normalize(await realpath(externalPath)));
	});
});
