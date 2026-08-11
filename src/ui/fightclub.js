// fightclub.js — master file for Darcy's Fight Club: re-exports the skill
// catalog (fightclub/skills.js), Skill Books + healing supplies
// (fightclub/books.js), the challenger roster (fightclub/challengers.js),
// fighter construction (fightclub/fighters.js), the battle simulator
// (fightclub/engine.js) and the odds maker (fightclub/odds.js). Import from
// here, like items.js / kitchen.js.

export {
  MAX_SKILL_LEVEL,
  SKILLS,
  findSkill,
  skillName,
  skillDesc,
  skillPower,
  skillChance,
} from "./fightclub/skills.js";
export {
  BOOKS,
  CHOICE_BOOKS,
  POTIONS,
  findBook,
  findPotion,
  bookName,
  bookDesc,
  potionName,
  potionDesc,
  rollBookDrop,
  rollBookOffer,
} from "./fightclub/books.js";
export { CHALLENGERS, findChallenger } from "./fightclub/challengers.js";
export {
  FIGHT_MIN_HP,
  xpNeed,
  maxHpFor,
  fightPurse,
  fightXp,
  makePetFighter,
  makeChallengerFighter,
} from "./fightclub/fighters.js";
export { ROUND_CAP, CRIT_MULTIPLIER, simulateBattle } from "./fightclub/engine.js";
export {
  fighterPower,
  winProbability,
  moneyline,
  betProfit,
  formatMoneyline,
} from "./fightclub/odds.js";
