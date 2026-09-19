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

import { App, FileSystemAdapter, Platform, normalizePath } from "obsidian";

type FsPromises = {
	stat(path: string): Promise<FsStats>;
	lstat(path: string): Promise<FsStats>;
	realpath(path: string): Promise<string>;
	readlink(path: string): Promise<string>;
	mkdir(path: string, options: { recursive: boolean }): Promise<void>;
	symlink(target: string, path: string, type?: SymlinkType): Promise<void>;
	unlink(path: string): Promise<void>;
};

type PathModule = {
	join(...parts: string[]): string;
	dirname(path: string): string;
	basename(path: string): string;
	isAbsolute(path: string): boolean;
	relative(from: string, to: string): string;
	resolve(...parts: string[]): string;
};
type FsStats = {
	isDirectory(): boolean;
	isSymbolicLink(): boolean;
};

let fsPromisesCache: FsPromises | null = null;
let pathModuleCache: PathModule | null = null;

function getNodeModule<T>(name: string): T {
	const requireFn = (window as Window & { require?: (module: string) => unknown }).require;
	if (!requireFn) {
		throw new Error("Node modules unavailable");
	}
	return requireFn(name) as T;
}

function getFs(): FsPromises {
	if (!fsPromisesCache) {
		fsPromisesCache = getNodeModule<FsPromises>("fs/promises");
	}
	return fsPromisesCache;
}

function getPath(): PathModule {
	if (!pathModuleCache) {
		pathModuleCache = getNodeModule<PathModule>("path");
	}
	return pathModuleCache;
}

export interface ExternalMount {
	id: string;
	sourcePath: string;
	mountPath: string;
}

export type ExternalMountLinkType = "auto" | "symlink" | "junction";

export type ExternalMountStatusState =
	| "linked"
	| "missing-target"
	| "source-missing"
	| "conflict"
	| "mismatched-target"
	| "unsafe-path"
	| "unavailable";

export interface ExternalMountStatus {
	state: ExternalMountStatusState;
	detail?: string;
}

type SymlinkType = "file" | "dir" | "junction";

export class ExternalMountManager {
	constructor(private app: App) {}

	isDesktop(): boolean {
		return Platform.isDesktopApp;
	}

	getVaultBasePath(): string {
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getBasePath();
		}
		const basePath = (adapter as { getBasePath?: () => string }).getBasePath?.();
		if (basePath) {
			return basePath;
		}
		throw new Error("Vault base path unavailable");
	}

	normalizeMountPath(input: string): string {
		const trimmed = input.trim();
		if (!trimmed) {
			return "";
		}
		return normalizePath(trimmed).replace(/^\/+/, "").replace(/\/+$/, "");
	}

	validateMountPath(mountPath: string): void {
		const pathModule = getPath();
		if (!mountPath) {
			throw new Error("Mount path is required");
		}
		if (pathModule.isAbsolute(mountPath)) {
			throw new Error("Mount path must be vault-relative");
		}
		const segments = mountPath.split("/");
		if (segments.some((segment) => segment === ".." || segment === ".")) {
			throw new Error("Mount path cannot contain . or ..");
		}
		if (Platform.isWin && segments.some((segment) => segment.includes(":"))) {
			throw new Error("Mount path contains an invalid character");
		}
	}

	getTargetPath(mountPath: string): string {
		const pathModule = getPath();
		const basePath = this.getVaultBasePath();
		const segments = mountPath.split("/").filter(Boolean);
		return pathModule.join(basePath, ...segments);
	}

	async createMount(mount: ExternalMount, linkType: ExternalMountLinkType = "auto"): Promise<void> {
		if (!this.isDesktop()) {
			throw new Error("Desktop only");
		}

		const sourcePath = mount.sourcePath.trim();
		if (!sourcePath) {
			throw new Error("Source path is required");
		}
		const pathModule = getPath();
		if (!pathModule.isAbsolute(sourcePath)) {
			throw new Error("Source path must be absolute");
		}

		const mountPath = this.normalizeMountPath(mount.mountPath);
		this.validateMountPath(mountPath);

		const sourceStat = await this.safeStat(sourcePath);
		if (!sourceStat || !sourceStat.isDirectory()) {
			throw new Error("Source path must be an existing folder");
		}
		const sourceRealPath = await this.getRealPath(sourcePath);
		const vaultRealPath = await this.getRealPath(this.getVaultBasePath());
		this.validateSourceBoundary(sourceRealPath, vaultRealPath);

		const targetPath = pathModule.join(vaultRealPath, ...mountPath.split("/").filter(Boolean));
		await this.validateTargetBoundary(targetPath, vaultRealPath);
		const existing = await this.safeLstat(targetPath);
		if (existing) {
			if (existing.isSymbolicLink()) {
				const linkTarget = await this.resolveLinkDestination(targetPath);
				if (this.pathsEqual(linkTarget, sourceRealPath)) {
					return;
				}
				throw new Error("Mount path points to a different folder");
			}
			throw new Error("Mount path already exists");
		}

		const fsPromises = getFs();
		await fsPromises.mkdir(pathModule.dirname(targetPath), { recursive: true });
		await this.createLink(sourceRealPath, targetPath, linkType);
	}

	async removeMount(mount: ExternalMount): Promise<void> {
		if (!this.isDesktop()) {
			throw new Error("Desktop only");
		}

		const mountPath = this.normalizeMountPath(mount.mountPath);
		this.validateMountPath(mountPath);

		const pathModule = getPath();
		if (!pathModule.isAbsolute(mount.sourcePath.trim())) {
			throw new Error("Source path must be absolute");
		}
		const vaultRealPath = await this.getRealPath(this.getVaultBasePath());
		const targetPath = pathModule.join(vaultRealPath, ...mountPath.split("/").filter(Boolean));
		await this.validateTargetBoundary(targetPath, vaultRealPath);
		const existing = await this.safeLstat(targetPath);
		if (!existing) {
			return;
		}
		if (!existing.isSymbolicLink()) {
			throw new Error("Mount path is not a symlink");
		}
		const configuredSource = await this.safeStat(mount.sourcePath.trim())
			? await this.getRealPath(mount.sourcePath.trim())
			: pathModule.resolve(mount.sourcePath.trim());
		const linkTarget = await this.resolveLinkDestination(targetPath);
		if (!this.pathsEqual(linkTarget, configuredSource)) {
			throw new Error("Mount path points to a different folder");
		}
		const fsPromises = getFs();
		await fsPromises.unlink(targetPath);
	}

	async relinkMount(mount: ExternalMount, linkType: ExternalMountLinkType = "auto"): Promise<void> {
		try {
			await this.removeMount(mount);
		} catch {
			// Ignore removal errors to allow relink attempts.
		}
		await this.createMount(mount, linkType);
	}

	async getStatus(mount: ExternalMount): Promise<ExternalMountStatus> {
		if (!this.isDesktop()) {
			return { state: "unavailable" };
		}

		const mountPath = this.normalizeMountPath(mount.mountPath);
		try {
			this.validateMountPath(mountPath);
		} catch (error) {
			return { state: "unsafe-path", detail: String(error) };
		}
		const pathModule = getPath();
		if (!pathModule.isAbsolute(mount.sourcePath.trim())) {
			return { state: "unsafe-path", detail: "Source path must be absolute" };
		}

		const sourceStat = await this.safeStat(mount.sourcePath);
		if (!sourceStat || !sourceStat.isDirectory()) {
			return { state: "source-missing" };
		}

		let sourceRealPath: string;
		let vaultRealPath: string;
		try {
			sourceRealPath = await this.getRealPath(mount.sourcePath);
			vaultRealPath = await this.getRealPath(this.getVaultBasePath());
			this.validateSourceBoundary(sourceRealPath, vaultRealPath);
		} catch (error) {
			return { state: "unsafe-path", detail: String(error) };
		}

		const targetPath = pathModule.join(vaultRealPath, ...mountPath.split("/").filter(Boolean));
		try {
			await this.validateTargetBoundary(targetPath, vaultRealPath);
		} catch (error) {
			return { state: "unsafe-path", detail: String(error) };
		}
		const targetStat = await this.safeLstat(targetPath);
		if (!targetStat) {
			return { state: "missing-target" };
		}
		if (!targetStat.isSymbolicLink()) {
			return { state: "conflict" };
		}
		try {
			const linkTarget = await this.resolveLinkDestination(targetPath);
			if (!this.pathsEqual(linkTarget, sourceRealPath)) {
				return { state: "mismatched-target" };
			}
		} catch (error) {
			return { state: "mismatched-target", detail: String(error) };
		}

		return { state: "linked" };
	}

	private async getRealPath(targetPath: string): Promise<string> {
		return getPath().resolve(await getFs().realpath(targetPath));
	}

	private validateSourceBoundary(sourcePath: string, vaultPath: string): void {
		if (this.isSameOrInside(sourcePath, vaultPath) || this.isSameOrInside(vaultPath, sourcePath)) {
			throw new Error("Source folder must be outside the vault and must not contain it");
		}
	}

	private async validateTargetBoundary(targetPath: string, vaultPath: string): Promise<void> {
		if (!this.isSameOrInside(targetPath, vaultPath) || this.pathsEqual(targetPath, vaultPath)) {
			throw new Error("Mount path must stay inside the vault");
		}

		const pathModule = getPath();
		const relativePath = pathModule.relative(vaultPath, targetPath);
		const segments = relativePath.split(/[\\/]+/).filter(Boolean);
		let currentPath = vaultPath;
		for (const segment of segments.slice(0, -1)) {
			currentPath = pathModule.join(currentPath, segment);
			const stat = await this.safeLstat(currentPath);
			if (!stat) break;
			if (stat.isSymbolicLink()) {
				throw new Error("Mount path cannot be nested under another link");
			}
			if (!stat.isDirectory()) {
				throw new Error("Mount parent path is not a folder");
			}
		}
	}

	private isSameOrInside(candidatePath: string, parentPath: string): boolean {
		const pathModule = getPath();
		const relativePath = pathModule.relative(parentPath, candidatePath);
		return relativePath === "" || (!relativePath.startsWith("..") && !pathModule.isAbsolute(relativePath));
	}

	private pathsEqual(firstPath: string, secondPath: string): boolean {
		const pathModule = getPath();
		const first = pathModule.resolve(firstPath);
		const second = pathModule.resolve(secondPath);
		return Platform.isWin ? first.toLowerCase() === second.toLowerCase() : first === second;
	}

	private async resolveLinkDestination(targetPath: string): Promise<string> {
		const fsPromises = getFs();
		const pathModule = getPath();
		try {
			return await this.getRealPath(targetPath);
		} catch {
			const rawTarget = await fsPromises.readlink(targetPath);
			const normalizedTarget = rawTarget.replace(/^\\\\\?\\/, "");
			return pathModule.resolve(pathModule.dirname(targetPath), normalizedTarget);
		}
	}

	private async safeStat(targetPath: string): Promise<FsStats | null> {
		try {
			const fsPromises = getFs();
			return await fsPromises.stat(targetPath);
		} catch {
			return null;
		}
	}

	private async safeLstat(targetPath: string): Promise<FsStats | null> {
		try {
			const fsPromises = getFs();
			return await fsPromises.lstat(targetPath);
		} catch {
			return null;
		}
	}

	private async createLink(sourcePath: string, targetPath: string, linkType: ExternalMountLinkType): Promise<void> {
		const fsPromises = getFs();
		if (Platform.isWin) {
			if (linkType === "junction") {
				await fsPromises.symlink(sourcePath, targetPath, "junction");
				return;
			}
			if (linkType === "symlink") {
				await fsPromises.symlink(sourcePath, targetPath, "dir");
				return;
			}
			try {
				await fsPromises.symlink(sourcePath, targetPath, "dir");
			} catch {
				await fsPromises.symlink(sourcePath, targetPath, "junction");
			}
			return;
		}

		await fsPromises.symlink(sourcePath, targetPath, "dir");
	}
}

type ElectronOpenDialogResult = {
	canceled: boolean;
	filePaths: string[];
};

type ElectronDialog = {
	showOpenDialog: (options: { properties: string[] }) => Promise<ElectronOpenDialogResult>;
};

type ElectronModule = {
	dialog?: ElectronDialog;
	remote?: {
		dialog?: ElectronDialog;
	};
};

export type ExternalFolderPickResult = {
	path: string | null;
	unavailable: boolean;
};

export async function pickExternalFolder(): Promise<ExternalFolderPickResult> {
	if (!Platform.isDesktopApp) {
		return { path: null, unavailable: true };
	}

	const requireFn = (window as Window & { require?: (module: string) => unknown }).require;
	if (!requireFn) {
		return { path: null, unavailable: true };
	}

	try {
		const electron = requireFn("electron") as ElectronModule;
		const dialog = electron.dialog ?? electron.remote?.dialog;
		if (!dialog) {
			return { path: null, unavailable: true };
		}
		const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
		if (result.canceled) {
			return { path: null, unavailable: false };
		}
		return { path: result.filePaths[0] ?? null, unavailable: false };
	} catch {
		return { path: null, unavailable: true };
	}
}

export function suggestMountPath(sourcePath: string): string {
	const trimmed = sourcePath.replace(/[\\/]+$/, "");
	try {
		const pathModule = getPath();
		const baseName = pathModule.basename(trimmed);
		const defaultName = baseName || "External";
		return normalizePath(`External/${defaultName}`);
	} catch {
		return normalizePath("External");
	}
}
