// school/stageOfYears.js

import { SCHOOL_STAGES } from "./schoolData.js";

/**
 * Find which school stage a subject is currently in, given its completed
 * years.
 *
 * @param {number} years - Completed school years in the subject (0..26).
 * @returns {{stage: object, yearInStage: number}|null} The current stage
 *   entry and the 1-based year within it, or `null` when every stage is done
 *   (subject mastered).
 */
export function stageOfYears(years) {
  let acc = 0;
  for (const stage of SCHOOL_STAGES) {
    if (years < acc + stage.years) return { stage, yearInStage: years - acc + 1 };
    acc += stage.years;
  }
  return null; // subject mastered
}
