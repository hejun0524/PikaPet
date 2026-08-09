// adventure/advLocated.js

import { adv } from "./state.js";
import { advSlot } from "./advSlot.js";

/**
 * Return the trusted sighting of an NPC, if any. A sighting is only trusted
 * while the NPC hasn't moved on (i.e. it was recorded in the current
 * location slot).
 *
 * @param {string} npcKey - NPC key.
 * @returns {{slot: string, era: string, city: string}|null} The fresh
 *   sighting, or null when unknown or stale.
 */
export function advLocated(npcKey) {
  const loc = adv.located[npcKey];
  return loc && loc.slot === advSlot() ? loc : null;
}
