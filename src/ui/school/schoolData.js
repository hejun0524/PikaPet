// school/schoolData.js — the school system's data: stages, subjects, and the
// class catalog (including the generated higher-education courses).
//
// Each SUBJECT progresses independently: Kindergarten Y1-Y3 → Grade School
// Y1-Y6 → Middle School Y1-Y3 → High School Y1-Y3 … up to PhD. Credits
// earned by a class count toward that class's subject only.

/** One game-"minute" for classes/jobs/tours/caretaker shifts, in real ms. */
export const SCHOOL_MINUTE_MS_NORMAL = 60_000;

/** Fast game-minute used while developer mode is on (Settings). */
export const SCHOOL_MINUTE_MS_DEV = 5_000;

/**
 * School stages in order. Each: `{ key, label, emoji, years, creditsPerYear }`
 * — a subject spends `years` years in the stage, each year costing
 * `creditsPerYear` credits.
 */
export const SCHOOL_STAGES = [
  { key: "kindergarten", label: "Kindergarten", emoji: "🧸", years: 3, creditsPerYear: 10 },
  { key: "grade", label: "Grade School", emoji: "🎒", years: 6, creditsPerYear: 20 },
  { key: "middle", label: "Middle School", emoji: "📗", years: 3, creditsPerYear: 35 },
  { key: "high", label: "High School", emoji: "📘", years: 3, creditsPerYear: 50 },
  { key: "bachelor", label: "Bachelor's", emoji: "🎓", years: 4, creditsPerYear: 70 },
  { key: "master", label: "Master's", emoji: "📜", years: 2, creditsPerYear: 90 },
  { key: "phd", label: "PhD", emoji: "🧑‍🎓", years: 5, creditsPerYear: 110 },
];

/** Total years to master a subject (sum of every stage's years). */
export const TOTAL_SCHOOL_YEARS = SCHOOL_STAGES.reduce((sum, s) => sum + s.years, 0);

/** The subjects a pet can study. Each: `{ key, label, emoji }`. */
export const SUBJECTS = [
  { key: "math", label: "Math", emoji: "🧮" },
  { key: "literature", label: "Literature", emoji: "📚" },
  { key: "science", label: "Science", emoji: "🔬" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "art", label: "Art", emoji: "🎨" },
  { key: "engineering", label: "Engineering", emoji: "🛠️" },
];

/**
 * One course per subject per stage. Longer/higher-stage courses reward more
 * credits/traits but cost more coins and drain more care. Coins + drain are
 * deducted when the class STARTS; credits + trait rewards land when it
 * completes (prorated if ended early).
 *
 * Each class: `{ key, subject, stage, emoji, name, minutes, credits, cost,
 * rewards: {traitKey: amount}, drain: {careKey: amount} }`.
 * (Higher-ed courses are appended below.)
 */
export const CLASS_CATALOG = [
  // Kindergarten: 10m, +3 credits, 💰10
  { key: "math-kindergarten", subject: "math", stage: "kindergarten", emoji: "🔢", name: "Counting Games", minutes: 10, credits: 3, cost: 10, rewards: { smarts: 1 }, drain: { energy: 3, hygiene: 2, mood: 3 } },
  { key: "literature-kindergarten", subject: "literature", stage: "kindergarten", emoji: "🅰️", name: "Alphabet Time", minutes: 10, credits: 3, cost: 10, rewards: { smarts: 1 }, drain: { energy: 3, hygiene: 2, mood: 3 } },
  { key: "science-kindergarten", subject: "science", stage: "kindergarten", emoji: "🐛", name: "Nature Walk", minutes: 10, credits: 3, cost: 10, rewards: { smarts: 1 }, drain: { energy: 3, hygiene: 3, mood: 2 } },
  { key: "sports-kindergarten", subject: "sports", stage: "kindergarten", emoji: "🤸", name: "Playground Time", minutes: 10, credits: 3, cost: 10, rewards: { fitness: 1 }, drain: { energy: 4, hygiene: 3, mood: 1 } },
  { key: "music-kindergarten", subject: "music", stage: "kindergarten", emoji: "🎶", name: "Sing-Along", minutes: 10, credits: 3, cost: 10, rewards: { charm: 1 }, drain: { energy: 3, hygiene: 2, mood: 3 } },
  { key: "art-kindergarten", subject: "art", stage: "kindergarten", emoji: "🖍️", name: "Finger Painting", minutes: 10, credits: 3, cost: 10, rewards: { charm: 1 }, drain: { energy: 3, hygiene: 3, mood: 2 } },
  { key: "engineering-kindergarten", subject: "engineering", stage: "kindergarten", emoji: "🧱", name: "Building Blocks", minutes: 10, credits: 3, cost: 10, rewards: { smarts: 1 }, drain: { energy: 3, hygiene: 2, mood: 3 } },
  // Grade school: 30m, +5 credits, 💰25
  { key: "math-grade", subject: "math", stage: "grade", emoji: "🧮", name: "Math Class", minutes: 30, credits: 5, cost: 25, rewards: { smarts: 3 }, drain: { energy: 8, hygiene: 6, mood: 8 } },
  { key: "literature-grade", subject: "literature", stage: "grade", emoji: "📖", name: "Reading Class", minutes: 30, credits: 5, cost: 25, rewards: { smarts: 3 }, drain: { energy: 8, hygiene: 6, mood: 8 } },
  { key: "science-grade", subject: "science", stage: "grade", emoji: "🔭", name: "Science Club", minutes: 30, credits: 5, cost: 25, rewards: { smarts: 3 }, drain: { energy: 8, hygiene: 6, mood: 8 } },
  { key: "sports-grade", subject: "sports", stage: "grade", emoji: "⚽", name: "Soccer Practice", minutes: 30, credits: 5, cost: 25, rewards: { fitness: 3 }, drain: { energy: 10, hygiene: 8, mood: 4 } },
  { key: "music-grade", subject: "music", stage: "grade", emoji: "🎹", name: "Piano Lessons", minutes: 30, credits: 5, cost: 25, rewards: { charm: 3 }, drain: { energy: 8, hygiene: 5, mood: 9 } },
  { key: "art-grade", subject: "art", stage: "grade", emoji: "🎨", name: "Art Class", minutes: 30, credits: 5, cost: 25, rewards: { charm: 3 }, drain: { energy: 8, hygiene: 8, mood: 6 } },
  { key: "engineering-grade", subject: "engineering", stage: "grade", emoji: "🤖", name: "Robot Kit Club", minutes: 30, credits: 5, cost: 25, rewards: { smarts: 3 }, drain: { energy: 8, hygiene: 6, mood: 8 } },
  // Middle school: 45m, +8 credits, 💰45
  { key: "math-middle", subject: "math", stage: "middle", emoji: "➗", name: "Algebra", minutes: 45, credits: 8, cost: 45, rewards: { smarts: 5 }, drain: { energy: 12, hygiene: 9, mood: 12 } },
  { key: "literature-middle", subject: "literature", stage: "middle", emoji: "✍️", name: "Writing Workshop", minutes: 45, credits: 8, cost: 45, rewards: { smarts: 5 }, drain: { energy: 12, hygiene: 9, mood: 12 } },
  { key: "science-middle", subject: "science", stage: "middle", emoji: "🧪", name: "Lab Session", minutes: 45, credits: 8, cost: 45, rewards: { smarts: 5 }, drain: { energy: 12, hygiene: 10, mood: 11 } },
  { key: "sports-middle", subject: "sports", stage: "middle", emoji: "🏀", name: "Basketball Training", minutes: 45, credits: 8, cost: 45, rewards: { fitness: 5 }, drain: { energy: 14, hygiene: 12, mood: 7 } },
  { key: "music-middle", subject: "music", stage: "middle", emoji: "🎻", name: "Violin Class", minutes: 45, credits: 8, cost: 45, rewards: { charm: 5 }, drain: { energy: 12, hygiene: 8, mood: 13 } },
  { key: "art-middle", subject: "art", stage: "middle", emoji: "🗿", name: "Sculpture Studio", minutes: 45, credits: 8, cost: 45, rewards: { charm: 5 }, drain: { energy: 12, hygiene: 12, mood: 9 } },
  { key: "engineering-middle", subject: "engineering", stage: "middle", emoji: "💻", name: "Coding Class", minutes: 45, credits: 8, cost: 45, rewards: { smarts: 5 }, drain: { energy: 12, hygiene: 8, mood: 13 } },
  // High school: 100m, +14 credits, 💰90
  { key: "math-high", subject: "math", stage: "high", emoji: "📐", name: "Calculus", minutes: 100, credits: 14, cost: 90, rewards: { smarts: 8 }, drain: { energy: 25, hygiene: 18, mood: 22 } },
  { key: "literature-high", subject: "literature", stage: "high", emoji: "📜", name: "World Literature", minutes: 100, credits: 14, cost: 90, rewards: { smarts: 8 }, drain: { energy: 25, hygiene: 18, mood: 22 } },
  { key: "science-high", subject: "science", stage: "high", emoji: "🧬", name: "Biology & Physics", minutes: 100, credits: 14, cost: 90, rewards: { smarts: 8 }, drain: { energy: 25, hygiene: 19, mood: 21 } },
  { key: "sports-high", subject: "sports", stage: "high", emoji: "🏆", name: "Varsity Team", minutes: 100, credits: 14, cost: 90, rewards: { fitness: 8 }, drain: { energy: 28, hygiene: 22, mood: 15 } },
  { key: "music-high", subject: "music", stage: "high", emoji: "🎼", name: "Orchestra", minutes: 100, credits: 14, cost: 90, rewards: { charm: 8 }, drain: { energy: 25, hygiene: 16, mood: 24 } },
  { key: "art-high", subject: "art", stage: "high", emoji: "🖼️", name: "Studio Art", minutes: 100, credits: 14, cost: 90, rewards: { charm: 8 }, drain: { energy: 25, hygiene: 20, mood: 20 } },
  { key: "engineering-high", subject: "engineering", stage: "high", emoji: "⚙️", name: "Engineering Lab", minutes: 100, credits: 14, cost: 90, rewards: { smarts: 8 }, drain: { energy: 25, hygiene: 17, mood: 23 } },
];

/** The trait each subject's classes reward. */
export const SUBJECT_TRAIT = {
  math: "smarts",
  literature: "smarts",
  science: "smarts",
  engineering: "smarts",
  sports: "fitness",
  music: "charm",
  art: "charm",
};

/**
 * Higher-education course templates — uniform across subjects, so the
 * bachelor/master/phd courses are generated from these below.
 */
export const HIGHER_ED = [
  { stage: "bachelor", emoji: "🎓", suffix: "Undergrad Seminar", minutes: 100, credits: 20, cost: 150, reward: 10 },
  { stage: "master", emoji: "📜", suffix: "Graduate Studies", minutes: 100, credits: 24, cost: 200, reward: 12 },
  { stage: "phd", emoji: "🧑‍🎓", suffix: "PhD Research", minutes: 100, credits: 30, cost: 260, reward: 15 },
];

// Generate the higher-ed course for every subject × template.
for (const subject of SUBJECTS) {
  for (const h of HIGHER_ED) {
    CLASS_CATALOG.push({
      key: `${subject.key}-${h.stage}`,
      subject: subject.key,
      stage: h.stage,
      emoji: h.emoji,
      name: `${subject.label} ${h.suffix}`,
      minutes: h.minutes,
      credits: h.credits,
      cost: h.cost,
      rewards: { [SUBJECT_TRAIT[subject.key]]: h.reward },
      drain: { energy: 26, hygiene: 18, mood: 24 },
    });
  }
}
