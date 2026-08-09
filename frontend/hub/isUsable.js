// hub/isUsable.js

import { state } from "./state.js";

/**
 * Whether an item can be used right now: no negative effect may push a care
 * stat below zero.
 *
 * @param {Object} item - Item definition with an `effects` (stat -> delta) map.
 * @returns {boolean} True when every negative effect stays within the stat.
 */
export function isUsable(item) {
  return Object.entries(item.effects).every(([stat, amount]) => {
    if (amount >= 0 || !(stat in state.care)) return true;
    return state.care[stat] + amount >= 0;
  });
}
