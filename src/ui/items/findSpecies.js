// items/findSpecies.js

import { SPECIES } from "./species.js";

/**
 * Look up a species definition by key, falling back to the first species
 * (toy poodle) for unknown keys so callers always get a usable entry.
 *
 * @param {string} key - Species key (e.g. "toy_poodle", "white_cat").
 * @returns {object} The species entry from SPECIES
 *   (`{ key, label, breed, sheet, price, defaultName }`).
 */
export function findSpecies(key) {
  return SPECIES.find((s) => s.key === key) ?? SPECIES[0];
}
