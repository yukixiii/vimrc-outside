import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { completeEx, parseExLine } from "../src/exline";
import { parseVimrc } from "../src/vimrc";

const table = parseVimrc(readFileSync(new URL("./fixture.vimrc", import.meta.url), "utf8"));

describe("parseExLine", () => {
	it("runs exmaps and obcommand", () => {
		expect(parseExLine("q", table)).toEqual({ kind: "command", id: "workspace:close" });
		expect(parseExLine(" :vsplit ", table)).toEqual({ kind: "command", id: "workspace:split-vertical" });
		expect(parseExLine("obcommand app:open-settings", table)).toEqual({ kind: "command", id: "app:open-settings" });
	});
	it("reports editor-only and unknown commands", () => {
		expect(parseExLine("surround_wiki", table)).toEqual({ kind: "editor-only", name: "surround_wiki" });
		expect(parseExLine("pasteinto", table)).toEqual({ kind: "editor-only", name: "pasteinto" });
		expect(parseExLine("nope", table)).toEqual({ kind: "unknown", name: "nope" });
		expect(parseExLine("   ", table)).toEqual({ kind: "empty" });
	});
});

describe("completeEx", () => {
	const names = ["vsplit", "vs", "kffind", "kfgrep"];
	it("completes ex names", () => {
		expect(completeEx("kf", names, [])).toEqual({ start: 0, candidates: ["kffind", "kfgrep"] });
		expect(completeEx("ob", names, [])).toEqual({ start: 0, candidates: ["obcommand"] });
		expect(completeEx("", names, []).candidates).toHaveLength(5);
	});
	it("completes command ids after obcommand", () => {
		expect(completeEx("obcommand app:g", names, ["app:go-back", "app:go-forward", "editor:save"])).toEqual({
			start: 10,
			candidates: ["app:go-back", "app:go-forward"],
		});
	});
	it("has nothing after other commands", () => {
		expect(completeEx("vsplit x", names, []).candidates).toEqual([]);
	});
});
