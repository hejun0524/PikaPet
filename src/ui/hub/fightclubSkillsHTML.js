// hub/fightclubSkillsHTML.js — Darcy's Fight Club, Skills tab: the full
// 50-skill wall in an achievements-style list view — active skills, then
// passives — with level pips. Books are used in the 🏋️ Training Room tab.

import { t } from "../shared/i18n.js";
import { MAX_SKILL_LEVEL, SKILLS, skillName, skillDesc } from "../fightclub.js";
import { state } from "./state.js";

/**
 * The Skills tab: one list row per skill — emoji, name + description, an
 * Active/Passive tag and level pips ●●○○○; unlearned skills are dimmed.
 *
 * @returns {string} Page HTML for the grid.
 */
export function fightclubSkillsHTML() {
  const skills = state.fightclub.skills ?? {};
  const learned = SKILLS.filter((s) => (skills[s.key] ?? 0) > 0).length;
  const note = `<div class="ach-section caretaker-title">${t("fightclub.skillsNote", {
    learned,
    total: SKILLS.length,
  })}</div>`;
  const section = (kind) => {
    const rows = SKILLS.filter((s) => s.kind === kind)
      .map((skill) => {
        const lv = skills[skill.key] ?? 0;
        const pips = "●".repeat(lv) + "○".repeat(MAX_SKILL_LEVEL - lv);
        return `
      <div class="ach ${lv > 0 ? "earned" : ""} fc-skill">
        <span class="ach-emoji">${skill.emoji}</span>
        <span class="fc-chal-mid">
          <span class="fc-chal-name">${skillName(skill)}
            <span class="fc-lvbadge">${kind === "active" ? t("fightclub.typeActive") : t("fightclub.typePassive")}</span>
          </span>
          <span class="fc-sub">${lv === 0 ? t("fightclub.skillLocked") : skillDesc(skill)}</span>
        </span>
        <span class="fc-pips">${pips}${lv >= MAX_SKILL_LEVEL ? ` ${t("fightclub.skillMax")}` : ""}</span>
      </div>`;
      })
      .join("");
    const title = kind === "active" ? t("fightclub.activeSection") : t("fightclub.passiveSection");
    return `<div class="ach-section">${title}</div>${rows}`;
  };
  return note + `<div class="ach-list">${section("active")}${section("passive")}</div>`;
}
