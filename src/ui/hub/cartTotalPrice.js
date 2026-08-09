// hub/cartTotalPrice.js

import { cart } from "./state.js";
import { findSellable } from "../items.js";

/**
 * Total price of everything currently in the shopping cart.
 *
 * @returns {number} Sum of price × quantity over all cart entries.
 */
export function cartTotalPrice() {
  let total = 0;
  for (const [key, qty] of cart) total += findSellable(key).price * qty;
  return total;
}
