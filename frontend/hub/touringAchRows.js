// hub/touringAchRows.js

import { state } from "./state.js";
import { achRowHTML } from "./achRowHTML.js";

/**
 * Achievement rows for a set of touring places (destinations or leagues),
 * each showing visited progress and the earned Explorer badge if any.
 *
 * @param {Object[]} places - Place definitions (key, emoji, label, cities).
 * @returns {string[]} One achievement-row HTML string per place.
 */
export function touringAchRows(places) {
  return places.map((place) => {
    const visited = (state.touring.visited[place.key] ?? []).length;
    const earned = state.achievements.find((a) => a.type === "touring" && a.place === place.key);
    return achRowHTML(
      place.emoji,
      `${place.label} Explorer — visit all ${place.cities.length} (${visited}/${place.cities.length})`,
      earned
    );
  });
}
