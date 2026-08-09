// school/stageEndYears.js

import { SCHOOL_STAGES } from "./schoolData.js";
import { stageStartYears } from "./stageStartYears.js";

/**
 * Completed-years count at which a stage is FINISHED (its diploma earned).
 *
 * @param {string} stageKey - Stage key (e.g. "grade", "phd").
 * @returns {number} Completed years needed to finish the stage, or `Infinity`
 *   if the key is unknown.
 */
export function stageEndYears(stageKey) {
  const stage = SCHOOL_STAGES.find((s) => s.key === stageKey);
  return stage ? stageStartYears(stageKey) + stage.years : Infinity;
}
