// career/findJob.js

import { JOB_CATALOG } from "./careerData.js";

/**
 * Look up a job definition by key.
 *
 * @param {string} key - Job key, `"<career>-<rank>"` (e.g. "chef-3").
 * @returns {object|undefined} The job entry from JOB_CATALOG
 *   (`{ key, career, rank, emoji, name, minutes, pay, xp, requires, drain }`),
 *   or `undefined` if the key is unknown.
 */
export function findJob(key) {
  return JOB_CATALOG.find((j) => j.key === key);
}
