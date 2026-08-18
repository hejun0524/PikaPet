// hub/extensionManagerHTML.js — Extensions view, 🧰 Manager tab: one row per
// installed extension with pin/uninstall buttons, the install-from-zip
// button, and the last action message. (This replaced the old topbar
// manager drawer.)

import { t } from "../shared/i18n.js";
import { appSettings, state, ui } from "./state.js";
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
        const pinned = state.pinnedExtensions.includes(a.id);
        const registryEntry = ui.market?.entries?.find((e) => e.id === a.id);
        const canReinstall = a.legacy && registryEntry;
        return `
      <div class="ach earned extension-line">
        <span class="ach-emoji">${esc(a.emoji)}</span>
        <span class="extension-line-label">${esc(a.name)}${
          a.legacy ? ` <span class="gov-note" title="${t("extensionmgr.legacyHint")}">${t("extensionmgr.legacyBadge")}</span>` : ""
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
      ${
        appSettings.allowSideload
          ? `<div class="fc-actions"><button id="extension-install">${t("extensionmgr.install")}</button></div>`
          : ""
      }
      ${ui.extensionMsg ? `<div class="gov-note">${esc(ui.extensionMsg)}</div>` : ""}
    </div>`;
}
