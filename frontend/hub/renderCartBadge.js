// hub/renderCartBadge.js

import { cart } from "./state.js";

/**
 * Update the shopping-cart badge (total item quantity).
 *
 * Side effects: rewrites #cart-count.
 *
 * @returns {void}
 */
export function renderCartBadge() {
  let count = 0;
  for (const qty of cart.values()) count += qty;
  const badge = document.getElementById("cart-count");
  badge.hidden = count === 0;
  badge.textContent = count;
}
