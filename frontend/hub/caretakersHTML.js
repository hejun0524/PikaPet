// hub/caretakersHTML.js

import { caretakingStatusRowHTML } from "./caretakingStatusRowHTML.js";
import { caretakerCardHTML } from "./caretakerCardHTML.js";
import { CARETAKERS } from "../items.js";

/**
 * The Caretakers page: the on-duty status row, a how-it-works note, and one
 * card per caretaker service.
 *
 * @returns {string} Page HTML for the grid.
 */
export function caretakersHTML() {
  return (
    `<div class="school-head">${caretakingStatusRowHTML()}</div>` +
    `<div class="ach-section caretaker-title">🧑‍🍼 Caretaker services — stage shifts, then hire via the 🛎️ basket. A shift charges when it starts and refunds prorated if ended early.</div>` +
    CARETAKERS.map(caretakerCardHTML).join("")
  );
}
