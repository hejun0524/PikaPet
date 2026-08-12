// hub/applySideCollapsed.js — the side panel's collapsed (icon-rail) state:
// the CSS does the actual hiding via #layout.collapsed; this keeps the
// toggle button's arrow and localized tooltip in sync.

import { t } from "../shared/i18n.js";

/**
 * Restore the persisted collapsed state (call once at boot) and refresh the
 * ⏴/⏵ toggle button. Safe to call on every repaint (applyStaticText does,
 * so language changes re-localize the tooltip).
 *
 * @returns {void}
 */
export function applySideCollapsed() {
  const layout = document.getElementById("layout");
  let saved = null;
  try {
    saved = localStorage.getItem("sideCollapsed");
  } catch {}
  if (saved !== null) layout.classList.toggle("collapsed", saved === "1");
  const collapsed = layout.classList.contains("collapsed");
  const btn = document.getElementById("side-collapse");
  btn.textContent = collapsed ? "⏵" : "⏴";
  btn.title = collapsed ? t("chrome.expand") : t("chrome.minimize");
}
