// adventure/advBuyBlueprint.js

import { adv } from "./state.js";
import { advBpOf } from "./advBpOf.js";
import { advLog } from "./advLog.js";
import { advSave } from "./advSave.js";

/**
 * Buy a blueprint from Pika, unlocking it permanently. No-op if unknown,
 * already owned, or tokens are short. Mutates `adv` (tokens, blueprints),
 * logs, and calls advSave(). Caller re-renders.
 *
 * @param {string} key - Blueprint key to buy.
 * @returns {void}
 */
export function advBuyBlueprint(key) {
  const bp = advBpOf(key);
  if (!bp || adv.blueprints.includes(key) || adv.tokens < bp.price) return;
  adv.tokens -= bp.price;
  adv.blueprints.push(key);
  advLog(`Bought the ${bp.label} blueprint from Pika for ${bp.price} tokens.`);
  advSave();
}
