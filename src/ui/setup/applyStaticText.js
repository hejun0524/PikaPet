// setup/applyStaticText.js — translate the setup window's static HTML. The
// setup window runs before any save file exists, so the locale is always the
// system language here (setLanguage("auto") in setup.js).

import { t } from "../shared/i18n.js";

/**
 * Write the active locale's text into setup.html: title, subtitle, form
 * labels, the call-me placeholder, and the Quit/Start buttons.
 *
 * Side effects: DOM writes only.
 *
 * @returns {void}
 */
export function applyStaticText() {
  document.querySelector("main h1").textContent = t("setup.title");
  document.querySelector(".subtitle").textContent = t("setup.subtitle");
  document.querySelector('label[for="setup-name"]').textContent = t("setup.nameLabel");
  document.querySelector('label[for="setup-callme"]').textContent = t("setup.callmeLabel");
  document.getElementById("setup-callme").placeholder = t("setup.callmePlaceholder");
  document.getElementById("setup-quit").textContent = t("setup.quit");
  document.getElementById("setup-start").textContent = t("setup.start");
}
