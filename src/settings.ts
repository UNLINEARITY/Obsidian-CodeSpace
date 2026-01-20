import { App, PluginSettingTab, Setting, Plugin } from "obsidian";
import CodeSpacePlugin from "./main";

export interface CodeSpaceSettings {
	// 用户自定义的扩展名列表
	extensions: string;
	// 是否显示行号
	showLineNumbers: boolean;
	// 代码嵌入最大显示行数（0 表示不限制）
	maxEmbedLines: number;
}

export const DEFAULT_SETTINGS: CodeSpaceSettings = {
	extensions: "py, c, cpp, h, hpp, js, ts, jsx, tsx, json, mjs, cjs, css, scss, sass, less, html, htm, rs, go, java, sql, php, rb, sh, yaml, xml",
	showLineNumbers: true,
	maxEmbedLines: 30 // 默认最大显示 30 行
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
			.setName("Code space settings");

		new Setting(containerEl)
			.setName("Managed extensions")
			.setDesc("Comma separated list of file extensions to manage (e.g., py, js, cpp). Restart required to apply changes to file association.")
			.addTextArea((text) =>
				text
					.setPlaceholder("For example: py, js, c, cpp")
					.setValue(this.plugin.settings.extensions)
					.onChange(async (value) => {
						this.plugin.settings.extensions = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show line numbers")
			.setDesc("Toggle line numbers in the code editor.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showLineNumbers)
					.onChange(async (value) => {
						this.plugin.settings.showLineNumbers = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Max embed lines")
			.setDesc("Maximum number of lines to display in embedded code previews (0 for unlimited). If the file has fewer lines, all content is shown.")
			.addText((text) =>
				text
					.setPlaceholder("30")
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
