// stats/activityView.js — State broadcast: read-only snapshot of the
// activity queue for the "pet-state" event and the popover status row.

import { pet } from "./state.js";
import { activityDef } from "./activityDef.js";

/**
 * Build a serializable view of the activity plan + the active entry with a
 * live remaining-time countdown. No side effects.
 *
 * @returns {{plan: Array<{type: string, key: string}>, active: ({type: string,
 *   key: string, name: string, emoji: string, durationMs: number,
 *   remainingMs: number}|null)}} Snapshot safe to emit across windows.
 */
export function activityView() {
  const a = pet.activity.active;
  const def = a ? activityDef(a) : null;
  return {
    plan: [...pet.activity.plan],
    active: def
      ? {
          type: a.type,
          key: a.key,
          name: def.name,
          emoji: def.emoji,
          durationMs: a.durationMs,
          remainingMs: Math.max(0, a.startedAt + a.durationMs - Date.now()),
        }
      : null,
  };
}
