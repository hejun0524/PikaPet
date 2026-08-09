// career/careerProgress.js

import { TIERS } from "./careerData.js";

/**
 * Break a career's raw XP down into tier/level progress for display and
 * unlock checks.
 *
 * @param {number} xp - Total XP earned in one career (negative clamps to 0).
 * @returns {{tierName: string, level: number, intoLevel: number,
 *   perLevel: number, overallLevel: number, maxed: boolean}}
 *   Current tier name, 1-5 level within the tier, XP into the current level,
 *   XP per level in this tier, 1-25 overall level, and whether the career is
 *   fully maxed.
 */
export function careerProgress(xp) {
  let remaining = Math.max(0, xp);
  for (let i = 0; i < TIERS.length; i++) {
    const tierTotal = TIERS[i].perLevel * 5;
    if (remaining < tierTotal) {
      const level = Math.floor(remaining / TIERS[i].perLevel) + 1;
      return {
        tierName: TIERS[i].name,
        level,
        intoLevel: remaining % TIERS[i].perLevel,
        perLevel: TIERS[i].perLevel,
        overallLevel: i * 5 + level,
        maxed: false,
      };
    }
    remaining -= tierTotal;
  }
  return {
    tierName: TIERS[TIERS.length - 1].name,
    level: 5,
    intoLevel: TIERS[TIERS.length - 1].perLevel,
    perLevel: TIERS[TIERS.length - 1].perLevel,
    overallLevel: TIERS.length * 5,
    maxed: true,
  };
}
