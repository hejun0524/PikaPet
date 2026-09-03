// stats/initClock.js — Fine-grained master clock: runs the care decay tick
// at the current speed (developer mode toggles live), completes
// activities/shifts and streams countdowns.

import { pet, runtime } from "./state.js";
import { tickMs } from "./tickMs.js";
import { tick } from "./tick.js";
import { completeActivity } from "./completeActivity.js";
import { processCaretaking } from "./processCaretaking.js";
import { caretakerBrain } from "./caretakerBrain.js";
import { kitchenBrain } from "./kitchenBrain.js";
import { fightclubRegen } from "./fightclubRegen.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";

/**
 * Arm the 1-second master interval: the care-decay tick (tracked via
 * runtime.lastDecayAt), activity/shift completion, caretaker automation,
 * and countdown streaming while something is active.
 * Side effects: installs a setInterval that mutates pet/runtime, renders,
 * saves, and broadcasts.
 *
 * @returns {void}
 */
export function initClock() {
  setInterval(() => {
    if (Date.now() - runtime.lastDecayAt >= tickMs()) {
      runtime.lastDecayAt = Date.now();
      tick();
      return;
    }
    // Fight HP recovers a little every game-minute after a battle.
    if (fightclubRegen()) {
      save();
      broadcastState();
    }
    // Paw-bot work resolves on the same clock (and streams countdowns below).
    if (kitchenBrain()) {
      render();
      save();
      broadcastState();
      return;
    }
    const a = pet.activity.active;
    const c = pet.caretaking.active;
    const kitchenBusy = pet.kitchen.orders.some((o) => o.endsAt);
    if (!a && !c && !kitchenBusy) return;
    if (a && Date.now() - a.startedAt >= a.durationMs) {
      completeActivity();
      return;
    }
    if (c && Date.now() - c.startedAt >= c.durationMs) {
      pet.caretaking.active = null;
      processCaretaking();
      render();
      save();
      broadcastState();
      return;
    }
    if (caretakerBrain()) {
      render();
      save();
      broadcastState();
      return;
    }
    broadcastState();
    render();
  }, 1000);
}
