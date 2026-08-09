// stats/refreshKitchen.js — Noonie's order board: every 3 hours (same slot
// clock as Pika's store) hungry pets phone in a fresh set of orders.

import { BASIC_RECIPES, CUSTOMERS, ORDER_COUNT, findRecipe, orderReward } from "../kitchen.js";
import { pet } from "./state.js";
import { pikaSlot } from "./pikaSlot.js";

/**
 * Re-roll the open orders when the 3-hour slot changes. Orders a bot is
 * already cooking/delivering stay untouched; only unclaimed ones expire.
 * Orders are drawn from recipes the kitchen actually knows (basics + learned
 * city dishes), so every order is cookable in principle.
 * Side effects: mutates pet.kitchen. Does not save/broadcast — callers do.
 *
 * @returns {boolean} True if the board was re-rolled.
 */
export function refreshKitchen() {
  const slot = pikaSlot();
  if (pet.kitchen.slot === slot) return false;
  const known = [...BASIC_RECIPES.map((r) => r.key), ...pet.kitchen.recipes];
  const fresh = Array.from({ length: ORDER_COUNT }, (_, i) => {
    const recipe = findRecipe(known[Math.floor(Math.random() * known.length)]);
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
    return {
      id: `${slot}#k${i}`,
      customer: { ...customer },
      recipe: recipe.key,
      reward: orderReward(recipe),
      status: "open",
      bot: null,
      endsAt: null,
    };
  });
  pet.kitchen.slot = slot;
  pet.kitchen.orders = [...pet.kitchen.orders.filter((o) => o.status !== "open"), ...fresh];
  return true;
}
