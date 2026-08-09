// items/careMeta.js — the pet's stat metadata: care meters (energy, hygiene,
// mood, health) and traits (fitness, smarts, charm). Item/class/job effect
// keys must match one of these keys.

/** Emoji for each care meter, keyed by meter key. */
export const CARE_EMOJI = {
  energy: "⚡",
  hygiene: "🛁",
  mood: "😊",
  health: "❤️",
};

/**
 * Care-meter metadata, in display order.
 * Each entry: `{ key, emoji, label }`.
 */
export const CARE_META = [
  { key: "energy", emoji: CARE_EMOJI.energy, label: "Energy" },
  { key: "hygiene", emoji: CARE_EMOJI.hygiene, label: "Hygiene" },
  { key: "mood", emoji: CARE_EMOJI.mood, label: "Mood" },
  { key: "health", emoji: CARE_EMOJI.health, label: "Health" },
];

/**
 * Trait metadata, in display order. Traits grow without a cap (unlike care
 * meters, which are 0-100). Each entry: `{ key, emoji, label }`.
 */
export const TRAIT_META = [
  { key: "fitness", emoji: "💪", label: "Fitness" },
  { key: "smarts", emoji: "📚", label: "Smarts" },
  { key: "charm", emoji: "✨", label: "Charm" },
];

/** Emoji for ANY stat key — care meters and traits combined. */
export const STAT_EMOJI = {
  ...CARE_EMOJI,
  ...Object.fromEntries(TRAIT_META.map((t) => [t.key, t.emoji])),
};
