// career/levelLabel.js

import { tOr } from "../shared/i18n.js";
import { TIERS } from "./careerData.js";

/**
 * Human-readable label for an overall career level, in the active locale.
 *
 * @param {number} overallLevel - Overall level, 1-25 (5 levels per tier).
 * @returns {string} Text like "Junior 3" (tier name + level within tier).
 */
export function levelLabel(overallLevel) {
  const tier = TIERS[Math.floor((overallLevel - 1) / 5)];
  const level = ((overallLevel - 1) % 5) + 1;
  return `${tOr(`tier.${tier.name.toLowerCase()}`, tier.name)} ${level}`;
}
