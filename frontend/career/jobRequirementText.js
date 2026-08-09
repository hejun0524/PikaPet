// career/jobRequirementText.js

import { t, tOr } from "../shared/i18n.js";
import { STAT_EMOJI } from "../items.js";
import { SCHOOL_STAGES, findSubject } from "../school.js";
import { levelLabel } from "./levelLabel.js";

/**
 * Human-readable unlock requirements shown on a locked job card.
 *
 * @param {object} job - Job entry from JOB_CATALOG (`{ requires }` is the
 *   field used).
 * @returns {string} Text like "Needs 📶 Junior 1 · 📚12 · 🎓 Middle School
 *   Literature", or an empty string when the job has no requirements.
 */
export function jobRequirementText(job) {
  const req = job.requires ?? {};
  const parts = [];
  if (req.level) parts.push(`📶 ${levelLabel(req.level)}`);
  for (const [trait, min] of Object.entries(req.traits ?? {})) {
    parts.push(`${STAT_EMOJI[trait]}${min}`);
  }
  for (const d of req.degrees ?? []) {
    const stage = SCHOOL_STAGES.find((s) => s.key === d.stage);
    const subject = findSubject(d.subject);
    parts.push(
      `🎓 ${tOr(`stage.${stage.key}`, stage.label)} ${tOr(`subject.${subject.key}`, subject.label)}`
    );
  }
  return parts.length ? t("job.needs", { parts: parts.join(" · ") }) : "";
}
