// hub/renderTradeDrawer.js

import { t } from "../shared/i18n.js";
import { state, tradeSell, tradeBuy, tradeIng } from "./state.js";
import { escText as esc } from "../panel.js";
import { SOUVENIR_SELL_PRICE, findTour, souvenirName, ticketOfferKey } from "../touring.js";
import { CITY_DISHES, findIngredient, ingredientName } from "../kitchen.js";

/**
 * Render the Pika trade drawer: staged souvenir sales and ticket buys with
 * remove buttons, the net coin change, and Clear / Trade actions. No-op while
 * hidden.
 *
 * Side effects: rewrites #trade-drawer.
 *
 * @returns {void}
 */
export function renderTradeDrawer() {
  const drawer = document.getElementById("trade-drawer");
  if (drawer.hidden) return;
  if (tradeSell.size === 0 && tradeBuy.size === 0 && tradeIng.size === 0) {
    drawer.innerHTML = `<div class="cart-empty">${t("trade.empty")}</div>`;
    return;
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
      const def =
        offer.kind === "recipe"
          ? { emoji: "📜", name: t("pika.recipeOffer", { dish: CITY_DISHES[offer.city] }) }
          : findTour(ticketOfferKey(offer));
      const label =
        offer.kind === "recipe" ? esc(def.name) : t("trade.ticket", { name: esc(def.name) });
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
  drawer.innerHTML = `
    ${sellRows}${buyRows}${ingRows}
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
    </div>`;
}
