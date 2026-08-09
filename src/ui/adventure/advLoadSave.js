// adventure/advLoadSave.js

import { ADV_SAVE_KEY } from "./adventureData.js";
import { advFresh } from "./advFresh.js";

/**
 * Load the adventure save from localStorage, falling back to a fresh save
 * when it is missing, corrupt, or from an unknown version.
 *
 * @returns {object} The parsed save object (same shape as advFresh()); old
 *   saves from before the acquaintance system get an empty `met` map.
 */
export function advLoadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(ADV_SAVE_KEY));
    if (raw && raw.v === 1) {
      raw.met ??= {}; // saves from before the acquaintance system
      return raw;
    }
  } catch (_) { /* corrupt save falls through to a fresh one */ }
  return advFresh();
}
