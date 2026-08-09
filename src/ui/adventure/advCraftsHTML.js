// adventure/advCraftsHTML.js

import { escText as esc } from "../panel.js";
import { ADV_BLUEPRINTS, ADV_MATERIALS } from "./adventureData.js";
import { adv } from "./state.js";

/**
 * Render the Crafthouse tab: every craft in the world, unlocked ones
 * workable (with an Assemble button and material tallies), the rest greyed
 * out. A blueprint bought from Pika is unlocked permanently.
 *
 * @returns {string} HTML for the Crafthouse tab.
 */
export function advCraftsHTML() {
  return `
    <p class="adv-prose">The guild's crafthouse. Every craft known to the world hangs on this
    wall; a blueprint bought from Pika unlocks its bench for good.</p>

    <div class="adv-section">Crafts</div>
    <div class="adv-cards">${ADV_BLUEPRINTS.map((bp) => {
      const unlocked = adv.blueprints.includes(bp.key);
      const needsRows = Object.entries(bp.needs)
        .map(([k, q]) => {
          const have = adv.materials[k] ?? 0;
          return `<div class="adv-note">${q} ${esc(ADV_MATERIALS[k].label.toLowerCase())}${
            unlocked ? ` — have ${have}` : ""
          }</div>`;
        })
        .join("");
      if (!unlocked) {
        return `
      <div class="adv-card adv-dim">
        <div class="adv-card-head"><b class="adv-name">${esc(bp.label)}</b><span class="adv-note">not found</span></div>
        ${needsRows}
        <div class="adv-note">Blueprint not found — Pika sells one for ${bp.price} 🐟.</div>
      </div>`;
      }
      const can = Object.entries(bp.needs).every(([k, q]) => (adv.materials[k] ?? 0) >= q);
      const made = adv.goods[bp.key] ?? 0;
      return `
      <div class="adv-card">
        <div class="adv-card-head"><b class="adv-name">${esc(bp.label)}</b><span class="adv-note">unlocked${made ? ` · ${made} in store` : ""}</span></div>
        ${needsRows}
        <div class="adv-actions"><button class="adv-btn" data-adv-craft="${bp.key}" ${can ? "" : "disabled"}>Assemble</button></div>
      </div>`;
    }).join("")}</div>`;
}
