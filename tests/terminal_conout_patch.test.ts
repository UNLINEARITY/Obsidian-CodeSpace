import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import { WINDOWSCONOUT_PATCH } from "../src/terminal/conout_patch";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function normalizeNewlines(value: string): string {
	return value.replace(/\r\n/g, "\n").replace(/\n+$/, "");
}

describe("windowsConoutConnection patch", () => {
	it("embedded copy matches patches/windowsConoutConnection.js", () => {
		const patchFile = readFileSync(
			path.join(repoRoot, "patches", "windowsConoutConnection.js"),
			"utf-8"
		);
		expect(normalizeNewlines(patchFile)).toBe(normalizeNewlines(WINDOWSCONOUT_PATCH));
	});

	it("contains required structural elements", () => {
		// 接口必须与 node-pty 上游保持一致（被 windowsPtyAgent 调用）
		expect(WINDOWSCONOUT_PATCH).toContain("exports.ConoutConnection");
		expect(WINDOWSCONOUT_PATCH).toContain("connectSocket");
		expect(WINDOWSCONOUT_PATCH).toContain("onReady");
		expect(WINDOWSCONOUT_PATCH).toContain("getWorkerPipeName");
		// 补丁的核心目的：移除 worker_threads，改用内联 socket 管道
		expect(WINDOWSCONOUT_PATCH).toContain("require(\"net\")");
		expect(WINDOWSCONOUT_PATCH).not.toContain("worker_threads");
	});
});
