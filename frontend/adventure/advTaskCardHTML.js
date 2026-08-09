// adventure/advTaskCardHTML.js

import { escText as esc } from "../panel.js";
import { ADV_DARCY_EXPRESS, ADV_DARCY_LOCATE, ADV_TRINKETS } from "./adventureData.js";
import { adv } from "./state.js";
import { advCityOf } from "./advCityOf.js";
import { advCountdown } from "./advCountdown.js";
import { advEraOf } from "./advEraOf.js";
import { advHave } from "./advHave.js";
import { advIdleRecruits } from "./advIdleRecruits.js";
import { advLocated } from "./advLocated.js";
import { advMs } from "./advMs.js";
import { advNpcOf } from "./advNpcOf.js";
import { advRecruitSelectHTML } from "./advRecruitSelectHTML.js";
import { advTravelMinutes } from "./advTravelMinutes.js";
import { advWantLabel } from "./advWantLabel.js";

/**
 * Render one notice-board card: what the NPC wants and pays, their known
 * whereabouts (with an "Ask Darcy" button when unknown), and — when the
 * cargo is in store and the NPC located — the dispatch controls (recruit
 * picker, regular and Express delivery buttons with timing notes).
 *
 * @param {object} task - The task/notice record to render.
 * @returns {string} HTML for the task card.
 */
export function advTaskCardHTML(task) {
  const npc = advNpcOf(task.npc);
  const loc = advLocated(task.npc);
  const have = advHave(task.wants);
  const enough = have >= task.wants.qty;
  const claimed = !!task.claimedBy;

  let whereabouts;
  if (claimed) {
    whereabouts = `<span class="adv-note">${esc(task.claimedBy)} is on the way.</span>`;
  } else if (loc) {
    whereabouts = `<span class="adv-note">Seen in ${esc(advCityOf(loc.city).label)}, ${esc(advEraOf(loc.era).label)} Era — per Darcy.</span>`;
  } else {
    whereabouts = `<span class="adv-note">Whereabouts unknown.</span>
      <button class="adv-btn" data-adv-locate="${task.npc}" ${adv.tokens >= ADV_DARCY_LOCATE ? "" : "disabled"}>
        Ask Darcy · ${ADV_DARCY_LOCATE} 🐟</button>`;
  }

  let dispatch = "";
  if (!claimed && loc && enough) {
    const minutes = advTravelMinutes(loc.era, loc.city);
    const expressMin = Math.ceil(minutes / 2);
    const now = Date.now();
    const idle = advIdleRecruits().length > 0;
    const plainInTime = now + advMs(minutes) <= task.expiresAt;
    const expressInTime = now + advMs(expressMin) <= task.expiresAt;
    const plainOk = idle && plainInTime;
    const expressOk = idle && expressInTime && adv.tokens >= ADV_DARCY_EXPRESS;
    let timeNote = "";
    if (!expressInTime) timeNote = `<div class="adv-note">Not even the Darcy Express can make it before this notice expires.</div>`;
    else if (!plainInTime) timeNote = `<div class="adv-note">A regular courier would arrive after the notice expires — take the Express.</div>`;
    dispatch = `
      <div class="adv-actions">
        ${advRecruitSelectHTML(`adv-dsel-${task.id}`)}
        <button class="adv-btn" data-adv-deliver="${task.id}" ${plainOk ? "" : "disabled"}>Deliver · ${minutes}m</button>
        <button class="adv-btn" data-adv-deliver="${task.id}" data-express="1" ${expressOk ? "" : "disabled"}>
          Darcy Express · ${expressMin}m · ${ADV_DARCY_EXPRESS} 🐟</button>
      </div>
      ${timeNote}`;
  }

  return `
    <div class="adv-card ${claimed ? "adv-dim" : ""}">
      <div class="adv-card-head"><b class="adv-name">${esc(npc.name)}</b>
        <span class="adv-note">expires in ${advCountdown(task.expiresAt)}</span></div>
      <div>Wants <b>${esc(advWantLabel(task.wants))}</b> <span class="adv-note">(storehouse: ${have})</span></div>
      <div class="adv-note">Pays ${task.tokens} 🐟${task.trinket ? ` and a ${esc(ADV_TRINKETS[task.trinket].label)}` : ""}.</div>
      ${whereabouts}
      ${dispatch}
    </div>`;
}
