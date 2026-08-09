// hub/activityLocked.js — Card class for anything that starts a user activity
// (classes, jobs, tours, tickets): blocked while sick or while a caretaker
// runs the schedule.

import { isSick } from "./isSick.js";
import { caretakingBusy } from "./caretakingBusy.js";

/**
 * CSS class for cards that would start a user activity.
 *
 * @returns {string} "disabled" when starting is blocked, otherwise "".
 */
export function activityLocked() {
  return isSick() || caretakingBusy() ? "disabled" : "";
}
