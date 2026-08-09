// hub/caretakerCardHTML.js — Pet Center page (registry + caretaker services).
// The CARETAKERS catalog lives in items.js (shared with the stats window).

import { baskets } from "./state.js";
import { hireLocked } from "./hireLocked.js";

/**
 * Card HTML for a caretaker service (click to stage a 4h shift).
 *
 * @param {Object} c - Caretaker definition (key, emoji, name, desc, price).
 * @returns {string} Card HTML with a data-caretaker hook.
 */
export function caretakerCardHTML(c) {
  const staged = baskets.serviceCart.filter((k) => k === c.key).length;
  return `
    <div class="item ${staged ? "in-cart" : ""}${hireLocked() ? " disabled" : ""}" data-caretaker="${c.key}">
      <span class="qty price">💰${c.price}</span>
      <span class="icon">${c.emoji}</span>
      <span class="name">${c.name}</span>
      <span class="effects">${c.desc}</span>
      <span class="effects">${staged ? `🛎️ ${staged} shift${staged > 1 ? "s" : ""} staged` : "4h shift · click to stage"}</span>
    </div>`;
}
