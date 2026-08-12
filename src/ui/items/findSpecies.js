// items/findSpecies.js

import { SPECIES } from "./species.js";
import { SPECIAL_SPECIES } from "./specialForms.js";

/**
 * Look up a BUILT-IN form (classic species or Legendary Cat) by key, with
 * no fallback. User-uploaded custom forms are not in any catalog — resolve
 * those from pet.customForms (see hub/formInfo.js, stats/formInfo.js).
 *
 * @param {string} key - Form key (e.g. "white_cat", "darcy").
 * @returns {object|undefined} The catalog entry, or undefined.
 */
export function findForm(key) {
  return SPECIES.find((s) => s.key === key) ?? SPECIAL_SPECIES.find((s) => s.key === key);
}

/**
 * Like findForm, but falls back to the first species (toy poodle) for
 * unknown keys so callers always get a usable entry.
 *
 * @param {string} key - Form key (e.g. "toy_poodle", "white_cat").
 * @returns {object} A catalog entry
 *   (`{ key, label, breed, sheet, price?, defaultName }`).
 */
export function findSpecies(key) {
  return findForm(key) ?? SPECIES[0];
}
