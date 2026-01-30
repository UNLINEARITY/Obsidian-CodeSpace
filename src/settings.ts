import { App, PluginSettingTab, Setting, Plugin } from "obsidian";
import CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";

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
	// 代码嵌入最大显示行数（0 表示不限制）
	maxEmbedLines: number;
	// Dashboard 状态记忆
	dashboardState: DashboardState;
}

export const DEFAULT_SETTINGS: CodeSpaceSettings = {
	extensions: "py, c, cpp, h, hpp, js, ts, jsx, tsx, json, mjs, cjs, css, scss, sass, less, html, htm, rs, go, java, sql, php, rb, sh, yaml, xml, cs, yml",
	showLineNumbers: true,
	maxEmbedLines: 20, // 默认最大显示 30 行
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
			.addTextArea((text) =>
				text
					.setPlaceholder(t('SETTINGS_EXTENSIONS_PLACEHOLDER'))
					.setValue(this.plugin.settings.extensions)
					.onChange(async (value) => {
						this.plugin.settings.extensions = value;
						await this.plugin.saveSettings();
					})
			);

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
	}
}
