// hub/applyStaticText.js — translate the hub.html strings that renderers
// don't rewrite: section headers, nav-button tooltips, and the top-bar
// buttons. Called from renderAll() so a language change repaints them too.

import { t } from "../shared/i18n.js";
import { applySideCollapsed } from "./applySideCollapsed.js";

/**
 * Write the active locale's text into the hub's static DOM: side-panel
 * section headers (Care/Traits/World/Quick Launch), the footer view-button
 * tooltips, and the top-bar back/manager button tooltips.
 *
 * Side effects: DOM writes only.
 *
 * @returns {void}
 */
export function applyStaticText() {
  const side = document.getElementById("side");
  const [careH2, traitsH2] = side.querySelectorAll("section h2");
  careH2.textContent = t("chrome.care");
  traitsH2.textContent = t("chrome.traits");
  side.querySelector(":scope > h2").textContent = t("chrome.world");
  document.querySelector("#side-extensions-section h2").textContent = t("chrome.quickLaunch");
  for (const btn of side.querySelectorAll("footer [data-view]")) {
    btn.title = t(`view.${btn.dataset.view}`);
  }
  document.getElementById("extensions-home-btn").title = t("chrome.backToExtensions");
  document.getElementById("back-btn").title = t("chrome.back");
  applySideCollapsed(); // restores the icon-rail state + localizes its tooltip
}
