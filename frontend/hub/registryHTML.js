// hub/registryHTML.js

import { state } from "./state.js";
import { GOV_FEE } from "./constants.js";
import { findSpecies } from "../items.js";
import { escText as esc } from "../panel.js";

/**
 * The Pet Registry page: name and call-me inputs plus the fee-charging Apply
 * button (enabled by refreshGovApply as the inputs change).
 *
 * @returns {string} Page HTML for the grid.
 */
export function registryHTML() {
  return `
    <div class="settings-card">
      <div class="gov-note">📋 Pet Registry — update your pet's official record. Service fee: 💰${GOV_FEE}<br/>
      Breed: <b>${esc(findSpecies(state.species).breed)}</b> (set by species — visit 🔮 Magic Station to change)</div>
      <div class="settings-row">
        <label for="gov-name">Name</label>
        <input type="text" id="gov-name" maxlength="20" value="${esc(state.name)}" />
      </div>
      <div class="settings-row">
        <label for="gov-callme">Calls you</label>
        <input type="text" id="gov-callme" maxlength="12" value="${esc(state.callMe)}" placeholder="Papa / Mama / Dada…" />
      </div>
      <div class="settings-actions">
        <button id="gov-apply" disabled>Apply changes (💰${GOV_FEE})</button>
      </div>
    </div>`;
}
