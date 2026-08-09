// hub/hireLocked.js — Hiring is blocked by a user-started activity; while a
// caretaker is on duty the running activity is the caretaker's own, and
// queueing more shifts is fine.

import { activityBusy } from "./activityBusy.js";
import { caretakingBusy } from "./caretakingBusy.js";

/**
 * Whether hiring caretakers is currently blocked.
 *
 * @returns {boolean} True when a user-started activity blocks hiring.
 */
export function hireLocked() {
  return activityBusy() && !caretakingBusy();
}
