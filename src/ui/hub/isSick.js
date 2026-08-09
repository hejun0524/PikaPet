// hub/isSick.js

import { state } from "./state.js";
import { SICK_BELOW } from "../touring.js";

/**
 * Whether the pet is too sick for school, work, or travel.
 *
 * @returns {boolean} True when health is below SICK_BELOW.
 */
export function isSick() {
  return state.care.health < SICK_BELOW;
}
