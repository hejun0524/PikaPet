// hub/caretakingStatusRowHTML.js

import { t } from "../shared/i18n.js";
import { caretakerName } from "../shared/names.js";
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
    ? `<span class="plan-active">${t("panel.onDuty", {
        emoji: c.emoji,
        name: caretakerName(c),
        time: formatRemaining(c.remainingMs),
      })}</span>`
    : `<span class="plan-active idle">${t("status.noCaretaker")}</span>`;
  const queued = state.caretaking?.plan?.length
    ? `<span class="queued-label">${t("status.upNext")}</span>` +
      state.caretaking.plan
        .map((key) => `<span class="chip">${findCaretaker(key)?.emoji ?? "?"}</span>`)
        .join("")
    : "";
  return `<div class="plan-row">${current}${queued}</div>`;
}
