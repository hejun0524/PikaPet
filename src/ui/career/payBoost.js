// career/payBoost.js — Talent bonus: a career's focus trait raises its pay.

/** Trait points beyond this stop increasing job pay. */
export const PAY_BOOST_TRAIT_CAP = 50;

/**
 * Extra pay earned from talent: +1% per point of the career's focus trait,
 * capped at +50%. Pure math — callers pass the trait's current value.
 *
 * @param {number} traitValue - Current value of the career's focus trait.
 * @returns {number} Whole-percent bonus, 0..50.
 */
export function payBoostPercent(traitValue) {
  return Math.min(PAY_BOOST_TRAIT_CAP, Math.max(0, Math.floor(traitValue ?? 0)));
}
