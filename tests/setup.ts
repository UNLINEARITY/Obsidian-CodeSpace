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

// vitest 全局 setup：为 node 测试环境预置 window 全局。
// src/lang/helpers.ts 在模块加载时访问 window.moment.locale()，
// 任何间接触及该模块的测试都需要它先于测试文件导入执行。

type WindowLike = {
	require?: (module: string) => unknown;
	moment: { locale(): string };
};

const existing = (globalThis as { window?: WindowLike }).window;
if (!existing) {
	(globalThis as { window: WindowLike }).window = {
		moment: { locale: () => "en" },
	};
}

// xterm 系列包的 UMD 包装在模块加载期访问 self（浏览器全局）
if (typeof (globalThis as { self?: unknown }).self === "undefined") {
	(globalThis as { self: unknown }).self = globalThis;
}
