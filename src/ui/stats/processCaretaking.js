// stats/processCaretaking.js — Caretaking: hired shifts run on their own
// 4-hour clock.

import { CARETAKER_MINUTES, findCaretaker } from "../items.js";
import { schoolMinuteMs } from "../school.js";
import { pet } from "./state.js";

/**
 * If no caretaker is on duty, pop the next queued shift and start it:
 * charge its price and set pet.caretaking.active with timing. An unknown or
 * unaffordable shift cancels the whole queue.
 * Side effects: mutates pet (caretaking plan/active, coins). Does not save
 * or broadcast — callers do.
 *
 * @returns {void}
 */
export function processCaretaking() {
  if (pet.caretaking.active || pet.caretaking.plan.length === 0) return;
  const def = findCaretaker(pet.caretaking.plan[0]);
  if (!def || pet.coins < def.price) {
    pet.caretaking.plan = [];
    return;
  }
  pet.caretaking.plan.shift();
  pet.coins -= def.price;
  pet.caretaking.active = {
    key: def.key,
    durationMs: CARETAKER_MINUTES * schoolMinuteMs(pet.settings.devMode),
    startedAt: Date.now(),
  };
}
