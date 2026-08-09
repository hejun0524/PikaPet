// adventure/advCityDetailHTML.js

import { escText as esc } from "../panel.js";
import { ADV_DARCY_EXPRESS, ADV_NPCS } from "./adventureData.js";
import { adv, advUi } from "./state.js";
import { advEraOf } from "./advEraOf.js";
import { advLocated } from "./advLocated.js";
import { advNpcSpot } from "./advNpcSpot.js";
import { advRecordSighting } from "./advRecordSighting.js";
import { advTravelMinutes } from "./advTravelMinutes.js";

/**
 * Render the World tab's detail pane for a city in the selected era: travel
 * time and the familiar faces currently in town. As a side effect, browsing
 * records fresh sightings of acquaintances via advRecordSighting() (which
 * mutates `adv.located` and saves).
 *
 * @param {{key: string, label: string, travelExtra: number}} city - The
 *   city record to render.
 * @returns {string} HTML for the city detail pane.
 */
export function advCityDetailHTML(city) {
  const era = advEraOf(advUi.era);
  const minutes = advTravelMinutes(advUi.era, city.key);
  // Who is ACTUALLY here right now — visible only if they're an acquaintance
  // (≥1 notice answered: you'd recognize them on the street) or freshly
  // located by Darcy. Strangers stay hidden; Darcy just finds people faster
  // than walking every city of every era yourself.
  const here = [];
  for (const npc of ADV_NPCS) {
    const spot = advNpcSpot(npc);
    if (spot.era !== advUi.era || spot.city !== city.key) continue;
    const known = (adv.met[npc.key] ?? 0) > 0;
    if (!known && !advLocated(npc.key)) continue;
    if (known) advRecordSighting(npc.key, spot); // browsing updates the ledger
    here.push({ npc, known });
  }
  return `
    <div class="adv-detail-title">${esc(city.label)} — ${esc(era.label)} Era</div>
    <div class="adv-note">A delivery here takes about ${minutes}m; the Darcy Express halves that for ${ADV_DARCY_EXPRESS} 🐟.</div>

    <div class="adv-subhead">Familiar faces about town</div>
    ${
      here.length
        ? here
            .map(
              ({ npc, known }) => `<div class="adv-row"><b>${esc(npc.name)}</b>
      <span class="adv-note">${known ? `an old acquaintance — ${adv.met[npc.key]} notice${adv.met[npc.key] > 1 ? "s" : ""} answered` : "pointed out by Darcy"}</span></div>`
            )
            .join("")
        : `<div class="adv-note">Nobody you recognize. Answer someone's notice once and you'll spot them in the streets from then on — or ask Darcy (his ledger is on his own tab).</div>`
    }`;
}
