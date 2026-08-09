// school/schoolMinuteMs.js

import { SCHOOL_MINUTE_MS_DEV, SCHOOL_MINUTE_MS_NORMAL } from "./schoolData.js";

/**
 * Length of one game-"minute" in real milliseconds, for classes, jobs, tours
 * and caretaker shifts. Developer mode (Settings) switches to the fast value
 * at activity start time.
 *
 * @param {boolean} devMode - Whether developer mode is on.
 * @returns {number} Milliseconds per game-minute (5 000 in dev mode,
 *   60 000 normally).
 */
export function schoolMinuteMs(devMode) {
  return devMode ? SCHOOL_MINUTE_MS_DEV : SCHOOL_MINUTE_MS_NORMAL;
}
