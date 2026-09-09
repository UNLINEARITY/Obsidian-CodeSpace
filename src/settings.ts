import { App, PluginSettingTab, Setting, Plugin, FuzzySuggestModal, TFolder, Notice, Platform, TextComponent, ButtonComponent, Modal, debounce } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";
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

	onChooseItem(folder: TFolder, _evt: MouseEvent | KeyboardEvent): void {
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
	// ===== 终端设置（桌面端） =====
	// 是否启用集成终端
	terminalEnabled: boolean;
	// 自定义 shell 可执行文件路径（空 = 自动检测）
	terminalShell: string;
	// 终端字体大小
	terminalFontSize: number;
	// 每个终端保留的回溯行数
	terminalScrollback: number;
	// 最大并发终端会话数
	terminalMaxSessions: number;
	ignoredFiles: string[];
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
	externalMountLinkType: "auto",
	terminalEnabled: false,
	terminalShell: "",
	terminalFontSize: 14,
	terminalScrollback: 2000,
	terminalMaxSessions: 8,
	ignoredFiles: []
};

export function normalizeCodeSpaceSettings(value: unknown): CodeSpaceSettings {
	const raw = value && typeof value === "object" ? value as Partial<CodeSpaceSettings> : {};
	const dashboard = raw.dashboardState && typeof raw.dashboardState === "object"
		? raw.dashboardState as Partial<DashboardState>
		: {};
	const externalMounts = Array.isArray(raw.externalMounts)
		? raw.externalMounts.filter((mount): mount is ExternalMount => Boolean(
			mount &&
			typeof mount.id === "string" &&
			typeof mount.sourcePath === "string" &&
			typeof mount.mountPath === "string"
		)).map((mount) => ({
			id: mount.id,
			sourcePath: mount.sourcePath.trim(),
			mountPath: mount.mountPath.trim(),
		}))
		: [];

	const numberInRange = (candidate: unknown, fallback: number, minimum: number, maximum = Number.POSITIVE_INFINITY) =>
		typeof candidate === "number" && Number.isFinite(candidate)
			? Math.min(maximum, Math.max(minimum, candidate))
			: fallback;

	return {
		extensions: typeof raw.extensions === "string" && raw.extensions.trim() ? raw.extensions : DEFAULT_SETTINGS.extensions,
		showLineNumbers: typeof raw.showLineNumbers === "boolean" ? raw.showLineNumbers : DEFAULT_SETTINGS.showLineNumbers,
		editorFontSize: numberInRange(raw.editorFontSize, DEFAULT_SETTINGS.editorFontSize, 9, 36),
		embedFontSize: numberInRange(raw.embedFontSize, DEFAULT_SETTINGS.embedFontSize, 9, 36),
		maxEmbedLines: numberInRange(raw.maxEmbedLines, DEFAULT_SETTINGS.maxEmbedLines, 0),
		newFileFolderPath: typeof raw.newFileFolderPath === "string" ? raw.newFileFolderPath : "",
		newFileLocationMode: raw.newFileLocationMode === "current" ? "current" : "custom",
		dashboardState: {
			searchQuery: typeof dashboard.searchQuery === "string" ? dashboard.searchQuery : "",
			filterExt: Array.isArray(dashboard.filterExt) ? dashboard.filterExt.filter((item): item is string => typeof item === "string") : [],
			filterFolder: Array.isArray(dashboard.filterFolder) ? dashboard.filterFolder.filter((item): item is string => typeof item === "string") : [],
			sortBy: dashboard.sortBy === "name" || dashboard.sortBy === "type" ? dashboard.sortBy : "date",
			sortDesc: typeof dashboard.sortDesc === "boolean" ? dashboard.sortDesc : true,
		},
		enableExternalMounts: typeof raw.enableExternalMounts === "boolean" ? raw.enableExternalMounts : DEFAULT_SETTINGS.enableExternalMounts,
		externalMounts,
		externalMountLinkType: raw.externalMountLinkType === "symlink" || raw.externalMountLinkType === "junction"
			? raw.externalMountLinkType
			: "auto",
		terminalEnabled: typeof raw.terminalEnabled === "boolean" ? raw.terminalEnabled : DEFAULT_SETTINGS.terminalEnabled,
		terminalShell: typeof raw.terminalShell === "string" ? raw.terminalShell.trim() : "",
		terminalFontSize: numberInRange(raw.terminalFontSize, DEFAULT_SETTINGS.terminalFontSize, 9, 36),
		terminalScrollback: numberInRange(raw.terminalScrollback, DEFAULT_SETTINGS.terminalScrollback, 100, 100000),
		terminalMaxSessions: numberInRange(raw.terminalMaxSessions, DEFAULT_SETTINGS.terminalMaxSessions, 1, 32),
		ignoredFiles: Array.isArray(raw.ignoredFiles) ? raw.ignoredFiles.filter((item): item is string => typeof item === "string") : [],
	};
}

export class CodeSpaceSettingTab extends PluginSettingTab {
	plugin: CodeSpacePlugin;
	private pendingTextSaves: Array<{ run(): unknown; cancel(): unknown }> = [];

	constructor(app: App, plugin: Plugin) {
		super(app, plugin);
		this.plugin = plugin as CodeSpacePlugin;
	}

	// Returning an empty definition list keeps the imperative display() fallback
	// for Obsidian versions below 1.13 while satisfying the declarative settings
	// API contract introduced in 1.13.
	getSettingDefinitions(): SettingDefinitionItem[] {
		return [];
	}

	private refreshSettingsView(): void {
		const legacyDisplay = Reflect.get(this, "display");
		if (typeof legacyDisplay === "function") {
			Reflect.apply(legacyDisplay, this, []);
		}
	}

	display(): void {
		this.flushPendingTextSaves();
		const { containerEl } = this;
		containerEl.empty();

		const saveExtensions = this.createDebouncedSave(() => this.plugin.saveSettings("extensions"));
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
					.onChange((value) => {
						this.plugin.settings.extensions = value;
						saveExtensions();
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
						await this.plugin.saveSettings("editor");
					})
			);

		const saveEditorFontSize = this.createDebouncedSave(() => this.plugin.saveSettings("editor"));
		new Setting(containerEl)
			.setName(t('SETTINGS_EDITOR_FONT_SIZE_NAME'))
			.setDesc(t('SETTINGS_EDITOR_FONT_SIZE_DESC'))
			.addText((text) =>
				text
					.setPlaceholder("16")
					.setValue(String(this.plugin.settings.editorFontSize))
					.onChange((value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 9 && num <= 36) {
							this.plugin.settings.editorFontSize = num;
							saveEditorFontSize();
						}
					})
			);

		const saveEmbedFontSize = this.createDebouncedSave(() => this.plugin.saveSettings("embed"));
		new Setting(containerEl)
			.setName(t('SETTINGS_EMBED_FONT_SIZE_NAME'))
			.setDesc(t('SETTINGS_EMBED_FONT_SIZE_DESC'))
			.addText((text) =>
				text
					.setPlaceholder("13")
					.setValue(String(this.plugin.settings.embedFontSize))
					.onChange((value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 9 && num <= 36) {
							this.plugin.settings.embedFontSize = num;
							saveEmbedFontSize();
						}
					})
			);

		const saveMaxEmbedLines = this.createDebouncedSave(() => this.plugin.saveSettings("embed"));
		new Setting(containerEl)
			.setName(t('SETTINGS_MAX_EMBED_LINES_NAME'))
			.setDesc(t('SETTINGS_MAX_EMBED_LINES_DESC'))
			.addText((text) =>
				text
					.setPlaceholder(t('SETTINGS_MAX_EMBED_LINES_PLACEHOLDER'))
					.setValue(String(this.plugin.settings.maxEmbedLines))
					.onChange((value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 0) {
							this.plugin.settings.maxEmbedLines = num;
							saveMaxEmbedLines();
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
					await this.plugin.saveSettings("none");
					this.refreshSettingsView();
				});
			});

		const saveNewFileFolderPath = this.createDebouncedSave(() => this.plugin.saveSettings("none"));
		if (this.plugin.settings.newFileLocationMode === 'custom') {
			new Setting(containerEl)
				.setName(t('SETTINGS_NEW_FILE_CUSTOM_PATH_NAME'))
				.setDesc(t('SETTINGS_NEW_FILE_CUSTOM_PATH_DESC'))
				.addText((text) => {
					text
						.setPlaceholder(t('SETTINGS_NEW_FILE_FOLDER_PLACEHOLDER'))
						.setValue(this.plugin.settings.newFileFolderPath)
						.onChange((value) => {
							this.plugin.settings.newFileFolderPath = value;
							saveNewFileFolderPath();
						});
				})
				.addButton((button) => {
					button
						.setButtonText(t('SETTINGS_NEW_FILE_LOCATION_BUTTON'))
						.onClick(() => {
							new FolderSuggestModal(this.app, (folder) => {
								this.plugin.settings.newFileFolderPath = folder.path;
								void this.plugin.saveSettings("none");
										this.refreshSettingsView();
							}).open();
						});
				});
		}

		// ===== 终端设置（桌面端） =====
		new Setting(containerEl)
			.setHeading()
			.setName(t('SETTINGS_TERMINAL_NAME'))
			.setDesc(t('SETTINGS_TERMINAL_DESC'));

		if (!Platform.isDesktopApp) {
			containerEl.createDiv({
				cls: "setting-item-description",
				text: t("SETTINGS_TERMINAL_DESKTOP_ONLY")
			});
		} else {
			this.renderTerminalSettings(containerEl);
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
						let failedMounts = 0;

						// 关闭时自动取消所有挂载，但保留配置
						if (previousState && !value && Platform.isDesktopApp) {
							const mounts = this.plugin.settings.externalMounts ?? [];
							for (const mount of mounts) {
								try {
									await mountManager.removeMount(mount);
								} catch {
									failedMounts += 1;
								}
							}
							if (failedMounts > 0) {
								this.plugin.settings.enableExternalMounts = true;
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_REMOVE_PARTIAL").replace("{0}", String(failedMounts)));
							} else {
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_ALL_REMOVED"));
							}
						}
						// 重新打开时可以重新挂载（可选）
						else if (!previousState && value && Platform.isDesktopApp) {
							const mounts = this.plugin.settings.externalMounts ?? [];
							for (const mount of mounts) {
								try {
									await mountManager.createMount(mount, this.plugin.settings.externalMountLinkType);
								} catch {
									failedMounts += 1;
								}
							}
							if (failedMounts > 0) {
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_RESTORE_PARTIAL").replace("{0}", String(failedMounts)));
							} else {
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_ALL_RESTORED"));
							}
						}

						await this.plugin.saveSettings("dashboard");
						this.refreshSettingsView();
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
						await this.plugin.saveSettings("none");
					});
				});
		}

		const statusLabels: Record<string, string> = {
			linked: t("SETTINGS_EXTERNAL_MOUNT_STATUS_LINKED"),
			"missing-target": t("SETTINGS_EXTERNAL_MOUNT_STATUS_MISSING"),
			"source-missing": t("SETTINGS_EXTERNAL_MOUNT_STATUS_SOURCE_MISSING"),
			conflict: t("SETTINGS_EXTERNAL_MOUNT_STATUS_CONFLICT"),
			"mismatched-target": t("SETTINGS_EXTERNAL_MOUNT_STATUS_MISMATCHED"),
			"unsafe-path": t("SETTINGS_EXTERNAL_MOUNT_STATUS_UNSAFE"),
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
										this.refreshSettingsView();
							} catch (error) {
								new Notice(`${t("SETTINGS_EXTERNAL_MOUNT_NOTICE_FAILED")}: ${String(error)}`);
							}
						})();
					});
			});

			setting.addButton((button) => {
				button
					.setButtonText(t("SETTINGS_EXTERNAL_MOUNT_REMOVE"))
					.setClass("mod-warning")
					.onClick(() => {
						void (async () => {
							try {
								await mountManager.removeMount(mount);
								this.plugin.settings.externalMounts = this.plugin.settings.externalMounts.filter((item) => item.id !== mount.id);
								await this.plugin.saveSettings("dashboard");
								new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_REMOVED"));
										this.refreshSettingsView();
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
								const normalizedMountKey = Platform.isWin ? normalizedMountPath.toLowerCase() : normalizedMountPath;
								if (this.plugin.settings.externalMounts.some((item) => {
									const existingPath = mountManager.normalizeMountPath(item.mountPath);
									const existingKey = Platform.isWin ? existingPath.toLowerCase() : existingPath;
									return existingKey === normalizedMountKey;
								})) {
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
									await this.plugin.saveSettings("dashboard");
									new Notice(t("SETTINGS_EXTERNAL_MOUNT_NOTICE_CREATED"));
											this.refreshSettingsView();
								} catch (error) {
									new Notice(`${t("SETTINGS_EXTERNAL_MOUNT_NOTICE_FAILED")}: ${String(error)}`);
								}
							})();
						}).open();
					});
			});
	}

	// 终端设置控件（仅在桌面端调用）
	// 顺序：启用开关 → 支持文件（显式下载/移除）→ 就绪后才显示其余细项
	private renderTerminalSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t('SETTINGS_TERMINAL_ENABLE_NAME'))
			.setDesc(t('SETTINGS_TERMINAL_ENABLE_DESC'))
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.terminalEnabled)
					.onChange(async (value) => {
						this.plugin.settings.terminalEnabled = value;
						// scope "editor" 触发所有编辑器视图 refreshSettings，同步头部按钮显隐
						await this.plugin.saveSettings("editor");
						// 重渲染设置页：关闭时折叠细项、开启时展开
						this.refreshSettingsView();
					});
			});

		// 关闭时折叠全部细项，避免占用设置页空间
		if (!this.plugin.settings.terminalEnabled) {
			return;
		}

		const terminalManager = this.plugin.terminalManager;
		if (!terminalManager) {
			return;
		}
		const binaryManager = terminalManager.binaryManager;
		const statusLabels: Record<string, string> = {
			"not-installed": t("SETTINGS_TERMINAL_STATUS_NOT_INSTALLED"),
			"checking": t("SETTINGS_TERMINAL_STATUS_CHECKING"),
			"downloading": t("SETTINGS_TERMINAL_STATUS_DOWNLOADING"),
			"ready": t("SETTINGS_TERMINAL_STATUS_READY"),
			"error": t("SETTINGS_TERMINAL_STATUS_ERROR"),
			"unsupported": t("SETTINGS_TERMINAL_STATUS_UNSUPPORTED"),
			"remove-pending": t("SETTINGS_TERMINAL_STATUS_REMOVE_PENDING")
		};
		const binaryStatus = binaryManager.refreshStatus();

		const binarySetting = new Setting(containerEl)
			.setName(t('SETTINGS_TERMINAL_BINARY_STATUS'))
			.setDesc(statusLabels[binaryStatus] ?? binaryStatus);

		if (binaryStatus === "ready") {
			// 已就绪：提供移除
			binarySetting.addButton((button) => {
				button
					.setButtonText(t('SETTINGS_TERMINAL_BINARY_CLEAR'))
					.onClick(() => {
						void (async () => {
							try {
								const result = await binaryManager.clearInstalled();
								if (result.pendingRestart) {
									new Notice(t('TERMINAL_NOTICE_REMOVE_PENDING'), 6000);
								} else {
									new Notice(t('TERMINAL_NOTICE_BINARIES_CLEARED'));
								}
							} catch (error) {
								new Notice(`${t("TERMINAL_NOTICE_DOWNLOAD_FAIL")}: ${String(error instanceof Error ? error.message : error)}`, 6000);
							}
							// 状态变化影响细项显隐与命令入口，重渲染设置页并同步编辑器按钮
							await this.plugin.saveSettings("editor");
							this.refreshSettingsView();
						})();
					});
			});
		} else if (binaryStatus === "not-installed" || binaryStatus === "error") {
			// 未下载：显式下载（终端按钮/命令不会自动触发）
			binarySetting.addButton((button) => {
				button
					.setButtonText(t('SETTINGS_TERMINAL_BINARY_DOWNLOAD'))
					.onClick(() => {
						void (async () => {
							binarySetting.setDesc(t('SETTINGS_TERMINAL_STATUS_DOWNLOADING'));
							try {
								await binaryManager.ensureInstalled((stage) => {
									if (stage === "downloading") {
										new Notice(t('TERMINAL_NOTICE_DOWNLOADING'));
									}
								});
								new Notice(t('TERMINAL_NOTICE_DOWNLOAD_SUCCESS'));
							} catch (error) {
								console.error("Code Space: terminal binary installation failed:", error);
								new Notice(`${t("TERMINAL_NOTICE_DOWNLOAD_FAIL")}: ${String(error instanceof Error ? error.message : error)}`, 6000);
							}
							// 就绪后细项与命令入口才出现
							await this.plugin.saveSettings("editor");
							this.refreshSettingsView();
						})();
					});
			});
		}
		// remove-pending / unsupported / downloading：不提供按钮（等待重启或平台不支持）

		// 支持文件就绪后才显示其余终端设置
		if (binaryStatus !== "ready") {
			return;
		}

		const clampInt = (value: string, fallback: number, minimum: number, maximum: number): number => {
			const parsed = Number.parseInt(value, 10);
			if (!Number.isFinite(parsed)) {
				return fallback;
			}
			return Math.min(maximum, Math.max(minimum, parsed));
		};
		const saveTerminalText = this.createDebouncedSave(() => this.plugin.saveSettings("terminal"));

		new Setting(containerEl)
			.setName(t('SETTINGS_TERMINAL_SHELL_NAME'))
			.setDesc(t('SETTINGS_TERMINAL_SHELL_DESC'))
			.addText((text) => {
				text
					.setPlaceholder(t('SETTINGS_TERMINAL_SHELL_PLACEHOLDER'))
					.setValue(this.plugin.settings.terminalShell)
					.onChange((value) => {
						this.plugin.settings.terminalShell = value;
						saveTerminalText();
					});
			});

		new Setting(containerEl)
			.setName(t('SETTINGS_TERMINAL_FONT_SIZE_NAME'))
			.setDesc(t('SETTINGS_TERMINAL_FONT_SIZE_DESC'))
			.addText((text) => {
				text
					.setPlaceholder("14")
					.setValue(String(this.plugin.settings.terminalFontSize))
					.onChange((value) => {
						this.plugin.settings.terminalFontSize = clampInt(value, this.plugin.settings.terminalFontSize, 9, 36);
						saveTerminalText();
					});
			});

		new Setting(containerEl)
			.setName(t('SETTINGS_TERMINAL_SCROLLBACK_NAME'))
			.setDesc(t('SETTINGS_TERMINAL_SCROLLBACK_DESC'))
			.addText((text) => {
				text
					.setPlaceholder("2000")
					.setValue(String(this.plugin.settings.terminalScrollback))
					.onChange((value) => {
						this.plugin.settings.terminalScrollback = clampInt(value, this.plugin.settings.terminalScrollback, 100, 100000);
						saveTerminalText();
					});
			});

		new Setting(containerEl)
			.setName(t('SETTINGS_TERMINAL_MAX_SESSIONS_NAME'))
			.setDesc(t('SETTINGS_TERMINAL_MAX_SESSIONS_DESC'))
			.addText((text) => {
				text
					.setPlaceholder("8")
					.setValue(String(this.plugin.settings.terminalMaxSessions))
					.onChange((value) => {
						this.plugin.settings.terminalMaxSessions = clampInt(value, this.plugin.settings.terminalMaxSessions, 1, 32);
						saveTerminalText();
					});
			});
	}

	hide(): void {
		this.flushPendingTextSaves();
		super.hide();
	}

	private createDebouncedSave(save: () => Promise<void>) {
		const debouncedSave = debounce(save, 300, true);
		this.pendingTextSaves.push(debouncedSave);
		return debouncedSave;
	}

	private flushPendingTextSaves(): void {
		for (const save of this.pendingTextSaves) {
			save.run();
			save.cancel();
		}
		this.pendingTextSaves = [];
	}
}
