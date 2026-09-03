// hub/settingsGeneralHTML.js — Settings → General: appearance, behavior,
// and Focus Mode. Every control here has an equivalent Developer-console
// command (see hub/pikaCommands.js) that calls the exact same
// hub/settingsActions.js functions.

import { t, LANGUAGE_OPTIONS, languageSetting } from "../shared/i18n.js";
import { appSettings } from "./state.js";

/**
 * @returns {string} Page HTML for the General settings tab.
 */
export function settingsGeneralHTML() {
  const langOptions = LANGUAGE_OPTIONS.map(
    (o) => `
      <option value="${o.key}" ${o.key === languageSetting() ? "selected" : ""}>
        ${o.label ?? t("settings.langAuto")}
      </option>`
  ).join("");
  return `
    <div class="settings-plain">
      <div class="settings-card">
        <div class="settings-card-title">${t("settings.appearance")}</div>
        <div class="settings-row">
          <label for="size">${t("settings.size")}</label>
          <input type="number" id="size" class="num-input" min="50" max="150" step="5"
            value="${Math.round(appSettings.scale * 100)}" />
        </div>
        <div class="settings-row">
          <label for="language">${t("settings.language")}</label>
          <select id="language">${langOptions}</select>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">${t("settings.behavior")}</div>
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
        <div class="settings-row">
          <label for="pause-on-sleep">${t("settings.pauseOnSleep")}</label>
          <input type="checkbox" id="pause-on-sleep" ${appSettings.pauseOnSleep ? "checked" : ""} />
        </div>
        <div class="gov-note">${t("settings.pauseOnSleepHint")}</div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">🎯 ${t("settings.focusMode")}</div>
        <div class="settings-row">
          <label for="focus-mode">${t("settings.focusMode")}</label>
          <input type="checkbox" id="focus-mode" ${appSettings.focusMode ? "checked" : ""} />
        </div>
        <div class="gov-note">${t("settings.focusModeHint")}</div>
      </div>

      <div class="settings-links">
        <button id="quit" class="danger-btn">${t("settings.quit")}</button>
      </div>
    </div>`;
}
