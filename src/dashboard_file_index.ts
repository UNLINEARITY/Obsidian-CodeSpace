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

import type { TFile } from "obsidian";

export type DashboardSortBy = "date" | "name" | "type";

export interface DashboardFilterState {
	searchQuery: string;
	filterExt: string[];
	filterFolder: string[];
	sortBy: DashboardSortBy;
	sortDesc: boolean;
}

export interface DashboardFileRecord {
	file: TFile;
	path: string;
	name: string;
	lowerPath: string;
	lowerName: string;
	extension: string;
	folderPath: string;
	mtime: number;
	isExternal: boolean;
}

export interface DashboardIndexOptions {
	extensions: Iterable<string>;
	ignoredPaths: Iterable<string>;
	externalMountPaths: Iterable<string>;
}

export class DashboardFileIndex {
	private records = new Map<string, DashboardFileRecord>();
	private extensions = new Set<string>();
	private ignoredPaths: string[] = [];
	private externalMountPaths: string[] = [];
	private collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

	constructor(options: DashboardIndexOptions) {
		this.setOptions(options);
	}

	setOptions(options: DashboardIndexOptions): void {
		this.extensions = new Set(Array.from(options.extensions, (extension) => extension.trim().toLowerCase()).filter(Boolean));
		this.ignoredPaths = Array.from(options.ignoredPaths, normalizePath).filter(Boolean);
		this.externalMountPaths = Array.from(options.externalMountPaths, normalizePath).filter(Boolean);
	}

	rebuild(files: TFile[]): void {
		this.records.clear();
		for (const file of files) {
			this.upsert(file);
		}
	}

	upsert(file: TFile): DashboardFileRecord | null {
		if (!this.isManaged(file)) {
			this.records.delete(file.path);
			return null;
		}

		const existing = this.records.get(file.path);
		const record = existing ?? createRecord(file, this.isExternalPath(file.path));
		record.file = file;
		record.path = file.path;
		record.name = file.name;
		record.lowerPath = file.path.toLowerCase();
		record.lowerName = file.name.toLowerCase();
		record.extension = file.extension.toLowerCase();
		record.folderPath = file.parent?.path ?? "/";
		record.mtime = file.stat.mtime;
		record.isExternal = this.isExternalPath(file.path);
		this.records.set(file.path, record);
		return record;
	}

	remove(path: string): void {
		this.records.delete(path);
	}

	removePrefix(path: string): void {
		const normalized = normalizePath(path);
		for (const recordPath of Array.from(this.records.keys())) {
			if (recordPath === normalized || recordPath.startsWith(`${normalized}/`)) {
				this.records.delete(recordPath);
			}
		}
	}

	get size(): number {
		return this.records.size;
	}

	getExtensions(): string[] {
		return Array.from(new Set(Array.from(this.records.values(), (record) => record.extension)))
			.sort((first, second) => this.collator.compare(first, second));
	}

	getFolders(): string[] {
		return Array.from(new Set(Array.from(this.records.values(), (record) => record.folderPath)))
			.sort((first, second) => this.collator.compare(first, second));
	}

	derive(state: DashboardFilterState): DashboardFileRecord[] {
		const query = state.searchQuery.trim().toLowerCase();
		const folderFilters = new Set(state.filterFolder);
		const extensionFilters = new Set(state.filterExt);
		const records = Array.from(this.records.values()).filter((record) => {
			if (query && !record.lowerName.includes(query) && !record.lowerPath.includes(query)) return false;
			if (folderFilters.size > 0 && !folderFilters.has(record.folderPath)) return false;
			if (extensionFilters.size > 0 && !extensionFilters.has(record.extension)) return false;
			return true;
		});
		records.sort((first, second) => this.compare(first, second, state));
		return records;
	}

	matches(record: DashboardFileRecord, state: DashboardFilterState): boolean {
		const query = state.searchQuery.trim().toLowerCase();
		if (query && !record.lowerName.includes(query) && !record.lowerPath.includes(query)) return false;
		if (state.filterFolder.length > 0 && !state.filterFolder.includes(record.folderPath)) return false;
		if (state.filterExt.length > 0 && !state.filterExt.includes(record.extension)) return false;
		return true;
	}

	reposition(
		visibleRecords: DashboardFileRecord[],
		record: DashboardFileRecord,
		state: DashboardFilterState,
	): DashboardFileRecord[] {
		const currentIndex = visibleRecords.findIndex((candidate) => candidate.path === record.path);
		if (currentIndex === -1 || !this.matches(record, state)) return visibleRecords;

		const next = visibleRecords.slice();
		next.splice(currentIndex, 1);
		let low = 0;
		let high = next.length;
		while (low < high) {
			const middle = (low + high) >>> 1;
			const candidate = next[middle];
			if (candidate && this.compare(candidate, record, state) <= 0) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}
		next.splice(low, 0, record);
		return next;
	}

	private isManaged(file: TFile): boolean {
		return this.extensions.has(file.extension.toLowerCase()) && !this.isIgnoredPath(file.path);
	}

	private isIgnoredPath(path: string): boolean {
		const normalized = normalizePath(path);
		return this.ignoredPaths.some((ignoredPath) =>
			normalized === ignoredPath || normalized.startsWith(`${ignoredPath}/`)
		);
	}

	private isExternalPath(path: string): boolean {
		const normalized = normalizePath(path);
		return this.externalMountPaths.some((mountPath) =>
			normalized === mountPath || normalized.startsWith(`${mountPath}/`)
		);
	}

	private compare(first: DashboardFileRecord, second: DashboardFileRecord, state: DashboardFilterState): number {
		let result = 0;
		switch (state.sortBy) {
			case "name":
				result = this.collator.compare(first.name, second.name);
				break;
			case "type":
				result = this.collator.compare(first.extension, second.extension) || this.collator.compare(first.name, second.name);
				break;
			case "date":
				result = first.mtime - second.mtime;
				break;
		}
		if (result === 0) result = this.collator.compare(first.path, second.path);
		return state.sortDesc ? -result : result;
	}
}

function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

function createRecord(file: TFile, isExternal: boolean): DashboardFileRecord {
	return {
		file,
		path: file.path,
		name: file.name,
		lowerPath: file.path.toLowerCase(),
		lowerName: file.name.toLowerCase(),
		extension: file.extension.toLowerCase(),
		folderPath: file.parent?.path ?? "/",
		mtime: file.stat.mtime,
		isExternal,
	};
}
