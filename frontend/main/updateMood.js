// main/updateMood.js — Mood → sad animation.

import { petEl, rt, SAD_MOOD_BELOW } from "./state.js";
import { setAnim } from "./setAnim.js";
import { idleAnim } from "./idleAnim.js";

/**
 * Update the sad flag from a mood percentage and, when the pet is currently
 * resting (idle/sad), swap the animation to match.
 *
 * Side effects: updates `rt.isSad`, may write `petEl.dataset.anim`.
 *
 * @param {number|undefined} mood - Mood percentage (0–100); non-numbers count
 *   as not sad.
 * @returns {void}
 */
export function updateMood(mood) {
  rt.isSad = typeof mood === "number" && mood < SAD_MOOD_BELOW;
  // Swap immediately unless a run animation is in progress.
  if (petEl.dataset.anim === "idle" || petEl.dataset.anim === "sad") {
    setAnim(idleAnim());
  }
}
