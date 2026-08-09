// adventure/advHandleClick.js

import { advUi } from "./state.js";
import { advBuyBlueprint } from "./advBuyBlueprint.js";
import { advCraft } from "./advCraft.js";
import { advDeliver } from "./advDeliver.js";
import { advGather } from "./advGather.js";
import { advHeal } from "./advHeal.js";
import { advHire } from "./advHire.js";
import { advLocate } from "./advLocate.js";
import { advSellTrinket } from "./advSellTrinket.js";

/**
 * Handle a click delegated from the hub's #grid listener: dispatches on the
 * `data-adv-*` attribute of the clicked element (era/place selection mutates
 * `advUi`; the rest call the matching action, which mutates `adv` and
 * saves). The caller re-renders when this returns true.
 *
 * @param {MouseEvent} e - The click event from the grid listener.
 * @returns {boolean} True when the click was an adventure action (re-render
 *   needed), false when it wasn't ours.
 */
export function advHandleClick(e) {
  const hit = (sel) => e.target.closest(sel);
  let el;
  if ((el = hit("[data-adv-era]"))) {
    advUi.era = el.dataset.advEra;
    advUi.place = null;
  } else if ((el = hit("[data-adv-place]"))) {
    advUi.place = el.dataset.advPlace;
  } else if ((el = hit("[data-adv-hire]"))) {
    advHire(el.dataset.advHire);
  } else if ((el = hit("[data-adv-heal]"))) {
    advHeal(el.dataset.advHeal);
  } else if ((el = hit("[data-adv-locate]"))) {
    advLocate(el.dataset.advLocate);
  } else if ((el = hit("[data-adv-gather]"))) {
    advGather(el.dataset.advGather, document.getElementById("adv-gsel")?.value);
  } else if ((el = hit("[data-adv-deliver]"))) {
    const id = el.dataset.advDeliver;
    advDeliver(id, document.getElementById(`adv-dsel-${id}`)?.value, el.dataset.express === "1");
  } else if ((el = hit("[data-adv-buy-bp]"))) {
    advBuyBlueprint(el.dataset.advBuyBp);
  } else if ((el = hit("[data-adv-sell-trinket]"))) {
    advSellTrinket(el.dataset.advSellTrinket);
  } else if ((el = hit("[data-adv-craft]"))) {
    advCraft(el.dataset.advCraft);
  } else {
    return false;
  }
  return true;
}
