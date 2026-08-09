// hub/caretakingBusy.js — Caretaking and user-started activities are mutually
// exclusive: while a caretaker is on duty only the caretaker schedules
// activities, and a busy pet can't be handed to a caretaker. stats.js
// enforces the same rule on the events; these helpers (with activityBusy,
// activityLocked, hireLocked) grey out the UI paths.

import { state } from "./state.js";

/**
 * Whether a caretaker is on duty or shifts are queued.
 *
 * @returns {boolean} True when caretaking is active or planned.
 */
export function caretakingBusy() {
  return !!(state.caretaking.active || state.caretaking.plan.length);
}
