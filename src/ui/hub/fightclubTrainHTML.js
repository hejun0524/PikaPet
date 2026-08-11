// hub/fightclubTrainHTML.js — Darcy's Fight Club, Training Room tab: the
// stock of Skill Books and healing supplies (bought at Pika's Fighter's
// Corner or found by Noonie's bots), Use buttons, the result message, and
// the skill picker that choice books (wild/master) open.

import { t } from "../shared/i18n.js";
import {
  BOOKS,
  CHOICE_BOOKS,
  MAX_SKILL_LEVEL,
  POTIONS,
  SKILLS,
  findBook,
  findPotion,
  findSkill,
  bookName,
  bookDesc,
  potionName,
  potionDesc,
  skillName,
} from "../fightclub.js";
import { state, ui } from "./state.js";
import { hubPetFighter } from "./hubPetFighter.js";

/**
 * The Training Room tab (or the skill picker while a choice book waits).
 *
 * @returns {string} Page HTML for the grid.
 */
export function fightclubTrainHTML() {
  if (ui.pickerBook) return pickerHTML();
  const fc = state.fightclub;
  const petF = hubPetFighter();
  const anyOpen = SKILLS.some((s) => (fc.skills?.[s.key] ?? 0) < MAX_SKILL_LEVEL);

  const note = `<div class="ach-section caretaker-title">${t("fightclub.trainNote")}</div>`;
  const msg = ui.trainMsg ? `<div class="fc-msg">${trainMsgHTML()}</div>` : "";

  const bookRows = BOOKS.map((book) => {
    const n = fc.books?.[book.key] ?? 0;
    return `
      <div class="ach ${n > 0 ? "earned" : ""} fc-skill">
        <span class="ach-emoji">${book.emoji}</span>
        <span class="fc-chal-mid">
          <span class="fc-chal-name">${bookName(book)} <span class="fc-lvbadge">×${n}</span></span>
          <span class="fc-sub">${bookDesc(book)}</span>
        </span>
        <button class="fc-fight-btn" data-use-book="${book.key}" ${n > 0 && anyOpen ? "" : "disabled"}>${t("fightclub.use")}</button>
      </div>`;
  }).join("");

  const hpFull = petF.hp >= petF.maxHp;
  const potionRows = POTIONS.map((p) => {
    const n = fc.potions?.[p.key] ?? 0;
    return `
      <div class="ach ${n > 0 ? "earned" : ""} fc-skill">
        <span class="ach-emoji">${p.emoji}</span>
        <span class="fc-chal-mid">
          <span class="fc-chal-name">${potionName(p)} <span class="fc-lvbadge">×${n}</span></span>
          <span class="fc-sub">${potionDesc(p)}</span>
        </span>
        <button class="fc-fight-btn" data-use-potion="${p.key}" ${n > 0 && !hpFull ? "" : "disabled"}>${t("fightclub.use")}</button>
      </div>`;
  }).join("");

  return (
    note +
    msg +
    `<div class="ach-list">
      <div class="ach-section">${t("fightclub.booksSection")}</div>${bookRows}
      <div class="ach-section">${t("fightclub.healSection", { hp: petF.hp, max: petF.maxHp })}</div>${potionRows}
    </div>`
  );
}

/** The result banner for the last book/heal action. */
function trainMsgHTML() {
  const m = ui.trainMsg;
  if (m.kind === "heal") {
    const potion = findPotion(m.item);
    return t("fightclub.msgHealed", {
      item: potion ? potionName(potion) : m.item,
      hp: m.hp,
      now: m.now,
      max: m.max,
    });
  }
  return m.entries
    .map((e) => {
      const skill = findSkill(e.skill);
      const name = skill ? skillName(skill) : e.skill;
      if (e.from === 0) return t("fightclub.msgUnlocked", { skill: name, lv: e.to });
      if (e.to >= MAX_SKILL_LEVEL) return t("fightclub.msgMaxed", { skill: name });
      return t("fightclub.msgUpgraded", { skill: name, lv: e.to });
    })
    .join("<br/>");
}

/** The choose-a-skill page for wild/master books. */
function pickerHTML() {
  const book = findBook(ui.pickerBook);
  if (!book || !CHOICE_BOOKS.has(book.key)) return "";
  const fc = state.fightclub;
  const rows = SKILLS.filter((s) => (fc.skills?.[s.key] ?? 0) < MAX_SKILL_LEVEL)
    .map((skill) => {
      const lv = fc.skills?.[skill.key] ?? 0;
      return `
      <div class="ach earned fc-skill" data-pick-skill="${skill.key}">
        <span class="ach-emoji">${skill.emoji}</span>
        <span class="fc-chal-mid">
          <span class="fc-chal-name">${skillName(skill)}</span>
          <span class="fc-sub">${"●".repeat(lv)}${"○".repeat(MAX_SKILL_LEVEL - lv)}</span>
        </span>
        <span class="fc-pips">${book.key === "master" ? t("fightclub.pickToMax") : t("fightclub.pickPlusOne")}</span>
      </div>`;
    })
    .join("");
  return `
    <div class="ach-section caretaker-title">${t("fightclub.pickTitle", { book: bookName(book) })}</div>
    <div class="fc-head"><button id="picker-cancel">${t("fightclub.pickCancel")}</button></div>
    <div class="ach-list">${rows}</div>`;
}
