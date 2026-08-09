// hub/pikaBuyPageHTML.js

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
    return `<div class="empty-note">Sold out — new routes &amp; prices in a few hours!</div>`;
  }
  const note = `<div class="ach-section caretaker-title">🎫 Tickets on offer — routes and prices change every 3h. Click to add to the 🤝 trade basket.</div>`;
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
        <span class="effects">${inCart ? "🤝 In trade basket" : `⏱ ${def.minutes}m · one-of-a-kind`}</span>
      </div>`;
      })
      .join("")
  );
}
