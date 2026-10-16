// A vim-style ":" command line at the bottom of the window.
import { completeEx } from "./exline";

export interface CommandLineOptions {
	history: readonly string[];
	exNames: () => Iterable<string>;
	commandIds: () => Iterable<string>;
	/** Called after the line closes, with the text typed (not called on cancel). */
	onSubmit: (line: string) => void;
}

interface Completion {
	start: number;
	/** Text after the completed word, kept while cycling. */
	rest: string;
	/** What the user had typed in place of the candidate. */
	typed: string;
	candidates: string[];
	/** -1: showing the typed text. */
	index: number;
}

export class CommandLine {
	private el: HTMLElement;
	private input: HTMLInputElement;
	private wildmenu: HTMLElement;
	private restoreFocus: Element | null;
	private closed = false;
	private completion: Completion | null = null;
	/** History browsing: entries matching the prefix typed before the first Up. */
	private historyPos = -1;
	private historyPrefix = "";

	constructor(
		private doc: Document,
		private opts: CommandLineOptions,
	) {
		this.restoreFocus = doc.activeElement;
		this.el = doc.body.createDiv({ cls: "vimrc-outside-cmdline" });
		this.wildmenu = this.el.createDiv({ cls: "vimrc-outside-wildmenu" });
		this.wildmenu.hide();
		const row = this.el.createDiv({ cls: "vimrc-outside-cmdline-row" });
		row.createSpan({ text: ":", cls: "vimrc-outside-cmdline-prompt" });
		this.input = row.createEl("input", { type: "text", cls: "vimrc-outside-cmdline-input" });
		this.input.spellcheck = false;
		this.input.setAttr("autocomplete", "off");

		this.input.addEventListener("keydown", (e) => this.onKeyDown(e));
		this.input.addEventListener("input", () => {
			this.completion = null;
			this.historyPos = -1;
			this.renderWildmenu();
		});
		this.input.addEventListener("blur", () => this.close());
		this.input.focus();
	}

	close(): void {
		if (this.closed) return;
		this.closed = true;
		this.el.remove();
		const prev = this.restoreFocus;
		if (prev instanceof HTMLElement && prev.isConnected && prev !== this.doc.body) prev.focus();
	}

	private onKeyDown(e: KeyboardEvent): void {
		if (e.isComposing || e.keyCode === 229) return;
		const plain = !e.ctrlKey && !e.altKey && !e.metaKey;
		let handled = true;
		if (e.key === "Enter" && plain) {
			const line = this.input.value;
			this.close();
			this.opts.onSubmit(line);
		} else if (e.key === "Escape" || (e.key === "[" && e.ctrlKey)) {
			this.close();
		} else if (e.key === "Backspace" && plain && this.input.value === "") {
			this.close(); // like vim, backspacing over the ":" leaves the command line
		} else if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
			this.complete(e.shiftKey ? -1 : 1);
		} else if ((e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) && !e.altKey) {
			this.browseHistory(1);
		} else if ((e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) && !e.altKey) {
			this.browseHistory(-1);
		} else {
			handled = false;
		}
		if (handled) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	private complete(step: 1 | -1): void {
		if (!this.completion) {
			const pos = this.input.selectionStart ?? this.input.value.length;
			const before = this.input.value.slice(0, pos);
			const { start, candidates } = completeEx(before, this.opts.exNames(), this.opts.commandIds());
			if (candidates.length === 0) return;
			this.completion = {
				start,
				rest: this.input.value.slice(pos),
				typed: before.slice(start),
				candidates,
				index: -1,
			};
		}
		const c = this.completion;
		const n = c.candidates.length;
		// Cycle through candidates and back to the typed text, like vim's wildmenu.
		c.index = ((c.index + 1 + step + n + 1) % (n + 1)) - 1;
		const word = c.index < 0 ? c.typed : c.candidates[c.index];
		const head = this.input.value.slice(0, c.start) + word;
		this.input.value = head + c.rest;
		this.input.setSelectionRange(head.length, head.length);
		if (n === 1) this.completion = null; // a single match is just inserted
		this.renderWildmenu(c);
	}

	private renderWildmenu(c: Completion | null = null): void {
		this.wildmenu.empty();
		if (!c || c.candidates.length < 2) {
			this.wildmenu.hide();
			return;
		}
		this.wildmenu.show();
		c.candidates.forEach((cand, i) => {
			const item = this.wildmenu.createSpan({ text: cand, cls: "vimrc-outside-wildmenu-item" });
			if (i === c.index) {
				item.addClass("is-selected");
				item.scrollIntoView({ block: "nearest", inline: "nearest" });
			}
		});
	}

	private browseHistory(step: 1 | -1): void {
		if (this.historyPos === -1) this.historyPrefix = this.input.value;
		const matches = this.opts.history.filter((h) => h.startsWith(this.historyPrefix));
		const next = this.historyPos + step;
		if (next < -1 || next >= matches.length) return;
		this.historyPos = next;
		this.input.value = next === -1 ? this.historyPrefix : matches[next];
		const end = this.input.value.length;
		this.input.setSelectionRange(end, end);
		this.completion = null;
		this.renderWildmenu();
	}
}
