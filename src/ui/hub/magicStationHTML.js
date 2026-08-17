// hub/magicStationHTML.js — the Magic Station in three sections:
//   🐾 Classic Companions — the purchasable species catalog
//   🌟 Legendary Cats — Pika / Darcy / Noonie, earned (never sold; see
//      items/specialForms.js for the developer guide on adding one)
//   🎨 My Own Creations — user-uploaded spritesheets, unlocked for a fee

import { t } from "../shared/i18n.js";
import { speciesBreed } from "../shared/names.js";
import { state, ui } from "./state.js";
import {
  CUSTOM_FORM_PRICE,
  SPECIES,
  SPECIAL_SPECIES,
  findForm,
  specialFormProgress,
} from "../items.js";
import { escText as esc } from "../panel.js";
import { formInfo } from "./formInfo.js";

/**
 * The Magic Station page: either the purchase-confirmation card for
 * `ui.pendingMagic`, or the three form sections plus the
 * create-your-own-form card.
 *
 * @returns {string} Page HTML for the grid.
 */
export function magicStationHTML() {
  // Stale guard: the form may have been deleted from another window/tab.
  if (ui.deleteFormPending && !(state.customForms ?? []).some((c) => c.key === ui.deleteFormPending)) {
    ui.deleteFormPending = null;
  }
  if (ui.deleteFormPending) return deleteConfirmHTML();
  if (ui.pendingMagic) return confirmHTML();
  if (ui.createPending) return createFormHTML();

  const classic = SPECIES.map((s) => formCardHTML(s.key, `💰${s.price}`, t("magic.purchase"))).join("");

  const legends = SPECIAL_SPECIES.map((s) => {
    const progress = specialFormProgress(s.special, state);
    const unlocked = progress.have >= progress.need;
    if (state.forms.includes(s.key) || !unlocked) {
      // Owned/current cards render normally; locked ones show the quest.
      const condKey = `magic.cond${s.special[0].toUpperCase()}${s.special.slice(1)}`;
      return formCardHTML(s.key, "🔒", t(condKey, progress), !unlocked);
    }
    return formCardHTML(s.key, "✨", t("magic.specialReady"));
  }).join("");

  const customs = (state.customForms ?? [])
    .map((c) => formCardHTML(c.key, `💰${CUSTOM_FORM_PRICE}`, t("magic.purchase"), false, true))
    .join("");
  const createCard = `
      <div class="item" id="create-form">
        <span class="qty">➕</span>
        <span class="icon">🖼️</span>
        <span class="name">${t("magic.createOwn")}</span>
        <span class="effects">${t("magic.createHint", { fee: CUSTOM_FORM_PRICE })}</span>
      </div>`;

  return (
    `<div class="ach-section caretaker-title">${t("magic.note")}${
      ui.magicMsg ? `<br/><b>${esc(ui.magicMsg)}</b>` : ""
    }</div>` +
    `<div class="ach-section">${t("magic.sectionClassic")}</div>` +
    classic +
    `<div class="ach-section">${t("magic.sectionLegend")}</div>` +
    legends +
    `<div class="ach-section">${t("magic.sectionCustom")}</div>` +
    customs +
    createCard
  );
}

/**
 * One form card. Current/owned states win over the passed badge/line;
 * `locked` renders the card disabled (unmet legendary condition); `deletable`
 * (custom forms only) adds a 🗑️ button independent of the disabled state —
 * a custom creation can be deleted even while it's the active species.
 */
function formCardHTML(key, badge, line, locked = false, deletable = false) {
  const info = formInfo(key);
  const current = key === state.species;
  const owned = state.forms.includes(key);
  const shownBadge = current
    ? `<span class="qty">${t("magic.now")}</span>`
    : owned
      ? `<span class="qty">${t("magic.owned")}</span>`
      : `<span class="qty ${badge.startsWith("💰") ? "price" : ""}">${badge}</span>`;
  const shownLine = current ? t("magic.current") : owned ? t("magic.switch") : line;
  const clickable = !current && !locked;
  return `
      <div class="item ${current || locked ? "disabled" : ""}" ${clickable ? `data-magic="${esc(key)}"` : ""}>
        ${
          deletable
            ? `<button class="form-delete" data-delete-form="${esc(key)}" title="${t("magic.delete")}">🗑️</button>`
            : ""
        }
        ${shownBadge}
        <span class="species-thumb" style="background-image:url('${info.sheet}')"></span>
        <span class="name">${esc(info.breed)}</span>
        <span class="effects">${shownLine}</span>
      </div>`;
}

/** The delete-confirmation card for `ui.deleteFormPending` (a custom form). */
function deleteConfirmHTML() {
  const key = ui.deleteFormPending;
  const info = formInfo(key);
  const owned = state.forms.includes(key);
  return `
      <div class="settings-card">
        <div class="gov-note">${t("magic.deleteConfirmQ", { breed: esc(info.breed) })}</div>
        ${owned ? `<div class="gov-note"><b>${t("magic.deleteWarn", { fee: CUSTOM_FORM_PRICE })}</b></div>` : ""}
        <div class="magic-confirm-row">
          <span class="species-thumb" style="background-image:url('${info.sheet}')"></span>
        </div>
        <div class="settings-actions">
          <button id="delete-form-cancel">${t("magic.cancel")}</button>
          <button id="delete-form-confirm">${t("magic.delete")}</button>
        </div>
      </div>`;
}

/** "Create My Own Form" step 1: name the breed, then pick the spritesheet. */
function createFormHTML() {
  return `
      <div class="settings-card">
        <div class="gov-note">${t("magic.createOwn")} — ${t("magic.createHint", { fee: CUSTOM_FORM_PRICE })}</div>
        <div class="settings-row">
          <label for="create-name">${t("magic.createNameQ")}</label>
          <input type="text" id="create-name" maxlength="40" placeholder="${t("magic.createNamePh")}" />
        </div>
        <div class="settings-actions">
          <button id="create-cancel">${t("magic.cancel")}</button>
          <button id="create-continue">${t("magic.createContinue")}</button>
        </div>
      </div>`;
}

/** The purchase confirmation for a classic or custom form. */
function confirmHTML() {
  const key = ui.pendingMagic;
  const info = formInfo(key);
  const fee = findForm(key)?.price ?? CUSTOM_FORM_PRICE;
  return `
      <div class="settings-card">
        <div class="gov-note">${t("magic.confirm")}</div>
        <div class="magic-confirm-row">
          <span class="species-thumb" style="background-image:url('${info.sheet}')"></span>
          <div>
            <b>${t("magic.confirmQ", { breed: esc(info.breed), name: esc(state.name) })}</b><br/>
            <span class="gov-note">${t("magic.confirmLine", {
              fee,
              name: esc(state.name),
              breed: esc(info.breed),
            })}</span>
          </div>
        </div>
        <div class="settings-actions">
          <button id="magic-cancel">${t("magic.cancel")}</button>
          <button id="magic-confirm" ${state.coins >= fee ? "" : "disabled"}>
            ${state.coins >= fee ? t("magic.pay", { fee }) : t("magic.noCoins")}
          </button>
        </div>
      </div>`;
}
