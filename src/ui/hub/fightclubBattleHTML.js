// hub/fightclubBattleHTML.js — the word-fight battle view: two fighter
// cards with animated HP bars, the scrolling fight log, and the outcome
// panel. Rendered by the Club tab while ui.battle is set; fightReplay.js
// appends new log lines and patches the bars between full renders, so this
// builder reproduces the replay's current position (ui.battle.idx).

import { t } from "../shared/i18n.js";
import { findChallenger } from "../fightclub.js";
import { state, ui } from "./state.js";
import { escText as esc } from "../panel.js";
import { fclogText } from "./fclogText.js";

/**
 * The battle view for the in-progress (or finished) fight replay.
 *
 * @returns {string} Page HTML for the grid.
 */
export function fightclubBattleHTML() {
  const b = ui.battle;
  const opp = findChallenger(b.opponent);
  // Every log entry carries both HP values after the event; the entry at
  // the replay cursor tells the bars where they are right now.
  const at = b.log[Math.max(0, b.idx - 1)];
  const lines = b.log
    .slice(0, b.idx)
    .map((e) => `<div class="fc-line ${e.c ? "crit" : ""}">${fclogText(e)}</div>`)
    .join("");

  const fighter = (side, emoji, name, hp, max) => `
    <div class="fc-fighter">
      <div class="fc-fname">${emoji} ${esc(name)}</div>
      <div class="fc-hptrack"><div class="fc-hpfill ${hp / max < 0.3 ? "low" : ""}" id="fc-hp-${side}" style="width:${Math.round((hp / max) * 100)}%"></div></div>
      <div class="fc-sub" id="fc-hpnum-${side}">${hp}/${max}</div>
    </div>`;

  let outcome = "";
  if (b.done) {
    const coins = `${b.coinsDelta >= 0 ? "+" : "−"}💰${Math.abs(b.coinsDelta)}`;
    const lines2 = [
      b.win ? t("fightclub.resultWin", { xp: b.xpGain }) : t("fightclub.resultLoss", { xp: b.xpGain }),
      t("fightclub.resultCoins", { delta: coins }),
    ];
    if (b.bet > 0) lines2.push(t("fightclub.resultBet", { ml: b.ml > 0 ? `+${b.ml}` : b.ml }));
    if (b.levelUps?.length) {
      lines2.push(t("fightclub.resultLevel", { n: b.levelUps[b.levelUps.length - 1] }));
    }
    outcome = `<div class="fc-outcome ${b.win ? "win" : "loss"}">${lines2.join("<br/>")}</div>`;
  }

  return `
    <div class="fc-battle">
      <div class="fc-fighters">
        ${fighter("pet", "🐾", state.name, at.p, b.petMaxHp)}
        <div class="fc-vs">VS</div>
        ${fighter("opp", opp?.emoji ?? "❓", opp?.name ?? "?", at.o, b.oppMaxHp)}
      </div>
      <div class="fc-log" id="fight-log">${lines}</div>
      ${outcome}
      <div class="fc-actions">
        <button id="fight-skip" ${b.done ? "hidden" : ""}>${t("fightclub.skip")}</button>
        <button id="fight-back" ${b.done ? "" : "hidden"}>${t("fightclub.back")}</button>
      </div>
    </div>`;
}
