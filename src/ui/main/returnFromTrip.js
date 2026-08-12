// main/returnFromTrip.js — Trip travel animation.
// Return: reappear at a random edge and run back to the departure spot.

import { currentMonitor, PhysicalPosition } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { cityName } from "../shared/names.js";
import { appWindow, latest, trip, rt } from "./state.js";
import { say } from "./say.js";
import { setAnim } from "./setAnim.js";
import { idleAnim } from "./idleAnim.js";
import { playOnce } from "./playOnce.js";
import { animateX } from "./animateX.js";

/**
 * Play the tour return: show the window at a random screen edge, run it back
 * to the departure spot, then report on the trip (visited cities when a
 * journal arrived). No-op while already animating or not away.
 *
 * Side effects: sets `rt.animating`, clears `trip.away`, moves and shows the
 * window, changes the sprite animation, shows the speech bubble.
 *
 * @returns {Promise<void>}
 */
export async function returnFromTrip() {
  if (rt.animating || !trip.away) return;
  rt.animating = true;
  try {
    const monitor = trip.monitor ?? (await currentMonitor());
    const homePos = trip.homePos ?? (await appWindow.outerPosition());
    const size = trip.size ?? (await appWindow.outerSize());
    if (!monitor) {
      trip.away = false;
      await appWindow.show();
      setAnim(idleAnim());
      return;
    }
    // Come back from a random edge.
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft
      ? monitor.position.x - size.width - 10
      : monitor.position.x + monitor.size.width + 10;
    await appWindow.setPosition(new PhysicalPosition(startX, homePos.y));
    await appWindow.show();
    setAnim(homePos.x > startX ? "run-right" : "run-left");
    await animateX(startX, homePos.y, homePos.x);
    trip.away = false;
    setAnim(idleAnim());
    // Wave hello once home; deferred past the finally so rt.animating is
    // cleared when playOnce checks it.
    setTimeout(() => playOnce("wave", 2500), 50);
    if (latest.journal?.cities?.length) {
      say(
        t("bubble.visited", {
          cities: latest.journal.cities.map(cityName).join(", "),
          callMe: latest.callMe,
        }),
        8000
      );
    } else {
      say(t("bubble.back", { callMe: latest.callMe }));
    }
  } finally {
    rt.animating = false;
  }
}
