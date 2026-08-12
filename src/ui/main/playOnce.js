// main/playOnce.js — One-shot animations (wave, pounce, shy, idle variants).

import { petEl, trip, rt } from "./state.js";
import { setAnim } from "./setAnim.js";
import { idleAnim } from "./idleAnim.js";

/**
 * Play an animation for a fixed time, then fall back to the resting
 * animation. Refused while the pet is away, travel-animating, or being
 * dragged (a run animation is showing) — reactions never interrupt movement.
 * A newer one-shot replaces a running one.
 *
 * Side effects: writes `petEl.dataset.anim`, replaces `rt.oneShotTimer`.
 *
 * @param {string} name - Animation name ("wave", "pounce", "shy",
 *   "look-right", "look-left", "think", "sleep").
 * @param {number} [ms=2500] - How long the animation plays, in ms.
 * @returns {void}
 */
export function playOnce(name, ms = 2500) {
  if (trip.away || rt.animating) return;
  const current = petEl.dataset.anim;
  if (current === "run-right" || current === "run-left") return;
  clearTimeout(rt.oneShotTimer);
  setAnim(name);
  rt.oneShotTimer = setTimeout(() => {
    // Only revert if nothing else (a drag, a resting swap) took over since.
    if (petEl.dataset.anim === name) setAnim(idleAnim());
  }, ms);
}
