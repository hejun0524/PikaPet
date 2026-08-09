// stats/caretakerBrain.js — Caretaker automation: caretaker behavior is
// data-driven from the CARETAKERS catalog: `care` enables the item layer,
// `schedule` is a rotation of activity kinds. One action per second keeps
// the pacing natural.

import { findCaretaker } from "../items.js";
import { pet, runtime } from "./state.js";
import { sitterLayer } from "./sitterLayer.js";
import { teacherAction } from "./teacherAction.js";
import { managerAction } from "./managerAction.js";
import { guideAction } from "./guideAction.js";
import { agentAction } from "./agentAction.js";

/** Schedule-kind -> action of the caretaker rotation. */
const SCHEDULE_ACTIONS = {
  class: teacherAction,
  job: managerAction,
  citytour: guideAction,
  sporttour: agentAction,
};

/**
 * Run one automation step for the caretaker on duty: care first (sitter
 * layer), then fill an empty activity slot from the caretaker's schedule
 * rotation (advancing runtime.scheduleStep).
 * Side effects: may mutate pet and runtime.scheduleStep. Does not save or
 * broadcast — callers do.
 *
 * @returns {boolean} True if the caretaker took an action this step.
 */
export function caretakerBrain() {
  const active = pet.caretaking.active;
  if (!active) return false;
  const def = findCaretaker(active.key);
  if (!def) return false;
  // Care first, then fill an empty activity slot from the rotation.
  if (def.care && sitterLayer()) return true;
  if (def.schedule && !pet.activity.active && pet.activity.plan.length === 0) {
    for (let i = 0; i < def.schedule.length; i++) {
      const kind = def.schedule[(runtime.scheduleStep + i) % def.schedule.length];
      const action = SCHEDULE_ACTIONS[kind];
      if (action && action()) {
        runtime.scheduleStep = (runtime.scheduleStep + i + 1) % def.schedule.length;
        return true;
      }
    }
  }
  return false;
}
