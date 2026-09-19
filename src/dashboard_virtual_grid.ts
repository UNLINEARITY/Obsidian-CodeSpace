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

export interface VirtualGridInput {
	itemCount: number;
	containerWidth: number;
	scrollTop: number;
	viewportHeight: number;
	minCardWidth: number;
	rowHeight: number;
	gap: number;
	overscanRows: number;
}

export interface VirtualGridWindow {
	columns: number;
	totalRows: number;
	startRow: number;
	endRow: number;
	startIndex: number;
	endIndex: number;
	offsetTop: number;
	totalHeight: number;
}

export function calculateVirtualGridWindow(input: VirtualGridInput): VirtualGridWindow {
	const columns = Math.max(1, Math.floor((Math.max(0, input.containerWidth) + input.gap) / (input.minCardWidth + input.gap)));
	const totalRows = Math.ceil(input.itemCount / columns);
	const rowStride = input.rowHeight + input.gap;
	const localScrollTop = Math.max(0, input.scrollTop);
	const firstVisibleRow = Math.min(totalRows, Math.floor(localScrollTop / rowStride));
	const visibleRows = Math.max(1, Math.ceil((input.viewportHeight + (localScrollTop % rowStride)) / rowStride));
	const startRow = Math.max(0, firstVisibleRow - input.overscanRows);
	const endRow = Math.min(totalRows, firstVisibleRow + visibleRows + input.overscanRows);

	return {
		columns,
		totalRows,
		startRow,
		endRow,
		startIndex: Math.min(input.itemCount, startRow * columns),
		endIndex: Math.min(input.itemCount, endRow * columns),
		offsetTop: startRow * rowStride,
		totalHeight: totalRows > 0 ? totalRows * input.rowHeight + (totalRows - 1) * input.gap : 0,
	};
}

interface VirtualGridOptions<T> {
	scrollEl: HTMLElement;
	containerEl: HTMLElement;
	renderItem(parent: HTMLElement, item: T): void;
	renderEmpty(parent: HTMLElement): void;
	onBeforeRender(): void;
}

const MIN_CARD_WIDTH = 320;
const CARD_HEIGHT = 88;
const GRID_GAP = 14;
const OVERSCAN_ROWS = 4;

export class DashboardVirtualGrid<T> {
	private items: T[] = [];
	private windowEl: HTMLElement;
	private resizeObserver: ResizeObserver;
	private animationFrame: number | null = null;
	private lastWindowKey = "";
	private destroyed = false;
	private ownerWindow: Window;
	private scrollHandler: () => void;

	constructor(private options: VirtualGridOptions<T>) {
		this.ownerWindow = options.containerEl.ownerDocument.defaultView ?? activeWindow;
		this.windowEl = options.containerEl.createDiv({ cls: "code-file-list code-file-list-window" });
		this.scrollHandler = () => this.scheduleRender();
		options.scrollEl.addEventListener("scroll", this.scrollHandler, { passive: true });
		this.resizeObserver = new ResizeObserver(() => this.scheduleRender(true));
		this.resizeObserver.observe(options.containerEl);
		this.resizeObserver.observe(options.scrollEl);
	}

	setItems(items: T[], resetScroll: boolean): void {
		this.items = items;
		this.lastWindowKey = "";
		const containerScrollOffset = this.getContainerScrollOffset();
		if (resetScroll && this.options.scrollEl.scrollTop > containerScrollOffset) {
			this.options.scrollEl.scrollTop = containerScrollOffset;
		}
		this.render();
	}

	refresh(): void {
		this.lastWindowKey = "";
		this.render();
	}

	destroy(): void {
		this.destroyed = true;
		this.options.scrollEl.removeEventListener("scroll", this.scrollHandler);
		this.resizeObserver.disconnect();
		if (this.animationFrame !== null) {
			this.ownerWindow.cancelAnimationFrame(this.animationFrame);
			this.animationFrame = null;
		}
		this.options.onBeforeRender();
		this.options.containerEl.empty();
	}

	private scheduleRender(force = false): void {
		if (this.destroyed || this.animationFrame !== null) return;
		if (force) this.lastWindowKey = "";
		this.animationFrame = this.ownerWindow.requestAnimationFrame(() => {
			this.animationFrame = null;
			this.render();
		});
	}

	private render(): void {
		if (this.destroyed) return;
		const { containerEl, scrollEl } = this.options;
		if (this.items.length === 0) {
			const key = "empty";
			if (this.lastWindowKey === key) return;
			this.lastWindowKey = key;
			containerEl.setCssProps({ height: "auto" });
			this.windowEl.addClass("is-empty");
			this.windowEl.empty();
			this.options.onBeforeRender();
			this.options.renderEmpty(this.windowEl);
			return;
		}

		const metrics = calculateVirtualGridWindow({
			itemCount: this.items.length,
			containerWidth: containerEl.clientWidth || scrollEl.clientWidth,
			scrollTop: Math.max(0, scrollEl.scrollTop - this.getContainerScrollOffset()),
			viewportHeight: scrollEl.clientHeight,
			minCardWidth: MIN_CARD_WIDTH,
			rowHeight: CARD_HEIGHT,
			gap: GRID_GAP,
			overscanRows: OVERSCAN_ROWS,
		});
		const key = `${metrics.columns}:${metrics.startIndex}:${metrics.endIndex}:${this.items.length}`;
		containerEl.setCssProps({ height: `${metrics.totalHeight}px` });
		if (this.lastWindowKey === key) return;
		this.lastWindowKey = key;
		this.options.onBeforeRender();
		this.windowEl.empty();
		this.windowEl.removeClass("is-empty");
		this.windowEl.setCssProps({
			"--code-space-virtual-offset": `${metrics.offsetTop}px`,
			"--code-space-virtual-columns": String(metrics.columns),
		});
		for (let index = metrics.startIndex; index < metrics.endIndex; index += 1) {
			const item = this.items[index];
			if (item !== undefined) this.options.renderItem(this.windowEl, item);
		}
	}

	private getContainerScrollOffset(): number {
		const containerRect = this.options.containerEl.getBoundingClientRect();
		const scrollRect = this.options.scrollEl.getBoundingClientRect();
		return containerRect.top - scrollRect.top + this.options.scrollEl.scrollTop;
	}
}
