// 编码解码统一管线（一期：读取解码；二期：iconv-lite 编码回写）
// - 所有读取路径（编辑器/嵌入/大纲/PDF 导出）经 readFileDecoded 取得文本
// - 检测顺序：每文件记忆/显式指定 → BOM → UTF-8 严格试解码 → 回退编码（auto 兜底 gb18030）
// - 保存按文件当前编码写回（encodeText + adapter.writeBinary），无法表示的字符由调用方检测处理
// - 对 obsidian 仅 type import，便于在 vitest 中用 plain object 测试

import iconv from "iconv-lite";
import type { App, TFile } from "obsidian";
import type en from "./lang/locale/en";

export type EncodingLabel =
	| "utf-8"
	| "gb18030"
	| "big5"
	| "shift_jis"
	| "euc-kr"
	| "windows-1252"
	| "utf-16le"
	| "utf-16be";

export type EncodingSetting = EncodingLabel | "auto";

export const ENCODING_LABELS: readonly EncodingLabel[] = [
	"utf-8",
	"gb18030",
	"big5",
	"shift_jis",
	"euc-kr",
	"windows-1252",
	"utf-16le",
	"utf-16be",
];

export type DecodedSource = "memory" | "bom" | "strict-utf8" | "fallback" | "raw-read-fallback";

export interface DecodedFile {
	text: string;
	encoding: EncodingLabel;
	hadBOM: boolean;
	detected: DecodedSource;
}

interface EncodingAwareSettings {
	defaultEncoding?: EncodingSetting;
	fileEncodings?: Record<string, EncodingLabel>;
}

const BOM_SEQUENCES: ReadonlyArray<{ encoding: EncodingLabel; bytes: readonly number[] }> = [
	{ encoding: "utf-8", bytes: [0xef, 0xbb, 0xbf] },
	{ encoding: "utf-16le", bytes: [0xff, 0xfe] },
	{ encoding: "utf-16be", bytes: [0xfe, 0xff] },
];

const ENCODING_LABEL_SET = new Set<string>(ENCODING_LABELS);

const BOM_CHAR = "﻿";

/** 读取插件设置（app.plugins 上的插件实例；取不到时按 auto 处理） */
function getEncodingSettings(app: App): EncodingAwareSettings {
	const plugin = (app as unknown as { plugins?: { getPlugin?(id: string): unknown } }).plugins?.getPlugin?.("code-space") as
		| { settings?: EncodingAwareSettings }
		| undefined;
	return plugin?.settings ?? {};
}

export function detectBom(bytes: Uint8Array): { encoding: EncodingLabel; length: number } | null {
	for (const candidate of BOM_SEQUENCES) {
		if (bytes.length >= candidate.bytes.length && candidate.bytes.every((byte, index) => bytes[index] === byte)) {
			return { encoding: candidate.encoding, length: candidate.bytes.length };
		}
	}
	return null;
}

/** 非 fatal 解码（非法序列替换为 U+FFFD，不抛错），并剥除解码后残留的首个 BOM 字符 */
export function decodeBytes(bytes: Uint8Array, label: EncodingLabel): string {
	try {
		const text = new TextDecoder(label).decode(bytes);
		return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
	} catch (error) {
		// 理论上非 fatal 不会抛错；兜底按 UTF-8 宽松解码
		console.error(`[code-space] decode with ${label} failed`, error);
		return new TextDecoder("utf-8").decode(bytes);
	}
}

/** UTF-8 严格试解码：任何非法序列都抛错（用于合法性探测） */
function tryDecodeStrictUtf8(bytes: Uint8Array): string | null {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return null;
	}
}

const BOM_BYTES: Partial<Record<EncodingLabel, readonly number[]>> = {
	"utf-8": [0xef, 0xbb, 0xbf],
	"utf-16le": [0xff, 0xfe],
	"utf-16be": [0xfe, 0xff],
};

/**
 * 将文本编码为指定编码字节（保存回写用）。
 * - utf-8 走原生 TextEncoder；其余编码走 iconv-lite（纯 JS，全平台可用）
 * - utf-8 / utf-16 可附 BOM（与原文件保持一致）
 * - 无法表示的字符按编码默认替换符写盘，调用方应先做编解码回读比对（lossy 检测）
 */
export function encodeText(text: string, label: EncodingLabel, addBOM = false): Uint8Array {
	const body = label === "utf-8" ? new TextEncoder().encode(text) : iconv.encode(text, label);
	if (!addBOM) {
		return body;
	}
	const bom = BOM_BYTES[label];
	if (!bom) {
		return body;
	}
	const result = new Uint8Array(bom.length + body.length);
	result.set(bom, 0);
	result.set(body, bom.length);
	return result;
}

/** 拷贝为独立且精确大小的 ArrayBuffer。
 * 注意：不能用 bytes.slice()——Buffer.prototype.slice 是视图语义（共享底层内存），
 * 会把 iconv 分配缓冲区中的 NUL 填充一并写入文件。 */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(bytes.length);
	copy.set(bytes);
	return copy.buffer;
}

export function normalizeEncodingSetting(raw: unknown): EncodingSetting {
	if (typeof raw === "string") {
		if (raw === "auto") return "auto";
		if (ENCODING_LABEL_SET.has(raw)) return raw as EncodingLabel;
	}
	return "auto";
}

export function normalizeFileEncodings(raw: unknown): Record<string, EncodingLabel> {
	if (!raw || typeof raw !== "object") {
		return {};
	}
	const result: Record<string, EncodingLabel> = {};
	for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
		const path = key.trim().replace(/^\/+|\/+$/g, "");
		if (!path) continue;
		if (typeof value === "string" && ENCODING_LABEL_SET.has(value)) {
			result[path] = value as EncodingLabel;
		}
	}
	return result;
}

/**
 * 以编码感知方式读取 vault 文件。
 * @param opts.encodingOverride 用户显式指定的编码（"以指定编码重新打开"），优先级最高
 */
export async function readFileDecoded(
	app: App,
	file: TFile,
	opts?: { encodingOverride?: EncodingLabel }
): Promise<DecodedFile> {
	let bytes: Uint8Array;
	try {
		bytes = new Uint8Array(await app.vault.readBinary(file));
	} catch (error) {
		// readBinary 不可用时回退 vault.read（字符串层剥 BOM），按 UTF-8 处理
		console.error("[code-space] readBinary failed, falling back to vault.read", error);
		const text = await app.vault.read(file);
		const hadBOM = text.startsWith(BOM_CHAR);
		return { text: hadBOM ? text.slice(1) : text, encoding: "utf-8", hadBOM, detected: "raw-read-fallback" };
	}

	const settings = getEncodingSettings(app);

	// 1) 每文件记忆 / 显式指定 —— 用户意图最高优先（utf-8 记忆不短路，仍走嗅探以识别 BOM）
	const remembered = opts?.encodingOverride ?? settings.fileEncodings?.[file.path];
	if (remembered && remembered !== "utf-8") {
		return { text: decodeBytes(bytes, remembered), encoding: remembered, hadBOM: false, detected: "memory" };
	}

	// 2) BOM 嗅探
	const bom = detectBom(bytes);
	if (bom) {
		return { text: decodeBytes(bytes, bom.encoding), encoding: bom.encoding, hadBOM: true, detected: "bom" };
	}

	// 3) UTF-8 严格试解码（纯 ASCII 与合法 UTF-8 均通过，行为与现状一致）
	const strictUtf8 = tryDecodeStrictUtf8(bytes);
	if (strictUtf8 !== null) {
		return { text: strictUtf8, encoding: "utf-8", hadBOM: false, detected: "strict-utf8" };
	}

	// 4) 回退编码：auto 兜底 gb18030（GBK/GB2312 的 WHATWG 超集）
	const configured = settings.defaultEncoding ?? "auto";
	const fallback: EncodingLabel = configured === "utf-8" ? "utf-8" : configured === "auto" ? "gb18030" : configured;
	return { text: decodeBytes(bytes, fallback), encoding: fallback, hadBOM: false, detected: "fallback" };
}

/** 编码 → i18n 键的显式映射（编译期校验键名，避免字符串拼接拼错） */
const ENCODING_NAME_KEYS: Record<EncodingLabel, keyof typeof en> = {
	"utf-8": "ENCODING_NAME_UTF8",
	gb18030: "ENCODING_NAME_GB18030",
	big5: "ENCODING_NAME_BIG5",
	shift_jis: "ENCODING_NAME_SHIFT_JIS",
	"euc-kr": "ENCODING_NAME_EUC_KR",
	"windows-1252": "ENCODING_NAME_WINDOWS_1252",
	"utf-16le": "ENCODING_NAME_UTF16LE",
	"utf-16be": "ENCODING_NAME_UTF16BE",
};

export function getEncodingDisplayNameKey(label: EncodingLabel): keyof typeof en {
	return ENCODING_NAME_KEYS[label];
}
