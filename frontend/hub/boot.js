// hub/boot.js

import { invoke } from "../shared/tauri.js";
import { state } from "./state.js";
import { applyState } from "./applyState.js";
import { renderAll } from "./renderAll.js";

/**
 * Initial state from the save file (live broadcasts take over afterwards):
 * scan installed add-ons, load and apply save.json, then paint everything.
 *
 * Side effects: mutates `state`, logs failures to the console, and calls
 * renderAll().
 *
 * @returns {Promise<void>}
 */
export async function boot() {
  try {
    state.addonsInstalled = await invoke("list_installed_addons");
  } catch (e) {
    console.error("addon scan failed:", e);
  }
  try {
    const raw = await invoke("load_state");
    if (raw) applyState(JSON.parse(raw));
  } catch (e) {
    console.error("failed to load hub state:", e);
  }
  renderAll();
}
