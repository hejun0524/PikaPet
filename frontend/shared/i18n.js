// shared/i18n.js — the app's tiny runtime i18n. One active locale per
// window, kept in sync through pet.settings.language ("auto" or a locale
// code) exactly like every other setting: the hub's Settings page emits
// "settings-changed", the stats window persists it, and each window calls
// setLanguage() when it sees the setting (boot + live change).
//
// Two lookup flavors:
// - t(key, params)          for UI strings — every key exists in locales/en.js,
//                           which is also the fallback for untranslated keys.
// - tOr(key, fallback, ...) for names that live in the data catalogs (items,
//                           classes, jobs, destinations, …): the locale files
//                           translate them under stable keys ("item.carrot",
//                           "job.chef-3"), and a missing entry falls back to
//                           the catalog's English name. locales/en.js therefore
//                           carries NO data-name entries at all.
//
// Adding a language = one file in frontend/locales/ + one import + one
// LANGUAGE_OPTIONS entry here (see README "Languages").

import { messages as en } from "../locales/en.js";
import { messages as zh } from "../locales/zh.js";
import { messages as fr } from "../locales/fr.js";
import { messages as es } from "../locales/es.js";
import { messages as de } from "../locales/de.js";
import { messages as ja } from "../locales/ja.js";

/** Every bundled dictionary, keyed by locale code. */
export const LOCALES = { en, zh, fr, es, de, ja };

/**
 * The Settings dropdown's choices. Labels are deliberately written in their
 * own language (a user lost in the wrong language must recognize theirs);
 * the "auto" option's label comes from t("settings.langAuto") at render time.
 */
export const LANGUAGE_OPTIONS = [
  { key: "auto", label: null },
  { key: "en", label: "English" },
  { key: "zh", label: "中文" },
  { key: "fr", label: "Français" },
  { key: "es", label: "Español" },
  { key: "de", label: "Deutsch" },
  { key: "ja", label: "日本語" },
];

// Mutable module state (imports are read-only bindings, hence the object).
const current = { setting: "auto", locale: detectLocale() };

/**
 * Map the system language (navigator.language) to a supported locale code.
 *
 * @returns {string} A key of LOCALES; "en" when the system language isn't
 *   supported.
 */
export function detectLocale() {
  // Guarded so headless (node) smoke tests can import this module too.
  const sys = (typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en"
  )
    .toLowerCase()
    .slice(0, 2);
  return LOCALES[sys] ? sys : "en";
}

/**
 * Apply a language setting ("auto" resolves to the system language).
 * Idempotent and cheap — safe to call on every settings merge.
 *
 * @param {string|undefined} setting - "auto" or a LOCALES key; anything
 *   unknown behaves like "auto".
 * @returns {void}
 */
export function setLanguage(setting) {
  current.setting = LOCALES[setting] ? setting : "auto";
  current.locale = current.setting === "auto" ? detectLocale() : current.setting;
}

/** @returns {string} The stored setting: "auto" or a locale code. */
export function languageSetting() {
  return current.setting;
}

/** @returns {string} The resolved active locale code (never "auto"). */
export function getLocale() {
  return current.locale;
}

/**
 * Raw dictionary lookup: active locale first, then English.
 *
 * @param {string} key - Message key.
 * @returns {string|undefined} The template string, or undefined when neither
 *   dictionary has it.
 */
export function lookup(key) {
  return LOCALES[current.locale][key] ?? en[key];
}

/**
 * Translate a UI string (key guaranteed to exist in locales/en.js).
 *
 * @param {string} key - Message key.
 * @param {Object} [params] - Values for the template's {name} placeholders.
 * @returns {string} The translated, interpolated string (the key itself if
 *   missing everywhere — a loud bug marker, not a crash).
 */
export function t(key, params) {
  return interpolate(lookup(key) ?? key, params);
}

/**
 * Translate a data-catalog name: the locale's entry when present, otherwise
 * the catalog's English text.
 *
 * @param {string} key - Stable data key, e.g. "item.carrot".
 * @param {string} fallback - The catalog's English name/label.
 * @param {Object} [params] - Values for {name} placeholders, if any.
 * @returns {string} The translated or fallback string.
 */
export function tOr(key, fallback, params) {
  return interpolate(lookup(key) ?? fallback, params);
}

/**
 * Fill {name} placeholders in a template.
 *
 * @param {string} template - String possibly containing {param} tokens.
 * @param {Object} [params] - Replacement values.
 * @returns {string} The interpolated string.
 */
export function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) =>
    params[name] !== undefined ? String(params[name]) : m
  );
}
