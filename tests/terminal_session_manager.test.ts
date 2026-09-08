import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { DEFAULT_SETTINGS, normalizeCodeSpaceSettings } from "../src/settings";
import { TerminalManager, type TerminalPluginFacade } from "../src/terminal/session_manager";
import { createFakeDepsBase } from "./helpers/fake_pty";

function makePlugin(overrides: Record<string, unknown> = {}): TerminalPluginFacade {
	return {
		settings: normalizeCodeSpaceSettings({ ...DEFAULT_SETTINGS, ...overrides }),
		app: {} as App,
		manifestDir: "code-space",
	};
}

function makeManager(pluginOverrides: Record<string, unknown> = {}) {
	const base = createFakeDepsBase();
	const plugin = makePlugin(pluginOverrides);
	const notify = vi.fn();
	const manager = new TerminalManager(plugin, {
		ensureBinaries: async () => { /* 测试跳过二进制安装 */ },
		loadFactory: () => () => {
			throw new Error("factory is unused: spawnProcess is injected");
		},
		spawnProcess: (options) => base.spawnFakePty(options),
		createComponent: (sessionId) => base.createFakeComponent(sessionId),
		resolveShell: async () => ({ file: "/bin/zsh", args: [], displayName: "zsh" }),
		resolveCwd: async () => "/vault/root",
		buildEnv: () => ({ TERM: "xterm-256color" }),
		notify,
	});
	return { manager, base, notify, plugin };
}

describe("TerminalManager.createSession", () => {
	it("creates a wired session with shell title and cwd", async () => {
		const { manager, base } = makeManager();
		const session = await manager.createSession("/work/dir");

		expect(session.info.title).toBe("zsh 1");
		expect(session.info.cwd).toBe("/work/dir");
		expect(session.info.exited).toBe(false);
		expect(manager.sessions.length).toBe(1);

		// pty 输出转发到组件
		const component = base.fakeComponents[0]!;
		base.fakePtys[0]!.emitData("hello");
		expect(component.written).toEqual(["hello"]);
	});

	it("numbers titles per display name", async () => {
		const { manager } = makeManager();
		await manager.createSession();
		const second = await manager.createSession();
		expect(second.info.title).toBe("zsh 2");
	});

	it("rejects when disabled", async () => {
		const { manager, notify } = makeManager({ terminalEnabled: false });
		await expect(manager.createSession()).rejects.toThrow("disabled");
		expect(notify).toHaveBeenCalled();
	});

	it("evicts the oldest exited session at cap before refusing", async () => {
		const { manager, base } = makeManager({ terminalMaxSessions: 2 });
		const first = await manager.createSession();
		await manager.createSession();

		// 未退出且满员 → 拒绝
		await expect(manager.createSession()).rejects.toThrow("limit");

		// 第一个退出后 → 淘汰第一个，允许新建
		base.fakePtys[0]!.emitExit(0);
		await manager.createSession();
		expect(manager.sessions.length).toBe(2);
		expect(manager.sessions.some((s) => s.info.id === first.info.id)).toBe(false);
	});
});

describe("TerminalManager lifecycle", () => {
	it("marks session exited on pty exit and notifies listeners", async () => {
		const { manager, base } = makeManager();
		const session = await manager.createSession();
		const changed = vi.fn();
		manager.onSessionsChanged(changed);

		base.fakePtys[0]!.emitExit(0);
		expect(session.info.exited).toBe(true);
		expect(session.info.exitCode).toBe(0);
		expect(changed).toHaveBeenCalled();
	});

	it("closeSession terminates pty and disposes component", async () => {
		const { manager, base } = makeManager();
		const session = await manager.createSession();
		manager.closeSession(session.info.id);

		expect(manager.sessions.length).toBe(0);
		expect(base.fakePtys[0]!.killCount).toBe(1);
		expect(base.fakeComponents[0]!.disposed).toBe(true);
	});

	it("killAll clears everything", async () => {
		const { manager, base } = makeManager();
		await manager.createSession();
		await manager.createSession();
		manager.killAll();

		expect(manager.sessions.length).toBe(0);
		expect(base.fakePtys.every((pty) => pty.killCount === 1)).toBe(true);
		expect(base.fakeComponents.every((component) => component.disposed)).toBe(true);
	});

	it("dispose kills all and ignores later creates", async () => {
		const { manager } = makeManager();
		await manager.createSession();
		manager.dispose();
		expect(manager.sessions.length).toBe(0);
		await expect(manager.createSession()).rejects.toThrow("disposed");
	});
});

describe("TerminalManager.applySettings", () => {
	it("propagates font size and scrollback to all components", async () => {
		const { manager, base, plugin } = makeManager();
		await manager.createSession();
		await manager.createSession();

		plugin.settings.terminalFontSize = 20;
		plugin.settings.terminalScrollback = 5000;
		manager.applySettings(plugin.settings);

		for (const component of base.fakeComponents) {
			expect(component.applySettingsCalls).toContainEqual({ fontSize: 20, scrollback: 5000 });
		}
	});
});
