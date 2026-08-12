// main/applySpecies.js — The Magic Station can swap the sprite sheet; all
// species share the grid. Classic and Legendary forms use their catalog
// sheet (the Legendary Cats currently borrow the white cat's file); custom
// uploads load from <data>/pets/ via the asset protocol.

import { convertFileSrc } from "../shared/tauri.js";
import { findForm, findSpecies } from "../items.js";
import { sheetEl, rt } from "./state.js";

/**
 * Swap the pet's sprite sheet to the given form (a no-op when the value is
 * not a string or already active). Custom forms need rt.petsDir and
 * rt.customForms to be populated (boot.js / the pet-state listener do).
 *
 * @param {string|undefined} species - Form key (e.g. "toy_poodle",
 *   "darcy", "custom-…").
 * @returns {void}
 */
export function applySpecies(species) {
  if (typeof species !== "string" || species === rt.currentSpecies) return;
  const builtin = findForm(species);
  const custom = rt.customForms.find((c) => c.key === species);
  let sheet;
  if (builtin) sheet = builtin.sheet;
  else if (custom && rt.petsDir) sheet = convertFileSrc(`${rt.petsDir}/${custom.file}`);
  else sheet = findSpecies(species).sheet; // unknown: poodle fallback
  rt.currentSpecies = species;
  sheetEl.style.backgroundImage = `url("${sheet}")`;
}
