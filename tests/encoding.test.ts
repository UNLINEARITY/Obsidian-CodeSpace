import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import {
	detectBom,
	decodeBytes,
	normalizeEncodingSetting,
	normalizeFileEncodings,
	readFileDecoded,
} from "../src/encoding";
import type { App } from "obsidian";

/** 构造 GB18030 字节（"中文注释"） */
const GB_BYTES = new Uint8Array([0xd6, 0xd0, 0xce, 0xc4, 0xd7, 0xa2, 0xca, 0xcd]);
const GB_TEXT = "中文注释";

function utf8Bytes(text: string): Uint8Array {
	return new TextEncoder().encode(text);
}

type FakePlugin = { settings?: Record<string, unknown> };

function fakeVaultApp(bytes: () => Uint8Array, fallbackRead?: () => Promise<string>, plugin?: FakePlugin): App {
	return {
		vault: {
			readBinary: async () => bytes(),
			read: fallbackRead,
		},
		plugins: {
			getPlugin: (id: string) => (id === "code-space" ? plugin : undefined),
		},
	} as unknown as App;
}

const FILE = { path: "src/main.f90" } as TFile;

describe("detectBom", () => {
	it("识别 UTF-8 BOM", () => {
		expect(detectBom(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]))).toEqual({ encoding: "utf-8", length: 3 });
	});

	it("识别 UTF-16 LE/BE BOM", () => {
		expect(detectBom(new Uint8Array([0xff, 0xfe]))?.encoding).toBe("utf-16le");
		expect(detectBom(new Uint8Array([0xfe, 0xff]))?.encoding).toBe("utf-16be");
	});

	it("无 BOM 返回 null", () => {
		expect(detectBom(utf8Bytes("hello"))).toBeNull();
		expect(detectBom(new Uint8Array([]))).toBeNull();
	});
});

describe("decodeBytes", () => {
	it("按 GB18030 解码中文字节", () => {
		expect(decodeBytes(GB_BYTES, "gb18030")).toBe(GB_TEXT);
	});

	it("剥除解码后残留的 BOM 字符", () => {
		const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8Bytes("abc")]);
		expect(decodeBytes(withBom, "utf-8")).toBe("abc");
	});
});

describe("readFileDecoded", () => {
	it("合法 UTF-8 直接通过严格解码", async () => {
		const app = fakeVaultApp(() => utf8Bytes("# 中文注释\nprint(1)\n"));
		const result = await readFileDecoded(app, FILE);
		expect(result.encoding).toBe("utf-8");
		expect(result.detected).toBe("strict-utf8");
		expect(result.text).toContain("中文注释");
	});

	it("非 UTF-8 字节在 auto 下回退 gb18030", async () => {
		const app = fakeVaultApp(() => GB_BYTES);
		const result = await readFileDecoded(app, FILE);
		expect(result.encoding).toBe("gb18030");
		expect(result.detected).toBe("fallback");
		expect(result.text).toBe(GB_TEXT);
	});

	it("BOM 优先于回退逻辑", async () => {
		const bytes = new Uint8Array([0xff, 0xfe, 0x41, 0x00]); // UTF-16LE "A"
		const app = fakeVaultApp(() => bytes);
		const result = await readFileDecoded(app, FILE);
		expect(result.detected).toBe("bom");
		expect(result.encoding).toBe("utf-16le");
		expect(result.hadBOM).toBe(true);
		expect(result.text).toBe("A");
	});

	it("每文件记忆优先于嗅探", async () => {
		const app = fakeVaultApp(() => utf8Bytes("hello"), undefined, {
			settings: { fileEncodings: { "src/main.f90": "gb18030" } },
		});
		const result = await readFileDecoded(app, FILE);
		expect(result.encoding).toBe("gb18030");
		expect(result.detected).toBe("memory");
	});

	it("显式 override 优先于每文件记忆", async () => {
		const app = fakeVaultApp(() => GB_BYTES, undefined, {
			settings: { fileEncodings: { "src/main.f90": "big5" } },
		});
		const result = await readFileDecoded(app, FILE, { encodingOverride: "gb18030" });
		expect(result.encoding).toBe("gb18030");
	});

	it("记忆为 utf-8 时不短路，仍走嗅探识别 BOM", async () => {
		const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8Bytes("x")]);
		const app = fakeVaultApp(() => bytes, undefined, {
			settings: { fileEncodings: { "src/main.f90": "utf-8" } },
		});
		const result = await readFileDecoded(app, FILE);
		expect(result.detected).toBe("bom");
	});

	it("defaultEncoding=gb18030 时回退使用配置值", async () => {
		const app = fakeVaultApp(() => GB_BYTES, undefined, {
			settings: { defaultEncoding: "gb18030" },
		});
		const result = await readFileDecoded(app, FILE);
		expect(result.encoding).toBe("gb18030");
		expect(result.detected).toBe("fallback");
	});

	it("readBinary 失败时回退 vault.read 并剥除字符串层 BOM", async () => {
		const app = {
			vault: {
				readBinary: async () => {
					throw new Error("no binary");
				},
				read: async () => `\uFEFFcontent`,
			},
			plugins: { getPlugin: () => undefined },
		} as unknown as App;
		const result = await readFileDecoded(app, FILE);
		expect(result.text).toBe("content");
		expect(result.hadBOM).toBe(true);
		expect(result.encoding).toBe("utf-8");
		expect(result.detected).toBe("raw-read-fallback");
	});
});

describe("normalize", () => {
	it("normalizeEncodingSetting 白名单过滤", () => {
		expect(normalizeEncodingSetting("auto")).toBe("auto");
		expect(normalizeEncodingSetting("gb18030")).toBe("gb18030");
		expect(normalizeEncodingSetting("gbk")).toBe("auto");
		expect(normalizeEncodingSetting(42)).toBe("auto");
		expect(normalizeEncodingSetting(undefined)).toBe("auto");
	});

	it("normalizeFileEncodings 清理非法键值", () => {
		const result = normalizeFileEncodings({
			" a.md ": "utf-8",
			"/leading/slash/": "gb18030",
			"bad.md": "latin9",
			"": "utf-8",
		});
		expect(result).toEqual({ "a.md": "utf-8", "leading/slash": "gb18030" });
		expect(normalizeFileEncodings(null)).toEqual({});
		expect(normalizeFileEncodings("x")).toEqual({});
	});
});
