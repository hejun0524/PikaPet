// stats/kitchenBrain.js — resolves paw-bot work on the 1-second master
// clock: cooking finishes into "ready", deliveries finish into coins (and,
// with a little luck, a Skill Book for Darcy's training room — rarer tiers
// are rarer finds, see fightclub/books.js).

import { rollBookDrop } from "../fightclub.js";
import { pet } from "./state.js";
import { bumpTaskProgress } from "./bumpTaskProgress.js";

/** Kitchen log entries kept (newest first). */
const LOG_MAX = 8;

/**
 * Advance every in-progress order whose stage timer has elapsed:
 * cooking → ready (bot freed), delivering → order fulfilled (coins paid,
 * Skill Book drop roll, log entry written, order removed).
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
      bumpTaskProgress("kitchen.deliver");
      const log = [{ k: "delivered", c: order.customer.name, e: order.customer.emoji, r: order.recipe, w: order.reward }];
      const book = rollBookDrop();
      if (book) {
        pet.fightclub.books[book] += 1; // a Skill Book for Darcy's training room
        log.push({ k: "book", b: book });
      }
      pet.kitchen.log = [...log.reverse(), ...pet.kitchen.log].slice(0, LOG_MAX);
      pet.kitchen.orders = pet.kitchen.orders.filter((o) => o.id !== order.id);
      changed = true;
    }
  }
  return changed;
}
