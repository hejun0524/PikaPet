// hub/planEntryDef.js

import { findJob } from "../career.js";
import { findTour } from "../touring.js";
import { findClass } from "../school.js";

/**
 * Resolve a plan-book entry to its catalog definition.
 *
 * @param {{type: "class"|"job"|"tour", key: string}} entry - Plan-book entry.
 * @returns {Object|undefined} The matching job / tour / class definition.
 */
export function planEntryDef(entry) {
  if (entry.type === "job") return findJob(entry.key);
  if (entry.type === "tour") return findTour(entry.key);
  return findClass(entry.key);
}
