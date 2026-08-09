// stats/canAfford.js — Item use (requested by the hub's Home view).

import { meterOf } from "./meterOf.js";

/**
 * Check whether the pet's care meters can pay an item's negative effects
 * (no meter may go below zero). Positive effects always pass. No side
 * effects.
 *
 * @param {{effects: Object<string, number>}} item - Item from ALL_ITEMS.
 * @returns {boolean} True if every negative effect is payable.
 */
export function canAfford(item) {
  return Object.entries(item.effects).every(([stat, amount]) => {
    if (amount >= 0) return true;
    const meter = meterOf(stat);
    return !meter || meter.value + amount >= 0;
  });
}
