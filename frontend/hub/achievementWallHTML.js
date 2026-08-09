// hub/achievementWallHTML.js

import { state, ui } from "./state.js";
import { SUBJECTS, SCHOOL_STAGES } from "../school.js";
import { CAREERS, TIERS } from "../career.js";
import { DESTINATIONS, SPORT_LEAGUES } from "../touring.js";
import { achRowHTML } from "./achRowHTML.js";
import { touringAchRows } from "./touringAchRows.js";

/**
 * The achievement wall for the active Achievements tab: degrees, career
 * tiers, world touring, or sports touring.
 *
 * @returns {string} Page HTML for the grid.
 */
export function achievementWallHTML() {
  const rows = [];
  if (ui.achTab === "degrees") {
    for (const subject of SUBJECTS) {
      rows.push(`<div class="ach-section">${subject.emoji} ${subject.label}</div>`);
      for (const stage of SCHOOL_STAGES) {
        const earned = state.achievements.find(
          (a) => a.type === "degree" && a.subject === subject.key && a.stage === stage.key
        );
        rows.push(achRowHTML(subject.emoji, `${stage.label} Diploma in ${subject.label}`, earned));
      }
    }
  } else if (ui.achTab === "careers") {
    for (const career of CAREERS) {
      rows.push(`<div class="ach-section">${career.emoji} ${career.label}</div>`);
      TIERS.forEach((tier, i) => {
        const earned = state.achievements.find(
          (a) => a.type === "career" && a.career === career.key && a.tier === i
        );
        rows.push(achRowHTML(career.emoji, `${career.label} · ${tier.name} Tier Mastered`, earned));
      });
    }
  } else if (ui.achTab === "touring") {
    rows.push(`<div class="ach-section">🗺️ World Explorer</div>`);
    rows.push(...touringAchRows(DESTINATIONS));
  } else {
    rows.push(`<div class="ach-section">🏟️ League Completionist</div>`);
    rows.push(...touringAchRows(SPORT_LEAGUES));
  }
  return `<div class="ach-list">${rows.join("")}</div>`;
}
