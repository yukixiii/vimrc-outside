// Key notation shared by vimrc left-hand sides and keyboard events.
// A key is a "token": a single printable character ("a", ",", "Z"), or a bracketed name with
// modifiers in a fixed order, C (Ctrl), A (Alt), D (Meta/Cmd), S (Shift): "<Space>", "<C-w>", "<C-S-x>".

/** Bracket names accepted in a vimrc (lower-cased) → canonical name. */
const NAMED: Record<string, string> = {
	space: "Space",
	cr: "CR",
	enter: "CR",
	return: "CR",
	esc: "Esc",
	tab: "Tab",
	bs: "BS",
	del: "Del",
	up: "Up",
	down: "Down",
	left: "Left",
	right: "Right",
	home: "Home",
	end: "End",
	pageup: "PageUp",
	pagedown: "PageDown",
	insert: "Insert",
};
for (let i = 1; i <= 12; i++) NAMED[`f${i}`] = `F${i}`;

/** Bracket names that stand for a printable character. */
const CHAR_NAMED: Record<string, string> = { lt: "<", bslash: "\\", bar: "|" };

/** KeyboardEvent.key → canonical name, for non-printable keys. */
const EVENT_NAMED: Record<string, string> = {
	" ": "Space",
	Enter: "CR",
	Escape: "Esc",
	Tab: "Tab",
	Backspace: "BS",
	Delete: "Del",
	ArrowUp: "Up",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	Home: "Home",
	End: "End",
	PageUp: "PageUp",
	PageDown: "PageDown",
	Insert: "Insert",
};
for (let i = 1; i <= 12; i++) EVENT_NAMED[`F${i}`] = `F${i}`;

const MOD_ORDER = ["C", "A", "D", "S"] as const;
type Mod = (typeof MOD_ORDER)[number];

/**
 * Build the canonical token for a key and its modifiers.
 * `key` is a single character or a canonical name ("Space", "CR", ...).
 */
export function makeToken(key: string, mods: Set<Mod>): string {
	const m = new Set(mods);
	if (key.length === 1) {
		const letter = /^[a-z]$/i.test(key);
		// The character already reflects Shift, so Shift only matters for letters with Ctrl/Alt/Meta.
		if (!letter) m.delete("S");
		if (m.has("C") || m.has("A") || m.has("D")) {
			if (letter && key !== key.toLowerCase()) m.add("S");
			key = letter ? key.toLowerCase() : key;
		} else {
			// Plain character: "A" is already Shift+a.
			if (m.size === 0 || (m.size === 1 && m.has("S"))) return key;
		}
		if (m.size === 0) return key;
	}
	const prefix = MOD_ORDER.filter((x) => m.has(x))
		.map((x) => `${x}-`)
		.join("");
	return `<${prefix}${key}>`;
}

/** Split a vimrc left-hand side ("<C-w>l", ",r", "g,<Space>") into tokens. */
export function parseKeys(lhs: string): string[] {
	const tokens: string[] = [];
	let i = 0;
	while (i < lhs.length) {
		if (lhs[i] === "<") {
			const close = lhs.indexOf(">", i + 1);
			const tok = close > i + 1 ? parseBracket(lhs.slice(i + 1, close)) : null;
			if (tok) {
				tokens.push(tok);
				i = close + 1;
				continue;
			}
		}
		// Unknown "<...>" is taken literally, character by character, like vim does.
		tokens.push(lhs[i]);
		i++;
	}
	return tokens;
}

function parseBracket(inner: string): string | null {
	const mods = new Set<Mod>();
	let rest = inner;
	for (;;) {
		const m = /^([cCaAmMdDsS])-(.+)$/.exec(rest);
		if (!m) break;
		const mod = m[1].toUpperCase();
		mods.add(mod === "M" ? "A" : (mod as Mod));
		rest = m[2];
	}
	const lower = rest.toLowerCase();
	if (rest.length === 1) {
		if (mods.size === 0) return null; // "<x>" is not a key name
		// Like vim, <C-W> is <C-w>; Shift has to be spelled out (<C-S-w>).
		return makeToken(mods.has("C") ? rest.toLowerCase() : rest, mods);
	}
	if (lower in CHAR_NAMED) return makeToken(CHAR_NAMED[lower], mods);
	if (lower in NAMED) return makeToken(NAMED[lower], mods);
	return null;
}

export interface KeyLike {
	key: string;
	ctrlKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

/** Token for a keydown event, or null for lone modifier presses and keys we don't name. */
export function eventToken(e: KeyLike): string | null {
	let key: string;
	if (e.key.length === 1 && e.key !== " ") key = e.key;
	else if (e.key in EVENT_NAMED) key = EVENT_NAMED[e.key];
	else return null; // Shift, Control, Dead, Unidentified, ...
	const mods = new Set<Mod>();
	if (e.ctrlKey) mods.add("C");
	if (e.altKey) mods.add("A");
	if (e.metaKey) mods.add("D");
	if (e.shiftKey) mods.add("S");
	return makeToken(key, mods);
}
