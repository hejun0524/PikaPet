// items/services.js — Town-only services: bought and consumed immediately at
// checkout, never enter the bag.

/**
 * The services catalog. Each entry looks like an item
 * (`{ key, emoji, name, price, desc }`) plus `service: true`, which tells the
 * checkout to apply the effect immediately instead of stocking the bag.
 */
export const SERVICES = [
  {
    key: "cure",
    emoji: "🏥",
    name: "Full Recovery",
    price: 200,
    service: true,
    desc: "Restores all care meters to 100",
  },
];
