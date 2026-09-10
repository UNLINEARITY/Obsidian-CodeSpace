// 测试共享：可手动控制的假 PTY 与假终端组件
import { PtyProcess } from "../../src/terminal/pty_host";
import type { TerminalComponent } from "../../src/terminal/terminal_component";
import type { PtyLike } from "../../src/terminal/types";

export class FakePty implements PtyLike {
	pid = 1000;
	cols = 80;
	rows = 24;
	killCount = 0;
	spawnOptions: { file: string; cwd: string; env: Record<string, string> } | null = null;
	resizes: Array<{ cols: number; rows: number }> = [];
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

	write(): void { /* 测试中不记录输入 */ }

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

export class FakeTerminalComponent {
	sessionId: string;
	applySettingsCalls: Array<{ fontSize: number; scrollback: number }> = [];
	refreshThemeCalls = 0;
	refreshAppearanceCalls = 0;
	disposed = false;
	written: string[] = [];
	inputHandler: ((data: string) => void) | null = null;
	resizeHandler: ((cols: number, rows: number) => void) | null = null;

	constructor(sessionId: string) {
		this.sessionId = sessionId;
	}

	onInput(handler: (data: string) => void): void {
		this.inputHandler = handler;
	}

	onResize(handler: (cols: number, rows: number) => void): void {
		this.resizeHandler = handler;
	}

	write(data: string): void {
		this.written.push(data);
	}

	attachTo(): void { /* noop */ }

	detach(): void { /* noop */ }

	focus(): void { /* noop */ }

	fit(): void { /* noop */ }

	applySettings(options: { fontSize: number; scrollback: number }): void {
		this.applySettingsCalls.push(options);
	}

	refreshTheme(): void {
		this.refreshThemeCalls += 1;
	}

	refreshAppearance(): void {
		this.refreshAppearanceCalls += 1;
	}

	dispose(): void {
		this.disposed = true;
	}
}

/** 构建接好线的假组件工厂 */
export function createFakeDepsBase() {
	const fakeComponents: FakeTerminalComponent[] = [];
	const fakePtys: FakePty[] = [];
	return {
		fakeComponents,
		fakePtys,
		spawnFakePty(options: { file: string; cwd: string; env: Record<string, string> }): PtyProcess {
			const fake = new FakePty();
			fake.spawnOptions = options;
			fakePtys.push(fake);
			return PtyProcess.spawn(
				{ file: options.file, args: [], cwd: options.cwd, env: options.env, cols: 80, rows: 24 },
				() => fake
			);
		},
		createFakeComponent(sessionId: string): TerminalComponent {
			const fake = new FakeTerminalComponent(sessionId);
			fakeComponents.push(fake);
			return fake as unknown as TerminalComponent;
		},
	};
}
