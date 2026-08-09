// stats/completeActivity.js

import { pet } from "./state.js";
import { activityDef } from "./activityDef.js";
import { awardActivity } from "./awardActivity.js";
import { processPlan } from "./processPlan.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";

/**
 * Finish the active activity at full duration: award 100% of its rewards,
 * start the next plan entry, and refresh everything.
 * Side effects: mutates pet, renders, saves, broadcasts.
 *
 * @returns {void}
 */
export function completeActivity() {
  const active = pet.activity.active;
  const def = activityDef(active);
  pet.activity.active = null;
  if (def) awardActivity(active, def, 1);
  processPlan();
  render();
  save();
  broadcastState();
}
