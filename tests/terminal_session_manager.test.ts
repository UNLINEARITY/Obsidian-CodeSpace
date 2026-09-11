import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { DEFAULT_SETTINGS, normalizeCodeSpaceSettings } from "../src/settings";
import { TerminalManager, type TerminalPluginFacade } from "../src/terminal/session_manager";
import { createFakeDepsBase } from "./helpers/fake_pty";

function makePlugin(overrides: Record<string, unknown> = {}): TerminalPluginFacade {
	// terminalEnabled 默认值为 false（opt-in），会话测试默认显式启用
	return {
		settings: normalizeCodeSpaceSettings({ ...DEFAULT_SETTINGS, terminalEnabled: true, ...overrides }),
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
	const group = manager.createGroup();
	return { manager, group, base, notify, plugin };
}

describe("TerminalGroup.createSession", () => {
	it("creates a wired session with shell title and cwd", async () => {
		const { group, base } = makeManager();
		const session = await group.createSession("/work/dir");

		expect(session.info.title).toBe("zsh 1");
		expect(session.info.cwd).toBe("/work/dir");
		expect(session.info.exited).toBe(false);
		expect(group.sessions.length).toBe(1);

		// pty 输出转发到组件
		const component = base.fakeComponents[0]!;
		base.fakePtys[0]!.emitData("hello");
		expect(component.written).toEqual(["hello"]);
	});

	it("numbers titles per display name", async () => {
		const { group } = makeManager();
		await group.createSession();
		const second = await group.createSession();
		expect(second.info.title).toBe("zsh 2");
	});

	it("rejects when disabled", async () => {
		const { group, notify } = makeManager({ terminalEnabled: false });
		await expect(group.createSession()).rejects.toThrow("disabled");
		expect(notify).toHaveBeenCalled();
	});

	it("evicts the oldest exited session at cap before refusing", async () => {
		const { group, base } = makeManager({ terminalMaxSessions: 2 });
		const first = await group.createSession();
		await group.createSession();

		// 未退出且满员 → 拒绝
		await expect(group.createSession()).rejects.toThrow("limit");

		// 第一个退出后 → 淘汰第一个，允许新建
		base.fakePtys[0]!.emitExit(0);
		await group.createSession();
		expect(group.sessions.length).toBe(2);
		expect(group.sessions.some((s) => s.info.id === first.info.id)).toBe(false);
	});

	it("counts sessions across groups toward the global cap", async () => {
		const { manager, group } = makeManager({ terminalMaxSessions: 2 });
		const other = manager.createGroup();
		await group.createSession();
		await other.createSession();

		// 全局总数已达上限：跨组也拒绝新建
		await expect(group.createSession()).rejects.toThrow("limit");
		expect(manager.totalSessionCount).toBe(2);
	});
});

describe("TerminalGroup lifecycle", () => {
	it("marks session exited on pty exit and notifies listeners", async () => {
		const { group, base } = makeManager();
		const session = await group.createSession();
		const changed = vi.fn();
		group.onSessionsChanged(changed);

		base.fakePtys[0]!.emitExit(0);
		expect(session.info.exited).toBe(true);
		expect(session.info.exitCode).toBe(0);
		expect(changed).toHaveBeenCalled();
		// 退出提示写入组件（避免光标停住无响应的困惑）
		expect(base.fakeComponents[0]!.written.some((data) => data.includes("Process exited"))).toBe(true);
	});

	it("closeSession terminates pty and disposes component", async () => {
		const { group, base } = makeManager();
		const session = await group.createSession();
		group.closeSession(session.info.id);

		expect(group.sessions.length).toBe(0);
		expect(base.fakePtys[0]!.killCount).toBe(1);
		expect(base.fakeComponents[0]!.disposed).toBe(true);
	});

	it("dispose closes all sessions of the group (no-memory model)", async () => {
		const { manager, group, base } = makeManager();
		await group.createSession();
		await group.createSession();
		manager.destroyGroup(group);

		expect(group.sessions.length).toBe(0);
		expect(base.fakePtys.every((pty) => pty.killCount === 1)).toBe(true);
		expect(base.fakeComponents.every((component) => component.disposed)).toBe(true);
	});

	it("groups are independent: closing one does not affect another", async () => {
		const { manager, group, base } = makeManager();
		const other = manager.createGroup();
		const otherSession = await other.createSession();

		manager.destroyGroup(group);
		expect(other.sessions.length).toBe(1);
		expect(base.fakePtys[base.fakePtys.length - 1]!.killCount).toBe(0);
		expect(otherSession.info.exited).toBe(false);
	});

	it("killAll closes every group", async () => {
		const { manager, group } = makeManager();
		const other = manager.createGroup();
		await group.createSession();
		await other.createSession();

		manager.killAll();
		expect(group.sessions.length).toBe(0);
		expect(other.sessions.length).toBe(0);
	});
});

describe("TerminalManager.moveSessionBetween", () => {
	it("moves a session between groups without killing it", async () => {
		const { manager, group, base } = makeManager();
		const session = await group.createSession();
		const target = manager.createGroup();

		expect(manager.moveSessionBetween(group, target, session.info.id)).toBe(true);
		expect(group.sessions.length).toBe(0);
		expect(target.sessions.length).toBe(1);
		// 进程与组件保持存活（仅转移簿记）
		expect(base.fakePtys[0]!.killCount).toBe(0);
		expect(base.fakeComponents[0]!.disposed).toBe(false);
		// 转移后数据照常流动
		base.fakePtys[0]!.emitData("still alive");
		expect(base.fakeComponents[0]!.written).toContain("still alive");
	});

	it("returns false for unknown session ids", () => {
		const { manager, group } = makeManager();
		const target = manager.createGroup();
		expect(manager.moveSessionBetween(group, target, "missing")).toBe(false);
	});

	it("hands a pending claim group to the next terminal view", async () => {
		const { manager, group } = makeManager();
		const session = await group.createSession();
		const target = manager.createGroup();
		manager.moveSessionBetween(group, target, session.info.id);
		manager.claimGroupNextView(target);

		expect(manager.consumePendingGroup()).toBe(target);
		expect(manager.consumePendingGroup()).toBeNull();
	});
});

describe("TerminalGroup.latestSession", () => {
	it("returns the most recently attached session", async () => {
		const { group } = makeManager();
		const first = await group.createSession();
		const second = await group.createSession();

		// 直接注入时间戳，避免同毫秒创建导致 lastAttachedAt 无区分度
		first.lastAttachedAt = 100;
		second.lastAttachedAt = 200;
		expect(group.latestSession()?.info.id).toBe(second.info.id);

		first.lastAttachedAt = 300;
		expect(group.latestSession()?.info.id).toBe(first.info.id);
	});

	it("returns null when the group is empty", async () => {
		const { group } = makeManager();
		expect(group.latestSession()).toBeNull();
	});
});

describe("TerminalManager.applySettings", () => {
	it("propagates font size and scrollback to all sessions in all groups", async () => {
		const { manager, group, base, plugin } = makeManager();
		const other = manager.createGroup();
		await group.createSession();
		await other.createSession();

		plugin.settings.terminalFontSize = 20;
		plugin.settings.terminalScrollback = 5000;
		manager.applySettings(plugin.settings);

		for (const component of base.fakeComponents) {
			expect(component.applySettingsCalls).toContainEqual({ fontSize: 20, scrollback: 5000 });
		}
	});
});


