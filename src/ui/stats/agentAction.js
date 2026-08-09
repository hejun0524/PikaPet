// stats/agentAction.js — Caretaker automation: the sports agent's schedule
// layer.

import { findTour } from "../touring.js";
import { pet } from "./state.js";
import { useTicketAction } from "./useTicketAction.js";
import { processPlan } from "./processPlan.js";

/**
 * Send the pet to a sports event: use an owned sports ticket if any,
 * otherwise buy the 1-venue mystery sports tour when affordable.
 * Side effects: may mutate pet (plan, tickets, coins, care via processPlan).
 * Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if a trip was started.
 */
export function agentAction() {
  if (useTicketAction(true)) return true;
  const def = findTour("sport-any-1");
  if (pet.coins < def.cost) return false;
  pet.activity.plan.push({ type: "tour", key: def.key });
  processPlan();
  return !!pet.activity.active;
}
