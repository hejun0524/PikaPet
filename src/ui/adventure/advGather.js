// adventure/advGather.js

import { adv } from "./state.js";
import { advLog } from "./advLog.js";
import { advMs } from "./advMs.js";
import { advSave } from "./advSave.js";
import { advWildOf } from "./advWildOf.js";

/**
 * Send an idle recruit gathering to a wilderness site. No-op if the site or
 * recruit is unknown, or the recruit isn't idle. Mutates the recruit
 * (status, mission), logs, and calls advSave(). Caller re-renders.
 *
 * @param {string} siteKey - Wilderness site key.
 * @param {string} recruitName - Name of the recruit to send.
 * @returns {void}
 */
export function advGather(siteKey, recruitName) {
  const site = advWildOf(siteKey);
  const recruit = adv.recruits.find((r) => r.name === recruitName);
  if (!site || !recruit || recruit.status !== "idle") return;
  recruit.status = "working";
  recruit.mission = { type: "gather", site: site.key, endsAt: Date.now() + advMs(site.minutes) };
  advLog(`${recruit.name} set out for the ${site.label}.`);
  advSave();
}
