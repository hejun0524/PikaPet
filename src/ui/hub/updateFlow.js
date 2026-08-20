// hub/updateFlow.js — mirrors Rust's background auto-update phase (see
// src/updates.rs) into `ui.update` and repaints the topbar's "Restart to
// Update" button whenever it changes. All of check/download/install
// happens in Rust on its own schedule; this file only ever reacts.

import { invoke, listen } from "../shared/tauri.js";
import { ui } from "./state.js";
import { renderTopbar } from "./renderTopbar.js";

function applyPhase(phase) {
  ui.update = phase;
  renderTopbar();
}

/**
 * Pick up whatever phase Rust is already in (in case the download/install
 * finished while this window wasn't open to catch the live event), then
 * keep listening for changes.
 *
 * @returns {Promise<void>}
 */
export async function initUpdateFlow() {
  try {
    applyPhase(await invoke("update_status"));
  } catch (e) {
    console.error("update_status failed:", e);
  }
  listen("update-phase", ({ payload }) => applyPhase(payload));
}

/**
 * The "Restart to Update" button's click handler. `restart_to_update`
 * itself decides what that means — on Windows an update download is held
 * back until now, so this call is what actually installs it (and, on
 * Windows, that install ends the process); everywhere else the update was
 * already installed in the background and this just restarts into it. See
 * src/updates.rs for the full explanation.
 *
 * @returns {Promise<void>}
 */
export async function restartToUpdate() {
  try {
    await invoke("restart_to_update");
  } catch (e) {
    console.error("restart_to_update failed:", e);
  }
}
