// school/subjectStageLabel.js

import { stageOfYears } from "./stageOfYears.js";

/**
 * Short progress label for a subject, shown on the School page.
 *
 * @param {{years: number, credits: number}} sub - One subject's progress.
 * @returns {string} Text like "🎒 Grade School · Y2/6", or "🎉 Mastered" when
 *   every stage is complete.
 */
export function subjectStageLabel(sub) {
  const info = stageOfYears(sub.years);
  return info
    ? `${info.stage.emoji} ${info.stage.label} · Y${info.yearInStage}/${info.stage.years}`
    : "🎉 Mastered";
}
