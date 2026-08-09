// stats/tickMs.js — Game clock: developer mode (Settings) speeds everything
// up; normal is one care point every 3 minutes.

import { pet } from "./state.js";
import { TICK_MS_DEV, TICK_MS_NORMAL } from "./constants.js";

/**
 * Current care-decay tick length, honoring the live devMode setting.
 * No side effects.
 *
 * @returns {number} Milliseconds between care-decay ticks.
 */
export function tickMs() {
  return pet.settings.devMode ? TICK_MS_DEV : TICK_MS_NORMAL;
}
