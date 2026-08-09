// stats/endCaretaking.js

import { findCaretaker } from "../items.js";
import { pet } from "./state.js";
import { endCurrentActivity } from "./endCurrentActivity.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";

/**
 * Dismiss the caretaker on duty: refund the unused share of their price,
 * cancel queued shifts, and end whatever activity they had the pet doing.
 * Side effects: mutates pet, renders, saves, broadcasts.
 *
 * @returns {void}
 */
export function endCaretaking() {
  const active = pet.caretaking.active;
  if (!active) return;
  const def = findCaretaker(active.key);
  const fraction = Math.min(1, (Date.now() - active.startedAt) / active.durationMs);
  pet.caretaking.active = null;
  pet.caretaking.plan = []; // ending the service cancels queued shifts too
  if (def) pet.coins += Math.round(def.price * (1 - fraction));
  // Dismissing the caretaker also ends whatever they had the pet doing —
  // otherwise a class/job they scheduled keeps running unattended.
  endCurrentActivity();
  render();
  save();
  broadcastState();
}
