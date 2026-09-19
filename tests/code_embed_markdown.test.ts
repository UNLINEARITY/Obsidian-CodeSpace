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
import { sliceFileContent } from "../src/code_embed_markdown";

describe("code embed line ranges", () => {
	it("keeps an inclusive range when the source ends with a newline", () => {
		const content = Array.from({ length: 13 }, (_, index) => `line-${index + 1}`).join("\n") + "\n";

		expect(sliceFileContent(content, 2, 12)).toBe(
			Array.from({ length: 11 }, (_, index) => `line-${index + 2}`).join("\n"),
		);
	});

	it("normalizes Windows line endings in a selected range", () => {
		expect(sliceFileContent("line-1\r\nline-2\r\nline-3\r\n", 2, 3)).toBe("line-2\nline-3");
	});
});
