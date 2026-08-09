// hub/refreshAutostart.js

import { invoke } from "../shared/tauri.js";

/**
 * Sync the Settings page's autostart checkbox with the OS autostart state.
 * No-op when the checkbox isn't rendered; failures are logged to the console.
 *
 * Side effects: updates #autostart's checked state.
 *
 * @returns {Promise<void>}
 */
export async function refreshAutostart() {
  const box = document.getElementById("autostart");
  if (!box) return;
  try {
    box.checked = await invoke("plugin:autostart|is_enabled");
  } catch (e) {
    console.error("autostart state failed:", e);
  }
}
