// hub/cartPageHTML.js — The shopping-cart basket page: reached from the
// topbar 🛒 button (see BASKET_VIEWS in hub/constants.js).

import { t } from "../shared/i18n.js";
import { itemName } from "../shared/names.js";
import { state, cart } from "./state.js";
import { findSellable } from "../items.js";
import { cartTotalPrice } from "./cartTotalPrice.js";

/**
 * Render the shopping-cart page: one row per staged item with a remove
 * button, then the total price and Clear / Checkout actions.
 *
 * @returns {string} Page HTML for the grid.
 */
export function cartPageHTML() {
  if (cart.size === 0) {
    return `<div class="basket-page"><div class="basket-list"><div class="cart-empty">${t("cart.empty")}</div></div></div>`;
  }
  const rows = [...cart]
    .map(([key, qty]) => {
      const entry = findSellable(key);
      return `
      <div class="cart-row">
        <span>${entry.emoji} ${itemName(entry)} × ${qty}</span>
        <span>💰${entry.price * qty}</span>
        <button class="cart-remove" data-remove="${key}">✕</button>
      </div>`;
    })
    .join("");
  const total = cartTotalPrice();
  const affordable = state.coins >= total;
  return `
    <div class="basket-page">
      <div class="basket-list">${rows}</div>
      <div class="cart-row cart-total"><span>${t("cart.total")}</span><span>💰${total}</span><span></span></div>
      <div class="cart-actions">
        <button id="cart-clear">${t("cart.clear")}</button>
        <button id="cart-checkout" ${affordable ? "" : "disabled"}>
          ${affordable ? t("cart.checkout") : t("cart.noCoins")}
        </button>
      </div>
    </div>`;
}
