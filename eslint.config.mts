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
	...obsidianmd.configs.recommended,
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
	]),
);
