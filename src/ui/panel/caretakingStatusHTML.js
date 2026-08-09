// panel/caretakingStatusHTML.js

import { t } from "../shared/i18n.js";
import { caretakerName } from "../shared/names.js";
import { formatRemaining } from "../school.js";

/**
 * Caretaker-on-duty badge.
 *
 * @param {{active: {key: string, emoji: string, name: string,
 *   remainingMs: number}|null}|null|undefined} caretaking - The `caretaking`
 *   shape from the pet-state broadcast.
 * @returns {string} HTML for the `.status-badge`, or an empty string when
 *   nobody is hired.
 */
export function caretakingStatusHTML(caretaking) {
  const active = caretaking?.active;
  if (!active) return "";
  return `
    <div class="status-badge">
      ${t("panel.onDuty", {
        emoji: active.emoji,
        name: caretakerName(active),
        time: formatRemaining(active.remainingMs),
      })}
    </div>`;
}
