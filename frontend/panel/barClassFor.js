// panel/barClassFor.js

import { BAR_LEVELS } from "./barLevels.js";

/**
 * CSS class suffix for a meter's fill bar, based on how empty it is.
 *
 * @param {number} value - Current meter value.
 * @param {number} max - Meter maximum.
 * @returns {string} `" critical"`, `" low"`, or `" warn"` (with a leading
 *   space, ready to append to a class list), or `""` when the meter is
 *   comfortably full.
 */
export function barClassFor(value, max) {
  const pct = (value / max) * 100;
  const level = BAR_LEVELS.find((l) => pct < l.below);
  return level ? ` ${level.className}` : "";
}
