// adventure/advDarcyHTML.js

import { escText as esc } from "../panel.js";
import { ADV_DARCY_EXPRESS, ADV_DARCY_LOCATE, ADV_NPCS } from "./adventureData.js";
import { adv } from "./state.js";
import { advCityOf } from "./advCityOf.js";
import { advEraOf } from "./advEraOf.js";
import { advLocated } from "./advLocated.js";

/**
 * Render Darcy's tab: the tracking ledger and the Express pitch.
 * Acquaintances and anyone she has located get a row; fresh sightings age
 * into "last seen" when NPCs move on.
 *
 * @returns {string} HTML for the Darcy tab.
 */
export function advDarcyHTML() {
  const rows = ADV_NPCS.filter((n) => (adv.met[n.key] ?? 0) > 0 || adv.located[n.key]);
  return `
    <p class="adv-prose">Darcy knows where everyone is — for a price. Once you've answered
    someone's notice you'll spot them yourself when visiting their city; Darcy just saves
    you the walk. His Express also halves any delivery, for ${ADV_DARCY_EXPRESS} 🐟.</p>

    <div class="adv-section">Ledger of whereabouts</div>
    ${
      rows.length
        ? rows
            .map((npc) => {
              const met = adv.met[npc.key] ?? 0;
              const fresh = advLocated(npc.key);
              const stale = !fresh && adv.located[npc.key];
              let where;
              if (fresh)
                where = `<span class="adv-note">currently in ${esc(advCityOf(fresh.city).label)}, ${esc(advEraOf(fresh.era).label)} Era</span>`;
              else if (stale)
                where = `<span class="adv-note">last seen in ${esc(advCityOf(stale.city).label)}, ${esc(advEraOf(stale.era).label)} Era — moved on since</span>`;
              else where = `<span class="adv-note">whereabouts unknown</span>`;
              return `<div class="adv-row"><span><b>${esc(npc.name)}</b>${met ? ` <span class="adv-note">· ${met} notice${met > 1 ? "s" : ""} answered</span>` : ""}</span>
        <span class="adv-actions">${where}${
                fresh ? "" : `<button class="adv-btn" data-adv-locate="${npc.key}" ${adv.tokens >= ADV_DARCY_LOCATE ? "" : "disabled"}>Ask Darcy · ${ADV_DARCY_LOCATE} 🐟</button>`
              }</span></div>`;
            })
            .join("")
        : `<div class="adv-note">The ledger is empty. Answer a notice or pay Darcy to locate whoever posted one, and names will start filling this page.</div>`
    }`;
}
