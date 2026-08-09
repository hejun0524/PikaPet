// stats/applyTrayCompact.js — Compact (minimized) popover: the ▾ toggle
// collapses the popover to the essentials: slim emoji+bar care meters (no
// numbers) and Home / Add-ons / Settings buttons.

import { runtime } from "./state.js";

/**
 * Reflect runtime.trayCompact in the DOM: toggle the body "compact" class
 * and swap the collapse button's arrow + tooltip.
 * Side effects: DOM writes.
 *
 * @returns {void}
 */
export function applyTrayCompact() {
  document.body.classList.toggle("compact", runtime.trayCompact);
  document.getElementById("tray-collapse").textContent = runtime.trayCompact ? "▴" : "▾";
  document.getElementById("tray-collapse").title = runtime.trayCompact ? "Expand" : "Minimize";
}
