// panel/traitCardsHTML.js

import { escText } from "./escText.js";

/**
 * Render the three equal trait cards filling the row: value, emoji and name
 * each.
 *
 * @param {Array<{key: string, emoji: string, label: string, value: number}>}
 *   traits - Traits in display order.
 * @returns {string} HTML for the `.trait-cards` grid.
 */
export function traitCardsHTML(traits) {
  return `<div class="trait-cards">${traits
    .map(
      (t) => `
    <div class="trait-card">
      <span class="tc-value">${escText(String(t.value))}</span>
      <span class="tc-label">${t.emoji} ${escText(t.label)}</span>
    </div>`
    )
    .join("")}</div>`;
}
