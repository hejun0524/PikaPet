// adventure/advBpOf.js

import { ADV_BLUEPRINTS } from "./adventureData.js";

/**
 * Look up a blueprint record by its key.
 *
 * @param {string} key - Blueprint key (e.g. "tonic").
 * @returns {{key: string, label: string, price: number,
 *   needs: Object<string, number>}|undefined} The blueprint record, or
 *   undefined when no blueprint has that key.
 */
export function advBpOf(key) {
  return ADV_BLUEPRINTS.find((b) => b.key === key);
}
