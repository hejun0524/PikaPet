// stats/bumpTaskProgress.js

import { pet } from "./state.js";
import { evaluateTasks } from "./evaluateTasks.js";

/**
 * Bump one of today's Dune progress counters and re-check task completion.
 * Side effects: mutates pet.dune.progress, and via evaluateTasks() may mark
 * a task (or the all-5 slot) complete. Does not save or broadcast — callers
 * do.
 *
 * @param {string} counterKey - e.g. "shop.spend", "feed.cookie", "fight.win".
 * @param {number} [amount=1] - Amount to add.
 * @returns {boolean} True if anything changed (a task newly completed).
 */
export function bumpTaskProgress(counterKey, amount = 1) {
  pet.dune.progress[counterKey] = (pet.dune.progress[counterKey] ?? 0) + amount;
  return evaluateTasks();
}
