// stats/autoShowWidgets.js — Add-on tray widgets: add-ons whose manifest
// says `"widgetAuto": true` (e.g. Caffeine) hang their widget box below the
// popover as soon as they're installed — no widget-set call needed.

import { runtime } from "./state.js";
import { showWidget } from "./showWidget.js";

/**
 * Mount the tray widget of every installed add-on that declares widgetAuto.
 * Call after each add-on rescan; already-showing widgets are left alone.
 * Side effects: DOM writes (#widgets) and a popover resize via showWidget.
 *
 * @returns {void}
 */
export function autoShowWidgets() {
  for (const addon of runtime.installedAddons) {
    if (addon.widgetAuto && addon.widget) showWidget(addon.id);
  }
}
