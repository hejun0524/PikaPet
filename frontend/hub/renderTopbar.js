// hub/renderTopbar.js — Top bar: cart + plan book buttons.

import { state, ui } from "./state.js";
import { addonList } from "../items.js";
import { VIEWS } from "./constants.js";
import { renderCartBadge } from "./renderCartBadge.js";
import { renderPlanBadge } from "./renderPlanBadge.js";
import { renderTradeBadge } from "./renderTradeBadge.js";
import { renderServiceBadge } from "./renderServiceBadge.js";

/**
 * Render the top bar: the view title and which basket buttons (cart, plan
 * book, trade, service, add-on manager, add-ons home) are visible, then
 * refresh all four basket badges.
 *
 * Side effects: rewrites #view-title and toggles the top-bar buttons.
 *
 * @returns {void}
 */
export function renderTopbar() {
  const addon = ui.view.startsWith("addon:")
    ? addonList(state.addonsInstalled).find((a) => a.id === ui.view.slice(6))
    : null;
  document.getElementById("view-title").textContent = addon
    ? `${addon.emoji} ${addon.name}`
    : VIEWS[ui.view].title;
  document.getElementById("cart-btn").hidden = ui.view !== "shopping";
  document.getElementById("plan-btn").hidden = ui.view !== "career";
  document.getElementById("trade-btn").hidden = ui.view !== "pika";
  document.getElementById("service-btn").hidden = ui.view !== "government";
  document.getElementById("manager-btn").hidden = ui.view !== "addons";
  document.getElementById("addons-home-btn").hidden = !ui.view.startsWith("addon:");
  renderCartBadge();
  renderPlanBadge();
  renderTradeBadge();
  renderServiceBadge();
}
