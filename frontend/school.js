// Shared school data + helpers, loaded as a plain <script> by the stats
// window (which runs the activity clock) and the hub window (School page UI).
//
// Each SUBJECT progresses independently: Kindergarten Y1-Y3 → Grade School
// Y1-Y6 → Middle School Y1-Y3 → High School Y1-Y3 (15 years total). Credits
// earned by a class count toward that class's subject only.

// One game-"minute" for classes/jobs/tours/caretaker shifts. Developer mode
// (Settings) switches to the fast value at activity start time.
const SCHOOL_MINUTE_MS_NORMAL = 60_000;
const SCHOOL_MINUTE_MS_DEV = 5_000;

function schoolMinuteMs(devMode) {
  return devMode ? SCHOOL_MINUTE_MS_DEV : SCHOOL_MINUTE_MS_NORMAL;
}

const SCHOOL_STAGES = [
  { key: "kindergarten", label: "Kindergarten", emoji: "🧸", years: 3, creditsPerYear: 10 },
  { key: "grade", label: "Grade School", emoji: "🎒", years: 6, creditsPerYear: 20 },
  { key: "middle", label: "Middle School", emoji: "📗", years: 3, creditsPerYear: 35 },
  { key: "high", label: "High School", emoji: "📘", years: 3, creditsPerYear: 50 },
  { key: "bachelor", label: "Bachelor's", emoji: "🎓", years: 4, creditsPerYear: 70 },
  { key: "master", label: "Master's", emoji: "📜", years: 2, creditsPerYear: 90 },
  { key: "phd", label: "PhD", emoji: "🧑‍🎓", years: 5, creditsPerYear: 110 },
];

const TOTAL_SCHOOL_YEARS = SCHOOL_STAGES.reduce((sum, s) => sum + s.years, 0); // 15

const SUBJECTS = [
  { key: "math", label: "Math", emoji: "🧮" },
  { key: "literature", label: "Literature", emoji: "📚" },
  { key: "science", label: "Science", emoji: "🔬" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "art", label: "Art", emoji: "🎨" },
  { key: "engineering", label: "Engineering", emoji: "🛠️" },
];

// One course per subject per stage. Longer/higher-stage courses reward more
// credits/traits but cost more coins and drain more care. Coins + drain are
// deducted when the class STARTS; credits + trait rewards land when it
// completes (prorated if ended early).
const CLASS_CATALOG = [
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

// Higher-education courses are uniform across subjects; generate them.
const SUBJECT_TRAIT = {
  math: "smarts",
  literature: "smarts",
  science: "smarts",
  engineering: "smarts",
  sports: "fitness",
  music: "charm",
  art: "charm",
};

const HIGHER_ED = [
  { stage: "bachelor", emoji: "🎓", suffix: "Undergrad Seminar", minutes: 100, credits: 20, cost: 150, reward: 10 },
  { stage: "master", emoji: "📜", suffix: "Graduate Studies", minutes: 100, credits: 24, cost: 200, reward: 12 },
  { stage: "phd", emoji: "🧑‍🎓", suffix: "PhD Research", minutes: 100, credits: 30, cost: 260, reward: 15 },
];

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

function findClass(key) {
  return CLASS_CATALOG.find((c) => c.key === key);
}

function findSubject(key) {
  return SUBJECTS.find((s) => s.key === key);
}

// years = completed school years in a subject (0..15).
function stageOfYears(years) {
  let acc = 0;
  for (const stage of SCHOOL_STAGES) {
    if (years < acc + stage.years) return { stage, yearInStage: years - acc + 1 };
    acc += stage.years;
  }
  return null; // subject mastered
}

// First/last completed-years boundary of a stage.
function stageStartYears(stageKey) {
  let acc = 0;
  for (const stage of SCHOOL_STAGES) {
    if (stage.key === stageKey) return acc;
    acc += stage.years;
  }
  return Infinity;
}

function stageEndYears(stageKey) {
  const stage = SCHOOL_STAGES.find((s) => s.key === stageKey);
  return stage ? stageStartYears(stageKey) + stage.years : Infinity;
}

// A course is available once its subject has reached the course's stage.
function isClassUnlocked(cls, subjects) {
  const years = subjects[cls.subject]?.years ?? 0;
  return years >= stageStartYears(cls.stage);
}

function classUnlockText(cls) {
  const stage = SCHOOL_STAGES.find((s) => s.key === cls.stage);
  const subject = findSubject(cls.subject);
  return `Reach ${stage.label} in ${subject.label}`;
}

// Consume a subject's credits into completed years. Returns the keys of any
// stages COMPLETED along the way (diplomas earned for this subject).
function advanceSubject(sub) {
  const completed = [];
  for (;;) {
    const info = stageOfYears(sub.years);
    if (!info || sub.credits < info.stage.creditsPerYear) return completed;
    sub.credits -= info.stage.creditsPerYear;
    sub.years += 1;
    if (info.yearInStage === info.stage.years) completed.push(info.stage.key);
  }
}

function subjectStageLabel(sub) {
  const info = stageOfYears(sub.years);
  return info
    ? `${info.stage.emoji} ${info.stage.label} · Y${info.yearInStage}/${info.stage.years}`
    : "🎉 Mastered";
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
