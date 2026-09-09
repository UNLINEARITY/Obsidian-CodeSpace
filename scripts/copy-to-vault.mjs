import { access, copyFile, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const vaultPath = process.env.OBSIDIAN_VAULT_PATH || "C:\\Nonlinear\\ob";
const configDir = process.env.OBSIDIAN_CONFIG_DIR || [".", "obsidian"].join("");
const pluginPath = path.join(vaultPath, configDir, "plugins", "code-space");
const artifacts = ["main.js", "manifest.json", "styles.css"];

await access(vaultPath);
await Promise.all(artifacts.map((artifact) => access(artifact)));
await mkdir(pluginPath, { recursive: true });
await Promise.all(artifacts.map((artifact) => copyFile(artifact, path.join(pluginPath, artifact))));

// 终端下载源：存在本地构建的 dev-assets 时携带到插件目录（设置页「下载」走本地离线安装），
// 不存在则移除旧 dev-source，确保走 GitHub release 正常路径。
const devAssetsDir = path.join(process.cwd(), "dev-assets");
const devSourceDir = path.join(pluginPath, "dev-source");
const hasLocalAssets = await access(path.join(devAssetsDir, "checksums.json")).then(() => true, () => false);
if (hasLocalAssets) {
	await rm(devSourceDir, { recursive: true, force: true });
	await mkdir(devSourceDir, { recursive: true });
	for (const file of await readdir(devAssetsDir)) {
		await copyFile(path.join(devAssetsDir, file), path.join(devSourceDir, file));
	}
	console.log("Terminal download source: local dev-assets (offline install)");
} else {
	await rm(devSourceDir, { recursive: true, force: true });
	console.log("Terminal download source: GitHub release");
}
