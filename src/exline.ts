// Interprets a line typed on the ":" command line, using the vimrc's exmaps.

export type ExResult =
	| { kind: "empty" }
	| { kind: "command"; id: string }
	/** An exmap that needs the editor (surround, pasteinto, ...). */
	| { kind: "editor-only"; name: string }
	| { kind: "unknown"; name: string };

export interface ExTable {
	exCommands: ReadonlyMap<string, string>;
	editorExCommands: ReadonlySet<string>;
}

/** Ex commands Vimrc Support adds that work on the editor. */
const EDITOR_BUILTINS = new Set(["surround", "pasteinto", "jscommand", "jsfile", "cmcommand", "sendkeys"]);

export function parseExLine(line: string, table: ExTable): ExResult {
	// Like vim, leading colons and spaces are ignored.
	const words = line.replace(/^[\s:]+/, "").trim().split(/\s+/);
	const name = words[0] ?? "";
	if (name === "") return { kind: "empty" };
	if (name === "obcommand") {
		return words[1] ? { kind: "command", id: words[1] } : { kind: "unknown", name: line.trim() };
	}
	const id = table.exCommands.get(name);
	if (id && words.length === 1) return { kind: "command", id };
	if (table.editorExCommands.has(name) || EDITOR_BUILTINS.has(name)) return { kind: "editor-only", name };
	return { kind: "unknown", name };
}

/**
 * Completion candidates for the text before the cursor. Returns the start of the word being
 * completed and the sorted candidates that begin with it.
 */
export function completeEx(
	text: string,
	exNames: Iterable<string>,
	commandIds: Iterable<string>,
): { start: number; candidates: string[] } {
	const m = /^(\s*:*\s*)(\S*)$/.exec(text);
	if (m) {
		const prefix = m[2];
		const names = new Set([...exNames, "obcommand"]);
		return { start: m[1].length, candidates: [...names].filter((n) => n.startsWith(prefix)).sort() };
	}
	const ob = /^(\s*:*\s*obcommand\s+)(\S*)$/.exec(text);
	if (ob) {
		const prefix = ob[2];
		return { start: ob[1].length, candidates: [...commandIds].filter((id) => id.startsWith(prefix)).sort() };
	}
	return { start: text.length, candidates: [] };
}
