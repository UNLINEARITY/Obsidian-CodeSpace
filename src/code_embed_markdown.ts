import { TFile, normalizePath } from "obsidian";
import type CodeSpacePlugin from "./main";
import { readFileDecoded } from "./encoding";

export type ResolvedCodeEmbed = {
	file: TFile;
	startLine: number;
	endLine: number;
};

const MARKDOWN_LANGUAGE_ALIASES: Record<string, string> = {
	htm: "html",
	xhtml: "html",
	mjs: "javascript",
	cjs: "javascript",
	json5: "json",
	jsonc: "json",
	vue: "javascript",
	svelte: "javascript",
	astro: "javascript",
	scss: "css",
	sass: "css",
	less: "css",
	kt: "kotlin",
	kts: "kotlin",
	m: "matlab",
	yml: "yaml",
	urdf: "xml",
	xacro: "xml",
	svg: "xml",
	xsd: "xml",
	xsl: "xml",
	xslt: "xml",
	wsdl: "xml",
	plist: "xml",
	csproj: "xml",
	vcxproj: "xml",
	props: "xml",
	targets: "xml",
	config: "xml",
	toml: "yaml",
	ini: "yaml",
	cfg: "yaml",
	conf: "yaml",
	f: "fortran",
	for: "fortran",
	f90: "fortran",
	f95: "fortran",
	f03: "fortran",
	f08: "fortran",
};

export const KNOWN_RENDERABLE_CODE_EXTENSIONS = new Set([
	"py",
	"c",
	"cpp",
	"h",
	"hpp",
	"cc",
	"cxx",
	"js",
	"ts",
	"jsx",
	"tsx",
	"json",
	"mjs",
	"cjs",
	"json5",
	"jsonc",
	"vue",
	"svelte",
	"astro",
	"html",
	"htm",
	"xhtml",
	"css",
	"scss",
	"sass",
	"less",
	"sql",
	"php",
	"rs",
	"java",
	"cs",
	"kt",
	"kts",
	"m",
	"go",
	"yaml",
	"yml",
	"xml",
	"urdf",
	"xacro",
	"svg",
	"xsd",
	"xsl",
	"xslt",
	"wsdl",
	"plist",
	"csproj",
	"vcxproj",
	"props",
	"targets",
	"config",
	"toml",
	"ini",
	"cfg",
	"conf",
	"f",
	"for",
	"f90",
	"f95",
	"f03",
	"f08",
]);

function collectAllowedExtensions(plugin: CodeSpacePlugin): Set<string> {
	const configured = plugin.settings.extensions
		.split(",")
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);

	return new Set([...configured, ...Array.from(KNOWN_RENDERABLE_CODE_EXTENSIONS)]);
}

function parseLineFragment(hashPart: string): { startLine: number; endLine: number } | null {
	if (!hashPart) {
		return { startLine: 0, endLine: 0 };
	}

	const rangeMatch = hashPart.match(/^L?(\d+)-L?(\d+)$/i);
	if (rangeMatch?.[1] && rangeMatch[2]) {
		const startLine = Math.max(1, Number.parseInt(rangeMatch[1], 10));
		const endLine = Math.max(startLine, Number.parseInt(rangeMatch[2], 10));
		return { startLine, endLine };
	}

	const singleMatch = hashPart.match(/^L?(\d+)$/i);
	if (singleMatch?.[1]) {
		const startLine = Math.max(1, Number.parseInt(singleMatch[1], 10));
		return { startLine, endLine: 0 };
	}

	return null;
}

function indentMultiline(text: string, indent: string): string {
	if (!indent) return text;
	return text
		.split("\n")
		.map((line) => `${indent}${line}`)
		.join("\n");
}

function getMarkdownLanguage(ext: string): string {
	return MARKDOWN_LANGUAGE_ALIASES[ext] ?? ext;
}

export function createFencedCodeBlock(content: string, ext: string): string {
	const markdownLanguage = getMarkdownLanguage(ext);
	const fenceMatches = content.match(/`+/g) ?? [];
	let longestFence = 0;
	for (const fence of fenceMatches) {
		longestFence = Math.max(longestFence, fence.length);
	}
	const fence = "`".repeat(Math.max(3, longestFence + 1));
	return `${fence}${markdownLanguage}\n${content}\n${fence}`;
}

export function resolveCodeEmbedReference(
	plugin: CodeSpacePlugin,
	rawReference: string,
	sourcePath: string,
	allowedExtensions: Set<string> = collectAllowedExtensions(plugin)
): ResolvedCodeEmbed | null {
	const trimmed = rawReference.trim();
	if (!trimmed) return null;

	const pipeIndex = trimmed.indexOf("|");
	const reference = pipeIndex === -1 ? trimmed : trimmed.slice(0, pipeIndex).trim();
	if (!reference) return null;

	const hashIndex = reference.indexOf("#");
	const filePath = hashIndex === -1 ? reference : reference.slice(0, hashIndex).trim();
	const hashPart = hashIndex === -1 ? "" : reference.slice(hashIndex + 1).trim();
	if (!filePath) return null;
	const hadLeadingSlash = /^[\\/]/.test(filePath);

	const lineFragment = parseLineFragment(hashPart);
	if (hashPart && !lineFragment) {
		return null;
	}

	const normalizedFilePath = normalizePath(filePath.replace(/\\/g, "/")).trim();
	if (!normalizedFilePath) return null;

	let file: TFile | null = null;

	if (hadLeadingSlash) {
		const rootPath = normalizedFilePath.replace(/^\/+/, "");
		const exact = plugin.app.vault.getAbstractFileByPath(rootPath);
		file = exact instanceof TFile ? exact : null;
	}

	if (!file) {
		file = plugin.app.metadataCache.getFirstLinkpathDest(normalizedFilePath, sourcePath);
	}

	if (!file && normalizedFilePath.includes("/")) {
		const exact = plugin.app.vault.getAbstractFileByPath(normalizedFilePath);
		file = exact instanceof TFile ? exact : null;
	}

	if (!file && !normalizedFilePath.includes("/")) {
		const fileNameLower = normalizedFilePath.toLowerCase();
		file =
			plugin.app.vault.getFiles().find((candidate) => candidate.name === normalizedFilePath) ??
			plugin.app.vault.getFiles().find((candidate) => candidate.name.toLowerCase() === fileNameLower) ??
			null;
	}

	if (!file) return null;

	const ext = file.extension.toLowerCase();
	if (!allowedExtensions.has(ext)) {
		return null;
	}

	return {
		file,
		startLine: lineFragment?.startLine ?? 0,
		endLine: lineFragment?.endLine ?? 0,
	};
}

function splitFileLines(content: string): string[] {
	const lines = content.replace(/\r\n?/g, "\n").split("\n");
	// A terminal newline terminates the last real line; it is not an extra
	// source line for an explicit embed range.
	if (lines.length > 1 && lines[lines.length - 1] === "") {
		lines.pop();
	}
	return lines;
}

export function sliceFileContent(content: string, startLine: number, endLine: number): string {
	if (startLine <= 1 && endLine <= 0) {
		return content;
	}

	const lines = splitFileLines(content);
	const clampedStart = Math.min(Math.max(startLine, 1), lines.length);
	const clampedEnd = endLine > 0 ? Math.min(Math.max(endLine, clampedStart), lines.length) : lines.length;
	return lines.slice(clampedStart - 1, clampedEnd).join("\n");
}

export async function expandCodeEmbedsInMarkdown(
	plugin: CodeSpacePlugin,
	markdown: string,
	sourceFile: TFile
): Promise<string> {
	const allowedExtensions = collectAllowedExtensions(plugin);
	const lines = markdown.split("\n");
	const output: string[] = [];
	let activeFence: { marker: "`" | "~"; length: number } | null = null;

	for (const line of lines) {
		const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/);
		if (fenceMatch?.[2]) {
			const marker = fenceMatch[2][0] as "`" | "~";
			const length = fenceMatch[2].length;

			if (!activeFence) {
				activeFence = { marker, length };
			} else if (activeFence.marker === marker && length >= activeFence.length) {
				activeFence = null;
			}

			output.push(line);
			continue;
		}

		if (activeFence) {
			output.push(line);
			continue;
		}

		const embedMatch = line.match(/^([>\s]*)!\[\[([^\]]+)\]\]\s*$/);
		if (!embedMatch?.[2]) {
			output.push(line);
			continue;
		}

		const indent = embedMatch[1] ?? "";
		const rawReference = embedMatch[2].trim();
		const resolved = resolveCodeEmbedReference(plugin, rawReference, sourceFile.path, allowedExtensions);
		if (!resolved) {
			output.push(line);
			continue;
		}

		const { text: fullContent } = await readFileDecoded(plugin.app, resolved.file);
		const slicedContent = sliceFileContent(fullContent, resolved.startLine, resolved.endLine);
		const fencedCode = createFencedCodeBlock(slicedContent, resolved.file.extension.toLowerCase());
		output.push(indentMultiline(fencedCode, indent));
	}

	return output.join("\n");
}
