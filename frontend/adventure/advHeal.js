// adventure/advHeal.js

import { adv } from "./state.js";
import { advLog } from "./advLog.js";
import { advNoonieCost } from "./advNoonieCost.js";
import { advSave } from "./advSave.js";

/**
 * Pay Noonie to instantly heal an injured recruit. No-op if the recruit
 * isn't injured or tokens are short. Mutates `adv.tokens` and the recruit,
 * logs, and calls advSave(). Caller re-renders.
 *
 * @param {string} name - The recruit's name.
 * @returns {void}
 */
export function advHeal(name) {
  const recruit = adv.recruits.find((r) => r.name === name);
  if (!recruit || recruit.status !== "injured") return;
  const cost = advNoonieCost(recruit);
  if (adv.tokens < cost) return;
  adv.tokens -= cost;
  recruit.status = "idle";
  recruit.injuredUntil = 0;
  advLog(`Noonie patched ${recruit.name} up for ${cost} tokens — good as new.`);
  advSave();
}
