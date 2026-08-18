// hub/uninstallExtensionFlow.js

import { invoke, emit } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { renderGrid } from "./renderGrid.js";
import { renderSidePanel } from "./renderSidePanel.js";

/**
 * Uninstall an extension and refresh the UI.
 *
 * Side effects: invokes uninstall_extension (which also closes its running
 * child webview/popup window Rust-side), emits extensions-changed, updates
 * `state.extensionsInstalled` and `ui.extensionMsg`, turns off its tray
 * widget, and re-renders grid/drawer/side panel.
 *
 * @param {string} id - Extension id to uninstall.
 * @returns {Promise<void>}
 */
export async function uninstallExtensionFlow(id) {
  try {
    await invoke("uninstall_extension", { id });
    ui.extensionMsg = t("extensionmgr.uninstalled", { name: id });
    emit("extensions-changed");
    state.extensionsInstalled = await invoke("list_installed_extensions");
    emit("extension-widget-set", { id, on: false });
  } catch (e) {
    ui.extensionMsg = t("extensionmgr.uninstallFailed", { err: e });
  }
  if (ui.view === "extensions") renderGrid();
  renderSidePanel();
}
