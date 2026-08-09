// stats/resizePopover.js — The popover window hugs its content: the panel
// height changes with the compact toggle and status rows, and widget boxes
// hang below it.

import { LogicalSize, getCurrentWindow } from "../shared/tauri.js";
import { runtime } from "./state.js";
import { POPOVER_W } from "./constants.js";
import { jlog } from "./jlog.js";

/**
 * Measure the panel plus any widget boxes and resize the popover window to
 * fit. Skips no-op resizes (less than 2px difference from the last applied
 * height, tracked in runtime.lastPopoverH).
 * Side effects: mutates runtime.lastPopoverH; resizes the Tauri window
 * (failures logged via jlog).
 *
 * @returns {void}
 */
export function resizePopover() {
  let h = 9 + document.getElementById("panel").offsetHeight; // 9 = tray arrow
  for (const box of document.querySelectorAll(".widget-box")) {
    h += box.offsetHeight + 8;
  }
  h = Math.ceil(h) + 2;
  if (Math.abs(h - runtime.lastPopoverH) < 2) return;
  runtime.lastPopoverH = h;
  getCurrentWindow()
    .setSize(new LogicalSize(POPOVER_W, h))
    .catch((e) => jlog(`popover resize failed: ${e}`));
}
