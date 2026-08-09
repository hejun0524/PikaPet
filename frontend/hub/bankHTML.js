// hub/bankHTML.js

import { state } from "./state.js";
import { SAVINGS_APR, LOAN_APR, LOAN_LIMIT } from "../items.js";

/**
 * The Pet Bank page: pocket/savings/loan/net-worth numbers, an amount input,
 * and deposit/withdraw/borrow/repay buttons.
 *
 * @returns {string} Page HTML for the grid.
 */
export function bankHTML() {
  return `
    <div class="settings-card">
      <div class="gov-note">🏦 Pet Bank — savings earn ${(SAVINGS_APR * 100).toFixed(1)}% APR,
      loans cost ${(LOAN_APR * 100).toFixed(1)}% APR (both compound daily). Loan limit 💰${LOAN_LIMIT.toLocaleString()}.</div>
      <div class="settings-row"><label>💰 Pocket</label><span id="bank-pocket" class="bank-num">${state.coins.toLocaleString()}</span></div>
      <div class="settings-row"><label>🏦 Savings</label><span id="bank-savings" class="bank-num">${state.bank.savings.toLocaleString()}</span></div>
      <div class="settings-row"><label>💳 Loan</label><span id="bank-loan" class="bank-num">${state.bank.loan.toLocaleString()}</span></div>
      <div class="settings-row"><label>📈 Net worth</label><span id="bank-net" class="bank-num">${(state.coins + state.bank.savings - state.bank.loan).toLocaleString()}</span></div>
      <div class="settings-row">
        <label for="bank-amount">Amount</label>
        <input type="number" id="bank-amount" min="1" placeholder="0" />
      </div>
      <div class="settings-actions">
        <button id="bank-deposit">Deposit</button>
        <button id="bank-withdraw">Withdraw</button>
        <button id="bank-borrow">Borrow</button>
        <button id="bank-repay">Repay</button>
      </div>
    </div>`;
}
