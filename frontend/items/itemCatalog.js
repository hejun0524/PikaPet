// items/itemCatalog.js — every usable item in the game, grouped by Home-view
// category. Effect keys must match care meter keys (energy/hygiene/mood/
// health) or trait keys (fitness/smarts/charm).
//
// Economy: prices are in coins; roughly 1 coin ≈ 1 care point, mood points
// come along for free-ish, meds and trait-raising homework carry a premium.

/**
 * Starting quantity for items that don't set `startQty`; store-only goods
 * (homework, fancier foods) set `startQty: 0` and must be bought in the Town.
 */
export const DEFAULT_ITEM_QTY = 10;

/**
 * The Home view's item categories.
 * Each category: `{ key, label, tabEmoji, items }`; each item:
 * `{ key, emoji, name, price, startQty?, effects: {statKey: delta} }`.
 */
export const ITEM_CATALOG = [
  {
    key: "food",
    label: "Food",
    tabEmoji: "🍖",
    items: [
      { key: "carrot", emoji: "🥕", name: "Carrot", price: 4, startQty: 0, effects: { energy: 2, mood: 2 } },
      { key: "apple", emoji: "🍎", name: "Apple", price: 5, startQty: 0, effects: { energy: 3, mood: 2 } },
      { key: "milk", emoji: "🥛", name: "Milk", price: 8, startQty: 0, effects: { energy: 4, mood: 3 } },
      { key: "cookie", emoji: "🍪", name: "Cookie", price: 10, effects: { energy: 5, mood: 5 } },
      { key: "donut", emoji: "🍩", name: "Donut", price: 15, effects: { energy: 7, mood: 7 } },
      { key: "noodles", emoji: "🍜", name: "Noodles", price: 30, effects: { energy: 15, mood: 15 } },
      { key: "pizza", emoji: "🍕", name: "Pizza", price: 35, startQty: 0, effects: { energy: 18, mood: 15 } },
      { key: "bento", emoji: "🍱", name: "Lunch Box", price: 40, effects: { energy: 20, mood: 20 } },
      { key: "sushi", emoji: "🍣", name: "Sushi Set", price: 50, startQty: 0, effects: { energy: 22, mood: 18 } },
      { key: "steak", emoji: "🥩", name: "Steak", price: 60, startQty: 0, effects: { energy: 30, mood: 20 } },
      { key: "cake", emoji: "🎂", name: "Birthday Cake", price: 80, startQty: 0, effects: { energy: 35, mood: 30 } },
    ],
  },
  {
    key: "bath",
    label: "Bath",
    tabEmoji: "🫧",
    items: [
      { key: "toothbrush", emoji: "🪥", name: "Toothbrush", price: 8, startQty: 0, effects: { hygiene: 4, mood: 2 } },
      { key: "soap", emoji: "🧼", name: "Soap", price: 10, effects: { hygiene: 5, mood: 5 } },
      { key: "shampoo", emoji: "🧴", name: "Shampoo", price: 15, effects: { hygiene: 7, mood: 7 } },
      { key: "sponge", emoji: "🧽", name: "Scrub Sponge", price: 20, startQty: 0, effects: { hygiene: 10, mood: 8 } },
      { key: "bubbles", emoji: "🫧", name: "Bubble Bath", price: 30, effects: { hygiene: 15, mood: 15 } },
      { key: "spa", emoji: "🛁", name: "Spa Day", price: 40, effects: { hygiene: 20, mood: 20 } },
      { key: "grooming", emoji: "💆", name: "Full Grooming", price: 60, startQty: 0, effects: { hygiene: 30, mood: 20 } },
      { key: "hotspring", emoji: "🛀", name: "Hot Spring Trip", price: 75, startQty: 0, effects: { hygiene: 35, mood: 25 } },
    ],
  },
  {
    key: "toys",
    label: "Toys",
    tabEmoji: "🎾",
    items: [
      { key: "yoyo", emoji: "🪀", name: "Yo-yo", price: 8, startQty: 0, effects: { mood: 4 } },
      { key: "ball", emoji: "🎾", name: "Ball", price: 10, effects: { mood: 5 } },
      { key: "coloring", emoji: "🖍️", name: "Coloring Book", price: 12, startQty: 0, effects: { mood: 6 } },
      { key: "frisbee", emoji: "🥏", name: "Frisbee", price: 15, effects: { mood: 7 } },
      { key: "blocks", emoji: "🧱", name: "Building Blocks", price: 18, startQty: 0, effects: { mood: 9 } },
      { key: "kite", emoji: "🪁", name: "Kite", price: 20, startQty: 0, effects: { mood: 10 } },
      { key: "puzzle", emoji: "🧩", name: "Jigsaw Puzzle", price: 25, startQty: 0, effects: { mood: 12 } },
      { key: "rope", emoji: "🪢", name: "Rope Toy", price: 30, effects: { mood: 15 } },
      { key: "train", emoji: "🚂", name: "Toy Train", price: 35, startQty: 0, effects: { mood: 18 } },
      { key: "teddy", emoji: "🧸", name: "Teddy Bear", price: 40, effects: { mood: 20 } },
      { key: "skateboard", emoji: "🛹", name: "Skateboard", price: 45, startQty: 0, effects: { mood: 22 } },
      { key: "console", emoji: "🎮", name: "Game Console", price: 60, startQty: 0, effects: { mood: 28 } },
      { key: "robot", emoji: "🤖", name: "Robot Pal", price: 70, startQty: 0, effects: { mood: 32 } },
      { key: "drone", emoji: "🛸", name: "Mini Drone", price: 90, startQty: 0, effects: { mood: 40 } },
    ],
  },
  {
    key: "meds",
    label: "Meds",
    tabEmoji: "💊",
    items: [
      { key: "honey", emoji: "🍯", name: "Honey Syrup", price: 15, startQty: 0, effects: { health: 5 } },
      { key: "vitamins", emoji: "💊", name: "Vitamins", price: 25, effects: { health: 10 } },
      { key: "bandage", emoji: "🩹", name: "First Aid", price: 45, effects: { health: 20 } },
      { key: "shot", emoji: "💉", name: "Booster Shot", price: 70, effects: { health: 30 } },
      { key: "tonic", emoji: "🧬", name: "Gene Tonic", price: 120, startQty: 0, effects: { health: 50 } },
    ],
  },
  {
    // Homework raises a trait at a care cost; negative effects are costs the
    // pet must be able to fully pay. Stocked only via the Town's store.
    key: "homework",
    label: "Homework",
    tabEmoji: "✏️",
    items: [
      { key: "math", emoji: "📐", name: "Math Homework", price: 25, startQty: 0, effects: { smarts: 1, energy: -5, mood: -5 } },
      { key: "reading", emoji: "📖", name: "Book Report", price: 25, startQty: 0, effects: { smarts: 1, energy: -5, mood: -5 } },
      { key: "basketball", emoji: "🏀", name: "Basketball Drills", price: 25, startQty: 0, effects: { fitness: 1, hygiene: -5, mood: -5 } },
      { key: "swimming", emoji: "🏊", name: "Swim Practice", price: 25, startQty: 0, effects: { fitness: 1, energy: -5, mood: -5 } },
      { key: "violin", emoji: "🎻", name: "Violin Class", price: 25, startQty: 0, effects: { charm: 1, energy: -5, mood: -5 } },
      { key: "dance", emoji: "💃", name: "Dance Class", price: 25, startQty: 0, effects: { charm: 1, hygiene: -5, mood: -5 } },
    ],
  },
];

/** Flat list of every item across all categories. */
export const ALL_ITEMS = ITEM_CATALOG.flatMap((category) => category.items);

/** Homework is limited to this many uses per day (resets at local midnight). */
export const HOMEWORK_DAILY_LIMIT = 5;

/** Item keys that count against the daily homework limit. */
export const HOMEWORK_ITEM_KEYS = new Set(
  ITEM_CATALOG.find((c) => c.key === "homework").items.map((i) => i.key)
);
