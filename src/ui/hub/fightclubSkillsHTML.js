// hub/fightclubSkillsHTML.js — Darcy's Fight Club, Skills tab: the Training
// Manual counter (+ Use button) and the full skill list with level pips.

import { t } from "../shared/i18n.js";
import { MAX_SKILL_LEVEL, SKILLS, skillName, skillDesc } from "../fightclub.js";
import { state } from "./state.js";

/**
 * The Skills tab: a manuals row (count + "Use a manual" button) and one card
 * per skill — level pips ●●○○○, greyed out while still unlearned.
 *
 * @returns {string} Page HTML for the grid.
 */
export function fightclubSkillsHTML() {
  const books = state.fightclub.books ?? 0;
  const skills = state.fightclub.skills ?? {};
  const anyOpen = SKILLS.some((s) => (skills[s.key] ?? 0) < MAX_SKILL_LEVEL);
  const note = `<div class="ach-section caretaker-title">${t("fightclub.manualsNote")}</div>`;
  const manuals = `
      <div class="item">
        <span class="qty">${books}</span>
        <span class="icon">📖</span>
        <span class="name">${t("fightclub.manualCount", { n: books })}</span>
        <span class="effects">${books < 1 ? t("fightclub.noManuals") : ""}</span>
        <span class="effects"><button id="use-manual" ${books > 0 && anyOpen ? "" : "disabled"}>${
          anyOpen ? t("fightclub.useManual") : t("fightclub.allMaxed")
        }</button></span>
      </div>`;
  const cards = SKILLS.map((skill) => {
    const lv = skills[skill.key] ?? 0;
    const pips = "●".repeat(lv) + "○".repeat(MAX_SKILL_LEVEL - lv);
    return `
      <div class="item ${lv === 0 ? "locked" : ""}">
        <span class="qty">${lv >= MAX_SKILL_LEVEL ? t("fightclub.skillMax") : `${lv}/${MAX_SKILL_LEVEL}`}</span>
        <span class="icon">${skill.emoji}</span>
        <span class="name">${skillName(skill)}</span>
        <span class="effects">${pips}</span>
        <span class="effects">${lv === 0 ? t("fightclub.skillLocked") : skillDesc(skill)}</span>
      </div>`;
  }).join("");
  return note + manuals + cards;
}
