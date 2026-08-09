// touring/findDestination.js

import { DESTINATIONS } from "./touringData.js";

/**
 * Look up a world destination (country) by key.
 *
 * @param {string} key - Destination key (e.g. "japan").
 * @returns {object|undefined} The entry from DESTINATIONS
 *   (`{ key, label, emoji, cities }`), or `undefined` if the key is unknown
 *   (sports leagues do NOT match — use findPlace for those).
 */
export function findDestination(key) {
  return DESTINATIONS.find((d) => d.key === key);
}
