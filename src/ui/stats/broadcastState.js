// stats/broadcastState.js — State broadcast: this window is the single
// source of truth; every other window renders from the "pet-state" event.

import { emit } from "../shared/tauri.js";
import { findSpecies } from "../items.js";
import { pet, runtime } from "./state.js";
import { activityView } from "./activityView.js";
import { caretakingView } from "./caretakingView.js";

/**
 * Emit the full "pet-state" snapshot (pet data, activity/caretaking views,
 * installed add-ons, settings) to all windows.
 * Side effects: broadcasts a Tauri event.
 *
 * @returns {void}
 */
export function broadcastState() {
  emit("pet-state", {
    name: pet.name,
    breed: findSpecies(pet.species).breed,
    species: pet.species,
    forms: [...pet.forms],
    callMe: pet.callMe,
    coins: pet.coins,
    achievements: [...pet.achievements],
    care: Object.fromEntries(pet.care.map((s) => [s.key, s.value])),
    traits: Object.fromEntries(pet.traits.map((t) => [t.key, t.value])),
    bag: { ...pet.bag },
    school: { subjects: pet.school.subjects },
    career: { xp: { ...pet.career.xp } },
    activity: activityView(),
    caretaking: caretakingView(),
    bank: { ...pet.bank },
    addonsInstalled: runtime.installedAddons,
    pinnedAddons: [...pet.pinnedAddons],
    homework: { ...pet.homework },
    settings: { ...pet.settings },
    kitchen: {
      ...pet.kitchen,
      pantry: { ...pet.kitchen.pantry },
      recipes: [...pet.kitchen.recipes],
      orders: pet.kitchen.orders.map((o) => ({ ...o })),
      log: [...pet.kitchen.log],
    },
    fightclub: {
      books: { ...pet.fightclub.books },
      potions: { ...pet.fightclub.potions },
      skills: { ...pet.fightclub.skills },
      level: pet.fightclub.level,
      xp: pet.fightclub.xp,
      hp: pet.fightclub.hp,
      record: { ...pet.fightclub.record },
    },
  });
}
