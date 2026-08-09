// kitchen/cityRecipes.js — generate one recipe per touring city: the dish
// name comes from CITY_DISHES, its ingredient list is drawn deterministically
// (seeded by the city name) from the destination's cuisine pool.

import { DESTINATIONS } from "../touring.js";
import {
  BASIC_RECIPES,
  BASIC_COOK_MINUTES,
  CITY_COOK_MINUTES,
  CITY_DISHES,
  CUISINE_POOLS,
} from "./kitchenData.js";

/**
 * Tiny deterministic string hash (same result every launch, so recipe
 * ingredient lists never change under the player).
 *
 * @param {string} s - Seed string.
 * @returns {number} Unsigned 32-bit hash.
 */
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * One generated recipe per city: `{ key: "dish:<city>", city, dest, emoji,
 * name, ingredients, cookMinutes }`. Ingredients = salt & pepper plus three
 * distinct picks from the destination's cuisine pool.
 */
export const CITY_RECIPES = DESTINATIONS.flatMap((dest) =>
  dest.cities.map((city) => {
    const pool = CUISINE_POOLS[dest.key];
    const h = hashStr(city);
    // Seeded walk with a guaranteed-terminating linear fallback (a stride
    // that divides the pool length would otherwise revisit the same slots).
    const start = h % pool.length;
    const stride = 1 + (Math.floor(h / 8) % (pool.length - 1));
    const picks = new Set();
    for (let i = 0; picks.size < 3 && i < pool.length; i++) {
      picks.add(pool[(start + i * stride) % pool.length]);
    }
    for (let i = 1; picks.size < 3; i++) {
      picks.add(pool[(start + i) % pool.length]);
    }
    const ingredients = { salt: 1 };
    for (const key of picks) ingredients[key] = (ingredients[key] ?? 0) + 1;
    // The seed also makes one pool ingredient a double portion.
    const double = [...picks][h % 3];
    ingredients[double] += 1;
    return {
      key: `dish:${city}`,
      city,
      dest: dest.key,
      emoji: "🍽️",
      name: CITY_DISHES[city] ?? `${city} Special`,
      ingredients,
      cookMinutes: CITY_COOK_MINUTES,
    };
  })
);

/** Every recipe: the always-known basics plus all city dishes. */
export const ALL_RECIPES = [
  ...BASIC_RECIPES.map((r) => ({ ...r, cookMinutes: BASIC_COOK_MINUTES })),
  ...CITY_RECIPES,
];
