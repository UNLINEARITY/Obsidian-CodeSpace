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

import { App, ButtonComponent, Modal, Notice, TFile } from "obsidian";
import CodeSpacePlugin from "./main";
import { t } from "./lang/helpers";

export class IgnoreManagerModal extends Modal {
	private plugin: CodeSpacePlugin;

	constructor(app: App, plugin: CodeSpacePlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen(): void {
		this.contentEl.addClass("ignore-manager-modal");
		this.setTitle(t("IGNORE_MANAGER_TITLE"));
		this.render();
	}

	onClose(): void {
		this.contentEl.removeClass("ignore-manager-modal");
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		const ignoredFiles = this.plugin.getIgnoredFiles();
		if (ignoredFiles.length === 0) {
			contentEl.createDiv({
				cls: "ignore-manager-empty",
				text: t("IGNORE_MANAGER_EMPTY")
			});
			return;
		}

		const listEl = contentEl.createDiv({ cls: "ignore-manager-list" });
		for (const path of ignoredFiles) {
			const ignoredFile = this.app.vault.getAbstractFileByPath(path);
			const itemEl = listEl.createDiv({ cls: "ignore-manager-item" });
			const infoEl = itemEl.createDiv({ cls: "ignore-manager-info" });
			infoEl.createDiv({
				cls: "ignore-manager-name",
				text: this.getFileName(path)
			});
			infoEl.createDiv({
				cls: "ignore-manager-path",
				text: this.getParentPath(path)
			});

			const actionsEl = itemEl.createDiv({ cls: "ignore-manager-actions" });
			if (ignoredFile instanceof TFile) {
				new ButtonComponent(actionsEl)
					.setButtonText(t("IGNORE_MANAGER_OPEN"))
					.setClass("ignore-manager-open-button")
					.onClick(() => {
						void this.openIgnoredFile(path);
					});
			}

			new ButtonComponent(actionsEl)
				.setButtonText(t("IGNORE_MANAGER_REMOVE"))
				.setClass("ignore-manager-remove-button")
				.onClick(() => {
					void this.removeIgnoredFile(path);
				});
		}
	}

	private async openIgnoredFile(path: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			new Notice(t("NOTICE_OPEN_FAIL"));
			await this.plugin.pruneIgnoredFiles();
			this.render();
			return;
		}

		await this.plugin.openManagedFile(file);
		this.close();
	}

	private async removeIgnoredFile(path: string): Promise<void> {
		const changed = await this.plugin.unignoreFile(path);
		if (!changed) {
			return;
		}

		new Notice(t("NOTICE_UNIGNORE_SUCCESS"));
		this.render();
	}

	private getFileName(path: string): string {
		const segments = path.split("/");
		return segments[segments.length - 1] ?? path;
	}

	private getParentPath(path: string): string {
		const index = path.lastIndexOf("/");
		if (index === -1) {
			return "/";
		}

		const parentPath = path.slice(0, index);
		return parentPath || "/";
	}
}
