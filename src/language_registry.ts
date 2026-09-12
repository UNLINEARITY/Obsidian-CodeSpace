import type { Extension } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { powerShell } from "@codemirror/legacy-modes/mode/powershell";
import { cmake } from "@codemirror/legacy-modes/mode/cmake";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { diff } from "@codemirror/legacy-modes/mode/diff";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { kotlin } from "@codemirror/legacy-modes/mode/clike";
import { octave } from "@codemirror/legacy-modes/mode/octave";
import { fortran } from "@codemirror/legacy-modes/mode/fortran";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";
import { yaml } from "@codemirror/lang-yaml";
import { xml } from "@codemirror/lang-xml";
import { r } from "codemirror-lang-r";

const pythonLanguage = python();
const cppLanguage = cpp();
const javascriptLanguage = javascript();
const typescriptLanguage = javascript({ typescript: true });
const jsxLanguage = javascript({ jsx: true });
const tsxLanguage = javascript({ typescript: true, jsx: true });
const htmlLanguage = html();
const cssLanguage = css();
const sqlLanguage = sql();
const phpLanguage = php();
const rustLanguage = rust();
const javaLanguage = java();
const goLanguage = go();
const yamlLanguage = yaml();
const xmlLanguage = xml();
const rLanguage = r();
const kotlinLanguage = StreamLanguage.define(kotlin);
const octaveLanguage = StreamLanguage.define(octave);
const shellLanguage = StreamLanguage.define(shell);
const powerShellLanguage = StreamLanguage.define(powerShell);
const cmakeLanguage = StreamLanguage.define(cmake);
const dockerLanguage = StreamLanguage.define(dockerFile);
const diffLanguage = StreamLanguage.define(diff);
const luaLanguage = StreamLanguage.define(lua);
const perlLanguage = StreamLanguage.define(perl);
const rubyLanguage = StreamLanguage.define(ruby);
const fortranLanguage = StreamLanguage.define(fortran);

export const LANGUAGE_PACKAGES: Record<string, Extension> = {
	py: pythonLanguage,
	pyx: pythonLanguage,
	pxd: pythonLanguage,
	pxi: pythonLanguage,
	ipy: pythonLanguage,
	c: cppLanguage,
	cpp: cppLanguage,
	h: cppLanguage,
	hpp: cppLanguage,
	cc: cppLanguage,
	cxx: cppLanguage,
	ino: cppLanguage,
	pde: cppLanguage,
	nut: cppLanguage,
	cu: cppLanguage,
	cuh: cppLanguage,
	glsl: cppLanguage,
	vert: cppLanguage,
	frag: cppLanguage,
	hlsl: cppLanguage,
	mm: cppLanguage,
	swift: cppLanguage,
	js: javascriptLanguage,
	mjs: javascriptLanguage,
	cjs: javascriptLanguage,
	json: javascriptLanguage,
	json5: javascriptLanguage,
	jsonc: javascriptLanguage,
	vue: javascriptLanguage,
	svelte: javascriptLanguage,
	astro: javascriptLanguage,
	ts: typescriptLanguage,
	jsx: jsxLanguage,
	tsx: tsxLanguage,
	html: htmlLanguage,
	htm: htmlLanguage,
	xhtml: htmlLanguage,
	css: cssLanguage,
	scss: cssLanguage,
	sass: cssLanguage,
	less: cssLanguage,
	sql: sqlLanguage,
	php: phpLanguage,
	rs: rustLanguage,
	java: javaLanguage,
	cs: javaLanguage,
	scala: javaLanguage,
	groovy: javaLanguage,
	gradle: javaLanguage,
	go: goLanguage,
	yaml: yamlLanguage,
	yml: yamlLanguage,
	toml: yamlLanguage,
	ini: yamlLanguage,
	cfg: yamlLanguage,
	conf: yamlLanguage,
	xml: xmlLanguage,
	urdf: xmlLanguage,
	xacro: xmlLanguage,
	svg: xmlLanguage,
	xsd: xmlLanguage,
	xsl: xmlLanguage,
	xslt: xmlLanguage,
	wsdl: xmlLanguage,
	plist: xmlLanguage,
	csproj: xmlLanguage,
	vcxproj: xmlLanguage,
	props: xmlLanguage,
	targets: xmlLanguage,
	config: xmlLanguage,
	r: rLanguage,
	kt: kotlinLanguage,
	kts: kotlinLanguage,
	m: octaveLanguage,
	sh: shellLanguage,
	bash: shellLanguage,
	zsh: shellLanguage,
	ps1: powerShellLanguage,
	psm1: powerShellLanguage,
	psd1: powerShellLanguage,
	cmake: cmakeLanguage,
	dockerfile: dockerLanguage,
	diff: diffLanguage,
	patch: diffLanguage,
	lua: luaLanguage,
	pl: perlLanguage,
	pm: perlLanguage,
	rb: rubyLanguage,
	erb: rubyLanguage,
	f: fortranLanguage,
	for: fortranLanguage,
	f90: fortranLanguage,
	f95: fortranLanguage,
	f03: fortranLanguage,
	f08: fortranLanguage,
	md: [],
	txt: [],
};

export const EMBED_RENDERABLE_EXTENSIONS = new Set([
	"py", "c", "cpp", "h", "hpp", "cc", "cxx", "js", "ts", "jsx", "tsx", "json", "mjs", "cjs",
	"json5", "jsonc", "vue", "svelte", "astro", "html", "htm", "xhtml", "css", "scss", "sass", "less",
	"sql", "php", "rs", "java", "cs", "kt", "kts", "m", "go", "yaml", "yml", "xml", "urdf", "xacro",
	"svg", "xsd", "xsl", "xslt", "wsdl", "plist", "csproj", "vcxproj", "props", "targets", "config", "toml",
	"ini", "cfg", "conf", "f", "for", "f90", "f95", "f03", "f08",
]);
