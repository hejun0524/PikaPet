// arena/fightCardFromPet.js — derive a fight card from the pet's state.

/**
 * Snapshot the pet as a fight card: the frozen stat block that battles are
 * simulated from (and that friends exchange as fight codes — the owner
 * doesn't need to be online).
 *
 * First-pass formulas, to be balanced once the battle engine lands:
 * traits carry the build (Fitness → HP/ATK, Smarts → DEF/ATK, Charm → SPD/
 * luck) and today's care average scales it ±15% ("condition") so a
 * well-kept pet fights a little better.
 *
 * @param {object} petState - The hub's state mirror (name, species, traits,
 *   care).
 * @returns {{v: number, name: string, species: string, hp: number,
 *   atk: number, def: number, spd: number, luck: number, condition: number}}
 */
export function fightCardFromPet(petState) {
  const t = petState.traits ?? {};
  const care = Object.values(petState.care ?? {});
  const avgCare = care.length ? care.reduce((a, b) => a + b, 0) / care.length : 100;
  const condition = 0.85 + 0.3 * (avgCare / 100); // 0.85 (neglected) .. 1.15 (pampered)
  const scaled = (n) => Math.round(n * condition);
  return {
    v: 1, // fight-card schema version (bump on breaking changes)
    name: petState.name,
    species: petState.species,
    hp: scaled(100 + (t.fitness ?? 0) * 2),
    atk: scaled(10 + (t.fitness ?? 0) + Math.floor((t.smarts ?? 0) / 2)),
    def: scaled(8 + Math.floor((t.fitness ?? 0) / 2) + Math.floor((t.smarts ?? 0) / 2)),
    spd: scaled(6 + Math.floor((t.charm ?? 0) / 2)),
    luck: Math.min(30, t.charm ?? 0), // crit/dodge percent points, capped
    condition: Math.round(condition * 100),
  };
}
