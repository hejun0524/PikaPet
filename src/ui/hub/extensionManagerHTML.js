// hub/extensionManagerHTML.js — Extensions view, 🧰 Manager tab: one row per
// installed extension with pin/uninstall buttons and the last action
// message. (Install-from-zip is a topbar button now — see hub.html's
// #extension-install-btn and initEvents.js's direct listener for it.)

import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { extensionList } from "../items.js";
import { escText as esc } from "../panel.js";

/**
 * The Manager tab: one row per installed extension.
 *
 * @returns {string} Page HTML for the grid.
 */
export function extensionManagerHTML() {
  const rows =
    extensionList(state.extensionsInstalled)
      .map((a) => {
        const pinned = state.pinnedExtensions.includes(a.id);
        const registryEntry = ui.market?.entries?.find((e) => e.id === a.id);
        const canReinstall = a.unverified && registryEntry;
        return `
      <div class="ach earned extension-line">
        <span class="ach-emoji">${esc(a.emoji)}</span>
        <span class="extension-line-label">${esc(a.name)}${
          a.unverified
            ? ` <span class="gov-note" title="${t("extensionmgr.legacyHint")}">${t("extensionmgr.legacyBadge")}</span>`
            : ""
        }</span>
        ${a.author || a.description ? `<div class="gov-note">${[a.author, a.description].filter(Boolean).map(esc).join(" — ")}</div>` : ""}
        ${
          canReinstall
            ? `<button class="icon-btn" data-market-install="${esc(a.id)}" title="${t("extensionmgr.reinstall")}">🔄</button>`
            : ""
        }
        <button class="icon-btn pin ${pinned ? "on" : ""}" data-pin="${esc(a.id)}"
          title="${pinned ? t("extensionmgr.unpin") : t("extensionmgr.pin")}">📌</button>
        <button class="icon-btn" data-uninstall="${esc(a.id)}" title="${t("extensionmgr.uninstall", { name: esc(a.name) })}">🗑️</button>
      </div>`;
      })
      .join("") || `<div class="empty-note">${t("extensionmgr.none")}</div>`;
  return `
    <div class="ach-section caretaker-title">${t("extensionmgr.note")}</div>
    <div class="ach-list">
      ${rows}
      ${ui.extensionMsg ? `<div class="gov-note">${esc(ui.extensionMsg)}</div>` : ""}
    </div>`;
}
