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

import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
	{
		languageOptions: {
			globals: {
				...globals.browser,
				activeDocument: "readonly",
				activeWindow: "readonly",
			},
			parserOptions: {
			projectService: {
					allowDefaultProject: [
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommendedWithLocalesEn,
	{
		files: ["tests/**/*", "scripts/**/*", "vitest.config.ts"],
		languageOptions: {
			globals: globals.node,
		},
			rules: {
				"obsidianmd/no-nodejs-modules": "off",
				"obsidianmd/no-global-this": "off",
				// Test fixtures intentionally use structural TFile mocks.
				"obsidianmd/no-tfile-tfolder-cast": "off",
				"no-undef": "off",
				// CLI 脚本的正常输出
				"no-console": "off",
			},
		},
	{
		files: ["src/lang/locale/**"],
		rules: {
			// 官方审查实测不将 locale 文案大小写计入评分（已发布版本满分），
			// 该规则仅以 warn 级别存在，在 --max-warnings=0 下误报为阻塞，显式关闭
			"obsidianmd/ui/sentence-case-locale-module": "off",
			"obsidianmd/ui/sentence-case-json": "off",
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		// vendored upstream patch (kept in sync with src/terminal/conout_patch.ts by test)
		"patches/**",
		// CLI 构建脚本（与 esbuild.config.mjs/version-bump.mjs 同待遇）
		"scripts/build-pty-assets.mjs",
		"scripts/copy-to-vault.mjs",
		// 本地终端资产构建（node-pty tarball 解包产物）
		".pty-build/**",
		"dev-assets/**",
	]),
);
