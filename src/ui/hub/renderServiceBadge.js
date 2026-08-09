// hub/renderServiceBadge.js

import { baskets } from "./state.js";

/**
 * Update the caretaker-service basket badge (count of staged shifts).
 *
 * Side effects: rewrites #service-count.
 *
 * @returns {void}
 */
export function renderServiceBadge() {
  const badge = document.getElementById("service-count");
  badge.hidden = baskets.serviceCart.length === 0;
  badge.textContent = baskets.serviceCart.length;
}
