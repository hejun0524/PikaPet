// hub/renderAll.js

import { applyStaticText } from "./applyStaticText.js";
import { renderSidePanel } from "./renderSidePanel.js";
import { renderTopbar } from "./renderTopbar.js";
import { renderTabs } from "./renderTabs.js";
import { renderGrid } from "./renderGrid.js";

/**
 * Full repaint: side panel, top bar, the tab strip, and the grid (basket
 * pages render as part of the grid — see BASKET_VIEWS in hub/constants.js).
 *
 * Side effects: all the DOM writes of the individual render functions.
 *
 * @returns {void}
 */
export function renderAll() {
  applyStaticText();
  renderSidePanel();
  renderTopbar();
  renderTabs();
  renderGrid();
}
