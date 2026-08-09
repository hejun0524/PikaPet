// hub/activityStatusRowHTML.js — Career page pieces.

import { state } from "./state.js";
import { formatRemaining } from "../school.js";
import { SICK_BELOW } from "../touring.js";
import { isSick } from "./isSick.js";
import { planEntryDef } from "./planEntryDef.js";

/**
 * Status row shown at the top of career/touring pages: the running activity
 * (or sick / idle notice) plus emoji chips for queued plan entries.
 *
 * @returns {string} A .plan-row HTML block.
 */
export function activityStatusRowHTML() {
  const a = state.activity?.active;
  const verb = a ? (a.type === "job" ? "💼" : a.type === "tour" ? "🧳" : "📚") : "";
  const current = a
    ? `<span class="plan-active">${verb} ${a.emoji} ${a.name} · ${formatRemaining(a.remainingMs)} left</span>`
    : isSick()
      ? `<span class="plan-active sick">🤒 Health below ${SICK_BELOW} — no school, work, or travel</span>`
      : `<span class="plan-active idle">Free now</span>`;
  const queued = state.activity?.plan?.length
    ? `<span class="queued-label">⏳ Up next:</span>` +
      state.activity.plan
        .map((entry) => `<span class="chip">${planEntryDef(entry)?.emoji ?? "?"}</span>`)
        .join("")
    : "";
  return `<div class="plan-row">${current}${queued}</div>`;
}
