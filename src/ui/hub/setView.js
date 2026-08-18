// hub/setView.js

import { invoke } from "../shared/tauri.js";
import { ui } from "./state.js";
import { VIEWS, BASKET_VIEWS } from "./constants.js";
import { renderAll } from "./renderAll.js";

/**
 * Switch to another view and repaint everything. Ignores unknown views.
 * Entering a basket page (cart/plan/trade/service) from anywhere else
 * remembers that view in `ui.returnView`, so its ← Back button (and a
 * successful checkout) can return there.
 *
 * Side effects: mutates `ui.view` (clearing `ui.pendingMagic` and
 * `ui.resetPending`), may set `ui.returnView`, posts extension-pause to an
 * extension page being left, and calls renderAll().
 *
 * @param {string} v - View key from VIEWS, a BASKET_VIEWS key, or
 *   "extension:<id>".
 * @returns {void}
 */
export function setView(v) {
  if (!VIEWS[v] && !BASKET_VIEWS[v] && !v.startsWith("extension:")) return;
  // Leaving an extension page: ask it to pause itself (games listen for
  // this, see doc/extensions.md; music-like extensions just ignore it),
  // and hide its native child webview — it's a real overlay, not a DOM
  // node this view switch's own hidden/display CSS affects, so nothing
  // else would make it stop covering whatever's rendered next.
  if (ui.view.startsWith("extension:") && v !== ui.view) {
    const leftId = ui.view.slice("extension:".length);
    invoke("ext_push", { id: leftId, kind: "extension-pause", data: {} }).catch(() => {});
    invoke("hide_extension_webview", { id: leftId }).catch(() => {});
  }
  if (BASKET_VIEWS[v] && !BASKET_VIEWS[ui.view]) ui.returnView = ui.view;
  ui.view = v;
  ui.pendingMagic = null;
  ui.createPending = false;
  ui.deleteFormPending = null;
  ui.resetPending = false;
  renderAll();
}
