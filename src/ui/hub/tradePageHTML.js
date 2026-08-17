// hub/tradePageHTML.js — The Pika trade basket page: reached from the
// topbar 🤝 button (see BASKET_VIEWS in hub/constants.js).

import { t } from "../shared/i18n.js";
import { state, tradeSell, tradeBuy, tradeIng } from "./state.js";
import { escText as esc } from "../panel.js";
import { SOUVENIR_SELL_PRICE, findTour, souvenirName, ticketOfferKey } from "../touring.js";
import { CITY_DISHES, findIngredient, ingredientName } from "../kitchen.js";
import { findBook, findPotion, bookName, potionName } from "../fightclub.js";

/**
 * Render the Pika trade page: staged souvenir sales, ticket buys, and
 * grocery buys with remove buttons, then the net coin change and Clear /
 * Trade actions.
 *
 * @returns {string} Page HTML for the grid.
 */
export function tradePageHTML() {
  if (tradeSell.size === 0 && tradeBuy.size === 0 && tradeIng.size === 0) {
    return `<div class="basket-page"><div class="basket-list"><div class="cart-empty">${t("trade.empty")}</div></div></div>`;
  }
  const sellRows = [...tradeSell]
    .map(
      (city) => `
      <div class="cart-row">
        <span>🎁 ${esc(souvenirName(city))}</span>
        <span class="trade-gain">+💰${SOUVENIR_SELL_PRICE}</span>
        <button class="cart-remove" data-trade-remove-sell="${esc(city)}">✕</button>
      </div>`
    )
    .join("");
  const buyRows = [...tradeBuy.values()]
    .map((offer) => {
      // Recipe scrolls and Fighter's Corner stock sit beside the tickets.
      const def =
        offer.kind === "recipe"
          ? { emoji: "📜", name: t("pika.recipeOffer", { dish: CITY_DISHES[offer.city] }) }
          : offer.kind === "book"
            ? { ...findBook(offer.item), name: bookName(findBook(offer.item)) }
            : offer.kind === "potion"
              ? { ...findPotion(offer.item), name: potionName(findPotion(offer.item)) }
              : findTour(ticketOfferKey(offer));
      const label =
        offer.kind === "flight" || offer.kind === "train"
          ? t("trade.ticket", { name: esc(def.name) })
          : esc(def.name);
      return `
      <div class="cart-row">
        <span>${def.emoji} ${label}</span>
        <span>−💰${offer.price}</span>
        <button class="cart-remove" data-trade-remove-buy="${esc(offer.id)}">✕</button>
      </div>`;
    })
    .join("");
  // Organic Market groceries staged in the same basket.
  const ingRows = [...tradeIng]
    .map(([key, qty]) => {
      const ing = findIngredient(key);
      return `
      <div class="cart-row">
        <span>${ing.emoji} ${esc(ingredientName(ing))} × ${qty}</span>
        <span>−💰${ing.price * qty}</span>
        <button class="cart-remove" data-trade-remove-ing="${key}">✕</button>
      </div>`;
    })
    .join("");
  const gain = tradeSell.size * SOUVENIR_SELL_PRICE;
  const cost =
    [...tradeBuy.values()].reduce((sum, o) => sum + o.price, 0) +
    [...tradeIng].reduce((sum, [key, qty]) => sum + findIngredient(key).price * qty, 0);
  const net = gain - cost;
  const payable = state.coins + net >= 0;
  return `
    <div class="basket-page">
      <div class="basket-list">${sellRows}${buyRows}${ingRows}</div>
      <div class="cart-row cart-total">
        <span>${t("trade.net")}</span>
        <span class="${net >= 0 ? "trade-gain" : ""}">${net >= 0 ? "+" : "−"}💰${Math.abs(net)}</span>
        <span></span>
      </div>
      <div class="cart-actions">
        <button id="trade-clear">${t("cart.clear")}</button>
        <button id="trade-checkout" ${payable ? "" : "disabled"}>
          ${payable ? t("trade.checkout") : t("cart.noCoins")}
        </button>
      </div>
    </div>`;
}
