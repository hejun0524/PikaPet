// career/tiersCompleted.js

import { TIERS } from "./careerData.js";

/**
 * How many whole tiers a career's XP has completed (used to detect
 * tier-mastery achievements).
 *
 * @param {number} xp - Total XP earned in one career (negative clamps to 0).
 * @returns {number} Count of fully completed tiers, 0-5.
 */
export function tiersCompleted(xp) {
  let remaining = Math.max(0, xp);
  let n = 0;
  for (const tier of TIERS) {
    const total = tier.perLevel * 5;
    if (remaining < total) break;
    remaining -= total;
    n += 1;
  }
  return n;
}
