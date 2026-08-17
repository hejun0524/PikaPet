// hub/planPageHTML.js — The career plan-book basket page: reached from the
// topbar 📔 button (see BASKET_VIEWS in hub/constants.js).

import { t } from "../shared/i18n.js";
import { activityName } from "../shared/names.js";
import { state, baskets } from "./state.js";
import { planEntryDef } from "./planEntryDef.js";
import { caretakingBusy } from "./caretakingBusy.js";

/**
 * Render the plan-book page: one row per staged class/job with a remove
 * button, then the up-front cost and Clear / Start actions.
 *
 * @returns {string} Page HTML for the grid.
 */
export function planPageHTML() {
  if (baskets.planBook.length === 0) {
    return `<div class="basket-page"><div class="basket-list"><div class="cart-empty">${t("plan.empty")}</div></div></div>`;
  }
  const rows = baskets.planBook
    .map((entry, i) => {
      const def = planEntryDef(entry);
      const money = entry.type === "job" ? `+💰${def.pay}` : `−💰${def.cost}`;
      return `
      <div class="cart-row">
        <span>${def.emoji} ${activityName({ ...entry, name: def.name })} · ⏱ ${def.minutes}m</span>
        <span>${money}</span>
        <button class="cart-remove" data-plan-remove="${i}">✕</button>
      </div>`;
    })
    .join("");
  // Up-front costs (classes + tours; jobs pay instead). Charges happen as
  // each activity starts, but don't let users stage more than they can pay.
  const upfront = baskets.planBook.reduce((sum, entry) => {
    const def = planEntryDef(entry);
    return sum + (entry.type === "job" ? 0 : def?.cost ?? 0);
  }, 0);
  const affordable = state.coins >= upfront;
  const busy = caretakingBusy();
  return `
    <div class="basket-page">
      <div class="basket-list">${rows}</div>
      <div class="cart-row cart-total"><span>${t("plan.upfront")}</span><span>💰${upfront}</span><span></span></div>
      <div class="cart-actions">
        <button id="plan-clear">${t("cart.clear")}</button>
        <button id="plan-start" ${affordable && !busy ? "" : "disabled"}>
          ${busy ? t("plan.caretakerBusy") : affordable ? t("plan.start") : t("cart.noCoins")}
        </button>
      </div>
    </div>`;
}
