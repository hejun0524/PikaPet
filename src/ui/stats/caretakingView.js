// stats/caretakingView.js — State broadcast: read-only snapshot of the
// caretaking queue for the "pet-state" event and the popover status row.

import { findCaretaker } from "../items.js";
import { pet } from "./state.js";

/**
 * Build a serializable view of the caretaker shift queue + the shift on duty
 * with a live remaining-time countdown. No side effects.
 *
 * @returns {{plan: string[], active: ({key: string, name: string,
 *   emoji: string, durationMs: number, remainingMs: number}|null)}} Snapshot
 *   safe to emit across windows.
 */
export function caretakingView() {
  const c = pet.caretaking.active;
  const def = c ? findCaretaker(c.key) : null;
  return {
    plan: [...pet.caretaking.plan],
    active: def
      ? {
          key: def.key,
          name: def.name,
          emoji: def.emoji,
          durationMs: c.durationMs,
          remainingMs: Math.max(0, c.startedAt + c.durationMs - Date.now()),
        }
      : null,
  };
}
