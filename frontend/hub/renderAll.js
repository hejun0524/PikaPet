// hub/renderAll.js

import { renderSidePanel } from "./renderSidePanel.js";
import { renderTopbar } from "./renderTopbar.js";
import { renderCartDrawer } from "./renderCartDrawer.js";
import { renderPlanDrawer } from "./renderPlanDrawer.js";
import { renderTradeDrawer } from "./renderTradeDrawer.js";
import { renderServiceDrawer } from "./renderServiceDrawer.js";
import { renderAddonDrawer } from "./renderAddonDrawer.js";
import { renderTabs } from "./renderTabs.js";
import { renderGrid } from "./renderGrid.js";

/**
 * Full repaint: side panel, top bar, every drawer, the tab strip, and the
 * grid.
 *
 * Side effects: all the DOM writes of the individual render functions.
 *
 * @returns {void}
 */
export function renderAll() {
  renderSidePanel();
  renderTopbar();
  renderCartDrawer();
  renderPlanDrawer();
  renderTradeDrawer();
  renderServiceDrawer();
  renderAddonDrawer();
  renderTabs();
  renderGrid();
}
