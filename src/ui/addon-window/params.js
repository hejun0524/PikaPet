// addon-window/params.js — which add-on page this popup window hosts, parsed
// from the window's query string (set by the Rust `open_addon_window`
// command).

const params = new URLSearchParams(location.search);

/** The add-on's id (empty string when missing). */
export const addonId = params.get("id") ?? "";

/** The page file to load from the add-on's directory (empty when missing). */
export const addonPage = params.get("page") ?? "";
