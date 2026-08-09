// panel/careCardsHTML.js

import { barClassFor } from "./barClassFor.js";
import { escText } from "./escText.js";

/**
 * Render the four equal care cards: the background fill rises with the
 * meter's value, colored by the BAR_LEVELS thresholds.
 *
 * @param {Array<{key: string, emoji: string, label: string, value: number,
 *   max: number}>} meters - Care meters in display order.
 * @returns {string} HTML for the `.care-cards` grid.
 */
export function careCardsHTML(meters) {
  return `<div class="care-cards">${meters
    .map((m) => {
      const pct = (m.value / m.max) * 100;
      const level = barClassFor(m.value, m.max).trim();
      return `
    <div class="care-card ${level}">
      <div class="cc-fill" style="height:${pct}%"></div>
      <span class="tc-value">${escText(String(m.value))}</span>
      <span class="tc-label">${m.emoji} ${escText(m.label)}</span>
    </div>`;
    })
    .join("")}</div>`;
}
