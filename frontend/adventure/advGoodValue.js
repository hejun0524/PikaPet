// adventure/advGoodValue.js

import { ADV_MATERIALS } from "./adventureData.js";
import { advBpOf } from "./advBpOf.js";

/**
 * Compute the token value of a crafted good: twice the summed value of the
 * materials its blueprint consumes.
 *
 * @param {string} bpKey - Blueprint key of the good.
 * @returns {number} The good's value in tokens.
 */
export function advGoodValue(bpKey) {
  const bp = advBpOf(bpKey);
  return Object.entries(bp.needs).reduce((sum, [k, q]) => sum + ADV_MATERIALS[k].value * q, 0) * 2;
}
