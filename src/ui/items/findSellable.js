// items/findSellable.js

import { ALL_ITEMS } from "./itemCatalog.js";
import { SERVICES } from "./services.js";

/**
 * Look up anything a store can sell — a bag item or a town service — by key.
 *
 * @param {string} key - Item key (e.g. "cookie") or service key (e.g. "cure").
 * @returns {object|undefined} The matching entry from ALL_ITEMS or SERVICES
 *   (`{ key, emoji, name, price, ... }`), or `undefined` if the key is
 *   unknown.
 */
export function findSellable(key) {
  return ALL_ITEMS.find((i) => i.key === key) ?? SERVICES.find((s) => s.key === key);
}
