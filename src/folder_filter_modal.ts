import { App, Modal, TextComponent, ButtonComponent, setIcon } from "obsidian";
import { t } from "./lang/helpers";

export class FolderFilterModal extends Modal {
	private folders: string[];
	private selected: Set<string>;
	private onApply: (values: string[]) => void;
	private searchQuery = "";
	private listEl: HTMLElement | null = null;
	private countEl: HTMLElement | null = null;

	constructor(app: App, folders: string[], selected: string[], onApply: (values: string[]) => void) {
		super(app);
		this.folders = folders;
		this.selected = new Set(selected);
		this.onApply = onApply;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.setTitle(t("FOLDER_FILTER_TITLE"));

		const searchRow = contentEl.createDiv({ cls: "folder-filter-search-row" });
		new TextComponent(searchRow)
			.setPlaceholder(t("FOLDER_FILTER_SEARCH_PLACEHOLDER"))
			.onChange((value) => {
				this.searchQuery = value.toLowerCase();
				this.renderList();
			});

		this.countEl = contentEl.createDiv({ cls: "folder-filter-count" });
		this.listEl = contentEl.createDiv({ cls: "folder-filter-list" });
		this.renderList();

		const buttonContainer = contentEl.createDiv({ cls: "folder-filter-footer" });
		const clearBtn = new ButtonComponent(buttonContainer);
		clearBtn.setButtonText(t("FOLDER_FILTER_CLEAR"));
		clearBtn.onClick(() => {
			this.selected.clear();
			this.renderList();
		});

		const cancelBtn = new ButtonComponent(buttonContainer);
		cancelBtn.setButtonText(t("FOLDER_FILTER_CANCEL"));
		cancelBtn.onClick(() => this.close());

		const applyBtn = new ButtonComponent(buttonContainer);
		applyBtn.setButtonText(t("FOLDER_FILTER_APPLY"));
		applyBtn.setCta();
		applyBtn.onClick(() => {
			this.onApply(Array.from(this.selected));
			this.close();
		});
	}

	private renderList() {
		if (!this.listEl || !this.countEl) return;
		this.listEl.empty();

		const selectedCount = this.selected.size;
		this.countEl.setText(t("FOLDER_FILTER_SELECTED").replace("{0}", String(selectedCount)));

		const query = this.searchQuery.trim();
		const filtered = query
			? this.folders.filter((folder) => folder.toLowerCase().includes(query))
			: this.folders;

		if (filtered.length === 0) {
			this.listEl.createDiv({ cls: "folder-filter-empty", text: t("FOLDER_FILTER_EMPTY") });
			return;
		}

		filtered.forEach((folderPath) => {
			const label = folderPath === "/" ? t("TOOLBAR_FILTER_FOLDER_ROOT") : folderPath;
			const item = this.listEl!.createDiv({ cls: "folder-filter-item" });
			const check = item.createDiv({ cls: "folder-filter-check" });
			setIcon(check, "check");
			item.createDiv({ cls: "folder-filter-text", text: label });
			item.setAttr("title", label);

			if (this.selected.has(folderPath)) {
				item.addClass("is-selected");
			}

			item.addEventListener("click", () => {
				if (this.selected.has(folderPath)) {
					this.selected.delete(folderPath);
					item.removeClass("is-selected");
				} else {
					this.selected.add(folderPath);
					item.addClass("is-selected");
				}
				this.countEl?.setText(t("FOLDER_FILTER_SELECTED").replace("{0}", String(this.selected.size)));
			});
		});
	}
}
