import { App, PluginSettingTab, Setting, Plugin, FuzzySuggestModal, TFolder, Notice, Platform, TextComponent, ButtonComponent, Modal } from "obsidian";
import CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";
import { ExternalMount, ExternalMountLinkType, ExternalMountManager, pickExternalFolder, suggestMountPath } from "./external_mount";

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

class ExternalMountModal extends Modal {
	private sourcePath = "";
	private mountPath = "";
	private onSubmit: (sourcePath: string, mountPath: string) => void;

	constructor(app: App, onSubmit: (sourcePath: string, mountPath: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
		this.setTitle(t("SETTINGS_EXTERNAL_MOUNT_MODAL_TITLE"));
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		let sourceInput: TextComponent | null = null;
		let mountInput: TextComponent | null = null;

		new Setting(contentEl)
			.setName(t("SETTINGS_EXTERNAL_MOUNT_SOURCE_NAME"))
			.setDesc(t("SETTINGS_EXTERNAL_MOUNT_SOURCE_DESC"))
			.addText((text) => {
				sourceInput = text;
				text
					.setPlaceholder(t("SETTINGS_EXTERNAL_MOUNT_SOURCE_PLACEHOLDER"))
					.setValue(this.sourcePath)
					.onChange((value) => {
						this.sourcePath = value;
					});
			})
			.addButton((button) => {
				button
					.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_BROWSE"))
					.onClick(async () => {
						const picked = await pickExternalFolder();
						if (!picked.path) {
							if (picked.unavailable) {
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_DIALOG_UNAVAILABLE"));
							}
							return;
						}
						this.sourcePath = picked.path;
						sourceInput?.setValue(picked.path);
						if (!this.mountPath) {
							const suggested = suggestMountPath(picked.path);
							this.mountPath = suggested;
							mountInput?.setValue(suggested);
						}
					});
			});

		new Setting(contentEl)
			.setName(t("SETTINGS_EXTERNAL_MOUNT_MOUNT_NAME"))
			.setDesc(t("SETTINGS_EXTERNAL_MOUNT_MOUNT_DESC"))
			.addText((text) => {
				mountInput = text;
				text
					.setPlaceholder(t("SETTINGS_EXTERNAL_MOUNT_MOUNT_PLACEHOLDER"))
					.setValue(this.mountPath)
					.onChange((value) => {
						this.mountPath = value;
					});
			});

		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });
		const submitBtn = new ButtonComponent(buttonContainer);
		submitBtn.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_MODAL_CREATE"));
		submitBtn.setCta();
		submitBtn.onClick(() => {
			this.submit();
		});

		const cancelBtn = new ButtonComponent(buttonContainer);
		cancelBtn.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_MODAL_CANCEL"));
		cancelBtn.onClick(() => this.close());
	}

	private submit() {
		const sourcePath = this.sourcePath.trim();
		const mountPath = this.mountPath.trim();
		if (!sourcePath || !mountPath) {
			new Notice(t("SETTINGS_EXTERNAL_MOUNT_INVALID"));
			return;
		}
		this.close();
		this.onSubmit(sourcePath, mountPath);
	}
}

function createMountId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface DashboardState {
	searchQuery: string;
	filterExt: string[];
	filterFolder: string[];
	sortBy: 'date' | 'name' | 'type';
	sortDesc: boolean;
}

export type NewFileLocationMode = 'custom' | 'current';

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
	// 新文件存放位置模式：'custom' 使用指定路径，'current' 使用当前文件所在文件夹
	newFileLocationMode: NewFileLocationMode;
	// Dashboard 状态记忆
	dashboardState: DashboardState;
	// 是否启用外部文件夹挂载（symlink/junction）
	enableExternalMounts: boolean;
	externalMounts: ExternalMount[];
	externalMountLinkType: ExternalMountLinkType;
}

export const DEFAULT_SETTINGS: CodeSpaceSettings = {
	extensions: "py, c, cpp, h, hpp, js, ts, jsx, tsx, json, mjs, cjs, css, scss, sass, less, html, htm, rs, go, java, sql, php, rb, sh, yaml, xml, cs, yml",
	showLineNumbers: true,
	editorFontSize: 18,
	embedFontSize: 15,
	maxEmbedLines: 20, // 默认最大显示 30 行
	newFileFolderPath: '',
	newFileLocationMode: 'custom',
	dashboardState: {
		searchQuery: "",
		filterExt: [],
		filterFolder: [],
		sortBy: "date",
		sortDesc: true
	},
	enableExternalMounts: true,
	externalMounts: [],
	externalMountLinkType: "auto"
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
			.addDropdown((dropdown) => {
				dropdown.addOption('custom', t('SETTINGS_NEW_FILE_LOCATION_MODE_CUSTOM'));
				dropdown.addOption('current', t('SETTINGS_NEW_FILE_LOCATION_MODE_CURRENT'));
				dropdown.setValue(this.plugin.settings.newFileLocationMode);
				dropdown.onChange(async (value) => {
					this.plugin.settings.newFileLocationMode = value as NewFileLocationMode;
					await this.plugin.saveSettings();
					this.display();
				});
			});

		if (this.plugin.settings.newFileLocationMode === 'custom') {
			new Setting(containerEl)
				.setName(t('SETTINGS_NEW_FILE_CUSTOM_PATH_NAME'))
				.setDesc(t('SETTINGS_NEW_FILE_CUSTOM_PATH_DESC'))
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
								this.display();
							}).open();
						});
				});
		}

		const mountManager = new ExternalMountManager(this.app);

		new Setting(containerEl)
			.setHeading()
			.setName(t('SETTINGS_EXTERNAL_MOUNT_NAME'))
			.setDesc(t('SETTINGS_EXTERNAL_MOUNT_DESC'));

		// 外部挂载功能总开关
		new Setting(containerEl)
			.setName(t('SETTINGS_EXTERNAL_MOUNT_ENABLE_NAME'))
			.setDesc(t('SETTINGS_EXTERNAL_MOUNT_ENABLE_DESC'))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableExternalMounts ?? true)
					.onChange(async (value) => {
						const previousState = this.plugin.settings.enableExternalMounts ?? true;
						this.plugin.settings.enableExternalMounts = value;

						// 关闭时自动取消所有挂载，但保留配置
						if (previousState && !value && Platform.isDesktopApp) {
							const mounts = this.plugin.settings.externalMounts ?? [];
							for (const mount of mounts) {
								try {
									await mountManager.removeMount(mount);
								} catch {
									// 忽略错误，继续处理其他挂载
								}
							}
							new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_ALL_REMOVED"));
						}
						// 重新打开时可以重新挂载（可选）
						else if (!previousState && value && Platform.isDesktopApp) {
							const mounts = this.plugin.settings.externalMounts ?? [];
							for (const mount of mounts) {
								try {
									await mountManager.createMount(mount, this.plugin.settings.externalMountLinkType);
								} catch {
									// 忽略错误，继续处理其他挂载
								}
							}
							new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_ALL_RESTORED"));
						}

						await this.plugin.saveSettings();
						this.display();
					})
			);

		// 如果外部挂载功能被禁用，不显示后续设置
		if (!this.plugin.settings.enableExternalMounts) {
			return;
		}

		if (!Platform.isDesktopApp) {
			containerEl.createDiv({
				cls: "setting-item-description",
				text: t("SETTINGS_EXTERNAL_MOUNT_DESKTOP_ONLY")
			});
			return;
		}

		if (Platform.isWin) {
			new Setting(containerEl)
				.setName(t("SETTINGS_EXTERNAL_MOUNT_LINK_TYPE_NAME"))
				.setDesc(t("SETTINGS_EXTERNAL_MOUNT_LINK_TYPE_DESC"))
				.addDropdown((dropdown) => {
					dropdown.addOption("auto", t("SETTINGS_EXTERNAL_MOUNT_LINK_TYPE_AUTO"));
					dropdown.addOption("symlink", t("SETTINGS_EXTERNAL_MOUNT_LINK_TYPE_SYMLINK"));
					dropdown.addOption("junction", t("SETTINGS_EXTERNAL_MOUNT_LINK_TYPE_JUNCTION"));
					dropdown.setValue(this.plugin.settings.externalMountLinkType ?? "auto");
					dropdown.onChange(async (value) => {
						this.plugin.settings.externalMountLinkType = value as ExternalMountLinkType;
						await this.plugin.saveSettings();
					});
				});
		}

		const statusLabels: Record<string, string> = {
			linked: t("SETTINGS_EXTERNAL_MOUNT_STATUS_LINKED"),
			"missing-target": t("SETTINGS_EXTERNAL_MOUNT_STATUS_MISSING"),
			"source-missing": t("SETTINGS_EXTERNAL_MOUNT_STATUS_SOURCE_MISSING"),
			conflict: t("SETTINGS_EXTERNAL_MOUNT_STATUS_CONFLICT"),
			unavailable: t("SETTINGS_EXTERNAL_MOUNT_STATUS_UNAVAILABLE")
		};

		const mounts = this.plugin.settings.externalMounts ?? [];

		if (mounts.length === 0) {
			containerEl.createDiv({
				cls: "setting-item-description",
				text: t("SETTINGS_EXTERNAL_MOUNT_EMPTY")
			});
		}

		const updateStatus = async (setting: Setting, mount: ExternalMount) => {
			const status = await mountManager.getStatus(mount);
			const label = statusLabels[status.state] ?? status.state;
			setting.setDesc(`${mount.sourcePath} • ${label}`);
		};

		mounts.forEach((mount) => {
			const setting = new Setting(containerEl)
				.setName(mount.mountPath)
				.setDesc(mount.sourcePath);

			setting.addButton((button) => {
				button
					.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_RELINK"))
					.onClick(() => {
						void (async () => {
							try {
								await mountManager.relinkMount(mount, this.plugin.settings.externalMountLinkType);
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_RELINKED"));
								this.display();
							} catch (error) {
								new Notice(`${t("SETTINGS_EXTERNAL_MOUNT_NOTICE_FAILED")}: ${String(error)}`);
							}
						})();
					});
			});

			setting.addButton((button) => {
				button
					.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_REMOVE"))
					.setWarning()
					.onClick(() => {
						void (async () => {
							try {
								await mountManager.removeMount(mount);
								this.plugin.settings.externalMounts = this.plugin.settings.externalMounts.filter((item) => item.id !== mount.id);
								await this.plugin.saveSettings();
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_REMOVED"));
								this.display();
							} catch (error) {
								new Notice(`${t("SETTINGS_EXTERNAL_MOUNT_NOTICE_FAILED")}: ${String(error)}`);
							}
						})();
					});
			});

			void updateStatus(setting, mount);
		});

		new Setting(containerEl)
			.addButton((button) => {
				button
					.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_ADD"))
					.setCta()
					.onClick(() => {
						new ExternalMountModal(this.app, (sourcePath, mountPath) => {
							void (async () => {
								const normalizedMountPath = mountManager.normalizeMountPath(mountPath);
								if (!normalizedMountPath) {
									new Notice(t("SETTINGS_EXTERNAL_MOUNT_INVALID"));
									return;
								}
								if (this.plugin.settings.externalMounts.some((item) => item.mountPath === normalizedMountPath)) {
									new Notice(t("SETTINGS_EXTERNAL_MOUNT_DUPLICATE"));
									return;
								}

								const mount: ExternalMount = {
									id: createMountId(),
									sourcePath: sourcePath.trim(),
									mountPath: normalizedMountPath
								};

								try {
									await mountManager.createMount(mount, this.plugin.settings.externalMountLinkType);
									this.plugin.settings.externalMounts.push(mount);
									await this.plugin.saveSettings();
									new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_CREATED"));
									this.display();
								} catch (error) {
									new Notice(`${t("SETTINGS_EXTERNAL_MOUNT_NOTICE_FAILED")}: ${String(error)}`);
								}
							})();
						}).open();
					});
			});
	}
}
