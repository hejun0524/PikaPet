// hub/tourPackageCardHTML.js — Touring pages.

import { findTour } from "../touring.js";
import { activityLocked } from "./activityLocked.js";

/**
 * Card HTML for a world-touring mystery package (click to start/queue).
 *
 * @param {number} cityCount - Number of random cities in the package.
 * @returns {string} Card HTML with a data-tour hook.
 */
export function tourPackageCardHTML(cityCount) {
  const def = findTour(`tour-any-${cityCount}`);
  return `
    <div class="item ${activityLocked()}" data-tour="${def.key}">
      <span class="qty price">💰${def.cost}</span>
      <span class="icon">🧳</span>
      <span class="name">${cityCount} ${cityCount > 1 ? "Cities" : "City"} Mystery Package</span>
      <span class="effects">⏱ ${def.minutes}m · random cities worldwide</span>
      <span class="effects">🎁 1 souvenir per city</span>
    </div>`;
}
