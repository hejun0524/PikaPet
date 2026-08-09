// hub/resetConfirmHTML.js — Settings page.

import { t } from "../shared/i18n.js";
import { state } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * The reset-all-data confirmation card: type the pet's name to enable the
 * Delete everything button.
 *
 * @returns {string} Card HTML for the grid.
 */
export function resetConfirmHTML() {
  return `
    <div class="settings-plain">
      <div class="ach-section">${t("reset.title")}</div>
      <div class="gov-note">${t("reset.warning", { name: esc(state.name) })}</div>
      <div class="settings-row">
        <label for="reset-name">${t("reset.label")}</label>
        <input type="text" id="reset-name" placeholder="${esc(state.name)}" />
      </div>
      <div class="settings-actions">
        <button id="reset-cancel">${t("reset.cancel")}</button>
        <button id="reset-confirm" class="danger" disabled>${t("reset.confirm")}</button>
      </div>
    </div>`;
}
