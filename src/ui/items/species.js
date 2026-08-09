// items/species.js — pet species (forms). A form is PURCHASED once at its
// price (which also switches to it immediately); afterwards switching between
// owned forms is free. Every sheet shares the poodle's 8x11 sprite grid.

/**
 * The species catalog.
 * Each entry: `{ key, label, breed, sheet, price, defaultName }` where
 * `sheet` is the spritesheet path and `defaultName` pre-fills the setup form.
 */
export const SPECIES = [
  { key: "toy_poodle", label: "Toy Poodle", breed: "Chocolate Toy Poodle", sheet: "pets/toy_poodle.webp", price: 8000, defaultName: "Huanhuan" },
  { key: "white_cat", label: "White Cat", breed: "White Cat", sheet: "pets/white_cat.webp", price: 8000, defaultName: "Mimi" },
  { key: "bichon", label: "Bichon", breed: "Bichon Frisé", sheet: "pets/bichon.webp", price: 8000, defaultName: "Snow" },
  { key: "black_cat", label: "Black Cat", breed: "Black Cat", sheet: "pets/black_cat.webp", price: 8000, defaultName: "Bean" },
];
