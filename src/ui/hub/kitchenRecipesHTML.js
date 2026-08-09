// hub/kitchenRecipesHTML.js — Noonie's Kitchen, Recipes tab: the house
// recipes, then EVERY city dish grouped by country — unlearned ones greyed
// out with a 🔒 (tours and Pika's shop unlock them).

import { t } from "../shared/i18n.js";
import { placeLabel, cityName } from "../shared/names.js";
import { ALL_RECIPES, findIngredient, ingredientName, recipeName } from "../kitchen.js";
import { DESTINATIONS } from "../touring.js";
import { state } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * The Recipes tab: a "House recipes" section, then one section per country
 * with all of its city dishes (known = full card, unknown = greyed 🔒 card).
 *
 * @returns {string} Page HTML for the grid.
 */
export function kitchenRecipesHTML() {
  const known = new Set(state.kitchen.recipes);
  const note = `<div class="ach-section caretaker-title">${t("kitchen.recipesNote")}</div>`;
  const basics =
    `<div class="ach-section">${t("kitchen.basicSection")}</div>` +
    ALL_RECIPES.filter((r) => !r.city)
      .map((r) => recipeCardHTML(r, t("kitchen.recipeBasic"), r.emoji, true))
      .join("");
  const countries = DESTINATIONS.map((dest) => {
    const dishes = ALL_RECIPES.filter((r) => r.dest === dest.key);
    if (!dishes.length) return "";
    const header = `<div class="ach-section">${dest.emoji} ${placeLabel(dest)}</div>`;
    const cards = dishes
      .map((r) =>
        recipeCardHTML(
          r,
          t("kitchen.recipeFrom", { city: cityName(r.city), place: placeLabel(dest) }),
          "📜",
          known.has(r.key)
        )
      )
      .join("");
    return header + cards;
  }).join("");
  return note + basics + countries;
}

/** One recipe card; unlearned city dishes render greyed with a 🔒. */
function recipeCardHTML(recipe, originLine, icon, unlocked) {
  if (!unlocked) {
    return `
      <div class="item locked">
        <span class="qty lock">🔒</span>
        <span class="icon">${icon}</span>
        <span class="name">${esc(recipeName(recipe))}</span>
        <span class="effects">${originLine}</span>
        <span class="effects">${t("kitchen.recipeLockedHint")}</span>
      </div>`;
  }
  const needs = Object.entries(recipe.ingredients)
    .map(([key, qty]) => {
      const ing = findIngredient(key);
      return `${qty}×${ing.emoji}${esc(ingredientName(ing))}`;
    })
    .join(" · ");
  return `
      <div class="item">
        <span class="icon">${icon}</span>
        <span class="name">${esc(recipeName(recipe))}</span>
        <span class="effects">${originLine}</span>
        <span class="effects">${needs}</span>
        <span class="effects">⏱ ${recipe.cookMinutes}m</span>
      </div>`;
}
