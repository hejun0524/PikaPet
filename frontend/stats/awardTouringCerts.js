// stats/awardTouringCerts.js

import { findPlace } from "../touring.js";
import { pet } from "./state.js";
import { touringCert } from "./touringCert.js";

/**
 * Award "Explorer" achievements for any of the given places whose city list
 * is now fully visited (skips places already awarded).
 * Side effects: may push onto pet.achievements (mutates pet). Does not save
 * or broadcast — callers do.
 *
 * @param {string[]} placeKeys - Place keys to check (duplicates are fine).
 * @returns {void}
 */
export function awardTouringCerts(placeKeys) {
  for (const key of new Set(placeKeys)) {
    const place = findPlace(key);
    if (!place) continue;
    if ((pet.touring.visited[key] ?? []).length < place.cities.length) continue;
    const exists = pet.achievements.some((a) => a.type === "touring" && a.place === key);
    if (!exists) pet.achievements.push(touringCert(key));
  }
}
