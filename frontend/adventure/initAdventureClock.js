// adventure/initAdventureClock.js

import { ui } from "../hub/state.js";
import { renderGrid } from "../hub/renderGrid.js";
import { advProcess } from "./advProcess.js";
import { advRemainText } from "./advRemainText.js";

/**
 * Start the adventure clock: a 1-second setInterval that runs advProcess()
 * (mutating `adv` and saving when anything resolves) and, while the
 * adventure view is showing, re-renders the grid on changes or just
 * refreshes the countdown spans. Missions resolve by timestamp, so this
 * only needs to run while the hub webview exists (backgroundThrottling is
 * disabled); closed-app time settles correctly on the next advProcess().
 * Call once from the hub master.
 *
 * @returns {void}
 */
export function initAdventureClock() {
  setInterval(() => {
    const changed = advProcess();
    if (ui.view !== "adventure") return;
    if (changed) renderGrid();
    else
      document.querySelectorAll("[data-adv-ends]").forEach((el) => {
        el.textContent = advRemainText(Number(el.dataset.advEnds));
      });
  }, 1000);
}
