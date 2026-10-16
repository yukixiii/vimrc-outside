// Undocumented Obsidian internals used by this plugin. Every access is guarded at runtime.
import "obsidian";
import type { Command } from "obsidian";

declare module "obsidian" {
	interface App {
		commands: {
			commands: Record<string, Command>;
			executeCommandById(id: string): boolean;
		};
		plugins: {
			plugins: Record<string, { settings?: Record<string, unknown> } | undefined>;
		};
	}
}
