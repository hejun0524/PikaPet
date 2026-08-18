// hub/marketInstallFlow.js — install an extension from the Marketplace
// registry (Rust looks up the entry, downloads its zip, and verifies it
// against that entry's signature before extracting). Clicking Install
// shows a permission-confirmation card first (see permissionPromptHTML.js)
// rather than installing immediately.

import { invoke, emit } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { renderGrid } from "./renderGrid.js";
import { renderSidePanel } from "./renderSidePanel.js";

/**
 * Show the permission-confirmation card for a registry entry, instead of
 * installing right away.
 *
 * @param {string} entryId - Registry entry id (matches `ui.market.entries`).
 * @returns {void}
 */
export function promptMarketInstall(entryId) {
  const entry = ui.market?.entries?.find((e) => e.id === entryId);
  if (!entry) return;
  ui.marketPermissionPrompt = entry;
  renderGrid();
}

/** Dismiss the permission-confirmation card without installing. */
export function cancelMarketInstall() {
  ui.marketPermissionPrompt = null;
  renderGrid();
}

/**
 * Actually install whatever registry entry is pending confirmation in
 * `ui.marketPermissionPrompt`, then refresh the UI (same post-install
 * steps as installExtensionFlow).
 *
 * @returns {Promise<void>}
 */
export async function confirmMarketInstall() {
  const entry = ui.marketPermissionPrompt;
  if (!entry) return;
  ui.marketPermissionPrompt = null;
  try {
    const manifest = await invoke("install_extension_from_registry", { entryId: entry.id });
    ui.extensionMsg = t("extensionmgr.installed", { name: manifest.name ?? manifest.id });
    // On reinstall, kill the old build's running child webview and tray widget.
    await invoke("close_extension_webview", { id: manifest.id });
    emit("extension-widget-set", { id: manifest.id, on: false });
    emit("extensions-changed");
    state.extensionsInstalled = await invoke("list_installed_extensions");
  } catch (e) {
    ui.extensionMsg = t("extensionmgr.installFailed", { err: e });
  }
  if (ui.view === "extensions") renderGrid();
  renderSidePanel();
}
