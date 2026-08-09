// panel/caretakingStatusHTML.js

import { formatRemaining } from "../school.js";

/**
 * Caretaker-on-duty badge.
 *
 * @param {{active: {emoji: string, name: string, remainingMs: number}|null}
 *   |null|undefined} caretaking - The `caretaking` shape from the pet-state
 *   broadcast.
 * @returns {string} HTML for the `.status-badge`, or an empty string when
 *   nobody is hired.
 */
export function caretakingStatusHTML(caretaking) {
  const active = caretaking?.active;
  if (!active) return "";
  return `
    <div class="status-badge">
      🛎️ ${active.emoji} ${active.name} on duty · ${formatRemaining(active.remainingMs)} left
    </div>`;
}
