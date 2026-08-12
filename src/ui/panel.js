// panel.js — master file for the shared pet-panel rendering helpers (care
// meters, traits, extension buttons, status badges) used by the stats popover
// and the hub window's side panel.
//
// Each function lives in its own file under panel/; this file only groups
// and re-exports them. Import from "./panel.js" rather than reaching into
// the folder.

export { CRITICAL_BELOW, BAR_LEVELS } from "./panel/barLevels.js";
export { barClassFor } from "./panel/barClassFor.js";
export { escText } from "./panel/escText.js";
export { careCardsHTML } from "./panel/careCardsHTML.js";
export { traitCardsHTML } from "./panel/traitCardsHTML.js";
export { extensionButtonsHTML } from "./panel/extensionButtonsHTML.js";
export { caretakingStatusHTML } from "./panel/caretakingStatusHTML.js";
export { activityStatusHTML } from "./panel/activityStatusHTML.js";
