// adventure/advGuildLevel.js

import { adv } from "./state.js";

/**
 * Compute the guild's level from how many notices have been answered: one
 * level per 5 completed deliveries, starting at level 1.
 *
 * @returns {number} The current guild level (1+).
 */
export function advGuildLevel() {
  return Math.floor(adv.completed / 5) + 1;
}
