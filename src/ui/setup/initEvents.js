// setup/initEvents.js — event wiring for the first-run setup window.

import { invoke, emit } from "../shared/tauri.js";
import { findSpecies } from "../items.js";
import { setupUi } from "./state.js";
import { renderCards } from "./renderCards.js";
import { refreshStart } from "./refreshStart.js";

/**
 * Attach all event listeners of the setup window: species-card selection,
 * name-input validation, the Start button (emits "setup-complete", then
 * reveals the pet via `finish_setup`), the Quit button, and context-menu
 * suppression.
 *
 * @returns {void} Registers DOM listeners; call once at startup.
 */
export function initEvents() {
  document.getElementById("species-cards").addEventListener("click", (e) => {
    const card = e.target.closest("[data-species]");
    if (!card) return;
    // Follow the species' default name unless the user typed their own.
    const nameInput = document.getElementById("setup-name");
    const untouched = nameInput.value.trim() === findSpecies(setupUi.chosen).defaultName;
    setupUi.chosen = card.dataset.species;
    if (untouched || !nameInput.value.trim()) {
      nameInput.value = findSpecies(setupUi.chosen).defaultName;
    }
    renderCards();
    refreshStart();
  });

  document.getElementById("setup-name").addEventListener("input", refreshStart);

  document.getElementById("setup-start").addEventListener("click", () => {
    const name = document.getElementById("setup-name").value.trim().slice(0, 20);
    const callMe = document.getElementById("setup-callme").value.trim().slice(0, 12) || "Owner";
    if (!name) return;
    emit("setup-complete", { species: setupUi.chosen, name, callMe });
    // Give the stats window a beat to persist before revealing the pet.
    setTimeout(() => invoke("finish_setup"), 400);
  });

  document.getElementById("setup-quit").addEventListener("click", () => invoke("quit"));

  window.addEventListener("contextmenu", (e) => e.preventDefault());
}
