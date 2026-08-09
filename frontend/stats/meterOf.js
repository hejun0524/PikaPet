// stats/meterOf.js

import { pet } from "./state.js";

/**
 * Look up one of the pet's care meters by key.
 *
 * @param {string} key - Care meter key ("health", "energy", "hygiene", "mood").
 * @returns {{key: string, value: number, max: number}|undefined} The live
 *   meter object (mutating it mutates pet state), or undefined if no such meter.
 */
export function meterOf(key) {
  return pet.care.find((s) => s.key === key);
}
