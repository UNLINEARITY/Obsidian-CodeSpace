// 本地构建当前平台的 node-pty 下载资产（与 CI build-node-pty.yml 产物布局一致）
// 产出：dev-assets/node-pty-<platform>-<arch>.zip + dev-assets/checksums.json
// 配合 scripts/copy-to-vault.mjs 携带至 <vault>/plugins/code-space/dev-source/，
// 插件设置页的「下载」将优先走本地源（离线完整演练下载→校验→解压→安装链路）。

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const NODE_PTY_VERSION = "1.1.0";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(repoRoot, ".pty-build");
const assetsDir = path.join(repoRoot, "dev-assets");
const platform = process.platform;
const arch = process.arch;
const assetName = `node-pty-${platform}-${arch}.zip`;

function run(command, args, options = {}) {
	// Windows 的 npm 是 npm.cmd：Node 安全策略要求 .cmd 必须经 shell 执行；
	// 参数均为固定常量，手动拼接避免数组+shell 的弃用警告
	if (process.platform === "win32" && command === "npm") {
		execFileSync(`${command} ${args.join(" ")}`, { stdio: "inherit", shell: true, ...options });
	} else {
		execFileSync(command, args, { stdio: "inherit", ...options });
	}
}

function zipAvailable() {
	try {
		execFileSync("zip", ["-v"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function removePdbFiles(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			removePdbFiles(full);
		} else if (entry.name.endsWith(".pdb")) {
			rmSync(full, { force: true });
		}
	}
}

// 1. 下载 node-pty tarball 并解压（npm pack 不执行安装脚本，
//    tarball 自带完整 prebuilds，运行时按 prebuilds 布局加载，无需 install scripts）
rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
run("npm", ["pack", `node-pty@${NODE_PTY_VERSION}`, "--pack-destination", buildDir], { cwd: buildDir });
const tarball = path.join(buildDir, `node-pty-${NODE_PTY_VERSION}.tgz`);
// 用相对路径调用 tar：Windows 下绝对路径的 "C:" 会被 GNU tar 解析为远程主机
execFileSync("tar", ["-xzf", path.basename(tarball)], { cwd: buildDir, stdio: "inherit" });

const ptyDir = path.join(buildDir, "package");

// 2. 平台 prebuilds 检查（tarball 覆盖 win32-x64/arm64 与 darwin-x64/arm64；
//    linux 无预编译产物，本地构建请依赖 CI 资产）
const prebuildDir = path.join(ptyDir, "prebuilds", `${platform}-${arch}`);
if (!existsSync(prebuildDir)) {
	throw new Error(`prebuilds/${platform}-${arch} not found in the tarball — use the CI-built assets for this platform`);
}

// 3. Windows：应用 Obsidian 渲染进程补丁
if (platform === "win32") {
	cpSync(
		path.join(repoRoot, "patches", "windowsConoutConnection.js"),
		path.join(ptyDir, "lib", "windowsConoutConnection.js")
	);
}

// 4. 组装 staging（lib + prebuilds/<platform>-<arch> + package.json，剔调试符号）
const stageDir = path.join(buildDir, "stage");
const stagePtyDir = path.join(stageDir, "node-pty");
mkdirSync(path.join(stagePtyDir, "prebuilds"), { recursive: true });
cpSync(path.join(ptyDir, "package.json"), path.join(stagePtyDir, "package.json"));
cpSync(path.join(ptyDir, "lib"), path.join(stagePtyDir, "lib"), { recursive: true });
cpSync(prebuildDir, path.join(stagePtyDir, "prebuilds", `${platform}-${arch}`), { recursive: true });
removePdbFiles(stagePtyDir);

// 5. 压缩（优先 zip，Windows 回退 PowerShell Compress-Archive）
const zipPath = path.join(stageDir, assetName);
if (zipAvailable()) {
	run("zip", ["-r", zipPath, "node-pty"], { cwd: stageDir });
} else if (platform === "win32") {
	run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
		`Compress-Archive -Path '${stagePtyDir.replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force`]);
} else {
	throw new Error("zip is required on this platform");
}

// 6. 生成 checksums.json（与 CI 相同格式；保留其他平台的既有条目）
mkdirSync(assetsDir, { recursive: true });
const checksumsPath = path.join(assetsDir, "checksums.json");
let checksums = {};
if (existsSync(checksumsPath)) {
	checksums = JSON.parse(readFileSync(checksumsPath, "utf8"));
}
checksums[assetName] = createHash("sha256").update(readFileSync(zipPath)).digest("hex");
writeFileSync(checksumsPath, JSON.stringify(checksums, null, "\t") + "\n");
cpSync(zipPath, path.join(assetsDir, assetName));

console.log(`dev-assets 就绪：${assetName}（校验和已写入 checksums.json）`);
console.log("执行 npm run dev:copy 后，插件设置页的「下载」将使用本地源。");
