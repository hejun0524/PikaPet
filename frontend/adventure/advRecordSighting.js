// adventure/advRecordSighting.js

import { adv } from "./state.js";
import { advSave } from "./advSave.js";
import { advSlot } from "./advSlot.js";

/**
 * Record a fresh sighting of an NPC in the ledger. Spotting an acquaintance
 * while browsing a city counts as a sighting, same as paying Darcy — it
 * feeds the ledger on Darcy's tab. Mutates `adv.located` and calls advSave()
 * when the entry actually changes.
 *
 * @param {string} npcKey - NPC key.
 * @param {{era: string, city: string}} spot - Where the NPC was seen.
 * @returns {void}
 */
export function advRecordSighting(npcKey, spot) {
  const slot = advSlot();
  const cur = adv.located[npcKey];
  if (!cur || cur.slot !== slot || cur.era !== spot.era || cur.city !== spot.city) {
    adv.located[npcKey] = { slot, ...spot };
    advSave();
  }
}
