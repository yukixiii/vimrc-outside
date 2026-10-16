// Reads the subset of a vimrc (as understood by obsidian-vimrc-support) that can work outside the
// editor: normal-mode mappings whose right-hand side runs an Obsidian command.
import { parseKeys } from "./keys";

export interface Mapping {
	/** Left-hand side as written in the vimrc. */
	lhs: string;
	keys: string[];
	commandId: string;
	/** 1-based line number of the mapping. */
	line: number;
}

export interface ParsedVimrc {
	mappings: Mapping[];
	/** Normal-mode mappings that were left out because they don't run an Obsidian command. */
	skipped: { lhs: string; rhs: string; line: number }[];
}

const MAP_COMMANDS = new Set(["map", "nmap", "noremap", "nnoremap", "nm", "nn", "no"]);
const UNMAP_COMMANDS = new Set(["unmap", "nunmap", "unm", "nun"]);
const MAP_ARGS = new Set(["<silent>", "<buffer>", "<nowait>", "<expr>", "<unique>", "<special>", "<script>"]);

export function parseVimrc(text: string): ParsedVimrc {
	const exCommands = new Map<string, string>();
	// Keyed by the joined tokens so "<C-W>l" and "<C-w>l" are the same mapping.
	const pending = new Map<string, { lhs: string; keys: string[]; rhs: string; line: number }>();

	text.split(/\r?\n/).forEach((raw, idx) => {
		const line = raw.trim();
		if (line === "" || line.startsWith('"')) return;
		const words = line.split(/\s+/);
		const cmd = words[0];
		if (cmd === "exmap") {
			// exmap <name> obcommand <id>
			if (words[2] === "obcommand" && words[3]) exCommands.set(words[1], words[3]);
			else exCommands.delete(words[1]);
			return;
		}
		if (MAP_COMMANDS.has(cmd)) {
			let i = 1;
			while (i < words.length && MAP_ARGS.has(words[i].toLowerCase())) i++;
			const lhs = words[i];
			if (!lhs) return;
			const rhs = words.slice(i + 1).join(" ");
			if (rhs === "") return; // ":map x" only lists mappings
			const keys = parseKeys(lhs);
			const id = keys.join("\u0000");
			pending.delete(id); // re-insert so the latest definition keeps file order
			pending.set(id, { lhs, keys, rhs, line: idx + 1 });
			return;
		}
		if (UNMAP_COMMANDS.has(cmd) && words[1]) {
			pending.delete(parseKeys(words[1]).join("\u0000"));
		}
	});

	const result: ParsedVimrc = { mappings: [], skipped: [] };
	// Ex commands resolve when the mapping runs, so a mapping may refer to an exmap defined later.
	for (const m of pending.values()) {
		const id = commandFor(m.rhs, exCommands);
		if (id) result.mappings.push({ lhs: m.lhs, keys: m.keys, commandId: id, line: m.line });
		else result.skipped.push({ lhs: m.lhs, rhs: m.rhs, line: m.line });
	}
	return result;
}

/** The command a right-hand side runs: ":<exmap name><CR>" or ":obcommand <id><CR>". */
function commandFor(rhs: string, exCommands: Map<string, string>): string | null {
	const m = /^:(\S+)(?:\s+(\S+))?\s*<cr>$/i.exec(rhs.trim());
	if (!m) return null;
	if (m[1] === "obcommand") return m[2] ?? null;
	if (m[2] !== undefined) return null;
	return exCommands.get(m[1]) ?? null;
}
