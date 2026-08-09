// hub/drainText.js

import { STAT_EMOJI } from "../items.js";

/**
 * One-line stat-drain description for a class/job card.
 *
 * @param {Object} drain - Map of stat key -> amount drained.
 * @returns {string} e.g. "−10 ⚡ −5 🍗".
 */
export function drainText(drain) {
  return Object.entries(drain)
    .map(([stat, amount]) => `−${amount} ${STAT_EMOJI[stat]}`)
    .join(" ");
}
