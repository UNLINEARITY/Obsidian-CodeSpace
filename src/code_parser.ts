import { TFile } from "obsidian";

// 代码符号接口
export interface CodeSymbol {
	name: string;
	type: "function" | "class" | "method";
	line: number;
}

// 解析代码文件，提取符号
export function parseCodeSymbols(file: TFile, content: string): CodeSymbol[] {
	const ext = file.extension.toLowerCase();
	const lines = content.split("\n");

	// 根据文件扩展名选择解析器
	switch (ext) {
		case "py":
			return parsePython(lines);
		case "js":
		case "ts":
		case "jsx":
		case "tsx":
		case "mjs":
		case "cjs":
			return parseJavaScript(lines);
		case "cpp":
		case "cc":
		case "cxx":
		case "h":
		case "hpp":
			return parseCpp(lines);
		case "java":
			return parseJava(lines);
		case "php":
			return parsePhp(lines);
		default:
			return [];
	}
}

// Python 解析器
function parsePython(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	const classRegex = /^class\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const funcRegex = /^def\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const methodRegex = /^\s+def\s+([A-Za-z_][A-Za-z0-9_]*)/;
	let currentClass: string | null = null;

	lines.forEach((line, index) => {
		const classMatch = line.match(classRegex);
		if (classMatch && classMatch[1]) {
			currentClass = classMatch[1];
			symbols.push({
				name: currentClass,
				type: "class",
				line: index + 1
			});
			return;
		}

		const methodMatch = line.match(methodRegex);
		if (methodMatch && methodMatch[1] && currentClass) {
			symbols.push({
				name: `${currentClass}.${methodMatch[1]}`,
				type: "method",
				line: index + 1
			});
			return;
		}

		const funcMatch = line.match(funcRegex);
		if (funcMatch && funcMatch[1]) {
			currentClass = null;
			symbols.push({
				name: funcMatch[1],
				type: "function",
				line: index + 1
			});
		}
	});

	return symbols;
}

// JavaScript/TypeScript 解析器
function parseJavaScript(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	const classRegex = /^class\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const funcRegex = /^function\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const arrowFuncRegex = /^(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:\(.*\)|[A-Za-z_][A-Za-z0-9_]*)\s*=>/;

	lines.forEach((line, index) => {
		const classMatch = line.match(classRegex);
		if (classMatch && classMatch[1]) {
			symbols.push({
				name: classMatch[1],
				type: "class",
				line: index + 1
			});
			return;
		}

		const funcMatch = line.match(funcRegex);
		if (funcMatch && funcMatch[1]) {
			symbols.push({
				name: funcMatch[1],
				type: "function",
				line: index + 1
			});
			return;
		}

		const arrowMatch = line.match(arrowFuncRegex);
		if (arrowMatch && arrowMatch[1] && line.includes("=>")) {
			symbols.push({
				name: arrowMatch[1],
				type: "function",
				line: index + 1
			});
		}
	});

	return symbols;
}

// C++ 解析器
function parseCpp(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	const classRegex = /^class\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const funcRegex = /^(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*(?:const\s*)?{/;

	lines.forEach((line, index) => {
		const classMatch = line.match(classRegex);
		if (classMatch && classMatch[1]) {
			symbols.push({
				name: classMatch[1],
				type: "class",
				line: index + 1
			});
			return;
		}

		const funcMatch = line.match(funcRegex);
		if (funcMatch && funcMatch[1] && !line.includes("//")) {
			// 排除关键字
			const keywords = ["if", "for", "while", "switch", "catch"];
			if (!keywords.includes(funcMatch[1])) {
				symbols.push({
					name: funcMatch[1],
					type: "function",
					line: index + 1
				});
			}
		}
	});

	return symbols;
}

// Java 解析器
function parseJava(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	const classRegex = /^(?:public|private|protected)?\s*(?:abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const interfaceRegex = /^(?:public|private|protected)?\s*interface\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const methodRegex = /^(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)/;

	lines.forEach((line, index) => {
		const classMatch = line.match(classRegex);
		if (classMatch && classMatch[1]) {
			symbols.push({
				name: classMatch[1],
				type: "class",
				line: index + 1
			});
			return;
		}

		const interfaceMatch = line.match(interfaceRegex);
		if (interfaceMatch && interfaceMatch[1]) {
			symbols.push({
				name: interfaceMatch[1],
				type: "class",
				line: index + 1
			});
			return;
		}

		const methodMatch = line.match(methodRegex);
		if (methodMatch && methodMatch[1]) {
			const keywords = ["if", "for", "while", "switch", "catch"];
			if (!keywords.includes(methodMatch[1])) {
				symbols.push({
					name: methodMatch[1],
					type: "method",
					line: index + 1
				});
			}
		}
	});

	return symbols;
}

// PHP 解析器
function parsePhp(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	const classRegex = /^class\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const funcRegex = /^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/;
	const methodRegex = /^\s+(?:public|private|protected)?\s*(?:static\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)/;

	let currentClass: string | null = null;

	lines.forEach((line, index) => {
		const classMatch = line.match(classRegex);
		if (classMatch && classMatch[1]) {
			currentClass = classMatch[1];
			symbols.push({
				name: currentClass,
				type: "class",
				line: index + 1
			});
			return;
		}

		const methodMatch = line.match(methodRegex);
		if (methodMatch && methodMatch[1] && currentClass) {
			symbols.push({
				name: `${currentClass}.${methodMatch[1]}`,
				type: "method",
				line: index + 1
			});
			return;
		}

		const funcMatch = line.match(funcRegex);
		if (funcMatch && funcMatch[1]) {
			currentClass = null;
			symbols.push({
				name: funcMatch[1],
				type: "function",
				line: index + 1
			});
		}
	});

	return symbols;
}
