// touring/findPlace.js

import { ALL_PLACES } from "./touringData.js";

/**
 * Look up any visit-tracking place — a country OR a sports league — by key
 * (both track visited "cities").
 *
 * @param {string} key - Place key (e.g. "japan", "nba").
 * @returns {object|undefined} The entry from ALL_PLACES
 *   (`{ key, label, emoji, cities }`), or `undefined` if the key is unknown.
 */
export function findPlace(key) {
  return ALL_PLACES.find((d) => d.key === key);
}
