// career/careerData.js — the career system's data: XP tiers, the rank ladder
// template, the career list, and the generated job catalog.
//
// Each CAREER has its own experience-point (XP) track, organized into
// 5 tiers × 5 levels (Entry 1-5 → Junior 1-5 → Senior → Expert → Master).
// Jobs pay coins and grant XP on completion (prorated if ended early); the
// care drain is deducted when the job starts. Every career ladders through
// 5 job ranks; higher ranks unlock at an overall level plus the career's
// focus-trait minimums and (sometimes) subject degrees. Completing a tier
// (reaching its level 5 cap) earns an achievement.

/**
 * XP tiers, in order. Each tier has 5 levels of `perLevel` XP each.
 * Each entry: `{ name, perLevel }`.
 */
export const TIERS = [
  { name: "Entry", perLevel: 10 },
  { name: "Junior", perLevel: 20 },
  { name: "Senior", perLevel: 35 },
  { name: "Expert", perLevel: 55 },
  { name: "Master", perLevel: 80 },
];

/** Total XP a career can hold (all tiers maxed) — 1000. */
export const CAREER_MAX_XP = TIERS.reduce((sum, t) => sum + t.perLevel * 5, 0);

/**
 * Rank ladder shared by every career; per-career flavor comes from the
 * career's focus-trait minimums and optional degree requirements.
 * Each entry: `{ rank, minutes, pay, xp, level }` where `level` is the
 * overall level required to unlock the rank.
 */
export const JOB_RANK_TEMPLATE = [
  { rank: 1, minutes: 30, pay: 40, xp: 5, level: 0 },
  { rank: 2, minutes: 45, pay: 95, xp: 8, level: 5 },
  { rank: 3, minutes: 60, pay: 150, xp: 12, level: 10 },
  { rank: 4, minutes: 100, pay: 270, xp: 18, level: 15 },
  { rank: 5, minutes: 120, pay: 400, xp: 25, level: 20 },
];

/** Focus-trait minimum required at each rank (indexed by rank - 1). */
export const DEFAULT_TRAIT_MINS = [0, 5, 12, 20, 28];

/**
 * The career catalog. Each entry:
 * `{ key, label, emoji, trait, degrees?, jobs }` where `trait` is the focus
 * trait, `degrees` maps `{rank: {subject, stage}}` (required from that rank
 * upward), and `jobs` lists the five `{ emoji, name }` rank titles.
 */
export const CAREERS = [
  { key: "chef", label: "Chef", emoji: "🍳", trait: "charm", jobs: [
    { emoji: "🍽️", name: "Dishwasher" }, { emoji: "🥘", name: "Line Cook" }, { emoji: "🔪", name: "Sous Chef" }, { emoji: "👨‍🍳", name: "Head Chef" }, { emoji: "🌟", name: "Celebrity Chef" },
  ] },
  { key: "singer", label: "Singer", emoji: "🎤", trait: "charm", jobs: [
    { emoji: "🎙️", name: "Street Busker" }, { emoji: "🎤", name: "Backup Singer" }, { emoji: "🎶", name: "Club Singer" }, { emoji: "💿", name: "Recording Artist" }, { emoji: "🌟", name: "Pop Star" },
  ] },
  { key: "detective", label: "Detective", emoji: "🕵️", trait: "smarts", degrees: { 3: { subject: "literature", stage: "middle" } }, jobs: [
    { emoji: "🚓", name: "Patrol Assistant" }, { emoji: "🔎", name: "Junior Detective" }, { emoji: "🕵️", name: "Private Eye" }, { emoji: "🔍", name: "Chief Detective" }, { emoji: "🧩", name: "Master Sleuth" },
  ] },
  { key: "scientist", label: "Scientist", emoji: "🧑‍🔬", trait: "smarts", degrees: { 1: { subject: "science", stage: "grade" }, 3: { subject: "science", stage: "middle" }, 5: { subject: "science", stage: "high" } }, jobs: [
    { emoji: "🥼", name: "Lab Assistant" }, { emoji: "🔬", name: "Research Tech" }, { emoji: "🧑‍🔬", name: "Researcher" }, { emoji: "🧪", name: "Senior Scientist" }, { emoji: "🎓", name: "Professor" },
  ] },
  { key: "lawyer", label: "Lawyer", emoji: "⚖️", trait: "smarts", degrees: { 1: { subject: "literature", stage: "grade" }, 3: { subject: "literature", stage: "middle" } }, jobs: [
    { emoji: "📋", name: "Paralegal" }, { emoji: "📚", name: "Law Clerk" }, { emoji: "⚖️", name: "Associate" }, { emoji: "🏛️", name: "Senior Counsel" }, { emoji: "👔", name: "Partner" },
  ] },
  { key: "doctor", label: "Doctor", emoji: "🩺", trait: "smarts", degrees: { 1: { subject: "science", stage: "grade" }, 3: { subject: "science", stage: "high" } }, jobs: [
    { emoji: "🩹", name: "Nurse Aide" }, { emoji: "📖", name: "Med Student" }, { emoji: "🩺", name: "Resident" }, { emoji: "🧑‍⚕️", name: "Attending" }, { emoji: "🏥", name: "Surgeon" },
  ] },
  { key: "athlete", label: "Basketball Player", emoji: "🏀", trait: "fitness", degrees: { 3: { subject: "sports", stage: "middle" } }, jobs: [
    { emoji: "🐾", name: "Team Mascot" }, { emoji: "🎽", name: "Ball Crew" }, { emoji: "🏀", name: "Bench Player" }, { emoji: "🔥", name: "Starter" }, { emoji: "🏆", name: "MVP" },
  ] },
  { key: "engineer", label: "IT Engineer", emoji: "💻", trait: "smarts", degrees: { 1: { subject: "math", stage: "grade" }, 3: { subject: "math", stage: "middle" } }, jobs: [
    { emoji: "🖱️", name: "Help Desk" }, { emoji: "🐞", name: "QA Tester" }, { emoji: "💻", name: "Developer" }, { emoji: "🛠️", name: "Senior Engineer" }, { emoji: "🏗️", name: "Architect" },
  ] },
  { key: "artist", label: "Artist", emoji: "🎨", trait: "charm", degrees: { 3: { subject: "art", stage: "middle" } }, jobs: [
    { emoji: "✏️", name: "Sketch Vendor" }, { emoji: "🖊️", name: "Illustrator" }, { emoji: "🖼️", name: "Gallery Artist" }, { emoji: "🎨", name: "Art Director" }, { emoji: "🌈", name: "Famous Painter" },
  ] },
  { key: "pilot", label: "Pilot", emoji: "✈️", trait: "fitness", degrees: { 3: { subject: "math", stage: "middle" } }, jobs: [
    { emoji: "🧳", name: "Ground Crew" }, { emoji: "🛎️", name: "Flight Attendant" }, { emoji: "🛫", name: "Co-Pilot" }, { emoji: "✈️", name: "Captain" }, { emoji: "🚀", name: "Astronaut" },
  ] },
  { key: "teacher", label: "Teacher", emoji: "🧑‍🏫", trait: "smarts", degrees: { 3: { subject: "literature", stage: "middle" } }, jobs: [
    { emoji: "📝", name: "Tutor" }, { emoji: "📚", name: "Teaching Assistant" }, { emoji: "🧑‍🏫", name: "Teacher" }, { emoji: "🏫", name: "Principal" }, { emoji: "🎓", name: "Dean" },
  ] },
  { key: "gamer", label: "Pro Gamer", emoji: "🎮", trait: "smarts", jobs: [
    { emoji: "📹", name: "Noob Streamer" }, { emoji: "🕹️", name: "Ranked Player" }, { emoji: "🎧", name: "Esports Sub" }, { emoji: "🎮", name: "Pro Gamer" }, { emoji: "🏅", name: "World Champion" },
  ] },
];

/**
 * Every job of every career, generated from CAREERS × JOB_RANK_TEMPLATE.
 * Each job: `{ key, career, rank, emoji, name, minutes, pay, xp,
 * requires: {level?, traits?, degrees?}, drain: {energy, hygiene, mood} }`.
 */
export const JOB_CATALOG = CAREERS.flatMap((career) =>
  career.jobs.map((job, i) => {
    const t = JOB_RANK_TEMPLATE[i];
    const requires = {};
    if (t.level) requires.level = t.level;
    const traitMin = DEFAULT_TRAIT_MINS[i];
    if (traitMin) requires.traits = { [career.trait]: traitMin };
    const degree = career.degrees?.[t.rank];
    if (degree) requires.degrees = [degree];
    return {
      key: `${career.key}-${t.rank}`,
      career: career.key,
      rank: t.rank,
      emoji: job.emoji,
      name: job.name,
      minutes: t.minutes,
      pay: t.pay,
      xp: t.xp,
      requires,
      drain: {
        energy: Math.round(t.minutes * 0.32),
        hygiene: Math.round(t.minutes * 0.26),
        mood: Math.round(t.minutes * 0.3),
      },
    };
  })
);
