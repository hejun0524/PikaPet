// adventure/advNpcOf.js

import { ADV_NPCS } from "./adventureData.js";

/**
 * Look up an NPC record by its key.
 *
 * @param {string} key - NPC key (e.g. "maximus").
 * @returns {{key: string, name: string, eras: string[]|null,
 *   cities: string[]|null}|undefined} The NPC record, or undefined when no
 *   NPC has that key.
 */
export function advNpcOf(key) {
  return ADV_NPCS.find((n) => n.key === key);
}
