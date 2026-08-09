// hub/classCardHTML.js

import { state } from "./state.js";
import { findSubject, isClassUnlocked, classUnlockText } from "../school.js";
import { STAT_EMOJI } from "../items.js";
import { activityLocked } from "./activityLocked.js";
import { drainText } from "./drainText.js";

/**
 * Card HTML for a school class: a locked card with the unlock requirement, or
 * a stageable card (click to add to the plan book).
 *
 * @param {Object} cls - Class definition from CLASS_CATALOG.
 * @returns {string} Card HTML with a data-plan-class hook when unlocked.
 */
export function classCardHTML(cls) {
  const subject = findSubject(cls.subject);
  if (!isClassUnlocked(cls, state.school.subjects)) {
    return `
    <div class="item locked">
      <span class="qty lock">🔒</span>
      <span class="icon">${cls.emoji}</span>
      <span class="name">${cls.name}</span>
      <span class="effects">${subject.emoji} ${subject.label}</span>
      <span class="effects">${classUnlockText(cls)}</span>
    </div>`;
  }
  const rewards = Object.entries(cls.rewards)
    .map(([stat, amount]) => `+${amount} ${STAT_EMOJI[stat]}`)
    .join(" ");
  return `
    <div class="item ${activityLocked()}" data-plan-class="${cls.key}">
      <span class="qty price">💰${cls.cost}</span>
      <span class="icon">${cls.emoji}</span>
      <span class="name">${cls.name}</span>
      <span class="effects">${subject.emoji} ${subject.label} · ⏱ ${cls.minutes}m</span>
      <span class="effects">+${cls.credits} credits · ${rewards}</span>
      <span class="effects">${drainText(cls.drain)}</span>
    </div>`;
}
