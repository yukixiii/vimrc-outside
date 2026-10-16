import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { parseVimrc } from "../src/vimrc";

const fixture = readFileSync(new URL("./fixture.vimrc", import.meta.url), "utf8");
const lookup = (text: string) => new Map(parseVimrc(text).mappings.map((m) => [m.keys.join(""), m.commandId]));

describe("parseVimrc with a real vimrc", () => {
	const map = lookup(fixture);
	it("resolves exmap obcommand mappings", () => {
		expect(map.get(",r")).toBe("keyfiler:find-files");
		expect(map.get("<C-w>l")).toBe("editor:focus-right");
		expect(map.get("zo")).toBe("enclosing-fold:unfold");
		expect(map.get("g,<Space>")).toBe("daily-notes");
		expect(map.get("\\gr")).toBe("keyfiler:grep");
		expect(map.get("<C-o>")).toBe("app:go-back");
	});
	it("leaves out mappings that don't run a command", () => {
		expect(map.has("j")).toBe(false); // nmap j gj
		expect(map.has("S\"")).toBe(false); // surround
		expect(map.has("[[")).toBe(false);
		expect(map.has("<A-p>")).toBe(false); // :pasteinto without <CR>
	});
});

describe("parseVimrc", () => {
	it("applies unmap and redefinition in order", () => {
		const map = lookup(`exmap a obcommand cmd:a
exmap b obcommand cmd:b
nmap x :a<CR>
nmap y :a<CR>
unmap x
nmap y :b<CR>`);
		expect(map.has("x")).toBe(false);
		expect(map.get("y")).toBe("cmd:b");
	});
	it("accepts direct obcommand, later exmaps and map arguments", () => {
		const map = lookup(`" comment
nnoremap <silent> q :obcommand app:quit<cr>
nmap w :later<CR>
exmap later obcommand cmd:later`);
		expect(map.get("q")).toBe("app:quit");
		expect(map.get("w")).toBe("cmd:later");
	});
});
