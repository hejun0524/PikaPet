// hub/pantryHas.js

import { state } from "./state.js";

/**
 * Whether the pantry holds every ingredient a recipe needs.
 *
 * @param {{ingredients: Object}} recipe - Recipe entry.
 * @returns {boolean} True when the recipe is cookable right now.
 */
export function pantryHas(recipe) {
  return Object.entries(recipe.ingredients).every(
    ([key, qty]) => (state.kitchen.pantry[key] ?? 0) >= qty
  );
}
