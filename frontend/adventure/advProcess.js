// adventure/advProcess.js

import { ADV_MAX_TASKS } from "./adventureData.js";
import { adv } from "./state.js";
import { advLog } from "./advLog.js";
import { advNewTask } from "./advNewTask.js";
import { advNpcOf } from "./advNpcOf.js";
import { advResolveMission } from "./advResolveMission.js";
import { advSave } from "./advSave.js";

/**
 * Advance the simulation to now: resolve finished missions, wake recovered
 * recruits, expire unanswered notices, and repost the board up to
 * ADV_MAX_TASKS. Mutates `adv` and calls advSave() when anything changed.
 *
 * @returns {boolean} True when the save changed (caller should re-render).
 */
export function advProcess() {
  const now = Date.now();
  let changed = false;
  for (const r of adv.recruits) {
    if (r.status === "working" && r.mission && now >= r.mission.endsAt) {
      advResolveMission(r);
      changed = true;
    }
    if (r.status === "injured" && now >= r.injuredUntil) {
      r.status = "idle";
      advLog(`${r.name} has recovered and reports for duty.`);
      changed = true;
    }
  }
  const keep = [];
  for (const t of adv.tasks) {
    if (t.claimedBy || t.expiresAt > now) keep.push(t);
    else {
      advLog(`The notice from ${advNpcOf(t.npc).name} expired unanswered.`);
      changed = true;
    }
  }
  adv.tasks = keep;
  while (adv.tasks.length < ADV_MAX_TASKS) {
    advNewTask();
    changed = true;
  }
  if (changed) advSave();
  return changed;
}
