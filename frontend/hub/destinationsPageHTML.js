// hub/destinationsPageHTML.js

import { state, ui } from "./state.js";
import { DESTINATIONS, TOUR_MAX_CITIES, findDestination } from "../touring.js";
import { escText as esc } from "../panel.js";
import { activityStatusRowHTML } from "./activityStatusRowHTML.js";
import { tourPackageCardHTML } from "./tourPackageCardHTML.js";

/**
 * The Destinations page: destination chips, the selected destination's
 * visited-cities progress and city grid, plus the mystery tour packages.
 *
 * @returns {string} Page HTML for the grid.
 */
export function destinationsPageHTML() {
  const chips = DESTINATIONS.map(
    (d) => `
    <button class="career-chip ${d.key === ui.tourDest ? "active" : ""}" data-dest="${d.key}">
      ${d.emoji} ${d.label}
    </button>`
  ).join("");
  const dest = findDestination(ui.tourDest);
  const visited = state.touring.visited[ui.tourDest] ?? [];
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      <div class="xp-line">${dest.emoji} ${dest.label} · ${visited.length}/${dest.cities.length} cities visited</div>
      <div class="credit-bar">
        <div class="track"><div class="fill" style="width:${(visited.length / dest.cities.length) * 100}%"></div></div>
        <span>${visited.length}/${dest.cities.length}</span>
      </div>
      <div class="city-grid">
        ${dest.cities
          .map((c) => `<span class="city ${visited.includes(c) ? "visited" : ""}">${esc(c)}</span>`)
          .join("")}
      </div>
    </div>`;
  const packages = Array.from({ length: TOUR_MAX_CITIES }, (_, i) =>
    tourPackageCardHTML(i + 1)
  ).join("");
  return head + packages;
}
