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

export class FileSystemAdapter {}

export const Platform = {
	isDesktopApp: true,
	isMobileApp: false,
	isWin: process.platform === "win32",
	isMacOS: process.platform === "darwin",
	isLinux: process.platform === "linux",
};

export function normalizePath(value: string): string {
	return value.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

export class Notice {
	constructor(
		public message: string | DocumentFragment,
		public timeout?: number
	) {}
}

export interface RequestUrlResponse {
	text: string;
	arrayBuffer: ArrayBuffer;
}

export async function requestUrl(): Promise<RequestUrlResponse> {
	throw new Error("requestUrl is not available in tests; inject a fake BinaryIo instead");
}

// ---- 以下为 settings.ts 等模块在模块加载期 extends/new 所需的最小桩 ----

export class Modal {}

export class FuzzySuggestModal<_T = unknown> {
	app?: unknown;
	items?: _T[];
	constructor(app?: unknown) {
		this.app = app;
	}
}

export class SuggestModal<T> extends FuzzySuggestModal<T> {}

export class PluginSettingTab {
	app: unknown;
	constructor(app: unknown) {
		this.app = app;
	}
	hide(): void { /* noop */ }
	display(): void { /* noop */ }
}

export class Setting {
	constructor(public containerEl?: unknown) {}
	setName(): this { return this; }
	setDesc(): this { return this; }
	setHeading(): this { return this; }
	setClass(): this { return this; }
	setTooltip(): this { return this; }
	addText(): this { return this; }
	addToggle(): this { return this; }
	addDropdown(): this { return this; }
	addButton(): this { return this; }
	addExtraButton(): this { return this; }
}

export class TextComponent {
	inputEl = { addClass(): void { /* noop */ } } as unknown as HTMLInputElement;
	setPlaceholder(): this { return this; }
	setValue(): this { return this; }
	onChange(): this { return this; }
}

export class ButtonComponent {
	setButtonText(): this { return this; }
	setCta(): this { return this; }
	setTooltip(): this { return this; }
	setClass(): this { return this; }
	onClick(): this { return this; }
}

export function debounce<T extends (...args: never[]) => unknown>(callback: T): T & { cancel(): void; run(): void } {
	const debounced = ((...args: never[]) => callback(...args)) as T & { cancel(): void; run(): void };
	debounced.cancel = (): void => { /* noop */ };
	debounced.run = (): void => { /* noop */ };
	return debounced;
}

export function setIcon(): void { /* noop */ }
