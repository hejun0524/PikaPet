// hub/pikaMarketPageHTML.js — Pika's Organic Market tab: every ingredient,
// grouped by category with a full-row section title; a click stages one
// unit in the 🤝 trade basket (checkout applies it to Noonie's pantry).

import { t, tOr } from "../shared/i18n.js";
import { INGREDIENT_CATS, INGREDIENTS, ingredientName } from "../kitchen.js";
import { state, tradeIng } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * The Organic Market page: intro note, then one full-row category title per
 * section with its ingredient cards. Clicking a card adds 1 to the trade
 * basket; cards show pantry stock and the staged basket amount.
 *
 * @returns {string} Page HTML for the grid.
 */
export function pikaMarketPageHTML() {
  const note = `<div class="ach-section caretaker-title">${t("market.note")}</div>`;
  const sections = INGREDIENT_CATS.map((cat) => {
    const header = `<div class="ach-section">${cat.emoji} ${tOr(`ingcat.${cat.key}`, cat.label)}</div>`;
    const cards = INGREDIENTS.filter((ing) => ing.cat === cat.key)
      .map((ing) => {
        const owned = state.kitchen.pantry[ing.key] ?? 0;
        const staged = tradeIng.get(ing.key) ?? 0;
        return `
      <div class="item ${staged ? "in-cart" : ""}" data-trade-ing="${ing.key}">
        <span class="qty price">💰${ing.price}</span>
        <span class="icon">${ing.emoji}</span>
        <span class="name">${esc(ingredientName(ing))}</span>
        <span class="effects">${owned > 0 ? t("market.owned", { n: owned }) : t("market.buyOne")}</span>
        ${staged ? `<span class="effects">${t("market.inBasket", { n: staged })}</span>` : ""}
      </div>`;
      })
      .join("");
    return header + cards;
  }).join("");
  return note + sections;
}
