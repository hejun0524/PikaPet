// hub/renderTradeDrawer.js

import { t } from "../shared/i18n.js";
import { state, tradeSell, tradeBuy } from "./state.js";
import { escText as esc } from "../panel.js";
import { SOUVENIR_SELL_PRICE, findTour, souvenirName, ticketOfferKey } from "../touring.js";

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
  if (tradeSell.size === 0 && tradeBuy.size === 0) {
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
      const def = findTour(ticketOfferKey(offer));
      return `
      <div class="cart-row">
        <span>${def.emoji} ${t("trade.ticket", { name: esc(def.name) })}</span>
        <span>−💰${offer.price}</span>
        <button class="cart-remove" data-trade-remove-buy="${esc(offer.id)}">✕</button>
      </div>`;
    })
    .join("");
  const gain = tradeSell.size * SOUVENIR_SELL_PRICE;
  const cost = [...tradeBuy.values()].reduce((sum, o) => sum + o.price, 0);
  const net = gain - cost;
  const payable = state.coins + net >= 0;
  drawer.innerHTML = `
    ${sellRows}${buyRows}
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
