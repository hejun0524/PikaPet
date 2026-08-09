// main/maybeComplain.js

import { t } from "../shared/i18n.js";
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
  let key = null;
  if (typeof care.health === "number" && care.health < SICK_LINE) {
    key = "bubble.sick";
  } else if (care.energy < LOW_LINE) {
    key = "bubble.hungry";
  } else if (care.hygiene < LOW_LINE) {
    key = "bubble.shower";
  } else if (care.mood < LOW_LINE) {
    key = "bubble.play";
  }
  if (key) {
    rt.lastComplaintAt = now;
    say(t(key, { callMe: latest.callMe }));
  }
}
