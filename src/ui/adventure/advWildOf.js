// adventure/advWildOf.js

import { ADV_WILDS } from "./adventureData.js";

/**
 * Look up a wilderness site record by its key.
 *
 * @param {string} key - Wilderness site key (e.g. "forest").
 * @returns {object|undefined} The site record (`{ key, label, eras,
 *   difficulty, minutes, yields, blurb }`), or undefined when no site has
 *   that key.
 */
export function advWildOf(key) {
  return ADV_WILDS.find((w) => w.key === key);
}
