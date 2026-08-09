// adventure/advSellTrinket.js

import { ADV_TRINKETS } from "./adventureData.js";
import { adv } from "./state.js";
import { advLog } from "./advLog.js";
import { advSave } from "./advSave.js";

/**
 * Sell one trinket back to Pika at its listed price. No-op when none are in
 * store. Mutates `adv` (trinkets, tokens), logs, and calls advSave().
 * Caller re-renders.
 *
 * @param {string} key - Trinket key to sell.
 * @returns {void}
 */
export function advSellTrinket(key) {
  if (!(adv.trinkets[key] > 0)) return;
  adv.trinkets[key]--;
  if (adv.trinkets[key] === 0) delete adv.trinkets[key];
  adv.tokens += ADV_TRINKETS[key].price;
  advLog(`Pika bought a ${ADV_TRINKETS[key].label.toLowerCase()} for ${ADV_TRINKETS[key].price} tokens.`);
  advSave();
}
