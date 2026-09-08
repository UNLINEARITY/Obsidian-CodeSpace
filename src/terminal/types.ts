// 终端模块共享类型定义
// 本地声明 PTY 接口结构（不依赖 node-pty 包的类型，避免引入编译期依赖）

export type TerminalId = string;

export interface PtySpawnOptions {
	file: string;
	args: string[];
	cwd: string;
	env: Record<string, string>;
	cols: number;
	rows: number;
}

/** node-pty IPty 的结构化子集（运行时由 window.require 加载） */
export interface PtyLike {
	readonly pid: number;
	readonly cols: number;
	readonly rows: number;
	onData(listener: (data: string) => void): { dispose(): void };
	onExit(listener: (e: { exitCode: number; signal?: number }) => void): { dispose(): void };
	resize(columns: number, rows: number): void;
	write(data: string): void;
	kill(signal?: string): void;
}

/** 与 node-pty.spawn 等价的工厂签名 */
export type PtyFactory = (file: string, args: string[], options: PtySpawnOptions) => PtyLike;

export interface TerminalSessionInfo {
	id: TerminalId;
	/** 标签栏显示名，如 "PowerShell 2" */
	title: string;
	cwd: string;
	shell: string;
	createdAt: number;
	exited: boolean;
	exitCode?: number;
}

export type TerminalHostKind = "embedded" | "view";

/** 二进制支持包状态 */
export type TerminalBinaryStatus =
	| "not-installed"
	| "checking"
	| "downloading"
	| "ready"
	| "error"
	| "unsupported";
