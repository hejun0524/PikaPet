// main/clampToScreen.js

import { currentMonitor, PhysicalPosition } from "../shared/tauri.js";
import { appWindow, trip, rt } from "./state.js";

/**
 * If the drag left the pet (partly) outside the screen, snap it back in.
 * Skipped during travel animations and while away, because those go
 * off-screen on purpose.
 *
 * Side effects: may move the window.
 *
 * @returns {Promise<void>}
 */
export async function clampToScreen() {
  if (rt.animating || trip.away) return; // travel animations go off-screen on purpose
  const monitor = await currentMonitor();
  if (!monitor) return;
  const pos = await appWindow.outerPosition();
  const size = await appWindow.outerSize();
  const minX = monitor.position.x;
  const minY = monitor.position.y;
  const maxX = monitor.position.x + monitor.size.width - size.width;
  const maxY = monitor.position.y + monitor.size.height - size.height;
  const x = Math.min(Math.max(pos.x, minX), maxX);
  const y = Math.min(Math.max(pos.y, minY), maxY);
  if (x !== pos.x || y !== pos.y) {
    await appWindow.setPosition(new PhysicalPosition(x, y));
  }
}
