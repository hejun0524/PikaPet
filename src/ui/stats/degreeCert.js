// stats/degreeCert.js

import { SCHOOL_STAGES, findSubject } from "../school.js";

/**
 * Build a degree achievement record (a framed certificate on the
 * achievements page) for finishing a school stage in one subject.
 *
 * @param {string} subjectKey - Subject key (see SUBJECTS).
 * @param {string} stageKey - School stage key (see SCHOOL_STAGES).
 * @returns {{type: "degree", subject: string, stage: string, emoji: string,
 *   label: string, date: string}} New achievement object (dated today).
 */
export function degreeCert(subjectKey, stageKey) {
  const stage = SCHOOL_STAGES.find((s) => s.key === stageKey);
  const subject = findSubject(subjectKey);
  return {
    type: "degree",
    subject: subjectKey,
    stage: stageKey,
    emoji: stage.emoji,
    label: `${stage.label} Diploma in ${subject.label}`,
    date: new Date().toISOString().slice(0, 10),
  };
}
