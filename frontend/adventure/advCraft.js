// adventure/advCraft.js

import { adv } from "./state.js";
import { advBpOf } from "./advBpOf.js";
import { advLog } from "./advLog.js";
import { advSave } from "./advSave.js";

/**
 * Assemble one crafted good from an unlocked blueprint, consuming its
 * materials. No-op if the blueprint is unknown, locked, or materials are
 * short. Mutates `adv` (materials, goods), logs, and calls advSave().
 * Caller re-renders.
 *
 * @param {string} key - Blueprint key to craft.
 * @returns {void}
 */
export function advCraft(key) {
  const bp = advBpOf(key);
  if (!bp || !adv.blueprints.includes(key)) return;
  if (!Object.entries(bp.needs).every(([k, q]) => (adv.materials[k] ?? 0) >= q)) return;
  for (const [k, q] of Object.entries(bp.needs)) adv.materials[k] -= q;
  adv.goods[key] = (adv.goods[key] ?? 0) + 1;
  advLog(`The workshop assembled a ${bp.label.toLowerCase()}.`);
  advSave();
}
