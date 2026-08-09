// adventure/advNoonieHTML.js

import { escText as esc } from "../panel.js";
import { ADV_HIRE_COST } from "./adventureData.js";
import { adv } from "./state.js";
import { advCandidates } from "./advCandidates.js";
import { advRecruitCardHTML } from "./advRecruitCardHTML.js";

/**
 * Render Noonie's tab: HR & Talent Acquisition — the roster (recruit cards,
 * including the infirmary heal buttons) and today's hiring candidates.
 *
 * @returns {string} HTML for the Noonie tab.
 */
export function advNoonieHTML() {
  const candidates = advCandidates();
  return `
    <p class="adv-prose">Noonie runs the guild's people: hiring, wellbeing, and the infirmary.
    Injured recruits mend on their own in a cot upstairs — or right away, for a fee.</p>

    <div class="adv-section">Roster</div>
    <div class="adv-cards">${adv.recruits.map(advRecruitCardHTML).join("")}</div>

    <div class="adv-section">Seeking work today</div>
    <div class="adv-cards">${
      candidates.length
        ? candidates
            .map(
              (c) => `
      <div class="adv-card">
        <div class="adv-card-head"><b class="adv-name">${esc(c.name)}</b><span class="adv-note">${esc(c.trade)}</span></div>
        <div class="adv-note">Level ${c.level}</div>
        <div class="adv-actions"><button class="adv-btn" data-adv-hire="${esc(c.name)}"
          ${adv.tokens >= ADV_HIRE_COST[c.level] ? "" : "disabled"}>Recruit · ${ADV_HIRE_COST[c.level]} 🐟</button></div>
      </div>`
            )
            .join("")
        : `<div class="adv-note">No one is looking for work today. New faces arrive each morning.</div>`
    }</div>`;
}
