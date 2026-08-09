// adventure/advWildDetailHTML.js

import { escText as esc } from "../panel.js";
import { ADV_MATERIALS } from "./adventureData.js";
import { advGatherChance } from "./advGatherChance.js";
import { advIdleRecruits } from "./advIdleRecruits.js";
import { advRecruitSelectHTML } from "./advRecruitSelectHTML.js";

/**
 * Render the World tab's detail pane for a wilderness site: blurb, terrain
 * difficulty, round-trip time, yields, level-1 safety odds, and the "send to
 * gather" controls.
 *
 * @param {object} site - The wilderness site record to render.
 * @returns {string} HTML for the site detail pane.
 */
export function advWildDetailHTML(site) {
  const yields = site.yields
    .map((y) => `${ADV_MATERIALS[y.key].label} (${y.min}–${y.max})`)
    .join(", ");
  const pct = Math.round(advGatherChance(1, site.difficulty) * 100);
  return `
    <div class="adv-detail-title">${esc(site.label)}</div>
    <p class="adv-prose">${esc(site.blurb)}</p>
    <div class="adv-note">Terrain: ${"●".repeat(site.difficulty)}${"○".repeat(3 - site.difficulty)} · about ${site.minutes}m out and back</div>
    <div class="adv-note">Yields: ${esc(yields)}</div>
    <div class="adv-note">A level-1 recruit comes home safe about ${pct}% of the time; seasoned recruits fare better. A failed trip means an injury and bed rest — or a visit from Noonie.</div>
    <div class="adv-actions">
      ${advRecruitSelectHTML("adv-gsel")}
      <button class="adv-btn" data-adv-gather="${site.key}" ${advIdleRecruits().length ? "" : "disabled"}>Send to gather</button>
    </div>`;
}
