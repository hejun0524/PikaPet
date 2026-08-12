// hub/settingsHTML.js

import { t, LANGUAGE_OPTIONS, languageSetting } from "../shared/i18n.js";
import { ui, appSettings } from "./state.js";
import { escText as esc } from "../panel.js";
import { resetConfirmHTML } from "./resetConfirmHTML.js";

/**
 * The Settings page: pet size, all-desktops, autostart, hide-pet, language,
 * quit/reset links, the Storage section (data folder + relocation), and
 * developer-mode toggles — or the reset confirmation while `ui.resetPending`
 * is set.
 *
 * @returns {string} Page HTML for the grid.
 */
export function settingsHTML() {
  if (ui.resetPending) return resetConfirmHTML();
  const langOptions = LANGUAGE_OPTIONS.map(
    (o) => `
      <option value="${o.key}" ${o.key === languageSetting() ? "selected" : ""}>
        ${o.label ?? t("settings.langAuto")}
      </option>`
  ).join("");
  return `
    <div class="settings-plain">
      <div class="ach-section">${t("settings.general")}</div>
      <div class="settings-row">
        <label for="size">${t("settings.size")}</label>
        <input type="number" id="size" class="num-input" min="50" max="150" step="5"
          value="${Math.round(appSettings.scale * 100)}" />
      </div>
      <div class="settings-row">
        <label for="language">${t("settings.language")}</label>
        <select id="language">${langOptions}</select>
      </div>
      <div class="settings-row">
        <label for="all-desktops">${t("settings.allDesktops")}</label>
        <input type="checkbox" id="all-desktops" ${appSettings.allDesktops ? "checked" : ""} />
      </div>
      <div class="settings-row">
        <label for="autostart">${t("settings.autostart")}</label>
        <input type="checkbox" id="autostart" />
      </div>
      <div class="settings-row">
        <label for="hide-pet">${t("settings.hidePet")}</label>
        <input type="checkbox" id="hide-pet" />
      </div>
      <div class="settings-links">
        <a id="quit" class="danger-link">${t("settings.quit")}</a>
        <a id="reset-btn" class="danger-link">${t("settings.reset")}</a>
      </div>

      <div class="ach-section">${t("settings.storageTitle")}</div>
      <div class="gov-note">${t("settings.storageNote")}</div>
      <div class="settings-row"><code class="storage-path">${esc(ui.dataPaths?.root ?? "…")}</code></div>
      <div class="settings-row">
        <button id="storage-change">${t("settings.storageChange")}</button>
      </div>
      <div class="gov-note">${t("settings.storageHint")}${
        ui.storageMsg ? `<br/><b>${esc(ui.storageMsg)}</b>` : ""
      }</div>

      <div class="ach-section">${t("settings.devTitle")}</div>
      <div class="settings-row">
        <label for="dev-mode">${t("settings.devFast")}</label>
        <input type="checkbox" id="dev-mode" ${appSettings.devMode ? "checked" : ""} />
      </div>
      <div class="settings-row">
        <label for="dev-coins">${t("settings.devCoins")}</label>
        <input type="checkbox" id="dev-coins" ${appSettings.devCoins ? "checked" : ""} />
      </div>
    </div>`;
}
