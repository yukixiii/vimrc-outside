import { Notice, Plugin } from "obsidian";
import { shouldHandle } from "./context";
import { eventToken } from "./keys";
import { Matcher } from "./matcher";
import { loadSettings, VimrcOutsideSettingTab, type VimrcOutsideSettings } from "./settings";
import { parseVimrc, type Mapping } from "./vimrc";

const DEFAULT_VIMRC = ".obsidian.vimrc";
const VIMRC_SUPPORT_ID = "obsidian-vimrc-support";

export default class VimrcOutsidePlugin extends Plugin {
	settings!: VimrcOutsideSettings;
	loaded: { mappings: Mapping[]; error: string | null } = { mappings: [], error: null };
	private matcher = new Matcher([]);
	private timer: number | null = null;
	private statusEl: HTMLElement | null = null;
	/** mtime of the vimrc when it was last read, for reloading on window focus. */
	private loadedMtime: number | null = null;
	private loadedPath = "";

	async onload(): Promise<void> {
		this.settings = loadSettings(await this.loadData());
		this.addSettingTab(new VimrcOutsideSettingTab(this.app, this));
		this.statusEl = this.addStatusBarItem();
		this.statusEl.addClass("vimrc-outside-pending");
		this.statusEl.hide();

		this.addCommand({
			id: "reload-vimrc",
			name: "Reload vimrc",
			callback: () => this.reloadVimrc(true),
		});

		this.listen(window);
		this.registerEvent(this.app.workspace.on("window-open", (_w, win) => this.listen(win)));
		this.register(() => this.clearPending());

		// After layout ready, so Vimrc Support's settings are loaded.
		this.app.workspace.onLayoutReady(() => this.reloadVimrc(false));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/** The vimrc to read: ours if set, else Vimrc Support's, else the default name. */
	vimrcPath(): string {
		if (this.settings.vimrcPath) return this.settings.vimrcPath;
		const name = this.app.plugins?.plugins?.[VIMRC_SUPPORT_ID]?.settings?.vimrcFileName;
		return typeof name === "string" && name.trim() !== "" ? name : DEFAULT_VIMRC;
	}

	async reloadVimrc(notify: boolean): Promise<void> {
		const path = this.vimrcPath();
		const adapter = this.app.vault.adapter;
		try {
			if (!(await adapter.exists(path))) throw new Error(`${path} not found`);
			const stat = await adapter.stat(path);
			const parsed = parseVimrc(await adapter.read(path));
			this.loaded = { mappings: parsed.mappings, error: null };
			this.loadedMtime = stat?.mtime ?? null;
			if (parsed.skipped.length > 0) {
				console.debug(`vimrc-outside: skipped ${parsed.skipped.length} mappings that don't run an Obsidian command`, parsed.skipped);
			}
		} catch (e) {
			this.loaded = { mappings: [], error: `Could not read the vimrc: ${(e as Error).message}` };
			this.loadedMtime = null;
		}
		this.loadedPath = path;
		this.clearPending();
		this.matcher = new Matcher(this.loaded.mappings);
		if (notify) new Notice(this.loaded.error ?? `vimrc-outside: loaded ${this.loaded.mappings.length} mappings from ${path}`);
	}

	/** Reload when the file (or the configured path) changed since the last read. */
	private async reloadIfChanged(): Promise<void> {
		const path = this.vimrcPath();
		let mtime: number | null = null;
		try {
			mtime = (await this.app.vault.adapter.stat(path))?.mtime ?? null;
		} catch {
			// treated as missing
		}
		if (path !== this.loadedPath || mtime !== this.loadedMtime) await this.reloadVimrc(false);
	}

	private listen(win: Window): void {
		this.registerDomEvent(win, "keydown", (e) => this.onKeyDown(e), { capture: true });
		this.registerDomEvent(win, "focus", () => void this.reloadIfChanged());
	}

	private onKeyDown(e: KeyboardEvent): void {
		if (!shouldHandle(e)) {
			// Focus moved into an editor or a modal opened mid-sequence.
			if (this.matcher.isPending) this.clearPending();
			return;
		}
		const token = eventToken(e);
		if (!token) return;
		const { run, consumed } = this.matcher.feed(token);
		if (consumed) {
			e.preventDefault();
			e.stopPropagation();
		}
		this.updatePending();
		for (const id of run) this.execute(id);
	}

	private execute(id: string): void {
		if (!this.app.commands.executeCommandById(id)) {
			console.debug(`vimrc-outside: command ${id} did not run here`);
		}
	}

	private updatePending(): void {
		if (this.timer !== null) {
			window.clearTimeout(this.timer);
			this.timer = null;
		}
		if (this.matcher.isPending) {
			this.timer = window.setTimeout(() => {
				this.timer = null;
				const id = this.matcher.timeout();
				this.updatePending();
				if (id) this.execute(id);
			}, this.settings.timeoutMs);
		}
		const keys = this.matcher.pendingKeys.join("");
		if (this.statusEl) {
			this.statusEl.setText(keys);
			this.statusEl.toggle(this.settings.showPendingKeys && keys !== "");
		}
	}

	private clearPending(): void {
		this.matcher.reset();
		this.updatePending();
	}
}
