// hub/kitchenOrdersHTML.js — Noonie's Kitchen, Orders tab: the 3h order
// board (card per order with its cook/deliver action) plus the delivery log.

import { t } from "../shared/i18n.js";
import { findIngredient, findRecipe, ingredientName, recipeName, botName } from "../kitchen.js";
import { formatRemaining } from "../school.js";
import { state } from "./state.js";
import { escText as esc } from "../panel.js";
import { kitchenFreeBots } from "./kitchenFreeBots.js";
import { pantryHas } from "./pantryHas.js";

/**
 * The Orders tab: intro note, one card per order, and the recent-deliveries
 * log. Cards show 🍳 Cook (open), a countdown (cooking/delivering), or 🚚
 * Deliver (ready); buttons grey out without a free bot / the ingredients.
 *
 * @returns {string} Page HTML for the grid.
 */
export function kitchenOrdersHTML() {
  const note = `<div class="ach-section caretaker-title">${t("kitchen.ordersNote")}</div>`;
  const free = kitchenFreeBots();
  const cards = state.kitchen.orders.length
    ? state.kitchen.orders.map((order) => orderCardHTML(order, free)).join("")
    : `<div class="empty-note">${t("kitchen.ordersEmpty")}</div>`;
  return note + cards + logHTML();
}

/** One order card. */
function orderCardHTML(order, free) {
  const recipe = findRecipe(order.recipe);
  const shoppingList = Object.entries(recipe.ingredients)
    .map(([key, qty]) => {
      const ing = findIngredient(key);
      return `${qty}×${ing.emoji}${esc(ingredientName(ing))}`;
    })
    .join(" · ");
  let line = "";
  let action = "";
  if (order.status === "open") {
    const stocked = pantryHas(recipe);
    if (free < 1) line = `<span class="effects">${t("kitchen.needBot")}</span>`;
    else if (!stocked) line = `<span class="effects">${t("kitchen.needIngredients")}</span>`;
    action = `<span class="effects"><button data-cook="${order.id}" ${free > 0 && stocked ? "" : "disabled"}>${t("kitchen.cook")}</button></span>`;
  } else if (order.status === "ready") {
    line = `<span class="effects">${t("kitchen.ready")}</span>`;
    action = `<span class="effects"><button data-deliver="${order.id}" ${free > 0 ? "" : "disabled"}>${t("kitchen.deliver")}</button></span>`;
  } else {
    const key = order.status === "cooking" ? "kitchen.cooking" : "kitchen.delivering";
    line = `<span class="effects">${t(key, {
      bot: botName(order.bot),
      time: formatRemaining(order.endsAt - Date.now()),
    })}</span>`;
  }
  return `
      <div class="item">
        <span class="qty pay">+💰${order.reward}</span>
        <span class="icon">${order.customer.emoji}</span>
        <span class="name">${esc(recipeName(recipe))}</span>
        <span class="effects">${t("kitchen.orderBy", { name: esc(order.customer.name) })}</span>
        <span class="effects">${shoppingList}</span>
        ${line}
        ${action}
      </div>`;
}

/** The recent-deliveries log (delivered orders + found books). */
function logHTML() {
  if (!state.kitchen.log.length) return "";
  const rows = state.kitchen.log
    .map((entry) => {
      const text =
        entry.k === "book"
          ? t("klog.book")
          : t("klog.delivered", {
              customer: `${entry.e} ${esc(entry.c)}`,
              dish: esc(recipeName(findRecipe(entry.r))),
              reward: entry.w,
            });
      return `<div class="ach earned journal"><span class="ach-emoji">${entry.k === "book" ? "📖" : "✅"}</span><span class="ach-label">${text}</span></div>`;
    })
    .join("");
  return `<div class="ach-section caretaker-title">${t("kitchen.logTitle")}</div><div class="ach-list">${rows}</div>`;
}
