// stats/petFighterNow.js

import { makePetFighter } from "../fightclub.js";
import { pet } from "./state.js";

/**
 * The pet's current fighter card (traits, fight level, skills, CURRENT
 * fight HP) for the battle engine and the odds maker.
 *
 * @returns {object} Fighter (see fightclub/fighters.js).
 */
export function petFighterNow() {
  return makePetFighter({
    name: pet.name,
    level: pet.fightclub.level,
    hp: pet.fightclub.hp,
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    skills: pet.fightclub.skills,
  });
}
