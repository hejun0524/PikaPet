// hub/renderTopbar.js — Top bar: cart + plan book buttons.

import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { extensionList } from "../items.js";
import { VIEWS, BASKET_VIEWS } from "./constants.js";
import { renderCartBadge } from "./renderCartBadge.js";
import { renderPlanBadge } from "./renderPlanBadge.js";
import { renderTradeBadge } from "./renderTradeBadge.js";
import { renderServiceBadge } from "./renderServiceBadge.js";

/**
 * Render the top bar: the view title, the ← Back button (basket pages and
 * extension pages), and which basket buttons (cart, plan book, trade,
 * service) are visible, then refresh all four basket badges.
 *
 * Side effects: rewrites #view-title and toggles the top-bar buttons.
 *
 * @returns {void}
 */
export function renderTopbar() {
  const extension = ui.view.startsWith("extension:")
    ? extensionList(state.extensionsInstalled).find((a) => a.id === ui.view.slice("extension:".length))
    : null;
  const basketEmoji = BASKET_VIEWS[ui.view];
  document.getElementById("view-title").textContent = extension
    ? `${extension.emoji} ${extension.name}`
    : basketEmoji
      ? `${basketEmoji} ${t(`view.${ui.view}`)}`
      : `${VIEWS[ui.view].emoji} ${t(`view.${ui.view}`)}`;
  document.getElementById("cart-btn").hidden = ui.view !== "shopping";
  document.getElementById("plan-btn").hidden = ui.view !== "career";
  document.getElementById("trade-btn").hidden = ui.view !== "pika";
  document.getElementById("service-btn").hidden = ui.view !== "government";
  document.getElementById("extension-install-btn").hidden = !(ui.view === "extensions" && ui.extensionsTab === "manager");
  document.getElementById("market-refresh-btn").hidden = !(ui.view === "extensions" && ui.extensionsTab === "market");
  document.getElementById("extensions-home-btn").hidden = !ui.view.startsWith("extension:");
  document.getElementById("back-btn").hidden = !basketEmoji;
  renderCartBadge();
  renderPlanBadge();
  renderTradeBadge();
  renderServiceBadge();
}
