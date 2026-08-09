// main/idleAnim.js — Mood → sad animation.

import { rt } from "./state.js";

/**
 * Pick the resting animation for the current mood.
 *
 * @returns {string} "sad" when the pet is sad, otherwise "idle".
 */
export function idleAnim() {
  return rt.isSad ? "sad" : "idle";
}
