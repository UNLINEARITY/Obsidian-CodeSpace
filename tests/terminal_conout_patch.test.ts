// SPDX-License-Identifier: AGPL-3.0-or-later
// Code Space - professional code file support for Obsidian.
// Copyright (C) 2026 unlinearity
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

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
