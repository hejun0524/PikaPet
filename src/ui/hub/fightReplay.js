// hub/fightReplay.js — plays a fight-result log back one line at a time:
// appends localized log lines and patches the HP bars in place (no full
// re-render per step). The replay position lives in ui.battle.idx, so a
// full renderGrid at any moment (tab switch and back, pet-state broadcast
// after the fight ends) redraws exactly the lines shown so far.

import { ui } from "./state.js";
import { fclogText } from "./fclogText.js";
import { renderGrid } from "./renderGrid.js";

/** Milliseconds between replayed log lines. */
const STEP_MS = 650;

let timer = null;

/** Start (or restart) the replay of ui.battle. */
export function startFightReplay() {
  stopFightReplay();
  timer = setInterval(step, STEP_MS);
}

/** Stop the replay interval (the position in ui.battle stays). */
export function stopFightReplay() {
  if (timer) clearInterval(timer);
  timer = null;
}

/** Jump to the end of the replay and show the outcome. */
export function skipFightReplay() {
  const b = ui.battle;
  stopFightReplay();
  if (!b) return;
  b.idx = b.log.length;
  b.done = true;
  renderGrid();
}

/** One replay tick: reveal the next log entry, or finish. */
function step() {
  const b = ui.battle;
  if (!b || b.done) {
    stopFightReplay();
    return;
  }
  if (b.idx >= b.log.length) {
    b.done = true;
    stopFightReplay();
    renderGrid();
    return;
  }
  b.idx += 1;
  const e = b.log[b.idx - 1];
  // Patch the DOM only if the battle view is on screen; the state advance
  // above keeps the replay position correct either way.
  const logEl = document.getElementById("fight-log");
  if (logEl) {
    const div = document.createElement("div");
    div.className = `fc-line ${e.c ? "crit" : ""}`;
    div.innerHTML = fclogText(e);
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
    patchBar("pet", e.p, b.petMaxHp);
    patchBar("opp", e.o, b.oppMaxHp);
  }
}

/** Update one fighter's HP bar + number in place. */
function patchBar(side, hp, max) {
  const fill = document.getElementById(`fc-hp-${side}`);
  const num = document.getElementById(`fc-hpnum-${side}`);
  if (!fill || !num) return;
  fill.style.width = `${Math.round((hp / max) * 100)}%`;
  fill.classList.toggle("low", hp / max < 0.3);
  num.textContent = `${hp}/${max}`;
}
