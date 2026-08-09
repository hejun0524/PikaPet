// adventure/advDeliver.js

import { ADV_DARCY_EXPRESS } from "./adventureData.js";
import { adv } from "./state.js";
import { advCityOf } from "./advCityOf.js";
import { advEraOf } from "./advEraOf.js";
import { advHave } from "./advHave.js";
import { advLocated } from "./advLocated.js";
import { advLog } from "./advLog.js";
import { advMs } from "./advMs.js";
import { advSave } from "./advSave.js";
import { advTravelMinutes } from "./advTravelMinutes.js";
import { advWantLabel } from "./advWantLabel.js";

/**
 * Dispatch an idle recruit to deliver a task's cargo to its NPC, optionally
 * aboard the Darcy Express (half travel time, for a fee). No-op unless the
 * task is unclaimed, the recruit idle, the NPC freshly located, the
 * storehouse stocked, and arrival beats the notice's expiry. Removes the
 * cargo from the storehouse, claims the task, starts the mission, logs, and
 * calls advSave() (mutates `adv` and the recruit). Caller re-renders.
 *
 * @param {string} taskId - Id of the notice to answer.
 * @param {string} recruitName - Name of the recruit to send.
 * @param {boolean} express - True to pay for the Darcy Express.
 * @returns {void}
 */
export function advDeliver(taskId, recruitName, express) {
  const task = adv.tasks.find((t) => t.id === taskId);
  const recruit = adv.recruits.find((r) => r.name === recruitName);
  if (!task || task.claimedBy || !recruit || recruit.status !== "idle") return;
  const loc = advLocated(task.npc);
  if (!loc || advHave(task.wants) < task.wants.qty) return;
  if (express && adv.tokens < ADV_DARCY_EXPRESS) return;

  let minutes = advTravelMinutes(loc.era, loc.city);
  if (express) minutes = Math.ceil(minutes / 2);
  const endsAt = Date.now() + advMs(minutes);
  if (endsAt > task.expiresAt) return; // would arrive after the notice expires

  if (express) adv.tokens -= ADV_DARCY_EXPRESS;
  const pool = task.wants.kind === "good" ? adv.goods : adv.materials;
  pool[task.wants.key] -= task.wants.qty;
  task.claimedBy = recruit.name;
  recruit.status = "working";
  recruit.mission = {
    type: "deliver", taskId: task.id, npc: task.npc, era: loc.era, city: loc.city,
    endsAt, cargo: { ...task.wants },
  };
  advLog(
    `${recruit.name} left for ${advCityOf(loc.city).label} (${advEraOf(loc.era).label} Era)` +
      `${express ? " aboard the Darcy Express" : ""} with ${advWantLabel(task.wants).toLowerCase()}.`
  );
  advSave();
}
