// hub/renderTradeBadge.js

import { tradeSell, tradeBuy } from "./state.js";

/**
 * Update the Pika trade-basket badge (sell + buy staged counts combined).
 *
 * Side effects: rewrites #trade-count.
 *
 * @returns {void}
 */
export function renderTradeBadge() {
  const count = tradeSell.size + tradeBuy.size;
  const badge = document.getElementById("trade-count");
  badge.hidden = count === 0;
  badge.textContent = count;
}
