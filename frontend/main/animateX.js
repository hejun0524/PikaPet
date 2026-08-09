// main/animateX.js — Trip travel animation.

import { PhysicalPosition } from "../shared/tauri.js";
import { appWindow, TRAVEL_STEP_PX } from "./state.js";

/**
 * Slide the pet window horizontally from one x to another at a fixed y,
 * TRAVEL_STEP_PX per 16ms frame.
 *
 * Side effects: repeatedly moves the window.
 *
 * @param {number} fromX - Starting x, physical pixels.
 * @param {number} y - Fixed y during the slide, physical pixels.
 * @param {number} targetX - Destination x, physical pixels.
 * @returns {Promise<void>} Resolves when the window reaches targetX.
 */
export function animateX(fromX, y, targetX) {
  return new Promise((resolve) => {
    const dir = targetX > fromX ? 1 : -1;
    let x = fromX;
    const timer = setInterval(() => {
      x += dir * TRAVEL_STEP_PX;
      const done = dir === 1 ? x >= targetX : x <= targetX;
      appWindow.setPosition(new PhysicalPosition(done ? targetX : x, y));
      if (done) {
        clearInterval(timer);
        resolve();
      }
    }, 16);
  });
}
