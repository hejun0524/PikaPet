// hub/refreshGovApply.js

import { t } from "../shared/i18n.js";
import { state } from "./state.js";
import { GOV_FEE } from "./constants.js";

/**
 * Enable/disable the Registry's Apply button: enabled only when an input
 * differs from the current record and the fee is affordable. No-op when the
 * Registry page isn't rendered.
 *
 * Side effects: updates #gov-apply's disabled state and label.
 *
 * @returns {void}
 */
export function refreshGovApply() {
  const btn = document.getElementById("gov-apply");
  const nameInput = document.getElementById("gov-name");
  const callMeInput = document.getElementById("gov-callme");
  if (!btn || !nameInput || !callMeInput) return;
  const name = nameInput.value.trim();
  const callMe = callMeInput.value.trim();
  const changed = (name && name !== state.name) || (callMe && callMe !== state.callMe);
  btn.disabled = !changed || state.coins < GOV_FEE;
  btn.textContent =
    state.coins < GOV_FEE ? t("cart.noCoins") : t("registry.apply", { fee: GOV_FEE });
}
