// panel/activityStatusHTML.js

import { formatRemaining } from "../school.js";

/**
 * Busy badge shown while the pet is in a class, job, or tour.
 *
 * @param {{active: {type: "class"|"job"|"tour", emoji: string, name: string,
 *   remainingMs: number}|null}|null|undefined} activity - The `activity`
 *   shape from the pet-state broadcast.
 * @returns {string} HTML for the `.status-badge`, or an empty string when
 *   the pet is idle.
 */
export function activityStatusHTML(activity) {
  const active = activity?.active;
  if (!active) return "";
  const verb =
    active.type === "job" ? "💼 Working" : active.type === "tour" ? "🧳 Touring" : "📚 Studying";
  return `
    <div class="status-badge">
      ${verb}: ${active.emoji} ${active.name} · ${formatRemaining(active.remainingMs)} left
    </div>`;
}
