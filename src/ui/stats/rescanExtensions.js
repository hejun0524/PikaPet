// stats/rescanExtensions.js — Extension registry: installed extensions are folders
// scanned by Rust; the hub triggers rescans after install/uninstall via
// "extensions-changed".

import { invoke } from "../shared/tauri.js";
import { pet, runtime } from "./state.js";
import { jlog } from "./jlog.js";

/**
 * Refresh `runtime.installedExtensions` from the Rust `list_installed_extensions`
 * scan and drop pinned extensions that are no longer installed.
 * Side effects: mutates runtime.installedExtensions and pet.pinnedAddons; logs
 * via jlog. Does not save or broadcast — callers do.
 *
 * @returns {Promise<void>}
 */
export async function rescanExtensions() {
  try {
    runtime.installedExtensions = await invoke("list_installed_extensions");
    jlog(`extensions installed: ${runtime.installedExtensions.map((a) => a.id).join(", ") || "(none)"}`);
  } catch (e) {
    console.error("extension scan failed:", e);
    runtime.installedExtensions = [];
  }
  // Unpin extensions that are no longer installed.
  pet.pinnedAddons = pet.pinnedAddons.filter((id) =>
    runtime.installedExtensions.some((a) => a.id === id)
  );
}
