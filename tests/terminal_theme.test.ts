import { describe, expect, it } from "vitest";
import { normalizeCssColor, themeFromVars } from "../src/terminal/terminal_theme";

describe("normalizeCssColor", () => {
	it("wraps Obsidian rgb triplets", () => {
		expect(normalizeCssColor("185, 28, 28")).toBe("rgb(185,28,28)");
		expect(normalizeCssColor(" 8 , 68 , 119 ")).toBe("rgb(8,68,119)");
	});

	it("passes through common color formats", () => {
		expect(normalizeCssColor("#ff0000")).toBe("#ff0000");
		expect(normalizeCssColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
		expect(normalizeCssColor("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)");
	});

	it("returns undefined for empty values", () => {
		expect(normalizeCssColor(undefined)).toBeUndefined();
		expect(normalizeCssColor("")).toBeUndefined();
		expect(normalizeCssColor("   ")).toBeUndefined();
	});
});

describe("themeFromVars", () => {
	it("maps Obsidian variables to xterm theme fields", () => {
		const theme = themeFromVars({
			"--background-primary": "#1e1e1e",
			"--text-normal": "#d4d4d4",
			"--text-accent": "#c8ffff",
			"--color-red": "185, 28, 28",
			"--color-cyan": "#00ffff",
		});

		expect(theme.background).toBe("#1e1e1e");
		expect(theme.foreground).toBe("#d4d4d4");
		expect(theme.cursor).toBe("#c8ffff");
		expect(theme.red).toBe("rgb(185,28,28)");
		expect(theme.cyan).toBe("#00ffff");
	});

	it("falls back to alternate variables when primary is missing", () => {
		const theme = themeFromVars({
			"--text-muted": "#808080",
		});
		// cursor 主/回退变量（--text-accent/--text-normal）均缺失 → 不设置
		expect(theme.cursor).toBeUndefined();
		// brightBlack 主变量 --text-muted 命中
		expect(theme.brightBlack).toBe("#808080");
	});

	it("uses fallback variable when defined", () => {
		const theme = themeFromVars({
			"--text-faint": "#5a5a5a",
		});
		// black 主变量 --text-faint 命中
		expect(theme.black).toBe("#5a5a5a");
	});

	it("leaves fields unset when no variable exists", () => {
		const theme = themeFromVars({});
		expect(theme.background).toBeUndefined();
		expect(theme.foreground).toBeUndefined();
	});
});
