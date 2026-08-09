// hub/renderTabs.js — Tabs.

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
          // push: true starts a right-aligned group (adventure's cat tabs)
          (c) => `
    <button data-tab="${c.key}" class="${c.key === tabs.active ? "active" : ""}${c.push ? " tab-push" : ""}">
      ${c.tabEmoji} ${c.label}
    </button>`
        )
        .join("")
    : "";
}
