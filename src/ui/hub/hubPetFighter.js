// hub/hubPetFighter.js

import { makePetFighter } from "../fightclub.js";
import { state } from "./state.js";

/**
 * The pet's fighter card built from the hub's state mirror — same math as
 * the stats window's petFighterNow, used here for display and odds.
 *
 * @returns {object} Fighter (see fightclub/fighters.js).
 */
export function hubPetFighter() {
  const fc = state.fightclub;
  return makePetFighter({
    name: state.name,
    level: fc.level ?? 1,
    hp: fc.hp ?? 100,
    traits: state.traits,
    skills: fc.skills ?? {},
  });
}
