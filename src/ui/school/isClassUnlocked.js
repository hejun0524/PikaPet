// school/isClassUnlocked.js

import { stageStartYears } from "./stageStartYears.js";

/**
 * Whether a course is available: its subject must have reached the course's
 * stage.
 *
 * @param {object} cls - Class entry from CLASS_CATALOG (`{ subject, stage }`
 *   are the fields used).
 * @param {Object<string, {years: number}>} subjects - Per-subject progress,
 *   keyed by subject key.
 * @returns {boolean} `true` when the subject's completed years reach the
 *   class's stage.
 */
export function isClassUnlocked(cls, subjects) {
  const years = subjects[cls.subject]?.years ?? 0;
  return years >= stageStartYears(cls.stage);
}
