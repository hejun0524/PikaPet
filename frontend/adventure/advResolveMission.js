// adventure/advResolveMission.js

import { ADV_MATERIALS, ADV_TRINKETS } from "./adventureData.js";
import { adv } from "./state.js";
import { advGatherChance } from "./advGatherChance.js";
import { advGrantXp } from "./advGrantXp.js";
import { advLog } from "./advLog.js";
import { advMs } from "./advMs.js";
import { advNpcOf } from "./advNpcOf.js";
import { advWantLabel } from "./advWantLabel.js";
import { advWildOf } from "./advWildOf.js";

/**
 * Resolve a recruit's finished mission. Gathering rolls success (materials +
 * XP) or injury; delivery pays out the task's tokens/trinket and records the
 * NPC acquaintance, or returns the goods home if the notice expired. Mutates
 * the recruit, `adv` (materials/tokens/tasks/trinkets/met), grants XP, and
 * logs via advLog(); does not save (advProcess batches the save).
 *
 * @param {object} recruit - The recruit whose mission just ended (status
 *   "working" with `mission.endsAt` in the past).
 * @returns {void}
 */
export function advResolveMission(recruit) {
  const m = recruit.mission;
  recruit.mission = null;
  recruit.status = "idle";

  if (m.type === "gather") {
    const site = advWildOf(m.site);
    if (Math.random() < advGatherChance(recruit.level, site.difficulty)) {
      const got = [];
      site.yields.forEach((y, i) => {
        let qty = y.min + Math.floor(Math.random() * (y.max - y.min + 1));
        if (i === 0) qty += Math.floor(recruit.level / 3);
        if (qty > 0) {
          adv.materials[y.key] = (adv.materials[y.key] ?? 0) + qty;
          got.push(`${qty} ${ADV_MATERIALS[y.key].label.toLowerCase()}`);
        }
      });
      advGrantXp(recruit, 6 + 4 * site.difficulty);
      advLog(`${recruit.name} returned from the ${site.label} with ${got.join(" and ") || "empty hands"}.`);
    } else {
      recruit.status = "injured";
      recruit.injuredUntil = Date.now() + advMs(20 * site.difficulty);
      advGrantXp(recruit, 2);
      advLog(`${recruit.name} was hurt in the ${site.label} and needs rest.`);
    }
    return;
  }

  // Delivery: the dispatch check guarantees on-time arrival, but guard anyway
  // (a devMode flip mid-flight can bend the clock).
  const task = adv.tasks.find((t) => t.id === m.taskId);
  const npcName = advNpcOf(m.npc).name;
  if (task && m.endsAt <= task.expiresAt) {
    adv.tasks = adv.tasks.filter((t) => t !== task);
    adv.tokens += task.tokens;
    adv.completed++;
    adv.met[m.npc] = (adv.met[m.npc] ?? 0) + 1; // an acquaintance now
    if (adv.met[m.npc] === 1) advLog(`${npcName} will remember the guild's help.`);
    let extra = "";
    if (task.trinket) {
      adv.trinkets[task.trinket] = (adv.trinkets[task.trinket] ?? 0) + 1;
      extra = ` and a ${ADV_TRINKETS[task.trinket].label.toLowerCase()}`;
    }
    advGrantXp(recruit, 8);
    advLog(`${recruit.name} delivered ${advWantLabel(m.cargo).toLowerCase()} to ${npcName} — ${task.tokens} tokens${extra} earned.`);
  } else {
    const pool = m.cargo.kind === "good" ? adv.goods : adv.materials;
    pool[m.cargo.key] = (pool[m.cargo.key] ?? 0) + m.cargo.qty;
    if (task) adv.tasks = adv.tasks.filter((t) => t !== task);
    advGrantXp(recruit, 2);
    advLog(`${recruit.name} arrived too late — ${npcName} had moved on. The goods came home.`);
  }
}
