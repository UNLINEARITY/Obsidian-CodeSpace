import { setIcon } from "obsidian";

export class CustomDropdown {
	private containerEl: HTMLElement;
	private selectEl: HTMLElement;
	private dropdownEl: HTMLElement | null = null;
	private selectedValue: string = "";
	private options: Map<string, string> = new Map();
	private onChangeCallback: ((value: string) => void) | null = null;
	private isOpen: boolean = false;

	constructor(container: HTMLElement) {
		this.containerEl = container;
		this.render();
		this.attachEvents();
	}

	private render() {
		// Create select button
		this.selectEl = this.containerEl.createDiv({ cls: "custom-dropdown-select" });
		this.selectEl.createDiv({ cls: "custom-dropdown-label" });
		const arrow = this.selectEl.createDiv({ cls: "custom-dropdown-arrow" });
		setIcon(arrow, "chevron-down");
	}

	private attachEvents() {
		this.selectEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.toggle();
		});

		document.addEventListener("click", (e) => {
			if (this.isOpen && !this.containerEl.contains(e.target as Node)) {
				this.close();
			}
		});
	}

	addOption(value: string, label: string) {
		this.options.set(value, label);
		if (this.selectedValue === "") {
			this.setValue(value);
		}
		if (this.dropdownEl) {
			this.renderDropdown();
		}
	}

	setValue(value: string) {
		if (!this.options.has(value)) return;

		this.selectedValue = value;
		const label = this.options.get(value);

		const labelEl = this.selectEl.querySelector(".custom-dropdown-label") as HTMLElement;
		if (labelEl) {
			labelEl.textContent = label || "";
		}

		if (this.dropdownEl) {
			const items = this.dropdownEl.querySelectorAll(".custom-dropdown-item");
			items.forEach(item => {
				const itemElement = item as HTMLElement;
				const itemValue = itemElement.dataset.value;
				if (itemValue === value) {
					item.addClass("is-selected");
				} else {
					item.removeClass("is-selected");
				}
			});
		}
	}

	getValue(): string {
		return this.selectedValue;
	}

	private toggle() {
		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	private open() {
		if (this.isOpen) return;
		this.isOpen = true;
		this.selectEl.addClass("is-open");

		if (!this.dropdownEl) {
			this.dropdownEl = this.containerEl.createDiv({ cls: "custom-dropdown-menu" });
			this.renderDropdown();
		}

		this.dropdownEl.removeClass("is-hidden");
	}

	private close() {
		if (!this.isOpen) return;
		this.isOpen = false;
		this.selectEl.removeClass("is-open");

		if (this.dropdownEl) {
			this.dropdownEl.addClass("is-hidden");
		}
	}

	private renderDropdown() {
		if (!this.dropdownEl) return;

		this.dropdownEl.empty();

		this.options.forEach((label, value) => {
			const item = this.dropdownEl!.createDiv({ cls: "custom-dropdown-item" });
			item.textContent = label;
			const itemElement = item as HTMLElement;
			itemElement.dataset.value = value;

			if (value === this.selectedValue) {
				item.addClass("is-selected");
			}

			item.addEventListener("click", (e) => {
				e.stopPropagation();
				this.setValue(value);
				this.close();
				if (this.onChangeCallback) {
					this.onChangeCallback(value);
				}
			});
		});
	}

	onChange(callback: (value: string) => void) {
		this.onChangeCallback = callback;
	}
}
