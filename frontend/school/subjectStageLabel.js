// school/subjectStageLabel.js

import { t, tOr } from "../shared/i18n.js";
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
    ? t("school.stageLine", {
        emoji: info.stage.emoji,
        stage: tOr(`stage.${info.stage.key}`, info.stage.label),
        y: info.yearInStage,
        years: info.stage.years,
      })
    : t("school.masteredShort");
}
