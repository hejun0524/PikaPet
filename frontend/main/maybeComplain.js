// main/maybeComplain.js

import {
  latest,
  trip,
  rt,
  LOW_LINE,
  SICK_LINE,
  COMPLAINT_COOLDOWN_MS,
} from "./state.js";
import { say } from "./say.js";

/**
 * Voice a complaint line when a care meter is low (sick, hungry, dirty, or
 * bored — first match wins), rate-limited by COMPLAINT_COOLDOWN_MS. Does
 * nothing while the pet is away on a tour or a travel animation runs.
 *
 * Side effects: shows the speech bubble, updates `rt.lastComplaintAt`.
 *
 * @returns {void}
 */
export function maybeComplain() {
  if (trip.away || rt.animating) return;
  const now = Date.now();
  if (now - rt.lastComplaintAt < COMPLAINT_COOLDOWN_MS) return;
  const care = latest.care;
  let msg = null;
  if (typeof care.health === "number" && care.health < SICK_LINE) {
    msg = `I am sick, ${latest.callMe}…`;
  } else if (care.energy < LOW_LINE) {
    msg = `I am hungry, ${latest.callMe}.`;
  } else if (care.hygiene < LOW_LINE) {
    msg = `I need a shower, ${latest.callMe}.`;
  } else if (care.mood < LOW_LINE) {
    msg = `Play with me, ${latest.callMe}!`;
  }
  if (msg) {
    rt.lastComplaintAt = now;
    say(msg);
  }
}
