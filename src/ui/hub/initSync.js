// hub/initSync.js — State sync: live "pet-state" broadcasts from the stats
// window, "hub-view" requests from the popover / pet context menu, and a
// focus re-sync because WebKit may suspend this webview while it's hidden,
// losing pet-state broadcasts.

import { invoke, listen } from "../shared/tauri.js";
import { ui } from "./state.js";
import { applyState } from "./applyState.js";
import { renderSidePanel } from "./renderSidePanel.js";
import { renderGrid } from "./renderGrid.js";
import { refreshGovApply } from "./refreshGovApply.js";
import { refreshBankNumbers } from "./refreshBankNumbers.js";
import { setView } from "./setView.js";

/**
 * Wire the state-sync listeners: apply "pet-state" broadcasts (re-rendering
 * everything except form views under the user's cursor/keyboard), switch
 * views on "hub-view", and re-sync from the save file on window focus.
 *
 * Side effects: registers two Tauri event listeners and a window "focus"
 * listener; each mutates `state` via applyState and re-renders.
 *
 * @returns {void}
 */
export function initSync() {
  listen("pet-state", ({ payload }) => {
    applyState(payload);
    renderSidePanel();
    // Don't re-render form views under the user's cursor/keyboard, or a
    // fight replay mid-animation (fightReplay.js patches that DOM itself).
    const isForm =
      ui.view === "settings" ||
      ui.view.startsWith("extension:") ||
      (ui.view === "fightclub" && ui.fightclubTab === "club" && ui.battle && !ui.battle.done) ||
      (ui.view === "government" && (ui.petcenterTab === "registry" || ui.petcenterTab === "bank"));
    if (!isForm) renderGrid();
    else if (ui.view === "government" && ui.petcenterTab === "registry") refreshGovApply();
    else if (ui.view === "government" && ui.petcenterTab === "bank") refreshBankNumbers();
  });

  // The popover / pet context menu pick which view to open.
  listen("hub-view", ({ payload }) => setView(payload.view));

  // WebKit may suspend this webview while it's hidden, losing pet-state
  // broadcasts. Re-sync from the save file whenever the window comes back.
  window.addEventListener("focus", async () => {
    try {
      const raw = await invoke("load_state");
      if (raw) applyState(JSON.parse(raw));
    } catch (e) {
      console.error("focus refresh failed:", e);
    }
    renderSidePanel();
    const replaying = ui.view === "fightclub" && ui.battle && !ui.battle.done;
    if (ui.view !== "settings" && ui.view !== "government" && !replaying) renderGrid();
  });
}
