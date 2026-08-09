// hub/resetConfirmHTML.js — Settings page.

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
      <div class="ach-section">Reset all data</div>
      <div class="gov-note">⚠️ <b>Reset everything?</b><br/>
      This permanently deletes ALL progress — coins, school, careers, tours, achievements, everything —
      and restarts as a brand-new game. Type <b>${esc(state.name)}</b> to confirm.</div>
      <div class="settings-row">
        <label for="reset-name">Pet's name</label>
        <input type="text" id="reset-name" placeholder="${esc(state.name)}" />
      </div>
      <div class="settings-actions">
        <button id="reset-cancel">Cancel</button>
        <button id="reset-confirm" class="danger" disabled>Delete everything</button>
      </div>
    </div>`;
}
