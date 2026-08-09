// arena/arenaPageHTML.js — the Arena page: your fight card vs a rival.

import { escText } from "../panel/escText.js";
import { findSpecies } from "../items.js";
import { arenaUi } from "./state.js";
import { fightCardFromPet } from "./fightCardFromPet.js";
import { makeRival } from "./makeRival.js";
import { fightCodeFromCard } from "./fightCode.js";

/** One fight card rendered as stat rows. */
function cardHTML(card, label) {
  const rows = [
    ["❤️ HP", card.hp],
    ["⚔️ Attack", card.atk],
    ["🛡️ Defense", card.def],
    ["💨 Speed", card.spd],
    ["🍀 Luck", card.luck],
  ]
    .map(([k, v]) => `<div class="arena-stat"><span>${k}</span><b>${v}</b></div>`)
    .join("");
  return `
    <div class="arena-card">
      <div class="arena-side">${label}</div>
      <span class="species-thumb" style="background-image:url('${findSpecies(card.species)?.sheet ?? ""}')"></span>
      <div class="arena-name">${escText(card.name)}</div>
      <div class="arena-cond">Condition ${card.condition}%</div>
      ${rows}
    </div>`;
}

/**
 * The Arena page: the pet's live fight card, a sparring rival (rerollable,
 * or imported from a friend's fight code), and the — still disabled —
 * Fight button. The battle engine (simulateBattle) is the next milestone.
 *
 * @param {object} petState - The hub's state mirror.
 * @returns {string} Page HTML for the grid.
 */
export function arenaPageHTML(petState) {
  const you = fightCardFromPet(petState);
  arenaUi.rival ??= makeRival(you);
  return `
    <div class="arena-wrap">
      <div class="gov-note">🏗️ The Arena is warming up — cards and sparring rivals are live, the referee
        (battle engine) arrives next. Traits shape your card: Fitness builds HP and Attack, Smarts sharpens
        Attack and Defense, Charm adds Speed and Luck — and a well-cared-for pet steps in with better Condition.</div>

      <div class="arena-ring">
        ${cardHTML(you, "You")}
        <div class="arena-vs">VS</div>
        ${cardHTML(arenaUi.rival, "Rival")}
      </div>

      <div class="arena-actions">
        <button class="arena-btn" data-arena-new-rival>🔁 New sparring rival</button>
        <button class="arena-btn primary" data-arena-fight disabled title="Battle engine coming soon">🥊 Fight!</button>
      </div>

      <div class="ach-section">🎟️ Fight codes — battle friends with no server</div>
      <div class="gov-note">Send your code to a friend over any chat app; paste theirs to spar against
        their pet's snapshot (they don't need to be online).</div>
      <textarea class="arena-code" readonly onclick="this.select()">${fightCodeFromCard(you)}</textarea>
      <div class="arena-import">
        <input id="arena-code-in" type="text" placeholder="Paste a friend's fight code…" />
        <button class="arena-btn" data-arena-import>Load rival</button>
        <span id="arena-import-note" class="gov-note"></span>
      </div>

      <div class="gov-note">Roadmap: ① battle engine (turn-based, seeded &amp; deterministic — same cards +
        seed replay identically, so results are verifiable without a server) → ② battle replays with sprite
        animations → ③ rewards &amp; a win record → ④ optional free-tier friend directory so codes sync
        automatically.</div>
    </div>`;
}
