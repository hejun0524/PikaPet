// stats/kitchenBrain.js — resolves paw-bot work on the 1-second master
// clock: cooking finishes into "ready", deliveries finish into coins (and,
// with a little luck, a skill book for Darcy's bookshelf).

import { BOOK_DROP_CHANCE } from "../kitchen.js";
import { pet } from "./state.js";

/** Kitchen log entries kept (newest first). */
const LOG_MAX = 8;

/**
 * Advance every in-progress order whose stage timer has elapsed:
 * cooking → ready (bot freed), delivering → order fulfilled (coins paid,
 * BOOK_DROP_CHANCE roll for a skill book, log entry written, order removed).
 * Side effects: mutates pet.kitchen / pet.fightclub / pet.coins.
 *
 * @returns {boolean} True if anything changed (callers render/save/broadcast).
 */
export function kitchenBrain() {
  const now = Date.now();
  let changed = false;
  for (const order of [...pet.kitchen.orders]) {
    if (!order.endsAt || now < order.endsAt) continue;
    if (order.status === "cooking") {
      order.status = "ready";
      order.bot = null;
      order.endsAt = null;
      changed = true;
    } else if (order.status === "delivering") {
      pet.coins += order.reward;
      const log = [{ k: "delivered", c: order.customer.name, e: order.customer.emoji, r: order.recipe, w: order.reward }];
      if (Math.random() < BOOK_DROP_CHANCE) {
        pet.fightclub.books += 1; // a Training Manual for Darcy's skill tab
        log.push({ k: "book" });
      }
      pet.kitchen.log = [...log.reverse(), ...pet.kitchen.log].slice(0, LOG_MAX);
      pet.kitchen.orders = pet.kitchen.orders.filter((o) => o.id !== order.id);
      changed = true;
    }
  }
  return changed;
}
