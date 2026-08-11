// hub/pikaGymPageHTML.js — Pika's Fighter's Corner tab: Skill Books (a
// weighted-random selection per 3h store slot — better books are rarer) and
// the healing shelf. Cards stage into the 🤝 trade basket like tickets.

import { t } from "../shared/i18n.js";
import { findBook, findPotion, bookName, bookDesc, potionName, potionDesc } from "../fightclub.js";
import { state, tradeBuy } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * The Fighter's Corner tab: one card per book/potion offer on sale, or a
 * sold-out note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function pikaGymPageHTML() {
  const offers = (state.pika.sells ?? []).filter((o) => o.kind === "book" || o.kind === "potion");
  const note = `<div class="ach-section caretaker-title">${t("pika.gymNote")}</div>`;
  if (!offers.length) {
    return note + `<div class="empty-note">${t("pika.buyEmpty")}</div>`;
  }
  return (
    note +
    offers
      .map((offer) => {
        const def = offer.kind === "book" ? findBook(offer.item) : findPotion(offer.item);
        if (!def) return "";
        const name = offer.kind === "book" ? bookName(def) : potionName(def);
        const line = offer.kind === "book" ? bookDesc(def) : potionDesc(def);
        const inCart = tradeBuy.has(offer.id);
        return `
      <div class="item ${inCart ? "in-cart" : ""}" data-trade-buy="${esc(offer.id)}">
        <span class="qty price">💰${offer.price}</span>
        <span class="icon">${def.emoji}</span>
        <span class="name">${esc(name)}</span>
        <span class="effects">${inCart ? t("pika.inBasket") : line}</span>
      </div>`;
      })
      .join("")
  );
}
