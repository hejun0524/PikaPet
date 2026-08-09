// stats/traitOf.js

import { pet } from "./state.js";

/**
 * Look up one of the pet's trait entries by key.
 *
 * @param {string} key - Trait key (e.g. "smarts").
 * @returns {{key: string, value: number}|undefined} The live trait object
 *   (mutating it mutates pet state), or undefined if no such trait.
 */
export function traitOf(key) {
  return pet.traits.find((t) => t.key === key);
}
