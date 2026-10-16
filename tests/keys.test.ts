import { describe, expect, it } from "vitest";
import { eventToken, parseKeys } from "../src/keys";

const ev = (key: string, mods: Partial<Record<"ctrlKey" | "altKey" | "metaKey" | "shiftKey", boolean>> = {}) => ({
	key,
	ctrlKey: false,
	altKey: false,
	metaKey: false,
	shiftKey: false,
	...mods,
});

describe("parseKeys", () => {
	it("splits characters and bracket names", () => {
		expect(parseKeys(",r")).toEqual([",", "r"]);
		expect(parseKeys("<C-w>l")).toEqual(["<C-w>", "l"]);
		expect(parseKeys("g,<Space>")).toEqual(["g", ",", "<Space>"]);
		expect(parseKeys("\\gr")).toEqual(["\\", "g", "r"]);
		expect(parseKeys("zC")).toEqual(["z", "C"]);
	});
	it("normalizes modifiers and names", () => {
		expect(parseKeys("<C-W>")).toEqual(["<C-w>"]);
		expect(parseKeys("<c-w>")).toEqual(["<C-w>"]);
		expect(parseKeys("<C-S-w>")).toEqual(["<C-S-w>"]);
		expect(parseKeys("<M-p>")).toEqual(["<A-p>"]);
		expect(parseKeys("<space><cr><Enter>")).toEqual(["<Space>", "<CR>", "<CR>"]);
		expect(parseKeys("<lt><Bslash>")).toEqual(["<", "\\"]);
	});
	it("takes unknown brackets literally", () => {
		expect(parseKeys("<x>")).toEqual(["<", "x", ">"]);
		expect(parseKeys("<")).toEqual(["<"]);
	});
});

describe("eventToken", () => {
	it("matches the vimrc notation", () => {
		expect(eventToken(ev("r"))).toBe("r");
		expect(eventToken(ev(","))).toBe(",");
		expect(eventToken(ev("C", { shiftKey: true }))).toBe("C");
		expect(eventToken(ev('"', { shiftKey: true }))).toBe('"');
		expect(eventToken(ev("w", { ctrlKey: true }))).toBe("<C-w>");
		expect(eventToken(ev("W", { ctrlKey: true, shiftKey: true }))).toBe("<C-S-w>");
		expect(eventToken(ev(" "))).toBe("<Space>");
		expect(eventToken(ev("Escape"))).toBe("<Esc>");
		expect(eventToken(ev("p", { altKey: true }))).toBe("<A-p>");
	});
	it("ignores lone modifiers", () => {
		expect(eventToken(ev("Shift", { shiftKey: true }))).toBeNull();
		expect(eventToken(ev("Control", { ctrlKey: true }))).toBeNull();
		expect(eventToken(ev("Process"))).toBeNull();
	});
});
