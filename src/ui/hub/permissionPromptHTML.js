// hub/permissionPromptHTML.js — Marketplace tab: shows a registry entry's
// declared permissions before installing (like a mobile app permission
// prompt), following the same confirm-before-proceeding card pattern as
// resetConfirmHTML.js.

import { t } from "../shared/i18n.js";
import { ui } from "./state.js";
import { escText as esc } from "../panel.js";

/** Human-readable description per catalog permission (see manifest.rs::PERMISSIONS). */
const PERMISSION_LABELS = {
  "dialog:pickFolder": "extmarket.permDialogPickFolder",
  "fs:read:workspace": "extmarket.permFsReadWorkspace",
  "notifications:show": "extmarket.permNotificationsShow",
  "windows:open": "extmarket.permWindowsOpen",
  "widgets:show": "extmarket.permWidgetsShow",
  "system:keepAwake": "extmarket.permSystemKeepAwake",
  "network:fetch": "extmarket.permNetworkFetch",
};

/**
 * The permission-confirmation card for `ui.marketPermissionPrompt` (a
 * registry entry) — lists what it's asking for, or a "nothing declared"
 * note if its `permissions` array is empty.
 *
 * @returns {string} Card HTML for the grid.
 */
export function permissionPromptHTML() {
  const entry = ui.marketPermissionPrompt;
  if (!entry) return "";
  const permissions = Array.isArray(entry.permissions) ? entry.permissions : [];
  const rows = permissions.length
    ? permissions.map((p) => `<li>${esc(t(PERMISSION_LABELS[p] ?? "extmarket.permUnknown", { key: p }))}</li>`).join("")
    : `<li>${t("extmarket.permNone")}</li>`;
  return `
    <div class="settings-plain">
      <div class="ach-section">${t("extmarket.permTitle", { name: esc(entry.name ?? entry.id) })}</div>
      <div class="gov-note">${t("extmarket.permIntro")}</div>
      <ul class="perm-list">${rows}</ul>
      <div class="settings-actions">
        <button id="market-perm-cancel">${t("extmarket.permCancel")}</button>
        <button id="market-perm-confirm" class="danger">${t("extmarket.permConfirm")}</button>
      </div>
    </div>`;
}
