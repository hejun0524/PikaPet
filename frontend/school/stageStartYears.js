// school/stageStartYears.js

import { SCHOOL_STAGES } from "./schoolData.js";

/**
 * Completed-years count at which a stage BEGINS (e.g. 0 for kindergarten,
 * 3 for grade school).
 *
 * @param {string} stageKey - Stage key (e.g. "grade", "phd").
 * @returns {number} Completed years needed to enter the stage, or `Infinity`
 *   if the key is unknown.
 */
export function stageStartYears(stageKey) {
  let acc = 0;
  for (const stage of SCHOOL_STAGES) {
    if (stage.key === stageKey) return acc;
    acc += stage.years;
  }
  return Infinity;
}
