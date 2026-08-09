// adventure/advGuildHTML.js

import { escText as esc } from "../panel.js";
import { adv } from "./state.js";
import { advTaskCardHTML } from "./advTaskCardHTML.js";

/**
 * Render the Guild tab body: the notice board (all open tasks as cards) and
 * the last 8 chronicle lines, newest first.
 *
 * @param {string} petName - The pet's name (titles the chronicle).
 * @returns {string} HTML for the Guild tab.
 */
export function advGuildHTML(petName) {
  return `
    <div class="adv-section">Notice board</div>
    <div class="adv-note">Folk across the eras post requests here. Gather what they need in the wilderness (World tab), or deliver from the storehouse — Darcy can find whoever posted the notice. Recruits are hired and tended on Noonie's tab.</div>
    <div class="adv-cards adv-tasks">${adv.tasks.map(advTaskCardHTML).join("")}</div>

    <div class="adv-section">Chronicle of ${esc(petName)}'s guild</div>
    <div class="adv-log">${adv.log
      .slice(-8)
      .reverse()
      .map((l) => `<div class="adv-log-line">${esc(l.text)}</div>`)
      .join("")}</div>`;
}
