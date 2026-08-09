// stats/hideWidget.js — Add-on tray widgets: unmount one add-on's widget
// box (see widgetBox.js for the protocol overview).

import { widgetStates } from "./state.js";
import { widgetBox } from "./widgetBox.js";
import { resizePopover } from "./resizePopover.js";

/**
 * Remove an add-on's widget box (if showing), forget its last pushed state,
 * and shrink the popover back.
 * Side effects: DOM writes, mutates widgetStates, resizes the popover.
 *
 * @param {string} id - Add-on id.
 * @returns {void}
 */
export function hideWidget(id) {
  widgetBox(id)?.remove();
  widgetStates.delete(id);
  resizePopover();
}
