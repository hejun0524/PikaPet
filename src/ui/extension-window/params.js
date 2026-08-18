// extension-window/params.js — which extension page this popup window hosts, parsed
// from the window's query string (set by the Rust `open_extension_window`
// command).

const params = new URLSearchParams(location.search);

/** The extension's id (empty string when missing). */
export const extensionId = params.get("id") ?? "";

/** The page file to load from the extension's directory (empty when missing). */
export const extensionPage = params.get("page") ?? "";
