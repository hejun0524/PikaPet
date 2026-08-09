// stats/backfillAchievements.js — Grant any achievement the current progress
// already implies (also repairs saves from before the achievements feature
// existed).

import { CAREERS, tiersCompleted } from "../career.js";
import { SCHOOL_STAGES, SUBJECTS, stageEndYears } from "../school.js";
import { ALL_PLACES } from "../touring.js";
import { pet } from "./state.js";
import { awardTouringCerts } from "./awardTouringCerts.js";
import { careerCert } from "./careerCert.js";
import { degreeCert } from "./degreeCert.js";

/**
 * Scan touring, school, and career progress and push every missing implied
 * achievement (Explorer certs, diplomas, mastered career tiers).
 * Side effects: may push onto pet.achievements (mutates pet). Does not save
 * or broadcast — callers do.
 *
 * @returns {void}
 */
export function backfillAchievements() {
  awardTouringCerts(ALL_PLACES.map((p) => p.key));
  for (const subject of SUBJECTS) {
    const years = pet.school.subjects[subject.key]?.years ?? 0;
    for (const stage of SCHOOL_STAGES) {
      if (years < stageEndYears(stage.key)) continue;
      const exists = pet.achievements.some(
        (a) => a.type === "degree" && a.subject === subject.key && a.stage === stage.key
      );
      if (!exists) pet.achievements.push(degreeCert(subject.key, stage.key));
    }
  }
  for (const career of CAREERS) {
    const done = tiersCompleted(pet.career.xp[career.key] ?? 0);
    for (let tier = 0; tier < done; tier++) {
      const exists = pet.achievements.some(
        (a) => a.type === "career" && a.career === career.key && a.tier === tier
      );
      if (!exists) pet.achievements.push(careerCert(career.key, tier));
    }
  }
}
