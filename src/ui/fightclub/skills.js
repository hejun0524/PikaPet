// fightclub/skills.js — Darcy's Fight Club skill catalog: 50 skills, each
// with MAX_SKILL_LEVEL levels. Skill Books (found by Noonie's delivery bots
// or bought at Pika's Fighter's Corner) unlock and level them up; the battle
// engine (fightclub/engine.js) interprets the combat fields.
//
// Combat schema per skill:
//   kind    "active"  — may trigger on the pet's own attack turn
//           "passive" — may trigger while being attacked (or is always on)
//   fx      what happens when it triggers (see engine.js):
//             strike     damage = attack × power%
//             pierce     like strike but ignores the defender's guard
//             flurry     two hits of power% each
//             wild       damage anywhere between power% and power2%
//             drain      strike that heals the attacker for half the damage
//             stun       power% damage (0 = none) + target skips next turn
//             heal       restore power% of max HP
//             buffatk / buffdef       own attack/guard +power% for `rounds`
//             debuffatk / debuffdef   foe's attack/guard −power% for `rounds`
//             again      strike at power% and immediately act again
//             block      reduce the incoming hit by power%
//             parry      halve the incoming hit and reflect what was blocked
//             counter    take the hit, then strike back at power%
//             thick      ALWAYS ON: every incoming hit reduced by power%
//             dodgeup    ALWAYS ON: dodge chance +power%
//             regen      ALWAYS ON: heal power% of max HP each own turn
//             ragestack  when hit: own attack +power% for `rounds`
//             tenacity   chance to shrug off stuns and debuffs
//             lastresort when dropping below 30% HP: heal power% of max HP
//             survive    a KO blow leaves 1 HP instead (once per fight)
//   power   effect magnitude (see fx); grows with skill level
//   power2  only for `wild`: the upper damage bound
//   rounds  buff/debuff duration in the owner's turns
//   chance  base trigger probability at level 1; grows with skill level and
//           the pet's charm (always-on fx use chance 1)

import { tOr } from "../shared/i18n.js";

/** Levels per skill. */
export const MAX_SKILL_LEVEL = 5;

/** The 50-skill list. Each: {key, emoji, name, desc, kind, fx, …}. */
export const SKILLS = [
  // ── Household mayhem (actives) ──────────────────────────────────────────
  { key: "plates", emoji: "🍽️", name: "Plate Toss", desc: "Opens with a volley of the day's specials — service with a smash.", kind: "active", fx: "strike", power: 130, chance: 0.16 },
  { key: "bat", emoji: "🏏", name: "Bat Swing", desc: "A heavy home-run swing. The opponent is the ball.", kind: "active", fx: "strike", power: 185, chance: 0.1 },
  { key: "jab", emoji: "🥊", name: "Lightning Jab", desc: "Fast pokes that chip away before anyone sees them coming.", kind: "active", fx: "strike", power: 112, chance: 0.22 },
  { key: "uppercut", emoji: "💥", name: "Uppercut", desc: "A rising haymaker delivered with compliments from below.", kind: "active", fx: "strike", power: 165, chance: 0.12 },
  { key: "kick", emoji: "🦵", name: "High Kick", desc: "A spinning kick that politely ignores the guard.", kind: "active", fx: "pierce", power: 150, chance: 0.12 },
  { key: "takedown", emoji: "🤼", name: "Takedown", desc: "Wrestle the opponent down — they spend a turn remembering up.", kind: "active", fx: "stun", power: 60, chance: 0.09 },
  { key: "zoomies", emoji: "💨", name: "Zoomies Rush", desc: "A sudden burst of 3 a.m. cat speed — hit and go again.", kind: "active", fx: "again", power: 100, chance: 0.08 },
  { key: "watergun", emoji: "🔫", name: "Water Gun", desc: "Hydration is important. Forced hydration is a weapon.", kind: "active", fx: "strike", power: 135, chance: 0.14 },
  { key: "coinshot", emoji: "🪙", name: "Coin Shower", desc: "When you're rich, you can afford to splurge on violence.", kind: "active", fx: "strike", power: 170, chance: 0.11 },
  { key: "dustblow", emoji: "🌬️", name: "Dust Blow", desc: "One puff of attic dust — the sneezing does the rest.", kind: "active", fx: "debuffatk", power: 25, rounds: 2, chance: 0.12 },
  { key: "pillow", emoji: "🪶", name: "Pillow Fight", desc: "Soft, fluffy, and deeply humiliating.", kind: "active", fx: "strike", power: 120, chance: 0.18 },
  { key: "sleepdart", emoji: "🎯", name: "Sleep Dart", desc: "Nap time isn't optional anymore.", kind: "active", fx: "stun", power: 0, chance: 0.08 },
  { key: "zapmat", emoji: "⚡", name: "Zap Pad", desc: "Please step on the welcome mat. It's electric.", kind: "active", fx: "strike", power: 150, chance: 0.12 },
  { key: "vitamin", emoji: "🧃", name: "Vitamin Juice", desc: "Gulp mid-fight. Doctors hate this one weird trick.", kind: "active", fx: "heal", power: 22, chance: 0.12 },
  { key: "dumbbell", emoji: "🏋️", name: "Dumbbell Toss", desc: "Leg day, arm day, throw-the-gym-at-them day.", kind: "active", fx: "strike", power: 175, chance: 0.1 },
  { key: "basketball", emoji: "🏀", name: "Basketball Slam", desc: "Nothing but net. The opponent is the hoop.", kind: "active", fx: "strike", power: 145, chance: 0.13 },
  { key: "balloon", emoji: "🎈", name: "Static Balloon", desc: "Rub, rub, BZZT — a party trick with consequences.", kind: "active", fx: "stun", power: 90, chance: 0.07 },
  { key: "energydrink", emoji: "🥤", name: "Energy Drink", desc: "Chug liquid rage. Warranty void for the next three rounds.", kind: "active", fx: "buffatk", power: 40, rounds: 3, chance: 0.1 },
  { key: "catnip", emoji: "🌿", name: "Catnip Daze", desc: "One whiff and the opponent forgets what fists are for.", kind: "active", fx: "debuffatk", power: 30, rounds: 2, chance: 0.1 },
  { key: "yarnball", emoji: "🧶", name: "Yarn Tangle", desc: "Wraps the foe in 40 meters of premium wool. Guard? What guard?", kind: "active", fx: "debuffdef", power: 25, rounds: 2, chance: 0.12 },
  { key: "vampire", emoji: "🧛", name: "Mr. Vampire", desc: "Hop in, bite down, borrow some HP. No interest, never repaid.", kind: "active", fx: "drain", power: 120, chance: 0.1 },
  { key: "shadowclone", emoji: "🥷", name: "Shadow Clone", desc: "Two of you show up. Both bill separately.", kind: "active", fx: "flurry", power: 90, chance: 0.1 },
  // ── Dojo classics: MMA / BJJ / Karate / Kung Fu / Muay Thai (actives) ───
  { key: "goldenbell", emoji: "🔔", name: "Golden Bell", desc: "Legendary iron-shirt kung fu — ring the bell, become the bell.", kind: "active", fx: "buffdef", power: 35, rounds: 3, chance: 0.12 },
  { key: "armbar", emoji: "🦾", name: "Armbar", desc: "Jiu-jitsu's polite way of asking an arm to retire early.", kind: "active", fx: "debuffatk", power: 40, rounds: 2, chance: 0.09 },
  { key: "chokehold", emoji: "🐍", name: "Rear-Naked Choke", desc: "The BJJ goodnight hug — they'll sit out a turn thinking it over.", kind: "active", fx: "stun", power: 70, chance: 0.07 },
  { key: "suplex", emoji: "🎢", name: "Suplex", desc: "A free ride: up, over, and directly into the floor.", kind: "active", fx: "strike", power: 165, chance: 0.11 },
  { key: "roundhouse", emoji: "🌀", name: "Roundhouse Kick", desc: "The kick so famous it has its own fan club.", kind: "active", fx: "strike", power: 170, chance: 0.11 },
  { key: "legsweep", emoji: "🧹", name: "Leg Sweep", desc: "Sweep the leg — gravity handles the paperwork.", kind: "active", fx: "stun", power: 40, chance: 0.09 },
  { key: "elbow", emoji: "💢", name: "Elbow Smash", desc: "Muay Thai's pointiest argument.", kind: "active", fx: "strike", power: 150, chance: 0.12 },
  { key: "flyingknee", emoji: "🚀", name: "Flying Knee", desc: "A knee with frequent-flyer miles.", kind: "active", fx: "strike", power: 160, chance: 0.11 },
  { key: "triangle", emoji: "📐", name: "Triangle Choke", desc: "Geometry homework, applied directly to the neck — and it feeds you.", kind: "active", fx: "drain", power: 100, chance: 0.09 },
  { key: "kimura", emoji: "🔗", name: "Kimura Lock", desc: "Twists the shoulder AND the game plan out of position.", kind: "active", fx: "debuffdef", power: 35, rounds: 2, chance: 0.08 },
  { key: "ironpalm", emoji: "🖐️", name: "Iron Palm", desc: "Ten thousand slaps of training, delivered in one.", kind: "active", fx: "strike", power: 155, chance: 0.12 },
  { key: "karatechop", emoji: "🥋", name: "Karate Chop", desc: "Boards fear it. Guards can't stop it.", kind: "active", fx: "pierce", power: 135, chance: 0.13 },
  { key: "cranekick", emoji: "🦢", name: "Crane Kick", desc: "If do right, no can defense.", kind: "active", fx: "strike", power: 190, chance: 0.08 },
  { key: "tigerclaw", emoji: "🐅", name: "Tiger Claw", desc: "Kung fu's five-point manicure review.", kind: "active", fx: "strike", power: 150, chance: 0.12 },
  { key: "mantis", emoji: "🦗", name: "Mantis Fist", desc: "Tiny stance, huge attitude — snips right through the guard.", kind: "active", fx: "pierce", power: 140, chance: 0.11 },
  { key: "drunkenfist", emoji: "🍶", name: "Drunken Fist", desc: "Nobody knows where the next hit lands. Including the fist.", kind: "active", fx: "wild", power: 60, power2: 240, chance: 0.11 },
  { key: "dragonkick", emoji: "🐲", name: "Dragon Tail Kick", desc: "Rumored to have ended three dynasties and one coffee table.", kind: "active", fx: "strike", power: 205, chance: 0.07 },
  { key: "monkeyking", emoji: "🐒", name: "Monkey King Staff", desc: "The stick grows, the opponent's confidence shrinks.", kind: "active", fx: "strike", power: 160, chance: 0.1 },
  // ── Passives (trigger while being attacked, or always on) ───────────────
  { key: "playdead", emoji: "💫", name: "Apparent Death", desc: "When the KO blow lands, cling on at 1 HP instead (once per fight).", kind: "passive", fx: "survive", power: 0, chance: 0.4 },
  { key: "guard", emoji: "🛡️", name: "Iron Guard", desc: "Brace up and let the paperwork absorb the punch.", kind: "passive", fx: "block", power: 45, chance: 0.18 },
  { key: "footwork", emoji: "👟", name: "Swift Footwork", desc: "Slippery movement that keeps you rudely un-hittable.", kind: "passive", fx: "dodgeup", power: 3, chance: 1 },
  { key: "thickskin", emoji: "🧱", name: "Thick Skin", desc: "Insults and elbows both bounce off a little.", kind: "passive", fx: "thick", power: 4, chance: 1 },
  { key: "parry", emoji: "🤺", name: "Parry", desc: "Return to sender, postage due.", kind: "passive", fx: "parry", power: 55, chance: 0.12 },
  { key: "counter", emoji: "🪃", name: "Counter Strike", desc: "Every hit you take files an immediate complaint — in person.", kind: "passive", fx: "counter", power: 80, chance: 0.1 },
  { key: "ironhead", emoji: "🪖", name: "Iron Head", desc: "Stuns and mind games ring the bell and find nobody home.", kind: "passive", fx: "tenacity", power: 0, chance: 0.45 },
  { key: "cattitude", emoji: "😾", name: "Cattitude", desc: "Getting hit is simply unacceptable. The attitude hits back harder.", kind: "passive", fx: "ragestack", power: 15, rounds: 2, chance: 0.15 },
  { key: "ninelives", emoji: "🐈‍⬛", name: "Nine Lives", desc: "Running low on life? There are spares in the drawer.", kind: "passive", fx: "lastresort", power: 16, chance: 0.35 },
  { key: "purr", emoji: "😸", name: "Healing Purr", desc: "A self-repairing engine that runs on smugness.", kind: "passive", fx: "regen", power: 2, chance: 1 },
];

/** @param {string} key @returns {object|undefined} SKILLS entry. */
export function findSkill(key) {
  return SKILLS.find((s) => s.key === key);
}

/** Translated skill name ("skill.<key>"). */
export function skillName(skill) {
  return tOr(`skill.${skill.key}`, skill.name);
}

/** Translated skill description ("skill.<key>.desc"). */
export function skillDesc(skill) {
  return tOr(`skill.${skill.key}.desc`, skill.desc);
}

/**
 * Effective effect magnitude at a skill level (each level past 1 adds 12%).
 *
 * @param {{power: number}} skill - SKILLS entry.
 * @param {number} lv - Skill level (1..MAX_SKILL_LEVEL).
 * @returns {number} Scaled power.
 */
export function skillPower(skill, lv) {
  return Math.round(skill.power * (1 + 0.12 * (lv - 1)));
}

/**
 * Effective trigger chance at a skill level (each level past 1 adds 18% of
 * the base), scaled by the fighter's skill-chance multiplier (charm).
 *
 * @param {{chance: number}} skill - SKILLS entry.
 * @param {number} lv - Skill level (1..MAX_SKILL_LEVEL).
 * @param {number} mult - Fighter's skill-chance multiplier (1 = neutral).
 * @returns {number} Probability, capped at 0.9.
 */
export function skillChance(skill, lv, mult) {
  return Math.min(0.9, skill.chance * (1 + 0.18 * (lv - 1)) * mult);
}
