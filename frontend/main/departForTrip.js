// main/departForTrip.js — Trip travel animation.
// Departure: run toward the nearer screen edge, off the screen, then hide.

import { currentMonitor } from "../shared/tauri.js";
import { appWindow, latest, trip, rt } from "./state.js";
import { say } from "./say.js";
import { setAnim } from "./setAnim.js";
import { animateX } from "./animateX.js";
import { jlog } from "./jlog.js";

/**
 * Play the tour departure: announce the trip, run the window off the nearer
 * screen edge, then hide it. Captures the monitor, position, and size in
 * `trip` so the return can come home. No-op while already animating or away.
 *
 * Side effects: sets `rt.animating` and `trip.*`, shows the speech bubble,
 * changes the sprite animation, moves and hides the window, logs via jlog.
 *
 * @returns {Promise<void>}
 */
export async function departForTrip() {
  if (rt.animating || trip.away) return;
  rt.animating = true;
  try {
    trip.monitor = await currentMonitor();
    trip.homePos = await appWindow.outerPosition();
    trip.size = await appWindow.outerSize();
    if (!trip.monitor) {
      trip.away = true;
      await appWindow.hide();
      return;
    }
    say(`I'm going out for a tour, ${latest.callMe}!`, 2200);
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const { monitor, homePos, size } = trip;
    const centerX = homePos.x + size.width / 2;
    const goLeft = centerX - monitor.position.x < monitor.position.x + monitor.size.width - centerX;
    setAnim(goLeft ? "run-left" : "run-right");
    const targetX = goLeft
      ? monitor.position.x - size.width - 10
      : monitor.position.x + monitor.size.width + 10;
    await animateX(homePos.x, homePos.y, targetX);
    trip.away = true;
    await appWindow.hide();
    jlog("departure complete, pet hidden");
  } finally {
    rt.animating = false;
  }
}
