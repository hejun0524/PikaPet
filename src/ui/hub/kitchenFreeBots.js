// hub/kitchenFreeBots.js

import { state } from "./state.js";

/**
 * How many unlocked paw-bots are not currently cooking or delivering.
 *
 * @returns {number} Free bot count.
 */
export function kitchenFreeBots() {
  const busy = state.kitchen.orders.filter((o) => o.bot !== null && o.bot !== undefined).length;
  return Math.max(0, state.kitchen.bots - busy);
}
