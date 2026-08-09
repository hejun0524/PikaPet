// main/setAnim.js

import { petEl } from "./state.js";

/**
 * Switch the sprite animation by setting the pet element's `data-anim`
 * attribute (a no-op when the animation is already active).
 *
 * Side effects: writes `petEl.dataset.anim`.
 *
 * @param {string} name - Animation name ("idle", "sad", "run-left", "run-right").
 * @returns {void}
 */
export function setAnim(name) {
  if (petEl.dataset.anim !== name) {
    petEl.dataset.anim = name;
  }
}
