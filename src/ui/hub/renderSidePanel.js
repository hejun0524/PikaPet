// hub/renderSidePanel.js — Side panel: avatar, status rows, care meters,
// coins, traits, footer nav, and pinned extension shortcuts.

import { getCurrentWindow } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { state, ui } from "./state.js";
import { CARE_META, TRAIT_META, extensionList } from "../items.js";
import { formInfo } from "./formInfo.js";
import {
  activityStatusHTML,
  extensionButtonsHTML,
  careCardsHTML,
  caretakingStatusHTML,
  traitCardsHTML,
} from "../panel.js";

/**
 * Render the left side panel: window title, pet name/breed/avatar, running
 * activity + caretaking status rows (with End buttons), care meters, coins,
 * traits, footer view buttons, and pinned extension shortcuts.
 *
 * Side effects: sets the window title and rewrites the #side-* DOM nodes.
 *
 * @returns {void}
 */
export function renderSidePanel() {
  getCurrentWindow().setTitle(t("hub.windowTitle", { name: state.name })).catch(() => {});
  document.getElementById("side-name").textContent = state.name;
  const form = formInfo(state.species);
  document.getElementById("side-breed").textContent = form.breed;
  document.getElementById("avatar").style.backgroundImage = `url("${form.sheet}")`;
  // Status rows with End buttons live here (and in the popover/right-click
  // menu) — not in the content pages.
  const av = state.activity;
  const cv = state.caretaking;
  let statusHTML = "";
  if (av?.active) {
    statusHTML += `<div class="status-row">${activityStatusHTML(av)}
      <button id="side-stop-activity" ${cv?.active ? "disabled" : ""}>${av.active.type === "tour" ? "📢" : "🛑"}</button></div>`;
  }
  if (cv?.active) {
    statusHTML += `<div class="status-row">${caretakingStatusHTML(cv)}
      <button id="side-stop-care">🛑</button></div>`;
  }
  document.getElementById("side-status").innerHTML = statusHTML;
  document.getElementById("side-care").innerHTML = careCardsHTML(
    CARE_META.map((m) => ({ ...m, value: state.care[m.key], max: 100 }))
  );
  document.getElementById("side-coins").textContent = `💰 ${state.coins.toLocaleString()}`;
  document.getElementById("side-traits").innerHTML = traitCardsHTML(
    TRAIT_META.map((m) => ({ ...m, value: state.traits[m.key] }))
  );
  document.querySelectorAll("#side footer button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === ui.view);
  });
  const pinned = extensionList(state.extensionsInstalled).filter((a) =>
    state.pinnedAddons.includes(a.id)
  );
  document.getElementById("side-extensions-section").hidden = pinned.length === 0;
  document.getElementById("side-extensions").innerHTML = extensionButtonsHTML(
    pinned,
    ui.view.startsWith("extension:") ? ui.view.slice("extension:".length) : null
  );
}
