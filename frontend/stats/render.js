// stats/render.js — Rendering (shared HTML builders live in panel.js).

import { t } from "../shared/i18n.js";
import { speciesBreed } from "../shared/names.js";
import { addonList, findSpecies } from "../items.js";
import {
  activityStatusHTML,
  addonButtonsHTML,
  careCardsHTML,
  caretakingStatusHTML,
  traitCardsHTML,
} from "../panel.js";
import { pet, runtime } from "./state.js";
import { activityView } from "./activityView.js";
import { caretakingView } from "./caretakingView.js";
import { miniCareHTML } from "./miniCareHTML.js";
import { applyStaticText } from "./applyStaticText.js";
import { resizePopover } from "./resizePopover.js";

const nameEl = document.getElementById("pet-name");

/**
 * Redraw the whole popover from pet state: header (name/breed/avatar),
 * activity + caretaking status rows, care meters (compact or full, per
 * runtime.trayCompact), coins, traits, and the pinned add-on quick-launch
 * row; then resize the window to fit.
 * Side effects: DOM writes and a popover resize.
 *
 * @returns {void}
 */
export function render() {
  applyStaticText();
  nameEl.textContent = pet.name;
  document.getElementById("breed").textContent = speciesBreed(findSpecies(pet.species));
  document.getElementById("avatar").style.backgroundImage = `url("${findSpecies(pet.species).sheet}")`;
  const av = activityView();
  const cv = caretakingView();
  let statusHTML = "";
  if (av.active) {
    statusHTML += `<div class="status-row">${activityStatusHTML(av)}
      <button id="stop-activity" title="${av.active.type === "tour" ? t("btn.callBack") : t("btn.endActivity")}" ${cv.active ? "disabled" : ""}>${av.active.type === "tour" ? "📢" : "🛑"}</button></div>`;
  }
  if (cv.active) {
    statusHTML += `<div class="status-row">${caretakingStatusHTML(cv)}
      <button id="stop-caretaking" title="${t("btn.endCaretaking")}">🛑</button></div>`;
  }
  document.getElementById("study-status").innerHTML = statusHTML;
  document.getElementById("care").innerHTML = runtime.trayCompact
    ? miniCareHTML(pet.care)
    : careCardsHTML(pet.care);
  document.getElementById("coins").textContent = `💰 ${pet.coins.toLocaleString()}`;
  document.getElementById("traits").innerHTML = traitCardsHTML(pet.traits);
  const pinned = addonList(runtime.installedAddons).filter((a) =>
    pet.pinnedAddons.includes(a.id)
  );
  document.getElementById("addons-section").hidden = pinned.length === 0;
  document.getElementById("addon-row").innerHTML = addonButtonsHTML(pinned);
  resizePopover();
}
