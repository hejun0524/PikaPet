// stats/applyStaticText.js — translate the stats.html strings that render()
// doesn't rewrite: section headers, footer view-button tooltips, and the
// compact-mode shortcut buttons. Called from render() so a language change
// repaints them too.

import { t } from "../shared/i18n.js";
import { runtime } from "./state.js";

/**
 * Write the active locale's text into the popover's static DOM: section
 * headers (Care/Traits/World/Quick Launch) and the tooltips of the footer
 * view buttons and compact-mode shortcuts.
 *
 * Side effects: DOM writes only.
 *
 * @returns {void}
 */
export function applyStaticText() {
  document.querySelector("#care-section h2").textContent = t("chrome.care");
  document.querySelector("#traits-section h2").textContent = t("chrome.traits");
  document.getElementById("world-title").textContent = t("chrome.world");
  document.querySelector("#extensions-section h2").textContent = t("chrome.quickLaunch");
  for (const btn of document.querySelectorAll("#panel footer button")) {
    btn.title = t(`view.${btn.id}`);
  }
  document.getElementById("mini-home").title = t("view.home");
  document.getElementById("mini-extensions").title = t("view.extensions");
  document.getElementById("mini-settings").title = t("view.settings");
  document.getElementById("tray-collapse").title = runtime.trayCompact
    ? t("chrome.expand")
    : t("chrome.minimize");
}
