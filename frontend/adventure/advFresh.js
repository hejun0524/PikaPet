// adventure/advFresh.js

import { ADV_RECRUIT_POOL, ADV_START_TOKENS } from "./adventureData.js";
import { advMakeRecruit } from "./advMakeRecruit.js";

/**
 * Build a brand-new adventure save: starting tokens, the first recruit from
 * the pool signed on at level 1, empty stores, and an opening log line.
 *
 * @returns {object} A fresh save object (`{ v, tokens, completed, recruits,
 *   materials, trinkets, goods, blueprints, tasks, taskSeq, located, met,
 *   log }`).
 */
export function advFresh() {
  const first = ADV_RECRUIT_POOL[0];
  return {
    v: 1,
    tokens: ADV_START_TOKENS,
    completed: 0,
    recruits: [advMakeRecruit(first.name, first.trade, 1)],
    materials: {},
    trinkets: {},
    goods: {},
    blueprints: [],
    tasks: [],
    taskSeq: 1,
    located: {}, // npcKey -> {slot, era, city}; stale entries = "last seen"
    met: {}, // npcKey -> notices answered; met NPCs are spotted when browsing
    log: [{ at: Date.now(), text: `The guild opens its doors. ${first.name} signs on as the first recruit.` }],
  };
}
