// hub/liveCaretaking.js — see liveActivity.js: same enrichment for the saved
// caretaking entry.

import { findCaretaker } from "../items.js";

/**
 * Enrich a saved caretaking entry into the live broadcast shape.
 *
 * @param {Object|null} c - Saved or broadcast caretaking entry.
 * @returns {Object|null} An entry with name/emoji/remainingMs, or null when
 *   there is none or its definition can't be found.
 */
export function liveCaretaking(c) {
  if (!c) return null;
  if (typeof c.remainingMs === "number") return c;
  const def = findCaretaker(c.key);
  if (!def) return null;
  return {
    key: c.key,
    name: def.name,
    emoji: def.emoji,
    durationMs: c.durationMs,
    remainingMs: Math.max(0, c.durationMs - (c.elapsedMs ?? 0)),
  };
}
