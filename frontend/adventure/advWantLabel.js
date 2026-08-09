// adventure/advWantLabel.js

import { ADV_MATERIALS } from "./adventureData.js";
import { advBpOf } from "./advBpOf.js";

/**
 * Format a task's request as "qty × Label" (e.g. "3 × Herbs").
 *
 * @param {{kind: "good"|"material", key: string, qty: number}} wants - The
 *   requested cargo descriptor.
 * @returns {string} Human-readable request label.
 */
export function advWantLabel(wants) {
  const label = wants.kind === "good" ? advBpOf(wants.key).label : ADV_MATERIALS[wants.key].label;
  return `${wants.qty} × ${label}`;
}
