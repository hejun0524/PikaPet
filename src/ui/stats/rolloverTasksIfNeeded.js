// stats/rolloverTasksIfNeeded.js

import { pet } from "./state.js";
import { generateTasks } from "./generateTasks.js";
import { evaluateTasks } from "./evaluateTasks.js";

/**
 * Roll Dune's board over to a new day if `pet.dune.date` is stale: keep the
 * streak only if yesterday's board (the old `date`) was fully cleared
 * (`lastAllDoneDate` matches it), otherwise reset it to 0. Regenerates 5
 * fresh tasks and clears progress/completion/claims for the new day (index
 * 5 of completed/claimed is the implicit "clear all 5" bonus slot).
 * Side effects: mutates pet.dune. Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if a rollover happened.
 */
export function rolloverTasksIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  const dune = pet.dune;
  if (dune.date === today) return false;
  if (dune.date && dune.lastAllDoneDate !== dune.date) {
    dune.streak = 0;
  }
  dune.date = today;
  dune.tasks = generateTasks();
  dune.progress = {};
  dune.completed = [false, false, false, false, false, false];
  dune.claimed = [false, false, false, false, false, false];
  evaluateTasks(); // safety net: a 0-threshold task would complete immediately
  return true;
}
