// stats/touringCert.js

import { findPlace } from "../touring.js";

/**
 * Build a touring achievement record for having visited every city of one
 * place (destination or sports league).
 *
 * @param {string} placeKey - Place key (see ALL_PLACES).
 * @returns {{type: "touring", place: string, emoji: string, label: string,
 *   date: string}} New achievement object (dated today).
 */
export function touringCert(placeKey) {
  const place = findPlace(placeKey);
  return {
    type: "touring",
    place: placeKey,
    emoji: place.emoji,
    label: `${place.label} Explorer`,
    date: new Date().toISOString().slice(0, 10),
  };
}
