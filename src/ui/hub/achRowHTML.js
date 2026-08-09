// hub/achRowHTML.js — Achievements page: the full wall of everything earnable.

import { escText as esc } from "../panel.js";

/**
 * One row of the achievement wall.
 *
 * @param {string} emoji - Achievement emoji.
 * @param {string} label - Achievement label text.
 * @param {{date: string}|undefined} earned - The earned record (with its
 *   date), or undefined when not yet earned.
 * @returns {string} Row HTML.
 */
export function achRowHTML(emoji, label, earned) {
  return `
    <div class="ach ${earned ? "earned" : ""}">
      <span class="ach-emoji">${emoji}</span>
      <span class="ach-label">${esc(label)}</span>
      <span class="ach-date">${earned ? `✅ ${esc(earned.date)}` : "—"}</span>
    </div>`;
}
