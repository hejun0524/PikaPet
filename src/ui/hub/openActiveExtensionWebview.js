// hub/openActiveExtensionWebview.js — positions/creates the currently active
// extension's native child webview over #extension-host (a real Tauri
// webview, not a DOM node — see hosting.rs), and hides every other
// extension whose webview is still open in the background (so e.g. music
// keeps playing while you look at another extension's page).

import { invoke } from "../shared/tauri.js";
import { ui } from "./state.js";

/**
 * Show (creating if needed) one extension's child webview at
 * #extension-host's current on-screen bounds, and hide every other
 * currently-open extension's webview.
 *
 * @param {string} id - Extension id.
 * @param {string} entry - The extension's manifest `entry` page.
 * @returns {void}
 */
export function openActiveExtensionWebview(id, entry) {
  const host = document.getElementById("extension-host");
  const rect = host.getBoundingClientRect();
  ui.openExtensionIds.add(id);
  invoke("open_extension_webview", {
    id,
    entry,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  }).catch((e) => console.error("open_extension_webview failed:", e));
  for (const openId of ui.openExtensionIds) {
    if (openId !== id) {
      invoke("hide_extension_webview", { id: openId }).catch(() => {});
    }
  }
}
