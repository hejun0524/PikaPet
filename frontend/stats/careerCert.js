// stats/careerCert.js

import { TIERS, findCareer } from "../career.js";

/**
 * Build a career achievement record for mastering one tier of a career
 * (reaching that tier's level-5 XP cap).
 *
 * @param {string} careerKey - Career key (see CAREERS).
 * @param {number} tierIndex - Index into TIERS of the mastered tier.
 * @returns {{type: "career", career: string, tier: number, emoji: string,
 *   label: string, date: string}} New achievement object (dated today).
 */
export function careerCert(careerKey, tierIndex) {
  const career = findCareer(careerKey);
  return {
    type: "career",
    career: careerKey,
    tier: tierIndex,
    emoji: career.emoji,
    label: `${career.label} · ${TIERS[tierIndex].name} Tier Mastered`,
    date: new Date().toISOString().slice(0, 10),
  };
}
