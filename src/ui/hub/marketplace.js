// hub/marketplace.js — the Extensions Marketplace tab: official extension
// zips published as assets on a GitHub Release. The list is fetched from
// the GitHub API (CORS-friendly) and cached in ui.market for the session.
//
// To publish: create a release on MARKETPLACE_REPO and attach the extension
// zips (asset name <id>.zip, matching the manifest id inside). Point
// MARKETPLACE_REPO at your repo when it goes live.

import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { escText as esc } from "../panel.js";
import { renderGrid } from "./renderGrid.js";

/** GitHub repo whose LATEST release's zip assets are the marketplace. */
export const MARKETPLACE_REPO = "junhe/pikapet-extensions";

/**
 * Fetch the marketplace listing once per hub session (re-entered on error).
 * Side effects: sets ui.market and re-renders the grid when done.
 *
 * @returns {void}
 */
export function loadMarketplace() {
  if (ui.market && ui.market.status !== "error") return;
  ui.market = { status: "loading", assets: [] };
  fetch(`https://api.github.com/repos/${MARKETPLACE_REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((release) => {
      ui.market = {
        status: "ready",
        assets: (release.assets ?? [])
          .filter((a) => a.name.endsWith(".zip"))
          .map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url })),
      };
    })
    .catch(() => {
      ui.market = { status: "error", assets: [] };
    })
    .finally(() => {
      if (ui.view === "addons" && ui.extensionsTab === "market") renderGrid();
    });
}

/**
 * The Marketplace tab: one card per published extension zip, an
 * install/installed state, or the loading/error/empty notes.
 *
 * @returns {string} Page HTML for the grid.
 */
export function marketplaceHTML() {
  const note = `<div class="ach-section caretaker-title">${t("extmarket.note")}</div>`;
  const m = ui.market;
  if (!m || m.status === "loading") {
    return note + `<div class="empty-note">${t("extmarket.loading")}</div>`;
  }
  if (m.status === "error") {
    return note + `<div class="empty-note">${t("extmarket.error")}</div>`;
  }
  if (!m.assets.length) {
    return note + `<div class="empty-note">${t("extmarket.empty")}</div>`;
  }
  const installed = new Set(state.extensionsInstalled.map((a) => `${a.id}.zip`));
  const cards = m.assets
    .map((a) => {
      const done = installed.has(a.name);
      return `
      <div class="item">
        <span class="qty">${t("extmarket.size", { kb: Math.max(1, Math.round(a.size / 1024)) })}</span>
        <span class="icon">🧩</span>
        <span class="name">${esc(a.name.replace(/\.zip$/, ""))}</span>
        <span class="effects"><button class="fc-fight-btn" data-market-install="${esc(a.url)}" ${done ? "disabled" : ""}>
          ${done ? t("extmarket.installed") : t("extmarket.install")}
        </button></span>
      </div>`;
    })
    .join("");
  return note + cards;
}
