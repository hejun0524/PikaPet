// hub/installExtensionFlow.js

import { invoke, emit } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { renderGrid } from "./renderGrid.js";
import { renderSidePanel } from "./renderSidePanel.js";

/**
 * Pick an extension zip via the native dialog, install it, and refresh the UI.
 *
 * Side effects: invokes install_extension, kills a reinstalled extension's stale
 * iframe/tray widget, emits extensions-changed, updates `state.extensionsInstalled`
 * and `ui.extensionMsg`, and re-renders grid/drawer/side panel.
 *
 * @returns {Promise<void>}
 */
export async function installExtensionFlow() {
  try {
    const path = await invoke("plugin:dialog|open", {
      options: {
        title: t("extensionmgr.zipTitle"),
        filters: [{ name: "Extension zip", extensions: ["zip"] }],
        multiple: false,
        directory: false,
      },
    });
    if (!path) return;
    const manifest = await invoke("install_extension", { path });
    ui.extensionMsg = t("extensionmgr.installed", { name: manifest.name ?? manifest.id });
    // On reinstall, kill the old build's running child webview and tray
    // widget so the next open loads the freshly extracted files instead
    // of the stale one (install_extension only overwrites files on disk —
    // an already-running webview keeps whatever it already loaded).
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
