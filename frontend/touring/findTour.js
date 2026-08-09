// touring/findTour.js

import {
  SPORT_LEAGUES,
  SPORT_PRICE_PER_VENUE,
  TOUR_MINUTES_PER_CITY,
  TOUR_PRICE_PER_CITY,
} from "./touringData.js";
import { cityDestination } from "./cityDestination.js";
import { findDestination } from "./findDestination.js";
import { findPlace } from "./findPlace.js";
import { isLeagueKey } from "./isLeagueKey.js";

/**
 * Derive a tour definition from a tour/ticket key. Tour "defs" match the
 * shape the activity engine expects (`minutes`, `cost`, `drain`) plus
 * kind-specific fields. Key formats:
 *
 * - `tour-any-<n>`    mystery package: n random cities worldwide, paid in coins
 * - `sport-any-<n>`   mystery sports tour: n random teams, any league
 * - `sport-<league>-<n>` league-scoped sports tour (legacy keys in old saves)
 * - `tour-<dest>-<n>` country-scoped package (legacy keys in old saves)
 * - `flight:<city>`   ticket: visits exactly that city/team
 * - `train:<dest>`    ticket: 1 random city of a country / team of a league
 *
 * @param {string} key - Tour or ticket key in one of the formats above.
 * @returns {object|null} A tour def `{ key, kind, destKey, cityCount, emoji,
 *   name, minutes, cost, drain, ticket?, city? }`, or `null` for unknown
 *   keys/non-strings.
 */
export function findTour(key) {
  if (typeof key !== "string") return null;
  // Mystery packages roam the whole world — destination is a surprise, so
  // neither the name nor the status bar reveals a country.
  const anyPkg = /^tour-any-([1-5])$/.exec(key);
  if (anyPkg) {
    const cityCount = Number(anyPkg[1]);
    return {
      key,
      kind: "package",
      destKey: null,
      cityCount,
      emoji: "🌍",
      name: `Mystery Tour · ${cityCount} ${cityCount > 1 ? "cities" : "city"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * TOUR_PRICE_PER_CITY,
      drain: {},
    };
  }
  // Mystery sports tours: random teams across ALL leagues, premium price.
  const anySport = /^sport-any-([1-5])$/.exec(key);
  if (anySport) {
    const cityCount = Number(anySport[1]);
    return {
      key,
      kind: "sport",
      destKey: null,
      cityCount,
      emoji: "🏟️",
      name: `Mystery Sports Tour · ${cityCount} ${cityCount > 1 ? "stops" : "stop"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * SPORT_PRICE_PER_VENUE,
      drain: {},
    };
  }
  // League-scoped sports tours (legacy keys; may exist in old saves).
  const sport = /^sport-([a-z]+)-([1-5])$/.exec(key);
  if (sport) {
    const league = SPORT_LEAGUES.find((l) => l.key === sport[1]);
    if (!league) return null;
    const cityCount = Number(sport[2]);
    return {
      key,
      kind: "sport",
      destKey: league.key,
      cityCount,
      emoji: league.emoji,
      name: `${league.label} Tour · ${cityCount} ${cityCount > 1 ? "stops" : "stop"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * SPORT_PRICE_PER_VENUE,
      drain: {},
    };
  }
  // Country-scoped packages (legacy keys; may exist in old saves).
  const pkg = /^tour-([a-z]+)-([1-5])$/.exec(key);
  if (pkg) {
    const dest = findDestination(pkg[1]);
    if (!dest) return null;
    const cityCount = Number(pkg[2]);
    return {
      key,
      kind: "package",
      destKey: dest.key,
      cityCount,
      emoji: dest.emoji,
      name: `${dest.label} Tour · ${cityCount} ${cityCount > 1 ? "cities" : "city"}`,
      minutes: cityCount * TOUR_MINUTES_PER_CITY,
      cost: cityCount * TOUR_PRICE_PER_CITY,
      drain: {}, // care is maintained during the trip
    };
  }
  // Flight tickets go to one specific city — or one specific team.
  if (key.startsWith("flight:")) {
    const city = key.slice("flight:".length);
    const dest = cityDestination(city);
    if (!dest) return null;
    const league = isLeagueKey(dest.key);
    return {
      key,
      kind: "flight",
      ticket: true,
      city,
      destKey: dest.key,
      cityCount: 1,
      emoji: league ? "🎟️" : "✈️",
      name: league ? `Ticket to ${city}` : `Flight to ${city}`,
      minutes: TOUR_MINUTES_PER_CITY,
      cost: 0,
      drain: {},
    };
  }
  // Train tickets pick a random city of a country — or a league pass picks
  // a random team of that league.
  if (key.startsWith("train:")) {
    const place = findPlace(key.slice("train:".length));
    if (!place) return null;
    const league = isLeagueKey(place.key);
    return {
      key,
      kind: "train",
      ticket: true,
      destKey: place.key,
      cityCount: 1,
      emoji: league ? "🎟️" : "🚄",
      name: league ? `${place.label} League Pass` : `Train trip in ${place.label}`,
      minutes: TOUR_MINUTES_PER_CITY,
      cost: 0,
      drain: {},
    };
  }
  return null;
}
