// setup.js — entry point for the first-run setup window: pick a species
// (free), name the pet, set what it calls you. On Start, the stats window
// initializes + saves the game state, then finish_setup reveals the pet.
//
// Each function lives in its own file under setup/; this file only wires
// them together.

import { setLanguage } from "./shared/i18n.js";
import { applyStaticText } from "./setup/applyStaticText.js";
import { renderCards } from "./setup/renderCards.js";
import { refreshStart } from "./setup/refreshStart.js";
import { initEvents } from "./setup/initEvents.js";

setLanguage("auto"); // no save yet — follow the system language
applyStaticText();
initEvents();
renderCards();
refreshStart();
