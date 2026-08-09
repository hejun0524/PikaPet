// hub/journalsPageHTML.js

import { state } from "./state.js";
import { isLeagueKey, cityDestination } from "../touring.js";
import { escText as esc } from "../panel.js";

/**
 * The travel Journals page: one row per completed trip, with its stops and
 * date, or an empty-state note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function journalsPageHTML() {
  if (!state.touring.journals.length) {
    return `<div class="empty-note">No trips yet — pick a package under 🏝️ Destinations!</div>`;
  }
  const rows = state.touring.journals
    .map((j) => {
      // Just two emojis: 🏟️ for sports trips, 🌍 for everything else.
      const sporty = j.destination === "sports" || isLeagueKey(j.destination);
      const dest = { emoji: sporty ? "🏟️" : "🌍" };
      // Every stop reads "Country - City" (or "League - Team").
      const stops = j.cities
        .map((city) => `${esc(cityDestination(city)?.label ?? "?")} - ${esc(city)}`)
        .join(", ");
      return `
      <div class="ach earned journal">
        <span class="ach-emoji">${dest.emoji}</span>
        <span class="ach-label">${stops}</span>
        <span class="ach-date">${esc(j.date)}</span>
      </div>`;
    })
    .join("");
  return `<div class="ach-list">${rows}</div>`;
}
