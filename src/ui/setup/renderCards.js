// setup/renderCards.js

import { t } from "../shared/i18n.js";
import { speciesBreed } from "../shared/names.js";
import { SPECIES } from "../items.js";
import { setupUi } from "./state.js";

/**
 * Render the species picker cards into `#species-cards`, marking the
 * currently chosen species as selected.
 *
 * @returns {void} Writes the cards' HTML into the DOM.
 */
export function renderCards() {
  document.getElementById("species-cards").innerHTML = SPECIES.map(
    (s) => `
    <div class="species-card ${s.key === setupUi.chosen ? "selected" : ""}" data-species="${s.key}">
      <span class="thumb" style="background-image:url('${s.sheet}')"></span>
      <span class="breed">${speciesBreed(s)}</span>
      <span class="free">${t("setup.free")}</span>
    </div>`
  ).join("");
}
