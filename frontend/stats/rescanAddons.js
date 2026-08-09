// stats/rescanAddons.js — Add-on registry: installed add-ons are folders
// scanned by Rust; the hub triggers rescans after install/uninstall via
// "addons-changed".

import { invoke } from "../shared/tauri.js";
import { pet, runtime } from "./state.js";
import { jlog } from "./jlog.js";

/**
 * Refresh `runtime.installedAddons` from the Rust `list_installed_addons`
 * scan and drop pinned add-ons that are no longer installed.
 * Side effects: mutates runtime.installedAddons and pet.pinnedAddons; logs
 * via jlog. Does not save or broadcast — callers do.
 *
 * @returns {Promise<void>}
 */
export async function rescanAddons() {
  try {
    runtime.installedAddons = await invoke("list_installed_addons");
    jlog(`addons installed: ${runtime.installedAddons.map((a) => a.id).join(", ") || "(none)"}`);
  } catch (e) {
    console.error("addon scan failed:", e);
    runtime.installedAddons = [];
  }
  // Unpin add-ons that are no longer installed.
  pet.pinnedAddons = pet.pinnedAddons.filter((id) =>
    runtime.installedAddons.some((a) => a.id === id)
  );
}
