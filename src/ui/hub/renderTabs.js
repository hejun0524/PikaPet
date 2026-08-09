// hub/renderTabs.js — Tabs.

import { tOr } from "../shared/i18n.js";
import { tabSource } from "./tabSource.js";

/**
 * Render the tab strip for the current view (empty for tab-less views).
 *
 * Side effects: rewrites #tabs.
 *
 * @returns {void}
 */
export function renderTabs() {
  const tabs = tabSource();
  document.getElementById("tabs").innerHTML = tabs
    ? tabs.source
        .map(
          // push: true starts a right-aligned tab group
          (c) => `
    <button data-tab="${c.key}" class="${c.key === tabs.active ? "active" : ""}${c.push ? " tab-push" : ""}">
      ${c.tabEmoji} ${tabs.prefix ? tOr(tabs.prefix + c.key, c.label) : c.label}
    </button>`
        )
        .join("")
    : "";
}
