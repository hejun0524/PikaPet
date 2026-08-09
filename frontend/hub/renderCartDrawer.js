// hub/renderCartDrawer.js

import { state, cart } from "./state.js";
import { findSellable } from "../items.js";
import { cartTotalPrice } from "./cartTotalPrice.js";

/**
 * Render the shopping-cart drawer: one row per staged item with a remove
 * button, the total price, and Clear / Checkout actions. No-op while hidden.
 *
 * Side effects: rewrites #cart-drawer.
 *
 * @returns {void}
 */
export function renderCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer.hidden) return;
  if (cart.size === 0) {
    drawer.innerHTML = `<div class="cart-empty">Cart is empty</div>`;
    return;
  }
  const rows = [...cart]
    .map(([key, qty]) => {
      const entry = findSellable(key);
      return `
      <div class="cart-row">
        <span>${entry.emoji} ${entry.name} × ${qty}</span>
        <span>💰${entry.price * qty}</span>
        <button class="cart-remove" data-remove="${key}">✕</button>
      </div>`;
    })
    .join("");
  const total = cartTotalPrice();
  const affordable = state.coins >= total;
  drawer.innerHTML = `
    ${rows}
    <div class="cart-row cart-total"><span>Total</span><span>💰${total}</span><span></span></div>
    <div class="cart-actions">
      <button id="cart-clear">Clear</button>
      <button id="cart-checkout" ${affordable ? "" : "disabled"}>
        ${affordable ? "Checkout" : "Not enough coins"}
      </button>
    </div>`;
}
