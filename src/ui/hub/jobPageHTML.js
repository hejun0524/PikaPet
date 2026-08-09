// hub/jobPageHTML.js

import { t, tOr } from "../shared/i18n.js";
import { careerName, tierName } from "../shared/names.js";
import { state, ui } from "./state.js";
import { CAREERS, JOB_CATALOG, findCareer, careerProgress, payBoostPercent } from "../career.js";
import { TRAIT_META } from "../items.js";
import { activityStatusRowHTML } from "./activityStatusRowHTML.js";
import { jobCardHTML } from "./jobCardHTML.js";

/**
 * The Jobs page: career chips, the selected career's tier/level XP progress,
 * and one card per job of that career.
 *
 * @returns {string} Page HTML for the grid.
 */
export function jobPageHTML() {
  const chips = CAREERS.map(
    (c) => `
    <button class="career-chip ${c.key === ui.jobCareer ? "active" : ""}" data-career="${c.key}">
      ${c.emoji} ${careerName(c)}
    </button>`
  ).join("");
  const career = findCareer(ui.jobCareer);
  const prog = careerProgress(state.career.xp[ui.jobCareer] ?? 0);
  const progress = prog.maxed
    ? `<div class="xp-line">${t("career.maxed", { emoji: career.emoji, career: careerName(career) })}</div>`
    : `<div class="xp-line">${t("career.level", {
        emoji: career.emoji,
        career: careerName(career),
        tier: tierName(prog.tierName),
        level: prog.level,
      })}</div>
       <div class="credit-bar">
         <div class="track"><div class="fill" style="width:${(prog.intoLevel / prog.perLevel) * 100}%"></div></div>
         <span>${t("career.xp", { have: prog.intoLevel, need: prog.perLevel })}</span>
       </div>`;
  // Talent bonus: same math the payout uses (career/payBoost.js).
  const focus = TRAIT_META.find((tr) => tr.key === career.trait);
  const boost = payBoostPercent(state.traits[career.trait]);
  const talent = `<div class="xp-line">${t("career.talent", {
    emoji: focus.emoji,
    bonus: boost > 0 ? t("career.talentBonus", { pct: boost }) : t("school.talentNone"),
    trait: tOr(`trait.${focus.key}`, focus.label),
    career: careerName(career),
  })}</div>`;
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      ${progress}
      ${talent}
    </div>`;
  const jobs = JOB_CATALOG.filter((j) => j.career === ui.jobCareer)
    .map(jobCardHTML)
    .join("");
  return head + jobs;
}
