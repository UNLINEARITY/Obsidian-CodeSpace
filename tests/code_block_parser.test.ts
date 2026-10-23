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
import { applyLinePrefix, findFencedCodeBlockAt, locateRawBlock } from "../src/code_block_parser";

const doc = (text: string): string[] => text.split("\n");

describe("findFencedCodeBlockAt", () => {
	const lines = doc([
		"# Title",
		"```python title=\"a.py\"",
		"def f():",
		"    return 1",
		"```",
		"text",
		"~~~~js",
		"const a = \"```\";",
		"```",
		"~~~~",
	].join("\n"));

	it("finds the block around the cursor, including fence lines", () => {
		for (const line of [1, 2, 3, 4]) {
			const block = findFencedCodeBlockAt(lines, line);
			expect(block?.openLine).toBe(1);
			expect(block?.closeLine).toBe(4);
		}
		const block = findFencedCodeBlockAt(lines, 2)!;
		expect(block.language).toBe("python");
		expect(block.info).toBe("python title=\"a.py\"");
		expect(block.content).toBe("def f():\n    return 1");
	});

	it("requires a matching closing fence character and length", () => {
		const block = findFencedCodeBlockAt(lines, 7)!;
		expect(block.openLine).toBe(6);
		expect(block.closeLine).toBe(9);
		expect(block.content).toBe("const a = \"```\";\n```");
	});

	it("returns null outside blocks or for unclosed blocks", () => {
		expect(findFencedCodeBlockAt(lines, 0)).toBeNull();
		expect(findFencedCodeBlockAt(lines, 5)).toBeNull();
		expect(findFencedCodeBlockAt(doc("```js\nconst a = 1;"), 1)).toBeNull();
	});

	it("ignores inline code that looks like a fence", () => {
		expect(findFencedCodeBlockAt(doc("```a`b```\nx"), 1)).toBeNull();
	});

	it("strips and restores blockquote prefixes", () => {
		const quoted = doc("> [!note]\n> ```ts\n> const a = 1;\n>\n> const b = 2;\n> ```");
		const block = findFencedCodeBlockAt(quoted, 2)!;
		expect(block.prefix).toBe("> ");
		expect(block.content).toBe("const a = 1;\n\nconst b = 2;");
		expect(applyLinePrefix(block.content, block.prefix)).toEqual(quoted.slice(2, 5));
	});

	it("strips and restores list indentation", () => {
		const listed = doc("- item\n    ```sh\n    echo hi\n\n    echo bye\n    ```");
		const block = findFencedCodeBlockAt(listed, 2)!;
		expect(block.prefix).toBe("    ");
		expect(block.content).toBe("echo hi\n\necho bye");
		expect(applyLinePrefix(block.content, block.prefix)).toEqual(listed.slice(2, 5));
	});

	it("handles empty blocks", () => {
		const block = findFencedCodeBlockAt(doc("```\n```"), 0)!;
		expect(block.content).toBe("");
		expect(applyLinePrefix("", "")).toEqual([]);
	});
});

describe("locateRawBlock", () => {
	const raw = ["```js", "a();", "```"];

	it("keeps the original position when unchanged", () => {
		expect(locateRawBlock(["x", ...raw], raw, 1)).toBe(1);
	});

	it("follows the block when lines were inserted above", () => {
		expect(locateRawBlock(["x", "y", "z", ...raw], raw, 1)).toBe(3);
	});

	it("refuses to guess when the block changed or is duplicated", () => {
		expect(locateRawBlock(["```js", "b();", "```"], raw, 0)).toBeNull();
		expect(locateRawBlock([...raw, "x", ...raw], raw, 5)).toBeNull();
	});
});
