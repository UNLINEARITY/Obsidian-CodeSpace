// 平台默认 shell 检测（纯函数，平台上下文显式传入以便测试）

export interface ResolvedShell {
	file: string;
	args: string[];
	displayName: string;
}

export interface ShellDetectContext {
	platform: {
		isWin: boolean;
		isMacOS: boolean;
		isLinux: boolean;
	};
	/** 进程环境变量（由调用方通过 node_access.getNodeProcess() 获取） */
	env: Record<string, string | undefined>;
	/** 判断可执行文件是否存在于磁盘 */
	fileExists(path: string): Promise<boolean> | boolean;
	/** 设置中的自定义 shell 路径（空字符串表示自动检测） */
	override?: string;
}

const WINDOWS_CANDIDATES = [
	{ file: "pwsh.exe", displayName: "PowerShell" },
	{ file: "powershell.exe", displayName: "Windows PowerShell" },
	{ file: "cmd.exe", displayName: "Command Prompt" },
];

const MACOS_FALLBACK = "/bin/zsh";
const LINUX_FALLBACKS = ["/bin/bash", "/bin/sh"];

function basename(path: string): string {
	const normalized = path.replace(/\\/g, "/");
	const index = normalized.lastIndexOf("/");
	return index >= 0 ? normalized.slice(index + 1) : normalized;
}

async function resolveOverride(ctx: ShellDetectContext): Promise<ResolvedShell | null> {
	const override = (ctx.override ?? "").trim();
	if (!override) {
		return null;
	}
	if (await ctx.fileExists(override)) {
		return {
			file: override,
			args: [],
			displayName: basename(override),
		};
	}
	// 配置的 shell 不存在时返回标记，由调用方提示并回退自动检测
	return null;
}

function firstExisting(
	candidates: string[],
	fileExists: (path: string) => Promise<boolean> | boolean
): Promise<string | null> {
	return (async () => {
		for (const candidate of candidates) {
			if (await fileExists(candidate)) {
				return candidate;
			}
		}
		return null;
	})();
}

/**
 * 解析当前平台应使用的 shell。
 * 优先级：设置覆盖 → 平台自动检测（Windows: pwsh → powershell → cmd；
 * macOS/Linux: $SHELL → 平台回退）。
 * 找不到任何候选时抛出错误。
 */
export async function resolveShell(ctx: ShellDetectContext): Promise<ResolvedShell> {
	const override = await resolveOverride(ctx);
	if (override) {
		return override;
	}

	if (ctx.platform.isWin) {
		// 按候选优先级在 PATH 目录中查找完整路径
		const searchDirs = (ctx.env.Path ?? ctx.env.PATH ?? "")
			.split(";")
			.map((dir) => dir.trim().replace(/\\$/, ""))
			.filter(Boolean);
		for (const candidate of WINDOWS_CANDIDATES) {
			const paths = searchDirs.map((dir) => `${dir}\\${candidate.file}`);
			const found = await firstExisting(paths, (p) => ctx.fileExists(p));
			if (found) {
				return { file: found, args: [], displayName: candidate.displayName };
			}
		}
		// existsSync 对裸名称返回 false，但 CreateProcess 能解析 PATH，
		// 因此 PATH 全部未命中时回退到裸名称，交给系统解析
		return { file: "pwsh.exe", args: [], displayName: "PowerShell" };
	}

	const envShell = (ctx.env.SHELL ?? "").trim();
	if (envShell && (await ctx.fileExists(envShell))) {
		return { file: envShell, args: [], displayName: basename(envShell) };
	}

	if (ctx.platform.isMacOS) {
		if (await ctx.fileExists(MACOS_FALLBACK)) {
			return { file: MACOS_FALLBACK, args: [], displayName: "zsh" };
		}
	}

	const linuxCandidates = envShell ? [envShell, ...LINUX_FALLBACKS] : LINUX_FALLBACKS;
	const linuxFound = await firstExisting(linuxCandidates, (p) => ctx.fileExists(p));
	if (linuxFound) {
		return { file: linuxFound, args: [], displayName: basename(linuxFound) };
	}

	throw new Error("No shell executable found");
}
