// hub/schoolPageHTML.js

import { state, ui } from "./state.js";
import {
  SUBJECTS,
  CLASS_CATALOG,
  SUBJECT_TRAIT,
  findSubject,
  stageOfYears,
  subjectStageLabel,
  studyBoostPercent,
} from "../school.js";
import { TRAIT_META } from "../items.js";
import { activityStatusRowHTML } from "./activityStatusRowHTML.js";
import { classCardHTML } from "./classCardHTML.js";

/**
 * The School page: subject chips, the selected subject's stage/credit
 * progress, and one card per class of that subject.
 *
 * @returns {string} Page HTML for the grid.
 */
export function schoolPageHTML() {
  const chips = SUBJECTS.map(
    (s) => `
    <button class="career-chip ${s.key === ui.schoolSubject ? "active" : ""}" data-subject="${s.key}">
      ${s.emoji} ${s.label}
    </button>`
  ).join("");
  const sub = state.school.subjects[ui.schoolSubject] ?? { years: 0, credits: 0 };
  const info = stageOfYears(sub.years);
  const progress = info
    ? `<div class="xp-line">${subjectStageLabel(sub)}</div>
       <div class="credit-bar">
         <div class="track"><div class="fill" style="width:${Math.min(100, (sub.credits / info.stage.creditsPerYear) * 100)}%"></div></div>
         <span>${sub.credits}/${info.stage.creditsPerYear} credits</span>
       </div>`
    : `<div class="xp-line">🎉 ${findSubject(ui.schoolSubject).label} mastered!</div>`;
  // Talent bonus: same math the class clock uses (school/studyBoost.js).
  const trait = TRAIT_META.find((t) => t.key === SUBJECT_TRAIT[ui.schoolSubject]);
  const boost = studyBoostPercent(state.traits[trait.key]);
  const talent = `<div class="xp-line">${trait.emoji} Talent bonus: ${
    boost > 0 ? `classes finish ${boost}% sooner` : "none yet"
  } — ${trait.label} speeds up ${findSubject(ui.schoolSubject).label} classes (−0.5%/point, max −25%)</div>`;
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      ${progress}
      ${talent}
    </div>`;
  const classes = CLASS_CATALOG.filter((c) => c.subject === ui.schoolSubject)
    .map(classCardHTML)
    .join("");
  return head + classes;
}
