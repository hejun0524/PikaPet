// hub/kitchenBotsHTML.js — Noonie's Kitchen, Paw-Bots tab: the ten bot
// slots (unlocked bots show what they're doing; the next slot shows its
// unlock price).

import { t } from "../shared/i18n.js";
import { MAX_BOTS, findRecipe, recipeName, nextBotPrice, botName } from "../kitchen.js";
import { state } from "./state.js";
import { escText as esc } from "../panel.js";

/**
 * The Paw-Bots tab: a note, one card per bot slot (idle / cooking /
 * delivering / next-to-unlock / locked).
 *
 * @returns {string} Page HTML for the grid.
 */
export function kitchenBotsHTML() {
  const note = `<div class="ach-section caretaker-title">${t("kitchen.botsNote")}</div>`;
  const price = nextBotPrice(state.kitchen.bots);
  const cards = Array.from({ length: MAX_BOTS }, (_, i) => {
    if (i < state.kitchen.bots) {
      const job = state.kitchen.orders.find((o) => o.bot === i);
      const dish = job ? esc(recipeName(findRecipe(job.recipe))) : "";
      const line = !job
        ? t("kitchen.botIdle")
        : job.status === "cooking"
          ? t("kitchen.botCooking", { dish })
          : t("kitchen.botDelivering", { dish });
      return `
      <div class="item">
        <span class="icon">🤖</span>
        <span class="name">${botName(i)}</span>
        <span class="effects">${line}</span>
      </div>`;
    }
    if (i === state.kitchen.bots) {
      const affordable = state.coins >= price;
      return `
      <div class="item">
        <span class="qty price">💰${price}</span>
        <span class="icon">🤖</span>
        <span class="name">${botName(i)}</span>
        <span class="effects"><button id="unlock-bot" ${affordable ? "" : "disabled"}>${
          affordable ? t("kitchen.unlockBot", { name: botName(i) }) : t("cart.noCoins")
        }</button></span>
      </div>`;
    }
    return `
      <div class="item locked">
        <span class="qty lock">🔒</span>
        <span class="icon">🤖</span>
        <span class="name">${botName(i)}</span>
        <span class="effects">${t("kitchen.botLocked")}</span>
      </div>`;
  }).join("");
  return note + cards;
}
