// Shared item/store catalog, loaded as a plain <script> by the stats window
// (which applies item effects and purchases) and the hub window (Home + Town).
// Effect keys must match care meter keys (energy/hygiene/mood/health) or
// trait keys (fitness/smarts/charm).
//
// Economy: prices are in coins; roughly 1 coin ≈ 1 care point, mood points
// come along for free-ish, meds and trait-raising homework carry a premium.

const CARE_EMOJI = {
  energy: "⚡",
  hygiene: "🛁",
  mood: "😊",
  health: "❤️",
};

const CARE_META = [
  { key: "energy", emoji: CARE_EMOJI.energy, label: "Energy" },
  { key: "hygiene", emoji: CARE_EMOJI.hygiene, label: "Hygiene" },
  { key: "mood", emoji: CARE_EMOJI.mood, label: "Mood" },
  { key: "health", emoji: CARE_EMOJI.health, label: "Health" },
];

const TRAIT_META = [
  { key: "fitness", emoji: "💪", label: "Fitness" },
  { key: "smarts", emoji: "📚", label: "Smarts" },
  { key: "charm", emoji: "✨", label: "Charm" },
];

const STAT_EMOJI = {
  ...CARE_EMOJI,
  ...Object.fromEntries(TRAIT_META.map((t) => [t.key, t.emoji])),
};

// Items without startQty begin at DEFAULT_ITEM_QTY; store-only goods
// (homework, fancier foods) start at 0 and must be bought in the Town.
const DEFAULT_ITEM_QTY = 10;

const ITEM_CATALOG = [
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
      { key: "ball", emoji: "🎾", name: "Ball", price: 10, effects: { mood: 5 } },
      { key: "coloring", emoji: "🖍️", name: "Coloring Book", price: 12, startQty: 0, effects: { mood: 6 } },
      { key: "frisbee", emoji: "🥏", name: "Frisbee", price: 15, effects: { mood: 7 } },
      { key: "kite", emoji: "🪁", name: "Kite", price: 20, startQty: 0, effects: { mood: 10 } },
      { key: "rope", emoji: "🪢", name: "Rope Toy", price: 30, effects: { mood: 15 } },
      { key: "train", emoji: "🚂", name: "Toy Train", price: 35, startQty: 0, effects: { mood: 18 } },
      { key: "teddy", emoji: "🧸", name: "Teddy Bear", price: 40, effects: { mood: 20 } },
      { key: "console", emoji: "🎮", name: "Game Console", price: 60, startQty: 0, effects: { mood: 28 } },
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
      { key: "basketball", emoji: "🏀", name: "Basketball", price: 25, startQty: 0, effects: { fitness: 1, hygiene: -5, mood: -5 } },
      { key: "swimming", emoji: "🏊", name: "Swim Practice", price: 25, startQty: 0, effects: { fitness: 1, energy: -5, mood: -5 } },
      { key: "violin", emoji: "🎻", name: "Violin Class", price: 25, startQty: 0, effects: { charm: 1, energy: -5, mood: -5 } },
      { key: "dance", emoji: "💃", name: "Dance Class", price: 25, startQty: 0, effects: { charm: 1, hygiene: -5, mood: -5 } },
    ],
  },
];

const ALL_ITEMS = ITEM_CATALOG.flatMap((category) => category.items);

// Homework is limited to a few per day (resets at local midnight).
const HOMEWORK_DAILY_LIMIT = 5;
const HOMEWORK_ITEM_KEYS = new Set(
  ITEM_CATALOG.find((c) => c.key === "homework").items.map((i) => i.key)
);

// Caretaker services (Pet Center). Each hired shift lasts 4 game-hours and
// is charged when it starts; ending early refunds the unused share.
// Behavior is data-driven: `care: true` runs the item-based care layer;
// `schedule` is a rotation of activity kinds the caretaker books when the
// pet is free (kinds map to actions in stats.js).
const CARETAKER_MINUTES = 240;

const CARETAKERS = [
  { key: "sitter", emoji: "🧑‍🍼", name: "Pet Sitter", desc: "Feeds, bathes, heals — keeps every meter high", price: 300, care: true },
  { key: "teacher", emoji: "👩‍🏫", name: "Home Teacher", desc: "Keeps the pet in class, balancing all subjects", price: 500, schedule: ["class"] },
  { key: "manager", emoji: "🧑‍💼", name: "Job Manager", desc: "Books the best-paying shifts in the top career", price: 500, schedule: ["job"] },
  { key: "guide", emoji: "🚩", name: "Tour Guide", desc: "Tours world cities (tickets first, then packages)", price: 800, schedule: ["citytour"] },
  { key: "agent", emoji: "🎽", name: "Sports Agent", desc: "Tours sports teams (tickets first, then packages)", price: 1000, schedule: ["sporttour"] },
  { key: "nanny", emoji: "🤖", name: "Super AI Butler", desc: "Sitter care + classes, jobs, city & sports tours", price: 1200, care: true, schedule: ["class", "job", "citytour", "class", "job", "sporttour"] },
];

function findCaretaker(key) {
  return CARETAKERS.find((c) => c.key === key);
}

// Bank (Pet Center tab): savings earn interest, loans cost more, both
// compounding daily. Coins elsewhere always mean pocket cash.
const SAVINGS_APR = 0.05;
const LOAN_APR = 0.15;
const LOAN_LIMIT = 50000;

// Add-ons are installed from zip files (Settings → Install add-on) into the
// app-data addons directory; the save stores only the user's emoji/name
// overrides keyed by add-on id. `installed` comes from the Rust scan.
function addonList(installed, overrides) {
  return (installed ?? []).map((a) => ({
    id: a.id,
    emoji: a.emoji || "🧩",
    name: a.name || a.id,
    entry: a.entry,
    dir: a.dir,
    ...(overrides?.[a.id] ?? {}),
  }));
}

// Pet species (forms). A form is PURCHASED once at its price (which also
// transforms immediately); afterwards switching to any owned form costs the
// small TRANSFORM_FEE. Every sheet shares the poodle's 8x11 grid.
const TRANSFORM_FEE = 200;

const SPECIES = [
  { key: "toy_poodle", label: "Toy Poodle", breed: "Chocolate Toy Poodle", emoji: "🐩", sheet: "pets/toy_poodle.webp", price: 0, defaultName: "Huanhuan" },
  { key: "white_cat", label: "White Cat", breed: "White Cat", emoji: "🐈", sheet: "pets/white_cat.webp", price: 6767, defaultName: "Mimi" },
];

function findSpecies(key) {
  return SPECIES.find((s) => s.key === key) ?? SPECIES[0];
}

// Town-only services: bought and consumed immediately, never enter the bag.
const SERVICES = [
  {
    key: "cure",
    emoji: "🏥",
    name: "Full Recovery",
    price: 200,
    service: true,
    desc: "Restores all care meters to 100",
  },
];

// The Shopping view's stores. `sells` references item/service keys.
const SHOP_CATALOG = [
  { key: "food-store", label: "Food Store", tabEmoji: "🍎", sells: ["carrot", "apple", "milk", "cookie", "donut", "noodles", "pizza", "bento", "sushi", "steak", "cake"] },
  { key: "bath-store", label: "Bath Shop", tabEmoji: "🧼", sells: ["toothbrush", "soap", "shampoo", "sponge", "bubbles", "spa", "grooming", "hotspring"] },
  { key: "toy-store", label: "Toy Store", tabEmoji: "🧸", sells: ["ball", "coloring", "frisbee", "kite", "rope", "train", "teddy", "console"] },
  { key: "hospital", label: "Hospital", tabEmoji: "🏥", sells: ["honey", "vitamins", "bandage", "shot", "tonic", "cure"] },
  { key: "homework-store", label: "Homework", tabEmoji: "✏️", sells: ["math", "reading", "basketball", "swimming", "violin", "dance"] },
];

// The Career view's venues; `construction` entries render as placeholders.
const CAREER_CATALOG = [
  { key: "school", label: "School", tabEmoji: "🏫" }, // custom page, see hub.js + school.js
  { key: "job", label: "Job", tabEmoji: "🧑‍💼", construction: true },
];

// The Touring view's tabs.
const TOURING_TABS = [
  { key: "destinations", label: "Destinations", tabEmoji: "🏝️" },
  { key: "sports", label: "Sports", tabEmoji: "🏟️" },
  { key: "journals", label: "Journals", tabEmoji: "📓" },
];

function findSellable(key) {
  return ALL_ITEMS.find((i) => i.key === key) ?? SERVICES.find((s) => s.key === key);
}
