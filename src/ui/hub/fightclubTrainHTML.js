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

  // Stock as item cards, like the shopping pages.
  const bookCards = BOOKS.map((book) => {
    const n = fc.books?.[book.key] ?? 0;
    return `
      <div class="item ${n > 0 ? "" : "locked"}">
        <span class="qty">×${n}</span>
        <span class="icon">${book.emoji}</span>
        <span class="name">${bookName(book)}</span>
        <span class="effects">${bookDesc(book)}</span>
        <span class="effects"><button class="fc-fight-btn" data-use-book="${book.key}" ${n > 0 && anyOpen ? "" : "disabled"}>${t("fightclub.use")}</button></span>
      </div>`;
  }).join("");

  const hpFull = petF.hp >= petF.maxHp;
  const potionCards = POTIONS.map((p) => {
    const n = fc.potions?.[p.key] ?? 0;
    return `
      <div class="item ${n > 0 ? "" : "locked"}">
        <span class="qty">×${n}</span>
        <span class="icon">${p.emoji}</span>
        <span class="name">${potionName(p)}</span>
        <span class="effects">${potionDesc(p)}</span>
        <span class="effects"><button class="fc-fight-btn" data-use-potion="${p.key}" ${n > 0 && !hpFull ? "" : "disabled"}>${t("fightclub.use")}</button></span>
      </div>`;
  }).join("");

  return (
    note +
    msg +
    `<div class="ach-section">${t("fightclub.booksSection")}</div>` +
    bookCards +
    `<div class="ach-section">${t("fightclub.healSection", { hp: petF.hp, max: petF.maxHp })}</div>` +
    potionCards
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

/** The choose-a-skill page for wild/master books (item cards, click one). */
function pickerHTML() {
  const book = findBook(ui.pickerBook);
  if (!book || !CHOICE_BOOKS.has(book.key)) return "";
  const fc = state.fightclub;
  const cards = SKILLS.filter((s) => (fc.skills?.[s.key] ?? 0) < MAX_SKILL_LEVEL)
    .map((skill) => {
      const lv = fc.skills?.[skill.key] ?? 0;
      return `
      <div class="item" data-pick-skill="${skill.key}">
        <span class="qty">${book.key === "master" ? t("fightclub.pickToMax") : t("fightclub.pickPlusOne")}</span>
        <span class="icon">${skill.emoji}</span>
        <span class="name">${skillName(skill)}</span>
        <span class="effects">${"●".repeat(lv)}${"○".repeat(MAX_SKILL_LEVEL - lv)}</span>
      </div>`;
    })
    .join("");
  return `
    <div class="ach-section caretaker-title">${t("fightclub.pickTitle", { book: bookName(book) })}</div>
    <div class="fc-head"><button id="picker-cancel">${t("fightclub.pickCancel")}</button></div>
    ${cards}`;
}
