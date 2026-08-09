// hub/unlockCtx.js

import { state } from "./state.js";

/**
 * Build the unlock-check context passed to helpers like isJobUnlocked.
 *
 * @returns {{xp: Object, traits: Object, subjects: Object}} The pet's career
 *   XP map, trait values, and school subject progress.
 */
export function unlockCtx() {
  return { xp: state.career.xp, traits: state.traits, subjects: state.school.subjects };
}
