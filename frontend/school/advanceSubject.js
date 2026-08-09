// school/advanceSubject.js

import { stageOfYears } from "./stageOfYears.js";

/**
 * Consume a subject's accumulated credits into completed years, MUTATING the
 * given progress object (`credits` down, `years` up, possibly several times).
 *
 * @param {{years: number, credits: number}} sub - One subject's progress;
 *   mutated in place.
 * @returns {string[]} Keys of any stages COMPLETED along the way — i.e.
 *   diplomas earned for this subject (empty when no stage finished).
 */
export function advanceSubject(sub) {
  const completed = [];
  for (;;) {
    const info = stageOfYears(sub.years);
    if (!info || sub.credits < info.stage.creditsPerYear) return completed;
    sub.credits -= info.stage.creditsPerYear;
    sub.years += 1;
    if (info.yearInStage === info.stage.years) completed.push(info.stage.key);
  }
}
