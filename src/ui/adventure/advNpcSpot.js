// adventure/advNpcSpot.js

import { ADV_CITIES, ADV_ERAS } from "./adventureData.js";
import { advHash } from "./advHash.js";
import { advSlot } from "./advSlot.js";

/**
 * Compute where an NPC is right now: a deterministic pick from every
 * era × city combination in their range, reshuffled each location slot.
 *
 * @param {{key: string, eras: string[]|null, cities: string[]|null}} npc -
 *   The NPC record (null ranges mean unrestricted).
 * @returns {{era: string, city: string}} The NPC's current spot.
 */
export function advNpcSpot(npc) {
  const eras = npc.eras ?? ADV_ERAS.map((e) => e.key);
  const cities = npc.cities ?? ADV_CITIES.map((c) => c.key);
  const combos = [];
  for (const era of eras) for (const city of cities) combos.push({ era, city });
  return combos[advHash(npc.key + advSlot()) % combos.length];
}
