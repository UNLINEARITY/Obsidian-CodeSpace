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
		case "c":
		case "cpp":
		case "cc":
		case "cxx":
		case "h":
		case "hpp":
			return parseCpp(lines);
		case "java":
			return parseJava(lines);
		case "cs":
			return parseCSharp(lines);
		case "go":
			return parseGo(lines);
		case "rs":
			return parseRust(lines);
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

// C/C++ 解析器 (Improved)
function parseCpp(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	// Class/Struct: class Name or struct Name
	const classRegex = /^\s*(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/;
	
	// Function: ReturnType FunctionName(Args...)
	// Allow pointers (*), references (&), namespaces (::), templates (<>) in return type
	// Simplified regex: Look for "Word(" at start of line (ignoring return type complexity)
	// Or stricter: Return type followed by Name(
	const funcRegex = /^\s*(?:(?:[\w:*&<>]|::)+\s+)+([*&]?\w+|operator\s*[^(\s]+)\s*\(/;

	// Macros like #define
	const macroRegex = /^\s*#define\s+([A-Za-z_][A-Za-z0-9_]*)/;

	lines.forEach((line, index) => {
		// Ignore comments
		if (line.trim().startsWith("//") || line.trim().startsWith("/*")) return;

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
			// Filter out common control keywords that look like functions
			const keywords = ["if", "for", "while", "switch", "catch", "return", "sizeof"];
			if (!keywords.includes(funcMatch[1])) {
				symbols.push({
					name: funcMatch[1],
					type: "function",
					line: index + 1
				});
			}
			return;
		}

		const macroMatch = line.match(macroRegex);
		if (macroMatch && macroMatch[1]) {
			symbols.push({
				name: macroMatch[1],
				type: "method", // Reuse method icon for macros
				line: index + 1
			});
		}
	});

	return symbols;
}

// Java 解析器
function parseJava(lines: string[]): CodeSymbol[] {
	// ... (Keep existing Java logic) ...
	const symbols: CodeSymbol[] = [];
	const classRegex = /^\s*(?:public|private|protected)?\s*(?:abstract\s+)?(?:class|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const methodRegex = /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:[\w<>[\]]+\s+)+(\w+)\s*\([^)]*\)/;

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

		const methodMatch = line.match(methodRegex);
		if (methodMatch && methodMatch[1]) {
			const keywords = ["if", "for", "while", "switch", "catch", "new", "return"];
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

// C# 解析器 (Based on Java but tailored)
function parseCSharp(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	const classRegex = /^\s*(?:public|private|protected|internal)?\s*(?:static\s+|sealed\s+|abstract\s+|partial\s+)*(?:class|interface|enum|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/;
	const methodRegex = /^\s*(?:public|private|protected|internal)?\s*(?:static\s+|virtual\s+|override\s+|async\s+|unsafe\s+)*(?:[\w<>[\]?]+\s+)+(\w+)\s*\(/;
	const namespaceRegex = /^\s*namespace\s+([\w.]+)/;

	lines.forEach((line, index) => {
		const nsMatch = line.match(namespaceRegex);
		if (nsMatch && nsMatch[1]) {
			symbols.push({
				name: nsMatch[1],
				type: "class", // Use class icon for namespace
				line: index + 1
			});
			return;
		}

		const classMatch = line.match(classRegex);
		if (classMatch && classMatch[1]) {
			symbols.push({
				name: classMatch[1],
				type: "class",
				line: index + 1
			});
			return;
		}

		const methodMatch = line.match(methodRegex);
		if (methodMatch && methodMatch[1]) {
			const keywords = ["if", "for", "while", "switch", "catch", "new", "return", "using", "foreach", "lock", "fixed"];
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

// Go 解析器
function parseGo(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	// func FunctionName(...)
	const funcRegex = /^func\s+(\w+)\s*\(/;
	// func (r Receiver) MethodName(...)
	const methodRegex = /^func\s*\([^)]+\)\s*(\w+)\s*\(/;
	// type Name struct/interface
	const typeRegex = /^type\s+(\w+)\s+(?:struct|interface)/;

	lines.forEach((line, index) => {
		const funcMatch = line.match(funcRegex);
		if (funcMatch && funcMatch[1]) {
			symbols.push({
				name: funcMatch[1],
				type: "function",
				line: index + 1
			});
			return;
		}

		const methodMatch = line.match(methodRegex);
		if (methodMatch && methodMatch[1]) {
			symbols.push({
				name: methodMatch[1],
				type: "method",
				line: index + 1
			});
			return;
		}

		const typeMatch = line.match(typeRegex);
		if (typeMatch && typeMatch[1]) {
			symbols.push({
				name: typeMatch[1],
				type: "class",
				line: index + 1
			});
		}
	});

	return symbols;
}

// Rust 解析器
function parseRust(lines: string[]): CodeSymbol[] {
	const symbols: CodeSymbol[] = [];
	// fn function_name
	const funcRegex = /^\s*(?:pub\s+)?(?:unsafe\s+|async\s+|const\s+|extern\s+)*fn\s+(\w+)/;
	// struct/enum/trait Name
	const typeRegex = /^\s*(?:pub\s+)?(?:struct|enum|trait|type)\s+(\w+)/;
	// impl Name
	const implRegex = /^\s*impl(?:<[^>]+>)?\s+(?:[\w:]+\s+for\s+)?([\w:]+)/;
	// macro_rules! name
	const macroRegex = /^\s*macro_rules!\s+(\w+)/;

	lines.forEach((line, index) => {
		const funcMatch = line.match(funcRegex);
		if (funcMatch && funcMatch[1]) {
			symbols.push({
				name: funcMatch[1],
				type: "function",
				line: index + 1
			});
			return;
		}

		const typeMatch = line.match(typeRegex);
		if (typeMatch && typeMatch[1]) {
			symbols.push({
				name: typeMatch[1],
				type: "class",
				line: index + 1
			});
			return;
		}

		const implMatch = line.match(implRegex);
		if (implMatch && implMatch[1]) {
			symbols.push({
				name: `impl ${implMatch[1]}`,
				type: "class",
				line: index + 1
			});
			return;
		}

		const macroMatch = line.match(macroRegex);
		if (macroMatch && macroMatch[1]) {
			symbols.push({
				name: macroMatch[1] + "!",
				type: "method",
				line: index + 1
			});
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
