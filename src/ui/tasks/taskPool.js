// tasks/taskPool.js — Dune's Daily Tasks: 5 difficulty pools (1 = easiest, 5 =
// hardest). Each day one task is drawn from each pool, so a day always has a
// spread of difficulty. The tier number is the "hidden difficulty" — it never
// reaches the UI, only the description/threshold/reward do.
//
// Every task counts something the player actively does (spend/feed/clean/
// study/work/tour/trade/deliver/win) — never a specific city, team, or
// recipe, so nothing can be already-impossible or already-satisfied by luck.

/** Consecutive all-6-cleared days needed to unlock Dune as a playable form. */
export const UNLOCK_STREAK = 100;

/**
 * The implicit 6th task: "clear the other 5" — not drawn from a pool, always
 * present. Its reward is the day's bonus, standalone from the 5 above.
 */
export const BONUS_TASK = {
  id: "bonus",
  template: "allDone",
  params: {},
  counterKey: null,
  threshold: null,
  reward: { coins: 1000, ticket: true },
};

/**
 * One pool per difficulty tier. Each task: `{id, template, params,
 * counterKey, threshold, reward}`. `params` feeds `t("dune.task.<template>",
 * params)`; `reward.coins` is always paid, `reward.itemKey`/`reward.ticket`
 * are additional. Rewards are only paid out when the player claims a
 * completed task on Dune's page (see stats/claimTask.js).
 */
export const TASK_POOLS = [
  // Tier 1
  [
    { id: "shop", template: "shopSpend", params: { amount: 100 }, counterKey: "shop.spend", threshold: 100, reward: { coins: 70 } },
    { id: "feed", template: "feedAny", params: { count: 2 }, counterKey: "feed.any", threshold: 2, reward: { coins: 70 } },
    { id: "clean", template: "cleanAny", params: { count: 2 }, counterKey: "bath.any", threshold: 2, reward: { coins: 70 } },
    { id: "homework", template: "homework", params: { count: 1 }, counterKey: "homework.any", threshold: 1, reward: { coins: 70 } },
    { id: "study", template: "study", params: { count: 1 }, counterKey: "study.any", threshold: 1, reward: { coins: 70 } },
    { id: "work", template: "work", params: { count: 1 }, counterKey: "work.any", threshold: 1, reward: { coins: 70 } },
    { id: "tour", template: "tourAny", params: { count: 1 }, counterKey: "tour.any", threshold: 1, reward: { coins: 70 } },
    { id: "pika", template: "pikaTrade", params: { count: 1 }, counterKey: "pika.trade", threshold: 1, reward: { coins: 70 } },
    { id: "kitchen", template: "kitchenDeliver", params: { count: 1 }, counterKey: "kitchen.deliver", threshold: 1, reward: { coins: 70 } },
    { id: "fight", template: "fightWin", params: { count: 1 }, counterKey: "fight.win", threshold: 1, reward: { coins: 70 } },
  ],
  // Tier 2
  [
    { id: "shop", template: "shopSpend", params: { amount: 200 }, counterKey: "shop.spend", threshold: 200, reward: { coins: 150 } },
    { id: "feed", template: "feedItem", params: { count: 3, itemKey: "cookie" }, counterKey: "feed.cookie", threshold: 3, reward: { coins: 150 } },
    { id: "clean", template: "cleanItem", params: { count: 3, itemKey: "soap" }, counterKey: "bath.soap", threshold: 3, reward: { coins: 150 } },
    { id: "homework", template: "homework", params: { count: 2 }, counterKey: "homework.any", threshold: 2, reward: { coins: 150 } },
    { id: "study", template: "study", params: { count: 2 }, counterKey: "study.any", threshold: 2, reward: { coins: 150 } },
    { id: "work", template: "work", params: { count: 2 }, counterKey: "work.any", threshold: 2, reward: { coins: 150 } },
    { id: "tour", template: "tourAny", params: { count: 2 }, counterKey: "tour.any", threshold: 2, reward: { coins: 150 } },
    { id: "pika", template: "pikaTrade", params: { count: 2 }, counterKey: "pika.trade", threshold: 2, reward: { coins: 150 } },
    { id: "kitchen", template: "kitchenDeliver", params: { count: 2 }, counterKey: "kitchen.deliver", threshold: 2, reward: { coins: 150 } },
    { id: "fight", template: "fightWin", params: { count: 1 }, counterKey: "fight.win", threshold: 1, reward: { coins: 150 } },
  ],
  // Tier 3
  [
    { id: "shop", template: "shopSpend", params: { amount: 350 }, counterKey: "shop.spend", threshold: 350, reward: { coins: 260 } },
    { id: "feed", template: "feedItem", params: { count: 4, itemKey: "donut" }, counterKey: "feed.donut", threshold: 4, reward: { coins: 260 } },
    { id: "clean", template: "cleanItem", params: { count: 4, itemKey: "bubbles" }, counterKey: "bath.bubbles", threshold: 4, reward: { coins: 260 } },
    { id: "homework", template: "homework", params: { count: 3 }, counterKey: "homework.any", threshold: 3, reward: { coins: 260 } },
    { id: "study", template: "study", params: { count: 3 }, counterKey: "study.any", threshold: 3, reward: { coins: 260 } },
    { id: "work", template: "work", params: { count: 3 }, counterKey: "work.any", threshold: 3, reward: { coins: 260 } },
    { id: "tour", template: "tourSport", params: { count: 1 }, counterKey: "tour.sport", threshold: 1, reward: { coins: 260 } },
    { id: "pika", template: "pikaTrade", params: { count: 2 }, counterKey: "pika.trade", threshold: 2, reward: { coins: 260 } },
    { id: "kitchen", template: "kitchenDeliver", params: { count: 3 }, counterKey: "kitchen.deliver", threshold: 3, reward: { coins: 260 } },
    { id: "fight", template: "fightWin", params: { count: 2 }, counterKey: "fight.win", threshold: 2, reward: { coins: 260 } },
  ],
  // Tier 4
  [
    { id: "shop", template: "shopSpend", params: { amount: 500 }, counterKey: "shop.spend", threshold: 500, reward: { coins: 420, itemKey: "robot" } },
    { id: "feed", template: "feedItem", params: { count: 3, itemKey: "steak" }, counterKey: "feed.steak", threshold: 3, reward: { coins: 420, itemKey: "robot" } },
    { id: "clean", template: "cleanItem", params: { count: 3, itemKey: "spa" }, counterKey: "bath.spa", threshold: 3, reward: { coins: 420, itemKey: "robot" } },
    { id: "homework", template: "homework", params: { count: 4 }, counterKey: "homework.any", threshold: 4, reward: { coins: 420, itemKey: "robot" } },
    { id: "study", template: "study", params: { count: 4 }, counterKey: "study.any", threshold: 4, reward: { coins: 420, itemKey: "robot" } },
    { id: "work", template: "work", params: { count: 4 }, counterKey: "work.any", threshold: 4, reward: { coins: 420, itemKey: "robot" } },
    { id: "tour", template: "tourCity", params: { count: 1 }, counterKey: "tour.city", threshold: 1, reward: { coins: 420, itemKey: "robot" } },
    { id: "pika", template: "pikaTrade", params: { count: 3 }, counterKey: "pika.trade", threshold: 3, reward: { coins: 420, itemKey: "robot" } },
    { id: "kitchen", template: "kitchenDeliver", params: { count: 4 }, counterKey: "kitchen.deliver", threshold: 4, reward: { coins: 420, itemKey: "robot" } },
    { id: "fight", template: "fightWin", params: { count: 3 }, counterKey: "fight.win", threshold: 3, reward: { coins: 420, itemKey: "robot" } },
  ],
  // Tier 5
  [
    { id: "shop", template: "shopSpend", params: { amount: 800 }, counterKey: "shop.spend", threshold: 800, reward: { coins: 650, ticket: true } },
    { id: "feed", template: "feedItem", params: { count: 3, itemKey: "cake" }, counterKey: "feed.cake", threshold: 3, reward: { coins: 650, ticket: true } },
    { id: "clean", template: "cleanItem", params: { count: 3, itemKey: "hotspring" }, counterKey: "bath.hotspring", threshold: 3, reward: { coins: 650, ticket: true } },
    { id: "homework", template: "homework", params: { count: 5 }, counterKey: "homework.any", threshold: 5, reward: { coins: 650, ticket: true } },
    { id: "study", template: "study", params: { count: 5 }, counterKey: "study.any", threshold: 5, reward: { coins: 650, ticket: true } },
    { id: "work", template: "work", params: { count: 5 }, counterKey: "work.any", threshold: 5, reward: { coins: 650, ticket: true } },
    { id: "tour", template: "tourAny", params: { count: 3 }, counterKey: "tour.any", threshold: 3, reward: { coins: 650, ticket: true } },
    { id: "pika", template: "pikaTrade", params: { count: 3 }, counterKey: "pika.trade", threshold: 3, reward: { coins: 650, ticket: true } },
    { id: "kitchen", template: "kitchenDeliver", params: { count: 6 }, counterKey: "kitchen.deliver", threshold: 6, reward: { coins: 650, ticket: true } },
    { id: "fight", template: "fightWin", params: { count: 4 }, counterKey: "fight.win", threshold: 4, reward: { coins: 650, ticket: true } },
  ],
];

/** Emoji shown on a task row, by template (matches the category it belongs to). */
export const TEMPLATE_EMOJI = {
  shopSpend: "🧺",
  feedAny: "🍖",
  feedItem: "🍖",
  cleanAny: "🫧",
  cleanItem: "🫧",
  homework: "✏️",
  study: "🎓",
  work: "💼",
  tourAny: "🗺️",
  tourSport: "🏟️",
  tourCity: "🌍",
  pikaTrade: "🐱",
  kitchenDeliver: "🍳",
  fightWin: "🥊",
  allDone: "🎉",
};
