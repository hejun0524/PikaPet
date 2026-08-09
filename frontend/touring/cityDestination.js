// touring/cityDestination.js

import { ALL_PLACES } from "./touringData.js";

/**
 * Find which place (country or league) a city/team belongs to.
 *
 * @param {string} city - City or team name exactly as listed in the place's
 *   `cities` array (e.g. "Kyoto", "Chicago Bulls").
 * @returns {object|undefined} The owning entry from ALL_PLACES
 *   (`{ key, label, emoji, cities }`), or `undefined` if no place lists it.
 */
export function cityDestination(city) {
  return ALL_PLACES.find((d) => d.cities.includes(city));
}
