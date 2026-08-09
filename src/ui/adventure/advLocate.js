// adventure/advLocate.js

import { ADV_DARCY_LOCATE } from "./adventureData.js";
import { adv } from "./state.js";
import { advCityOf } from "./advCityOf.js";
import { advEraOf } from "./advEraOf.js";
import { advLocated } from "./advLocated.js";
import { advLog } from "./advLog.js";
import { advNpcOf } from "./advNpcOf.js";
import { advNpcSpot } from "./advNpcSpot.js";
import { advSave } from "./advSave.js";
import { advSlot } from "./advSlot.js";

/**
 * Pay Darcy to track down an NPC, recording a fresh sighting in the ledger.
 * No-op if the NPC is unknown, already freshly located, or tokens are short.
 * Mutates `adv` (tokens, located), logs, and calls advSave(). Caller
 * re-renders.
 *
 * @param {string} npcKey - Key of the NPC to locate.
 * @returns {void}
 */
export function advLocate(npcKey) {
  const npc = advNpcOf(npcKey);
  if (!npc || advLocated(npcKey) || adv.tokens < ADV_DARCY_LOCATE) return;
  adv.tokens -= ADV_DARCY_LOCATE;
  const spot = advNpcSpot(npc);
  adv.located[npcKey] = { slot: advSlot(), ...spot };
  advLog(`Darcy tracked ${npc.name} to ${advCityOf(spot.city).label}, ${advEraOf(spot.era).label} Era.`);
  advSave();
}
