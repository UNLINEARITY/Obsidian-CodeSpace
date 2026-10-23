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

import { describe, expect, it } from "vitest";
import { formatDroppedPaths, quotePath, quoteStyleForShell } from "../src/terminal/drop_paths";

describe("quoteStyleForShell", () => {
	it("maps shells to quote styles", () => {
		expect(quoteStyleForShell("/bin/zsh")).toBe("posix");
		expect(quoteStyleForShell("C:\\Program Files\\Git\\bin\\bash.exe")).toBe("posix");
		expect(quoteStyleForShell("pwsh.exe")).toBe("powershell");
		expect(quoteStyleForShell("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe")).toBe("powershell");
		expect(quoteStyleForShell("C:\\Windows\\System32\\cmd.exe")).toBe("cmd");
	});
});

describe("quotePath", () => {
	it("escapes single quotes for posix shells", () => {
		expect(quotePath("/Users/me/中文 目录/it's.ts", "posix")).toBe("'/Users/me/中文 目录/it'\\''s.ts'");
	});

	it("doubles single quotes for PowerShell", () => {
		expect(quotePath("C:\\a b\\it's.ps1", "powershell")).toBe("'C:\\a b\\it''s.ps1'");
	});

	it("wraps cmd paths in double quotes", () => {
		expect(quotePath("C:\\a b\\x.bat", "cmd")).toBe("\"C:\\a b\\x.bat\"");
	});
});

describe("formatDroppedPaths", () => {
	it("joins paths with spaces and adds a trailing space", () => {
		expect(formatDroppedPaths(["/a", "/b c"], "posix")).toBe("'/a' '/b c' ");
	});

	it("returns null when nothing resolved", () => {
		expect(formatDroppedPaths([], "posix")).toBeNull();
		expect(formatDroppedPaths([""], "posix")).toBeNull();
	});
});
