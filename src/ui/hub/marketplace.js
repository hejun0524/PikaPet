// hub/marketplace.js — the Extensions Marketplace tab: a signed registry
// fetched from a GitHub Releases *asset* URL (see `extensions::registry`
// in Rust — never `api.github.com`, which unauthenticated calls rate-limit,
// and never `raw.githubusercontent.com`), with a disk-cached fallback so
// the tab is never blank just because the network call failed.

import { invoke } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { escText as esc } from "../panel.js";
import { renderGrid } from "./renderGrid.js";
import { permissionPromptHTML } from "./permissionPromptHTML.js";

/**
 * Fetch the marketplace listing — once per hub session unless `force`, or
 * automatically re-entered whenever the last attempt errored out.
 *
 * Side effects: sets `ui.market` and re-renders the grid once settled.
 *
 * @param {boolean} [force] - Skip the in-memory/session short-circuit and
 *   ask Rust to hit the network again (manual refresh, focus, reconnect).
 * @returns {Promise<void>}
 */
export async function loadMarketplace(force = false) {
  if (!force && ui.market && ui.market.status !== "error") return;
  ui.market = { status: "loading", entries: [], stale: false };
  try {
    const result = await invoke("fetch_registry", { force });
    ui.market = { status: "ready", entries: result.extensions ?? [], stale: !!result.stale };
  } catch {
    ui.market = { status: "error", entries: [], stale: false };
  } finally {
    if (ui.view === "extensions" && ui.extensionsTab === "market") renderGrid();
  }
}

/**
 * The Marketplace tab: one card per registry entry with an
 * install/update/installed state, the permission-confirmation card when
 * one's pending, and loading/error/empty/stale notes. Browsing always
 * works offline (it's whatever was last cached); only Install/Update
 * disable when the listing itself is stale.
 *
 * @returns {string} Page HTML for the grid.
 */
export function marketplaceHTML() {
  if (ui.marketPermissionPrompt) return permissionPromptHTML();

  const note = `<div class="ach-section caretaker-title">${t("extmarket.note")}</div>`;
  const refreshRow = `<div class="fc-actions"><button id="market-refresh">${t("extmarket.refresh")}</button></div>`;
  const m = ui.market;
  if (!m || m.status === "loading") {
    return note + refreshRow + `<div class="empty-note">${t("extmarket.loading")}</div>`;
  }
  if (m.status === "error") {
    return note + refreshRow + `<div class="empty-note">${t("extmarket.error")}</div>`;
  }
  const staleNote = m.stale ? `<div class="gov-note">${t("extmarket.offline")}</div>` : "";
  if (!m.entries.length) {
    return note + refreshRow + staleNote + `<div class="empty-note">${t("extmarket.empty")}</div>`;
  }
  const installedById = new Map(state.extensionsInstalled.map((a) => [a.id, a]));
  const cards = m.entries
    .map((entry) => {
      const installed = installedById.get(entry.id);
      const hasUpdate = !!(installed && installed.version && entry.version && installed.version !== entry.version);
      const label = hasUpdate ? t("extmarket.update") : installed ? t("extmarket.installed") : t("extmarket.install");
      const disabled = (installed && !hasUpdate) || m.stale;
      // `icon` (an actual image) wins if present; otherwise fall back to
      // the extension's own emoji (already in its extension.json, so
      // publishing it here is free — no new asset to host), then the
      // generic 🧩 if neither was given. If the icon image fails to load,
      // fall back to the emoji rather than a blank box.
      const fallbackEmoji = esc(entry.emoji || "🧩");
      const icon = entry.icon
        ? `<img src="${esc(entry.icon)}" onerror="this.replaceWith('${fallbackEmoji}')" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;" />`
        : fallbackEmoji;
      return `
      <div class="item">
        <span class="icon">${icon}</span>
        <span class="name">${esc(entry.name ?? entry.id)}</span>
        ${entry.description ? `<div class="gov-note">${esc(entry.description)}</div>` : ""}
        <span class="effects"><button class="fc-fight-btn" data-market-install="${esc(entry.id)}" ${disabled ? "disabled" : ""}>
          ${label}
        </button></span>
      </div>`;
    })
    .join("");
  return note + refreshRow + staleNote + cards;
}
