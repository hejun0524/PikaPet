// stats/refreshPika.js — Pika's daily want-list: re-roll wants + ticket
// offers when the 3-hour store slot changes.

import {
  ALL_CITIES,
  ALL_TEAMS,
  DESTINATIONS,
  FLIGHT_PRICE_BASE,
  FLIGHT_PRICE_VAR,
  LEAGUE_PASS_PRICE_BASE,
  LEAGUE_PASS_PRICE_VAR,
  PIKA_FLIGHT_OFFERS,
  PIKA_TEAM_OFFERS,
  PIKA_TRAIN_OFFERS,
  PIKA_WANTS_COUNT,
  SPORT_LEAGUES,
  TEAM_TICKET_PRICE_BASE,
  TEAM_TICKET_PRICE_VAR,
  TRAIN_PRICE_BASE,
  TRAIN_PRICE_VAR,
  pickRandomCities,
} from "../touring.js";
import { pet } from "./state.js";
import { pikaSlot } from "./pikaSlot.js";

/**
 * Re-roll Pika's store (souvenir wants + flight/train/team/league-pass
 * offers) if the current slot differs from the stored one.
 * Side effects: overwrites pet.pika (mutates pet) when a re-roll happens.
 * Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if the store was re-rolled, false if still fresh.
 */
export function refreshPika() {
  const slot = pikaSlot();
  if (pet.pika.date === slot) return false;
  // Ticket destinations AND prices are re-rolled every slot.
  const randomLeague = SPORT_LEAGUES[Math.floor(Math.random() * SPORT_LEAGUES.length)];
  const sells = [
    ...pickRandomCities(ALL_CITIES, PIKA_FLIGHT_OFFERS).map((city) => ({
      kind: "flight",
      city,
      price: FLIGHT_PRICE_BASE + Math.floor(Math.random() * (FLIGHT_PRICE_VAR + 1)),
    })),
    ...pickRandomCities(
      DESTINATIONS.map((d) => d.key),
      PIKA_TRAIN_OFFERS
    ).map((dest) => ({
      kind: "train",
      dest,
      price: TRAIN_PRICE_BASE + Math.floor(Math.random() * (TRAIN_PRICE_VAR + 1)),
    })),
    // Sports: tickets to specific teams, plus one random league pass.
    ...pickRandomCities(ALL_TEAMS, PIKA_TEAM_OFFERS).map((city) => ({
      kind: "flight",
      city,
      price: TEAM_TICKET_PRICE_BASE + Math.floor(Math.random() * (TEAM_TICKET_PRICE_VAR + 1)),
    })),
    {
      kind: "train",
      dest: randomLeague.key,
      price: LEAGUE_PASS_PRICE_BASE + Math.floor(Math.random() * (LEAGUE_PASS_PRICE_VAR + 1)),
    },
  ];
  pet.pika = {
    date: slot,
    wants: pickRandomCities(ALL_CITIES, PIKA_WANTS_COUNT),
    sells: sells.map((o, i) => ({ id: `${slot}#${i}`, ...o })),
  };
  return true;
}
