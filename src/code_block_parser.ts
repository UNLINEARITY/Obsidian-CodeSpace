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

// Markdown 围栏代码块定位与前缀处理（纯函数，可单测）
// - 支持 ``` / ~~~ 及更长围栏，闭合围栏需同字符且不短于开启围栏
// - 引用块（> ）与列表缩进作为整行前缀：打开时剥离，写回时还原

export interface FencedCodeBlock {
	/** 开启围栏所在行（0 起） */
	openLine: number;
	/** 闭合围栏所在行（0 起） */
	closeLine: number;
	/** 开启围栏之前的整行前缀（引用标记与缩进） */
	prefix: string;
	/** 开启围栏后的信息串（已去首尾空白） */
	info: string;
	/** 信息串首个词（小写），即语言名 */
	language: string;
	/** 剥离前缀后的代码内容（"\n" 连接） */
	content: string;
}

const OPEN_FENCE = /^((?:[ \t]*>[ \t]?)*)([ \t]*)(`{3,}|~{3,})(.*)$/;

/** 剥离行前缀；空的引用行（只有 ">"）与缩进不足的行宽松处理 */
export function stripLinePrefix(line: string, prefix: string): string {
	if (!prefix) {
		return line;
	}
	if (line.startsWith(prefix)) {
		return line.slice(prefix.length);
	}
	const trimmedPrefix = prefix.trimEnd();
	if (trimmedPrefix && line.startsWith(trimmedPrefix)) {
		return line.slice(trimmedPrefix.length).replace(/^[ \t]/, "");
	}
	if (!prefix.includes(">")) {
		// 纯缩进前缀：最多去掉同等数量的前导空白
		const leading = /^[ \t]*/.exec(line)?.[0].length ?? 0;
		return line.slice(Math.min(leading, prefix.length));
	}
	return line;
}

/** 代码内容按前缀还原为行；空行只保留去尾空白的前缀（如引用块中的 ">"） */
export function applyLinePrefix(content: string, prefix: string): string[] {
	if (content === "") {
		return [];
	}
	return content.split("\n").map((line) => (line === "" ? prefix.trimEnd() : prefix + line));
}

function isClosingFence(line: string, prefix: string, fence: string): boolean {
	const body = stripLinePrefix(line, prefix);
	const match = /^[ \t]*(`{3,}|~{3,})[ \t]*$/.exec(body);
	return Boolean(match && match[1]![0] === fence[0] && match[1]!.length >= fence.length);
}

/** 找到包含 cursorLine（含围栏行）的围栏代码块；不在代码块内或未闭合返回 null */
export function findFencedCodeBlockAt(lines: string[], cursorLine: number): FencedCodeBlock | null {
	let index = 0;
	while (index < lines.length) {
		const match = OPEN_FENCE.exec(lines[index]!);
		const fence = match?.[3];
		// 反引号围栏的信息串不能含反引号（否则是行内代码）
		if (!match || !fence || (fence[0] === "`" && match[4]!.includes("`"))) {
			if (index >= cursorLine) {
				return null;
			}
			index++;
			continue;
		}
		const prefix = match[1]! + match[2]!;
		let close = index + 1;
		while (close < lines.length && !isClosingFence(lines[close]!, prefix, fence)) {
			close++;
		}
		if (close >= lines.length) {
			return null;
		}
		if (cursorLine >= index && cursorLine <= close) {
			const info = match[4]!.trim();
			return {
				openLine: index,
				closeLine: close,
				prefix,
				info,
				language: info.split(/\s+/)[0]?.toLowerCase() ?? "",
				content: lines.slice(index + 1, close).map((line) => stripLinePrefix(line, prefix)).join("\n"),
			};
		}
		if (index > cursorLine) {
			return null;
		}
		index = close + 1;
	}
	return null;
}

function rawMatchesAt(lines: string[], raw: string[], start: number): boolean {
	return start >= 0 && start + raw.length <= lines.length && raw.every((line, offset) => lines[start + offset] === line);
}

/**
 * 写回前重新定位代码块（含围栏行的原始行）：原位置未变则直接返回，
 * 否则在全文中查找唯一匹配；找不到或有多处相同内容时返回 null（不猜测）。
 */
export function locateRawBlock(lines: string[], raw: string[], expectedOpen: number): number | null {
	if (raw.length === 0) {
		return null;
	}
	if (rawMatchesAt(lines, raw, expectedOpen)) {
		return expectedOpen;
	}
	let found: number | null = null;
	for (let start = 0; start + raw.length <= lines.length; start++) {
		if (rawMatchesAt(lines, raw, start)) {
			if (found !== null) {
				return null;
			}
			found = start;
		}
	}
	return found;
}
