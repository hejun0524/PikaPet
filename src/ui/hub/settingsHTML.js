// hub/settingsHTML.js — Settings: dispatches to the active tab (General /
// Data / Developer — see hub/constants.js's SETTINGS_TABS), or the reset
// confirmation while `ui.resetPending` is set.

import { ui } from "./state.js";
import { resetConfirmHTML } from "./resetConfirmHTML.js";
import { settingsGeneralHTML } from "./settingsGeneralHTML.js";
import { settingsDataHTML } from "./settingsDataHTML.js";
import { settingsDeveloperHTML } from "./settingsDeveloperHTML.js";

/**
 * The Settings page for the current tab, or the reset confirmation while
 * `ui.resetPending` is set (regardless of tab).
 *
 * @returns {string} Page HTML for the grid.
 */
export function settingsHTML() {
  if (ui.resetPending) return resetConfirmHTML();
  if (ui.settingsTab === "data") return settingsDataHTML();
  if (ui.settingsTab === "developer") return settingsDeveloperHTML();
  return settingsGeneralHTML();
}
