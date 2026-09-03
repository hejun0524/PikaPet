// hub/settingsDataHTML.js — Settings → Data: where the save file lives, and
// the one truly destructive action in the app.

import { t } from "../shared/i18n.js";
import { ui } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * @returns {string} Page HTML for the Data settings tab.
 */
export function settingsDataHTML() {
  return `
    <div class="settings-plain">
      <div class="settings-card">
        <div class="settings-card-title">${t("settings.storageTitle")}</div>
        <div class="gov-note">${t("settings.storageNote")}</div>
        <div class="settings-row"><code class="storage-path">${esc(ui.dataPaths?.root ?? "…")}</code></div>
        <div class="settings-row">
          <button id="storage-open">${t("settings.storageOpen")}</button>
          <button id="storage-change">${t("settings.storageChange")}</button>
        </div>
        <div class="gov-note">${t("settings.storageHint")}${
          ui.storageMsg ? `<br/><b>${esc(ui.storageMsg)}</b>` : ""
        }</div>
      </div>

      <div class="settings-card settings-card-danger">
        <div class="settings-card-title">${t("reset.title")}</div>
        <div class="gov-note">${t("settings.resetHint")}</div>
        <div class="settings-links">
          <button id="reset-btn" class="danger-btn">${t("settings.reset")}</button>
        </div>
      </div>
    </div>`;
}
