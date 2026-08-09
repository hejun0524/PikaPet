// adventure/advIdleRecruits.js

import { adv } from "./state.js";

/**
 * List the recruits currently awaiting orders.
 *
 * @returns {object[]} All recruits whose status is "idle".
 */
export function advIdleRecruits() {
  return adv.recruits.filter((r) => r.status === "idle");
}
