// hub/touringAchRows.js

import { t } from "../shared/i18n.js";
import { placeLabel } from "../shared/names.js";
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
      t("ach.explorer", { place: placeLabel(place), total: place.cities.length, v: visited }),
      earned
    );
  });
}
