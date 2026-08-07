// Shared career/job data + helpers, loaded as a plain <script> by the stats
// window (which runs the activity clock) and the hub window (Job page UI).
//
// Each CAREER has its own experience-point (XP) track, organized into
// 5 tiers × 5 levels (Entry 1-5 → Junior 1-5 → Senior → Expert → Master).
// Jobs pay coins and grant XP on completion (prorated if ended early); the
// care drain is deducted when the job starts. Every career ladders through
// 5 job ranks; higher ranks unlock at an overall level plus the career's
// focus-trait minimums and (sometimes) subject degrees. Completing a tier
// (reaching its level 5 cap) earns an achievement.

const TIERS = [
  { name: "Entry", perLevel: 10 },
  { name: "Junior", perLevel: 20 },
  { name: "Senior", perLevel: 35 },
  { name: "Expert", perLevel: 55 },
  { name: "Master", perLevel: 80 },
];

const CAREER_MAX_XP = TIERS.reduce((sum, t) => sum + t.perLevel * 5, 0); // 1000

function careerProgress(xp) {
  let remaining = Math.max(0, xp);
  for (let i = 0; i < TIERS.length; i++) {
    const tierTotal = TIERS[i].perLevel * 5;
    if (remaining < tierTotal) {
      const level = Math.floor(remaining / TIERS[i].perLevel) + 1;
      return {
        tierIndex: i,
        tierName: TIERS[i].name,
        level,
        intoLevel: remaining % TIERS[i].perLevel,
        perLevel: TIERS[i].perLevel,
        overallLevel: i * 5 + level,
        maxed: false,
      };
    }
    remaining -= tierTotal;
  }
  return {
    tierIndex: TIERS.length - 1,
    tierName: TIERS[TIERS.length - 1].name,
    level: 5,
    intoLevel: TIERS[TIERS.length - 1].perLevel,
    perLevel: TIERS[TIERS.length - 1].perLevel,
    overallLevel: TIERS.length * 5,
    maxed: true,
  };
}

function tiersCompleted(xp) {
  let remaining = Math.max(0, xp);
  let n = 0;
  for (const tier of TIERS) {
    const total = tier.perLevel * 5;
    if (remaining < total) break;
    remaining -= total;
    n += 1;
  }
  return n;
}

function levelLabel(overallLevel) {
  const tier = TIERS[Math.floor((overallLevel - 1) / 5)];
  const level = ((overallLevel - 1) % 5) + 1;
  return `${tier.name} ${level}`;
}

// Rank ladder shared by every career; per-career flavor comes from the
// career's focus trait minimums and optional degree requirements.
const JOB_RANK_TEMPLATE = [
  { rank: 1, minutes: 30, pay: 40, xp: 5, level: 0 },
  { rank: 2, minutes: 45, pay: 95, xp: 8, level: 5 },
  { rank: 3, minutes: 60, pay: 150, xp: 12, level: 10 },
  { rank: 4, minutes: 100, pay: 270, xp: 18, level: 15 },
  { rank: 5, minutes: 120, pay: 400, xp: 25, level: 20 },
];

const DEFAULT_TRAIT_MINS = [0, 5, 12, 20, 28];

// degrees: {rank: {subject, stage}} — required from that rank upward.
const CAREERS = [
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

const JOB_CATALOG = CAREERS.flatMap((career) =>
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

function findJob(key) {
  return JOB_CATALOG.find((j) => j.key === key);
}

function findCareer(key) {
  return CAREERS.find((c) => c.key === key);
}

// Does a subject hold the given stage's diploma? (subjects: {key: {years}})
function hasDegree(subjects, subjectKey, stageKey) {
  return (subjects[subjectKey]?.years ?? 0) >= stageEndYears(stageKey);
}

// ctx: { xp: {career: n}, traits: {key: n}, subjects: {key: {years}} }
function isJobUnlocked(job, ctx) {
  const req = job.requires ?? {};
  if (req.level && careerProgress(ctx.xp[job.career] ?? 0).overallLevel < req.level) return false;
  for (const [trait, min] of Object.entries(req.traits ?? {})) {
    if ((ctx.traits[trait] ?? 0) < min) return false;
  }
  for (const d of req.degrees ?? []) {
    if (!hasDegree(ctx.subjects, d.subject, d.stage)) return false;
  }
  return true;
}

function jobRequirementText(job) {
  const req = job.requires ?? {};
  const parts = [];
  if (req.level) parts.push(`📶 ${levelLabel(req.level)}`);
  for (const [trait, min] of Object.entries(req.traits ?? {})) {
    parts.push(`${STAT_EMOJI[trait]}${min}`);
  }
  for (const d of req.degrees ?? []) {
    const stage = SCHOOL_STAGES.find((s) => s.key === d.stage);
    parts.push(`🎓 ${stage.label} ${findSubject(d.subject).label}`);
  }
  return parts.length ? `Needs ${parts.join(" · ")}` : "";
}
