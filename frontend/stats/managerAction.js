// stats/managerAction.js — Caretaker automation: the manager's schedule
// layer.

import { CAREERS, JOB_CATALOG, isJobUnlocked } from "../career.js";
import { pet } from "./state.js";
import { canPayDrain } from "./canPayDrain.js";
import { processPlan } from "./processPlan.js";

/**
 * Queue and start the best-paying affordable job of the pet's strongest
 * career (falling back through weaker careers).
 * Side effects: may mutate pet (plan, care via processPlan). Does not save
 * or broadcast — callers do.
 *
 * @returns {boolean} True if a job was started.
 */
export function managerAction() {
  // Deepen the strongest career with its best-paying affordable job.
  const ctx = {
    xp: pet.career.xp,
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    subjects: pet.school.subjects,
  };
  const careers = [...CAREERS].sort(
    (a, b) => (pet.career.xp[b.key] ?? 0) - (pet.career.xp[a.key] ?? 0)
  );
  for (const career of careers) {
    const jobs = JOB_CATALOG.filter(
      (j) => j.career === career.key && isJobUnlocked(j, ctx) && canPayDrain(j.drain)
    ).sort((a, b) => b.pay - a.pay);
    if (jobs.length) {
      pet.activity.plan.push({ type: "job", key: jobs[0].key });
      processPlan();
      return !!pet.activity.active;
    }
  }
  return false;
}
