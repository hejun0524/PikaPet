// stats/initFightclub.js — Darcy's Fight Club event wiring: using Skill
// Books, using healing supplies, and running a full fight (simulated here,
// the single source of truth; the hub replays the returned log). Called
// once from initEvents.

import { emit, listen } from "../shared/tauri.js";
import {
  CHOICE_BOOKS,
  FIGHT_MIN_HP,
  MAX_SKILL_LEVEL,
  SKILLS,
  findBook,
  findChallenger,
  findPotion,
  findSkill,
  fightPurse,
  fightXp,
  makeChallengerFighter,
  simulateBattle,
  moneyline,
  winProbability,
  betProfit,
  xpNeed,
} from "../fightclub.js";
import { pet } from "./state.js";
import { petFighterNow } from "./petFighterNow.js";
import { bumpTaskProgress } from "./bumpTaskProgress.js";
import { render } from "./render.js";
import { save } from "./save.js";
import { broadcastState } from "./broadcastState.js";

/**
 * Register the three Fight Club listeners:
 * - "fightclub-use-book" {book, skill?} — spend a Skill Book (choice books
 *   carry the chosen skill); replies with "fightclub-result".
 * - "fightclub-use-potion" {key} — spend a healing item; same reply.
 * - "fightclub-fight" {opponent, bet} — validate, simulate, apply XP /
 *   coins / bet / level-up book awards, reply with "fight-result".
 *
 * Side effects: registers Tauri listeners that mutate pet, render, save,
 * broadcast, and emit result events for the hub.
 *
 * @returns {void}
 */
export function initFightclub() {
  listen("fightclub-use-book", ({ payload }) => {
    const fc = pet.fightclub;
    const book = findBook(payload.book);
    if (!book || !(fc.books[book.key] > 0)) return;
    const open = SKILLS.filter((s) => (fc.skills[s.key] ?? 0) < MAX_SKILL_LEVEL);
    if (!open.length) return;

    const bump = (skill, points) => {
      const from = fc.skills[skill.key] ?? 0;
      const to = Math.min(MAX_SKILL_LEVEL, from + points);
      fc.skills[skill.key] = to;
      return { skill: skill.key, from, to };
    };
    const randomOpen = (pool) => pool[Math.floor(Math.random() * pool.length)];

    let entries;
    if (CHOICE_BOOKS.has(book.key)) {
      const skill = findSkill(payload.skill);
      if (!skill || (fc.skills[skill.key] ?? 0) >= MAX_SKILL_LEVEL) return;
      entries = [bump(skill, book.key === "master" ? MAX_SKILL_LEVEL : 1)];
    } else if (book.key === "twin") {
      const first = randomOpen(open);
      entries = [bump(first, 1)];
      const rest = open.filter((s) => s.key !== first.key);
      if (rest.length) entries.push(bump(randomOpen(rest), 1));
    } else {
      entries = [bump(randomOpen(open), book.key === "focus" ? 2 : 1)];
    }

    fc.books[book.key] -= 1;
    render();
    save();
    broadcastState();
    emit("fightclub-result", { kind: "book", book: book.key, entries });
  });

  listen("fightclub-use-potion", ({ payload }) => {
    const fc = pet.fightclub;
    const potion = findPotion(payload.key);
    if (!potion || !(fc.potions[potion.key] > 0)) return;
    const max = petFighterNow().maxHp;
    const before = Math.max(0, Math.min(max, fc.hp));
    if (before >= max) return; // don't waste a potion at full HP
    fc.potions[potion.key] -= 1;
    fc.hp = Math.min(max, before + Math.ceil((max * potion.heal) / 100));
    render();
    save();
    broadcastState();
    emit("fightclub-result", { kind: "heal", item: potion.key, hp: fc.hp - before, now: fc.hp, max });
  });

  listen("fightclub-fight", ({ payload }) => {
    const fc = pet.fightclub;
    const opp = findChallenger(payload.opponent);
    if (!opp) return;
    const bet = Math.max(0, Math.floor(Number(payload.bet) || 0));
    if (bet > pet.coins) return;
    const petF = petFighterNow();
    if (petF.hp < petF.maxHp * FIGHT_MIN_HP) return; // still recovering

    const oppF = makeChallengerFighter(opp);
    const ml = moneyline(winProbability(petF, oppF));
    const res = simulateBattle(petF, oppF);

    // Purse, bet, XP, record — then level-ups pay out Skill Books.
    const purse = fightPurse(opp.level);
    const coinsBefore = pet.coins;
    if (res.win) {
      pet.coins += purse.win + betProfit(bet, ml);
      fc.record.wins += 1;
      bumpTaskProgress("fight.win");
    } else {
      pet.coins = Math.max(0, pet.coins - purse.loss - bet);
      fc.record.losses += 1;
    }
    fc.hp = res.petHp;
    const xpGain = fightXp(opp.level, fc.level, res.win);
    fc.xp += xpGain;
    const levelUps = [];
    const books = {};
    while (fc.xp >= xpNeed(fc.level)) {
      fc.xp -= xpNeed(fc.level);
      fc.level += 1;
      levelUps.push(fc.level);
      books.basic = (books.basic ?? 0) + 1;
      if (fc.level % 5 === 0) {
        const bonus = Math.random() < 0.5 ? "twin" : "focus";
        books[bonus] = (books[bonus] ?? 0) + 1;
      }
    }
    for (const [key, n] of Object.entries(books)) fc.books[key] += n;

    render();
    save();
    broadcastState();
    emit("fight-result", {
      log: res.log,
      win: res.win,
      opponent: opp.key,
      ml,
      bet,
      coinsDelta: pet.coins - coinsBefore,
      xpGain,
      levelUps,
      books,
      petMaxHp: petF.maxHp,
      oppMaxHp: oppF.maxHp,
    });
  });
}
