// Matches typed key tokens against mapping left-hand sides, like vim's mapping engine with
// 'timeout' on: a complete match that is also a prefix of a longer mapping waits for the timeout.

interface Node {
	children: Map<string, Node>;
	command?: string;
}

export interface FeedResult {
	/** Commands to run now, in order. */
	run: string[];
	/** Whether the key was used (the caller should swallow the event). */
	consumed: boolean;
}

const ESC = "<Esc>";

export class Matcher {
	private root: Node = { children: new Map() };
	private pending: string[] = [];

	constructor(mappings: Iterable<{ keys: string[]; commandId: string }>) {
		for (const m of mappings) {
			if (m.keys.length === 0) continue;
			let node = this.root;
			for (const k of m.keys) {
				let next = node.children.get(k);
				if (!next) {
					next = { children: new Map() };
					node.children.set(k, next);
				}
				node = next;
			}
			node.command = m.commandId;
		}
	}

	/** Keys typed so far toward an unfinished mapping. */
	get pendingKeys(): readonly string[] {
		return this.pending;
	}

	/** True while keys are waiting (the caller should start or restart the timeout). */
	get isPending(): boolean {
		return this.pending.length > 0;
	}

	feed(token: string): FeedResult {
		if (token === ESC && this.pending.length > 0 && !this.walk([...this.pending, token])) {
			this.reset();
			return { run: [], consumed: true };
		}
		const seq = [...this.pending, token];
		const node = this.walk(seq);
		if (node) return this.advance(seq, node, []);

		// No mapping continues this way. Like vim, run a complete shorter match, then treat the
		// key as the start of a new sequence.
		const run: string[] = [];
		const prev = this.pending.length > 0 ? this.walk(this.pending) : null;
		if (prev?.command) run.push(prev.command);
		this.reset();
		const fresh = this.walk([token]);
		if (fresh) return this.advance([token], fresh, run);
		// The key itself still does whatever it normally does.
		return { run, consumed: false };
	}

	/** Called when the timeout expires: runs a complete match that was waiting, if any. */
	timeout(): string | null {
		const node = this.pending.length > 0 ? this.walk(this.pending) : null;
		this.reset();
		return node?.command ?? null;
	}

	reset(): void {
		this.pending = [];
	}

	private advance(seq: string[], node: Node, run: string[]): FeedResult {
		if (node.children.size === 0) {
			this.reset();
			if (node.command) run.push(node.command);
		} else {
			this.pending = seq;
		}
		return { run, consumed: true };
	}

	private walk(seq: readonly string[]): Node | null {
		let node: Node | undefined = this.root;
		for (const k of seq) {
			node = node.children.get(k);
			if (!node) return null;
		}
		return node;
	}
}
