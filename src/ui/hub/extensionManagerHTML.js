// hub/extensionManagerHTML.js — Extensions view, 🧰 Manager tab: one row per
// installed extension with pin/uninstall buttons, the install-from-zip
// button, and the last action message. (This replaced the old topbar
// manager drawer.)

import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { extensionList } from "../items.js";
import { escText as esc } from "../panel.js";

/**
 * The Manager tab: installed-extension rows + zip installer.
 *
 * @returns {string} Page HTML for the grid.
 */
export function extensionManagerHTML() {
  const rows =
    extensionList(state.extensionsInstalled)
      .map((a) => {
        const pinned = state.pinnedAddons.includes(a.id);
        return `
      <div class="ach earned extension-line">
        <span class="ach-emoji">${esc(a.emoji)}</span>
        <span class="extension-line-label">${esc(a.name)}</span>
        <button class="icon-btn pin ${pinned ? "on" : ""}" data-pin="${esc(a.id)}"
          title="${pinned ? t("addonmgr.unpin") : t("addonmgr.pin")}">📌</button>
        <button class="icon-btn" data-uninstall="${esc(a.id)}" title="${t("addonmgr.uninstall", { name: esc(a.name) })}">🗑️</button>
      </div>`;
      })
      .join("") || `<div class="empty-note">${t("addonmgr.none")}</div>`;
  return `
    <div class="ach-section caretaker-title">${t("addonmgr.note")}</div>
    <div class="ach-list">
      ${rows}
      <div class="fc-actions"><button id="extension-install">${t("addonmgr.install")}</button></div>
      ${ui.extensionMsg ? `<div class="gov-note">${esc(ui.extensionMsg)}</div>` : ""}
    </div>`;
}
