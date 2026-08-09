// adventure/advPikaHTML.js

import { escText as esc } from "../panel.js";
import { ADV_BLUEPRINTS, ADV_MATERIALS, ADV_TRINKETS } from "./adventureData.js";
import { adv } from "./state.js";

/**
 * Render Pika's tab: the trading post — blueprints for sale (buy buttons or
 * "unlocked" notes) and the trinket buy-back list.
 *
 * @returns {string} HTML for the Pika tab.
 */
export function advPikaHTML() {
  const trinkets = Object.entries(adv.trinkets).filter(([, q]) => q > 0);
  return `
    <p class="adv-prose">Pika's Trading Post. She stocks blueprints from every era and pays
    handsomely for trinkets — where she resells them is her business.</p>

    <div class="adv-section">Blueprints for sale</div>
    ${ADV_BLUEPRINTS.map((bp) => {
      const owned = adv.blueprints.includes(bp.key);
      const needs = Object.entries(bp.needs)
        .map(([k, q]) => `${q} ${ADV_MATERIALS[k].label.toLowerCase()}`)
        .join(" + ");
      return `<div class="adv-row"><span><b>${esc(bp.label)}</b> blueprint <span class="adv-note">(${esc(needs)})</span></span>
        ${owned ? `<span class="adv-note">unlocked</span>` : `<button class="adv-btn" data-adv-buy-bp="${bp.key}" ${adv.tokens >= bp.price ? "" : "disabled"}>Buy · ${bp.price} 🐟</button>`}</div>`;
    }).join("")}
    <div class="adv-note">A blueprint is a one-time purchase — unlocked for good, workable in the Crafthouse.</div>

    <div class="adv-section">Trinket buy-back</div>
    ${
      trinkets.length
        ? trinkets
            .map(
              ([k, qty]) => `<div class="adv-row"><span><b>${esc(ADV_TRINKETS[k].label)}</b> <span class="adv-note">× ${qty}</span></span>
        <button class="adv-btn" data-adv-sell-trinket="${k}">Sell one · ${ADV_TRINKETS[k].price} 🐟</button></div>`
            )
            .join("")
        : `<div class="adv-note">No trinkets to sell yet — folk on the notice board sometimes pay with them.</div>`
    }`;
}
