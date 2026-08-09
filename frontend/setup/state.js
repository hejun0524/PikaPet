// setup/state.js — mutable state of the first-run setup window.

import { SPECIES } from "../items.js";

/**
 * UI state of the setup form:
 * - `chosen`: species key currently selected in the picker (the first pet is
 *   free, whichever species is chosen).
 */
export const setupUi = {
  chosen: SPECIES[0].key,
};
