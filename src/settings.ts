import { App, PluginSettingTab, Setting } from "obsidian";
import { defaultImeOffCommand } from "./ime";
import type VimrcOutsidePlugin from "./main";

export interface VimrcOutsideSettings {
	/** Vault-relative vimrc path. Empty: use obsidian-vimrc-support's setting. */
	vimrcPath: string;
	/** Like vim's 'timeoutlen'. */
	timeoutMs: number;
	showPendingKeys: boolean;
	/** Open a command line with ":". */
	commandLine: boolean;
	/** Shell command run when the command line opens. Empty: none. */
	imeOffCommand: string;
	/** Command line history, newest first. */
	exHistory: string[];
}

export const HISTORY_LIMIT = 100;

export const DEFAULT_SETTINGS: VimrcOutsideSettings = {
	vimrcPath: "",
	timeoutMs: 1000,
	showPendingKeys: true,
	commandLine: true,
	imeOffCommand: defaultImeOffCommand(),
	exHistory: [],
};

export function loadSettings(data: unknown): VimrcOutsideSettings {
	const s = { ...DEFAULT_SETTINGS, ...(data as Partial<VimrcOutsideSettings> | null) };
	if (typeof s.vimrcPath !== "string") s.vimrcPath = DEFAULT_SETTINGS.vimrcPath;
	if (!Number.isFinite(s.timeoutMs) || s.timeoutMs < 0) s.timeoutMs = DEFAULT_SETTINGS.timeoutMs;
	s.showPendingKeys = s.showPendingKeys !== false;
	s.commandLine = s.commandLine !== false;
	if (typeof s.imeOffCommand !== "string") s.imeOffCommand = DEFAULT_SETTINGS.imeOffCommand;
	s.exHistory = Array.isArray(s.exHistory)
		? s.exHistory.filter((h): h is string => typeof h === "string").slice(0, HISTORY_LIMIT)
		: [];
	return s;
}

export class VimrcOutsideSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: VimrcOutsidePlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		const p = this.plugin;
		containerEl.empty();

		new Setting(containerEl)
			.setName("vimrc path")
			.setDesc(`Vault-relative path. Leave empty to use the same file as the Vimrc Support plugin (now: ${p.vimrcPath()}).`)
			.addText((t) =>
				t
					.setPlaceholder(".obsidian.vimrc")
					.setValue(p.settings.vimrcPath)
					.onChange(async (v) => {
						p.settings.vimrcPath = v.trim();
						await p.saveSettings();
					}),
			)
			.addButton((b) =>
				b.setButtonText("Reload").onClick(async () => {
					await p.reloadVimrc(true);
					this.display();
				}),
			);

		new Setting(containerEl)
			.setName("Timeout (ms)")
			.setDesc("How long to wait for the next key of a mapping, like vim's 'timeoutlen'.")
			.addText((t) =>
				t.setValue(String(p.settings.timeoutMs)).onChange(async (v) => {
					const n = Number(v);
					if (!Number.isFinite(n) || n < 0) return;
					p.settings.timeoutMs = n;
					await p.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Show pending keys in status bar")
			.addToggle((t) =>
				t.setValue(p.settings.showPendingKeys).onChange(async (v) => {
					p.settings.showPendingKeys = v;
					await p.saveSettings();
				}),
			);

		new Setting(containerEl).setName("Command line").setHeading();
		new Setting(containerEl)
			.setName("Open the command line with :")
			.setDesc("Run exmaps from the vimrc (e.g. :q, :vsplit) or :obcommand <id>. Tab completes, Up/Down browse the history.")
			.addToggle((t) =>
				t.setValue(p.settings.commandLine).onChange(async (v) => {
					p.settings.commandLine = v;
					await p.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName("IME off command")
			.setDesc("Shell command run when the command line opens, to switch the IME off (e.g. fcitx5-remote -c, im-select com.apple.keylayout.ABC). Leave empty to do nothing.")
			.addText((t) =>
				t.setValue(p.settings.imeOffCommand).onChange(async (v) => {
					p.settings.imeOffCommand = v.trim();
					await p.saveSettings();
				}),
			);

		new Setting(containerEl).setName("Loaded mappings").setHeading();
		const { mappings, error } = p.loaded;
		if (error) {
			containerEl.createEl("p", { text: error, cls: "mod-warning" });
			return;
		}
		if (mappings.length === 0) {
			containerEl.createEl("p", { text: "No normal-mode mappings that run an Obsidian command were found." });
			return;
		}
		const table = containerEl.createEl("table", { cls: "vimrc-outside-mappings" });
		for (const m of mappings) {
			const row = table.createEl("tr");
			row.createEl("td").createEl("code", { text: m.lhs });
			const cmd = this.app.commands.commands[m.commandId];
			const cell = row.createEl("td");
			if (cmd) cell.setText(cmd.name);
			else cell.createSpan({ text: `${m.commandId} (command not found)`, cls: "mod-warning" });
		}
	}
}
