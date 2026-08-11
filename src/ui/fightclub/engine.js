// fightclub/engine.js — the turn-by-turn battle simulator. The stats window
// runs a whole fight up front (single source of truth) and the hub replays
// the returned log line by line with animated HP bars.
//
// Rules (user design):
//   - Rock-paper-scissors decides who strikes first (ties re-thrown).
//   - Fighters alternate turns; charm gives the pet a double-turn chance.
//   - Active skills may replace a basic attack; passive skills may trigger
//     while being attacked (see skills.js for the fx catalog).
//   - Criticals deal 3× damage, for basic attacks and damage skills alike.
//   - Apparent Death-style passives survive a KO blow at 1 HP once a fight.
//   - After ROUND_CAP rounds the judges score it on remaining HP fraction.
//
// Log entries are compact and structured; the hub localizes them
// (hub/fclogText.js): {k, n (actor), s (skill key), v (damage/heal), c
// (crit), p/o (pet/opponent HP after the event)} plus the special "rps"
// entry {k, pt, ot}.

import { skillPower, skillChance } from "./skills.js";

/** Rounds before the judges call it on remaining HP. */
export const ROUND_CAP = 30;

/** Critical hits deal this many times the damage. */
export const CRIT_MULTIPLIER = 3;

const RPS = ["✊", "✋", "✌️"];

/**
 * Simulate a full fight between the pet and a challenger.
 *
 * @param {object} petF - Pet fighter (fighters.js makePetFighter); enters at
 *   its CURRENT hp, so an unrecovered pet fights wounded.
 * @param {object} oppF - Challenger fighter (makeChallengerFighter).
 * @returns {{win: boolean, log: object[], petHp: number, oppHp: number}}
 *   Outcome, the full replayable log, and both fighters' remaining HP.
 */
export function simulateBattle(petF, oppF) {
  const P = mkSide(petF, true);
  const O = mkSide(oppF, false);
  const log = [];
  const push = (e) => log.push({ ...e, p: Math.max(0, Math.round(P.hp)), o: Math.max(0, Math.round(O.hp)) });

  // Rock-paper-scissors for the first turn (ties re-thrown off-screen).
  let pt, ot;
  do {
    pt = Math.floor(Math.random() * 3);
    ot = Math.floor(Math.random() * 3);
  } while (pt === ot);
  const petFirst = (pt - ot + 3) % 3 === 1;
  push({ k: "rps", pt: RPS[pt], ot: RPS[ot] });
  push({ k: "first", n: (petFirst ? P : O).f.name });

  const order = petFirst ? [P, O] : [O, P];
  let lastActor = order[0];
  outer: for (let round = 0; round < ROUND_CAP; round++) {
    for (const side of order) {
      const other = side === P ? O : P;
      if (P.hp <= 0 || O.hp <= 0) break outer;
      lastActor = side;
      const extra = takeTurn(side, other, push);
      if (P.hp <= 0 || O.hp <= 0) break outer;
      // One bonus turn max: an "again" skill, or the charm double-turn roll.
      if (extra || Math.random() < side.f.dbl) {
        if (!extra) push({ k: "dbl", n: side.f.name });
        takeTurn(side, other, push);
        if (P.hp <= 0 || O.hp <= 0) break outer;
      }
    }
  }

  let win;
  if (P.hp <= 0 || O.hp <= 0) {
    // Reflected damage can drop both — the side that forced it wins.
    win = P.hp <= 0 && O.hp <= 0 ? lastActor === P : O.hp <= 0;
    push({ k: "ko", n: (win ? O : P).f.name });
  } else {
    win = P.hp / P.f.maxHp >= O.hp / O.f.maxHp;
    push({ k: "timeup" });
  }
  push({ k: "win", n: (win ? P : O).f.name });
  return { win, log, petHp: Math.max(0, Math.round(P.hp)), oppHp: Math.max(0, Math.round(O.hp)) };
}

/** Wrap a fighter in mutable battle state. */
function mkSide(f, isPet) {
  return { f, isPet, hp: f.hp, stunned: false, survived: false, mods: [] };
}

/** Current attack, with buff/debuff modifiers (floored at 20% of base). */
function atkOf(side) {
  const pct = side.mods.filter((m) => m.stat === "atk").reduce((s, m) => s + m.pct, 0);
  return side.f.atk * Math.max(0.2, 1 + pct / 100);
}

/** Current guard (damage reduction 0..0.8), with modifiers. */
function defOf(side) {
  const pct = side.mods.filter((m) => m.stat === "def").reduce((s, m) => s + m.pct, 0);
  return Math.min(0.8, Math.max(0, side.f.def + pct / 100));
}

/** The side's learned skills with a given fx. */
function withFx(side, fx) {
  return side.f.skills.filter((e) => e.s.fx === fx);
}

/** Roll one proc among the side's skills with this fx; undefined if none. */
function rollFx(side, fx) {
  const procs = withFx(side, fx).filter(
    (e) => Math.random() < skillChance(e.s, e.lv, side.f.skillMult)
  );
  return procs[Math.floor(Math.random() * procs.length)];
}

/** Total always-on dodge bonus (0..1) from dodgeup passives. */
function dodgeBonus(side) {
  return withFx(side, "dodgeup").reduce((s, e) => s + skillPower(e.s, e.lv) / 100, 0);
}

/** Total always-on damage reduction (0..1) from thick passives. */
function thickOf(side) {
  return Math.min(0.5, withFx(side, "thick").reduce((s, e) => s + skillPower(e.s, e.lv) / 100, 0));
}

/** Heal a side, capped at max HP; returns the HP actually restored. */
function heal(side, amount) {
  const v = Math.min(side.f.maxHp - side.hp, Math.max(0, Math.round(amount)));
  side.hp += v;
  return v;
}

/** Stun the target unless a tenacity passive shrugs it off. */
function applyStun(target, push) {
  const grit = rollFx(target, "tenacity");
  if (grit) {
    push({ k: "resist", n: target.f.name, s: grit.s.key });
  } else {
    target.stunned = true;
    push({ k: "stun", n: target.f.name });
  }
}

/** A KO blow just landed on `side` — apparent-death passives may save it. */
function checkSurvive(side, push) {
  if (side.hp > 0 || side.survived) return;
  const save = rollFx(side, "survive");
  if (save) {
    side.hp = 1;
    side.survived = true;
    push({ k: "survive", n: side.f.name, s: save.s.key });
  }
}

/**
 * One hit of an attack: dodge check, damage roll (3× on crit), guard and
 * defensive passives, then on-hit passives of the defender.
 *
 * @returns {number} Damage dealt (0 on a dodge).
 */
function doHit(A, D, skill, powerPct, push) {
  if (Math.random() < Math.min(0.5, D.f.dodge + dodgeBonus(D))) {
    push({ k: "dodge", n: D.f.name });
    return 0;
  }
  let raw = atkOf(A) * (0.85 + Math.random() * 0.3) * (powerPct / 100);
  const crit = Math.random() < A.f.crit;
  if (crit) raw *= CRIT_MULTIPLIER;
  if (skill?.s.fx !== "pierce") raw *= 1 - defOf(D);
  raw *= 1 - thickOf(D);

  // One defensive passive may trigger per hit: block, parry, or counter.
  const guard = rollFx(D, "block");
  const parry = guard ? undefined : rollFx(D, "parry");
  const counter = guard || parry ? undefined : rollFx(D, "counter");
  if (guard) {
    raw *= 1 - Math.min(90, skillPower(guard.s, guard.lv)) / 100;
    push({ k: "block", n: D.f.name, s: guard.s.key });
  } else if (parry) {
    const prevented = raw * (Math.min(85, skillPower(parry.s, parry.lv)) / 100);
    raw -= prevented;
    A.hp -= Math.max(1, Math.round(prevented));
    push({ k: "parry", n: D.f.name, s: parry.s.key, v: Math.max(1, Math.round(prevented)) });
    checkSurvive(A, push);
  }

  const dmg = Math.max(1, Math.round(raw));
  D.hp -= dmg;
  push(
    skill
      ? { k: "skill", n: A.f.name, s: skill.s.key, v: dmg, c: crit || undefined }
      : { k: "basic", n: A.f.name, v: dmg, c: crit || undefined }
  );
  checkSurvive(D, push);

  if (D.hp > 0) {
    if (counter && A.hp > 0) {
      const cv = Math.max(1, Math.round(atkOf(D) * (skillPower(counter.s, counter.lv) / 100) * (1 - defOf(A))));
      A.hp -= cv;
      push({ k: "counter", n: D.f.name, s: counter.s.key, v: cv });
      checkSurvive(A, push);
    }
    const rage = rollFx(D, "ragestack");
    if (rage) {
      D.mods.push({ stat: "atk", pct: skillPower(rage.s, rage.lv), rounds: rage.s.rounds });
      push({ k: "buffatk", n: D.f.name, s: rage.s.key });
    }
    if (D.hp < D.f.maxHp * 0.3) {
      const nine = rollFx(D, "lastresort");
      if (nine) {
        const v = heal(D, D.f.maxHp * (skillPower(nine.s, nine.lv) / 100));
        if (v) push({ k: "heal", n: D.f.name, s: nine.s.key, v });
      }
    }
  }
  return dmg;
}

/**
 * One full turn of `A` attacking `D`: regen ticks, stun check, action
 * selection (a proc'd active skill or a basic attack), buff bookkeeping.
 *
 * @returns {boolean} True when an "again" skill grants an immediate extra
 *   turn.
 */
function takeTurn(A, D, push) {
  // Always-on regeneration (Healing Purr) ticks at the start of the turn.
  for (const e of withFx(A, "regen")) {
    const v = heal(A, A.f.maxHp * (skillPower(e.s, e.lv) / 100));
    if (v) push({ k: "heal", n: A.f.name, s: e.s.key, v });
  }

  let extra = false;
  if (A.stunned) {
    A.stunned = false;
    push({ k: "stunned", n: A.f.name });
  } else {
    const procs = A.f.skills.filter(
      (e) => e.s.kind === "active" && Math.random() < skillChance(e.s, e.lv, A.f.skillMult)
    );
    const pick = procs[Math.floor(Math.random() * procs.length)];
    const fx = pick?.s.fx;
    if (!pick) {
      doHit(A, D, null, 100, push);
    } else if (fx === "heal") {
      const v = heal(A, A.f.maxHp * (skillPower(pick.s, pick.lv) / 100));
      push({ k: "heal", n: A.f.name, s: pick.s.key, v });
    } else if (fx === "buffatk" || fx === "buffdef") {
      A.mods.push({ stat: fx === "buffatk" ? "atk" : "def", pct: skillPower(pick.s, pick.lv), rounds: pick.s.rounds });
      push({ k: fx, n: A.f.name, s: pick.s.key });
    } else if (fx === "debuffatk" || fx === "debuffdef") {
      const grit = rollFx(D, "tenacity");
      if (grit) {
        push({ k: "resist", n: D.f.name, s: grit.s.key });
      } else {
        D.mods.push({ stat: fx === "debuffatk" ? "atk" : "def", pct: -skillPower(pick.s, pick.lv), rounds: pick.s.rounds });
        push({ k: fx, n: A.f.name, s: pick.s.key });
      }
    } else if (fx === "stun") {
      if (pick.s.power > 0) doHit(A, D, pick, skillPower(pick.s, pick.lv), push);
      else push({ k: "skillplain", n: A.f.name, s: pick.s.key });
      if (D.hp > 0) applyStun(D, push);
    } else if (fx === "flurry") {
      doHit(A, D, pick, skillPower(pick.s, pick.lv), push);
      if (D.hp > 0 && A.hp > 0) doHit(A, D, pick, skillPower(pick.s, pick.lv), push);
    } else if (fx === "wild") {
      const span = pick.s.power2 - pick.s.power;
      doHit(A, D, pick, skillPower(pick.s, pick.lv) + Math.random() * span, push);
    } else if (fx === "drain") {
      const dmg = doHit(A, D, pick, skillPower(pick.s, pick.lv), push);
      if (dmg > 0 && A.hp > 0) {
        const v = heal(A, dmg / 2);
        if (v) push({ k: "heal", n: A.f.name, s: pick.s.key, v });
      }
    } else if (fx === "again") {
      doHit(A, D, pick, skillPower(pick.s, pick.lv), push);
      if (D.hp > 0) {
        push({ k: "again", n: A.f.name, s: pick.s.key });
        extra = true;
      }
    } else {
      // strike / pierce
      doHit(A, D, pick, skillPower(pick.s, pick.lv), push);
    }
  }

  // Buffs and debuffs on this side burn one of their rounds per own turn.
  for (const m of A.mods) m.rounds -= 1;
  A.mods = A.mods.filter((m) => m.rounds > 0);
  return extra;
}
