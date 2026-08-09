// stats/tick.js — Care decay: one game-clock tick.

import { CRITICAL_BELOW } from "../panel.js";
import { pet } from "./state.js";
import { DECAY_KEYS } from "./constants.js";
import { refreshPika } from "./refreshPika.js";
import { refreshKitchen } from "./refreshKitchen.js";
import { applyBankInterest } from "./applyBankInterest.js";
import { meterOf } from "./meterOf.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";
import { jlog } from "./jlog.js";

/**
 * Run one care-decay tick: refresh Pika's store and bank interest, drop the
 * decaying meters by 1, and drain 1 health per critical meter. Skipped
 * entirely while the pet is on a trip (meters are maintained mid-tour).
 * Side effects: mutates pet, renders, saves, broadcasts, logs via jlog.
 *
 * @returns {void}
 */
export function tick() {
  // All care meters are maintained while the pet is on a trip.
  if (pet.activity.active?.type === "tour") {
    const changed = refreshPika() | refreshKitchen();
    if (changed) {
      save();
      broadcastState();
    }
    jlog("tick: skipped (touring)");
    return;
  }
  refreshPika();
  refreshKitchen();
  applyBankInterest();
  const criticalCount = pet.care.filter(
    (s) => DECAY_KEYS.includes(s.key) && (s.value / s.max) * 100 < CRITICAL_BELOW
  ).length;

  for (const s of pet.care) {
    if (DECAY_KEYS.includes(s.key)) {
      s.value = Math.max(0, s.value - 1);
    } else if (s.key === "health") {
      s.value = Math.max(0, s.value - criticalCount);
    }
  }
  render();
  save();
  broadcastState();
  jlog(`tick: critical=${criticalCount} health=${meterOf("health").value}`);
}
