// stats/autoShowWidgets.js — Extension tray widgets: extensions whose manifest
// says `"widgetAuto": true` (e.g. Caffeine) hang their widget box below the
// popover as soon as they're installed — no widget-set call needed.

import { runtime } from "./state.js";
import { showWidget } from "./showWidget.js";

/**
 * Mount the tray widget of every installed extension that declares widgetAuto.
 * Call after each extension rescan; already-showing widgets are left alone.
 * Side effects: DOM writes (#widgets) and a popover resize via showWidget.
 *
 * @returns {void}
 */
export function autoShowWidgets() {
  for (const extension of runtime.installedExtensions) {
    if (extension.widgetAuto && extension.widget) showWidget(extension.id);
  }
}
