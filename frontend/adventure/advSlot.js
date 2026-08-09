// adventure/advSlot.js

import { appSettings } from "../hub/state.js";

/**
 * Compute the current location slot identifier. NPCs move to a new spot in
 * their range every location slot: 2 hours normally, 2 minutes in devMode.
 *
 * @returns {string} A slot id like "2026-08-08#5" (or "2026-08-08#14:12" in
 *   devMode) that changes when NPCs relocate.
 */
export function advSlot() {
  const d = new Date();
  const day = d.toISOString().slice(0, 10);
  return appSettings.devMode
    ? `${day}#${d.getHours()}:${Math.floor(d.getMinutes() / 2)}`
    : `${day}#${Math.floor(d.getHours() / 2)}`;
}
