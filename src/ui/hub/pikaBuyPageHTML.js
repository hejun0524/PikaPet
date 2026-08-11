// hub/pikaBuyPageHTML.js

import { t } from "../shared/i18n.js";
import { cityName } from "../shared/names.js";
import { state, tradeBuy } from "./state.js";
import { findTour, ticketOfferKey } from "../touring.js";
import { CITY_DISHES } from "../kitchen.js";
import { escText as esc } from "../panel.js";

/**
 * Pika's Buy tab: one card per ticket offer on sale (click to stage in the
 * trade basket), or a sold-out note.
 *
 * @returns {string} Page HTML for the grid.
 */
export function pikaBuyPageHTML() {
  // Fighter's Corner stock (books/potions) has its own tab.
  const sells = (state.pika.sells ?? []).filter((o) => o.kind !== "book" && o.kind !== "potion");
  if (!sells.length) {
    return `<div class="empty-note">${t("pika.buyEmpty")}</div>`;
  }
  const note = `<div class="ach-section caretaker-title">${t("pika.buyNote")}</div>`;
  return (
    note +
    sells
      .map((offer) => {
        const inCart = tradeBuy.has(offer.id);
        // Recipe scrolls sit beside the tickets (learned at checkout).
        const def =
          offer.kind === "recipe"
            ? {
                emoji: "📜",
                name: t("pika.recipeOffer", { dish: CITY_DISHES[offer.city] }),
                line: t("pika.recipeLine", { city: cityName(offer.city) }),
              }
            : findTour(ticketOfferKey(offer));
        const line = def.line ?? t("pika.oneOfAKind", { m: def.minutes });
        return `
      <div class="item ${inCart ? "in-cart" : ""}" data-trade-buy="${esc(offer.id)}">
        <span class="qty price">💰${offer.price}</span>
        <span class="icon">${def.emoji}</span>
        <span class="name">${esc(def.name)}</span>
        <span class="effects">${inCart ? t("pika.inBasket") : line}</span>
      </div>`;
      })
      .join("")
  );
}
