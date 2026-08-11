// fightclub/odds.js — Darcy's book: estimates a fight's win probability
// from both fighters' cards (traits AND skill sets, per the user design)
// and quotes it as American / moneyline odds, DraftKings-style. Betting on
// your own pet pays the moneyline profit on a win and forfeits the stake on
// a loss.

/**
 * A single power score for a fighter: offense (attack, crits, double turns,
 * active skills) times survivability (current HP, guard, dodge, passive
 * skills). Only used comparatively, never shown raw.
 *
 * @param {object} f - Fighter (fighters.js). Uses CURRENT hp, so a wounded
 *   pet gets worse odds.
 * @returns {number} Power score (> 0).
 */
export function fighterPower(f) {
  const activeLv = f.skills.filter((e) => e.s.kind === "active").reduce((s, e) => s + e.lv, 0);
  const passiveLv = f.skills.filter((e) => e.s.kind === "passive").reduce((s, e) => s + e.lv, 0);
  const offense = f.atk * (1 + 2 * f.crit) * (1 + f.dbl) * (1 + 0.05 * activeLv * f.skillMult);
  const survival = (Math.max(1, f.hp) / (1 - Math.min(0.75, f.def))) * (1 + f.dodge) * (1 + 0.04 * passiveLv);
  return offense * survival;
}

/**
 * Estimated probability that the pet beats the challenger.
 *
 * @param {object} petF - Pet fighter.
 * @param {object} oppF - Challenger fighter.
 * @returns {number} Probability clamped to [0.05, 0.95].
 */
export function winProbability(petF, oppF) {
  // Sharpened power ratio: mismatches snowball in a turn-based slugfest
  // (better guard AND better attack compound each round), so the raw ratio
  // badly understates how one-sided lopsided fights are.
  const a = fighterPower(petF) ** 2.2;
  const b = fighterPower(oppF) ** 2.2;
  return Math.min(0.95, Math.max(0.05, a / (a + b)));
}

/**
 * American (moneyline) odds for a win probability: favorites are negative
 * ("risk 150 to win 100"), underdogs positive ("risk 100 to win 150").
 * Rounded to the nearest 5 like a real sportsbook board.
 *
 * @param {number} p - Win probability (0..1).
 * @returns {number} Moneyline, always ≤ −100 or ≥ +100.
 */
export function moneyline(p) {
  if (p >= 0.5) return -Math.max(100, Math.round((p / (1 - p)) * 100 / 5) * 5);
  return Math.max(100, Math.round(((1 - p) / p) * 100 / 5) * 5);
}

/**
 * Profit paid on a winning bet at the given moneyline (stake comes back on
 * top of this).
 *
 * @param {number} bet - Stake in coins.
 * @param {number} ml - Moneyline (moneyline()).
 * @returns {number} Profit in coins.
 */
export function betProfit(bet, ml) {
  return ml < 0 ? Math.round((bet * 100) / -ml) : Math.round((bet * ml) / 100);
}

/**
 * A moneyline with its conventional sign ("+150" / "−200").
 *
 * @param {number} ml - Moneyline.
 * @returns {string} Display string.
 */
export function formatMoneyline(ml) {
  return ml > 0 ? `+${ml}` : `${ml}`;
}
