// stats/evaluateTasks.js

import { findTask } from "../tasks.js";
import { pet } from "./state.js";

/**
 * Check today's 5 real tasks against `pet.dune.progress`: mark any
 * newly-met task complete (reward is claimed separately — see
 * stats/claimTask.js) and bump the lifetime `totalCompleted` counter. Once
 * all 5 are complete, the implicit 6th "clear all 5" slot (index 5) also
 * completes, the streak advances, and `lastAllDoneDate` is stamped.
 * Side effects: mutates pet.dune. Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if anything changed.
 */
export function evaluateTasks() {
  const dune = pet.dune;
  let changed = false;
  dune.tasks.forEach((entry, i) => {
    if (dune.completed[i]) return;
    const task = findTask(entry.tier, entry.id);
    if (!task) return;
    const have = dune.progress[task.counterKey] ?? 0;
    if (have < task.threshold) return;
    dune.completed[i] = true;
    dune.totalCompleted += 1;
    changed = true;
  });
  if (!dune.completed[5] && dune.completed.slice(0, 5).every(Boolean)) {
    dune.completed[5] = true;
    dune.totalCompleted += 1;
    dune.streak += 1;
    dune.lastAllDoneDate = dune.date;
    changed = true;
  }
  return changed;
}
