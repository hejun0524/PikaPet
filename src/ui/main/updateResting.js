// main/updateResting.js — Care meters → resting-animation flags.

import { petEl, rt, SAD_MOOD_BELOW, RESTING_ANIMS } from "./state.js";
import { setAnim } from "./setAnim.js";
import { idleAnim } from "./idleAnim.js";

/**
 * Update the sad flag from the care meters and, when the pet is currently
 * resting (not running or mid one-shot), swap the animation to match. Old
 * saves may still call mood "happiness".
 *
 * Side effects: updates `rt.isSad`, may write `petEl.dataset.anim`. Does
 * nothing in Focus Mode or while the Developer console's "pika freeze" is
 * on — the pet stays calm regardless of care values.
 *
 * @param {Object<string, number>|undefined} care - Care values (0–100) keyed
 *   by meter; missing values count as fine.
 * @returns {void}
 */
export function updateResting(care) {
  if (rt.focusMode || rt.devFreeze) return;
  const mood = care?.mood ?? care?.happiness;
  rt.isSad = typeof mood === "number" && mood < SAD_MOOD_BELOW;
  // Swap immediately unless a run animation or a one-shot is in progress.
  if (RESTING_ANIMS.has(petEl.dataset.anim)) {
    setAnim(idleAnim());
  }
}
