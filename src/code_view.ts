import { TextFileView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import { EditorView, keymap, highlightSpecialChars, drawSelection, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "@codemirror/view";
import { EditorState, Compartment, Extension } from "@codemirror/state";
import { syntaxHighlighting, bracketMatching, foldGutter, indentOnInput, HighlightStyle, indentUnit } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { closeBrackets } from "@codemirror/autocomplete";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { tags } from "@lezer/highlight";
import CodeSpacePlugin from "./main";

export const VIEW_TYPE_CODE_SPACE = "code-space-view";

// Language package mapping to ensure proper bundling
const LANGUAGE_PACKAGES: Record<string, Extension> = {
	// Python
	'py': python(),
	// C/C++
	'c': cpp(),
	'cpp': cpp(),
	'h': cpp(),
	'hpp': cpp(),
	'cc': cpp(),
	'cxx': cpp(),
	// JavaScript/TypeScript/JSON
	'js': javascript({ jsx: true }),
	'ts': javascript({ jsx: true }),
	'jsx': javascript({ jsx: true }),
	'tsx': javascript({ jsx: true }),
	'json': javascript({ jsx: true }),
	'mjs': javascript({ jsx: true }),
	'cjs': javascript({ jsx: true }),
	// HTML
	'html': html(),
	'htm': html(),
	'xhtml': html(),
	// CSS
	'css': css(),
	'scss': css(),
	'sass': css(),
	'less': css(),
	// SQL
	'sql': sql(),
	// PHP
	'php': php(),
};

// 1. 定义亮色模式高亮 (VS Code Light 风格)
const myLightHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: "#af00db" },
	{ tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: "#000000" },
	{ tag: [tags.function(tags.variableName), tags.labelName], color: "#795e26" },
	{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#0000ff" },
	{ tag: [tags.definition(tags.name), tags.separator], color: "#000000" },
	{ tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: "#098658" },
	{ tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: "#383838" },
	{ tag: [tags.meta, tags.comment], color: "#008000", fontStyle: "italic" },
	{ tag: tags.string, color: "#a31515" },
	{ tag: tags.atom, color: "#0000ff" },
	{ tag: tags.invalid, color: "#ff0000" },
]);

// 2. 定义暗色模式高亮 (One Dark 风格)
const myDarkHighlightStyle = HighlightStyle.define([
	{ tag: tags.keyword, color: "#c678dd" },
	{ tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: "#abb2bf" },
	{ tag: [tags.function(tags.variableName), tags.labelName], color: "#61afef" },
	{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#d19a66" },
	{ tag: [tags.definition(tags.name), tags.separator], color: "#abb2bf" },
	{ tag: [tags.typeName, tags.className, tags.number, tags.changed, tags.annotation, tags.modifier, tags.self, tags.namespace], color: "#e5c07b" },
	{ tag: [tags.operator, tags.operatorKeyword, tags.url, tags.escape, tags.regexp, tags.link, tags.special(tags.string)], color: "#56b6c2" },
	{ tag: [tags.meta, tags.comment], color: "#5c6370", fontStyle: "italic" },
	{ tag: tags.string, color: "#98c379" },
	{ tag: tags.atom, color: "#d19a66" },
	{ tag: tags.invalid, color: "#f44747" },
]);

// 3. 定义基础界面主题
const baseTheme = EditorView.theme({
	"&": {
		height: "100%",
		backgroundColor: "transparent !important",
		color: "var(--text-normal)"
	},
	".cm-content": {
		caretColor: "var(--text-accent) !important",
		padding: "10px 0"
	},
	".cm-gutters": {
		backgroundColor: "transparent !important",
		color: "var(--text-muted)",
		borderRight: "1px solid var(--background-modifier-border)",
		minWidth: "40px"
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--background-modifier-active-hover)"
	},
	".cm-activeLine": {
		backgroundColor: "var(--background-modifier-active-hover)"
	}
});

export class CodeSpaceView extends TextFileView {
	editorView: EditorView;
	themeCompartment: Compartment;
	lineNumbersCompartment: Compartment;
	languageCompartment: Compartment;
	fontSizeCompartment: Compartment; // 新增：管理字体大小
	fontSize: number = 15; // 默认字体大小（px）
	private isDirty: boolean = false; // 新增：跟踪是否有未保存的修改

	// 必需方法：告诉 Obsidian 这个视图可以接受哪些扩展名
	static canAcceptExtension(extension: string): boolean {
		const ext = extension.toLowerCase();

		// 检查用户是否在管理列表中添加了这个扩展名
		// @ts-ignore
		const app = (window as any).app;
		// @ts-ignore
		const plugin = app?.plugins?.getPlugin("code-space");
		if (plugin && plugin.settings) {
			const extensions = plugin.settings.extensions
				.split(',')
				.map((s: string) => s.trim().toLowerCase())
				.filter((s: string) => s);
			return extensions.includes(ext);
		}

		// 默认支持常见的代码文件扩展名
		return ['py', 'c', 'cpp', 'h', 'hpp', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'sql', 'php'].includes(ext);
	}

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.themeCompartment = new Compartment();
		this.lineNumbersCompartment = new Compartment();
		this.languageCompartment = new Compartment();
		this.fontSizeCompartment = new Compartment();
	}

	getViewType(): string {
		return VIEW_TYPE_CODE_SPACE;
	}

	getDisplayText(): string {
		return this.file ? this.file.name : "Code Space";
	}

	getPlugin(): CodeSpacePlugin {
		// @ts-ignore
		return this.app.plugins.getPlugin("code-space") as CodeSpacePlugin;
	}

	getLanguageExtension() {
		const ext = this.file?.extension.toLowerCase();
		if (!ext) return [];

		// Return the language extension from the mapping
		return LANGUAGE_PACKAGES[ext] || [];
	}

	getThemeExtension() {
		const isDark = document.body.classList.contains("theme-dark");
		return syntaxHighlighting(isDark ? myDarkHighlightStyle : myLightHighlightStyle);
	}

	getLineNumbersExtension(): Extension {
		const plugin = this.getPlugin();
		if (plugin && plugin.settings && plugin.settings.showLineNumbers) {
			return [lineNumbers(), highlightActiveLineGutter()];
		}
		return [];
	}

	getFontSizeExtension(): Extension {
		// 使用 EditorView.theme 统一设置所有元素的字体大小
		return EditorView.theme({
			"&": {
				fontSize: `${this.fontSize}px`
			},
			".cm-content": {
				fontSize: `${this.fontSize}px`
			},
			".cm-gutters": {
				fontSize: `${this.fontSize}px`
			},
			".cm-line": {
				fontSize: `${this.fontSize}px`
			}
		});
	}

	// 供外部调用的刷新方法
	refreshSettings() {
		this.editorView.dispatch({
			effects: this.lineNumbersCompartment.reconfigure(this.getLineNumbersExtension())
		});
	}

	// 手动保存方法（Ctrl+S 触发）
	async save() {
		if (!this.file) return;

		try {
			// 先清除 dirty 状态，避免保存时触发 modify 事件被误判为外部修改
			const wasDirty = this.isDirty;
			this.isDirty = false;
			this.updateTitle();

			// 使用 Obsidian 的标准保存方法
			await this.app.vault.modify(this.file, this.editorView.state.doc.toString());

			// 更新缓存
			this.data = this.editorView.state.doc.toString();

			console.log("Code Space: File saved");
		} catch (error) {
			// 保存失败，恢复 dirty 状态
			this.isDirty = true;
			this.updateTitle();
			console.error("Code Space: Failed to save file:", error);
			new Notice("Failed to save file");
		}
	}

	// 更新标题显示未保存状态
	updateTitle() {
		if (!this.file) return;

		// 在文件名后添加 ● 表示未保存
		const title = this.isDirty ? `${this.file.name} ●` : this.file.name;
		this.leaf.setViewState({ type: VIEW_TYPE_CODE_SPACE, active: true, state: { file: this.file.path } });

		// 尝试更新 tab 标题（Obsidian 可能不直接支持，但我们可以尝试）
		const titleEl = this.containerEl.querySelector('.view-header-title');
		if (titleEl) {
			titleEl.textContent = title;
		}
	}

	async onLoadFile(file: TFile): Promise<void> {
		await super.onLoadFile(file);

		// Obsidian 原生支持的二进制文件类型列表
		const nativeBinaryExtensions = [
			// 图片
			'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'psd',
			// PDF
			'pdf',
			// 音频
			'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
			// 视频
			'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
			// 压缩文件
			'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz',
			// Office 文档
			'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
			// 其他二进制文件
			'exe', 'dll', 'so', 'dylib', 'bin', 'dat'
		];

		// 检查当前文件是否是二进制文件
		const ext = file.extension.toLowerCase();
		if (nativeBinaryExtensions.includes(ext)) {
			console.log(`Code Space: Detected binary file .${ext}, opening with native viewer`);

			// 先销毁编辑器，防止它保存二进制内容
			if (this.editorView) {
				this.editorView.destroy();
				this.editorView = null as any;
			}

			// 使用 Obsidian 原生方式打开文件
			await this.app.workspace.openLinkText(file.path, '', true);

			// 关闭当前的 Code Space 视图（因为已经用原生查看器打开了）
			this.leaf.detach();
			return;
		}

		// Update language extension when file is loaded
		if (this.editorView) {
			console.log("Code Space: File loaded:", file.name, "extension:", ext);
			const langExt = LANGUAGE_PACKAGES[ext] || [];
			console.log("Code Space: Applying language extension:", langExt);
			this.editorView.dispatch({
				effects: this.languageCompartment.reconfigure(langExt)
			});
		}

		// 文件加载完成，清除 dirty 状态
		this.isDirty = false;
		this.updateTitle();
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) return;
		container.empty();

		const root = container.createDiv({ cls: "code-space-container" });

		// Debug: Log file extension and language extension
		const ext = this.file?.extension.toLowerCase();
		console.log("Code Space: Opening file", this.file?.name, "with extension:", ext);

		const baseExtensions = [
			baseTheme,
			this.fontSizeCompartment.of(this.getFontSizeExtension()), // 字体大小管理
			this.lineNumbersCompartment.of(this.getLineNumbersExtension()),
			this.languageCompartment.of([]), // Start with empty, will be updated in onLoadFile
			highlightSpecialChars(),
			history(),
			foldGutter(),
			drawSelection(),
			indentOnInput(),
			bracketMatching(),
			closeBrackets(),
			highlightActiveLine(),
			indentUnit.of("    "),
			keymap.of([
				...defaultKeymap,
				...historyKeymap,
				indentWithTab,
				{
					key: "Mod-s",
					run: () => {
						this.save();
						return true;
					}
				}
			]),
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					// 标记为有未保存修改，但不自动保存
					if (!this.isDirty) {
						this.isDirty = true;
						this.updateTitle();
					}
				}
			})
		];

		const state = EditorState.create({
			doc: this.data,
			extensions: [
				...baseExtensions,
				this.themeCompartment.of(this.getThemeExtension())
			]
		});

		this.editorView = new EditorView({
			state,
			parent: root
		});

		console.log("Code Space: Editor created with state");

		// 添加 Ctrl+滚轮缩放功能
		this.registerDomEvent(root, "wheel", (event: WheelEvent) => {
			// 检测是否按下了 Ctrl 或 Cmd 键
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault();

				// 计算缩放方向
				const delta = event.deltaY > 0 ? -1 : 1;

				// 调整字体大小（每次变化 1px，范围 9-36px）
				const newSize = Math.max(9, Math.min(36, this.fontSize + delta));

				if (newSize !== this.fontSize) {
					this.fontSize = newSize;

					// 使用 Compartment 重新配置字体大小扩展
					this.editorView.dispatch({
						effects: this.fontSizeCompartment.reconfigure(this.getFontSizeExtension())
					});

					console.log(`Code Space: Font size changed to ${this.fontSize}px`);
				}
			}
		}, { passive: false });

		this.registerEvent(this.app.workspace.on("css-change", () => {
			this.editorView.dispatch({
				effects: this.themeCompartment.reconfigure(this.getThemeExtension())
			});
		}));

		// 监听文件修改事件（外部编辑）
		this.registerEvent(this.app.vault.on("modify", (file: TFile) => {
			// 检查修改的文件是否是当前打开的文件
			if (this.file && file.path === this.file.path) {
				// 如果有未保存的修改，不要重新加载（保护用户的编辑）
				if (this.isDirty) {
					console.log("Code Space: File modified externally but has unsaved changes");
					new Notice("File modified externally. You have unsaved changes.", 5000);
					return;
				}

				// 没有未保存的修改，直接刷新
				console.log("Code Space: File modified externally, reloading...");
				this.loadFileContent();
			}
		}));
	}

	async loadFileContent() {
		if (!this.file) return;

		try {
			// 读取文件内容
			const content = await this.app.vault.read(this.file);

			// 更新编辑器内容
			this.editorView.dispatch({
				changes: {
					from: 0,
					to: this.editorView.state.doc.length,
					insert: content
				}
			});

			// 更新缓存的文件内容
			this.data = content;

			// 清除 dirty 状态（因为内容已经从磁盘重新加载）
			this.isDirty = false;
			this.updateTitle();

			console.log("Code Space: File content reloaded from disk");
		} catch (error) {
			console.error("Code Space: Failed to reload file content:", error);
		}
	}

	async onClose(): Promise<void> {
		if (this.editorView) {
			this.editorView.destroy();
		}
	}

	getViewData(): string {
		return this.editorView ? this.editorView.state.doc.toString() : this.data;
	}

	setViewData(data: string, clear: boolean): void {
		if (clear && this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: data }
			});
		}
		this.data = data;
	}

	clear(): void {
		if (this.editorView) {
			this.editorView.dispatch({
				changes: { from: 0, to: this.editorView.state.doc.length, insert: "" }
			});
		}
	}
}