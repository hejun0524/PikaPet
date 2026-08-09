// stats/applyItemEffects.js — Item use (requested by the hub's Home view).

import { meterOf } from "./meterOf.js";
import { traitOf } from "./traitOf.js";

/**
 * Apply an item's stat effects: care meters are clamped to [0, max], trait
 * effects accumulate unclamped.
 * Side effects: mutates pet's care meters and traits. Does not save or
 * broadcast — callers do.
 *
 * @param {{effects: Object<string, number>}} item - Item from ALL_ITEMS.
 * @returns {void}
 */
export function applyItemEffects(item) {
  for (const [stat, amount] of Object.entries(item.effects)) {
    const meter = meterOf(stat);
    if (meter) {
      meter.value = Math.min(meter.max, Math.max(0, meter.value + amount));
      continue;
    }
    const trait = traitOf(stat);
    if (trait) trait.value += amount;
  }
}
