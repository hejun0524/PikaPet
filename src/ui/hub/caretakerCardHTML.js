// hub/caretakerCardHTML.js — Pet Center page (registry + caretaker services).
// The CARETAKERS catalog lives in items.js (shared with the stats window).

import { t } from "../shared/i18n.js";
import { caretakerName, caretakerDesc } from "../shared/names.js";
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
  const stagedLine = staged
    ? staged > 1
      ? t("caretaker.staged", { n: staged })
      : t("caretaker.stagedOne")
    : t("caretaker.stage");
  return `
    <div class="item ${staged ? "in-cart" : ""}${hireLocked() ? " disabled" : ""}" data-caretaker="${c.key}">
      <span class="qty price">💰${c.price}</span>
      <span class="icon">${c.emoji}</span>
      <span class="name">${caretakerName(c)}</span>
      <span class="effects">${caretakerDesc(c)}</span>
      <span class="effects">${stagedLine}</span>
    </div>`;
}
