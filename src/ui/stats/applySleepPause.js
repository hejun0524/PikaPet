// stats/applySleepPause.js — Compensates every wall-clock-based timer for
// time the computer spent asleep, so care decay and activities/caretaker
// shifts don't silently advance while the lid was closed. Fed by the Rust
// "system-slept" event (main.rs spawn_sleep_watcher); gated on
// pet.settings.pauseOnSleep (Settings → General, default on).

import { pet, runtime } from "./state.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";

/**
 * Shift every absolute timestamp the game clock compares against "now"
 * forward by the slept duration, so elapsed-time math (tick, activity/shift
 * completion, fight-HP regen, kitchen order timers) comes out the same as if
 * no time had passed at all.
 *
 * Side effects: mutates runtime.lastDecayAt/lastFcRegenAt, pet.activity/
 * caretaking active timers, and pet.kitchen order timers; saves and
 * broadcasts when it changes anything.
 *
 * @param {number} ms - Milliseconds the system was asleep (from the Rust
 *   watcher's wall-clock gap).
 * @returns {void}
 */
export function applySleepPause(ms) {
  if (!pet.settings.pauseOnSleep || !(ms > 0)) return;
  runtime.lastDecayAt += ms;
  runtime.lastFcRegenAt += ms;
  if (pet.activity.active) pet.activity.active.startedAt += ms;
  if (pet.caretaking.active) pet.caretaking.active.startedAt += ms;
  for (const order of pet.kitchen.orders) {
    if (order.endsAt) order.endsAt += ms;
  }
  save();
  broadcastState();
}
