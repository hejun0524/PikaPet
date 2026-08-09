// hub/jobPageHTML.js

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
      ${c.emoji} ${c.label}
    </button>`
  ).join("");
  const career = findCareer(ui.jobCareer);
  const prog = careerProgress(state.career.xp[ui.jobCareer] ?? 0);
  const progress = prog.maxed
    ? `<div class="xp-line">🏅 ${career.emoji} ${career.label} · Master 5 — maxed out!</div>`
    : `<div class="xp-line">📶 ${career.emoji} ${career.label} · ${prog.tierName} Lv ${prog.level}</div>
       <div class="credit-bar">
         <div class="track"><div class="fill" style="width:${(prog.intoLevel / prog.perLevel) * 100}%"></div></div>
         <span>${prog.intoLevel}/${prog.perLevel} XP</span>
       </div>`;
  // Talent bonus: same math the payout uses (career/payBoost.js).
  const focus = TRAIT_META.find((t) => t.key === career.trait);
  const boost = payBoostPercent(state.traits[career.trait]);
  const talent = `<div class="xp-line">${focus.emoji} Talent bonus: ${
    boost > 0 ? `+${boost}% pay` : "none yet"
  } — ${focus.label} raises every ${career.label} paycheck (+1%/point, max +50%)</div>`;
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
