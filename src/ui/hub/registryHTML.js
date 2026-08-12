// hub/registryHTML.js

import { t } from "../shared/i18n.js";
import { state } from "./state.js";
import { GOV_FEE } from "./constants.js";
import { escText as esc } from "../panel.js";
import { formInfo } from "./formInfo.js";

/**
 * The Pet Registry page: name and call-me inputs plus the fee-charging Apply
 * button (enabled by refreshGovApply as the inputs change).
 *
 * @returns {string} Page HTML for the grid.
 */
export function registryHTML() {
  return `
    <div class="settings-card">
      <div class="gov-note">${t("registry.note", { fee: GOV_FEE })}<br/>
      ${t("registry.breed", { breed: esc(formInfo(state.species).breed) })}</div>
      <div class="settings-row">
        <label for="gov-name">${t("registry.name")}</label>
        <input type="text" id="gov-name" maxlength="20" value="${esc(state.name)}" />
      </div>
      <div class="settings-row">
        <label for="gov-callme">${t("registry.callsYou")}</label>
        <input type="text" id="gov-callme" maxlength="12" value="${esc(state.callMe)}" placeholder="${t("registry.placeholder")}" />
      </div>
      <div class="settings-actions">
        <button id="gov-apply" disabled>${t("registry.apply", { fee: GOV_FEE })}</button>
      </div>
    </div>`;
}
