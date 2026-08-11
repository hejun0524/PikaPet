// scripts/i18n-check.mjs — headless localization check. Run after touching
// locales/ or the catalogs:
//
//   node scripts/i18n-check.mjs
//
// Verifies, for every bundled locale:
//   1. it covers every UI key of locales/en.js and has no unknown keys,
//   2. its {placeholder} tokens match en's exactly (catches typos),
//   3. every data-name key ("item.carrot", "job.chef-3", "city.New York", …)
//      points at a real catalog entry,
//   4. the shared/names.js helpers and tour-name builders produce non-empty,
//      fully-interpolated text under that locale.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const FRONTEND = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "ui");
const { LOCALES, setLanguage, t } = await import(join(FRONTEND, "shared/i18n.js"));
const { ALL_ITEMS, SERVICES, CARETAKERS, SPECIES } = await import(join(FRONTEND, "items.js"));
const { CLASS_CATALOG, SUBJECTS, SCHOOL_STAGES, subjectStageLabel, classUnlockText } =
  await import(join(FRONTEND, "school.js"));
const { CAREERS, JOB_CATALOG, levelLabel, jobRequirementText } =
  await import(join(FRONTEND, "career.js"));
const { DESTINATIONS, ALL_CITIES, ALL_TEAMS, findTour, souvenirName } =
  await import(join(FRONTEND, "touring.js"));
const kitchen = await import(join(FRONTEND, "kitchen.js"));
const fclub = await import(join(FRONTEND, "fightclub.js"));
const names = await import(join(FRONTEND, "shared/names.js"));

let bad = 0;
const err = (msg) => { bad++; console.error("FAIL:", msg); };

const en = LOCALES.en;
const enKeys = new Set(Object.keys(en));
const dataPrefixes = ["item.", "class.", "subject.", "stage.", "career.", "job.", "caretaker.", "species.", "dest.", "city.", "ing.", "ingcat.", "recipe.", "skill.", "fcbook.", "potion."];

// 1. Key parity: every locale covers en's UI keys; no unknown keys anywhere.
for (const [code, dict] of Object.entries(LOCALES)) {
  if (code === "en") continue;
  for (const key of enKeys) if (!(key in dict)) err(`${code} missing UI key ${key}`);
  for (const key of Object.keys(dict)) {
    if (enKeys.has(key)) continue;
    if (!dataPrefixes.some((p) => key.startsWith(p))) err(`${code} has unknown key ${key}`);
  }
}

// 2. Placeholder parity with en for shared UI keys.
const tokens = (s) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
for (const [code, dict] of Object.entries(LOCALES)) {
  if (code === "en") continue;
  for (const [key, val] of Object.entries(dict)) {
    if (!enKeys.has(key)) continue;
    const a = [...tokens(en[key])].sort().join(",");
    const b = [...tokens(val)].sort().join(",");
    if (a !== b) err(`${code} ${key}: placeholders "${b}" != en "${a}"`);
  }
}

// 3. Data-name keys must reference real catalog entries.
const sets = {
  "item.": new Set([...ALL_ITEMS, ...SERVICES].map((i) => i.key)),
  "class.": new Set(CLASS_CATALOG.map((c) => c.key)),
  "subject.": new Set(SUBJECTS.map((s) => s.key)),
  "stage.": new Set(SCHOOL_STAGES.map((s) => s.key)),
  "career.": new Set(CAREERS.map((c) => c.key)),
  "job.": new Set(JOB_CATALOG.map((j) => j.key)),
  "caretaker.": new Set(CARETAKERS.map((c) => c.key)),
  "species.": new Set(SPECIES.map((s) => s.key)),
  "dest.": new Set(DESTINATIONS.map((d) => d.key)),
  "city.": new Set([...ALL_CITIES, ...ALL_TEAMS]),
  "ing.": new Set(kitchen.INGREDIENTS.map((i) => i.key)),
  "ingcat.": new Set(kitchen.INGREDIENT_CATS.map((c) => c.key)),
  "recipe.": new Set(kitchen.ALL_RECIPES.map((r) => r.key)),
  "skill.": new Set(fclub.SKILLS.map((s) => s.key)),
  "fcbook.": new Set(fclub.BOOKS.map((b) => b.key)),
  "potion.": new Set(fclub.POTIONS.map((p) => p.key)),
};
const stripSuffix = (base) => base.replace(/\.(desc|breed)$/, "");
for (const [code, dict] of Object.entries(LOCALES)) {
  for (const key of Object.keys(dict)) {
    if (enKeys.has(key)) continue; // UI key
    if (key.startsWith("class.hed.")) {
      if (!["bachelor", "master", "phd"].includes(key.slice(10))) err(`${code} bad hed key ${key}`);
      continue;
    }
    const prefix = dataPrefixes.find((p) => key.startsWith(p));
    if (!prefix) continue; // already reported as unknown above
    const base = stripSuffix(key.slice(prefix.length));
    if (!sets[prefix].has(base)) err(`${code} ${key}: no catalog entry "${base}"`);
  }
}

// 4. Exercise the real render helpers under every locale.
for (const code of Object.keys(LOCALES)) {
  setLanguage(code);
  for (const cls of CLASS_CATALOG) {
    const n = names.className(cls);
    if (!n || n.includes("{")) err(`${code} className(${cls.key}) -> "${n}"`);
    classUnlockText(cls);
  }
  for (const job of JOB_CATALOG) {
    if (!names.jobName(job)) err(`${code} jobName(${job.key})`);
    jobRequirementText(job);
  }
  for (const item of [...ALL_ITEMS, ...SERVICES]) {
    if (!names.itemName(item)) err(`${code} itemName(${item.key})`);
  }
  for (const c of [...ALL_CITIES, ...ALL_TEAMS]) {
    const n = names.cityName(c);
    if (!n || n.includes("{")) err(`${code} cityName(${c}) -> "${n}"`);
  }
  for (const key of ["tour-any-1", "tour-any-3", "sport-any-1", "sport-any-5", "tour-japan-2", "sport-nba-3", "flight:Kyoto", "flight:Boston Celtics", "train:japan", "train:nba"]) {
    const def = findTour(key);
    if (!def?.name || def.name.includes("{")) err(`${code} findTour(${key}) -> "${def?.name}"`);
  }
  souvenirName("Kyoto");
  subjectStageLabel({ years: 4, credits: 3 });
  subjectStageLabel({ years: 27, credits: 0 });
  levelLabel(7);
  if (t("view.home").includes("view.")) err(`${code} t(view.home) fell through`);
}
setLanguage("auto");

console.log(bad ? `\n${bad} FAILURES` : "i18n-check: ALL CHECKS PASSED");
process.exit(bad ? 1 : 0);
