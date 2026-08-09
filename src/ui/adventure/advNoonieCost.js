// adventure/advNoonieCost.js

import { appSettings } from "../hub/state.js";
import { ADV_NOONIE_PER_MIN } from "./adventureData.js";

/**
 * Price of Noonie's instant heal for an injured recruit: per remaining
 * adventure minute of bed rest, with a 5-token minimum. devMode rescales
 * real time back to adventure minutes.
 *
 * @param {object} recruit - The injured recruit (uses `injuredUntil`).
 * @returns {number} Heal cost in tokens (>= 5).
 */
export function advNoonieCost(recruit) {
  const remainMin = Math.max(0, recruit.injuredUntil - Date.now()) / 60000 / (appSettings.devMode ? 1 / 60 : 1);
  return Math.max(5, Math.ceil(remainMin * ADV_NOONIE_PER_MIN));
}
