// stats/traitBoost.js — Talent bonuses applied to the live pet: traits feed
// back into the economy. Pay math lives in career/payBoost.js, study math in
// school/studyBoost.js (the hub imports those directly to display the same
// numbers); these wrappers just look up the pet's current trait values.

import { findCareer, payBoostPercent } from "../career.js";
import { SUBJECT_TRAIT, studyBoostPercent } from "../school.js";
import { traitOf } from "./traitOf.js";

/**
 * Pay multiplier for a job: 1 + payBoostPercent of the career's focus trait
 * (e.g. a Charm-40 chef earns ×1.40). Read at payout time.
 *
 * @param {object} def - The job's catalog definition (has `career`).
 * @returns {number} Multiplier ≥ 1.
 */
export function jobPayMultiplier(def) {
  const focus = findCareer(def.career)?.trait;
  return 1 + payBoostPercent(traitOf(focus)?.value) / 100;
}

/**
 * Duration multiplier for a class: 1 − studyBoostPercent of the subject's
 * trait (a smart pet finishes Math sooner, a fit pet blazes through
 * Sports — see SUBJECT_TRAIT). Read once when the class starts.
 *
 * @param {object} def - The class's catalog definition (has `subject`).
 * @returns {number} Multiplier in (0, 1].
 */
export function classSpeedMultiplier(def) {
  return 1 - studyBoostPercent(traitOf(SUBJECT_TRAIT[def.subject])?.value) / 100;
}
