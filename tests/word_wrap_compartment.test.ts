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

// @vitest-environment jsdom
// 复现/回归：换行 Compartment 的开↔关切换是否真实生效（cm-lineWrapping class 移除）
import { describe, expect, it, beforeEach } from "vitest";
import { EditorView } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";

// jsdom 缺少 CM 视图需要的 ResizeObserver
class ResizeObserverStub {
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}
beforeEach(() => {
	if (typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === "undefined") {
		(globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
	}
});

describe("lineWrapping compartment", () => {
	it("开启 → 关闭 → 开启，class 与视图状态同步切换", () => {
		const wrap = new Compartment();
		const view = new EditorView({
			state: EditorState.create({
				doc: "a long line ".repeat(40),
				extensions: [wrap.of(EditorView.lineWrapping)],
			}),
			parent: document.body,
		});

		// 初始：开启 → 有 cm-lineWrapping class
		expect(view.contentDOM.className).toContain("cm-lineWrapping");

		// 关闭 → class 移除
		view.dispatch({ effects: wrap.reconfigure([]) });
		expect(view.contentDOM.className).not.toContain("cm-lineWrapping");

		// 重新开启 → class 回来
		view.dispatch({ effects: wrap.reconfigure(EditorView.lineWrapping) });
		expect(view.contentDOM.className).toContain("cm-lineWrapping");

		view.destroy();
	});
});
