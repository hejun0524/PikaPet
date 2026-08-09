// main/applySpecies.js — The Magic Station can swap the sprite sheet; all
// species share the grid.

import { petEl, rt } from "./state.js";

/**
 * Swap the pet's sprite sheet to the given species (a no-op when the value is
 * not a string or already active).
 *
 * Side effects: writes `petEl.style.backgroundImage`, updates
 * `rt.currentSpecies`.
 *
 * @param {string|undefined} species - Species id (e.g. "toy_poodle"); the
 *   sprite sheet is loaded from `pets/<species>.webp`.
 * @returns {void}
 */
export function applySpecies(species) {
  if (typeof species !== "string" || species === rt.currentSpecies) return;
  rt.currentSpecies = species;
  petEl.style.backgroundImage = `url("pets/${species}.webp")`;
}
