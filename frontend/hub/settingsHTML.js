// hub/settingsHTML.js

import { ui, appSettings } from "./state.js";
import { resetConfirmHTML } from "./resetConfirmHTML.js";

/**
 * The Settings page: pet size, all-desktops, autostart, hide-pet, quit/reset
 * links, and developer-mode toggles — or the reset confirmation while
 * `ui.resetPending` is set.
 *
 * @returns {string} Page HTML for the grid.
 */
export function settingsHTML() {
  if (ui.resetPending) return resetConfirmHTML();
  return `
    <div class="settings-plain">
      <div class="ach-section">General</div>
      <div class="settings-row">
        <label for="size">Pet size (%)</label>
        <input type="number" id="size" class="num-input" min="50" max="150" step="5"
          value="${Math.round(appSettings.scale * 100)}" />
      </div>
      <div class="settings-row">
        <label for="all-desktops">Show on all desktops</label>
        <input type="checkbox" id="all-desktops" ${appSettings.allDesktops ? "checked" : ""} />
      </div>
      <div class="settings-row">
        <label for="autostart">Show up when computer starts</label>
        <input type="checkbox" id="autostart" />
      </div>
      <div class="settings-row">
        <label for="hide-pet">Hide my pet</label>
        <input type="checkbox" id="hide-pet" />
      </div>
      <div class="settings-links">
        <a id="quit" class="danger-link">Quit the app</a>
        <a id="reset-btn" class="danger-link">Reset all data…</a>
      </div>

      <div class="ach-section">Developer mode</div>
      <div class="settings-row">
        <label for="dev-mode">Fast game time (care decays every 10s; 1 game-minute = 5s)</label>
        <input type="checkbox" id="dev-mode" ${appSettings.devMode ? "checked" : ""} />
      </div>
      <div class="settings-row">
        <label for="dev-coins">Auto-load coins to 20,000</label>
        <input type="checkbox" id="dev-coins" ${appSettings.devCoins ? "checked" : ""} />
      </div>
    </div>`;
}
