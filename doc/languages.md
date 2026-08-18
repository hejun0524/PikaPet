# 🌐 Languages

The whole UI is localized into **twelve languages: English, Chinese (中文), French, Spanish, German, Japanese, Italian, Portuguese, Arabic (العربية), Hindi (हिन्दी), Greek (Ελληνικά), and Korean (한국어)**. Settings → 🌐 **Language** picks one; the default, **System language**, follows the OS (unsupported system languages fall back to English). Changes apply live to every window — popover, hub, speech bubbles, the pet's right-click menu, and localized extensions — no restart. The six newest languages (it/pt/ar/hi/el/ko) currently translate the UI strings only — data-catalog names (items, dishes, skills, …) fall back to English there, while zh/fr/es/de/ja also translate the catalogs. Arabic renders in the app's LTR layout for now.

## How it works

- `src/ui/shared/i18n.js` holds the active locale and two lookups: `t(key, params)` for UI strings and `tOr(key, fallback)` for data-catalog names. The setting travels as `pet.settings.language` through the normal `settings-changed` → save → `pet-state` flow, so every window stays in sync.
- `src/ui/locales/<code>.js` is one flat dictionary per language. `en.js` lists only UI strings — it is the master key list and the universal fallback.
- The **data catalogs stay English-only** (`items.js`, `school.js`, `career.js`, `touring.js` are untouched — English keys are also what `save.json` stores); other locales translate their names under stable keys (`item.carrot`, `class.math-grade`, `job.chef-3`, `dest.japan`, …) and `src/ui/shared/names.js` resolves them at render time. A missing entry silently falls back to the catalog's English name, so partial translations are safe.
- **Cities and team names are translated too**, keyed by their exact English catalog string (`city.New York`, `city.Boston Celtics`). Chinese and Japanese translate all ~315 of them; French/Spanish/German list only real exonyms (Londres, Nueva York, Peking, …) and keep sports team names in their original English form, which is how sports media in those languages write them. Everything not listed falls back to the English name.
- Deliberately **not** translated: league names (NBA, MLB, …) and the pet-name defaults. Achievements stored in `save.json` keep English labels (they're data); the Achievements wall renders localized labels from keys.
- Extensions localize themselves via the bridge (`get-locale` + the `app-locale` push) — see [extensions.md](extensions.md); the Music Player is the reference implementation.

## For developers: adding a language

1. **Copy the dictionary**: `cp src/ui/locales/en.js src/ui/locales/<code>.js` (two-letter code, e.g. `ko.js`) and translate every value. `en.js` holds only the UI keys; for the data-name sections (`item.*`, `class.*`, `job.*`, `dest.*`, `city.*`, …) copy them from `zh.js` — it is the most complete example — and translate those too. Anything you skip falls back to English, so you can land a partial translation safely.
2. **Register it** in `src/ui/shared/i18n.js`: add the import + entry to `LOCALES`, and an entry to `LANGUAGE_OPTIONS` with the label written in its own language (`{ key: "ko", label: "한국어" }`). `detectLocale()` then also matches it as a system language automatically.
3. **Rebuild** (`cargo build` from the repo root — the UI is embedded). The Settings dropdown picks the new language up; nothing else to wire.
4. Optionally teach the **Music Player** (and other extensions) the new code: add an `STR` section in the zips' pages — extensions receive the locale code via `get-locale`/`app-locale` and fall back to English for codes they don't know (see [extensions.md](extensions.md)).

## For developers: adding or changing strings

- New **UI text** goes into `locales/en.js` first (that file is the master key list), then into each other locale; render it with `t("your.key", {params})`. Never concatenate translated fragments — put `{placeholders}` inside the string so each language can reorder them.
- New **catalog entries** (an item, class, job, destination, city…) need no `en.js` entry — the catalog's English `name`/`label` is the fallback. Add the translated names under the entry's stable key in the non-English locales (`"item.<key>"`, `"city.<Exact English Name>"`, …) and render through the helpers in `shared/names.js` (`itemName`, `className`, `cityName`, …).
- Run **`node scripts/i18n-check.mjs`** after touching `locales/` or the catalogs — it verifies every locale against `en.js` (missing keys, `{placeholder}` typos, data keys pointing at nonexistent catalog entries) and exercises the render helpers under every language. It's the same check this feature was shipped with; keep it green.
