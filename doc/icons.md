# Replacing Emoji with Real Icons

Today almost every piece of "art" in the app is a Unicode emoji: care meters, catalog
items, nav buttons, tab strips, skills, recipes, achievements. This doc is a concrete plan
for swapping those emoji for designer-authored icons **without a big-bang rewrite** — the
goal is that a designer can hand us a set of SVGs and we drop them in one file at a time,
with emoji as the automatic fallback until every icon exists.

## Where emoji live today

There are ~250 distinct glyphs. They reach the DOM through four different surfaces, and any
plan has to cover all four:

| # | Surface | Pattern | Example files |
|---|---------|---------|---------------|
| 1 | **Data fields** on catalog objects | `emoji: "🥕"` / `tabEmoji: "🎫"` fields, rendered via `` `<span class="icon">${x.emoji}</span>` `` | [itemCatalog.js](../src/ui/items/itemCatalog.js), [schoolData.js](../src/ui/school/schoolData.js), [careerData.js](../src/ui/career/careerData.js), [kitchenData.js](../src/ui/kitchen/kitchenData.js), [skills.js](../src/ui/fightclub/skills.js), [constants.js](../src/ui/hub/constants.js) (tab strips) |
| 2 | **Constant lookup maps** | `energy: "⚡"`, `home: "🏠"` keyed by semantic id | [careMeta.js](../src/ui/items/careMeta.js) (`CARE_EMOJI`, traits), [state.js](../src/ui/main/state.js) (`VIEW_EMOJI`) |
| 3 | **Hardcoded inline emoji in static HTML** | literal glyph in markup | [hub.html](../src/ui/hub.html) (nav + basket buttons), [stats.html](../src/ui/stats.html) (popover nav) |
| 4 | **Emoji inside locale strings** | glyph baked into translated text in all 12 locales | [src/ui/locales/](../src/ui/locales/) |

Rendering is done with template-string helpers (this is a no-bundler vanilla-JS app,
`withGlobalTauri`) — e.g. [renderTabs.js](../src/ui/hub/renderTabs.js) does
`` `${c.tabEmoji} ${label}` `` and [jobCardHTML.js](../src/ui/hub/jobCardHTML.js) does
`<span class="icon">${job.emoji}</span>`.

## Design principles

1. **Semantic keys, not glyphs, are the source of truth.** The data already keys most
   things (`carrot`, `energy`, `home`, `club`). The icon we show should be looked up by that
   key, so switching from emoji → SVG is a data/asset change, never a code change at the call
   site.
2. **One choke point.** Every icon in the app should render through a single `icon()` helper.
   Once that exists, the emoji→SVG flip happens *inside* the helper, not in 40 files.
3. **Graceful fallback.** The helper returns the designer SVG if one exists for the key,
   otherwise the current emoji. This lets the designer deliver icons in any order; the app is
   never broken mid-migration.
4. **Recolorable + theme-aware.** Icons must inherit `currentColor` so they work in the
   existing light/dark and threshold-color contexts (care-meter fills, disabled/locked
   states, accent highlights) without exporting two copies of every file.

## Recommended approach: an SVG symbol sprite + `icon()` helper

### Asset format — why SVG sprite

| Option | Recolor via CSS | Multi-color art | No-bundler friendly | Verdict |
|--------|-----------------|-----------------|---------------------|---------|
| **Inline `<svg><use>` from a symbol sprite** | ✅ `currentColor` | ✅ (sprite can keep fills) | ✅ single embedded file | **Recommended** |
| Icon font | ✅ | ❌ monochrome only | ⚠️ font build step | No — pet items want color |
| One `<img src>` per icon | ❌ (can't recolor) | ✅ | ✅ | Only for full-color, non-tinted art |
| CSS `mask-image` | ✅ | ❌ monochrome | ✅ | Fallback for pure-tint glyphs |

SVG `<symbol>` sprite wins: designers can deliver either flat monochrome icons (fill
`currentColor`, we tint them) or full-color icons (explicit fills), and both live in one
file that gets embedded in the binary like the existing `pets/*.webp` sheets.

### File layout

Assets go under `src/ui/` so they're embedded at compile time and reachable by relative URL
(same as `background: url("pets/toy_poodle.webp")` in [style.css](../src/ui/style.css)):

```
src/ui/
  icons/
    icons.svg          # the symbol sprite: <symbol id="ic-carrot" viewBox="0 0 24 24">…</symbol>
    registry.js        # semantic key -> { emoji fallback, hasIcon }
  shared/
    icon.js            # the icon() helper (new; sits next to i18n.js, tauri.js)
```

### The registry

`icons/registry.js` is the single map of every icon key the app uses, its emoji fallback,
and whether a real SVG has landed yet:

```js
// icons/registry.js
export const ICONS = {
  carrot:  { emoji: "🥕", svg: true  },  // svg:true  -> designer icon exists in icons.svg
  apple:   { emoji: "🍎", svg: true  },
  energy:  { emoji: "⚡", svg: false },  // svg:false -> still renders the emoji fallback
  home:    { emoji: "🏠", svg: false },
  // …one entry per key
};
```

### The helper

```js
// shared/icon.js
import { ICONS } from "../icons/registry.js";

// Returns an HTML string. aria-hidden by default; pass a label for standalone icons.
export function icon(key, { cls = "", label } = {}) {
  const meta = ICONS[key];
  const a11y = label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`;
  if (meta?.svg) {
    return `<svg class="icon ${cls}" ${a11y}><use href="icons/icons.svg#ic-${key}"/></svg>`;
  }
  // fallback: current emoji (or a neutral placeholder if the key is unknown)
  return `<span class="icon ${cls}" ${a11y}>${meta?.emoji ?? "▫️"}</span>`;
}
```

Load the sprite once per window (so `<use href="…#ic-x">` resolves) by inlining it at the top
of `hub.html` / `stats.html`, or fetching it once at boot and injecting into `document.body`.
Inlining is simplest given assets are embedded.

### CSS

One rule covers both branches, because both emit `class="icon"`:

```css
.icon {
  width: 1.15em;
  height: 1.15em;
  vertical-align: -0.15em;
  fill: currentColor;      /* monochrome SVGs inherit text color */
  flex: none;
}
/* emoji <span>.icon needs font-size instead of width/height; keep the existing
   per-context font-size rules in hub.css until that context is migrated */
```

Sizing today is done with `font-size` in [hub.css](../src/ui/hub.css) (12–34px in different
contexts). Keep those rules working for the emoji fallback; the SVG branch uses `em` units so
it tracks the same `font-size` automatically.

## Migration, surface by surface

Do this incrementally — each step is shippable on its own.

**Step 0 — infrastructure (one PR).** Add `icons/registry.js` (seeded with every current
glyph as `svg:false`), `shared/icon.js`, the empty `icons/icons.svg`, and the `.icon` CSS.
Nothing changes visually yet — every key still falls back to its emoji.

**Step 1 — Surface 2 (constant maps).** `CARE_EMOJI` in
[careMeta.js](../src/ui/items/careMeta.js) and `VIEW_EMOJI` in
[state.js](../src/ui/main/state.js) become registry keys. Replace their read sites with
`icon("energy")`, `icon("home")`, etc. Small, self-contained, high-visibility (nav + care
meters).

**Step 2 — Surface 3 (static HTML).** In [hub.html](../src/ui/hub.html) and
[stats.html](../src/ui/stats.html), the nav/basket buttons currently hold literal glyphs.
Either (a) leave the emoji as static fallback and let JS hydrate them via `icon()` on boot,
or (b) replace the glyph with `<svg><use…></svg>` directly once the icon exists. Prefer (a) so
the button isn't empty before JS runs.

**Step 3 — Surface 1 (data fields), one catalog at a time.** The call sites already do
`${x.emoji}`. Change them to `icon(x.key)` and let the registry resolve. Order by visibility:
`itemCatalog` → tab strips (`constants.js` via [renderTabs.js](../src/ui/hub/renderTabs.js)) →
`careerData` / `schoolData` → `kitchenData` / `skills`. The `emoji` field can stay in the data
as the fallback source (registry can even be generated from it — see Tooling).

**Step 4 — Surface 4 (locale strings).** Emoji baked into translated strings are the hardest
because they're inside text in 12 locales. Where an emoji is decorative, pull it out of the
string and render it with `icon()` beside the text. Where it's load-bearing punctuation in a
sentence, leave it as emoji for now — it's low priority and low count.

**As the designer delivers icons:** add the `<symbol id="ic-carrot">` to `icons.svg`, flip
`svg:true` in the registry. That single flip switches every call site for that key. No code
changes.

## Special cases

- **Flags** (🇺🇸 🇯🇵 … in [touringData.js](../src/ui/touring/touringData.js)): ~40 regional-
  indicator glyphs. A designer flag set is a lot of work for low payoff — recommend keeping
  these as emoji (mark them `svg:false` permanently, or exclude from the registry) unless the
  design language specifically needs custom flags.
- **The pet spritesheet** (`pets/*.webp`) is real art already and is **out of scope** — it's
  not emoji.
- **Extension / add-on manifest `emoji`**: community extensions declare their own emoji in
  `manifest.json` (see [extensions.md](extensions.md)). These are third-party authored — keep
  supporting emoji there. Optionally let a manifest ship its own icon asset later, but never
  require it.
- **Accessibility:** icons that duplicate adjacent text should be `aria-hidden="true"`
  (default in the helper). Icon-only buttons (nav rail, basket buttons) already have `title`
  attributes; also pass `label` to `icon()` so screen readers get `role="img" aria-label`.

## Tooling

Mirror the existing [scripts/i18n-check.mjs](../scripts/i18n-check.mjs) pattern with two
Node checks (no deps, run in CI / pre-commit):

1. **`scripts/icon-audit.mjs`** — greps `src/ui` (excluding `locales/`, `pets/`) for any emoji
   codepoint *not* going through `icon()`, so new raw-emoji usage is caught. This is the
   linter that keeps the choke point honest.
2. **`scripts/icon-check.mjs`** — asserts every `svg:true` key in the registry actually has a
   matching `<symbol id="ic-…">` in `icons.svg`, and every key referenced by `icon("…")` in
   code exists in the registry. Prevents a flip to `svg:true` with a missing symbol (which
   would render an empty box).

The registry can also be **generated** from the existing `emoji:` data fields plus the
constant maps, so you don't hand-maintain 250 entries — a small build script scans for
`emoji:`/`tabEmoji:` and the two maps and emits `registry.js`, and you only hand-edit the
`svg:true` flags (or store those in `icons.svg`'s presence and derive the flag).

## Rollout summary

1. Land infra (helper + empty sprite + registry seeded to all-emoji). Zero visual change.
2. Migrate call sites to `icon()` surface by surface (maps → static HTML → data → locales).
3. Add the two audit scripts to lock it in.
4. Designer delivers SVGs on their own schedule; each icon is one symbol + one flag flip.

The end state: **`icon(key)` everywhere, emoji as the built-in fallback, and adding real art
is a pure asset drop** — exactly the "swap emoji for designer icons later" workflow you want.
