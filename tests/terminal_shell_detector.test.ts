import { describe, expect, it } from "vitest";
import { resolveShell, type ShellDetectContext } from "../src/terminal/shell_detector";

function makeContext(
	platform: ShellDetectContext["platform"],
	env: Record<string, string | undefined>,
	existingPaths: string[],
	override?: string
): ShellDetectContext {
	const set = new Set(existingPaths.map((p) => p.toLowerCase()));
	return {
		platform,
		env,
		fileExists: (p) => set.has(p.toLowerCase()),
		override,
	};
}

const WIN = { isWin: true, isMacOS: false, isLinux: false };
const MAC = { isWin: false, isMacOS: true, isLinux: false };
const LINUX = { isWin: false, isMacOS: false, isLinux: true };

describe("resolveShell", () => {
	describe("windows", () => {
		it("prefers pwsh.exe on PATH", async () => {
			const ctx = makeContext(WIN, { Path: "C:\\Program Files\\PowerShell\\7;C:\\Windows\\System32\\WindowsPowerShell\\v1.0" }, [
				"C:\\Program Files\\PowerShell\\7\\pwsh.exe",
				"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
			]);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
				args: [],
				displayName: "PowerShell",
			});
		});

		it("falls back to powershell.exe when pwsh is absent", async () => {
			const ctx = makeContext(WIN, { Path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0" }, [
				"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
			]);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
				args: [],
				displayName: "Windows PowerShell",
			});
		});

		it("falls back to bare pwsh.exe when nothing is found", async () => {
			const ctx = makeContext(WIN, { Path: "C:\\nothing" }, []);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "pwsh.exe",
				args: [],
				displayName: "PowerShell",
			});
		});
	});

	describe("macOS", () => {
		it("uses $SHELL when it exists", async () => {
			const ctx = makeContext(MAC, { SHELL: "/opt/homebrew/bin/fish" }, ["/opt/homebrew/bin/fish"]);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/opt/homebrew/bin/fish",
				// 登录模式补全 GUI 极简 PATH（path_helper / ~/.profile）
				args: ["-l"],
				displayName: "fish",
			});
		});

		it("falls back to /bin/zsh as a login shell", async () => {
			const ctx = makeContext(MAC, {}, ["/bin/zsh"]);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/bin/zsh",
				args: ["-l"],
				displayName: "zsh",
			});
		});
	});

	describe("linux", () => {
		it("uses $SHELL when it exists", async () => {
			const ctx = makeContext(LINUX, { SHELL: "/usr/bin/zsh" }, ["/usr/bin/zsh"]);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/usr/bin/zsh",
				args: [],
				displayName: "zsh",
			});
		});

		it("falls back to /bin/bash then /bin/sh", async () => {
			const ctx = makeContext(LINUX, { SHELL: "/nonexistent/fish" }, ["/bin/sh"]);
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/bin/sh",
				args: [],
				displayName: "sh",
			});
		});
	});

	describe("override", () => {
		it("uses configured shell when it exists", async () => {
			const ctx = makeContext(LINUX, { SHELL: "/bin/bash" }, ["/usr/local/bin/fish"], "/usr/local/bin/fish");
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/usr/local/bin/fish",
				args: [],
				displayName: "fish",
			});
		});

		it("keeps no args for unknown override binaries", async () => {
			const ctx = makeContext(LINUX, {}, ["/usr/local/bin/mysh"], "/usr/local/bin/mysh");
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/usr/local/bin/mysh",
				args: [],
				displayName: "mysh",
			});
		});

		it("ignores configured shell when missing and auto-detects", async () => {
			const ctx = makeContext(LINUX, { SHELL: "/bin/zsh" }, ["/bin/zsh"], "/nonexistent/shell");
			await expect(resolveShell(ctx)).resolves.toMatchObject({
				file: "/bin/zsh",
				args: [],
				displayName: "zsh",
			});
		});

		it("treats whitespace-only override as empty", async () => {
			const ctx = makeContext(MAC, {}, ["/bin/zsh"], "   ");
			await expect(resolveShell(ctx)).resolves.toMatchObject({ file: "/bin/zsh", args: ["-l"] });
		});
	});

	it("throws when no shell exists at all", async () => {
		const ctx = makeContext(LINUX, {}, []);
		await expect(resolveShell(ctx)).rejects.toThrow("No shell executable found");
	});
});
