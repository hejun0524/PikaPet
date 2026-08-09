// stats/isEntryUnlocked.js

import { isJobUnlocked } from "../career.js";
import { isClassUnlocked } from "../school.js";
import { pet } from "./state.js";
import { activityDef } from "./activityDef.js";

/**
 * Check whether the pet currently meets a plan entry's unlock requirements
 * (career XP/traits/degrees for jobs, prior stages for classes; tours are
 * always unlocked). No side effects.
 *
 * @param {{type: string, key: string}} entry - Plan entry.
 * @returns {boolean} True if the entry can be started.
 */
export function isEntryUnlocked(entry) {
  const def = activityDef(entry);
  if (!def) return false;
  if (entry.type === "job") {
    return isJobUnlocked(def, {
      xp: pet.career.xp,
      traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
      subjects: pet.school.subjects,
    });
  }
  if (entry.type === "tour") return true;
  return isClassUnlocked(def, pet.school.subjects);
}
