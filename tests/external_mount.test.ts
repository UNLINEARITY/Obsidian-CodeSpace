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

import { createRequire } from "node:module";
import { lstat, mkdtemp, mkdir, readlink, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const createdRoots: string[] = [];

beforeAll(() => {
	Object.assign(globalThis, { window: { require } });
});

afterEach(async () => {
	await Promise.all(createdRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createManager() {
	const root = await mkdtemp(path.join(tmpdir(), "code-space-mount-"));
	createdRoots.push(root);
	const vaultPath = path.join(root, "vault");
	await mkdir(vaultPath);
	const { ExternalMountManager } = await import("../src/external_mount");
	const app = { vault: { adapter: { getBasePath: () => vaultPath } } };
	return { manager: new ExternalMountManager(app as never), root, vaultPath };
}

describe("external mount safety", () => {
	it("normalizes trailing separators in mount paths", async () => {
		const { manager } = await createManager();
		expect(manager.normalizeMountPath("/External/source///")).toBe("External/source");
	});

	it("rejects source folders inside the vault", async () => {
		const { manager, vaultPath } = await createManager();
		const sourcePath = path.join(vaultPath, "source");
		await mkdir(sourcePath);

		await expect(manager.createMount({ id: "1", sourcePath, mountPath: "External/source" }, "junction"))
			.rejects.toThrow(/outside the vault/i);
	});

	it("rejects source folders that contain the vault", async () => {
		const { manager, root } = await createManager();

		await expect(manager.createMount({ id: "1", sourcePath: root, mountPath: "External/root" }, "junction"))
			.rejects.toThrow(/must not contain/i);
	});

	it("rejects targets nested under another link", async () => {
		const { manager, root, vaultPath } = await createManager();
		const sourcePath = path.join(root, "source");
		const linkedParentSource = path.join(root, "linked-parent-source");
		await Promise.all([mkdir(sourcePath), mkdir(linkedParentSource)]);
		await symlink(
			linkedParentSource,
			path.join(vaultPath, "linked-parent"),
			process.platform === "win32" ? "junction" : "dir",
		);

		await expect(manager.createMount({ id: "1", sourcePath, mountPath: "linked-parent/source" }, "junction"))
			.rejects.toThrow(/nested under another link/i);
	});

	it("does not remove a link that points to a different source", async () => {
		const { manager, root, vaultPath } = await createManager();
		const sourceA = path.join(root, "source-a");
		const sourceB = path.join(root, "source-b");
		const targetPath = path.join(vaultPath, "External", "source");
		await Promise.all([mkdir(sourceA), mkdir(sourceB), mkdir(path.dirname(targetPath))]);
		await symlink(sourceA, targetPath, process.platform === "win32" ? "junction" : "dir");

		const mount = { id: "1", sourcePath: sourceB, mountPath: "External/source" };
		await expect(manager.removeMount(mount)).rejects.toThrow(/different folder/i);
		expect(await readlink(targetPath)).toBeTruthy();
		expect((await manager.getStatus(mount)).state).toBe("mismatched-target");
	});

	it("accepts an existing link only when it points to the configured source", async () => {
		const { manager, root } = await createManager();
		const sourcePath = path.join(root, "source");
		await mkdir(sourcePath);
		const mount = { id: "1", sourcePath, mountPath: "External/source" };

		await manager.createMount(mount, process.platform === "win32" ? "junction" : "symlink");
		await expect(manager.createMount(mount, process.platform === "win32" ? "junction" : "symlink"))
			.resolves.toBeUndefined();
		expect((await manager.getStatus(mount)).state).toBe("linked");
		await manager.removeMount(mount);
		await expect(lstat(path.join(root, "vault", "External", "source"))).rejects.toThrow();
	});
});
