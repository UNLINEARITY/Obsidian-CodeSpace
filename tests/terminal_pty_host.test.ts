import { describe, expect, it, vi } from "vitest";
import { buildPtyEnv, normalizeAppleLocale, PtyProcess, resolveLocaleEnv } from "../src/terminal/pty_host";
import type { PtyFactory, PtyLike } from "../src/terminal/types";

/** 可手动触发数据/退出事件的假 PTY 进程 */
class FakePty implements PtyLike {
	pid = 4242;
	cols = 80;
	rows = 24;
	written: string[] = [];
	resizes: Array<{ cols: number; rows: number }> = [];
	killCount = 0;
	private dataHandlers = new Set<(data: string) => void>();
	private exitHandlers = new Set<(e: { exitCode: number }) => void>();

	onData(listener: (data: string) => void): { dispose(): void } {
		this.dataHandlers.add(listener);
		return { dispose: () => this.dataHandlers.delete(listener) };
	}

	onExit(listener: (e: { exitCode: number }) => void): { dispose(): void } {
		this.exitHandlers.add(listener);
		return { dispose: () => this.exitHandlers.delete(listener) };
	}

	write(data: string): void {
		this.written.push(data);
	}

	resize(cols: number, rows: number): void {
		this.resizes.push({ cols, rows });
	}

	kill(): void {
		this.killCount += 1;
	}

	emitData(data: string): void {
		for (const handler of [...this.dataHandlers]) {
			handler(data);
		}
	}

	emitExit(exitCode: number): void {
		for (const handler of [...this.exitHandlers]) {
			handler({ exitCode });
		}
	}
}

function spawnFake(): { process: PtyProcess; fake: FakePty } {
	const fake = new FakePty();
	const factory: PtyFactory = () => fake;
	const process = PtyProcess.spawn(
		{ file: "/bin/sh", args: [], cwd: "/tmp", env: {}, cols: 80, rows: 24 },
		factory
	);
	return { process, fake };
}

describe("PtyProcess", () => {
	it("fans out data events and supports unsubscription", () => {
		const { process, fake } = spawnFake();
		const received: string[] = [];
		const unsubscribe = process.onData((data) => received.push(data));
		const another = vi.fn();
		process.onData(another);

		fake.emitData("hello");
		expect(received).toEqual(["hello"]);
		expect(another).toHaveBeenCalledWith("hello");

		unsubscribe();
		fake.emitData("world");
		expect(received).toEqual(["hello"]);
	});

	it("marks exited on exit event and notifies listeners once", () => {
		const { process, fake } = spawnFake();
		const onExit = vi.fn();
		process.onExit(onExit);

		expect(process.hasExited).toBe(false);
		fake.emitExit(0);
		expect(process.hasExited).toBe(true);
		expect(onExit).toHaveBeenCalledWith(0);

		// 退出后新增的监听器立即收到回调
		const late = vi.fn();
		process.onExit(late);
		expect(late).toHaveBeenCalledWith(-1);
	});

	it("kill is idempotent and ignores later write/resize", () => {
		const { process, fake } = spawnFake();
		process.kill();
		process.kill();
		expect(fake.killCount).toBe(1);

		process.write("data");
		process.resize(100, 30);
		expect(fake.written).toEqual([]);
		expect(fake.resizes).toEqual([]);
	});

	it("ignores write after natural exit", () => {
		const { process, fake } = spawnFake();
		fake.emitExit(1);
		process.write("late");
		expect(fake.written).toEqual([]);
	});

	it("swallows resize errors", () => {
		const { process, fake } = spawnFake();
		fake.resize = (): void => {
			throw new Error("already closed");
		};
		expect(() => process.resize(120, 40)).not.toThrow();
	});
});

describe("buildPtyEnv", () => {
	it("copies defined values and forces terminal variables", () => {
		const env = buildPtyEnv({ HOME: "/home/u", UNSET: undefined, TERM: undefined });
		expect(env).toEqual({ HOME: "/home/u", TERM: "xterm-256color", COLORTERM: "truecolor" });
	});

	it("merges injected keys without clobbering inherited ones", () => {
		const env = buildPtyEnv(
			{ LANG: "zh_CN.UTF-8" },
			{ LANG: "en_US.UTF-8", LC_CTYPE: "UTF-8" }
		);
		expect(env.LANG).toBe("zh_CN.UTF-8");
		expect(env.LC_CTYPE).toBe("UTF-8");
	});
});

describe("normalizeAppleLocale", () => {
	it("strips keyword suffixes and appends the encoding", () => {
		expect(normalizeAppleLocale("zh_CN@rg=zzzz")).toBe("zh_CN.UTF-8");
		expect(normalizeAppleLocale("en_US")).toBe("en_US.UTF-8");
		expect(normalizeAppleLocale("  en_US \n")).toBe("en_US.UTF-8");
	});

	it("keeps values that already carry an encoding", () => {
		expect(normalizeAppleLocale("zh_CN.UTF-8")).toBe("zh_CN.UTF-8");
	});

	it("falls back on empty input", () => {
		expect(normalizeAppleLocale("")).toBe("en_US.UTF-8");
		expect(normalizeAppleLocale(null)).toBe("en_US.UTF-8");
		expect(normalizeAppleLocale(undefined)).toBe("en_US.UTF-8");
		expect(normalizeAppleLocale("@rg=zzzz")).toBe("en_US.UTF-8");
	});
});

describe("resolveLocaleEnv", () => {
	it("returns nothing on non-darwin platforms", () => {
		expect(resolveLocaleEnv({}, "win32", "zh_CN")).toEqual({});
		expect(resolveLocaleEnv({}, "linux", null)).toEqual({});
	});

	it("respects existing LANG/LC_ALL", () => {
		expect(resolveLocaleEnv({ LANG: "en_US.UTF-8" }, "darwin", "zh_CN")).toEqual({});
		expect(resolveLocaleEnv({ LC_ALL: "C" }, "darwin", "zh_CN")).toEqual({});
	});

	it("injects LANG when missing on darwin", () => {
		expect(resolveLocaleEnv({ PATH: "/usr/bin" }, "darwin", "zh_CN@rg=zzzz")).toEqual({
			LANG: "zh_CN.UTF-8",
		});
	});
});
