// panel/activityStatusHTML.js

import { t } from "../shared/i18n.js";
import { activityName, activityVerb } from "../shared/names.js";
import { formatRemaining } from "../school.js";

/**
 * Busy badge shown while the pet is in a class, job, or tour.
 *
 * @param {{active: {type: "class"|"job"|"tour", key: string, emoji: string,
 *   name: string, remainingMs: number}|null}|null|undefined} activity - The
 *   `activity` shape from the pet-state broadcast.
 * @returns {string} HTML for the `.status-badge`, or an empty string when
 *   the pet is idle.
 */
export function activityStatusHTML(activity) {
  const active = activity?.active;
  if (!active) return "";
  return `
    <div class="status-badge">
      ${t("panel.busyLine", {
        verb: activityVerb(active.type),
        emoji: active.emoji,
        name: activityName(active),
        time: formatRemaining(active.remainingMs),
      })}
    </div>`;
}
