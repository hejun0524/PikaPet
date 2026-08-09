// hub/tourPackageCardHTML.js — Touring pages.

import { t } from "../shared/i18n.js";
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
      <span class="name">${cityCount > 1 ? t("tour.pkgName", { n: cityCount }) : t("tour.pkgNameOne")}</span>
      <span class="effects">${t("tour.pkgLine", { m: def.minutes })}</span>
      <span class="effects">${t("tour.pkgSouvenir")}</span>
    </div>`;
}
