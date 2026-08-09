// items/caretakers.js — caretaker services sold at the Pet Center. Each hired
// shift lasts 4 game-hours and is charged when it starts; ending early
// refunds the unused share.
//
// Behavior is data-driven: `care: true` runs the item-based care layer;
// `schedule` is a rotation of activity kinds the caretaker books when the
// pet is free (kinds map to actions in the stats window's caretaker brain).

/** Length of one hired caretaker shift, in game-minutes (4 game-hours). */
export const CARETAKER_MINUTES = 240;

/**
 * The caretaker catalog.
 * Each entry: `{ key, emoji, name, desc, price, care?, schedule? }` where
 * `care` enables item-based meter upkeep and `schedule` is a rotation of
 * activity kinds ("class" | "job" | "citytour" | "sporttour").
 */
export const CARETAKERS = [
  { key: "sitter", emoji: "🧑‍🍼", name: "Pet Sitter", desc: "Feeds, bathes, heals — keeps every meter high", price: 300, care: true },
  { key: "teacher", emoji: "👩‍🏫", name: "Home Teacher", desc: "Keeps the pet in class, balancing all subjects", price: 500, schedule: ["class"] },
  { key: "manager", emoji: "🧑‍💼", name: "Job Manager", desc: "Books the best-paying shifts in the top career", price: 500, schedule: ["job"] },
  { key: "guide", emoji: "🚩", name: "Tour Guide", desc: "Tours world cities (tickets first, then packages)", price: 800, schedule: ["citytour"] },
  { key: "agent", emoji: "🎽", name: "Sports Agent", desc: "Tours sports teams (tickets first, then packages)", price: 1000, schedule: ["sporttour"] },
  { key: "nanny", emoji: "🤖", name: "Super AI Butler", desc: "Sitter care + classes, jobs, city & sports tours", price: 1200, care: true, schedule: ["class", "job", "citytour", "class", "job", "sporttour"] },
];
