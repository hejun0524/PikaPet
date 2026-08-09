// adventure.js — master file for the Adventure feature: the pet's second
// life as a guildmaster. Each function lives in its own file under
// adventure/; this module only groups and re-exports them. Import from
// "./adventure.js" rather than reaching into adventure/ directly.
//
// Adventure is a deliberately SEPARATE ecosystem: it reads only the pet's
// NAME (guild title) and the app's devMode flag (time scale). Finnies 🐟,
// materials, recruits, and all progress live in their own localStorage save
// ("pika-adventure-v1") and never touch coins, traits, or save.json.
// Design doc + to-dos: ADVENTURE.md at the repo root.
//
// No side effects here — the hub master calls initAdventureClock().

// Static world data and pricing constants.
export {
  ADV_SAVE_KEY,
  ADV_TABS,
  ADV_ERAS,
  ADV_CITIES,
  ADV_ERA_TRAVEL,
  ADV_MATERIALS,
  ADV_WILDS,
  ADV_NPCS,
  ADV_TRINKETS,
  ADV_BLUEPRINTS,
  ADV_DARCY_LOCATE,
  ADV_DARCY_EXPRESS,
  ADV_NOONIE_PER_MIN,
  ADV_RECRUIT_POOL,
  ADV_START_TOKENS,
  ADV_MAX_TASKS,
  ADV_HIRE_COST,
} from "./adventure/adventureData.js";

// Mutable state: the save object and the UI-only selections.
export { adv, advUi } from "./adventure/state.js";

// Save / load.
export { advMakeRecruit } from "./adventure/advMakeRecruit.js";
export { advFresh } from "./adventure/advFresh.js";
export { advLoadSave } from "./adventure/advLoadSave.js";
export { advSave } from "./adventure/advSave.js";
export { advLog } from "./adventure/advLog.js";

// Lookups & helpers.
export { advEraOf } from "./adventure/advEraOf.js";
export { advCityOf } from "./adventure/advCityOf.js";
export { advWildOf } from "./adventure/advWildOf.js";
export { advNpcOf } from "./adventure/advNpcOf.js";
export { advBpOf } from "./adventure/advBpOf.js";
export { advGuildLevel } from "./adventure/advGuildLevel.js";
export { advMs } from "./adventure/advMs.js";
export { advRemainText } from "./adventure/advRemainText.js";
export { advCountdown } from "./adventure/advCountdown.js";
export { advHash } from "./adventure/advHash.js";
export { advSlot } from "./adventure/advSlot.js";
export { advNpcSpot } from "./adventure/advNpcSpot.js";
export { advLocated } from "./adventure/advLocated.js";
export { advRecordSighting } from "./adventure/advRecordSighting.js";
export { advTravelMinutes } from "./adventure/advTravelMinutes.js";
export { advGoodValue } from "./adventure/advGoodValue.js";
export { advWantLabel } from "./adventure/advWantLabel.js";
export { advHave } from "./adventure/advHave.js";
export { advIdleRecruits } from "./adventure/advIdleRecruits.js";
export { advGatherChance } from "./adventure/advGatherChance.js";
export { advXpNeed } from "./adventure/advXpNeed.js";
export { advGrantXp } from "./adventure/advGrantXp.js";
export { advCandidates } from "./adventure/advCandidates.js";

// Simulation: resolve finished missions, expire and repost tasks.
export { advNewTask } from "./adventure/advNewTask.js";
export { advResolveMission } from "./adventure/advResolveMission.js";
export { advProcess } from "./adventure/advProcess.js";

// Actions (from clicks; caller re-renders).
export { advHire } from "./adventure/advHire.js";
export { advNoonieCost } from "./adventure/advNoonieCost.js";
export { advHeal } from "./adventure/advHeal.js";
export { advLocate } from "./adventure/advLocate.js";
export { advGather } from "./adventure/advGather.js";
export { advDeliver } from "./adventure/advDeliver.js";
export { advBuyBlueprint } from "./adventure/advBuyBlueprint.js";
export { advSellTrinket } from "./adventure/advSellTrinket.js";
export { advCraft } from "./adventure/advCraft.js";

// Rendering.
export { advTokensHTML } from "./adventure/advTokensHTML.js";
export { advRecruitSelectHTML } from "./adventure/advRecruitSelectHTML.js";
export { advRecruitCardHTML } from "./adventure/advRecruitCardHTML.js";
export { advTaskCardHTML } from "./adventure/advTaskCardHTML.js";
export { advGuildHTML } from "./adventure/advGuildHTML.js";
export { advPikaHTML } from "./adventure/advPikaHTML.js";
export { advDarcyHTML } from "./adventure/advDarcyHTML.js";
export { advNoonieHTML } from "./adventure/advNoonieHTML.js";
export { advWildDetailHTML } from "./adventure/advWildDetailHTML.js";
export { advCityDetailHTML } from "./adventure/advCityDetailHTML.js";
export { advWorldHTML } from "./adventure/advWorldHTML.js";
export { advStoreHTML } from "./adventure/advStoreHTML.js";
export { advCraftsHTML } from "./adventure/advCraftsHTML.js";
export { adventurePageHTML } from "./adventure/adventurePageHTML.js";

// Click handling (delegated from the hub's #grid listener) and the clock.
export { advHandleClick } from "./adventure/advHandleClick.js";
export { initAdventureClock } from "./adventure/initAdventureClock.js";
