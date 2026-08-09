// stats/sitterLayer.js — Caretaker automation: the sitter layer keeps
// meters high with items (inventory first, auto-buys at plain cost when out
// of stock). One action per second keeps the pacing natural.

import { ALL_ITEMS } from "../items.js";
import { SICK_BELOW } from "../touring.js";
import { pet } from "./state.js";
import { DECAY_KEYS, SITTER_CARE_LINE } from "./constants.js";
import { meterOf } from "./meterOf.js";
import { canAfford } from "./canAfford.js";
import { applyItemEffects } from "./applyItemEffects.js";

/**
 * Top up the worst care meter below its line (health below SICK_BELOW,
 * decaying meters below SITTER_CARE_LINE) using the cheapest suitable item —
 * from the bag if stocked, otherwise bought at plain cost.
 * Side effects: may mutate pet (bag, coins, care meters/traits via item
 * effects). Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if an item was used (one action taken).
 */
export function sitterLayer() {
  const targets = [];
  const health = meterOf("health");
  if (health.value < SICK_BELOW) targets.push({ stat: "health", meter: health });
  for (const key of DECAY_KEYS) {
    const meter = meterOf(key);
    if (meter.value < SITTER_CARE_LINE) targets.push({ stat: key, meter });
  }
  if (!targets.length) return false;
  targets.sort((a, b) => a.meter.value - b.meter.value); // worst first

  const { stat } = targets[0];
  const candidates = ALL_ITEMS.filter(
    (i) => (i.effects[stat] ?? 0) > 0 && typeof i.price === "number" && canAfford(i)
  );
  const owned = candidates
    .filter((i) => pet.bag[i.key] > 0)
    .sort((a, b) => a.price - b.price);
  if (owned.length) {
    pet.bag[owned[0].key] -= 1;
    applyItemEffects(owned[0]);
    return true;
  }
  const buyable = candidates
    .filter((i) => pet.coins >= i.price)
    .sort((a, b) => a.price - b.price);
  if (buyable.length) {
    pet.coins -= buyable[0].price; // bought at plain cost, no service fee
    applyItemEffects(buyable[0]);
    return true;
  }
  return false;
}
