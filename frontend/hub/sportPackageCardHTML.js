// hub/sportPackageCardHTML.js

import { findTour } from "../touring.js";
import { activityLocked } from "./activityLocked.js";

/**
 * Card HTML for a sports-touring mystery package (click to start/queue).
 *
 * @param {number} stopCount - Number of random stops in the package.
 * @returns {string} Card HTML with a data-tour hook.
 */
export function sportPackageCardHTML(stopCount) {
  const def = findTour(`sport-any-${stopCount}`);
  return `
    <div class="item ${activityLocked()}" data-tour="${def.key}">
      <span class="qty price">💰${def.cost}</span>
      <span class="icon">🎟️</span>
      <span class="name">${stopCount} ${stopCount > 1 ? "Stops" : "Stop"} Mystery Sports Tour</span>
      <span class="effects">⏱ ${def.minutes}m · random teams, any league</span>
      <span class="effects">🎁 1 souvenir per stop</span>
    </div>`;
}
