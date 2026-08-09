// adventure/advCountdown.js

import { advRemainText } from "./advRemainText.js";

/**
 * Render a live countdown span. The `data-adv-ends` attribute lets the
 * adventure clock (initAdventureClock) refresh the text every second without
 * a full re-render.
 *
 * @param {number} endsAt - Target timestamp (ms since epoch).
 * @returns {string} HTML for a `<span>` holding the remaining time.
 */
export function advCountdown(endsAt) {
  return `<span data-adv-ends="${endsAt}">${advRemainText(endsAt)}</span>`;
}
