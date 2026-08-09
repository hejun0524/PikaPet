// kitchen/helpers.js — lookups and economy math for Noonie's Kitchen.

import { tOr } from "../shared/i18n.js";
import { INGREDIENTS, BOT_NAMES, BOT_PRICES, START_BOTS, MAX_BOTS } from "./kitchenData.js";
import { ALL_RECIPES } from "./cityRecipes.js";

/** @param {string} key @returns {object|undefined} INGREDIENTS entry. */
export function findIngredient(key) {
  return INGREDIENTS.find((i) => i.key === key);
}

/** @param {string} key @returns {object|undefined} ALL_RECIPES entry. */
export function findRecipe(key) {
  return ALL_RECIPES.find((r) => r.key === key);
}

/**
 * Translated ingredient name ("ing.<key>" in the locales).
 *
 * @param {{key: string, name: string}} ing - Catalog entry.
 * @returns {string} Localized name.
 */
export function ingredientName(ing) {
  return tOr(`ing.${ing.key}`, ing.name);
}

/**
 * Translated recipe/dish name. Basic recipes translate under
 * "recipe.<key>"; city dish names currently fall back to English everywhere.
 *
 * @param {{key: string, name: string}} recipe - Recipe entry.
 * @returns {string} Localized name.
 */
export function recipeName(recipe) {
  return tOr(`recipe.${recipe.key}`, recipe.name);
}

/**
 * Total market price of a recipe's ingredients.
 *
 * @param {{ingredients: Object}} recipe - Recipe entry.
 * @returns {number} Coins.
 */
export function recipeCost(recipe) {
  return Object.entries(recipe.ingredients).reduce(
    (sum, [key, qty]) => sum + (findIngredient(key)?.price ?? 0) * qty,
    0
  );
}

/**
 * Coins a customer pays for a finished, delivered order of this recipe:
 * ingredient cost with a healthy margin plus a delivery tip.
 *
 * @param {{ingredients: Object}} recipe - Recipe entry.
 * @returns {number} Coins.
 */
export function orderReward(recipe) {
  return Math.round(recipeCost(recipe) * 1.8 + 40);
}

/**
 * Coins to unlock the next paw-bot.
 *
 * @param {number} unlocked - Currently unlocked bot count.
 * @returns {number|null} Price, or null when all MAX_BOTS are unlocked.
 */
export function nextBotPrice(unlocked) {
  if (unlocked >= MAX_BOTS) return null;
  return BOT_PRICES[unlocked - START_BOTS];
}

/**
 * The cute robotic name of a bot slot.
 *
 * @param {number} index - Bot slot index (0-based).
 * @returns {string} Name like "Chip".
 */
export function botName(index) {
  return BOT_NAMES[index] ?? `Bot-${index + 1}`;
}
