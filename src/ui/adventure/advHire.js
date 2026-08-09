// adventure/advHire.js

import { ADV_HIRE_COST } from "./adventureData.js";
import { adv } from "./state.js";
import { advCandidates } from "./advCandidates.js";
import { advLog } from "./advLog.js";
import { advMakeRecruit } from "./advMakeRecruit.js";
import { advSave } from "./advSave.js";

/**
 * Hire a candidate from today's pool by name, paying the level-based fee.
 * No-op if the name isn't in today's pool or tokens are short. Mutates
 * `adv` (tokens, recruits), logs, and calls advSave(). Caller re-renders.
 *
 * @param {string} name - The candidate's name (from advCandidates()).
 * @returns {void}
 */
export function advHire(name) {
  const candidate = advCandidates().find((c) => c.name === name);
  if (!candidate) return;
  const cost = ADV_HIRE_COST[candidate.level];
  if (adv.tokens < cost) return;
  adv.tokens -= cost;
  adv.recruits.push(advMakeRecruit(candidate.name, candidate.trade, candidate.level));
  advLog(`${candidate.name}, ${candidate.trade}, joined the guild for ${cost} tokens.`);
  advSave();
}
