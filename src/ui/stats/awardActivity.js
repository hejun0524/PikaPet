// stats/awardActivity.js — Activities: hand out an activity's rewards,
// prorated by the completed fraction.

import { CAREER_MAX_XP, tiersCompleted } from "../career.js";
import { advanceSubject } from "../school.js";
import {
  ALL_CITIES,
  ALL_TEAMS,
  cityDestination,
  findPlace,
  isLeagueKey,
  pickRandomCities,
} from "../touring.js";
import { CITY_DISHES, RECIPE_DROP_CHANCE, findRecipe, recipeName } from "../kitchen.js";
import { emit } from "../shared/tauri.js";
import { t } from "../shared/i18n.js";
import { pet } from "./state.js";
import { bumpTaskProgress } from "./bumpTaskProgress.js";
import { tourVisitCount } from "./tourVisitCount.js";
import { awardTouringCerts } from "./awardTouringCerts.js";
import { careerCert } from "./careerCert.js";
import { degreeCert } from "./degreeCert.js";
import { traitOf } from "./traitOf.js";
import { jobPayMultiplier } from "./traitBoost.js";

/**
 * Grant the rewards for an activity: tours mark cities visited + souvenirs +
 * a journal entry (and fully recharge care); jobs pay coins + career XP
 * (tier achievements at level caps); classes add credits + trait rewards
 * (degree achievements on finished stages).
 * Side effects: mutates pet (touring, souvenirs, care, coins, career xp,
 * school subjects, achievements, journals). Does not save or broadcast —
 * callers do.
 *
 * @param {{type: string, key: string}} active - The (just-)active entry.
 * @param {object} def - Its catalog definition (see activityDef).
 * @param {number} fraction - Completed fraction of the activity (0..1).
 * @returns {void}
 */
export function awardActivity(active, def, fraction) {
  if (active.type === "tour") {
    const count = tourVisitCount(def, fraction);
    if (count > 0) {
      // Mystery packages (destKey null) draw from every city in the world;
      // mystery sports tours draw from every team of every league.
      const pool = def.destKey
        ? findPlace(def.destKey).cities
        : def.kind === "sport"
          ? ALL_TEAMS
          : ALL_CITIES;
      const cities = def.kind === "flight" ? [def.city] : pickRandomCities(pool, count);
      const touched = [];
      for (const city of cities) {
        const destKey = cityDestination(city).key;
        touched.push(destKey);
        if (!pet.touring.visited[destKey].includes(city)) {
          pet.touring.visited[destKey].push(city);
        }
        pet.souvenirs[city] = (pet.souvenirs[city] ?? 0) + 1;
      }
      awardTouringCerts(touched);
      // Souvenir recipes: each visited city may teach its signature dish.
      const learned = [];
      for (const city of cities) {
        const recipeKey = `dish:${city}`;
        if (
          CITY_DISHES[city] &&
          !pet.kitchen.recipes.includes(recipeKey) &&
          Math.random() < RECIPE_DROP_CHANCE
        ) {
          pet.kitchen.recipes.push(recipeKey);
          learned.push(recipeKey);
        }
      }
      if (learned.length) {
        emit("pet-say", {
          text: t("bubble.recipe", {
            dish: recipeName(findRecipe(learned[0])),
            callMe: pet.callMe,
          }),
          ms: 8000,
        });
      }
      // A paid trip fully recharges the pet: back home rested and happy.
      for (const meter of pet.care) meter.value = meter.max;
      const now = new Date();
      pet.touring.journals.unshift({
        date: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`,
        destination: def.destKey ?? (def.kind === "sport" ? "sports" : "world"),
        cities,
      });
      // Dune's Daily Tasks: only a fully-completed tour counts (not an
      // early call-back), so this sits inside the count > 0 branch, gated
      // below on fraction >= 1.
      if (fraction >= 1) {
        bumpTaskProgress("tour.any");
        bumpTaskProgress(def.kind === "sport" || isLeagueKey(def.destKey) ? "tour.sport" : "tour.city");
      }
    }
    return;
  }
  if (active.type === "job") {
    // Talent bonus: the career's focus trait raises pay (traitBoost.js).
    pet.coins += Math.round(def.pay * fraction * jobPayMultiplier(def));
    const oldXp = pet.career.xp[def.career] ?? 0;
    const newXp = Math.min(CAREER_MAX_XP, oldXp + Math.floor(def.xp * fraction));
    pet.career.xp[def.career] = newXp;
    // Completing a tier (level 5 cap) earns an achievement.
    for (let tier = tiersCompleted(oldXp); tier < tiersCompleted(newXp); tier++) {
      pet.achievements.push(careerCert(def.career, tier));
    }
    if (fraction >= 1) bumpTaskProgress("work.any"); // Dune's Daily Tasks
    return;
  }
  const subject = pet.school.subjects[def.subject];
  subject.credits += Math.floor(def.credits * fraction);
  for (const [stat, amount] of Object.entries(def.rewards)) {
    const trait = traitOf(stat);
    if (trait) trait.value += Math.floor(amount * fraction);
  }
  // Finished stages become framed certificates on the achievements page.
  for (const stageKey of advanceSubject(subject)) {
    pet.achievements.push(degreeCert(def.subject, stageKey));
  }
  if (fraction >= 1) bumpTaskProgress("study.any"); // Dune's Daily Tasks
}
