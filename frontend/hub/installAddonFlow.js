// hub/installAddonFlow.js

import { invoke, emit } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { addonFrame } from "./addonFrame.js";
import { renderGrid } from "./renderGrid.js";
import { renderAddonDrawer } from "./renderAddonDrawer.js";
import { renderSidePanel } from "./renderSidePanel.js";

/**
 * Pick an add-on zip via the native dialog, install it, and refresh the UI.
 *
 * Side effects: invokes install_addon, kills a reinstalled add-on's stale
 * iframe/tray widget, emits addons-changed, updates `state.addonsInstalled`
 * and `ui.addonMsg`, and re-renders grid/drawer/side panel.
 *
 * @returns {Promise<void>}
 */
export async function installAddonFlow() {
  try {
    const path = await invoke("plugin:dialog|open", {
      options: {
        title: t("addonmgr.zipTitle"),
        filters: [{ name: "Add-on zip", extensions: ["zip"] }],
        multiple: false,
        directory: false,
      },
    });
    if (!path) return;
    const manifest = await invoke("install_addon", { path });
    ui.addonMsg = t("addonmgr.installed", { name: manifest.name ?? manifest.id });
    // On reinstall, kill the old build's running page and tray widget so the
    // next open loads the freshly extracted files instead of the stale iframe.
    addonFrame(manifest.id)?.remove();
    emit("addon-widget-set", { id: manifest.id, on: false });
    emit("addons-changed");
    state.addonsInstalled = await invoke("list_installed_addons");
  } catch (e) {
    ui.addonMsg = t("addonmgr.installFailed", { err: e });
  }
  if (ui.view === "addons") renderGrid();
  renderAddonDrawer();
  renderSidePanel();
}
