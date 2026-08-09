// adventure/advRecruitSelectHTML.js

import { escText as esc } from "../panel.js";
import { advIdleRecruits } from "./advIdleRecruits.js";

/**
 * Render a `<select>` of all idle recruits (value = name, label with level),
 * or a "no idle recruits" note when everyone is busy.
 *
 * @param {string} id - DOM id to give the select element.
 * @returns {string} HTML for the recruit picker.
 */
export function advRecruitSelectHTML(id) {
  const idle = advIdleRecruits();
  if (!idle.length) return `<span class="adv-note">no idle recruits</span>`;
  return `<select id="${id}" class="adv-select">${idle
    .map((r) => `<option value="${esc(r.name)}">${esc(r.name)} (Lv ${r.level})</option>`)
    .join("")}</select>`;
}
