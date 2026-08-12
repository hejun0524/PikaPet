// items.js — master file for the shared item/store catalog, used by the
// stats window (which applies item effects and purchases), the hub window
// (Home + Life views), and the setup window (species picker).
//
// Each function lives in its own file under items/; this file only groups
// and re-exports them. Import from "./items.js" rather than reaching into
// the folder.

export { CARE_EMOJI, CARE_META, TRAIT_META, STAT_EMOJI } from "./items/careMeta.js";
export {
  DEFAULT_ITEM_QTY,
  ITEM_CATALOG,
  ALL_ITEMS,
  HOMEWORK_DAILY_LIMIT,
  HOMEWORK_ITEM_KEYS,
} from "./items/itemCatalog.js";
export { CARETAKER_MINUTES, CARETAKERS } from "./items/caretakers.js";
export { findCaretaker } from "./items/findCaretaker.js";
export { SAVINGS_APR, LOAN_APR, LOAN_LIMIT } from "./items/bank.js";
export { extensionList } from "./items/extensionList.js";
export { SPECIES, CUSTOM_FORM_PRICE } from "./items/species.js";
export { SPECIAL_SPECIES, specialFormProgress, specialFormUnlocked } from "./items/specialForms.js";
export { findSpecies, findForm } from "./items/findSpecies.js";
export { SERVICES } from "./items/services.js";
export { SHOP_CATALOG, CAREER_CATALOG, TOURING_TABS } from "./items/shopCatalog.js";
export { findSellable } from "./items/findSellable.js";
