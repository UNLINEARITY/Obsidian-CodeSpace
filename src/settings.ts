import { App, PluginSettingTab, Setting, Plugin, FuzzySuggestModal, TFolder } from "obsidian";
import CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";

// Suggester for folder selection
export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	onSelect: (folder: TFolder) => void;

	constructor(app: App, onSelect: (folder: TFolder) => void) {
		super(app);
		this.onSelect = onSelect;
	}

	getItems(): TFolder[] {
		// Get all folders in the vault
		return this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder);
	}

	getItemText(folder: TFolder): string {
		// Display folder path
		return folder.path;
	}

	onChooseItem(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(folder);
	}
}

export interface DashboardState {
	searchQuery: string;
	filterExt: string;
	sortBy: 'date' | 'name' | 'type';
	sortDesc: boolean;
}

export interface CodeSpaceSettings {
	// 用户自定义的扩展名列表
	extensions: string;
	// 是否显示行号
	showLineNumbers: boolean;
	// 编辑器字体大小
	editorFontSize: number;
	// 引用块字体大小
	embedFontSize: number;
	// 代码嵌入最大显示行数（0 表示不限制）
	maxEmbedLines: number;
	// 指定的文件夹路径
	newFileFolderPath: string;
	// Dashboard 状态记忆
	dashboardState: DashboardState;
}

export const DEFAULT_SETTINGS: CodeSpaceSettings = {
	extensions: "py, c, cpp, h, hpp, js, ts, jsx, tsx, json, mjs, cjs, css, scss, sass, less, html, htm, rs, go, java, sql, php, rb, sh, yaml, xml, cs, yml",
	showLineNumbers: true,
	editorFontSize: 18,
	embedFontSize: 15,
	maxEmbedLines: 20, // 默认最大显示 30 行
	newFileFolderPath: '',
	dashboardState: {
		searchQuery: "",
		filterExt: "all",
		sortBy: "date",
		sortDesc: true
	}
};

export class CodeSpaceSettingTab extends PluginSettingTab {
	plugin: CodeSpacePlugin;

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin as CodeSpacePlugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setHeading()
			.setName(t('SETTINGS_HEADING'));

		new Setting(containerEl)
			.setName(t('SETTINGS_EXTENSIONS_NAME'))
			.setDesc(t('SETTINGS_EXTENSIONS_DESC'))
			.addTextArea((text) => {
				text
					.setPlaceholder(t('SETTINGS_EXTENSIONS_PLACEHOLDER'))
					.setValue(this.plugin.settings.extensions)
					.onChange(async (value) => {
						this.plugin.settings.extensions = value;
						await this.plugin.saveSettings();
					});
				// Make the textarea larger by default
				text.inputEl.rows = 6;
			});

		new Setting(containerEl)
			.setName(t('SETTINGS_LINE_NUMBERS_NAME'))
			.setDesc(t('SETTINGS_LINE_NUMBERS_DESC'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showLineNumbers)
					.onChange(async (value) => {
						this.plugin.settings.showLineNumbers = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t('SETTINGS_EDITOR_FONT_SIZE_NAME'))
			.setDesc(t('SETTINGS_EDITOR_FONT_SIZE_DESC'))
			.addText((text) =>
				text
					.setPlaceholder("16")
					.setValue(String(this.plugin.settings.editorFontSize))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 9 && num <= 36) {
							this.plugin.settings.editorFontSize = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName(t('SETTINGS_EMBED_FONT_SIZE_NAME'))
			.setDesc(t('SETTINGS_EMBED_FONT_SIZE_DESC'))
			.addText((text) =>
				text
					.setPlaceholder("13")
					.setValue(String(this.plugin.settings.embedFontSize))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 9 && num <= 36) {
							this.plugin.settings.embedFontSize = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName(t('SETTINGS_MAX_EMBED_LINES_NAME'))
			.setDesc(t('SETTINGS_MAX_EMBED_LINES_DESC'))
			.addText((text) =>
				text
					.setPlaceholder(t('SETTINGS_MAX_EMBED_LINES_PLACEHOLDER'))
					.setValue(String(this.plugin.settings.maxEmbedLines))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 0) {
							this.plugin.settings.maxEmbedLines = num;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName(t('SETTINGS_NEW_FILE_LOCATION_NAME'))
			.setDesc(t('SETTINGS_NEW_FILE_LOCATION_DESC'))
			.addText((text) => {
				text
					.setPlaceholder(t('SETTINGS_NEW_FILE_FOLDER_PLACEHOLDER'))
					.setValue(this.plugin.settings.newFileFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.newFileFolderPath = value;
						await this.plugin.saveSettings();
					});
			})
			.addButton((button) => {
				button
					.setButtonText(t('SETTINGS_NEW_FILE_LOCATION_BUTTON'))
					.onClick(() => {
						new FolderSuggestModal(this.app, (folder) => {
							this.plugin.settings.newFileFolderPath = folder.path;
							void this.plugin.saveSettings();
							// Refresh display to show the new value
							this.display();
						}).open();
					});
			});
	}
}
