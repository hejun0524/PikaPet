// stats/broadcastState.js — State broadcast: this window is the single
// source of truth; every other window renders from the "pet-state" event.

import { emit } from "../shared/tauri.js";
import { pet, runtime } from "./state.js";
import { activityView } from "./activityView.js";
import { caretakingView } from "./caretakingView.js";
import { formInfo } from "./formInfo.js";

/**
 * Emit the full "pet-state" snapshot (pet data, activity/caretaking views,
 * installed extensions, settings) to all windows.
 * Side effects: broadcasts a Tauri event.
 *
 * @returns {void}
 */
export function broadcastState() {
  emit("pet-state", {
    name: pet.name,
    breed: formInfo(pet.species).breed,
    species: pet.species,
    forms: [...pet.forms],
    customForms: pet.customForms.map((c) => ({ ...c })),
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
    extensionsInstalled: runtime.installedExtensions,
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
