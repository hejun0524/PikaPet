// adventure/advRecruitCardHTML.js

import { escText as esc } from "../panel.js";
import { adv } from "./state.js";
import { advCityOf } from "./advCityOf.js";
import { advCountdown } from "./advCountdown.js";
import { advNoonieCost } from "./advNoonieCost.js";
import { advNpcOf } from "./advNpcOf.js";
import { advWildOf } from "./advWildOf.js";
import { advXpNeed } from "./advXpNeed.js";

/**
 * Render one recruit's roster card: name, trade, level/XP bar, and a status
 * line (injured with a heal button, working with a countdown, or idle).
 *
 * @param {object} r - The recruit record to render.
 * @returns {string} HTML for the recruit card.
 */
export function advRecruitCardHTML(r) {
  let status;
  if (r.status === "injured") {
    const cost = advNoonieCost(r);
    status = `<span class="adv-injured">Injured — mends in ${advCountdown(r.injuredUntil)}</span>
      <button class="adv-btn" data-adv-heal="${esc(r.name)}" ${adv.tokens >= cost ? "" : "disabled"}>
        Noonie's care · ${cost} 🐟</button>`;
  } else if (r.status === "working" && r.mission) {
    const m = r.mission;
    status =
      m.type === "gather"
        ? `Gathering at the ${esc(advWildOf(m.site).label)} — back in ${advCountdown(m.endsAt)}`
        : `Delivering to ${esc(advNpcOf(m.npc).name)} in ${esc(advCityOf(m.city).label)} — arrives in ${advCountdown(m.endsAt)}`;
  } else {
    status = "Awaiting orders in the guild hall.";
  }
  const need = advXpNeed(r.level);
  return `
    <div class="adv-card ${r.status !== "idle" ? "adv-dim" : ""}">
      <div class="adv-card-head"><b class="adv-name">${esc(r.name)}</b><span class="adv-note">${esc(r.trade)}</span></div>
      <div class="adv-note">Level ${r.level} · ${r.xp}/${need} xp</div>
      <div class="adv-xp"><i style="width:${Math.round((r.xp / need) * 100)}%"></i></div>
      <div class="adv-status">${status}</div>
    </div>`;
}
