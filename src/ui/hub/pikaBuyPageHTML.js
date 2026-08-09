// hub/pikaBuyPageHTML.js

import { t } from "../shared/i18n.js";
import { state, tradeBuy } from "./state.js";
import { findTour, ticketOfferKey } from "../touring.js";
import { escText as esc } from "../panel.js";

/**
 * Pika's Buy tab: one card per ticket offer on sale (click to stage in the
 * trade basket), or a sold-out note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function pikaBuyPageHTML() {
  const sells = state.pika.sells ?? [];
  if (!sells.length) {
    return `<div class="empty-note">${t("pika.buyEmpty")}</div>`;
  }
  const note = `<div class="ach-section caretaker-title">${t("pika.buyNote")}</div>`;
  return (
    note +
    sells
      .map((offer) => {
        const def = findTour(ticketOfferKey(offer));
        const inCart = tradeBuy.has(offer.id);
        return `
      <div class="item ${inCart ? "in-cart" : ""}" data-trade-buy="${esc(offer.id)}">
        <span class="qty price">💰${offer.price}</span>
        <span class="icon">${def.emoji}</span>
        <span class="name">${esc(def.name)}</span>
        <span class="effects">${inCart ? t("pika.inBasket") : t("pika.oneOfAKind", { m: def.minutes })}</span>
      </div>`;
      })
      .join("")
  );
}
