// hub/homeCardHTML.js — Cards.

import { state } from "./state.js";
import { isUsable } from "./isUsable.js";
import { effectsText } from "./effectsText.js";

/**
 * Card HTML for a bag item on the Home view (click to use).
 *
 * @param {Object} item - Item definition.
 * @param {boolean} [forceDisabled=false] - Disable regardless of usability
 *   (e.g. daily homework limit reached).
 * @returns {string} Card HTML with a data-use hook.
 */
export function homeCardHTML(item, forceDisabled = false) {
  return `
    <div class="item ${!forceDisabled && isUsable(item) ? "" : "disabled"}" data-use="${item.key}">
      <span class="qty">${state.bag[item.key]}</span>
      <span class="icon">${item.emoji}</span>
      <span class="name">${item.name}</span>
      <span class="effects">${effectsText(item)}</span>
    </div>`;
}
