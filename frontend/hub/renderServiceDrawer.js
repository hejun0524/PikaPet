// hub/renderServiceDrawer.js

import { t } from "../shared/i18n.js";
import { caretakerName } from "../shared/names.js";
import { state, baskets } from "./state.js";
import { findCaretaker } from "../items.js";
import { hireLocked } from "./hireLocked.js";

/**
 * Render the caretaker-service drawer: one row per staged shift with a remove
 * button, the total price, and Clear / Hire actions. No-op while hidden.
 *
 * Side effects: rewrites #service-drawer.
 *
 * @returns {void}
 */
export function renderServiceDrawer() {
  const drawer = document.getElementById("service-drawer");
  if (drawer.hidden) return;
  if (!baskets.serviceCart.length) {
    drawer.innerHTML = `<div class="cart-empty">${t("service.empty")}</div>`;
    return;
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
  drawer.innerHTML = `
    ${rows}
    <div class="cart-row cart-total"><span>${t("cart.total")}</span><span>💰${total}</span><span></span></div>
    <div class="cart-actions">
      <button id="service-clear">${t("cart.clear")}</button>
      <button id="service-hire" ${affordable && !busy ? "" : "disabled"}>
        ${busy ? t("service.busy") : affordable ? t("service.hire") : t("cart.noCoins")}
      </button>
    </div>`;
}
