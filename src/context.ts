// Decides whether a keydown belongs to us: only when no text input or editor has focus and no
// overlay (modal, menu, suggestion popup) is open. Inside the editor, obsidian-vimrc-support's
// mappings already apply.

const EDITABLE =
	'input, textarea, select, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"], .cm-editor';
const OVERLAYS = ".modal-container, .menu, .suggestion-container, .prompt";

export function shouldHandle(e: KeyboardEvent): boolean {
	if (e.isComposing || e.keyCode === 229) return false;
	if (e.defaultPrevented) return false;
	const doc = (e.target as Node | null)?.ownerDocument ?? document;
	// The Settings window and other non-workspace documents.
	if (!doc.body?.querySelector(".workspace")) return false;
	if (isEditable(e.target) || isEditable(doc.activeElement)) return false;
	if (doc.querySelector(OVERLAYS)) return false;
	return true;
}

function isEditable(el: EventTarget | null): boolean {
	return el instanceof Element && el.closest(EDITABLE) !== null;
}
