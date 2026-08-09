// adventure/advMs.js

import { appSettings } from "../hub/state.js";

/**
 * Convert adventure minutes to real milliseconds. devMode compresses the
 * clock: 1 adventure minute = 1 real second.
 *
 * @param {number} minutes - Duration in adventure minutes.
 * @returns {number} Duration in real milliseconds.
 */
export function advMs(minutes) {
  return minutes * (appSettings.devMode ? 1000 : 60000);
}
