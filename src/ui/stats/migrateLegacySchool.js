// stats/migrateLegacySchool.js — Pre-redesign saves tracked one global
// {stage, year, credits}; convert that into per-subject progress.

import { SCHOOL_STAGES, SUBJECTS, TOTAL_SCHOOL_YEARS } from "../school.js";
import { pet } from "./state.js";
import { jlog } from "./jlog.js";

/**
 * One-time migration of the legacy single-track school format: derive the
 * completed-years count from the old {stage, year} pair and apply it to
 * every subject.
 * Side effects: overwrites pet.school.subjects (mutates pet); logs via jlog.
 *
 * @param {{stage: string, year?: number, credits?: number}} old - The legacy
 *   `school` object from the save file.
 * @returns {void}
 */
export function migrateLegacySchool(old) {
  let years = 0;
  if (old.stage === "graduated") {
    years = TOTAL_SCHOOL_YEARS;
  } else {
    for (const stage of SCHOOL_STAGES) {
      if (stage.key === old.stage) {
        years += Math.max(0, (old.year ?? 1) - 1);
        break;
      }
      years += stage.years;
    }
  }
  // One school year came from an internal test injection (2026-08-05), not
  // real play; remove it during this one-time migration.
  years = Math.max(0, years - 1);
  for (const subject of SUBJECTS) {
    pet.school.subjects[subject.key] = { years, credits: 0 };
  }
  jlog(`migrated legacy school progress -> ${years} completed years per subject`);
}
