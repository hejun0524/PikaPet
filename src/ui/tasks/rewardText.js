// tasks/rewardText.js

import { ALL_ITEMS } from "../items.js";

/**
 * Short badge text for a task's reward: coins, plus an item's emoji or a
 * ticket emoji when the reward includes one.
 *
 * @param {{coins?: number, itemKey?: string, ticket?: boolean}} reward
 * @returns {string} e.g. "💰420 🤖" or "💰650 🎫".
 */
export function rewardText(reward) {
  let text = `💰${reward.coins ?? 0}`;
  if (reward.itemKey) {
    const item = ALL_ITEMS.find((i) => i.key === reward.itemKey);
    if (item) text += ` ${item.emoji}`;
  }
  if (reward.ticket) text += " 🎫";
  return text;
}
