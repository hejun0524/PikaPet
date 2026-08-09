// touring/ticketOfferKey.js

import { flightKey } from "./flightKey.js";
import { trainKey } from "./trainKey.js";

/**
 * The ticket key a Pika shop offer turns into when bought.
 *
 * @param {{kind: "flight"|"train", city?: string, dest?: string}} offer -
 *   One entry of Pika's `sells` list.
 * @returns {string} `"flight:<city>"` for flight offers, `"train:<dest>"`
 *   for train/league-pass offers.
 */
export function ticketOfferKey(offer) {
  return offer.kind === "flight" ? flightKey(offer.city) : trainKey(offer.dest);
}
