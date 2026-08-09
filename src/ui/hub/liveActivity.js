// hub/liveActivity.js — State sync: the save file stores active entries as
// {key, durationMs, elapsedMs}, without the name/emoji/remainingMs of the
// live pet-state broadcast. Re-syncing from disk (boot, window focus) must
// enrich them, or the side panel briefly shows "undefined undefined on duty"
// until the next broadcast arrives.

import { findJob } from "../career.js";
import { findTour } from "../touring.js";
import { findClass } from "../school.js";

/**
 * Enrich a saved activity entry into the live broadcast shape.
 *
 * @param {Object|null} a - Saved or broadcast activity entry.
 * @returns {Object|null} An entry with name/emoji/remainingMs, or null when
 *   there is none or its definition can't be found.
 */
export function liveActivity(a) {
  if (!a) return null;
  if (typeof a.remainingMs === "number") return a; // already the broadcast shape
  const def = a.type === "job" ? findJob(a.key) : a.type === "tour" ? findTour(a.key) : findClass(a.key);
  if (!def) return null;
  return {
    type: a.type,
    key: a.key,
    name: def.name,
    emoji: def.emoji,
    durationMs: a.durationMs,
    remainingMs: Math.max(0, a.durationMs - (a.elapsedMs ?? 0)),
  };
}
