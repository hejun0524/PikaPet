// hub/magicStationHTML.js

import { t } from "../shared/i18n.js";
import { speciesBreed } from "../shared/names.js";
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
        <div class="gov-note">${t("magic.confirm")}</div>
        <div class="magic-confirm-row">
          <span class="species-thumb" style="background-image:url('${target.sheet}')"></span>
          <div>
            <b>${t("magic.confirmQ", { breed: esc(speciesBreed(target)), name: esc(state.name) })}</b><br/>
            <span class="gov-note">${t("magic.confirmLine", {
              fee,
              name: esc(state.name),
              breed: esc(speciesBreed(target)),
            })}</span>
          </div>
        </div>
        <div class="settings-actions">
          <button id="magic-cancel">${t("magic.cancel")}</button>
          <button id="magic-confirm" ${state.coins >= fee ? "" : "disabled"}>
            ${state.coins >= fee ? t("magic.pay", { fee }) : t("magic.noCoins")}
          </button>
        </div>
      </div>`;
  }
  const cards = SPECIES.map((s) => {
    const current = s.key === state.species;
    const owned = state.forms.includes(s.key);
    const badge = current
      ? `<span class="qty">${t("magic.now")}</span>`
      : owned
        ? `<span class="qty">${t("magic.owned")}</span>`
        : `<span class="qty price">💰${s.price}</span>`;
    const line = current
      ? t("magic.current")
      : owned
        ? t("magic.switch")
        : t("magic.purchase");
    return `
      <div class="item ${current ? "disabled" : ""}" ${current ? "" : `data-magic="${s.key}"`}>
        ${badge}
        <span class="species-thumb" style="background-image:url('${s.sheet}')"></span>
        <span class="name">${esc(speciesBreed(s))}</span>
        <span class="effects">${line}</span>
      </div>`;
  }).join("");
  return `<div class="ach-section caretaker-title">${t("magic.note")}</div>` + cards;
}
