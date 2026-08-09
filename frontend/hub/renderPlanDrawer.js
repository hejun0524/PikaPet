// hub/renderPlanDrawer.js — The plan book drawer mirrors the cart's flow:
// stage entries, then Start.

import { state, baskets } from "./state.js";
import { planEntryDef } from "./planEntryDef.js";
import { caretakingBusy } from "./caretakingBusy.js";

/**
 * Render the career plan-book drawer: one row per staged class/job with a
 * remove button, the up-front cost, and Clear / Start actions. No-op while
 * hidden.
 *
 * Side effects: rewrites #plan-drawer.
 *
 * @returns {void}
 */
export function renderPlanDrawer() {
  const drawer = document.getElementById("plan-drawer");
  if (drawer.hidden) return;
  if (baskets.planBook.length === 0) {
    drawer.innerHTML = `<div class="cart-empty">Plan book is empty — click classes or jobs to add them</div>`;
    return;
  }
  const rows = baskets.planBook
    .map((entry, i) => {
      const def = planEntryDef(entry);
      const money = entry.type === "job" ? `+💰${def.pay}` : `−💰${def.cost}`;
      return `
      <div class="cart-row">
        <span>${def.emoji} ${def.name} · ⏱ ${def.minutes}m</span>
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
  drawer.innerHTML = `
    ${rows}
    <div class="cart-row cart-total"><span>Up-front cost</span><span>💰${upfront}</span><span></span></div>
    <div class="cart-actions">
      <button id="plan-clear">Clear</button>
      <button id="plan-start" ${affordable && !busy ? "" : "disabled"}>
        ${busy ? "🛎️ Caretaker on duty" : affordable ? "▶ Start plan" : "Not enough coins"}
      </button>
    </div>`;
}
