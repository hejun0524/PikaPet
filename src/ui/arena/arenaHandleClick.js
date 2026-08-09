// arena/arenaHandleClick.js — click handling for the Arena page.

import { arenaUi } from "./state.js";
import { makeRival } from "./makeRival.js";
import { fightCardFromPet } from "./fightCardFromPet.js";
import { cardFromFightCode } from "./fightCode.js";

/**
 * Handle a click inside the Arena page (delegated from the hub's #grid
 * listener, like the adventure). Mutates arenaUi; the caller re-renders
 * when this returns true.
 *
 * @param {MouseEvent} e - The grid click event.
 * @param {object} petState - The hub's state mirror.
 * @returns {boolean} True if the click was handled (caller repaints).
 */
export function arenaHandleClick(e, petState) {
  if (e.target.closest("[data-arena-new-rival]")) {
    arenaUi.rival = makeRival(fightCardFromPet(petState));
    return true;
  }
  if (e.target.closest("[data-arena-import]")) {
    const card = cardFromFightCode(document.getElementById("arena-code-in")?.value);
    if (card) {
      arenaUi.rival = card;
      return true; // repaint shows the friend's card in the rival slot
    }
    const note = document.getElementById("arena-import-note");
    if (note) note.textContent = "That code doesn't look right — copy the whole thing.";
    return false; // keep the pasted text for the user to fix
  }
  if (e.target.closest("[data-arena-fight]")) {
    // Disabled until simulateBattle lands; nothing to do.
    return false;
  }
  return false;
}
