// adventure/advTravelMinutes.js

import { ADV_ERA_TRAVEL } from "./adventureData.js";
import { advCityOf } from "./advCityOf.js";

/**
 * Delivery time to a city in a given era: era base + city extra, in
 * adventure minutes. Reaching a deeper past takes longer.
 *
 * @param {string} era - Era key.
 * @param {string} city - City key.
 * @returns {number} Travel time in adventure minutes.
 */
export function advTravelMinutes(era, city) {
  return ADV_ERA_TRAVEL[era] + advCityOf(city).travelExtra;
}
