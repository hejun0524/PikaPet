// hub/bankHTML.js

import { t } from "../shared/i18n.js";
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
      <div class="gov-note">${t("bank.note", {
        savings: (SAVINGS_APR * 100).toFixed(1),
        loan: (LOAN_APR * 100).toFixed(1),
        limit: LOAN_LIMIT.toLocaleString(),
      })}</div>
      <div class="settings-row"><label>${t("bank.pocket")}</label><span id="bank-pocket" class="bank-num">${state.coins.toLocaleString()}</span></div>
      <div class="settings-row"><label>${t("bank.savings")}</label><span id="bank-savings" class="bank-num">${state.bank.savings.toLocaleString()}</span></div>
      <div class="settings-row"><label>${t("bank.loan")}</label><span id="bank-loan" class="bank-num">${state.bank.loan.toLocaleString()}</span></div>
      <div class="settings-row"><label>${t("bank.net")}</label><span id="bank-net" class="bank-num">${(state.coins + state.bank.savings - state.bank.loan).toLocaleString()}</span></div>
      <div class="settings-row">
        <label for="bank-amount">${t("bank.amount")}</label>
        <input type="number" id="bank-amount" min="1" placeholder="0" />
      </div>
      <div class="settings-actions">
        <button id="bank-deposit">${t("bank.deposit")}</button>
        <button id="bank-withdraw">${t("bank.withdraw")}</button>
        <button id="bank-borrow">${t("bank.borrow")}</button>
        <button id="bank-repay">${t("bank.repay")}</button>
      </div>
    </div>`;
}
