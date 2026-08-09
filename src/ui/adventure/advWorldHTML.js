// adventure/advWorldHTML.js

import { ADV_CITIES, ADV_ERAS, ADV_WILDS } from "./adventureData.js";
import { advUi } from "./state.js";
import { advCityDetailHTML } from "./advCityDetailHTML.js";
import { advCityOf } from "./advCityOf.js";
import { advWildDetailHTML } from "./advWildDetailHTML.js";

/**
 * Render the World tab: the three-column finder — eras, then the cities and
 * wilderness sites of the selected era, then the detail pane for whatever
 * `advUi.place` selects (city, wild, or a hint when nothing is picked).
 *
 * @returns {string} HTML for the World tab.
 */
export function advWorldHTML() {
  const wilds = ADV_WILDS.filter((w) => !w.eras || w.eras.includes(advUi.era));
  const [kind, key] = (advUi.place ?? "").split(":");
  const selectedWild = kind === "wild" ? wilds.find((w) => w.key === key) : null;
  const selectedCity = kind === "city" ? advCityOf(key) : null;

  let detail = `<div class="adv-note">Pick a city or wilderness to see who's there and what it offers.</div>`;
  if (selectedWild) detail = advWildDetailHTML(selectedWild);
  else if (selectedCity) detail = advCityDetailHTML(selectedCity);

  return `
    <div class="adv-finder">
      <div class="adv-col adv-col-eras">
        ${ADV_ERAS.map(
          (e) => `<button class="adv-item ${e.key === advUi.era ? "sel" : ""}" data-adv-era="${e.key}">${e.label}</button>`
        ).join("")}
      </div>
      <div class="adv-col adv-col-places">
        <div class="adv-col-head">Cities</div>
        ${ADV_CITIES.map(
          (c) => `<button class="adv-item ${advUi.place === `city:${c.key}` ? "sel" : ""}" data-adv-place="city:${c.key}">${c.label}</button>`
        ).join("")}
        <div class="adv-col-head">Wilderness</div>
        ${wilds
          .map(
            (w) => `<button class="adv-item ${advUi.place === `wild:${w.key}` ? "sel" : ""}" data-adv-place="wild:${w.key}">${w.label}</button>`
          )
          .join("")}
      </div>
      <div class="adv-col adv-detail">${detail}</div>
    </div>`;
}
