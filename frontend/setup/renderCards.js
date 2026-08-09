// setup/renderCards.js

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
      <span class="breed">${s.breed}</span>
      <span class="free">Free for your first friend!</span>
    </div>`
  ).join("");
}
