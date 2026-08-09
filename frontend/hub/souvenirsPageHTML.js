// hub/souvenirsPageHTML.js

import { t } from "../shared/i18n.js";
import { state } from "./state.js";
import { souvenirName } from "../touring.js";
import { escText as esc } from "../panel.js";

/**
 * The Souvenirs tab of the Home view: one card per owned souvenir city, or an
 * empty-state note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function souvenirsPageHTML() {
  const owned = Object.entries(state.souvenirs).filter(([, count]) => count > 0);
  if (!owned.length) {
    return `<div class="empty-note">${t("home.souvenirsEmpty")}</div>`;
  }
  return owned
    .map(
      ([city, count]) => `
      <div class="item">
        <span class="qty">${count}</span>
        <span class="icon">🎁</span>
        <span class="name">${esc(souvenirName(city))}</span>
        <span class="effects">${t("home.souvenirHint")}</span>
      </div>`
    )
    .join("");
}
