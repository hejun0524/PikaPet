// hub/marketInstallFlow.js — install an extension straight from a
// Marketplace download URL (Rust downloads the zip and extracts it like a
// local install).

import { invoke, emit } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { extensionFrame } from "./extensionFrame.js";
import { renderGrid } from "./renderGrid.js";
import { renderSidePanel } from "./renderSidePanel.js";

/**
 * Download + install a Marketplace zip, then refresh the UI (same
 * post-install steps as installExtensionFlow).
 *
 * @param {string} url - The release asset's browser_download_url.
 * @returns {Promise<void>}
 */
export async function marketInstallFlow(url) {
  try {
    const manifest = await invoke("install_extension_from_url", { url });
    ui.extensionMsg = t("addonmgr.installed", { name: manifest.name ?? manifest.id });
    // On reinstall, kill the old build's running page and tray widget.
    extensionFrame(manifest.id)?.remove();
    emit("extension-widget-set", { id: manifest.id, on: false });
    emit("extensions-changed");
    state.extensionsInstalled = await invoke("list_installed_extensions");
  } catch (e) {
    ui.extensionMsg = t("addonmgr.installFailed", { err: e });
  }
  if (ui.view === "addons") renderGrid();
  renderSidePanel();
}
