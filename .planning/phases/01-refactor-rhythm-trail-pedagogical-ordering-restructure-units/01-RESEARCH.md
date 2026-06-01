# Phase 1: Rhythm Trail Pedagogical Restructure - Research

**Researched:** 2026-06-01
**Domain:** Trail-data restructure + i18n + scaffolding UI extension + Supabase migration
**Confidence:** HIGH (codebase verified line-by-line)

## Summary

This phase is a **data restructure with a thin UI extension**, not a greenfield build. Every decision is locked in 01-CONTEXT.md (D-01..D-14). The work decomposes cleanly into seven workstreams: (1) write 10 new rhythm unit files following the existing `rhythmUnit{N}Redesigned.js` shape, (2) update `expandedNodes.js` aggregator, (3) update `skillTrail.js` `UNITS` map (add U8/U9/U10, edit U1–U7), (4) extend `DiscoveryIntroQuestion.jsx` with multi-card pagination and 12 concept-keyed card schemas, (5) update locale files in EN/HE under `common.json::game.discovery.cards.*` (note: trail.json does NOT key by node ID — it keys by display-name string), (6) add four new validator lint rules to `scripts/validateTrail.mjs` and rename hidden Unit 8 IDs to `rhythm_synco_*`, and (7) ship one Supabase migration that atomically (a) deletes rhythm rows from `student_skill_progress` and (b) replaces the `is_free_node()` whitelist.

**Primary recommendation:** Sequence the work as Wave 0 (validator rules + tests, written against the new structure but skipped until data lands) → Wave 1 (data files U1–U10 + aggregator + `UNITS` map + hidden-unit rename) → Wave 2 (`DiscoveryIntroQuestion` pagination + card content + EN/HE locales) → Wave 3 (paywall + migration) → Wave 4 (test sweep, walkthrough, CLAUDE.md update). Wave 0 first because failing tests guide each subsequent wave to "done."

**Two facts the planner must internalize before writing tasks:**

1. **Today's "29 rhythm nodes" count from SPEC.md is wrong** — the actual current count is **43** (36 in `category: 'rhythm'` plus 7 in `category: 'boss'` with `boss_rhythm_*` IDs). See §"Current Rhythm Trail Inventory." This does not change the spec's target (55 nodes — six per content unit × 9 content units + 1 review boss = 55) but it does change the migration impact analysis and the CLAUDE.md update math.
2. **Trail i18n is keyed by display-name string, not node ID.** `trail.json` has `units.names["Quarter & Half Notes"]` not `units.rhythm_1.name`. Scaffolding card copy on the other hand goes in `common.json::game.discovery.cards.<concept>.*`. Two different files, two different key conventions. See §"Locale-Key Pattern."

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Unit Map & Order (D-01..D-05):**

- **D-01:** 10-unit rhythm trail. Order locked:

  | Unit | ID range                       | Concept                | Node count |
  | ---- | ------------------------------ | ---------------------- | ---------- |
  | U1   | `rhythm_1_*` + `boss_rhythm_1` | Quarter + Quarter Rest | 6          |
  | U2   | `rhythm_2_*` + `boss_rhythm_2` | Half + Half Rest       | 6          |
  | U3   | `rhythm_3_*` + `boss_rhythm_3` | Whole + Whole Rest     | 6          |
  | U4   | `rhythm_4_*` + `boss_rhythm_4` | Eighths                | 6          |
  | U5   | `rhythm_5_*` + `boss_rhythm_5` | Sixteenths             | 6          |
  | U6   | `rhythm_6_*` + `boss_rhythm_6` | Dotted Half            | 6          |
  | U7   | `rhythm_7_*` + `boss_rhythm_7` | Dotted Quarter         | 6          |
  | U8   | `rhythm_8_*` + `boss_rhythm_8` | 3/4 Meter              | 6          |
  | U9   | `rhythm_9_*` + `boss_rhythm_9` | 6/8 Meter              | 6          |
  | U10  | `boss_rhythm_10` only          | Rhythm Review          | 1          |

  Total: 55 nodes. Terminus: `boss_rhythm_10`.

- **D-02:** 6-node arc per content unit.
  - Duration units (U1, U2, U3): Duration Intro → Practice → Rest Intro → Practice (combined) → Speed → Mini-Boss
  - Non-duration units (U4–U9): Intro → Practice → Discovery (mixed contrast) → Practice → Speed → Mini-Boss
  - U10: BOSS only.

- **D-03:** Rests folded into matching duration unit (qr in U1, hr in U2, wr in U3). Today's Unit 4 "Rests" dissolved.

- **D-04:** Dotted Half (U6) and Dotted Quarter (U7) are **separate** units (strict concept-per-unit reading).

- **D-05:** Final order: durations → subdivisions → dotted → meters. Pulse-first first; meters most advanced.

**Scaffolding Mechanism (D-06..D-08):**

- **D-06:** Extend existing `discovery_intro` question type inside `MIXED_LESSON`. Do NOT add `NODE_TYPES.SCAFFOLDING`. Renderer `DiscoveryIntroQuestion.jsx` gains multi-card pagination.

- **D-07:** 2–4 swipable cards per concept (Duolingo-style). Card template:
  1. Meet the new note/rest/meter — hero glyph + plain-language name
  2. How it sounds — audio demo
  3. How it looks in music — mini-staff preview (`RhythmStaffDisplay`)
  4. Try it — transition to first exercise

- **D-08:** 12 dedicated scaffolding screens (one per concept, no piggybacking): Quarter, Quarter Rest, Half, Half Rest, Whole, Whole Rest, Eighths, Sixteenths, Dotted Half, Dotted Quarter, 3/4 Meter, 6/8 Meter. EN+HE copy: ~50–100 new keys under `game.discovery.cards.<concept>.*`.

**Node IDs (D-09..D-10):**

- **D-09:** Numeric pattern `rhythm_<unit>_<order>` and `boss_rhythm_<unit>` preserved.

- **D-10:** Hidden Unit 8 syncopation renamed `rhythm_8_*` / `boss_rhythm_8` → `rhythm_synco_*` / `boss_rhythm_synco`. `HIDDEN-V1` markers preserved.

**Final Boss (D-11):**

- **D-11:** Standalone U10 "Rhythm Review" with single `boss_rhythm_10` BOSS node using `patternTagMode: "any"` across all U1–U9 pattern tags.

**Paywall & Migration (D-12..D-13):**

- **D-12:** Free rhythm nodes = all 6 of U1 (`rhythm_1_1..5`, `boss_rhythm_1`). Postgres `is_free_node()` updated in lockstep.

- **D-13:** Single Supabase migration handles both (a) `DELETE FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'` and (b) replacing `is_free_node()` body. Deploy migration BEFORE Netlify code deploy. `students_score.total_xp` NEVER touched.

**Validator (D-14):**

- **D-14:** New rules in `scripts/validateTrail.mjs`:
  - **Pulse-first:** first rhythm node by `order` (excluding intro/scaffolding) has `focusDurations: ['q']`
  - **Rests-woven:** for every rest-introducing node, the closest preceding non-intro rhythm node by `order` introduces the matching duration
  - **Concept-per-unit:** within a single unit, union of all `focusDurations` forms a single concept family. Families: `{q,qr}`, `{h,hr}`, `{w,wr}`, `{8_pair,8}`, `{16}`, `{hd}`, `{qd}`; meter units identified via `timeSignature`.

### Claude's Discretion

- Whether to drop the `Redesigned` filename suffix on new unit files (planner's call).
- Exact key naming under `game.discovery.cards.<concept>.*` is locked in planning.
- Per-concept card count (2 vs 3 vs 4) within the D-07 envelope.

### Deferred Ideas (OUT OF SCOPE)

- Eighth-rest / sixteenth-rest introduction nodes (content expansion, not restructure)
- Re-enabling hidden Unit 8 Syncopation (`rhythm_synco_*` after rename)
- Auditing `MetronomeTrainer.jsx` for hardcoded references to old unit names
- Interactive "tap-to-feel-the-beat" scaffolding card (rejected in favor of D-07 multi-card)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                    | Research Support                                                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-01 | Pulse-first ordering — quarter is first rhythmic-content node; halves/wholes as extensions; eighths/sixteenths as subdivisions | §Architecture — D-01 unit order satisfies; validator rule §"Validator Lint Rules" enforces. Current data violates this (U1 currently teaches q+h together; U2 teaches w deferred).                                                                                    |
| REQ-02 | Rests-woven — each rest type introduced in or adjacent to its matching duration unit                                           | D-03 folds qr→U1, hr→U2, wr→U3. Validator §"Rests-woven rule" walks `focusDurations` arrays. Today's Unit 4 ("Rests") aggregates all three rests after eighth notes — explicit violation.                                                                             |
| REQ-03 | Concept-per-unit — no unit mixes two distinct concepts                                                                         | D-04 splits dotted half / dotted quarter. D-01 separates 3/4 and 6/8 into U8 + U9. Validator §"Concept-per-unit rule" enforces via concept-family map. Today's U5 mixes dotted notes + 3/4 time; today's U6 mixes sixteenths + all-rhythm boss — explicit violations. |
| REQ-04 | Intro/scaffolding nodes — every new rhythmic concept has dedicated kid-friendly explainer                                      | D-06 extends `discovery_intro` (does NOT add `NODE_TYPES.SCAFFOLDING`). D-07 specifies 2–4 swipable cards. D-08 lists all 12 concepts. Implementation target: `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` (extend with pagination).      |
| REQ-05 | Locale keys, paywall (`FREE_NODE_IDS` ↔ `is_free_node()`), validator, tests updated in lockstep                               | §"Locale-Key Pattern" (two-file split: `trail.json` for unit/node display names by string-key, `common.json::game.discovery.cards.*` for scaffolding copy). §"Paywall Sync" (single migration per D-13). §"Test Coverage Map" enumerates affected tests.              |
| REQ-06 | Clean-slate rhythm progress wipe; `students_score.total_xp` preserved                                                          | §"Supabase Wipe Migration" — pattern proven by `20260330000001_reset_rhythm_node_progress.sql` and `20260204000001_reset_trail_progress_v13.sql`. Wrap in `BEGIN/COMMIT`, log row counts before/after.                                                                |
| REQ-07 | Rhythm game engine changes bounded to pedagogical necessity                                                                    | D-06 limits engine work to `DiscoveryIntroQuestion.jsx` pagination only. MixedLessonGame, MetronomeTrainer, ArcadeRhythmGame untouched unless a new question type emerges (none expected).                                                                            |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

| Constraint                                                                                                      | Source                                        | Impact on this phase                                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-commit Husky runs ESLint + Prettier on staged files                                                         | "Pre-commit & Build Hooks"                    | New JS files must pass lint; format will auto-fix                                                                                                                |
| `npm run build` runs `scripts/validateTrail.mjs` as prebuild — failure blocks build                             | "Pre-commit & Build Hooks"                    | New validator rules must pass; new structure must pass all existing rules (pattern tags, duration safety, game-type policy, measure count)                       |
| SVG imports use `?react` suffix via `vite-plugin-svgr`                                                          | "Build Conventions"                           | New scaffolding card glyphs (if any added) must follow this — but `BeamedSixteenthsIcon` import in `DiscoveryIntroQuestion.jsx` already demonstrates the pattern |
| Defense-in-depth content gate: React UI (`isFreeNode()`) + DB RLS (`is_free_node()`)                            | "Content Gate"                                | D-13 single migration updates both in lockstep                                                                                                                   |
| Glassmorphism design system: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`         | "Design System"                               | New scaffolding cards must match (existing renderer already does — extending pagination preserves)                                                               |
| RTL Hebrew parity required                                                                                      | "Accessibility"                               | All 12 concept × N-card scaffolding strings need HE translation in `src/locales/he/common.json`                                                                  |
| Hebrew nikud for Kodaly syllables — user-confirmed, do NOT change without asking                                | MEMORY.md "Hebrew Nikud for Kodaly Syllables" | New scaffolding cards reuse `getSyllable(duration, 'he')` from `durationInfo.js`; do not invent new diacritics                                                   |
| Trail nodes pass `nodeId`, `nodeConfig`, `exerciseIndex`, `totalExercises`, `exerciseType` via `location.state` | "Navigation State for Trail Games"            | Multi-card pagination happens INSIDE the discovery_intro question (one question = many cards) — does not affect outer trail navigation contract                  |
| Tests use Vitest + JSDOM; setup `src/test/setupTests.js`                                                        | "Testing"                                     | New tests for paginated `DiscoveryIntroQuestion` use existing setup                                                                                              |
| Service worker cache version `pianomaster-v7` must bump on deploy                                               | "Service Worker"                              | Bump to `pianomaster-v8` (or higher) in `public/sw.js` so clients refetch new locale + JS bundles                                                                |

## Architectural Responsibility Map

| Capability                        | Primary Tier                             | Secondary Tier         | Rationale                                                                                          |
| --------------------------------- | ---------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Rhythm trail node registry        | Data layer (`src/data/`)                 | —                      | All trail data is JS modules imported at build time; no runtime fetch                              |
| Scaffolding card UI               | Frontend (renderer component)            | —                      | `DiscoveryIntroQuestion` already lives at this tier; extending pagination keeps it there           |
| Concept i18n copy                 | Frontend (`src/locales/`)                | —                      | i18next runtime resolution; no backend involvement                                                 |
| Paywall enforcement               | UI + Database (defense in depth)         | —                      | JS `FREE_NODE_IDS` for UX; Postgres `is_free_node()` for ground truth via RLS                      |
| Progress wipe                     | Database (Supabase migration)            | —                      | Server-side DELETE; RLS-safe targeting via `WHERE node_id LIKE 'rhythm_%' OR LIKE 'boss_rhythm_%'` |
| Validator rules                   | Build-time (`scripts/validateTrail.mjs`) | —                      | Node.js script; runs as `prebuild`; no runtime cost                                                |
| Pedagogical principle enforcement | Build-time (validator) + Test suite      | UI (owner walkthrough) | Static structural checks; runtime tests confirm renderer; walkthrough is final gate                |

## Standard Stack

### Core (no new dependencies)

| Library                         | Version | Purpose                                    | Why Standard                                                                          |
| ------------------------------- | ------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| React                           | 18.3.1  | UI rendering                               | [VERIFIED: package.json] Existing stack                                               |
| react-i18next                   | 16.3.5  | i18n in EN/HE with `<Trans>` interpolation | [VERIFIED: package.json] Existing stack; already used in `DiscoveryIntroQuestion.jsx` |
| Vitest                          | 3.2.4   | Test runner                                | [VERIFIED: package.json] Existing tests in `*.test.jsx` use this                      |
| `@testing-library/react`        | 16.3.0  | Component test queries                     | [VERIFIED: package.json] Existing                                                     |
| Supabase migrations (SQL files) | —       | DB schema + data migrations                | [VERIFIED: supabase/migrations/] Existing pattern                                     |

### Don't Add

- **New animation library for swipe** — `framer-motion` 12.23.26 is already in `package.json` [VERIFIED]; reuse it for card transitions if needed.
- **New SVG glyph library** — `src/assets/musicSymbols/` already holds all duration/rest glyphs (`quarter-note`, `half-note`, `whole-note-head`, `eighth-note`, `sixteenth-note`, `dotted-quarter-note`, `dotted-half-note`, `quarter-rest`, `half-rest`, `whole-rest`, `beamed-eighths`, `beamed-sixteenths`). Meter cards (3/4, 6/8) may need a new visual; planner should decide between (a) a numeric time-signature glyph, (b) reusing the existing `RhythmStaffDisplay`-rendered bar with time signature, or (c) authoring one new SVG. **Recommendation: option (b)** — `RhythmStaffDisplay` already renders the time signature, costs zero new asset work, and is consistent with card 3 ("how it looks in music").

**Installation:** None required.

## Architecture Patterns

### System Architecture Diagram

```
                ┌─────────────────────────────────────────┐
                │       Wave 0: New validator rules        │
                │  scripts/validateTrail.mjs               │
                │   ├─ Pulse-first rule                    │
                │   ├─ Rests-woven rule                    │
                │   ├─ Concept-per-unit rule               │
                │   └─ (existing rules continue passing)   │
                └────────────────┬────────────────────────┘
                                 │ defines pass/fail contract
                                 ▼
   ┌──────────────────────────────────────────────────────────┐
   │             Wave 1: Trail data layer rewrite              │
   │                                                            │
   │  src/data/units/rhythmUnit{1..10}*.js (10 new files)      │
   │       │                                                    │
   │       ▼                                                    │
   │  src/data/expandedNodes.js  ← aggregator (imports U1..10) │
   │       │                                                    │
   │       ▼                                                    │
   │  src/data/skillTrail.js  ← UNITS map adds RHYTHM_8/9/10  │
   │                                                            │
   │  Side: rhythmUnit8Redesigned.js renamed IDs rhythm_synco_*│
   │        HIDDEN-V1 marker preserved                          │
   └────────────────┬──────────────────────────────────────────┘
                    │ data flows to runtime via getNodeById/SKILL_NODES
                    ▼
   ┌──────────────────────────────────────────────────────────┐
   │            Wave 2: Scaffolding UI + locales               │
   │                                                            │
   │  DiscoveryIntroQuestion.jsx                               │
   │   ├─ adds multi-card pagination state                     │
   │   ├─ reads card schema from question.cards[] or          │
   │   │   resolves by focusDuration → cards lookup            │
   │   └─ final card calls onComplete(1,1) (unchanged)         │
   │                                                            │
   │  src/locales/en/common.json + he/common.json              │
   │   └─ game.discovery.cards.<concept>.{title,body,...}      │
   │                                                            │
   │  src/locales/en/trail.json + he/trail.json                │
   │   └─ units.names["<new unit display name>"] entries       │
   └────────────────┬──────────────────────────────────────────┘
                    │ user-facing copy ready
                    ▼
   ┌──────────────────────────────────────────────────────────┐
   │             Wave 3: Paywall + migration                   │
   │                                                            │
   │  src/config/subscriptionConfig.js                         │
   │   └─ FREE_RHYTHM_NODE_IDS = rhythm_1_{1..5} + boss_rhythm_1│
   │                                                            │
   │  supabase/migrations/2026MMDD_phase1_rhythm_pedagogy.sql  │
   │   ├─ DELETE FROM student_skill_progress WHERE …rhythm…    │
   │   ├─ CREATE OR REPLACE FUNCTION is_free_node(...)         │
   │   └─ no touch on students_score / total_xp                │
   │                                                            │
   │  public/sw.js: bump cache version                         │
   └────────────────┬──────────────────────────────────────────┘
                    │
                    ▼
   ┌──────────────────────────────────────────────────────────┐
   │           Wave 4: Tests + walkthrough                     │
   │   ├─ npm run verify:trail   (validator clean)             │
   │   ├─ npm run test:run       (rhythm tests green)          │
   │   ├─ FREE_NODE_IDS parity test                            │
   │   └─ Owner walkthrough → all 55 nodes complete            │
   └──────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── data/
│   ├── units/
│   │   ├── rhythmUnit1.js          # NEW: Quarter + qr (or keep Redesigned suffix)
│   │   ├── rhythmUnit2.js          # NEW: Half + hr
│   │   ├── rhythmUnit3.js          # NEW: Whole + wr
│   │   ├── rhythmUnit4.js          # NEW: Eighths
│   │   ├── rhythmUnit5.js          # NEW: Sixteenths
│   │   ├── rhythmUnit6.js          # NEW: Dotted Half
│   │   ├── rhythmUnit7.js          # NEW: Dotted Quarter
│   │   ├── rhythmUnit8.js          # NEW: 3/4 Meter
│   │   ├── rhythmUnit9.js          # NEW: 6/8 Meter
│   │   ├── rhythmUnit10.js         # NEW: Review Boss
│   │   ├── rhythmUnit{1..7}Redesigned.js  # DELETE after migration
│   │   ├── rhythmUnit8Redesigned.js       # KEEP, rename internal IDs to rhythm_synco_*
│   │   ├── rhythmUnit{N}.test.js   # NEW per unit
│   │   └── rhythmUnits.difficulty.test.js  # UPDATE imports
│   ├── expandedNodes.js            # UPDATE: rewire imports, keep HIDDEN-V1 marker
│   └── skillTrail.js               # UPDATE: UNITS map adds RHYTHM_8/9/10; edits RHYTHM_1..7
├── components/games/rhythm-games/
│   └── renderers/
│       ├── DiscoveryIntroQuestion.jsx   # EXTEND: pagination + card schema
│       └── __tests__/
│           └── DiscoveryIntroQuestion.test.jsx  # UPDATE + add pagination tests
├── locales/
│   ├── en/
│   │   ├── trail.json              # UPDATE: units.names; possibly node names
│   │   └── common.json             # UPDATE: game.discovery.cards.<concept>.*
│   └── he/
│       ├── trail.json              # UPDATE: parity
│       └── common.json             # UPDATE: parity
├── config/
│   └── subscriptionConfig.js       # UPDATE: FREE_RHYTHM_NODE_IDS
scripts/
└── validateTrail.mjs               # UPDATE: add 3 new rules + concept-family map
supabase/migrations/
└── 2026MMDD000001_phase1_rhythm_pedagogy.sql  # NEW: wipe + is_free_node()
public/
└── sw.js                            # UPDATE: bump cache version (pianomaster-v7 → v8)
CLAUDE.md                            # UPDATE: rhythm node count math
```

### Pattern 1: Rhythm node shape (canonical)

```javascript
// Source: src/data/units/rhythmUnit1Redesigned.js (verified)
{
  id: "rhythm_1_1",
  name: "Quarter Notes",                    // English display string (also used as i18n key)
  description: "Discover and practice steady quarter notes",
  category: CATEGORY,                       // "rhythm" or "boss" (for boss_rhythm_* nodes)
  unit: UNIT_ID,                            // 1..10
  unitName: UNIT_NAME,                      // "Quarter & Half Notes" — also display string
  order: START_ORDER,                       // monotonic across whole trail; rhythm currently 100..143
  orderInUnit: 1,
  prerequisites: [],                        // array of node IDs, [] for first

  nodeType: NODE_TYPES.DISCOVERY,           // discovery | practice | speed_round | mini_boss | boss

  rhythmConfig: {                           // REQUIRED for all rhythm nodes
    complexity: RHYTHM_COMPLEXITY.SIMPLE,   // simple | medium | varied | all
    durations: ["q"],                       // duration codes from durationInfo.js
    focusDurations: ["q"],                  // ⭐ Used by validator for principle enforcement
    contextDurations: [],
    patternTags: ["quarter-only"],          // must exist in RHYTHM_PATTERNS
    patternTagMode: "all",                  // "any" only on cumulative bosses (D-06 v3.3)
    tempo: { min: 60, max: 75, default: 68 },
    pitch: "C4",
    timeSignature: "4/4",
    measureCount: 1,                        // policy: discovery=1, practice=2, speed=4, boss=4
  },

  newContent: NEW_CONTENT_TYPES.RHYTHM,
  newContentDescription: "Quarter Notes (1 beat)",

  exercises: [
    {
      type: EXERCISE_TYPES.MIXED_LESSON,    // discovery/practice/mini_boss = mixed_lesson; speed = arcade_rhythm
      config: {
        questions: [                        // discovery_intro must be first if scaffolding
          { type: "discovery_intro", focusDuration: "q" },
          { type: "syllable_matching" },
          // ...
        ],
      },
    },
  ],

  skills: ["quarter_note"],
  xpReward: 45,
  accessoryUnlock: null,                    // string ID or null
  isBoss: false,
  isReview: false,
  reviewsUnits: [],
}
```

### Pattern 2: UNITS map entry (canonical)

```javascript
// Source: src/data/skillTrail.js (verified)
RHYTHM_8: {
  id: "rhythm_unit_8",
  category: NODE_CATEGORIES.RHYTHM,
  name: "Three-Four Time",                  // Display string also used as i18n key
  description: "Feel three beats per bar — waltz time",
  order: 8,
  theme: "Waltzing In",
  icon: "🥁",                                // Emoji optional
  reward: {
    type: "accessory",
    id: "rhythm_three_four_badge",          // Unique badge ID
    name: "Three-Four Badge",
  },
},
```

### Pattern 3: Scaffolding extension to discovery_intro question schema

**Current shape (single card):**

```javascript
{ type: "discovery_intro", focusDuration: "q" }
```

**Proposed extension (D-07 multi-card):**

```javascript
{
  type: "discovery_intro",
  focusDuration: "q",
  cards: [                                  // NEW optional array (2-4 entries)
    { kind: "meet" },                       // hero glyph + name
    { kind: "sound" },                      // audio demo
    { kind: "music" },                      // mini-staff preview
    { kind: "ready" },                      // transition
  ],
  // OR: omit `cards` and let renderer resolve from focusDuration via internal lookup map.
  // Recommendation: BOTH — accept inline override AND have default lookup keyed by focusDuration.
}
```

Renderer reads card array, paginates with index state, calls `onComplete(1,1)` only on final card. **`focusPattern` mode (used by Unit 8 syncopation, e.g. `qhq`) is preserved unchanged** — pattern intros keep their single-screen rendering.

### Anti-Patterns to Avoid

- **Adding `NODE_TYPES.SCAFFOLDING`** — explicitly forbidden by D-06. Would require touching `NODE_TYPES`, validator whitelist, `TrailNode.jsx` icon mapping, `TrailNodeModal.jsx` routing, paywall config, and would double the visible trail node count.
- **Putting scaffolding copy in `trail.json`** — `trail.json` is for unit/node display-name copy; scaffolding card body text belongs in `common.json::game.discovery.cards.*` because the renderer is in `common` namespace.
- **Hand-rolling Hebrew Kodaly syllables** — user-confirmed nikud only. Reuse `getSyllable(duration, 'he')` from `durationInfo.js`.
- **Client-side delete of progress rows** — RLS would block it for cross-user safety. Migration only.
- **Touching `students_score.total_xp` in the migration** — REQ-06 hard constraint.

## Don't Hand-Roll

| Problem                   | Don't Build              | Use Instead                                                               | Why                                                                                      |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Mini-staff rendering      | Custom SVG staff         | `RhythmStaffDisplay` from `src/components/games/rhythm-games/components/` | Already handles time signature, beaming, beats; used by current `DiscoveryIntroQuestion` |
| Duration glyph SVGs       | Author new glyphs        | `SVG_COMPONENTS` map in `DurationCard.jsx` + `src/assets/musicSymbols/`   | All 11 needed glyphs already exist; `BeamedSixteenthsIcon` shows wide-glyph pattern      |
| Audio playback for cards  | Custom Web Audio code    | `useAudioEngine` + `useAudioContext` + `schedulePatternPlayback`          | Already wired into `DiscoveryIntroQuestion`; handles iOS quirks, prewarm                 |
| Syllable lookup           | Inline string maps       | `getSyllable(code, lang)` from `durationInfo.js`                          | Has user-confirmed Hebrew nikud; lookup-by-units handles edge cases                      |
| Landscape gating          | Custom orientation logic | `useDeclareNeedsLandscape(false)` already in renderer                     | One line; integrates with global landscape system                                        |
| i18n with accent spans    | Hand-built JSX           | `<Trans>` with `components={{ accent: <span ... /> }}`                    | Existing pattern in `DiscoveryIntroQuestion`; keeps RTL parity                           |
| Pagination state          | Carousel library         | `useState` for currentCardIndex + buttons                                 | 2–4 cards doesn't justify a library; simple state suffices                               |
| Rhythm pattern resolution | New algorithm            | `resolveByTags` + `RhythmPatternGenerator.js` + `patternTags` system      | Existing infrastructure; validator already enforces tag existence + duration safety      |

**Key insight:** Every UI primitive needed for scaffolding cards is already in this codebase. The phase is composition + new copy + data restructure — not new infrastructure.

## Runtime State Inventory

This phase IS a rename/restructure phase. Each category answered explicitly:

| Category                                 | Items Found                                                                                                                                                                                                                                                              | Action Required                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stored data**                          | `student_skill_progress.node_id` rows for `rhythm_*` / `boss_rhythm_*` (potentially many per user). `exercise_progress` JSONB inside each row uses `index` not `exerciseIndex` (see MEMORY.md). `daily_goals` and `student_unit_progress` may reference rhythm node IDs. | **Data migration** — `DELETE FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%';`. Also `DELETE FROM student_unit_progress WHERE unit_id LIKE 'rhythm_unit_%';` if that table exists (see `20260204000001_reset_trail_progress_v13.sql` for the IF EXISTS pattern). `student_daily_goals` may contain stale goals referencing old rhythm node IDs — recommend `DELETE FROM student_daily_goals WHERE ...` or regenerate on next session. [ASSUMED — planner should confirm `student_daily_goals` schema and whether it caches `node_id`] |
| **Live service config**                  | None — no n8n/Datadog/Cloudflare integrations for trail data. Trail content is purely a frontend JS module.                                                                                                                                                              | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **OS-registered state**                  | None — no Task Scheduler or pm2 references to rhythm node IDs.                                                                                                                                                                                                           | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Secrets / env vars**                   | None — `VITE_VAPID_PUBLIC_KEY`, `CRON_SECRET`, `BREVO_API_KEY`, `SUPABASE_*` keys do not reference rhythm node IDs.                                                                                                                                                      | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Build artifacts / installed packages** | Service worker cache `pianomaster-v7` will serve stale `index.html`, stale JS bundles, and stale locale JSON to existing PWA users. iOS Safari is especially sticky.                                                                                                     | **Code edit** — bump SW cache version (e.g. to `pianomaster-v8`) in `public/sw.js` so the new code + locales are fetched on first navigation post-deploy. Without this, returning users see old node names + paywall against new IDs → softlock.                                                                                                                                                                                                                                                                                                                                |

**Special note — Hidden Unit 8 rename impact (D-10):**

| Artifact                                                                                                    | Action                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/units/rhythmUnit8Redesigned.js`                                                                   | Rename internal IDs `rhythm_8_*` → `rhythm_synco_*`, `boss_rhythm_8` → `boss_rhythm_synco`. File path may stay.                                                                                                |
| `src/data/units/rhythmUnit8Redesigned.test.js`                                                              | Update expected ID assertions                                                                                                                                                                                  |
| `src/data/units/rhythmUnits.difficulty.test.js`                                                             | Already imports `rhythmUnit8Nodes` — keeps working since import is symbol-based not ID-based                                                                                                                   |
| `src/data/expandedNodes.js`                                                                                 | Update `HIDDEN-V1` comments to reference new `rhythm_synco_*` IDs                                                                                                                                              |
| `src/data/skillTrail.js`                                                                                    | Update `UNITS.RHYTHM_8` → still uses `id: "rhythm_unit_8"` but conceptually now represents 3/4 Meter; the syncopation hidden unit would need a separate `UNITS` entry (e.g. `RHYTHM_SYNCO`) if/when re-enabled |
| `src/locales/en/trail.json::unit8Nodes` + `units.names["Syncopation"]`                                      | Rename or move to a `synco`-keyed location to free `rhythm_8_*` namespace                                                                                                                                      |
| `src/locales/he/trail.json` parity                                                                          | Same                                                                                                                                                                                                           |
| `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` titleOverride keys `qhq`, `synsyn` | Keep — these are pattern IDs (`focusPattern.id`), not node IDs; no rename needed                                                                                                                               |
| Postgres `is_free_node()`                                                                                   | Today's mirror still lists `rhythm_1_2` (see subscriptionConfig.js comment) — D-13 replaces entire body so legacy entries are cleaned up incidentally                                                          |

[ASSUMED] No existing user data exists for `rhythm_8_*` (hidden = never reachable), so no migration impact from the rename itself.

## Current Rhythm Trail Inventory

**Verified via `node -e "import('./src/data/skillTrail.js')..."` on 2026-06-01:**

| ID            | Unit | Order | NodeType    | focusDurations | durations                 | timeSig | XP  | Prereq        |
| ------------- | ---- | ----- | ----------- | -------------- | ------------------------- | ------- | --- | ------------- |
| rhythm_1_1    | 1    | 100   | discovery   | q              | q                         | 4/4     | 45  | —             |
| rhythm_1_3    | 1    | 101   | discovery   | h              | q,h                       | 4/4     | 45  | rhythm_1_1    |
| rhythm_1_4    | 1    | 102   | practice    | —              | q,h                       | 4/4     | 50  | rhythm_1_3    |
| rhythm_1_6    | 1    | 103   | speed_round | —              | q,h                       | 4/4     | 55  | rhythm_1_4    |
| boss_rhythm_1 | 1    | 104   | mini_boss   | —              | q,h                       | 4/4     | 100 | rhythm_1_6    |
| rhythm_2_1    | 2    | 106   | discovery   | w              | q,h,w                     | 4/4     | 50  | boss_rhythm_1 |
| rhythm_2_2    | 2    | 107   | practice    | —              | q,h,w                     | 4/4     | 50  | rhythm_2_1    |
| rhythm_2_3    | 2    | 108   | discovery   | —              | q,h,w                     | 4/4     | 55  | rhythm_2_2    |
| rhythm_2_4    | 2    | 109   | practice    | —              | q,h,w                     | 4/4     | 55  | rhythm_2_3    |
| rhythm_2_6    | 2    | 110   | speed_round | —              | q,h,w                     | 4/4     | 60  | rhythm_2_4    |
| boss_rhythm_2 | 2    | 111   | mini_boss   | —              | q,h,w                     | 4/4     | 110 | rhythm_2_6    |
| rhythm_3_1    | 3    | 112   | discovery   | 8_pair         | q,8                       | 4/4     | 55  | boss_rhythm_2 |
| rhythm_3_2    | 3    | 113   | practice    | —              | q,8                       | 4/4     | 60  | rhythm_3_1    |
| rhythm_3_3    | 3    | 114   | discovery   | —              | q,h,w,8                   | 4/4     | 60  | rhythm_3_2    |
| rhythm_3_4    | 3    | 115   | practice    | —              | q,h,w,8                   | 4/4     | 65  | rhythm_3_3    |
| rhythm_3_6    | 3    | 116   | speed_round | —              | q,h,w,8                   | 4/4     | 70  | rhythm_3_4    |
| boss_rhythm_3 | 3    | 117   | mini_boss   | —              | q,h,w,8                   | 4/4     | 120 | rhythm_3_6    |
| rhythm_4_1    | 4    | 118   | discovery   | qr             | q,qr                      | 4/4     | 55  | boss_rhythm_3 |
| rhythm_4_2    | 4    | 119   | practice    | —              | q,qr                      | 4/4     | 55  | rhythm_4_1    |
| rhythm_4_3    | 4    | 120   | discovery   | hr             | q,h,qr,hr                 | 4/4     | 60  | rhythm_4_2    |
| rhythm_4_4    | 4    | 121   | practice    | —              | q,h,qr,hr                 | 4/4     | 60  | rhythm_4_3    |
| rhythm_4_5    | 4    | 122   | discovery   | wr             | q,h,w,qr,hr,wr            | 4/4     | 65  | rhythm_4_4    |
| rhythm_4_6    | 4    | 123   | speed_round | —              | q,h,w,qr,hr,wr            | 4/4     | 70  | rhythm_4_5    |
| boss_rhythm_4 | 4    | 124   | mini_boss   | —              | q,h,w,8,qr,hr,wr          | 4/4     | 130 | rhythm_4_6    |
| rhythm_5_1    | 5    | 125   | discovery   | hd             | q,h,w,8,qr,hr,wr,hd       | 4/4     | 65  | boss_rhythm_4 |
| rhythm_5_2    | 5    | 126   | practice    | —              | (same+hd)                 | 4/4     | 65  | rhythm_5_1    |
| rhythm_5_3    | 5    | 127   | discovery   | —              | q,hd                      | **3/4** | 70  | rhythm_5_2    |
| rhythm_5_4    | 5    | 128   | discovery   | qd             | q,8,qd                    | 4/4     | 70  | rhythm_5_3    |
| rhythm_5_5    | 5    | 129   | practice    | —              | q,h,hd,qd,8               | 4/4     | 75  | rhythm_5_4    |
| rhythm_5_6    | 5    | 130   | speed_round | —              | (same)                    | 4/4     | 80  | rhythm_5_5    |
| boss_rhythm_5 | 5    | 131   | mini_boss   | —              | q,h,w,8,qr,hr,wr,hd,qd    | 4/4     | 140 | rhythm_5_6    |
| rhythm_6_1    | 6    | 132   | discovery   | 16             | q,16                      | 4/4     | 75  | boss_rhythm_5 |
| rhythm_6_2    | 6    | 133   | practice    | —              | q,16                      | 4/4     | 80  | rhythm_6_1    |
| rhythm_6_3    | 6    | 134   | discovery   | —              | q,8,16                    | 4/4     | 80  | rhythm_6_2    |
| rhythm_6_4    | 6    | 135   | practice    | —              | q,h,8,16                  | 4/4     | 85  | rhythm_6_3    |
| rhythm_6_6    | 6    | 136   | speed_round | —              | q,h,8,16                  | 4/4     | 90  | rhythm_6_4    |
| boss_rhythm_6 | 6    | 137   | **boss**    | —              | q,h,w,8,16,qr,hr,wr,hd,qd | 4/4     | 200 | rhythm_6_6    |
| rhythm_7_1    | 7    | 138   | discovery   | qd             | qd                        | **6/8** | 75  | boss_rhythm_6 |
| rhythm_7_2    | 7    | 139   | practice    | —              | qd                        | 6/8     | 80  | rhythm_7_1    |
| rhythm_7_3    | 7    | 140   | discovery   | q              | qd,q                      | 6/8     | 80  | rhythm_7_2    |
| rhythm_7_4    | 7    | 141   | practice    | —              | qd,q,8                    | 6/8     | 80  | rhythm_7_3    |
| rhythm_7_6    | 7    | 142   | speed_round | —              | qd,q,8                    | 6/8     | 90  | rhythm_7_4    |
| boss_rhythm_7 | 7    | 143   | mini_boss   | —              | qd,q,8                    | 6/8     | 150 | rhythm_7_6    |

**Total active rhythm nodes: 43** (36 `category:'rhythm'` + 7 `category:'boss'`). CLAUDE.md and SPEC.md state "29" — both inaccurate. Planner should update CLAUDE.md's node count math to reflect actual current=43, new target=55, delta=+12.

**Today's free rhythm IDs (in `FREE_NODE_IDS` Set):** `rhythm_1_1`, `rhythm_1_3`, `rhythm_1_4`, `rhythm_1_6` (4 IDs — `rhythm_1_5` was removed, `rhythm_1_2` merged into `rhythm_1_1`). Postgres mirror still lists 6 IDs including stale `rhythm_1_2` and `rhythm_1_5` (left intentionally per subscriptionConfig.js comment). D-13's migration cleans this up.

**XP totals (current vs. target):**

- Current rhythm total: ~3,240 XP across 43 nodes
- Target with new structure: planner must keep XP balance within 10% variance per validator's XP economy rule. Recommend mirroring current per-nodeType XP values: discovery 45–75, practice 50–80, speed 55–90, mini_boss 100–150, boss 200–250.

## Validator Lint Rules (Existing + New)

### Existing rules (must continue passing)

| Rule                               | What it checks                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `validatePrerequisiteChains`       | No missing prereqs, no cycles (DFS)                                                                            |
| `validateNodeTypes`                | nodeType in `Object.values(NODE_TYPES)`                                                                        |
| `validateDuplicateIds`             | Unique node IDs                                                                                                |
| `validateXPEconomy`                | Warns if main-path XP variance > 10%                                                                           |
| `validateExerciseTypes`            | exercise.type in `Object.values(EXERCISE_TYPES)`                                                               |
| `validateExerciseDifficultyValues` | difficulty ∈ {beginner, intermediate, advanced}                                                                |
| `validateRhythmPatternNames`       | duration names in known set                                                                                    |
| `validateMultiAngleGames`          | rhythmConfig required; questionCount > 0; low-variety nodes warn if missing multi-angle game                   |
| `validateMixedLessons`             | questions array non-empty; types in `RENDERER_TYPES`; count 8–10 (10–12 boss; 4+ discovery; 5+ compose_rhythm) |
| `validatePatternTagExistence`      | All patternTags exist in `RHYTHM_PATTERNS`                                                                     |
| `validatePatternTagCoverage`       | Warn on orphan library tags                                                                                    |
| `validateDurationSafety`           | `resolveByTags(tag, durations, ts)` ≠ null                                                                     |
| `validateGameTypePolicy`           | discovery/practice/mix_up/review/mini_boss → mixed_lesson; challenge/speed_round/boss → arcade_rhythm          |
| `validateMeasureCountPolicy`       | discovery=1, practice=2, speed=4, mini_boss=4, boss=4 (skips pulse/mixed_lesson types)                         |

### New rules required by D-14

```javascript
// Rule 1: Pulse-first (REQ-01)
function validatePulseFirst() {
  const rhythmNodes = SKILL_NODES.filter((n) => n.category === "rhythm").sort(
    (a, b) => a.order - b.order
  );
  // The first node should introduce quarter (focusDurations includes 'q')
  const first = rhythmNodes[0];
  if (!first?.rhythmConfig?.focusDurations?.includes("q")) {
    error(
      `First rhythm node "${first?.id}" must introduce quarter (focusDurations including 'q'), got ${JSON.stringify(first?.rhythmConfig?.focusDurations)}`
    );
  }
}

// Rule 2: Rests-woven (REQ-02)
const REST_TO_DURATION = { qr: "q", hr: "h", wr: "w" };
function validateRestsWoven() {
  const rhythmNodes = SKILL_NODES.filter(
    (n) =>
      n.category === "rhythm" ||
      (n.category === "boss" && n.id.startsWith("boss_rhythm_"))
  ).sort((a, b) => a.order - b.order);
  for (let i = 0; i < rhythmNodes.length; i++) {
    const node = rhythmNodes[i];
    const focus = node.rhythmConfig?.focusDurations || [];
    for (const rest of ["qr", "hr", "wr"]) {
      if (focus.includes(rest)) {
        const matchingDur = REST_TO_DURATION[rest];
        // Walk backward; find closest preceding rhythm node whose focusDurations include matchingDur
        let found = false;
        for (let j = i - 1; j >= 0; j--) {
          const prev = rhythmNodes[j];
          if ((prev.rhythmConfig?.focusDurations || []).includes(matchingDur)) {
            found = true;
            break;
          }
        }
        if (!found)
          error(
            `Rest "${rest}" in node "${node.id}" has no preceding duration "${matchingDur}" introduction`
          );
      }
    }
  }
}

// Rule 3: Concept-per-unit (REQ-03)
const CONCEPT_FAMILIES = {
  // Duration + rest pairs
  q_qr: new Set(["q", "qr"]),
  h_hr: new Set(["h", "hr"]),
  w_wr: new Set(["w", "wr"]),
  // Subdivisions
  eighths: new Set(["8", "8_pair"]),
  sixteenths: new Set(["16"]),
  // Dotted
  dotted_half: new Set(["hd"]),
  dotted_quarter: new Set(["qd"]),
  // Meters — identified by timeSignature, not by focusDurations
};
function validateConceptPerUnit() {
  // Group rhythm nodes by unit
  const byUnit = new Map();
  for (const node of SKILL_NODES) {
    if (
      node.category !== "rhythm" &&
      !(node.category === "boss" && node.id.startsWith("boss_rhythm_"))
    )
      continue;
    const key = node.unit;
    if (!byUnit.has(key)) byUnit.set(key, []);
    byUnit.get(key).push(node);
  }
  for (const [unit, nodes] of byUnit) {
    // Special case U10 (review boss): exempt
    const allFocus = new Set();
    for (const n of nodes) {
      for (const f of n.rhythmConfig?.focusDurations || []) allFocus.add(f);
    }
    const ts = new Set(
      nodes.map((n) => n.rhythmConfig?.timeSignature).filter(Boolean)
    );
    // ... determine which families are introduced; fail if > 1 distinct family
  }
}
```

**Where new rules slot in:** append after `validateGameTypePolicy` (line ~602) and before `validateMeasureCountPolicy` (line 613); add their invocations in the main block (lines 677–690). Mirror the existing pattern: `let errorCount = 0; ... console.error(` ERROR: ...`); hasErrors = true;`

## Locale-Key Pattern

**Critical insight:** trail.json uses display-name strings as keys, NOT node IDs.

### `src/locales/en/trail.json` structure (verified)

```json
{
  "units": {
    "classicNodes": "Classic Nodes",
    "unitLabel": "Unit",
    "names": {
      "Quarter & Half Notes": "Quarter & Half Notes",    // ← key = English unit name from UNITS map
      "Whole Notes": "Whole Notes",
      ...
    }
  },
  "nodes": {
    "Meet Middle C": "Meet Middle C",                    // ← key = English node name from node data
    "Quarter Notes": "Quarter Notes",
    ...
  },
  "descriptions": { ... },                               // node descriptions
  "unlockHints": { ... },
  "boss": { ... },
  "exerciseTypes": { ... }
}
```

**Implication:** When renaming or adding rhythm unit names (e.g. "Quarter + Quarter Rest", "Three-Four Time", "Rhythm Review"), the planner must add corresponding entries under `units.names`, `nodes`, `descriptions`. Same in `he/trail.json`. If a unit/node name string matches an existing key (e.g. "Whole Notes" already exists from current U2), it can be reused.

### `src/locales/{en,he}/common.json::game.discovery.*` (verified)

```json
{
  "game": {
    "discovery": {
      "meetNew": "Meet the <accent>{{name}}</accent>!",     // current single-card title
      "ariaLabel": "Meet a new rhythm",
      "syllable": "Say: \"{{syllable}}\"",
      "listen": "Listen",
      "playing": "Playing...",
      "gotIt": "Got it!",
      "titleOverride": { "16": "Meet the four sixteenth notes rhythm", "qhq": "...", "synsyn": "..." },
      "syllableOverride": { "16": "ta-fa-te-fe", ... }
    }
  }
}
```

**Recommendation for D-08 scaffolding card copy:**

```json
{
  "game": {
    "discovery": {
      ... existing keys preserved ...
      "cards": {
        "q": {
          "meet": { "title": "Meet the Quarter Note", "body": "..." },
          "sound": { "title": "How it sounds", "body": "..." },
          "music": { "title": "How it looks in music", "body": "..." },
          "ready": { "title": "Ready to try?", "body": "..." }
        },
        "qr": { ... },
        "h": { ... },
        ...
        "3_4": { ... },    // meter concept
        "6_8": { ... }
      }
    }
  }
}
```

12 concepts × ~3 cards × 2 strings (title + body) × 2 languages = ~144 strings to author. The planner should consider authoring strings in EN first, then translating to HE in a single pass with the user (Hebrew nikud constraint applies to syllables only, not body text — body text is plain Hebrew per memory note).

**No required-keys lint exists.** Missing keys fail silently in i18next (fall through to default string in `<Trans defaults="...">`). To avoid drift, the planner should add a locale-completeness test:

```javascript
// src/locales/__tests__/scaffolding-card-parity.test.js
it("every EN scaffolding card key has HE parity", () => {
  // Walk en.game.discovery.cards; assert he.game.discovery.cards has every same path
});
```

## Paywall Sync

### Two sources to keep aligned

1. **JS (`src/config/subscriptionConfig.js`):** `FREE_NODE_IDS` Set used by React UI for paywall display.
2. **Postgres `is_free_node()`:** Used by RLS policies on `student_skill_progress` and other trail-related tables.

### Current state (verified)

- JS `FREE_RHYTHM_NODE_IDS` = `['rhythm_1_1', 'rhythm_1_3', 'rhythm_1_4', 'rhythm_1_6']` (4 IDs)
- Postgres `is_free_node()` (per `20260329000001_add_ear_training_free_nodes.sql`) = `['rhythm_1_1', 'rhythm_1_2', 'rhythm_1_3', 'rhythm_1_4', 'rhythm_1_5', 'rhythm_1_6']` (6 IDs — includes obsolete `rhythm_1_2` and `rhythm_1_5`)

The drift is intentional and harmless per the subscriptionConfig.js comment: "The Postgres is_free_node() mirror still listing rhythm_1_2 is harmless and intentionally left alone per the no-migration decision."

### Post-phase target (D-12)

Both sides converge to the same 6 IDs: `rhythm_1_1`, `rhythm_1_2`, `rhythm_1_3`, `rhythm_1_4`, `rhythm_1_5`, `boss_rhythm_1`.

### Parity test (recommended)

```javascript
// src/config/__tests__/freeNodes.parity.test.js
it("FREE_NODE_IDS matches the documented postgres whitelist", () => {
  const expectedRhythm = [
    "rhythm_1_1",
    "rhythm_1_2",
    "rhythm_1_3",
    "rhythm_1_4",
    "rhythm_1_5",
    "boss_rhythm_1",
  ];
  expect([...FREE_RHYTHM_NODE_IDS, "boss_rhythm_1"]).toEqual(
    expect.arrayContaining(expectedRhythm)
  );
});
```

Manual diff verification step in the migration: run `SELECT is_free_node('rhythm_1_1');` etc. for each ID in the test DB after migration applies.

### Risks if they drift

- A new node included in JS but not Postgres → free in UI, paywalled in DB → 403 error on exercise attempt.
- A node included in Postgres but not JS → paywalled in UI (locked icon shown), accessible in DB → confused user clicks locked node, succeeds inexplicably.

## Supabase Wipe Migration

**Pattern proven by two prior migrations:**

1. **`20260204000001_reset_trail_progress_v13.sql`** — wholesale reset for v1.3 redesign. Uses `BEGIN; ... COMMIT;`, logs pre/post counts via `RAISE NOTICE`, conditionally targets `student_unit_progress` via `IF EXISTS`, preserves `total_xp` via explicit verification.

2. **`20260330000001_reset_rhythm_node_progress.sql`** — surgical rhythm-only reset using `UPDATE ... SET exercise_progress = '[]'::jsonb, stars = 0, best_score = NULL WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`. Includes deploy-ordering comment: "MUST run before updated rhythmUnit\*.js files deploy to production."

### Recommended migration shape for this phase (D-13)

```sql
-- 2026MMDD000001_phase1_rhythm_pedagogy.sql
-- Phase 1 (v3.5): Rhythm trail pedagogical restructure
-- (a) Wipe rhythm progress (no migration mapping)
-- (b) Replace is_free_node() body with new U1 free-node set
-- DEPLOY CONSTRAINT: MUST run BEFORE Netlify code deploy.
-- students_score.total_xp is NEVER touched.

BEGIN;

-- Pre-flight: log counts for forensic comparison
DO $$
DECLARE
  v_rhythm_rows INTEGER;
  v_total_xp_pre BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_rhythm_rows FROM student_skill_progress
   WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%';
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_pre FROM students;
  RAISE NOTICE 'Pre-migration rhythm skill_progress rows: %', v_rhythm_rows;
  RAISE NOTICE 'Pre-migration total_xp (preserved): %', v_total_xp_pre;
END $$;

-- (a) Wipe rhythm rows
DELETE FROM student_skill_progress
 WHERE node_id LIKE 'rhythm_%'
    OR node_id LIKE 'boss_rhythm_%';

-- Also drop stale daily goals referencing rhythm nodes (regenerated next session)
-- [ASSUMED — confirm student_daily_goals schema before authoring]
-- DELETE FROM student_daily_goals WHERE goal_data->>'node_id' LIKE 'rhythm_%';

-- Conditionally clean unit progress
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_unit_progress') THEN
    DELETE FROM student_unit_progress
     WHERE unit_id LIKE 'rhythm_unit_%';
  END IF;
END $$;

-- (b) Replace is_free_node() body
CREATE OR REPLACE FUNCTION public.is_free_node(node_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN node_id = ANY(ARRAY[
    'treble_1_1','treble_1_2','treble_1_3','treble_1_4','treble_1_5','treble_1_6','treble_1_7',
    'bass_1_1','bass_1_2','bass_1_3','bass_1_4','bass_1_5','bass_1_6',
    -- Rhythm Unit 1 (NEW: Quarter + Quarter Rest, 6 free nodes) — Phase 1 v3.5
    'rhythm_1_1','rhythm_1_2','rhythm_1_3','rhythm_1_4','rhythm_1_5','boss_rhythm_1',
    'ear_1_1','ear_1_2','ear_1_3','ear_1_4','ear_1_5','ear_1_6'
  ]);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_free_node(TEXT) TO authenticated;
COMMENT ON FUNCTION public.is_free_node IS
  'Returns true for free-tier accessible trail nodes. Synced with JS subscriptionConfig.js FREE_NODE_IDS. Phase 1 v3.5: rhythm restructure.';

-- Post-flight: verify total_xp preserved
DO $$
DECLARE v_total_xp_post BIGINT;
BEGIN
  SELECT COALESCE(SUM(total_xp), 0) INTO v_total_xp_post FROM students;
  RAISE NOTICE 'Post-migration total_xp: %', v_total_xp_post;
END $$;

COMMENT ON TABLE student_skill_progress IS
  'Rhythm trail progress wiped 2026-MM-DD for Phase 1 v3.5 (10-unit / 55-node restructure). XP preserved.';

COMMIT;
```

**Idempotency:** `DELETE WHERE ... LIKE 'rhythm_%'` is idempotent (re-running deletes nothing new). `CREATE OR REPLACE FUNCTION` is idempotent.

**Rollback story:** No rollback. Per REQ-06 acceptance: "Migration is reversible only by manual re-seed (no rollback expected)." Document this in the migration header.

**RLS implications:** None — `student_skill_progress` already has RLS policies. DELETE via migration runs as the `postgres` superuser, bypassing RLS by default. No new policies needed.

**Race condition risk:** If a student has an active session at the moment the migration runs, they may write a `student_skill_progress` row for an old `rhythm_%` node ID just before/after the DELETE. Mitigations: (i) the spec accepts beta-stage user base; (ii) the SW cache bump (Wave 3) ensures returning users get the new code on next navigation. Recommend documenting the race-window risk in the deploy runbook but not gating on it.

## Auto-Start / Navigation

**Verified in `MixedLessonGame.jsx` lines 90–98:**

```javascript
const nodeConfig = location.state?.nodeConfig || null;
const nodeId = location.state?.nodeId || null;
const trailExerciseIndex = location.state?.exerciseIndex ?? null;
const trailTotalExercises = location.state?.totalExercises ?? null;
const trailExerciseType = location.state?.exerciseType ?? null;
```

**Implication for scaffolding pagination:** The multi-card scaffolding happens _inside_ a single `discovery_intro` question (one question = many cards). Outer `location.state` contract is **unchanged**:

- `nodeId`, `nodeConfig`, `exerciseIndex`, `totalExercises`, `exerciseType` continue to flow as today
- `currentIndex` inside `MixedLessonGame` advances per-question, not per-card
- `currentIndexRef` stale-closure guard (v3.3 CODE-01) remains intact — pagination state lives inside `DiscoveryIntroQuestion`
- `onComplete(1, 1)` is called only on the final card click; until then no progress is reported

**One subtle requirement:** the pagination state in `DiscoveryIntroQuestion` must reset on question re-entry (e.g. if MixedLessonGame re-renders the same component with a new question prop). Reset via `key` prop or `useEffect` on `question`/`focusDuration` change.

**No changes needed to:** `TrailNodeModal.jsx`, `TrailMap.jsx`, `TrailNode.jsx`, `VictoryScreen.jsx`, `ZigzagTrailLayout.jsx`, `UnitProgressCard.jsx`. All consume `category` / `isBoss` / `unit` / `order`, which remain unchanged in shape.

## Test Coverage Map

### Existing rhythm tests (UPDATE)

| File                                                                                    | Action                                                                                | Reason                                                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/data/units/rhythmUnit7Redesigned.test.js`                                          | Replace with `rhythmUnit{1..10}.test.js` (or `*Redesigned.test.js`) for each new unit | Today's U7 will become U9 (6/8 Meter), so the IDs and orders change |
| `src/data/units/rhythmUnit8Redesigned.test.js`                                          | Update expected IDs from `rhythm_8_*` to `rhythm_synco_*`                             | D-10 rename                                                         |
| `src/data/units/rhythmUnits.difficulty.test.js`                                         | Update imports to new unit files; keep difficulty assertion                           | Imports change; test logic stays                                    |
| `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` | Add pagination test cases                                                             | Multi-card flow is new                                              |
| `src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx`                  | Verify it still works with paginated discovery_intro                                  | Regression guard                                                    |
| `src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx`            | Should not need changes                                                               | No node-ID coupling                                                 |
| `src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx`             | Should not need changes                                                               | Same                                                                |

### New tests required

| File                                                                                               | Purpose                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/units/rhythmUnit{1..10}.test.js` (10 files)                                              | Per-unit shape + ID + prereq tests, mirroring `rhythmUnit7Redesigned.test.js`                                                                                                                           |
| `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` (extended) | (1) renders single card when `cards` omitted, (2) renders N cards when `cards: [{...}, ...]`, (3) advances on Next click, (4) calls `onComplete(1,1)` only after final card, (5) renders EN + HE titles |
| `src/locales/__tests__/scaffolding-card-parity.test.js`                                            | EN ↔ HE key parity under `game.discovery.cards.*`                                                                                                                                                      |
| `src/config/__tests__/freeNodes.parity.test.js`                                                    | JS `FREE_RHYTHM_NODE_IDS` matches the SQL whitelist as a documented array                                                                                                                               |
| `scripts/__tests__/validateTrail.test.mjs` (if created)                                            | New rules behave as expected against fixture data; otherwise verify by running `npm run verify:trail`                                                                                                   |

### Test framework details

- **Framework:** Vitest 3.2.4 [VERIFIED: package.json]
- **Config:** `vite.config.js` with JSDOM; `src/test/setupTests.js` [VERIFIED: CLAUDE.md "Testing"]
- **Quick run command:** `npx vitest run src/path/to/file.test.jsx`
- **Full suite:** `npm run test:run`
- **Validator:** `npm run verify:trail`

## Migration Ordering / Deploy Story

**Per D-13:** Supabase migration before Netlify code deploy.

### Ordered runbook

1. **Local:** All code + locale + validator + test changes merged to `main`. `npm run verify:trail` green; `npm run test:run` green.
2. **Supabase (test DB first):** Apply migration to test DB. Verify (a) `student_skill_progress` rhythm rows = 0, (b) `students_score.total_xp` unchanged, (c) `SELECT is_free_node('rhythm_1_1')` returns true for new free IDs.
3. **Supabase (prod):** Apply migration to production DB.
4. **Netlify code deploy:** Push to `main`. Netlify auto-deploys (build runs `npm run verify:trail` as prebuild — fails if data inconsistent).
5. **Cache bump propagation:** SW cache version bump triggers re-fetch on user's next navigation. iOS PWA users may take longer (sometimes a full app close + reopen).
6. **Owner walkthrough:** Complete every node from `rhythm_1_1` through `boss_rhythm_10` on a real student account.

### Race condition window

Between step 3 (migration applied) and step 4 (new code live) — duration is typically 2–5 minutes (Netlify build time).

- **What happens to active users?** They send writes to `student_skill_progress` with OLD `rhythm_*` IDs. New ID space is `rhythm_1_1..5`, `rhythm_2_1..5`, etc. — IDs `rhythm_1_3`, `rhythm_1_4`, `rhythm_1_6` overlap (old + new). Writes during this window get persisted, then post-deploy the user sees new content with old (stale) progress for those IDs.
- **Mitigation acceptable per spec:** Beta-stage user base. The owner walkthrough catches any softlock.

### Service worker cache bump

File: `public/sw.js` line: `const CACHE_NAME = 'pianomaster-v7';`
Action: bump to `pianomaster-v8` (or any newer string).
Verified pattern in CLAUDE.md "Service Worker" section.

## Common Pitfalls

### Pitfall 1: Forgetting `patternTags` exist in `RHYTHM_PATTERNS`

**What goes wrong:** New U8 (3/4 Meter) and U9 (6/8 Meter) nodes use `timeSignature: '3/4'` / `'6/8'`. `patternTags` must reference patterns that have matching beat math for that time signature.
**How to avoid:** Run `npm run verify:trail` after every unit data file write. `validateDurationSafety` catches mismatches.
**Warning signs:** Validator error "Node 'rhythm_8_1' tag 'X' has no matching patterns that can render with durations [...] in 3/4".

### Pitfall 2: i18n key drift between EN and HE

**What goes wrong:** EN gets a new `game.discovery.cards.q.meet.title`, HE forgets it, runtime shows "Got it!" but Hebrew title is missing.
**How to avoid:** Author EN+HE together; add parity test (above).
**Warning signs:** Hebrew screen renders English fallback text.

### Pitfall 3: Removing display-name strings still used in trail.json

**What goes wrong:** Today's UNITS map has `name: "Rests"` for `RHYTHM_4`. Locale has `units.names.Rests: "Rests"`. If the rename replaces "Rests" with "Half + Half Rest" everywhere, the orphan locale key is harmless — but if a node display name like "Meet Quarter Rest" stays (per D-08 scaffolding still introduces qr) the locale key must remain.
**How to avoid:** Diff trail.json before/after; only remove keys whose source string no longer appears in any node `name` field.

### Pitfall 4: `measureCount` policy mismatch on new boss nodes

**What goes wrong:** Validator's `validateMeasureCountPolicy` enforces boss=4. Forgetting to set `measureCount: 4` on `boss_rhythm_10` would silently default to 1 (per `nodeConfig.measureCount || 1` in MixedLessonGame), but the validator only flags if the value is _set_ and wrong, not if it's missing entirely.
**How to avoid:** Explicitly set `measureCount` on every node's `rhythmConfig`. Add a stricter validator rule if desired.

### Pitfall 5: `RHYTHM_8` UNITS entry semantic collision

**What goes wrong:** Today's `RHYTHM_8` is hidden syncopation. D-10 renames its internals to `rhythm_synco_*`. The new D-01 U8 (3/4 Meter) needs `RHYTHM_8` in the UNITS map. If the planner adds a new `RHYTHM_SYNCO` entry but leaves the old `RHYTHM_8` entry, there will be two map entries with `id: "rhythm_unit_8"` — duplicate.
**How to avoid:** Replace the old `RHYTHM_8` entry with the new 3/4 Meter content. Either (a) add a `RHYTHM_SYNCO` entry alongside it for the hidden syncopation unit (with `id: "rhythm_unit_synco"`), or (b) keep the `RHYTHM_8` entry pointing to the hidden file but only when `HIDDEN-V1` is uncommented (mutually exclusive). Recommend (a) to keep the re-enable path mechanical.

### Pitfall 6: Card content for "rest" concepts forgets silence semantics

**What goes wrong:** D-07 card 2 is "How it sounds" — but a quarter rest sounds like silence. Existing renderer plays a brief sine "click then silence" for rests (lines 146–164 of `DiscoveryIntroQuestion.jsx`). Make sure the multi-card flow preserves this branch for rest cards, or omit card 2 for rests per the D-07 note "Some concepts may use only 2 or 3 cards."
**How to avoid:** Explicit card count per concept in the lookup map.

## Code Examples

### Extending DiscoveryIntroQuestion for pagination (sketch)

```jsx
// src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx (extended)
// Source: existing file + D-06/D-07 pagination extension

const CONCEPT_CARDS = {
  // Default card sequences per focusDuration
  q: ["meet", "sound", "music", "ready"],
  qr: ["meet", "music", "ready"], // no sound card for rests
  h: ["meet", "sound", "music", "ready"],
  hr: ["meet", "music", "ready"],
  w: ["meet", "sound", "music", "ready"],
  wr: ["meet", "music", "ready"],
  "8_pair": ["meet", "sound", "music", "ready"],
  16: ["meet", "sound", "music", "ready"],
  hd: ["meet", "sound", "music", "ready"],
  qd: ["meet", "sound", "music", "ready"],
  "3_4": ["meet", "music", "ready"], // meter cards: no audio demo, mini-staff shows time sig
  "6_8": ["meet", "music", "ready"],
};

export default function DiscoveryIntroQuestion({
  question,
  isLandscape,
  onComplete,
  disabled,
}) {
  const focusDuration = question?.focusDuration;
  const cardKinds = question?.cards?.map((c) => c.kind) ||
    CONCEPT_CARDS[focusDuration] || ["meet"];

  const [cardIndex, setCardIndex] = useState(0);
  // Reset on question change (avoid stale pagination across re-renders)
  useEffect(() => {
    setCardIndex(0);
  }, [focusDuration, question?.focusPattern?.id]);

  const isLastCard = cardIndex === cardKinds.length - 1;
  const currentKind = cardKinds[cardIndex];

  const handleNext = useCallback(() => {
    if (disabled) return;
    if (isLastCard) {
      hasCompletedRef.current = true;
      onComplete(1, 1);
    } else {
      setCardIndex((i) => i + 1);
    }
  }, [isLastCard, onComplete, disabled]);

  // Render branches by currentKind:
  //   'meet' -> hero SVG glyph + title (current main card)
  //   'sound' -> Listen button (current audio demo)
  //   'music' -> RhythmStaffDisplay preview
  //   'ready' -> "You're ready!" + "Let's go!" button
  // Button label: "Next" for non-final cards, "Got it!" for final
}
```

## State of the Art

| Old Approach                               | Current Approach                                | When Changed | Impact                                             |
| ------------------------------------------ | ----------------------------------------------- | ------------ | -------------------------------------------------- |
| Mixed rhythm + meter unit (today's U5)     | Separate concept units (D-04)                   | Phase 1 v3.5 | Eliminates two-target overloading                  |
| Aggregated "Rests" unit far from durations | Rests folded into matching duration unit (D-03) | Phase 1 v3.5 | Adjacency reinforces matching duration-rest pairs  |
| Single-card discovery_intro                | Multi-card pagination (D-06, D-07)              | Phase 1 v3.5 | Duolingo-style scaffolding for 8-year-old learners |
| Hidden `rhythm_8_*` IDs blocking new U8    | Renamed to `rhythm_synco_*` (D-10)              | Phase 1 v3.5 | Frees numeric namespace; re-enable path preserved  |

## Assumptions Log

| #   | Claim                                                                                                                   | Section                        | Risk if Wrong                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `student_daily_goals` may cache `node_id` and need cleanup in the migration                                             | Runtime State Inventory        | Stale goals could persist; users see "complete `rhythm_4_3`" goals that no longer exist. Mitigation: regenerate goals on next session is the existing pattern per `20260127100000_regenerate_daily_goals.sql`. Planner should confirm schema.              |
| A2  | Hidden Unit 8 has no existing user data because it was never reachable                                                  | Hidden Unit 8 rename           | If any beta tester somehow reached it (force-navigated, dev override), their rows still LIKE 'rhythm*8*%' will get wiped by the broad rhythm DELETE — but those rows would also become orphaned by the rename anyway, so the wipe is the desired behavior. |
| A3  | Service worker cache bump from v7→v8 will propagate to all users within ~1 hour for web, ~1 day for iOS PWA             | Migration Ordering             | Some users may see stale UI longer; not a correctness issue, just a UX delay.                                                                                                                                                                              |
| A4  | XP rewards in the new 55-node structure can mirror today's per-nodeType values within the 10% variance threshold        | Standard Stack — XP totals     | Validator would warn, not fail; planner can rebalance after seeing the dump.                                                                                                                                                                               |
| A5  | The 12-concept scaffolding can be authored as JSON keys (not requiring runtime-generated content)                       | Locale-Key Pattern             | If a card needs computed content (e.g., "this beat lasts 1.5 quarter notes"), static i18n strings still work via interpolation.                                                                                                                            |
| A6  | `RhythmStaffDisplay` accepts a `timeSignature` prop and renders meter correctly for 3/4 and 6/8                         | Code Examples + Architecture   | If not, meter cards need a different visualization (e.g., a numeric time-signature SVG). Verified: `DiscoveryIntroQuestion.jsx` already passes `timeSignature={patternTimeSignature}` to it (line 314–316).                                                |
| A7  | The "29 active rhythm nodes" claim in SPEC.md and CLAUDE.md is wrong — actual is 43                                     | Current Rhythm Trail Inventory | If correct, no impact (count is informational); planner should update CLAUDE.md regardless.                                                                                                                                                                |
| A8  | Postgres `is_free_node()` is the only DB-side paywall enforcer for trail nodes (no other RLS policy hardcodes node IDs) | Paywall Sync                   | If other policies reference node IDs, they would also need updates. Verified: grep showed only `add_ear_training_free_nodes.sql` modifies `is_free_node()`; no other migration references rhythm node IDs in WHERE clauses.                                |

## Open Questions

1. **Should the new unit files drop the `Redesigned` suffix?**
   - What we know: D-09 preserves numeric pattern; CONTEXT.md says "Claude's discretion."
   - What's unclear: User aesthetic preference.
   - Recommendation: **Drop the suffix** for the 10 new files (`rhythmUnit1.js` through `rhythmUnit10.js`). Keep `rhythmUnit8Redesigned.js` for the hidden syncopation file since renaming it might cause merge friction in future re-enable phase. Document the convention in a one-line comment.

2. **Does `student_daily_goals` schema cache `node_id` requiring cleanup?**
   - What we know: `dailyGoalsService.js` generates goals like "practice_new_node" which would reference a node ID.
   - What's unclear: Whether the goal row stores the resolved node ID or generates it lazily on read.
   - Recommendation: Planner should grep `student_daily_goals` schema migration to confirm. If `node_id` column exists, add `DELETE FROM student_daily_goals WHERE node_id LIKE 'rhythm_%'` to the migration.

3. **Where should the new `RHYTHM_SYNCO` UNITS entry live (or should there be one at all)?**
   - What we know: Hidden Unit 8 is referenced by its file but the `UNITS.RHYTHM_8` map entry today is for it. After renaming, that map entry must reflect the new U8 = 3/4 Meter.
   - What's unclear: Whether to (a) add a new `RHYTHM_SYNCO` map entry for the renamed hidden unit so the re-enable path requires only uncommenting in `expandedNodes.js`, or (b) leave the hidden unit unmapped until re-enable.
   - Recommendation: **(a)** — add `RHYTHM_SYNCO` map entry. Cheap to author; mechanical re-enable.

4. **Should card body strings be plain-language English in a single JSON key, or split into title + body + caption?**
   - What we know: D-07 lists 4 cards × 2-4 cards × 12 concepts; total = roughly 50–100 keys per language.
   - What's unclear: How fine-grained the i18n splits should be.
   - Recommendation: split into `{title, body}` minimum; add `{caption}` if a single card needs both a body and a footer (e.g., "Tap to listen!"). Lock in plan via a single example concept (e.g. `q`) reviewed by user.

5. **The phase description says "10-unit / 55-node" but D-01 totals to 55 only if U10 is 1 node. Should U10 have any non-boss content to ease entry?**
   - What we know: D-11 says "single BOSS node only; no intro/practice/speed."
   - What's unclear: Is the user comfortable with a unit that's just a boss with no warm-up?
   - Recommendation: **Honor D-11 as-is.** The pedagogical principles (concept-per-unit) don't apply to "Review" because it's exactly mixing concepts. If the walkthrough flags the cliff, fix in a polish phase.

## Environment Availability

| Dependency   | Required By       | Available   | Version       | Fallback                      |
| ------------ | ----------------- | ----------- | ------------- | ----------------------------- |
| Node.js      | Validator + tests | ✓           | (per project) | —                             |
| Vitest       | Tests             | ✓           | 3.2.4         | —                             |
| Supabase CLI | Migration apply   | [ASSUMED ✓] | —             | Supabase MCP for remote-apply |
| `npm`        | Install + scripts | ✓           | —             | —                             |

**Missing dependencies with no fallback:** None known.

**Missing dependencies with fallback:** None.

## Validation Architecture

`workflow.nyquist_validation` is absent in `.planning/config.json` → treat as enabled. Section included.

### Test Framework

| Property           | Value                                       |
| ------------------ | ------------------------------------------- |
| Framework          | Vitest 3.2.4                                |
| Config file        | `vite.config.js` + `src/test/setupTests.js` |
| Quick run command  | `npx vitest run src/path/to/file.test.jsx`  |
| Full suite command | `npm run test:run`                          |
| Validator          | `npm run verify:trail`                      |

### Phase Requirements → Test Map

| Req ID        | Behavior                                                   | Test Type               | Automated Command                                                                                                                                                                    | File Exists?                                |
| ------------- | ---------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| REQ-01        | Quarter is first rhythm-content node                       | unit (validator)        | `npm run verify:trail`                                                                                                                                                               | ❌ Wave 0 — new rule in `validateTrail.mjs` |
| REQ-02        | Each rest in/adjacent to matching duration unit            | unit (validator)        | `npm run verify:trail`                                                                                                                                                               | ❌ Wave 0 — new rule                        |
| REQ-03        | Concept-per-unit                                           | unit (validator)        | `npm run verify:trail`                                                                                                                                                               | ❌ Wave 0 — new rule                        |
| REQ-04        | Scaffolding renders multi-card flow                        | integration (component) | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`                                                                               | ⚠ exists — extend                          |
| REQ-05a       | EN/HE locale parity for `game.discovery.cards.*`           | unit (parity test)      | `npx vitest run src/locales/__tests__/scaffolding-card-parity.test.js`                                                                                                               | ❌ Wave 0                                   |
| REQ-05b       | JS FREE_NODE_IDS matches expected Postgres set             | unit (parity test)      | `npx vitest run src/config/__tests__/freeNodes.parity.test.js`                                                                                                                       | ❌ Wave 0                                   |
| REQ-05c       | Existing validator rules continue passing                  | unit (validator)        | `npm run verify:trail`                                                                                                                                                               | ✅ exists                                   |
| REQ-05d       | All rhythm unit tests pass                                 | unit                    | `npm run test:run`                                                                                                                                                                   | ⚠ exists — replace per unit                |
| REQ-06        | Migration wipes rhythm rows, preserves XP                  | manual (test DB)        | run migration; `SELECT count(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'` returns 0; `SELECT SUM(total_xp) FROM students` unchanged | ❌ — manual UAT                             |
| REQ-07        | Engine changes traceable to principles                     | code review             | inline `// REQ-04` comments in `DiscoveryIntroQuestion.jsx` pagination code                                                                                                          | manual                                      |
| Acceptance #9 | Owner walkthrough — all 55 nodes complete without softlock | manual UAT              | —                                                                                                                                                                                    | manual                                      |

### Sampling Rate

- **Per task commit:** `npm run verify:trail && npx vitest run <changed-files>`
- **Per wave merge:** `npm run test:run && npm run verify:trail`
- **Phase gate:** Full suite green + migration applied to test DB + owner walkthrough complete before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/validateTrail.mjs` — add `validatePulseFirst`, `validateRestsWoven`, `validateConceptPerUnit` (+ concept-family map)
- [ ] `src/locales/__tests__/scaffolding-card-parity.test.js` — EN ↔ HE parity for `game.discovery.cards.*`
- [ ] `src/config/__tests__/freeNodes.parity.test.js` — JS Set ↔ documented Postgres whitelist
- [ ] `src/data/units/rhythmUnit{1..10}.test.js` (10 new files) — per-unit shape + ID + prereq tests
- [ ] `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` — add pagination test cases
- [ ] (optional) `scripts/__tests__/validateTrail.test.mjs` — unit-test the new validator rules against fixtures

## Security Domain

`security_enforcement` config not present — default behavior. Including a minimal section.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                        |
| --------------------- | ------- | --------------------------------------------------------------------------------------- |
| V2 Authentication     | No      | Supabase Auth unchanged                                                                 |
| V3 Session Management | No      | Unchanged                                                                               |
| V4 Access Control     | yes     | Postgres RLS on `student_skill_progress`; `is_free_node()` enforces paywall in policies |
| V5 Input Validation   | yes     | i18n strings pass through `<Trans>` — text-only, no HTML injection vector               |
| V6 Cryptography       | No      | Migration does not handle secrets                                                       |

### Known Threat Patterns

| Pattern                                                                | STRIDE                 | Standard Mitigation                                                                     |
| ---------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| Stale `FREE_NODE_IDS` allows unpaid access to paid content             | Elevation of Privilege | D-13's single migration updates JS + Postgres in lockstep; parity test catches drift    |
| Migration DELETE accidentally targets `students_score`                 | Tampering              | Explicit table name in WHERE; no `CASCADE`; review checklist                            |
| Cached SW serves old paywall config after deploy                       | Disclosure             | SW cache version bump forces re-fetch                                                   |
| Hebrew nikud character substitution corrupts existing Kodaly syllables | Tampering              | Reuse `getSyllable()`; do not author new diacritics per MEMORY.md feedback_hebrew_nikud |

## Sources

### Primary (HIGH confidence)

- **Codebase grep + read (verified 2026-06-01):**
  - `src/data/skillTrail.js` — UNITS map shape, SKILL_NODES export
  - `src/data/expandedNodes.js` — aggregator + HIDDEN-V1 marker
  - `src/data/constants.js`, `src/data/nodeTypes.js` — enum definitions
  - `src/data/units/rhythmUnit1Redesigned.js` — canonical rhythm node shape
  - `src/data/units/rhythmUnit4Redesigned.js`, `rhythmUnit5Redesigned.js`, `rhythmUnit8Redesigned.js` — additional unit references
  - `src/data/units/rhythmUnit7Redesigned.test.js`, `rhythmUnits.difficulty.test.js` — test patterns
  - `scripts/validateTrail.mjs` — all existing validator rules
  - `src/config/subscriptionConfig.js` — FREE_NODE_IDS state
  - `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` — scaffolding renderer (line-by-line)
  - `src/components/games/rhythm-games/MixedLessonGame.jsx` — navigation state contract (lines 80–199)
  - `src/components/games/rhythm-games/utils/durationInfo.js` — DURATION_INFO + getSyllable
  - `src/locales/en/trail.json`, `en/common.json`, `he/common.json` — locale key structure
  - `supabase/migrations/20260204000001_reset_trail_progress_v13.sql` — wipe pattern
  - `supabase/migrations/20260330000001_reset_rhythm_node_progress.sql` — surgical rhythm reset pattern
  - `supabase/migrations/20260329000001_add_ear_training_free_nodes.sql` — `is_free_node()` REPLACE pattern
  - `package.json` — dependency versions
  - `.planning/config.json` — workflow config
- **Spec & Context (locked):**
  - `.planning/phases/01-.../01-SPEC.md` — 7 requirements
  - `.planning/phases/01-.../01-CONTEXT.md` — 14 decisions D-01..D-14
  - `.planning/ROADMAP.md` — Phase 1 goal/success criteria
- **CLAUDE.md** — Gamification Trail System, Hidden Content sections
- **MEMORY.md** — Hebrew nikud constraint, worktree workflow

### Secondary (MEDIUM confidence)

- Cross-referenced patterns from prior phases via PROJECT.md references in CONTEXT.md

### Tertiary (LOW confidence)

- None — all claims grounded in current codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new deps; package.json verified
- Architecture: HIGH — existing patterns directly applied
- Pitfalls: MEDIUM — derived from current code shape; pitfalls 1–6 are predictions, not yet observed
- Migration: HIGH — two prior migrations provide proven pattern
- Locale: HIGH — file contents verified
- Validator: HIGH — full script read line-by-line

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (codebase moves fast; meter unit work or further validator rules may invalidate specific recommendations)
