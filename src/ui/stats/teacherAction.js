// stats/teacherAction.js — Caretaker automation: the teacher's schedule
// layer.

import { SUBJECTS, findClass, stageOfYears } from "../school.js";
import { pet } from "./state.js";
import { canPayDrain } from "./canPayDrain.js";
import { processPlan } from "./processPlan.js";

/**
 * Queue and start a class for the subject that is furthest behind (balanced
 * education), if affordable and payable.
 * Side effects: may mutate pet (plan, coins, care via processPlan). Does not
 * save or broadcast — callers do.
 *
 * @returns {boolean} True if a class was started.
 */
export function teacherAction() {
  // Balanced education: advance the subject that is furthest behind.
  let best = null;
  for (const subject of SUBJECTS) {
    const sub = pet.school.subjects[subject.key];
    const info = stageOfYears(sub.years);
    if (!info) continue; // mastered
    if (
      !best ||
      sub.years < best.sub.years ||
      (sub.years === best.sub.years && sub.credits < best.sub.credits)
    ) {
      best = { subject, sub, info };
    }
  }
  if (!best) return false;
  const cls = findClass(`${best.subject.key}-${best.info.stage.key}`);
  if (!cls || pet.coins < cls.cost || !canPayDrain(cls.drain)) return false;
  pet.activity.plan.push({ type: "class", key: cls.key });
  processPlan();
  return !!pet.activity.active;
}
