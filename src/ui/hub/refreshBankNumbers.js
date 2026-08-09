// hub/refreshBankNumbers.js — Live-update the bank numbers without rebuilding
// the form (keeps typing).

import { state } from "./state.js";

/**
 * Refresh the pocket/savings/loan/net-worth figures on the Bank page in
 * place. No-op for any element that isn't rendered.
 *
 * Side effects: rewrites the #bank-* number spans.
 *
 * @returns {void}
 */
export function refreshBankNumbers() {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value.toLocaleString();
  };
  set("bank-pocket", state.coins);
  set("bank-savings", state.bank.savings);
  set("bank-loan", state.bank.loan);
  set("bank-net", state.coins + state.bank.savings - state.bank.loan);
}
