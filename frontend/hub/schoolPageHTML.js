// hub/schoolPageHTML.js

import { t, tOr } from "../shared/i18n.js";
import { subjectName } from "../shared/names.js";
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
      ${s.emoji} ${subjectName(s)}
    </button>`
  ).join("");
  const subject = findSubject(ui.schoolSubject);
  const sub = state.school.subjects[ui.schoolSubject] ?? { years: 0, credits: 0 };
  const info = stageOfYears(sub.years);
  const progress = info
    ? `<div class="xp-line">${subjectStageLabel(sub)}</div>
       <div class="credit-bar">
         <div class="track"><div class="fill" style="width:${Math.min(100, (sub.credits / info.stage.creditsPerYear) * 100)}%"></div></div>
         <span>${t("school.credits", { have: sub.credits, need: info.stage.creditsPerYear })}</span>
       </div>`
    : `<div class="xp-line">${t("school.mastered", { subject: subjectName(subject) })}</div>`;
  // Talent bonus: same math the class clock uses (school/studyBoost.js).
  const trait = TRAIT_META.find((tr) => tr.key === SUBJECT_TRAIT[ui.schoolSubject]);
  const boost = studyBoostPercent(state.traits[trait.key]);
  const talent = `<div class="xp-line">${t("school.talent", {
    emoji: trait.emoji,
    bonus: boost > 0 ? t("school.talentBonus", { pct: boost }) : t("school.talentNone"),
    trait: tOr(`trait.${trait.key}`, trait.label),
    subject: subjectName(subject),
  })}</div>`;
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
