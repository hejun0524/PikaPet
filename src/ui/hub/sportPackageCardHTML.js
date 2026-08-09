// hub/sportPackageCardHTML.js

import { t } from "../shared/i18n.js";
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
      <span class="name">${stopCount > 1 ? t("tour.sportName", { n: stopCount }) : t("tour.sportNameOne")}</span>
      <span class="effects">${t("tour.sportLine", { m: def.minutes })}</span>
      <span class="effects">${t("tour.sportSouvenir")}</span>
    </div>`;
}
