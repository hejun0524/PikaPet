// items/shopCatalog.js — tab definitions for the hub's Life, Career, and
// Touring views.

/**
 * The Life view's stores. Each store: `{ key, label, tabEmoji, sells }` where
 * `sells` references item keys (itemCatalog.js) or service keys (services.js).
 */
export const SHOP_CATALOG = [
  { key: "food-store", label: "Food Store", tabEmoji: "🍎", sells: ["carrot", "apple", "milk", "cookie", "donut", "noodles", "pizza", "bento", "sushi", "steak", "cake"] },
  { key: "bath-store", label: "Bath Shop", tabEmoji: "🧼", sells: ["toothbrush", "soap", "shampoo", "sponge", "bubbles", "spa", "grooming", "hotspring"] },
  { key: "toy-store", label: "Toy Store", tabEmoji: "🧸", sells: ["yoyo", "ball", "coloring", "frisbee", "blocks", "kite", "puzzle", "rope", "train", "teddy", "skateboard", "console", "robot", "drone"] },
  { key: "hospital", label: "Hospital", tabEmoji: "🏥", sells: ["honey", "vitamins", "bandage", "shot", "tonic", "cure"] },
  { key: "homework-store", label: "Homework", tabEmoji: "✏️", sells: ["math", "reading", "basketball", "swimming", "violin", "dance"] },
];

/**
 * The Career view's tabs (School and Job pages are custom pages rendered by
 * the hub).
 */
export const CAREER_CATALOG = [
  { key: "school", label: "School", tabEmoji: "🏫" },
  { key: "job", label: "Job", tabEmoji: "🧑‍💼" },
];

/** The Touring view's tabs. */
export const TOURING_TABS = [
  { key: "destinations", label: "Destinations", tabEmoji: "🏝️" },
  { key: "sports", label: "Sports", tabEmoji: "🏟️" },
  { key: "journals", label: "Journals", tabEmoji: "📓" },
];
