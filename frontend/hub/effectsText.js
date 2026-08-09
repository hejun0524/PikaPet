// hub/effectsText.js

import { STAT_EMOJI } from "../items.js";
import { itemDesc } from "../shared/names.js";

/**
 * One-line effects description for an item card (its custom desc wins).
 *
 * @param {Object} item - Item definition with an `effects` (stat -> delta)
 *   map and an optional `desc` override.
 * @returns {string} e.g. "+10 🍗 −5 ⚡", or the item's own description.
 */
export function effectsText(item) {
  if (item.desc) return itemDesc(item);
  return Object.entries(item.effects)
    .map(([stat, amount]) => `${amount > 0 ? "+" : "−"}${Math.abs(amount)} ${STAT_EMOJI[stat]}`)
    .join(" ");
}
