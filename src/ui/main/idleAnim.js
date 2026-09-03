// main/idleAnim.js — Care flags → resting animation.

import { rt } from "./state.js";

/**
 * Pick the resting animation for the current care flags.
 *
 * @returns {string} "sad" or "idle".
 */
export function idleAnim() {
  if (rt.isSad) return "sad";
  return "idle";
}
