// adventure/advStoreHTML.js

import { escText as esc } from "../panel.js";
import { ADV_MATERIALS, ADV_TRINKETS } from "./adventureData.js";
import { adv } from "./state.js";
import { advBpOf } from "./advBpOf.js";

/**
 * Render the Storehouse tab: chips for every material, crafted good, and
 * trinket in store, with hints when a shelf is empty.
 *
 * @returns {string} HTML for the Storehouse tab.
 */
export function advStoreHTML() {
  const mats = Object.entries(adv.materials).filter(([, q]) => q > 0);
  const goods = Object.entries(adv.goods).filter(([, q]) => q > 0);
  const trinkets = Object.entries(adv.trinkets).filter(([, q]) => q > 0);
  const chip = (label, qty) => `<span class="adv-chip">${esc(label)} <b>× ${qty}</b></span>`;
  return `
    <div class="adv-section">Materials</div>
    <div class="adv-chips">${
      mats.length
        ? mats.map(([k, q]) => chip(ADV_MATERIALS[k].label, q)).join("")
        : `<span class="adv-note">Empty shelves. Send recruits gathering from the World tab.</span>`
    }</div>

    <div class="adv-section">Crafted goods</div>
    <div class="adv-chips">${
      goods.length
        ? goods.map(([k, q]) => chip(advBpOf(k).label, q)).join("")
        : `<span class="adv-note">Nothing assembled yet — the benches wait in the Crafthouse.</span>`
    }</div>

    <div class="adv-section">Trinkets</div>
    <div class="adv-chips">${
      trinkets.length
        ? trinkets.map(([k, q]) => chip(ADV_TRINKETS[k].label, q)).join("")
        : `<span class="adv-note">No trinkets yet — folk on the notice board sometimes pay with them.</span>`
    }</div>
    ${trinkets.length ? `<div class="adv-note">Pika buys trinkets on her tab, at a generous price.</div>` : ""}`;
}
