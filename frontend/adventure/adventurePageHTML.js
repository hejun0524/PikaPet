// adventure/adventurePageHTML.js

import { escText as esc } from "../panel.js";
import { adv, advUi } from "./state.js";
import { advCraftsHTML } from "./advCraftsHTML.js";
import { advDarcyHTML } from "./advDarcyHTML.js";
import { advGuildHTML } from "./advGuildHTML.js";
import { advGuildLevel } from "./advGuildLevel.js";
import { advNoonieHTML } from "./advNoonieHTML.js";
import { advPikaHTML } from "./advPikaHTML.js";
import { advProcess } from "./advProcess.js";
import { advStoreHTML } from "./advStoreHTML.js";
import { advTokensHTML } from "./advTokensHTML.js";
import { advWorldHTML } from "./advWorldHTML.js";

/**
 * Render the whole Adventure page: advances the simulation via advProcess()
 * (which may mutate `adv` and save), then draws the guild header and the
 * body of the active tab (`advUi.tab`, Guild by default).
 *
 * @param {string} petName - The pet's name (guild title).
 * @returns {string} HTML for the full adventure page.
 */
export function adventurePageHTML(petName) {
  advProcess();
  const pages = {
    world: advWorldHTML,
    store: advStoreHTML,
    crafts: advCraftsHTML,
    pika: advPikaHTML,
    darcy: advDarcyHTML,
    noonie: advNoonieHTML,
  };
  const body = (pages[advUi.tab] ?? (() => advGuildHTML(petName)))();
  return `
    <div class="adv-wrap">
      <div class="adv-top">
        <span class="adv-guild">${esc(petName)}'s Guild</span>
        <span class="adv-top-meta">Guild level ${advGuildLevel()} · ${adv.completed} notices answered · <b>${advTokensHTML()}</b></span>
      </div>
      ${body}
    </div>`;
}
