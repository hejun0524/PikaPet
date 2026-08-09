// hub/sportsPageHTML.js

import { t } from "../shared/i18n.js";
import { cityName } from "../shared/names.js";
import { state, ui } from "./state.js";
import { SPORT_LEAGUES, TOUR_MAX_CITIES, findPlace } from "../touring.js";
import { escText as esc } from "../panel.js";
import { activityStatusRowHTML } from "./activityStatusRowHTML.js";
import { sportPackageCardHTML } from "./sportPackageCardHTML.js";

/**
 * The Sports touring page: league chips, the selected league's visited-teams
 * progress and team grid, plus the mystery sports tour packages.
 *
 * @returns {string} Page HTML for the grid.
 */
export function sportsPageHTML() {
  const chips = SPORT_LEAGUES.map(
    (l) => `
    <button class="career-chip ${l.key === ui.sportLeague ? "active" : ""}" data-league="${l.key}">
      ${l.emoji} ${l.label}
    </button>`
  ).join("");
  const league = findPlace(ui.sportLeague);
  const visited = state.touring.visited[ui.sportLeague] ?? [];
  const head = `
    <div class="school-head">
      ${activityStatusRowHTML()}
      <div class="career-chips">${chips}</div>
      <div class="xp-line">${t("tour.teamsVisited", {
        emoji: league.emoji,
        label: league.label,
        v: visited.length,
        total: league.cities.length,
      })}</div>
      <div class="credit-bar">
        <div class="track"><div class="fill" style="width:${(visited.length / league.cities.length) * 100}%"></div></div>
        <span>${visited.length}/${league.cities.length}</span>
      </div>
      <div class="city-grid">
        ${league.cities
          .map((c) => `<span class="city ${visited.includes(c) ? "visited" : ""}">${esc(cityName(c))}</span>`)
          .join("")}
      </div>
    </div>`;
  const packages = Array.from({ length: TOUR_MAX_CITIES }, (_, i) =>
    sportPackageCardHTML(i + 1)
  ).join("");
  return head + packages;
}
