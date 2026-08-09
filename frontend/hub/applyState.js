// hub/applyState.js

import { state, appSettings } from "./state.js";
import { SPECIES } from "../items.js";
import { liveActivity } from "./liveActivity.js";
import { liveCaretaking } from "./liveCaretaking.js";

/**
 * Merge a pet-state broadcast (or parsed save file) into the local `state`
 * mirror and `appSettings`, validating each field and enriching saved
 * activity/caretaking entries via liveActivity/liveCaretaking.
 *
 * Side effects: mutates `state` and `appSettings` in place.
 *
 * @param {Object} saved - The broadcast payload or parsed save.json contents.
 * @returns {void}
 */
export function applyState(saved) {
  if (typeof saved.name === "string" && saved.name.trim()) state.name = saved.name.trim();
  if (SPECIES.some((s) => s.key === saved.species)) state.species = saved.species;
  if (Array.isArray(saved.forms)) state.forms = saved.forms;
  if (!state.forms.includes(state.species)) state.forms.push(state.species);
  if (typeof saved.callMe === "string" && saved.callMe.trim()) state.callMe = saved.callMe.trim();
  if (typeof saved.coins === "number") state.coins = saved.coins;
  if (Array.isArray(saved.achievements)) state.achievements = saved.achievements;
  for (const key of Object.keys(state.care)) {
    if (typeof saved.care?.[key] === "number") state.care[key] = saved.care[key];
  }
  for (const key of Object.keys(state.traits)) {
    if (typeof saved.traits?.[key] === "number") state.traits[key] = saved.traits[key];
  }
  for (const key of Object.keys(state.bag)) {
    if (typeof saved.bag?.[key] === "number") state.bag[key] = saved.bag[key];
  }
  if (saved.school?.subjects) {
    state.school.subjects = { ...state.school.subjects, ...saved.school.subjects };
  }
  if (saved.career?.xp) {
    state.career.xp = { ...state.career.xp, ...saved.career.xp };
  }
  if (saved.activity) {
    state.activity = {
      plan: saved.activity.plan ?? [],
      active: liveActivity(saved.activity.active),
    };
  }
  if (saved.caretaking) {
    state.caretaking = {
      plan: saved.caretaking.plan ?? [],
      active: liveCaretaking(saved.caretaking.active),
    };
  }
  if (saved.touring) {
    if (saved.touring.visited) {
      state.touring.visited = { ...state.touring.visited, ...saved.touring.visited };
    }
    if (Array.isArray(saved.touring.journals)) state.touring.journals = saved.touring.journals;
  }
  if (saved.souvenirs && typeof saved.souvenirs === "object") state.souvenirs = saved.souvenirs;
  if (saved.tickets && typeof saved.tickets === "object") state.tickets = saved.tickets;
  if (saved.pika && typeof saved.pika === "object") {
    state.pika = { sells: [], ...state.pika, ...saved.pika };
  }
  if (saved.bank && typeof saved.bank === "object") {
    state.bank = { ...state.bank, ...saved.bank };
  }
  if (saved.homework && typeof saved.homework === "object") {
    state.homework = saved.homework;
  }
  if (Array.isArray(saved.addonsInstalled)) {
    state.addonsInstalled = saved.addonsInstalled;
  }
  if (Array.isArray(saved.pinnedAddons)) {
    state.pinnedAddons = saved.pinnedAddons;
  }
  if (saved.settings && typeof saved.settings === "object") {
    if (typeof saved.settings.scale === "number") appSettings.scale = saved.settings.scale;
    if (typeof saved.settings.allDesktops === "boolean") {
      appSettings.allDesktops = saved.settings.allDesktops;
    }
    if (typeof saved.settings.devMode === "boolean") {
      appSettings.devMode = saved.settings.devMode;
    }
    if (typeof saved.settings.devCoins === "boolean") {
      appSettings.devCoins = saved.settings.devCoins;
    }
  }
}
