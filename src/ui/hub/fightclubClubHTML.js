// hub/fightclubClubHTML.js — Darcy's Fight Club, Club tab: the pet's fight
// card (level, XP, HP bars, record, derived stats), the side-bet selector,
// and the 20-challenger board with live moneyline odds. While a fight
// replay is active this tab shows the battle view instead (renderGrid).

import { t } from "../shared/i18n.js";
import {
  CHALLENGERS,
  FIGHT_MIN_HP,
  fightPurse,
  fightXp,
  makeChallengerFighter,
  moneyline,
  winProbability,
  betProfit,
  formatMoneyline,
  xpNeed,
} from "../fightclub.js";
import { state, ui } from "./state.js";
import { escText as esc } from "../panel.js";
import { hubPetFighter } from "./hubPetFighter.js";

/** Side-bet stakes offered as quick chips. */
const BET_CHIPS = [0, 50, 100, 500, 1000, 5000];

/**
 * The Club tab: fight card + bet selector + challenger board.
 *
 * @returns {string} Page HTML for the grid.
 */
export function fightclubClubHTML() {
  const petF = hubPetFighter();
  const fc = state.fightclub;
  const need = xpNeed(fc.level ?? 1);
  const hpPct = Math.round((petF.hp / petF.maxHp) * 100);
  const recovering = petF.hp < petF.maxHp * FIGHT_MIN_HP;

  const head = `
    <div class="fc-head">
      <div class="fc-head-row">
        <span class="fc-title">🐾 ${esc(state.name)}</span>
        <span class="chip">${t("fightclub.level", { n: fc.level ?? 1 })}</span>
        <span class="chip">${t("fightclub.record", { w: fc.record?.wins ?? 0, l: fc.record?.losses ?? 0 })}</span>
      </div>
      <div class="credit-bar">
        <span class="xp-line">⭐ ${t("fightclub.xp", { have: fc.xp ?? 0, need })}</span>
        <div class="track"><div class="fill" style="width:${Math.min(100, Math.round(((fc.xp ?? 0) / need) * 100))}%"></div></div>
      </div>
      <div class="credit-bar">
        <span class="xp-line">❤️ ${t("fightclub.hp", { hp: petF.hp, max: petF.maxHp })}</span>
        <div class="track"><div class="fill fc-hp ${hpPct < 30 ? "low" : ""}" style="width:${hpPct}%"></div></div>
      </div>
      <div class="fc-stats">
        <span class="chip">⚔️ ${t("fightclub.statAtk")} ${Math.round(petF.atk)}</span>
        <span class="chip">🛡️ ${t("fightclub.statDef")} ${Math.round(petF.def * 100)}%</span>
        <span class="chip">💨 ${t("fightclub.statDodge")} ${Math.round(petF.dodge * 100)}%</span>
        <span class="chip">🎯 ${t("fightclub.statCrit")} ${Math.round(petF.crit * 100)}%</span>
        <span class="chip">✨ ${t("fightclub.statDouble")} ${Math.round(petF.dbl * 100)}%</span>
      </div>
      ${recovering ? `<div class="fc-recover">${t("fightclub.recovering", { pct: Math.round(FIGHT_MIN_HP * 100) })}</div>` : ""}
    </div>`;

  const bets = `
    <div class="fc-head">
      <div class="fc-head-row"><span class="fc-title">🎲 ${t("fightclub.betTitle")}</span></div>
      <div class="fc-bets">
        ${BET_CHIPS.map(
          (b) => `
        <button class="career-chip ${ui.fightBet === b ? "active" : ""}" data-bet="${b}" ${b > state.coins ? "disabled" : ""}>
          ${b === 0 ? t("fightclub.betNone") : `💰${b}`}
        </button>`
        ).join("")}
      </div>
      <div class="fc-sub">${t("fightclub.betNote")}</div>
    </div>`;

  // Challenger board: item cards like the shopping / job pages.
  const cards = CHALLENGERS.map((c) => {
    const oppF = makeChallengerFighter(c);
    const ml = moneyline(winProbability(petF, oppF));
    const purse = fightPurse(c.level);
    const betLine =
      ui.fightBet > 0
        ? `<span class="effects">${t("fightclub.betPays", { bet: ui.fightBet, profit: betProfit(ui.fightBet, ml) })}</span>`
        : "";
    return `
      <div class="item">
        <span class="qty">${t("fightclub.lvBadge", { n: c.level })}</span>
        <span class="icon">${c.emoji}</span>
        <span class="name">${esc(c.name)}</span>
        <span class="effects">${t("fightclub.oddsLine", { ml: formatMoneyline(ml) })}</span>
        <span class="effects">${t("fightclub.purseLine", {
          win: purse.win,
          loss: purse.loss,
          xp: fightXp(c.level, fc.level ?? 1, true),
        })}</span>
        ${betLine}
        <span class="effects"><button class="fc-fight-btn" data-fight="${esc(c.key)}" ${recovering || ui.fightBet > state.coins ? "disabled" : ""}>${t("fightclub.fight")}</button></span>
      </div>`;
  }).join("");

  const note = `<div class="ach-section caretaker-title">${t("fightclub.clubNote")}</div>`;
  return note + head + bets + cards;
}
