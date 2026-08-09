// adventure/advHave.js

import { adv } from "./state.js";

/**
 * How many of a requested item the storehouse holds, checking the goods or
 * materials pool depending on the request kind.
 *
 * @param {{kind: "good"|"material", key: string}} wants - The requested
 *   cargo descriptor.
 * @returns {number} Quantity in store (0 when none).
 */
export function advHave(wants) {
  const pool = wants.kind === "good" ? adv.goods : adv.materials;
  return pool[wants.key] ?? 0;
}
