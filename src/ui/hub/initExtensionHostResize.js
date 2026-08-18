// hub/initExtensionHostResize.js — the active extension's child webview is
// positioned to match #extension-host's on-screen bounds, which change
// whenever the (resizable) hub window resizes.

import { state, ui } from "./state.js";
import { openActiveExtensionWebview } from "./openActiveExtensionWebview.js";

/**
 * Reposition the active extension's child webview whenever the hub window
 * resizes. No-op when the current view isn't an open extension.
 *
 * @returns {void}
 */
export function initExtensionHostResize() {
  window.addEventListener("resize", () => {
    if (!ui.view.startsWith("extension:")) return;
    const id = ui.view.slice("extension:".length);
    const extension = state.extensionsInstalled.find((a) => a.id === id);
    if (extension?.entry) openActiveExtensionWebview(id, extension.entry);
  });
}
