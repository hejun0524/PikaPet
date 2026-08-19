// stats/generateTasks.js

import { TASK_POOLS } from "../tasks.js";

/**
 * Pick one random task from each of the 5 difficulty pools for a new day.
 *
 * @returns {Array<{tier: number, id: string}>} 5 entries, tier 1..5.
 */
export function generateTasks() {
  return TASK_POOLS.map((pool, i) => {
    const task = pool[Math.floor(Math.random() * pool.length)];
    return { tier: i + 1, id: task.id };
  });
}
