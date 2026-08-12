// main/idleAnim.js — Care flags → resting animation.

import { rt } from "./state.js";

/**
 * Pick the resting animation for the current care flags, most urgent first:
 * exhausted beats hungry beats sad beats plain idle.
 *
 * @returns {string} "sleep", "beg", "sad", or "idle".
 */
export function idleAnim() {
  if (rt.isSleepy) return "sleep";
  if (rt.isHungry) return "beg";
  if (rt.isSad) return "sad";
  return "idle";
}
