// stats/tourVisitCount.js

import { TOUR_MINUTES_PER_CITY } from "../touring.js";

/**
 * Cities visited = full 30-game-minute blocks elapsed, capped by the
 * package's city count. No side effects.
 *
 * @param {{cityCount: number, minutes: number}} def - Tour definition.
 * @param {number} fraction - Elapsed fraction of the tour (0..1).
 * @returns {number} Number of cities visited so far.
 */
export function tourVisitCount(def, fraction) {
  return Math.min(def.cityCount, Math.floor((fraction * def.minutes) / TOUR_MINUTES_PER_CITY));
}
