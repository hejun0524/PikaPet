// hub/activityBusy.js — see caretakingBusy.js for the caretaking/activity
// mutual-exclusion rule these helpers implement.

import { state } from "./state.js";

/**
 * Whether a user-started activity is running or queued.
 *
 * @returns {boolean} True when an activity is active or planned.
 */
export function activityBusy() {
  return !!(state.activity.active || state.activity.plan.length);
}
