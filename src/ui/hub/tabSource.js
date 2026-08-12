// hub/tabSource.js

import { ui } from "./state.js";
import {
  HOME_TABS,
  ACH_TABS,
  EXTENSIONS_TABS,
  PIKA_TABS,
  PETCENTER_TABS,
  KITCHEN_TABS,
  FIGHTCLUB_TABS,
} from "./constants.js";
import { SHOP_CATALOG, CAREER_CATALOG, TOURING_TABS } from "../items.js";

/**
 * The tab set and active tab key for the current view. `prefix` is the
 * locale-key prefix its labels translate under (tOr(prefix + key, label)).
 *
 * @returns {{source: Object[], active: string, prefix: string|null}|null}
 *   Tab definitions, the active tab key, and the locale prefix, or null for
 *   views without tabs.
 */
export function tabSource() {
  if (ui.view === "home") return { source: HOME_TABS, active: ui.homeTab, prefix: "hometab." };
  if (ui.view === "shopping") return { source: SHOP_CATALOG, active: ui.shopTab, prefix: "shoptab." };
  if (ui.view === "career") return { source: CAREER_CATALOG, active: ui.careerTab, prefix: "careertab." };
  if (ui.view === "touring") return { source: TOURING_TABS, active: ui.touringTab, prefix: "tourtab." };
  if (ui.view === "achievements") return { source: ACH_TABS, active: ui.achTab, prefix: "achtab." };
  if (ui.view === "pika") return { source: PIKA_TABS, active: ui.pikaTab, prefix: "pikatab." };
  if (ui.view === "government") return { source: PETCENTER_TABS, active: ui.petcenterTab, prefix: "pctab." };
  if (ui.view === "kitchen") return { source: KITCHEN_TABS, active: ui.kitchenTab, prefix: "kitchentab." };
  if (ui.view === "fightclub") return { source: FIGHTCLUB_TABS, active: ui.fightclubTab, prefix: "fightclubtab." };
  if (ui.view === "addons") return { source: EXTENSIONS_TABS, active: ui.extensionsTab, prefix: "addonstab." };
  return null;
}
