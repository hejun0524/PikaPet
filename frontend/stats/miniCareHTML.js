// stats/miniCareHTML.js — Compact (minimized) popover: slim emoji+bar care
// meters (no numbers) shown while the ▾ toggle has the popover collapsed.

import { barClassFor, escText } from "../panel.js";

/**
 * Build the compact care-meter HTML: one emoji + colored fill bar per meter,
 * with the exact numbers in the tooltip. No side effects.
 *
 * @param {Array<{label: string, emoji: string, value: number, max: number}>}
 *   meters - The pet's care meters.
 * @returns {string} HTML string for the #care container.
 */
export function miniCareHTML(meters) {
  return meters
    .map(
      (m) => `
    <div class="mini-meter" title="${escText(m.label)}: ${m.value}/${m.max}">
      <span class="mm-emoji">${m.emoji}</span>
      <div class="mm-track"><div class="mm-fill${barClassFor(m.value, m.max)}" style="width:${(m.value / m.max) * 100}%"></div></div>
    </div>`
    )
    .join("");
}
