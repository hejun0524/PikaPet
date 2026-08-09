// hub/shopCardHTML.js

import { itemName } from "../shared/names.js";
import { effectsText } from "./effectsText.js";

/**
 * Card HTML for a sellable entry in the Life (shopping) view (click to add
 * to cart).
 *
 * @param {Object} entry - Sellable definition (price, emoji, name, effects).
 * @returns {string} Card HTML with a data-add hook.
 */
export function shopCardHTML(entry) {
  return `
    <div class="item" data-add="${entry.key}">
      <span class="qty price">💰${entry.price}</span>
      <span class="icon">${entry.emoji}</span>
      <span class="name">${itemName(entry)}</span>
      <span class="effects">${effectsText(entry)}</span>
    </div>`;
}
