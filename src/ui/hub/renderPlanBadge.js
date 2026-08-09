// hub/renderPlanBadge.js

import { baskets } from "./state.js";

/**
 * Update the career plan-book badge (number of staged entries).
 *
 * Side effects: rewrites #plan-count.
 *
 * @returns {void}
 */
export function renderPlanBadge() {
  const badge = document.getElementById("plan-count");
  badge.hidden = baskets.planBook.length === 0;
  badge.textContent = baskets.planBook.length;
}
