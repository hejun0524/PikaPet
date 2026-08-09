// hub/caretakingStatusRowHTML.js

import { state } from "./state.js";
import { formatRemaining } from "../school.js";
import { findCaretaker } from "../items.js";

/**
 * Status row for the Caretakers page: the caretaker on duty (with time left)
 * or an idle notice, plus emoji chips for queued shifts.
 *
 * @returns {string} A .plan-row HTML block.
 */
export function caretakingStatusRowHTML() {
  const c = state.caretaking?.active;
  const current = c
    ? `<span class="plan-active">🛎️ ${c.emoji} ${c.name} on duty · ${formatRemaining(c.remainingMs)} left</span>`
    : `<span class="plan-active idle">No caretaker on duty</span>`;
  const queued = state.caretaking?.plan?.length
    ? `<span class="queued-label">⏳ Up next:</span>` +
      state.caretaking.plan
        .map((key) => `<span class="chip">${findCaretaker(key)?.emoji ?? "?"}</span>`)
        .join("")
    : "";
  return `<div class="plan-row">${current}${queued}</div>`;
}
