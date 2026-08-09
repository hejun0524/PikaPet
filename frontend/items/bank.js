// items/bank.js — Pet Bank constants (Pet Center tab): savings earn interest,
// loans cost more, both compounding daily. Coins elsewhere always mean
// pocket cash.

/** Yearly interest rate paid on savings (compounds daily). */
export const SAVINGS_APR = 0.05;

/** Yearly interest rate charged on loans (compounds daily). */
export const LOAN_APR = 0.15;

/** Maximum total loan the bank will extend, in coins. */
export const LOAN_LIMIT = 50000;
