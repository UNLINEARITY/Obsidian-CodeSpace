import { describe, expect, it, vi } from "vitest";
import { EditorState, Text } from "@codemirror/state";
import type { TransactionSpec } from "@codemirror/state";
import { CodeSpaceView } from "../src/code_view";
import type { TFile } from "obsidian";
import type { DecodedFile } from "../src/encoding";

vi.mock("../src/main", () => ({ default: class {} }));
vi.mock("../src/terminal/terminal_panel", () => ({ TerminalPanel: class {} }));
vi.mock("obsidian", async (importOriginal) => ({
	...await importOriginal<Record<string, unknown>>(),
	TextFileView: class {},
}));
vi.mock("../src/encoding", async (importOriginal) => ({
	...await importOriginal<Record<string, unknown>>(),
	readFileDecoded: vi.fn(),
}));
import { readFileDecoded } from "../src/encoding";

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => { resolve = done; });
	return { promise, resolve };
}

interface ViewHarness {
	file: TFile;
	app: { vault: { modify: ReturnType<typeof vi.fn> } };
	editorView: { state: EditorState; dispatch(spec: TransactionSpec): void };
	isDirty: boolean;
	isClosed: boolean;
	decodeSeq: number;
	externalConflict: boolean;
	activeEncoding: string;
	activeHadBOM: boolean;
	data: string;
	savedDoc: Text;
	getPlugin(): undefined;
	updateTitle(): void;
	syncEncodingBadge(): void;
	loadFileContent(): Promise<void>;
	convertToUtf8(): Promise<void>;
	scheduleDecodedLoad(): void;
	pendingDecode: Promise<void> | null;
}

function makeView(): ViewHarness {
	const view = Object.create(CodeSpaceView.prototype) as ViewHarness;
	Object.assign(view, {
		file: { path: "a.py", name: "a.py", stat: { mtime: 1 } },
		app: { vault: { modify: vi.fn().mockResolvedValue(undefined) } },
		isDirty: false, isClosed: false, decodeSeq: 0, externalConflict: false,
		activeEncoding: "utf-16le", activeHadBOM: true, data: "original",
		getPlugin: () => undefined, updateTitle: () => {}, syncEncodingBadge: () => {},
	});
	view.editorView = {
		state: EditorState.create({ doc: "original" }),
		dispatch(spec) { this.state = this.state.update(spec).state; },
	};
	view.savedDoc = view.editorView.state.doc;
	return view;
}

const decoded: DecodedFile = { text: "disk", encoding: "utf-8", hadBOM: false, detected: "strict-utf8" };

describe("CodeSpaceView asynchronous file operations", () => {
	it("keeps edits made while reloading", async () => {
		const read = deferred<DecodedFile>();
		vi.mocked(readFileDecoded).mockReturnValueOnce(read.promise);
		const view = makeView();
		const loading = view.loadFileContent();
		view.editorView.dispatch({ changes: { from: 0, to: 8, insert: "local edit" } });
		view.isDirty = true;
		read.resolve(decoded);
		await loading;
		expect(view.editorView.state.doc.toString()).toBe("local edit");
		expect(view.isDirty).toBe(true);
		expect(view.externalConflict).toBe(true);
	});

	it.each(["switch", "close"])("ignores a reload after %s", async (action) => {
		const read = deferred<DecodedFile>();
		vi.mocked(readFileDecoded).mockReturnValueOnce(read.promise);
		const view = makeView();
		const loading = view.loadFileContent();
		if (action === "switch") view.file = { path: "b.py" } as TFile;
		else view.isClosed = true;
		read.resolve(decoded);
		await loading;
		expect(view.editorView.state.doc.toString()).toBe("original");
	});

	it("ignores an older reload that finishes last", async () => {
		const oldRead = deferred<DecodedFile>();
		vi.mocked(readFileDecoded).mockReturnValueOnce(oldRead.promise).mockResolvedValueOnce(decoded);
		const view = makeView();
		const older = view.loadFileContent();
		await view.loadFileContent();
		oldRead.resolve({ ...decoded, text: "stale" });
		await older;
		expect(view.editorView.state.doc.toString()).toBe("disk");
	});

	it("keeps edits made during the initial decoded load", async () => {
		const read = deferred<DecodedFile>();
		vi.mocked(readFileDecoded).mockReturnValueOnce(read.promise);
		const view = makeView();
		view.scheduleDecodedLoad();
		view.editorView.dispatch({ changes: { from: 8, insert: " edit" } });
		view.isDirty = true;
		read.resolve(decoded);
		await view.pendingDecode;
		expect(view.editorView.state.doc.toString()).toBe("original edit");
		expect(view.isDirty).toBe(true);
	});

	it.each([true, false])("tracks edits during UTF-8 conversion: %s", async (edit) => {
		const write = deferred<void>();
		const view = makeView();
		view.app.vault.modify.mockReturnValueOnce(write.promise);
		const saving = view.convertToUtf8();
		if (edit) view.editorView.dispatch({ changes: { from: 8, insert: " edit" } });
		write.resolve();
		await saving;
		expect(view.app.vault.modify).toHaveBeenCalledWith(view.file, "original");
		expect(view.activeEncoding).toBe("utf-8");
		expect(view.isDirty).toBe(edit);
		expect(view.savedDoc.toString()).toBe("original");
	});
});
