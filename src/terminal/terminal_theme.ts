// Obsidian 主题 CSS 变量 → xterm 主题映射（纯函数，可单测）

import type { ITheme } from "@xterm/xterm";

/**
 * 归一化 CSS 颜色值：
 * - Obsidian 的 --color-* 变量为 "r, g, b" 三元组形式 → 包装为 rgb()
 * - hex / rgb() / hsl() 等常规颜色原样返回
 */
export function normalizeCssColor(value: string | undefined): string | undefined {
	const trimmed = (value ?? "").trim();
	if (!trimmed) {
		return undefined;
	}
	if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(trimmed)) {
		return `rgb(${trimmed.replace(/\s+/g, "")})`;
	}
	return trimmed;
}

/** Obsidian CSS 变量名 → xterm 主题字段映射表 */
const THEME_VAR_MAPPING: Array<[keyof ITheme, string, string | undefined]> = [
	["background", "--background-primary", undefined],
	["foreground", "--text-normal", undefined],
	["cursor", "--text-accent", "--text-normal"],
	["cursorAccent", "--background-primary", undefined],
	["selectionBackground", "--text-selection", "--text-muted"],
	// ANSI 16 色（亮色映射为同色系，保证加粗输出不失真）
	["black", "--text-faint", "--text-muted"],
	["red", "--color-red", undefined],
	["green", "--color-green", undefined],
	["yellow", "--color-yellow", undefined],
	["blue", "--color-blue", undefined],
	["magenta", "--color-purple", undefined],
	["cyan", "--color-cyan", undefined],
	["white", "--text-normal", undefined],
	["brightBlack", "--text-muted", "--text-faint"],
	["brightRed", "--color-red", undefined],
	["brightGreen", "--color-green", undefined],
	["brightYellow", "--color-yellow", undefined],
	["brightBlue", "--color-blue", undefined],
	["brightMagenta", "--color-purple", undefined],
	["brightCyan", "--color-cyan", undefined],
	["brightWhite", "--text-normal", undefined],
];

/**
 * 从 CSS 变量取值表构建 xterm 主题。
 * @param vars 已通过 getComputedStyle 读取的变量原始值（键为变量名）
 */
export function themeFromVars(vars: Record<string, string | undefined>): ITheme {
	const theme: ITheme = {};
	for (const [field, varName, fallbackVarName] of THEME_VAR_MAPPING) {
		const color = normalizeCssColor(vars[varName]) ?? normalizeCssColor(fallbackVarName ? vars[fallbackVarName] : undefined);
		if (color) {
			(theme as Record<string, string>)[field as string] = color;
		}
	}
	return theme;
}

/**
 * 取样式读取目标：Obsidian 把 --background-primary/--font-monospace/--color-*
 * 等主题变量定义在 body 上，而 CSS 自定义属性不向上继承到 :root，
 * 从 documentElement 读取会得到空值。直接读 body 还能避免读到宿主容器
 * （如 .code-space-container 对 --text-selection 的局部覆盖），
 * 保证内嵌面板与独立终端视图的观感一致。
 */
function resolveStyleTarget(sourceEl: HTMLElement): HTMLElement {
	const doc = sourceEl.ownerDocument;
	return doc.body ?? doc.documentElement;
}

/** 从元素所属文档读取主题变量表（弹出窗口时使用各自的 document） */
export function readThemeVars(sourceEl: HTMLElement): Record<string, string | undefined> {
	const doc = sourceEl.ownerDocument;
	const view = doc.defaultView;
	if (!view) {
		return {};
	}
	const styles = view.getComputedStyle(resolveStyleTarget(sourceEl));
	const vars: Record<string, string | undefined> = {};
	for (const [, varName] of THEME_VAR_MAPPING) {
		vars[varName] = styles.getPropertyValue(varName);
	}
	return vars;
}

/** 读取 Obsidian 等宽字体栈（用于终端字体一致性） */
export function readMonospaceFont(sourceEl: HTMLElement): string | undefined {
	const doc = sourceEl.ownerDocument;
	const view = doc.defaultView;
	if (!view) {
		return undefined;
	}
	const font = view.getComputedStyle(resolveStyleTarget(sourceEl)).getPropertyValue("--font-monospace");
	return font.trim() || undefined;
}

/** 主题变量为空时使用的跨平台等宽兜底栈（Windows 优先） */
export const FALLBACK_MONOSPACE_STACK = '"Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace';

/**
 * 构建终端字体栈：主题值必须以 monospace 通用关键字兜底。
 * 缺少兜底时浏览器可能回退到非等宽字体，导致 xterm 的字符宽度
 * 测量与实际渲染不一致（表现为字母之间出现空隙）。
 */
export function buildTerminalFontFamily(raw: string | undefined): string {
	const trimmed = (raw ?? "").trim();
	if (!trimmed) {
		return FALLBACK_MONOSPACE_STACK;
	}
	if (/(^|,)\s*monospace\s*(,|$)/.test(trimmed)) {
		return trimmed;
	}
	return `${trimmed}, monospace`;
}
