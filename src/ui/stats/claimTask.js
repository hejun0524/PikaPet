// stats/claimTask.js — Dune's Daily Tasks: paying out a completed task's
// reward only once the player claims it on Dune's page (completion itself
// is automatic — see stats/evaluateTasks.js).

import { DESTINATIONS, ticketOfferKey } from "../touring.js";
import { BONUS_TASK, findTask } from "../tasks.js";
import { pet } from "./state.js";

/** Apply a task's coins/item/ticket reward to `pet`. */
function grantReward(reward) {
  if (reward.coins) pet.coins += reward.coins;
  if (reward.itemKey) {
    pet.bag[reward.itemKey] = (pet.bag[reward.itemKey] ?? 0) + 1;
  }
  if (reward.ticket) {
    const dest = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    const key = ticketOfferKey({ kind: "train", dest: dest.key });
    pet.tickets[key] = (pet.tickets[key] ?? 0) + 1;
  }
}

/**
 * Claim a completed, not-yet-claimed task's reward (index 0-4 = today's real
 * tasks, index 5 = the implicit "clear all 5" bonus).
 * Side effects: mutates pet.dune.claimed and pet.coins/bag/tickets. Does not
 * save or broadcast — callers do.
 *
 * @param {number} index - 0..5.
 * @returns {boolean} True if a reward was granted.
 */
export function claimTask(index) {
  const dune = pet.dune;
  if (!Number.isInteger(index) || index < 0 || index > 5) return false;
  if (!dune.completed[index] || dune.claimed[index]) return false;
  const task = index === 5 ? BONUS_TASK : findTask(dune.tasks[index]?.tier, dune.tasks[index]?.id);
  if (!task) return false;
  dune.claimed[index] = true;
  grantReward(task.reward);
  return true;
}
