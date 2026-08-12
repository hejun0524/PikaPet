// hub/setView.js

import { ui } from "./state.js";
import { VIEWS } from "./constants.js";
import { extensionFrame } from "./extensionFrame.js";
import { renderAll } from "./renderAll.js";

/**
 * Switch to another view and repaint everything. Ignores unknown views.
 *
 * Side effects: mutates `ui.view` (clearing `ui.pendingMagic` and
 * `ui.resetPending`), posts addon-pause to an extension page being left, hides
 * all drawers, and calls renderAll().
 *
 * @param {string} v - View key from VIEWS, or "extension:<id>".
 * @returns {void}
 */
export function setView(v) {
  if (!VIEWS[v] && !v.startsWith("extension:")) return;
  // Leaving an extension page: ask it to pause itself. Games listen for this
  // (see doc/addons.md); extensions that should keep running (music) just ignore it.
  if (ui.view.startsWith("extension:") && v !== ui.view) {
    extensionFrame(ui.view.slice("extension:".length))?.contentWindow?.postMessage({ type: "addon-pause" }, "*");
  }
  ui.view = v;
  ui.pendingMagic = null;
  ui.createPending = false;
  ui.resetPending = false;
  document.getElementById("cart-drawer").hidden = true;
  document.getElementById("plan-drawer").hidden = true;
  document.getElementById("trade-drawer").hidden = true;
  document.getElementById("service-drawer").hidden = true;
  renderAll();
}
