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

// Markdown 视图顶栏的"编辑代码块"按钮：光标位于围栏代码块内时显示，点击打开编辑弹窗
// - 位置：阅读/编辑模式切换按钮左侧（取不到内部按钮时保留 addAction 默认位置）
// - 光标移动经 DOM selectionchange、内容变化经 editor-change 防抖刷新；切换模式或标签页时同步刷新

import { MarkdownView } from "obsidian";
import type CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";
import { getCodeBlockAtCursor, openCodeBlockEditor } from "./code_block_modal";

const REFRESH_DEBOUNCE_MS = 120;

export function registerCodeBlockHeaderAction(plugin: CodeSpacePlugin): void {
	const buttons = new Map<MarkdownView, HTMLElement>();
	const timers = new Map<MarkdownView, number>();

	const ensureButton = (view: MarkdownView): HTMLElement => {
		const existing = buttons.get(view);
		if (existing?.isConnected) {
			return existing;
		}
		const button = view.addAction("square-code", t("CMD_EDIT_CODE_BLOCK"), () => {
			openCodeBlockEditor(plugin, view.editor, view);
		});
		button.addClass("code-space-code-block-action");
		// modeButtonEl 为内部 API：存在时把按钮紧贴在模式切换按钮左侧
		const modeButton = (view as MarkdownView & { modeButtonEl?: HTMLElement }).modeButtonEl;
		if (modeButton?.parentElement === button.parentElement) {
			modeButton.before(button);
		}
		buttons.set(view, button);
		return button;
	};

	const refresh = (view: MarkdownView): void => {
		const inBlock = view.getMode() === "source" && getCodeBlockAtCursor(view.editor) !== null;
		if (inBlock) {
			ensureButton(view).toggle(true);
		} else {
			buttons.get(view)?.toggle(false);
		}
	};

	const scheduleRefresh = (view: MarkdownView): void => {
		const pending = timers.get(view);
		if (pending !== undefined) {
			window.clearTimeout(pending);
		}
		timers.set(view, window.setTimeout(() => {
			timers.delete(view);
			refresh(view);
		}, REFRESH_DEBOUNCE_MS));
	};

	const refreshActive = (): void => {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			scheduleRefresh(view);
		}
	};

	// 光标移动：CodeMirror 同步 DOM 选区，文档级 selectionchange 可感知（主窗口与弹出窗口各注册一次）
	plugin.registerDomEvent(document, "selectionchange", refreshActive);
	plugin.registerEvent(plugin.app.workspace.on("window-open", (win) => {
		plugin.registerDomEvent(win.doc, "selectionchange", refreshActive);
	}));
	plugin.registerEvent(plugin.app.workspace.on("editor-change", (_editor, info) => {
		if (info instanceof MarkdownView) {
			scheduleRefresh(info);
		}
	}));
	plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", refreshActive));

	// 模式切换、标签页切换不经过编辑器更新，需单独刷新
	plugin.registerEvent(plugin.app.workspace.on("layout-change", () => {
		// 只扫描活动视图；其余视图直接隐藏按钮，避免多标签时逐个扫描全文
		const active = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		for (const [view, button] of buttons) {
			if (view !== active) {
				button.toggle(false);
			}
		}
		if (active) {
			refresh(active);
		}
		// 清理已关闭视图的记录
		for (const [view, button] of buttons) {
			if (!button.isConnected) {
				buttons.delete(view);
			}
		}
	}));

	plugin.register(() => {
		for (const timer of timers.values()) {
			window.clearTimeout(timer);
		}
		timers.clear();
		for (const button of buttons.values()) {
			button.remove();
		}
		buttons.clear();
	});
}
