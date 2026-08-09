// shared/names.js — translated display names for the data catalogs. The
// catalogs (items.js, school.js, career.js, touring.js) stay English-only;
// these helpers look the entry up in the active locale by its stable key and
// fall back to the catalog text (see shared/i18n.js).
//
// Every window that renders a catalog name goes through here, so a name is
// translated the same way on cards, in drawers, and in status rows.

import { t, tOr, lookup, interpolate } from "./i18n.js";
import { findSubject, findClass } from "../school.js";
import { findJob } from "../career.js";
import { findTour } from "../touring.js";

/** Higher-ed class names are generated in schoolData.js, so their locale
 * entries are patterns keyed by stage ("class.hed.bachelor" …). */
const HIGHER_ED_STAGES = new Set(["bachelor", "master", "phd"]);

/**
 * Translated name of an item, service, or anything sold in the Life view.
 *
 * @param {{key: string, name: string}} entry - Catalog entry.
 * @returns {string} Localized name.
 */
export function itemName(entry) {
  return tOr(`item.${entry.key}`, entry.name);
}

/**
 * Translated description override of an item (only services carry one).
 *
 * @param {{key: string, desc: string}} entry - Catalog entry with a desc.
 * @returns {string} Localized description.
 */
export function itemDesc(entry) {
  return tOr(`item.${entry.key}.desc`, entry.desc);
}

/**
 * Translated subject label.
 *
 * @param {{key: string, label: string}} subject - SUBJECTS entry.
 * @returns {string} Localized label.
 */
export function subjectName(subject) {
  return tOr(`subject.${subject.key}`, subject.label);
}

/**
 * Translated school-stage label.
 *
 * @param {{key: string, label: string}} stage - SCHOOL_STAGES entry.
 * @returns {string} Localized label.
 */
export function stageName(stage) {
  return tOr(`stage.${stage.key}`, stage.label);
}

/**
 * Translated class name. Hand-written classes have explicit locale entries;
 * generated higher-ed courses use per-stage patterns with the subject name.
 *
 * @param {{key: string, stage: string, subject: string, name: string}} cls -
 *   CLASS_CATALOG entry.
 * @returns {string} Localized name.
 */
export function className(cls) {
  const explicit = lookup(`class.${cls.key}`);
  if (explicit) return explicit;
  if (HIGHER_ED_STAGES.has(cls.stage)) {
    const pattern = lookup(`class.hed.${cls.stage}`);
    if (pattern) return interpolate(pattern, { subject: subjectName(findSubject(cls.subject)) });
  }
  return cls.name;
}

/**
 * Translated career label.
 *
 * @param {{key: string, label: string}} career - CAREERS entry.
 * @returns {string} Localized label.
 */
export function careerName(career) {
  return tOr(`career.${career.key}`, career.label);
}

/**
 * Translated job (rank) title.
 *
 * @param {{key: string, name: string}} job - JOB_CATALOG entry.
 * @returns {string} Localized title.
 */
export function jobName(job) {
  return tOr(`job.${job.key}`, job.name);
}

/**
 * Translated XP-tier name ("Entry" … "Master").
 *
 * @param {string} name - TIERS entry name (English).
 * @returns {string} Localized tier name.
 */
export function tierName(name) {
  return tOr(`tier.${name.toLowerCase()}`, name);
}

/**
 * Translated caretaker name.
 *
 * @param {{key: string, name: string}} c - CARETAKERS entry.
 * @returns {string} Localized name.
 */
export function caretakerName(c) {
  return tOr(`caretaker.${c.key}`, c.name);
}

/**
 * Translated caretaker description.
 *
 * @param {{key: string, desc: string}} c - CARETAKERS entry.
 * @returns {string} Localized description.
 */
export function caretakerDesc(c) {
  return tOr(`caretaker.${c.key}.desc`, c.desc);
}

/**
 * Translated species breed text ("Chocolate Toy Poodle" …).
 *
 * @param {{key: string, breed: string}} species - SPECIES entry.
 * @returns {string} Localized breed.
 */
export function speciesBreed(species) {
  return tOr(`species.${species.key}.breed`, species.breed);
}

/**
 * Translated place label: destinations translate under "dest.<key>"; sports
 * leagues (NBA, MLB, …) are proper nouns and fall back to their English
 * label everywhere.
 *
 * @param {{key: string, label: string}} place - ALL_PLACES entry.
 * @returns {string} Localized label.
 */
export function placeLabel(place) {
  return tOr(`dest.${place.key}`, place.label);
}

/**
 * Translated city or team name, keyed by the exact English string from the
 * touring catalogs ("city.New York", "city.Boston Celtics", …). Locales only
 * list the names that differ (zh/ja translate everything; fr/es/de carry
 * their exonyms and keep team names in English, as native sports media do),
 * so the fallback is simply the English name itself.
 *
 * @param {string} city - City or team name as stored in the catalogs/saves.
 * @returns {string} Localized name.
 */
export function cityName(city) {
  return tOr(`city.${city}`, city);
}

/**
 * Translated display name of a running/queued activity from a pet-state
 * broadcast, resolved by key so every window shows its own locale. Tour
 * names come out of findTour() already localized.
 *
 * @param {{type: "class"|"job"|"tour", key: string, name: string}} active -
 *   The broadcast activity entry (its `name` is the English fallback).
 * @returns {string} Localized activity name.
 */
export function activityName(active) {
  if (active.type === "class") {
    const cls = findClass(active.key);
    if (cls) return className(cls);
  } else if (active.type === "job") {
    const job = findJob(active.key);
    if (job) return jobName(job);
  } else if (active.type === "tour") {
    const def = findTour(active.key);
    if (def) return def.name;
  }
  return active.name;
}

/**
 * Verb chip for an activity type ("💼 Working" …).
 *
 * @param {"class"|"job"|"tour"} type - Activity type.
 * @returns {string} Localized verb with its emoji.
 */
export function activityVerb(type) {
  return type === "job" ? t("panel.working") : type === "tour" ? t("panel.touring") : t("panel.studying");
}
