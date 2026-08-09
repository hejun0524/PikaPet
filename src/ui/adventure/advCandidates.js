// adventure/advCandidates.js

import { ADV_RECRUIT_POOL } from "./adventureData.js";
import { adv } from "./state.js";
import { advHash } from "./advHash.js";

/**
 * Daily hiring pool: deterministic pick of 3 from whoever isn't hired yet,
 * with a stable per-name level between 1 and 3.
 *
 * @returns {{name: string, trade: string, sort: number, level: number}[]} Up
 *   to 3 candidates seeking work today.
 */
export function advCandidates() {
  const day = new Date().toISOString().slice(0, 10);
  const hired = new Set(adv.recruits.map((r) => r.name));
  return ADV_RECRUIT_POOL.filter((p) => !hired.has(p.name))
    .map((p) => ({ ...p, sort: advHash(p.name + day) }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map((p) => ({ ...p, level: (advHash(p.name) % 3) + 1 }));
}
