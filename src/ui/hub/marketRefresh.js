// hub/marketRefresh.js — keeps the Marketplace tab live like VS Code's
// Extensions view: refetch on manual request, and automatically whenever
// the hub window regains focus or the OS reports coming back online —
// but only while the user is actually looking at that tab, so it doesn't
// spam fetches in the background.

import { ui } from "./state.js";
import { loadMarketplace } from "./marketplace.js";

function onMarketTab() {
  return ui.view === "extensions" && ui.extensionsTab === "market";
}

/**
 * Wire automatic refetch-on-focus and refetch-on-reconnect for the
 * Marketplace tab. The manual "🔄 Refresh" button itself is wired in
 * initEvents.js (`data-market-install`'s sibling click handlers), calling
 * `loadMarketplace(true)` directly — this only covers the two passive
 * triggers.
 *
 * @returns {void}
 */
export function initMarketRefresh() {
  window.addEventListener("focus", () => {
    if (onMarketTab()) loadMarketplace(true);
  });
  window.addEventListener("online", () => {
    if (onMarketTab()) loadMarketplace(true);
  });
}
