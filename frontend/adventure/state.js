// adventure/state.js — the adventure's mutable state: the persistent save
// object (`adv`) and the UI-only selections (`advUi`, not persisted).

import { ADV_TABS } from "./adventureData.js";
import { advLoadSave } from "./advLoadSave.js";

/**
 * The adventure save, loaded once at startup and mutated in place by every
 * action/simulation function; persist changes with advSave().
 */
export const adv = advLoadSave();

/**
 * UI-only state (not persisted):
 * - `tab`: active adventure tab key (see ADV_TABS).
 * - `era`: era selected in the World finder.
 * - `place`: selected middle-column entry, `"city:<key>"` / `"wild:<key>"`,
 *   or `null` when nothing is selected.
 */
export const advUi = {
  tab: ADV_TABS[0].key,
  era: "ancient",
  place: null,
};
