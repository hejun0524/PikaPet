// stats/canPayDrain.js

import { meterOf } from "./meterOf.js";

/**
 * Check whether the pet's care meters can cover an activity's up-front care
 * drain (every drained meter must hold at least the drained amount). No side
 * effects.
 *
 * @param {Object<string, number>} drain - Care-meter drain map (stat -> amount).
 * @returns {boolean} True if every drain is payable.
 */
export function canPayDrain(drain) {
  return Object.entries(drain).every(([stat, amount]) => {
    const meter = meterOf(stat);
    return meter && meter.value >= amount;
  });
}
