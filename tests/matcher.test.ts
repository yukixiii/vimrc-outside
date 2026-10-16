import { describe, expect, it } from "vitest";
import { Matcher } from "../src/matcher";

const m = () =>
	new Matcher([
		{ keys: [",", "r"], commandId: "find" },
		{ keys: ["z", "o"], commandId: "unfold" },
		{ keys: ["z"], commandId: "z" },
		{ keys: ["<C-w>", "l"], commandId: "right" },
	]);

describe("Matcher", () => {
	it("runs a complete sequence", () => {
		const x = m();
		expect(x.feed(",")).toEqual({ run: [], consumed: true });
		expect(x.isPending).toBe(true);
		expect(x.feed("r")).toEqual({ run: ["find"], consumed: true });
		expect(x.isPending).toBe(false);
	});
	it("passes unmapped keys through", () => {
		expect(m().feed("j")).toEqual({ run: [], consumed: false });
	});
	it("waits on an ambiguous match and runs it on timeout", () => {
		const x = m();
		expect(x.feed("z")).toEqual({ run: [], consumed: true });
		expect(x.timeout()).toBe("z");
		expect(x.isPending).toBe(false);
	});
	it("prefers the longer match", () => {
		const x = m();
		x.feed("z");
		expect(x.feed("o")).toEqual({ run: ["unfold"], consumed: true });
	});
	it("on a mismatch runs the shorter match and restarts with the key", () => {
		const x = m();
		x.feed("z");
		expect(x.feed(",")).toEqual({ run: ["z"], consumed: true });
		expect(x.feed("r")).toEqual({ run: ["find"], consumed: true });
	});
	it("drops an incomplete prefix on a mismatch and lets the key through", () => {
		const x = m();
		x.feed(",");
		expect(x.feed("j")).toEqual({ run: [], consumed: false });
		expect(x.isPending).toBe(false);
		expect(x.timeout()).toBeNull();
	});
	it("cancels with Esc", () => {
		const x = m();
		x.feed("<C-w>");
		expect(x.feed("<Esc>")).toEqual({ run: [], consumed: true });
		expect(x.feed("l")).toEqual({ run: [], consumed: false });
		expect(m().feed("<Esc>")).toEqual({ run: [], consumed: false });
	});
});
