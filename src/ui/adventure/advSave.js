// adventure/advSave.js

import { ADV_SAVE_KEY } from "./adventureData.js";
import { adv } from "./state.js";

/**
 * Persist the current adventure save object to localStorage. Call after any
 * mutation of `adv` that should survive a restart.
 *
 * @returns {void}
 */
export function advSave() {
  localStorage.setItem(ADV_SAVE_KEY, JSON.stringify(adv));
}
