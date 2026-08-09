// hub/ticketsPageHTML.js

import { t } from "../shared/i18n.js";
import { state } from "./state.js";
import { findTour } from "../touring.js";
import { escText as esc } from "../panel.js";
import { activityLocked } from "./activityLocked.js";

/**
 * The Tickets tab of the Home view: one card per owned ticket type (click to
 * travel), or an empty-state note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function ticketsPageHTML() {
  const owned = Object.entries(state.tickets).filter(([, count]) => count > 0);
  if (!owned.length) {
    return `<div class="empty-note">${t("home.ticketsEmpty")}</div>`;
  }
  return owned
    .map(([key, count]) => {
      const def = findTour(key);
      return `
      <div class="item ${activityLocked()}" data-ticket="${esc(key)}">
        <span class="qty">${count}</span>
        <span class="icon">${def.emoji}</span>
        <span class="name">${esc(def.name)}</span>
        <span class="effects">${t("home.ticketUse", { m: def.minutes })}</span>
      </div>`;
    })
    .join("");
}
