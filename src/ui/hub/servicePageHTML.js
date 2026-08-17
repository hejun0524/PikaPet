// hub/servicePageHTML.js — The caretaker-service basket page: reached from
// the topbar 🛎️ button (see BASKET_VIEWS in hub/constants.js).

import { t } from "../shared/i18n.js";
import { caretakerName } from "../shared/names.js";
import { state, baskets } from "./state.js";
import { findCaretaker } from "../items.js";
import { hireLocked } from "./hireLocked.js";

/**
 * Render the caretaker-service page: one row per staged shift with a remove
 * button, then the total price and Clear / Hire actions.
 *
 * @returns {string} Page HTML for the grid.
 */
export function servicePageHTML() {
  if (!baskets.serviceCart.length) {
    return `<div class="basket-page"><div class="basket-list"><div class="cart-empty">${t("service.empty")}</div></div></div>`;
  }
  const rows = baskets.serviceCart
    .map((key, i) => {
      const def = findCaretaker(key);
      return `
      <div class="cart-row">
        <span>${t("service.shiftRow", { emoji: def.emoji, name: caretakerName(def) })}</span>
        <span>💰${def.price}</span>
        <button class="cart-remove" data-service-remove="${i}">✕</button>
      </div>`;
    })
    .join("");
  const total = baskets.serviceCart.reduce((sum, key) => sum + findCaretaker(key).price, 0);
  const affordable = state.coins >= total;
  const busy = hireLocked();
  return `
    <div class="basket-page">
      <div class="basket-list">${rows}</div>
      <div class="cart-row cart-total"><span>${t("cart.total")}</span><span>💰${total}</span><span></span></div>
      <div class="cart-actions">
        <button id="service-clear">${t("cart.clear")}</button>
        <button id="service-hire" ${affordable && !busy ? "" : "disabled"}>
          ${busy ? t("service.busy") : affordable ? t("service.hire") : t("cart.noCoins")}
        </button>
      </div>
    </div>`;
}
