import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			obsidian: fileURLToPath(new URL("./tests/mocks/obsidian.ts", import.meta.url)),
		},
	},
	test: {
		setupFiles: ["tests/setup.ts"],
		exclude: ["**/node_modules/**", "**/dist/**", ".pty-build/**", "dev-assets/**"],
	},
});
