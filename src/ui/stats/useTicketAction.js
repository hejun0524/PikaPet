// stats/useTicketAction.js — Caretaker automation: shared ticket-spending
// step of the guide/agent schedule layers.

import { findTour, isLeagueKey } from "../touring.js";
import { pet } from "./state.js";
import { processPlan } from "./processPlan.js";

/**
 * Spend an owned ticket of the right kind (city vs sports), if any: queue
 * its tour and start it.
 * Side effects: may mutate pet (plan, tickets, care via processPlan). Does
 * not save or broadcast — callers do.
 *
 * @param {boolean} wantLeague - True to use sports (league) tickets only,
 *   false for city tickets only.
 * @returns {boolean} True if a ticket trip was started.
 */
export function useTicketAction(wantLeague) {
  for (const [key, count] of Object.entries(pet.tickets)) {
    if (!(count > 0)) continue;
    const def = findTour(key);
    if (!def || isLeagueKey(def.destKey) !== wantLeague) continue;
    pet.activity.plan.push({ type: "tour", key });
    processPlan();
    return !!pet.activity.active;
  }
  return false;
}
