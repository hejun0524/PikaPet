// stats/activityDef.js — Activities: classes + jobs share one plan queue and
// clock. Classes: coins + drain up front; credits + trait rewards on
// completion. Jobs: drain up front; coins (pay) + career XP on completion.
// Ending early prorates rewards/pay and refunds the unused share.

import { findJob } from "../career.js";
import { findClass } from "../school.js";
import { findTour } from "../touring.js";

/**
 * Resolve a plan entry to its catalog definition (job, tour, or class).
 * No side effects.
 *
 * @param {{type: string, key: string}|null|undefined} entry - Plan entry.
 * @returns {object|null|undefined} The catalog definition, or null/undefined
 *   if the entry is empty or unknown.
 */
export function activityDef(entry) {
  if (!entry) return null;
  if (entry.type === "job") return findJob(entry.key);
  if (entry.type === "tour") return findTour(entry.key);
  return findClass(entry.key);
}
