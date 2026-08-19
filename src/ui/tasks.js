// tasks.js — master file for Dune's Daily Tasks: the difficulty-tiered task
// pools + the implicit 6th "clear all 5" task (tasks/taskPool.js), pool
// lookup (tasks/findTask.js), and card text helpers (tasks/taskDesc.js,
// tasks/rewardText.js). Import from here, like items.js / kitchen.js /
// fightclub.js.

export { TASK_POOLS, UNLOCK_STREAK, BONUS_TASK, TEMPLATE_EMOJI } from "./tasks/taskPool.js";
export { findTask } from "./tasks/findTask.js";
export { taskDesc } from "./tasks/taskDesc.js";
export { rewardText } from "./tasks/rewardText.js";
