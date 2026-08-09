// hub/tabSource.js

import { ui } from "./state.js";
import { HOME_TABS, ACH_TABS, PIKA_TABS, PETCENTER_TABS } from "./constants.js";
import { SHOP_CATALOG, CAREER_CATALOG, TOURING_TABS } from "../items.js";
import { ADV_TABS, advUi } from "../adventure.js";

/**
 * The tab set and active tab key for the current view.
 *
 * @returns {{source: Object[], active: string}|null} Tab definitions and the
 *   active tab key, or null for views without tabs.
 */
export function tabSource() {
  if (ui.view === "home") return { source: HOME_TABS, active: ui.homeTab };
  if (ui.view === "shopping") return { source: SHOP_CATALOG, active: ui.shopTab };
  if (ui.view === "career") return { source: CAREER_CATALOG, active: ui.careerTab };
  if (ui.view === "touring") return { source: TOURING_TABS, active: ui.touringTab };
  if (ui.view === "achievements") return { source: ACH_TABS, active: ui.achTab };
  if (ui.view === "pika") return { source: PIKA_TABS, active: ui.pikaTab };
  if (ui.view === "government") return { source: PETCENTER_TABS, active: ui.petcenterTab };
  if (ui.view === "adventure") return { source: ADV_TABS, active: advUi.tab };
  return null;
}
