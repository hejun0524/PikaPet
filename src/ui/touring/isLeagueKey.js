// touring/isLeagueKey.js

import { SPORT_LEAGUES } from "./touringData.js";

/**
 * Whether a place key names a sports league (as opposed to a country).
 *
 * @param {string} key - Place key (e.g. "nba", "japan").
 * @returns {boolean} `true` for league keys, `false` otherwise.
 */
export function isLeagueKey(key) {
  return SPORT_LEAGUES.some((l) => l.key === key);
}
