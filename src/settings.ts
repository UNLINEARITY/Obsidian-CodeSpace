import { App, PluginSettingTab, Setting, Plugin } from "obsidian";

export interface CodeSpaceSettings {
	// 用户自定义的扩展名列表
	extensions: string;
	// 是否显示行号
	showLineNumbers: boolean;
}

export const DEFAULT_SETTINGS: CodeSpaceSettings = {
	extensions: "py, c, cpp, h, hpp, js, ts, jsx, tsx, json, mjs, cjs, css, scss, sass, less, html, htm, rs, go, java, sql, php, rb, sh, yaml, xml",
	showLineNumbers: true
};

export class CodeSpaceSettingTab extends PluginSettingTab {
	plugin: any; // 避免循环引用类型问题

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Code Space Settings" });

		new Setting(containerEl)
			.setName("Managed Extensions")
			.setDesc("Comma-separated list of file extensions to manage (e.g. py, js, cpp). Restart required to apply changes to file association.")
			.addTextArea((text) =>
				text
					.setPlaceholder("py, js, c, cpp")
					.setValue(this.plugin.settings.extensions)
					.onChange(async (value) => {
						this.plugin.settings.extensions = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show Line Numbers")
			.setDesc("Toggle line numbers in the code editor.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showLineNumbers)
					.onChange(async (value) => {
						this.plugin.settings.showLineNumbers = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
