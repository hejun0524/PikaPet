// career/isJobUnlocked.js

import { careerProgress } from "./careerProgress.js";
import { hasDegree } from "./hasDegree.js";

/**
 * Whether a job's unlock requirements (overall level, trait minimums, and
 * subject degrees) are all met.
 *
 * @param {object} job - Job entry from JOB_CATALOG (`{ career, requires }`
 *   are the fields used).
 * @param {{xp: Object<string, number>, traits: Object<string, number>,
 *   subjects: Object<string, {years: number}>}} ctx - The pet's progress:
 *   per-career XP, trait values, and per-subject school progress.
 * @returns {boolean} `true` when every requirement is satisfied.
 */
export function isJobUnlocked(job, ctx) {
  const req = job.requires ?? {};
  if (req.level && careerProgress(ctx.xp[job.career] ?? 0).overallLevel < req.level) return false;
  for (const [trait, min] of Object.entries(req.traits ?? {})) {
    if ((ctx.traits[trait] ?? 0) < min) return false;
  }
  for (const d of req.degrees ?? []) {
    if (!hasDegree(ctx.subjects, d.subject, d.stage)) return false;
  }
  return true;
}
