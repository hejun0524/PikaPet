// stats/applyBankInterest.js — Bank: daily compound interest on savings and
// loans (deposit/withdraw/borrow/repay live in the "bank-op" event handler).

import { LOAN_APR, SAVINGS_APR } from "../items.js";
import { pet } from "./state.js";

/**
 * Compound daily interest on pet.bank for each full day since the stored
 * bank date, then stamp today. First call only stamps the date.
 * Side effects: mutates pet.bank. Does not save or broadcast — callers do.
 *
 * @returns {boolean} True if any interest was applied, false otherwise.
 */
export function applyBankInterest() {
  const today = new Date().toISOString().slice(0, 10);
  if (!pet.bank.date) {
    pet.bank.date = today;
    return false;
  }
  if (pet.bank.date === today) return false;
  const days = Math.max(
    0,
    Math.round((Date.parse(today) - Date.parse(pet.bank.date)) / 86400000)
  );
  if (days > 0) {
    pet.bank.savings = Math.round(pet.bank.savings * Math.pow(1 + SAVINGS_APR / 365, days));
    pet.bank.loan = Math.round(pet.bank.loan * Math.pow(1 + LOAN_APR / 365, days));
  }
  pet.bank.date = today;
  return days > 0;
}
