// stats/processPlan.js — Activities: start the next queued plan entry when
// the activity slot is free.

import { schoolMinuteMs } from "../school.js";
import { SICK_BELOW } from "../touring.js";
import { pet } from "./state.js";
import { meterOf } from "./meterOf.js";
import { activityDef } from "./activityDef.js";
import { canPayDrain } from "./canPayDrain.js";
import { isEntryUnlocked } from "./isEntryUnlocked.js";
import { classSpeedMultiplier } from "./traitBoost.js";

/**
 * If nothing is active, pop the next plan entry and start it: charge its
 * coin cost (or consume a ticket), apply its care drain, and set
 * pet.activity.active with timing. A sick pet, an unpayable/locked entry,
 * or a missing ticket cancels the whole plan.
 * Side effects: mutates pet (plan, coins, tickets, care, activity.active).
 * Does not save or broadcast — callers do.
 *
 * @returns {void}
 */
export function processPlan() {
  if (pet.activity.active || pet.activity.plan.length === 0) return;
  // A sick pet stays home: no school, no work, no traveling.
  if (meterOf("health").value < SICK_BELOW) {
    pet.activity.plan = [];
    return;
  }
  const entry = pet.activity.plan[0];
  const def = activityDef(entry);
  const cost = entry.type === "job" ? 0 : def?.cost ?? 0;
  if (!def || pet.coins < cost || !canPayDrain(def.drain) || !isEntryUnlocked(entry)) {
    // Can't start the next activity: the rest of the plan is cancelled.
    pet.activity.plan = [];
    return;
  }
  // Ticket trips consume the ticket at departure instead of coins.
  if (def.ticket && !(pet.tickets[entry.key] > 0)) {
    pet.activity.plan = [];
    return;
  }
  pet.activity.plan.shift();
  if (def.ticket) pet.tickets[entry.key] -= 1;
  else pet.coins -= cost;
  for (const [stat, amount] of Object.entries(def.drain)) {
    const meter = meterOf(stat);
    meter.value = Math.max(0, meter.value - amount);
  }
  // Talent bonus: the subject's trait shortens classes (traitBoost.js).
  const speed = entry.type === "class" ? classSpeedMultiplier(def) : 1;
  pet.activity.active = {
    type: entry.type,
    key: entry.key,
    durationMs: Math.round(def.minutes * schoolMinuteMs(pet.settings.devMode) * speed),
    startedAt: Date.now(),
  };
}
