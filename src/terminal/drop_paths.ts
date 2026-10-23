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

// 拖入终端：Obsidian 文件列表 / 系统文件 → 按 shell 规则加引号的真实路径

import type { App, TAbstractFile } from "obsidian";
import { getDroppedFilePath, getFsPromises, getPath, getVaultBasePath } from "./node_access";

export type ShellQuoteStyle = "posix" | "powershell" | "cmd";

/** 按 shell 可执行文件名判定引号规则（Git Bash/WSL 等走 posix） */
export function quoteStyleForShell(shellFile: string): ShellQuoteStyle {
	const name = shellFile.split(/[\\/]/).pop()?.toLowerCase().replace(/\.exe$/, "") ?? "";
	if (name === "pwsh" || name === "powershell") {
		return "powershell";
	}
	if (name === "cmd") {
		return "cmd";
	}
	return "posix";
}

/** 单个路径加引号：posix/PowerShell 用单引号（转义内部单引号），cmd 用双引号 */
export function quotePath(path: string, style: ShellQuoteStyle): string {
	switch (style) {
		case "powershell":
			return `'${path.replace(/'/g, "''")}'`;
		case "cmd":
			return `"${path}"`;
		default:
			return `'${path.replace(/'/g, "'\\''")}'`;
	}
}

/** 多个路径以空格拼接并补尾随空格（与系统终端拖放习惯一致）；无路径返回 null */
export function formatDroppedPaths(paths: string[], style: ShellQuoteStyle): string | null {
	const valid = paths.filter((path) => path.length > 0);
	if (valid.length === 0) {
		return null;
	}
	return `${valid.map((path) => quotePath(path, style)).join(" ")} `;
}

type Draggable = { type?: string; file?: TAbstractFile; files?: TAbstractFile[] };

/** Obsidian 内部拖拽状态（文件列表拖出的条目；非公开 API，取不到时返回空） */
function getVaultDraggedFiles(app: App): TAbstractFile[] {
	const draggable = (app as App & { dragManager?: { draggable?: Draggable | null } }).dragManager?.draggable;
	if (!draggable) {
		return [];
	}
	if (draggable.type === "files" && Array.isArray(draggable.files)) {
		return draggable.files;
	}
	if ((draggable.type === "file" || draggable.type === "folder") && draggable.file) {
		return [draggable.file];
	}
	return [];
}

/** 拖拽是否携带可转换的文件（dragover 阶段判定，决定是否接管 drop） */
export function hasDroppableFiles(app: App, event: DragEvent): boolean {
	return getVaultDraggedFiles(app).length > 0 || Boolean(event.dataTransfer?.types.includes("Files"));
}

/** vault 条目 → 磁盘真实路径（外部挂载的软链接/junction 解析到目标位置） */
async function resolveVaultFilePath(app: App, file: TAbstractFile): Promise<string> {
	const segments = file.path.split("/").filter(Boolean);
	const joined = getPath().join(getVaultBasePath(app), ...segments);
	try {
		return await getFsPromises().realpath(joined);
	} catch {
		return joined;
	}
}

/** 解析一次 drop 的全部路径：优先 Obsidian 文件列表，其次系统拖入的文件 */
export async function resolveDroppedPaths(app: App, event: DragEvent): Promise<string[]> {
	const vaultFiles = getVaultDraggedFiles(app);
	if (vaultFiles.length > 0) {
		return Promise.all(vaultFiles.map((file) => resolveVaultFilePath(app, file)));
	}
	return Array.from(event.dataTransfer?.files ?? []).map((file) => getDroppedFilePath(file));
}
