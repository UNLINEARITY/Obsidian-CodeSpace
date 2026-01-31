import { App, FileSystemAdapter, Platform, normalizePath } from "obsidian";

type FsPromises = {
	stat(path: string): Promise<FsStats>;
	lstat(path: string): Promise<FsStats>;
	mkdir(path: string, options: { recursive: boolean }): Promise<void>;
	symlink(target: string, path: string, type?: SymlinkType): Promise<void>;
	unlink(path: string): Promise<void>;
};

type PathModule = {
	join(...parts: string[]): string;
	dirname(path: string): string;
	basename(path: string): string;
	isAbsolute(path: string): boolean;
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
		return normalizePath(trimmed).replace(/^\/+/, "");
	}

	validateMountPath(mountPath: string): void {
		const pathModule = getPath();
		if (!mountPath) {
			throw new Error("Mount path is required");
		}
		if (pathModule.isAbsolute(mountPath)) {
			throw new Error("Mount path must be vault-relative");
		}
		if (mountPath.split("/").some((segment) => segment === "..")) {
			throw new Error("Mount path cannot contain ..");
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

		const mountPath = this.normalizeMountPath(mount.mountPath);
		this.validateMountPath(mountPath);

		const sourceStat = await this.safeStat(sourcePath);
		if (!sourceStat || !sourceStat.isDirectory()) {
			throw new Error("Source path must be an existing folder");
		}

		const targetPath = this.getTargetPath(mountPath);
		const existing = await this.safeLstat(targetPath);
		if (existing) {
			if (existing.isSymbolicLink()) {
				return;
			}
			throw new Error("Mount path already exists");
		}

		const fsPromises = getFs();
		const pathModule = getPath();
		await fsPromises.mkdir(pathModule.dirname(targetPath), { recursive: true });
		await this.createLink(sourcePath, targetPath, linkType);
	}

	async removeMount(mount: ExternalMount): Promise<void> {
		if (!this.isDesktop()) {
			throw new Error("Desktop only");
		}

		const mountPath = this.normalizeMountPath(mount.mountPath);
		this.validateMountPath(mountPath);

		const targetPath = this.getTargetPath(mountPath);
		const existing = await this.safeLstat(targetPath);
		if (!existing) {
			return;
		}
		if (!existing.isSymbolicLink()) {
			throw new Error("Mount path is not a symlink");
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
		if (!mountPath) {
			return { state: "conflict", detail: "Invalid mount path" };
		}

		const sourceStat = await this.safeStat(mount.sourcePath);
		if (!sourceStat || !sourceStat.isDirectory()) {
			return { state: "source-missing" };
		}

		const targetPath = this.getTargetPath(mountPath);
		const targetStat = await this.safeLstat(targetPath);
		if (!targetStat) {
			return { state: "missing-target" };
		}
		if (!targetStat.isSymbolicLink()) {
			return { state: "conflict" };
		}

		return { state: "linked" };
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
