// hub/activityStatusRowHTML.js — Career page pieces.

import { t } from "../shared/i18n.js";
import { activityName, activityVerb } from "../shared/names.js";
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
  const current = a
    ? `<span class="plan-active">${t("status.running", {
        verb: activityVerb(a.type).split(" ")[0],
        emoji: a.emoji,
        name: activityName(a),
        time: formatRemaining(a.remainingMs),
      })}</span>`
    : isSick()
      ? `<span class="plan-active sick">${t("status.sick", { n: SICK_BELOW })}</span>`
      : `<span class="plan-active idle">${t("status.free")}</span>`;
  const queued = state.activity?.plan?.length
    ? `<span class="queued-label">${t("status.upNext")}</span>` +
      state.activity.plan
        .map((entry) => `<span class="chip">${planEntryDef(entry)?.emoji ?? "?"}</span>`)
        .join("")
    : "";
  return `<div class="plan-row">${current}${queued}</div>`;
}
