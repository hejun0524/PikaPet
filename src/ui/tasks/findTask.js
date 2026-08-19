// tasks/findTask.js

import { TASK_POOLS } from "./taskPool.js";

/**
 * Look up a pool entry by tier + id (as stored in `pet.dune.tasks`). Does
 * NOT resolve the implicit 6th "clear all 5" task — that's BONUS_TASK,
 * addressed directly wherever needed (it isn't drawn from a pool).
 *
 * @param {number} tier - 1..5.
 * @param {string} id - Task id within that tier's pool.
 * @returns {object|undefined} The pool entry, or undefined if unknown.
 */
export function findTask(tier, id) {
  return TASK_POOLS[tier - 1]?.find((task) => task.id === id);
}
