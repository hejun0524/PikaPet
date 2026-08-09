// arena/makeRival.js — sparring dummies: generated rival fight cards.

/** Name/species pool for generated rivals (species must exist in SPECIES). */
const RIVALS = [
  { name: "Mochi", species: "white_cat" },
  { name: "Biscuit", species: "toy_poodle" },
  { name: "Snowball", species: "bichon" },
  { name: "Pudding", species: "white_cat" },
  { name: "Rocket", species: "toy_poodle" },
  { name: "Marshmallow", species: "bichon" },
];

/**
 * Generate a practice rival scaled to the player: each stat lands within
 * ±20% of the player's card, so sparring stays winnable but not free.
 * (Plain Math.random is fine here — rivals are rerolled at will; the battle
 * itself will use a seeded RNG so results replay deterministically.)
 *
 * @param {object} playerCard - The player's fight card (fightCardFromPet).
 * @returns {object} A rival fight card with the same shape.
 */
export function makeRival(playerCard) {
  const who = RIVALS[Math.floor(Math.random() * RIVALS.length)];
  const near = (n) => Math.max(1, Math.round(n * (0.8 + Math.random() * 0.4)));
  return {
    v: 1,
    name: who.name,
    species: who.species,
    hp: near(playerCard.hp),
    atk: near(playerCard.atk),
    def: near(playerCard.def),
    spd: near(playerCard.spd),
    luck: near(playerCard.luck || 1),
    condition: 100,
  };
}
