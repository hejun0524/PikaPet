// adventure/advNewTask.js

import { ADV_MATERIALS, ADV_NPCS, ADV_TRINKETS } from "./adventureData.js";
import { adv } from "./state.js";
import { advGoodValue } from "./advGoodValue.js";
import { advMs } from "./advMs.js";

/**
 * Post a new random notice on the board: a random NPC wanting either a
 * crafted good (20% chance, only from owned blueprints) or a batch of
 * materials, paying tokens and sometimes a trinket. Mutates `adv.tasks` and
 * `adv.taskSeq`; does not save (advProcess batches the save).
 *
 * @returns {void}
 */
export function advNewTask() {
  const npc = ADV_NPCS[Math.floor(Math.random() * ADV_NPCS.length)];
  let wants;
  if (adv.blueprints.length && Math.random() < 0.2) {
    const key = adv.blueprints[Math.floor(Math.random() * adv.blueprints.length)];
    wants = { kind: "good", key, qty: 1 };
  } else {
    const keys = Object.keys(ADV_MATERIALS);
    wants = { kind: "material", key: keys[Math.floor(Math.random() * keys.length)], qty: 3 + Math.floor(Math.random() * 6) };
  }
  const value = wants.kind === "good" ? advGoodValue(wants.key) : ADV_MATERIALS[wants.key].value * wants.qty;
  const trinketKeys = Object.keys(ADV_TRINKETS);
  adv.tasks.push({
    id: `t${adv.taskSeq++}`,
    npc: npc.key,
    wants,
    tokens: Math.round(value * 1.8) + 10,
    trinket: Math.random() < 0.4 ? trinketKeys[Math.floor(Math.random() * trinketKeys.length)] : null,
    expiresAt: Date.now() + advMs(60 + Math.floor(Math.random() * 180)),
    claimedBy: null,
  });
}
