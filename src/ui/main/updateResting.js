// main/updateResting.js — Care meters → resting-animation flags.

import {
  petEl,
  rt,
  SAD_MOOD_BELOW,
  BEG_ENERGY_BELOW,
  SLEEP_ENERGY_BELOW,
  RESTING_ANIMS,
} from "./state.js";
import { setAnim } from "./setAnim.js";
import { idleAnim } from "./idleAnim.js";

/**
 * Update the sad/hungry/sleepy flags from the care meters and, when the pet
 * is currently resting (not running or mid one-shot), swap the animation to
 * match. Old saves may still call mood "happiness" and energy "fullness".
 *
 * Side effects: updates `rt.isSad`/`rt.isHungry`/`rt.isSleepy`, may write
 * `petEl.dataset.anim`.
 *
 * @param {Object<string, number>|undefined} care - Care values (0–100) keyed
 *   by meter; missing values count as fine.
 * @returns {void}
 */
export function updateResting(care) {
  const mood = care?.mood ?? care?.happiness;
  const energy = care?.energy ?? care?.fullness;
  rt.isSad = typeof mood === "number" && mood < SAD_MOOD_BELOW;
  rt.isHungry = typeof energy === "number" && energy < BEG_ENERGY_BELOW;
  rt.isSleepy = typeof energy === "number" && energy < SLEEP_ENERGY_BELOW;
  // Swap immediately unless a run animation or a one-shot is in progress.
  if (RESTING_ANIMS.has(petEl.dataset.anim)) {
    setAnim(idleAnim());
  }
}
