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

// 在 Code Space 编辑器（弹窗）中编辑笔记里的围栏代码块，并写回原笔记
// - 写回走 Obsidian 编辑器 API（replaceRange），可在笔记中撤销，不直接写盘
// - 写回前重新定位代码块；位置无法确认时不覆盖，改为复制到剪贴板

import { ButtonComponent, Editor, MarkdownView, Modal, Notice } from "obsidian";
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { EditorState, Prec } from "@codemirror/state";
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets } from "@codemirror/autocomplete";
import { highlightSelectionMatches } from "@codemirror/search";
import type CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";
import { applyLinePrefix, findFencedCodeBlockAt, locateRawBlock, type FencedCodeBlock } from "./code_block_parser";
import { resolveFenceLanguage } from "./language_registry";
import { baseTheme, myDarkHighlightStyle, myLightHighlightStyle } from "./code_view";
import { setupScrollbarVisibility } from "./scrollbar_visibility";

/** 光标所在的围栏代码块（不在代码块内返回 null） */
export function getCodeBlockAtCursor(editor: Editor): FencedCodeBlock | null {
	return findFencedCodeBlockAt(editor.getValue().split("\n"), editor.getCursor().line);
}

/** 打开代码块编辑弹窗；光标不在代码块内时返回 false */
export function openCodeBlockEditor(plugin: CodeSpacePlugin, editor: Editor, view: MarkdownView): boolean {
	const lines = editor.getValue().split("\n");
	const block = findFencedCodeBlockAt(lines, editor.getCursor().line);
	if (!block || !view.file) {
		return false;
	}
	const raw = lines.slice(block.openLine, block.closeLine + 1);
	new CodeBlockEditModal(plugin, view, view.file.path, block, raw).open();
	return true;
}

class CodeBlockEditModal extends Modal {
	private editorView: EditorView | null = null;
	private cleanupScrollbar: (() => void) | undefined;
	private settled = false;

	constructor(
		private plugin: CodeSpacePlugin,
		private view: MarkdownView,
		private filePath: string,
		private block: FencedCodeBlock,
		private raw: string[],
	) {
		super(plugin.app);
	}

	onOpen(): void {
		this.modalEl.addClass("code-space-code-block-modal");
		this.setTitle(this.block.language ? `${t("MODAL_CODE_BLOCK_TITLE")} · ${this.block.language}` : t("MODAL_CODE_BLOCK_TITLE"));

		const root = this.contentEl.createDiv({ cls: "code-space-container code-space-code-block-editor" });
		const settings = this.plugin.settings;
		const isDark = root.ownerDocument.body.classList.contains("theme-dark");
		const fontSize = settings.editorFontSize || 16;
		this.editorView = new EditorView({
			parent: root,
			state: EditorState.create({
				doc: this.block.content,
				extensions: [
					baseTheme,
					EditorView.theme({
						"&": { fontSize: `${fontSize}px` },
						".cm-content": { fontSize: `${fontSize}px`, lineHeight: "1.5" },
					}),
					settings.showLineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : [],
					settings.editorWordWrap ? EditorView.lineWrapping : [],
					resolveFenceLanguage(this.block.language),
					syntaxHighlighting(isDark ? myDarkHighlightStyle : myLightHighlightStyle),
					highlightSpecialChars(),
					history(),
					drawSelection(),
					indentOnInput(),
					bracketMatching(),
					closeBrackets(),
					highlightActiveLine(),
					highlightSelectionMatches(),
					indentUnit.of("    "),
					keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
					Prec.highest(keymap.of([{
						key: "Mod-s",
						run: () => {
							this.save();
							return true;
						},
					}])),
				],
			}),
		});
		this.cleanupScrollbar = setupScrollbarVisibility(this.editorView.scrollDOM);

		const buttons = this.contentEl.createDiv({ cls: "modal-button-container" });
		new ButtonComponent(buttons)
			.setButtonText(t("MODAL_CODE_BLOCK_CANCEL"))
			.onClick(() => {
				this.settled = true;
				this.close();
			});
		new ButtonComponent(buttons)
			.setButtonText(t("MODAL_CODE_BLOCK_SAVE"))
			.setCta()
			.onClick(() => this.save());

		this.editorView.focus();
	}

	onClose(): void {
		// 直接关闭（Esc / 关闭按钮）视同保存，与 Code Space 编辑器关闭即保存一致
		if (!this.settled) {
			this.settled = true;
			if (!this.writeBack()) {
				this.copyToClipboard();
			}
		}
		this.cleanupScrollbar?.();
		this.cleanupScrollbar = undefined;
		this.editorView?.destroy();
		this.editorView = null;
		this.contentEl.empty();
	}

	private save(): void {
		if (this.writeBack()) {
			this.settled = true;
			this.close();
			return;
		}
		// 写回失败保持弹窗打开，修改不丢失
		this.copyToClipboard();
	}

	private copyToClipboard(): void {
		const content = this.editorView?.state.doc.toString();
		if (content === undefined || content === this.block.content) {
			return;
		}
		void navigator.clipboard.writeText(content).catch((error) => {
			console.error("Code Space: Failed to copy code block to clipboard:", error);
		});
		new Notice(t("NOTICE_CODE_BLOCK_CHANGED"), 6000);
	}

	/** 写回笔记；内容未变视为成功。返回 false 表示代码块位置无法确认 */
	private writeBack(): boolean {
		const content = this.editorView?.state.doc.toString();
		if (content === undefined || content === this.block.content) {
			return true;
		}
		const editor = this.findEditor();
		if (!editor) {
			return false;
		}
		const open = locateRawBlock(editor.getValue().split("\n"), this.raw, this.block.openLine);
		if (open === null) {
			return false;
		}
		const close = open + this.raw.length - 1;
		const lines = applyLinePrefix(content, this.block.prefix);
		editor.replaceRange(
			lines.length > 0 ? `${lines.join("\n")}\n` : "",
			{ line: open + 1, ch: 0 },
			{ line: close, ch: 0 },
		);
		// 写回后同步快照，同一弹窗再次保存时仍能定位
		this.raw = [this.raw[0]!, ...lines, this.raw[this.raw.length - 1]!];
		this.block = { ...this.block, openLine: open, closeLine: open + lines.length + 1, content };
		return true;
	}

	/** 原笔记的编辑器：优先发起时的视图，其次任一打开同一笔记的 Markdown 视图 */
	private findEditor(): Editor | null {
		if (this.view.file?.path === this.filePath) {
			return this.view.editor;
		}
		for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
			if (leaf.view instanceof MarkdownView && leaf.view.file?.path === this.filePath) {
				return leaf.view.editor;
			}
		}
		return null;
	}
}
