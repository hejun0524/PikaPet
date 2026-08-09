// hub/setView.js

import { ui } from "./state.js";
import { VIEWS } from "./constants.js";
import { addonFrame } from "./addonFrame.js";
import { renderAll } from "./renderAll.js";

/**
 * Switch to another view and repaint everything. Ignores unknown views.
 *
 * Side effects: mutates `ui.view` (clearing `ui.pendingMagic` and
 * `ui.resetPending`), posts addon-pause to an add-on page being left, hides
 * all drawers, and calls renderAll().
 *
 * @param {string} v - View key from VIEWS, or "addon:<id>".
 * @returns {void}
 */
export function setView(v) {
  if (!VIEWS[v] && !v.startsWith("addon:")) return;
  // Leaving an add-on page: ask it to pause itself. Games listen for this
  // (see ADDONS.md); add-ons that should keep running (music) just ignore it.
  if (ui.view.startsWith("addon:") && v !== ui.view) {
    addonFrame(ui.view.slice(6))?.contentWindow?.postMessage({ type: "addon-pause" }, "*");
  }
  ui.view = v;
  ui.pendingMagic = null;
  ui.resetPending = false;
  document.getElementById("cart-drawer").hidden = true;
  document.getElementById("plan-drawer").hidden = true;
  document.getElementById("trade-drawer").hidden = true;
  document.getElementById("service-drawer").hidden = true;
  document.getElementById("addon-drawer").hidden = true;
  renderAll();
}
