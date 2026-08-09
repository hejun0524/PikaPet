// stats/guideAction.js — Caretaker automation: the tour guide's schedule
// layer.

import { findTour } from "../touring.js";
import { pet } from "./state.js";
import { useTicketAction } from "./useTicketAction.js";
import { processPlan } from "./processPlan.js";

/**
 * Send the pet on a city trip: use an owned city ticket if any, otherwise
 * buy the 1-city mystery tour when affordable.
 * Side effects: may mutate pet (plan, tickets, coins, care via processPlan).
 * Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if a trip was started.
 */
export function guideAction() {
  if (useTicketAction(false)) return true;
  const def = findTour("tour-any-1");
  if (pet.coins < def.cost) return false;
  pet.activity.plan.push({ type: "tour", key: def.key });
  processPlan();
  return !!pet.activity.active;
}
