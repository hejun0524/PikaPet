// career/hasDegree.js

import { stageEndYears } from "../school.js";

/**
 * Whether a subject holds a given stage's diploma (i.e. the subject has
 * completed that stage).
 *
 * @param {Object<string, {years: number}>} subjects - Per-subject progress,
 *   keyed by subject key.
 * @param {string} subjectKey - Subject to check (e.g. "science").
 * @param {string} stageKey - Stage whose diploma is required (e.g. "middle").
 * @returns {boolean} `true` when the subject's completed years reach the end
 *   of the stage.
 */
export function hasDegree(subjects, subjectKey, stageKey) {
  return (subjects[subjectKey]?.years ?? 0) >= stageEndYears(stageKey);
}
