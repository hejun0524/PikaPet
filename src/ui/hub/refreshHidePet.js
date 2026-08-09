// hub/refreshHidePet.js

import { WebviewWindow } from "../shared/tauri.js";

/**
 * Sync the Settings page's "Hide my pet" checkbox with the pet window's
 * actual visibility. No-op when the checkbox isn't rendered.
 *
 * Side effects: updates #hide-pet's checked state.
 *
 * @returns {Promise<void>}
 */
export async function refreshHidePet() {
  const box = document.getElementById("hide-pet");
  if (!box) return;
  const petWin = await WebviewWindow.getByLabel("main");
  box.checked = !(await petWin.isVisible());
}
