// hub/kitchenPantryHTML.js — Noonie's Kitchen, Pantry tab: the ingredient
// inventory, stocked from Pika's Organic Market.

import { t } from "../shared/i18n.js";
import { INGREDIENTS, ingredientName } from "../kitchen.js";
import { state } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * The Pantry tab: one card per stocked ingredient, or a restock hint.
 *
 * @returns {string} Page HTML for the grid.
 */
export function kitchenPantryHTML() {
  const stocked = INGREDIENTS.filter((ing) => (state.kitchen.pantry[ing.key] ?? 0) > 0);
  if (!stocked.length) {
    return `<div class="empty-note">${t("kitchen.pantryEmpty")}</div>`;
  }
  return stocked
    .map(
      (ing) => `
      <div class="item">
        <span class="qty">${state.kitchen.pantry[ing.key]}</span>
        <span class="icon">${ing.emoji}</span>
        <span class="name">${esc(ingredientName(ing))}</span>
        <span class="effects">💰${ing.price}</span>
      </div>`
    )
    .join("");
}
