// hub/renderAddonDrawer.js — The add-on manager: a drawer on the Add-ons
// homepage (like the shopping cart), listing installed add-ons with
// uninstall + a zip installer.

import { state, ui } from "./state.js";
import { addonList } from "../items.js";
import { escText as esc } from "../panel.js";

/**
 * Render the add-on manager drawer: one row per installed add-on with pin and
 * uninstall buttons, the zip installer button, and the last install/uninstall
 * message (`ui.addonMsg`). No-op while hidden.
 *
 * Side effects: rewrites #addon-drawer.
 *
 * @returns {void}
 */
export function renderAddonDrawer() {
  const drawer = document.getElementById("addon-drawer");
  if (drawer.hidden) return;
  const rows =
    addonList(state.addonsInstalled)
      .map((a) => {
        const pinned = state.pinnedAddons.includes(a.id);
        return `
      <div class="cart-row addon-line">
        <span class="addon-line-label">${esc(a.emoji)} ${esc(a.name)}</span>
        <button class="icon-btn pin ${pinned ? "on" : ""}" data-pin="${esc(a.id)}"
          title="${pinned ? "Unpin from" : "Pin to"} the tray and side panel">📌</button>
        <button class="icon-btn" data-uninstall="${esc(a.id)}" title="Uninstall ${esc(a.name)}">🗑️</button>
      </div>`;
      })
      .join("") || `<div class="cart-empty">No add-ons installed yet</div>`;
  drawer.innerHTML = `
    ${rows}
    <div class="cart-actions">
      <button id="addon-install">📦 Install add-on from zip…</button>
    </div>
    ${ui.addonMsg ? `<div class="gov-note">${esc(ui.addonMsg)}</div>` : ""}`;
}
