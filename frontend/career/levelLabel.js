// career/levelLabel.js

import { TIERS } from "./careerData.js";

/**
 * Human-readable label for an overall career level.
 *
 * @param {number} overallLevel - Overall level, 1-25 (5 levels per tier).
 * @returns {string} Text like "Junior 3" (tier name + level within tier).
 */
export function levelLabel(overallLevel) {
  const tier = TIERS[Math.floor((overallLevel - 1) / 5)];
  const level = ((overallLevel - 1) % 5) + 1;
  return `${tier.name} ${level}`;
}
