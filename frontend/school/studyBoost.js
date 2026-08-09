// school/studyBoost.js — Talent bonus: a class's trait shortens its duration.

/** Trait points beyond this stop speeding up classes. */
export const STUDY_BOOST_TRAIT_CAP = 50;

/**
 * How much faster a class finishes thanks to talent: −0.5% duration per
 * point of the class's primary reward trait, capped at −25%. Pure math —
 * callers pass the trait's current value.
 *
 * @param {number} traitValue - Current value of the class's reward trait.
 * @returns {number} Whole-percent reduction, 0..25.
 */
export function studyBoostPercent(traitValue) {
  return Math.floor(Math.min(STUDY_BOOST_TRAIT_CAP, Math.max(0, traitValue ?? 0)) / 2);
}
