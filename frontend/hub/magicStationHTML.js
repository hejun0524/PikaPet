// hub/magicStationHTML.js

import { state, ui } from "./state.js";
import { SPECIES, findSpecies } from "../items.js";
import { escText as esc } from "../panel.js";

/**
 * The Magic Station page: either the purchase-confirmation card for
 * `ui.pendingMagic`, or one card per species (current / owned / purchasable).
 *
 * @returns {string} Page HTML for the grid.
 */
export function magicStationHTML() {
  if (ui.pendingMagic) {
    const target = findSpecies(ui.pendingMagic);
    const fee = target.price;
    return `
      <div class="settings-card">
        <div class="gov-note">🔮 Confirm purchase</div>
        <div class="magic-confirm-row">
          <span class="species-thumb" style="background-image:url('${target.sheet}')"></span>
          <div>
            <b>Purchase the ${esc(target.breed)} form for ${esc(state.name)}?</b><br/>
            <span class="gov-note">One-time price: 💰${fee} — ${esc(state.name)} becomes a ${esc(target.breed)} right away, and owned forms switch freely afterwards.</span>
          </div>
        </div>
        <div class="settings-actions">
          <button id="magic-cancel">Cancel</button>
          <button id="magic-confirm" ${state.coins >= fee ? "" : "disabled"}>
            ${state.coins >= fee ? `Pay 💰${fee} &amp; purchase` : "Not enough coins"}
          </button>
        </div>
      </div>`;
  }
  const cards = SPECIES.map((s) => {
    const current = s.key === state.species;
    const owned = state.forms.includes(s.key);
    const badge = current
      ? `<span class="qty">now</span>`
      : owned
        ? `<span class="qty">owned</span>`
        : `<span class="qty price">💰${s.price}</span>`;
    const line = current
      ? "Your current form"
      : owned
        ? "Owned · click to switch"
        : "Click to purchase this form";
    return `
      <div class="item ${current ? "disabled" : ""}" ${current ? "" : `data-magic="${s.key}"`}>
        ${badge}
        <span class="species-thumb" style="background-image:url('${s.sheet}')"></span>
        <span class="name">${esc(s.breed)}</span>
        <span class="effects">${line}</span>
      </div>`;
  }).join("");
  return (
    `<div class="ach-section caretaker-title">🔮 Magic Station — buy new forms once, then switch between owned forms anytime. Name, stats, and memories always stay.</div>` +
    cards
  );
}
