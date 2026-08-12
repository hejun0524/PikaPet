// hub/formInfo.js — resolve any form key (classic, legendary, or custom
// upload) to display info for the hub window.

import { convertFileSrc } from "../shared/tauri.js";
import { speciesBreed } from "../shared/names.js";
import { findForm, findSpecies } from "../items.js";
import { state, ui } from "./state.js";

/**
 * Breed text + spritesheet URL for a form key. Custom uploads resolve
 * against the data folder's pets/ dir (asset protocol); unknown keys fall
 * back to the toy poodle so the UI never breaks.
 *
 * @param {string} key - Form key ("white_cat", "darcy", "custom-…").
 * @returns {{breed: string, sheet: string}} Display info.
 */
export function formInfo(key) {
  const builtin = findForm(key);
  if (builtin) return { breed: speciesBreed(builtin), sheet: builtin.sheet };
  const custom = (state.customForms ?? []).find((c) => c.key === key);
  if (custom && ui.dataPaths) {
    return { breed: custom.breed, sheet: convertFileSrc(`${ui.dataPaths.pets}/${custom.file}`) };
  }
  return { breed: custom?.breed ?? speciesBreed(findSpecies(key)), sheet: findSpecies(key).sheet };
}
