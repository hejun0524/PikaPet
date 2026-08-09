// stats/applyDevCoins.js — Developer option: keep the wallet topped up.

import { pet } from "./state.js";
import { DEV_COINS } from "./constants.js";

/**
 * Refill the wallet to DEV_COINS when the devCoins setting is on and coins
 * dipped below the floor.
 * Side effects: may mutate pet.coins. Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if the wallet was refilled.
 */
export function applyDevCoins() {
  if (!pet.settings.devCoins || pet.coins >= DEV_COINS) return false;
  pet.coins = DEV_COINS;
  return true;
}
