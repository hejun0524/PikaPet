// adventure/advCityOf.js

import { ADV_CITIES } from "./adventureData.js";

/**
 * Look up a city record by its key.
 *
 * @param {string} key - City key (e.g. "rome").
 * @returns {{key: string, label: string, travelExtra: number}|undefined} The
 *   city record, or undefined when no city has that key.
 */
export function advCityOf(key) {
  return ADV_CITIES.find((c) => c.key === key);
}
