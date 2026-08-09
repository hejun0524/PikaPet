// hub/pikaSellPageHTML.js — Pika's trading post (Sell / Buy tabs, shop-style
// cards).

import { state, tradeSell } from "./state.js";
import { SOUVENIR_SELL_PRICE, souvenirName } from "../touring.js";
import { escText as esc } from "../panel.js";

/**
 * Pika's Sell tab: one card per souvenir Pika currently wants (click to stage
 * in the trade basket), or an empty-state note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function pikaSellPageHTML() {
  const wants = state.pika.wants ?? [];
  if (!wants.length) {
    return `<div class="empty-note">Pika isn't collecting anything right now — check back soon!</div>`;
  }
  const note = `<div class="ach-section caretaker-title">🐱 Pika is collecting these — she pays +💰${SOUVENIR_SELL_PRICE} each (store refreshes every 3h). Click to add to the 🤝 trade basket.</div>`;
  return (
    note +
    wants
      .map((city) => {
        const owned = state.souvenirs[city] ?? 0;
        const inCart = tradeSell.has(city);
        return `
      <div class="item ${owned > 0 ? "" : "disabled"} ${inCart ? "in-cart" : ""}" data-trade-sell="${esc(city)}">
        <span class="qty pay">+💰${SOUVENIR_SELL_PRICE}</span>
        <span class="icon">🎁</span>
        <span class="name">${esc(souvenirName(city))}</span>
        <span class="effects">${inCart ? "🤝 In trade basket" : owned > 0 ? `You have ${owned}` : "You don't have this yet"}</span>
      </div>`;
      })
      .join("")
  );
}
