// hub/setView.js

import { ui } from "./state.js";
import { VIEWS, BASKET_VIEWS } from "./constants.js";
import { extensionFrame } from "./extensionFrame.js";
import { renderAll } from "./renderAll.js";

/**
 * Switch to another view and repaint everything. Ignores unknown views.
 * Entering a basket page (cart/plan/trade/service) from anywhere else
 * remembers that view in `ui.returnView`, so its ← Back button (and a
 * successful checkout) can return there.
 *
 * Side effects: mutates `ui.view` (clearing `ui.pendingMagic` and
 * `ui.resetPending`), may set `ui.returnView`, posts addon-pause to an
 * extension page being left, and calls renderAll().
 *
 * @param {string} v - View key from VIEWS, a BASKET_VIEWS key, or
 *   "extension:<id>".
 * @returns {void}
 */
export function setView(v) {
  if (!VIEWS[v] && !BASKET_VIEWS[v] && !v.startsWith("extension:")) return;
  // Leaving an extension page: ask it to pause itself. Games listen for this
  // (see doc/addons.md); extensions that should keep running (music) just ignore it.
  if (ui.view.startsWith("extension:") && v !== ui.view) {
    extensionFrame(ui.view.slice("extension:".length))?.contentWindow?.postMessage({ type: "addon-pause" }, "*");
  }
  if (BASKET_VIEWS[v] && !BASKET_VIEWS[ui.view]) ui.returnView = ui.view;
  ui.view = v;
  ui.pendingMagic = null;
  ui.createPending = false;
  ui.deleteFormPending = null;
  ui.resetPending = false;
  renderAll();
}
