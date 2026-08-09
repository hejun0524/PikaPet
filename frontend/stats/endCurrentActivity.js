// stats/endCurrentActivity.js

import { pet } from "./state.js";
import { activityDef } from "./activityDef.js";
import { awardActivity } from "./awardActivity.js";
import { tourVisitCount } from "./tourVisitCount.js";
import { meterOf } from "./meterOf.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";

/**
 * End the active activity early: award prorated rewards, cancel the rest of
 * the plan, and refund the unused share of the up-front cost/ticket and care
 * drain. Refused while a caretaker is on duty (they manage the schedule).
 * Side effects: mutates pet, renders, saves, broadcasts.
 *
 * @returns {void}
 */
export function endCurrentActivity() {
  // While a caretaker is on duty, they manage the schedule — no manual ends.
  if (pet.caretaking.active) return;
  const active = pet.activity.active;
  if (!active) return;
  const def = activityDef(active);
  const fraction = Math.min(1, (Date.now() - active.startedAt) / active.durationMs);
  pet.activity.active = null;
  pet.activity.plan = []; // ending early cancels the rest of the plan
  if (def) {
    awardActivity(active, def, fraction);
    // Refund the unused share of the up-front cost and care drain.
    if (active.type === "tour") {
      const visited = tourVisitCount(def, fraction);
      if (def.ticket) {
        // A ticket trip called back before any visit returns the ticket.
        if (visited === 0) pet.tickets[active.key] = (pet.tickets[active.key] ?? 0) + 1;
      } else {
        // Per-stop price differs between city and sports tours.
        pet.coins += (def.cityCount - visited) * (def.cost / def.cityCount);
      }
    } else {
      if (active.type === "class") {
        pet.coins += Math.round(def.cost * (1 - fraction));
      }
      for (const [stat, amount] of Object.entries(def.drain)) {
        const meter = meterOf(stat);
        meter.value = Math.min(meter.max, meter.value + Math.round(amount * (1 - fraction)));
      }
    }
  }
  render();
  save();
  broadcastState();
}
