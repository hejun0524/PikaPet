// hub/uninstallAddonFlow.js

import { invoke, emit } from "../shared/tauri.js";
import { state, ui } from "./state.js";
import { addonFrame } from "./addonFrame.js";
import { renderGrid } from "./renderGrid.js";
import { renderAddonDrawer } from "./renderAddonDrawer.js";
import { renderSidePanel } from "./renderSidePanel.js";

/**
 * Uninstall an add-on and refresh the UI.
 *
 * Side effects: invokes uninstall_addon, emits addons-changed, updates
 * `state.addonsInstalled` and `ui.addonMsg`, removes the add-on's running
 * iframe and tray widget, and re-renders grid/drawer/side panel.
 *
 * @param {string} id - Add-on id to uninstall.
 * @returns {Promise<void>}
 */
export async function uninstallAddonFlow(id) {
  try {
    await invoke("uninstall_addon", { id });
    ui.addonMsg = `Uninstalled ${id} ✔`;
    emit("addons-changed");
    state.addonsInstalled = await invoke("list_installed_addons");
    // Kill its running page (stops any playback) and its tray widget.
    addonFrame(id)?.remove();
    emit("addon-widget-set", { id, on: false });
  } catch (e) {
    ui.addonMsg = `Uninstall failed: ${e}`;
  }
  if (ui.view === "addons") renderGrid();
  renderAddonDrawer();
  renderSidePanel();
}
