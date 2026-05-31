# Phase 01: Refactor Rhythm Trail — Pedagogical Restructure - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Restructure the active rhythm trail (today: 29 nodes across 7 units, terminating at `boss_rhythm_7`) into a new pedagogical order driven by three falsifiable principles — **Pulse-first**, **Rests-woven**, **Concept-per-unit** — and introduce kid-friendly intro/scaffolding screens for every new rhythmic concept (12 total). Existing student rhythm progress is wiped on deploy; total XP is preserved.

This phase is rhythm-only. Treble, Bass, Ear Training trails are untouched. Hidden Unit 8 (syncopation) stays hidden and is renamed to free up numeric IDs for the new structure.

</domain>

<spec_lock>

## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `01-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `01-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**

- Reorder/regroup the active rhythm nodes across the rhythm units
- Add new intro/scaffolding nodes for each new rhythmic concept
- Introduce new node types (e.g., `SCAFFOLDING`) if existing types don't fit the explainer-UI requirement
- Update all rhythm unit data files (`src/data/units/rhythmUnit*Redesigned.js`)
- Update `src/data/expandedNodes.js` and `src/data/skillTrail.js` (`UNITS` map, exports)
- Update i18n locale keys: `src/locales/en/trail.json` and `src/locales/he/trail.json` (rhythm namespace, unit names/descriptions, node names/descriptions, explainer copy)
- Update `src/config/subscriptionConfig.js` (`FREE_NODE_IDS`) and Postgres `is_free_node()` (via Supabase migration)
- Update `scripts/validateTrail.mjs` — add lint rules enforcing principles 1–3
- Update rhythm unit tests (`src/data/units/rhythmUnit*Redesigned.test.js`) and any rhythm-dependent test files
- Modify rhythm game engine code (MetronomeTrainer, MixedLessonGame, ArcadeRhythmGame, PulseQuestion, DictationQuestion, etc.) _only_ when a principle requires it (e.g., explainer UI component)
- Supabase migration that wipes rhythm rows from `student_skill_progress`

**Out of scope (from SPEC.md):**

- Treble, Bass, and Ear-training trails
- Rhythm Unit 8 (syncopation, "Off-Beat Magic") re-enable — stays HIDDEN
- Trail map UI / visual layout (`TrailMap.jsx`, `TrailNode.jsx`, `TrailNodeModal.jsx`) — rendering stays as-is
- Migration _mapping_ logic for rhythm progress — clean wipe only
- Student leaderboards / `students_score.total_xp` — preserved untouched
- Daily-goals, streaks, XP-system code beyond rhythm-node-ID references
- Re-pedagogizing other category trails or the boss-node taxonomy

</spec_lock>

<decisions>
## Implementation Decisions

### Unit Map & Order

- **D-01:** **10-unit rhythm trail.** Replaces today's 7-unit structure. Order is locked:

  | Unit | ID range                       | Concept                | Node count | Notes                                                           |
  | ---- | ------------------------------ | ---------------------- | ---------- | --------------------------------------------------------------- |
  | U1   | `rhythm_1_*` + `boss_rhythm_1` | Quarter + Quarter Rest | 6          | Quarter is the FIRST rhythmic-content node (Pulse-first anchor) |
  | U2   | `rhythm_2_*` + `boss_rhythm_2` | Half + Half Rest       | 6          | Half framed as 2-quarter extension                              |
  | U3   | `rhythm_3_*` + `boss_rhythm_3` | Whole + Whole Rest     | 6          | Whole framed as 4-quarter extension                             |
  | U4   | `rhythm_4_*` + `boss_rhythm_4` | Eighths                | 6          | First subdivision                                               |
  | U5   | `rhythm_5_*` + `boss_rhythm_5` | Sixteenths             | 6          | Second subdivision                                              |
  | U6   | `rhythm_6_*` + `boss_rhythm_6` | Dotted Half            | 6          | Dotted family, strict concept-per-unit                          |
  | U7   | `rhythm_7_*` + `boss_rhythm_7` | Dotted Quarter         | 6          | Dotted family, second unit                                      |
  | U8   | `rhythm_8_*` + `boss_rhythm_8` | 3/4 Meter              | 6          | First meter unit                                                |
  | U9   | `rhythm_9_*` + `boss_rhythm_9` | 6/8 Meter              | 6          | Second meter unit (today's U7 content, repositioned)            |
  | U10  | `boss_rhythm_10` only          | Rhythm Review          | 1          | Cumulative all-rhythm BOSS — terminus of trail                  |

  **Total: 55 nodes** (vs today's 29). Trail terminus = `boss_rhythm_10` (cumulative BOSS).

- **D-02:** **6-node arc per content unit (U1–U9).**
  - **Duration units (U1, U2, U3):** Duration Intro → Practice → Rest Intro → Practice (combined) → Speed Round → Mini-Boss
  - **Non-duration units (U4–U9):** Intro → Practice → Discovery (mixed contrast) → Practice → Speed Round → Mini-Boss
  - **U10 Rhythm Review:** Single BOSS node only; no intro/practice/speed.

- **D-03:** **Rests folded into matching duration unit (not separated into adjacent rest-only units).** Quarter Rest lives inside U1, Half Rest inside U2, Whole Rest inside U3. Concept-per-unit interpretation: "duration + its matching rest = one concept family." Rests Unit 4 (today) is dissolved.

- **D-04:** **Strict separation for dotted notes (Concept-per-unit, strict reading).** Dotted Half (U6) and Dotted Quarter (U7) are separate units. Dotted family is NOT one concept family in this case — these have different beat-math implications and warrant separate scaffolding.

- **D-05:** **Subdivisions before meters before dotted does NOT apply — final order is durations → subdivisions → dotted → meters.** Pulse-first first; meters are most advanced.

### Scaffolding Mechanism & Content

- **D-06:** **Extend existing `discovery_intro` question type inside MIXED_LESSON.** No new SCAFFOLDING node type. The first question of every Discovery node's MIXED_LESSON exercise stays `{ type: "discovery_intro", focusDuration: ... }`. Renderer `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` is EXTENDED with multi-card pagination.
  - **Why this path:** existing renderer already handles acknowledge → audio → EN/HE → audio-context plumbing → landscape declaration. A new node type would force touching `NODE_TYPES`, `validateTrail.mjs` whitelist, `TrailNode.jsx` icon mapping, `TrailNodeModal.jsx` exercise routing, paywall config, AND double the trail node visual count (~12 extra nodes). Requirement 7's "bounded to pedagogical necessity" guard pushes us to extend rather than add.
  - **Boundary:** This decision is recorded so the planner does NOT add `NODE_TYPES.SCAFFOLDING`.

- **D-07:** **Multi-step swipable cards as scaffolding content format (Duolingo-style lesson intro).** 2–4 cards per concept. Card template:
  1. **Meet the new note/rest/meter** — hero visual (existing SVG glyphs from `src/assets/musicSymbols/`) + plain-language name
  2. **How it sounds** — audio demo (reuse existing `useAudioEngine` playback)
  3. **How it looks in music** — mini-staff preview (reuse existing `RhythmStaffDisplay`)
  4. **Try it** — transition card to first exercise question
  - Some concepts may use only 2 or 3 cards (e.g., rests don't need an audio demo if audio = silence).
  - Engine work: add pagination + per-card content schema to `DiscoveryIntroQuestion.jsx`.

- **D-08:** **12 dedicated scaffolding screens — one per new concept.** Each rest gets its OWN scaffolding screen (not piggybacked on its duration's intro):
  - Quarter, Quarter Rest, Half, Half Rest, Whole, Whole Rest
  - Eighths, Sixteenths
  - Dotted Half, Dotted Quarter
  - 3/4 Meter, 6/8 Meter
  - **Total EN+HE copy:** 12 concepts × 2–4 cards × 2 languages = ~50–100 new translation keys under `game.discovery.cards.<concept>.*` (exact key naming locked in planning).

### Node ID Convention

- **D-09:** **Numeric pattern `rhythm_<unit>_<order>` and `boss_rhythm_<unit>` preserved.** New units U1–U10 reuse this convention. Rationale: matches existing `FREE_NODE_IDS` Set entries, Postgres `is_free_node()` whitelist patterns, locale key namespaces, and tests with minimal churn.

- **D-10:** **Hidden Unit 8 syncopation renamed from `rhythm_8_*` / `boss_rhythm_8` to `rhythm_synco_*` / `boss_rhythm_synco`.** Reason: new U8 (3/4 Meter) needs the `rhythm_8_*` namespace. The hidden syncopation file (`src/data/units/rhythmUnit8Redesigned.js`), its test, `src/data/skillTrail.js` `RHYTHM_8` UNITS entry, and `src/locales/{en,he}/trail.json` rhythm*8*\* / boss_rhythm_8 keys all get renamed. The `HIDDEN-V1` marker comment in `src/data/expandedNodes.js` is preserved. Re-enable path remains intact.

### Final Boss Treatment

- **D-11:** **Standalone Unit 10 "Rhythm Review" with a single cumulative BOSS node** (`boss_rhythm_10`). Pulls patterns from all U1–U9 pattern tags via `patternTagMode: "any"` (D-06 pattern from prior phases). No intro/practice/speed nodes in U10 — boss-only. Restores the "beat the whole rhythm trail" celebration that today's `boss_rhythm_6` provides.

### FREE_NODE_IDS Sync

- **D-12:** **FREE_NODE_IDS strategy: first duration unit only (U1) is free.** Free rhythm nodes after restructure = all of U1 (6 IDs: `rhythm_1_1`, `rhythm_1_2`, `rhythm_1_3`, `rhythm_1_4`, `rhythm_1_5`, `boss_rhythm_1`). Today's count of 7 free rhythm nodes (Unit 1) is preserved structurally. Postgres `is_free_node()` must be updated in lockstep via the same Supabase migration that wipes progress.

### Migration & Progress Wipe

- **D-13:** **Single Supabase migration handles both** (a) the rhythm-progress wipe (`DELETE FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`) and (b) the `is_free_node()` whitelist update. Migration is deployed BEFORE the Netlify code deploy (so clients hitting the new data have a clean slate to write into). `students_score.total_xp` is NEVER touched.

### Validator Lint Rules

- **D-14:** **New `scripts/validateTrail.mjs` rules enforce principles 1–3 statically:**
  - **Pulse-first rule:** First rhythm-category node by `order` (excluding intro/scaffolding) introduces quarter. Verified by checking the first non-intro rhythm node has `focusDurations: ['q']`.
  - **Rests-woven rule:** For every rest-introducing node, the closest preceding non-intro rhythm node (by `order`) introduces the matching duration. Verified by walking `focusDurations` arrays.
  - **Concept-per-unit rule:** Within a single unit, the union of all `focusDurations` across nodes must form a single concept family. Concept families: `{q,qr}`, `{h,hr}`, `{w,wr}`, `{8_pair,8}`, `{16}`, `{hd}`, `{qd}`, plus meter units where `timeSignature` is the concept ID.

### Claude's Discretion

- **Scaffolding mechanism + content format** were deferred to me. I locked:
  - Extending `discovery_intro` (vs new node type) — see D-06
  - Multi-step swipable cards (vs single-card or interactive demo) — see D-07
- **Node ID convention** was deferred. I locked numeric `rhythm_<unit>_<order>` (D-09) + hidden-syncopation rename to `rhythm_synco_*` (D-10).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec & Roadmap

- `.planning/phases/01-refactor-rhythm-trail-pedagogical-ordering-restructure-units/01-SPEC.md` — Locked requirements, boundaries, constraints, acceptance criteria. MUST read before planning.
- `.planning/ROADMAP.md` — Phase 1 is the first phase of the next milestone (post v3.4).
- `.planning/PROJECT.md` §"Trail System Redesign", §"Rhythm Trail Rework" (v3.2, v3.3) — historical context for prior rhythm-trail restructures.

### Trail Data Layer (must update in lockstep)

- `src/data/skillTrail.js` — `UNITS` map, `SKILL_NODES` export, lookup functions (`getNodeById`, `getNodesByCategory`, etc.).
- `src/data/expandedNodes.js` — Aggregator for all unit files. Contains `HIDDEN-V1` marker block for hidden Unit 8 syncopation.
- `src/data/constants.js` — `NODE_CATEGORIES`, `EXERCISE_TYPES` enums.
- `src/data/nodeTypes.js` — `NODE_TYPES`, `RHYTHM_COMPLEXITY`, `NEW_CONTENT_TYPES` enums.
- `src/data/units/rhythmUnit1Redesigned.js` through `src/data/units/rhythmUnit7Redesigned.js` — current unit data (to be REPLACED with new U1–U10 files).
- `src/data/units/rhythmUnit8Redesigned.js` — hidden syncopation unit. RENAMED to use `rhythm_synco_*` IDs but file path may stay.
- `src/data/units/rhythmUnit7Redesigned.test.js`, `rhythmUnit8Redesigned.test.js`, `rhythmUnits.difficulty.test.js` — structural tests; will need updates or replacements per new unit files.

### Engine & Renderers (extend, don't replace)

- `src/components/games/rhythm-games/MixedLessonGame.jsx` — Interleaved-question engine; orchestrates `discovery_intro`, `rhythm_tap`, `visual_recognition`, `syllable_matching`, `rhythm_reading`, `rhythm_dictation`, `pulse`. Decision D-06 extends this stack with multi-card scaffolding inside `discovery_intro` (no new question type required if pagination lives inside the renderer).
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` — The scaffolding renderer. **Primary target of engine changes.** Extend with multi-card pagination per D-07.
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Pulse/rhythm tap; unchanged unless a principle requires.
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Speed-round renderer; unchanged unless a principle requires.
- `src/components/games/rhythm-games/RhythmReadingGame.jsx`, `RhythmDictationGame.jsx`, `SyllableMatchingGame.jsx`, `VisualRecognitionGame.jsx` — Question-type renderers; unchanged unless a principle requires.
- `src/components/games/rhythm-games/components/DurationCard.jsx` — `SVG_COMPONENTS` map used by `DiscoveryIntroQuestion`; extend if any new glyph is needed for a meter scaffolding card.
- `src/components/games/rhythm-games/utils/durationInfo.js` — `DURATION_INFO`, `getSyllable()`; verify it covers all 12 concept IDs.

### Locale Keys (Hebrew RTL parity is REQUIRED)

- `src/locales/en/trail.json` — Rhythm unit names, descriptions, node names, scaffolding card copy.
- `src/locales/he/trail.json` — Hebrew parity (Kodaly syllables use the user-confirmed nikud; do not change without asking — see `[[feedback_hebrew_nikud]]` user memory).
- `src/locales/en/common.json`, `src/locales/he/common.json` — `game.discovery.cards.<concept>.*` keys for scaffolding card content.

### Subscription Gate (defense in depth)

- `src/config/subscriptionConfig.js` — `FREE_NODE_IDS` Set. Must include exactly U1's six rhythm IDs (per D-12).
- Postgres `is_free_node()` function (in `supabase/migrations/`) — must whitelist the same six IDs. New migration writes both the wipe (D-13) and the `is_free_node()` body update atomically.
- `docs/SECURITY_GUIDELINES.md` — Defense-in-depth pattern (UI + DB). Already in CLAUDE.md.

### Validation Scripts

- `scripts/validateTrail.mjs` — Prebuild hook. Add lint rules per D-14. Tested via `npm run verify:trail`.

### CLAUDE.md

- `CLAUDE.md` §"Gamification Trail System" — Active node counts will need an update post-merge (29 active rhythm → 55 active rhythm; total 86 → 112; total when Unit 8 re-enabled changes too).
- `CLAUDE.md` §"Hidden Content: Rhythm Unit 8 (Syncopation)" — Update IDs to `rhythm_synco_*` per D-10.

### Background / Domain

- `docs/vexflow-notation/vexflow-guidelines.md` — VexFlow patterns if any new scaffolding card uses mini-staff rendering (D-07 card 3).
- `docs/DESIGN_SYSTEM.md` — Glassmorphism patterns for scaffolding card UI.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`DiscoveryIntroQuestion.jsx`**: Existing single-screen intro renderer. Handles acknowledge → audio playback → EN/HE i18n → audio-context lifecycle → landscape declaration → onComplete(1,1) reporting. **Extends to multi-card pagination per D-07 with no architectural change.**
- **`useAudioEngine` + `useAudioContext`**: Already wired into `DiscoveryIntroQuestion`. Multi-card playback reuses the same hooks.
- **`useDeclareNeedsLandscape(false)`**: Already declared in scaffolding renderer — multi-card UI must stay portrait-fit on phone.
- **`SVG_COMPONENTS` map (DurationCard.jsx)** + **`BeamedSixteenthsIcon`** + `src/assets/musicSymbols/` glyphs: All duration/rest glyphs already exist. Meter scaffolding (3/4, 6/8) may need a new glyph or use a numeric/time-signature visualization.
- **`RhythmStaffDisplay`** (rhythm-games/components): Used by `DiscoveryIntroQuestion` for the focus-pattern path. Reuse for "how it looks in music" card (D-07 card 3).
- **`patternTagMode: "any"` (D-06 from v3.3)**: Cumulative pattern resolution for boss nodes. U10 Rhythm Review boss uses this with all U1–U9 tags.
- **`useEnsureAudioReady` hook** (v3.3 PLAY-01 era): Standard prewarm sequence to avoid first-play audio trim. Use in scaffolding card 2 ("how it sounds").

### Established Patterns

- **One-unit-per-file under `src/data/units/`**: All rhythm content lives in `rhythmUnit{N}Redesigned.js`. New U1–U10 files follow same name pattern. The "Redesigned" suffix is now a misnomer (it was the v1.3 rename); planner may opt to drop the suffix on new files or keep for consistency — Claude's discretion.
- **`patternTags` system** (v3.2 PAT-01-06): Hand-crafted tagged patterns from `src/components/games/rhythm-games/RhythmPatternGenerator.js`. Each new concept may need 1–3 new tags (e.g., `eighth-rest` is NOT in scope per current spec wording; check existing tag inventory before authoring).
- **`patternTagMode: "any"` for cumulative bosses** (D-06 v3.3): OR-mode pattern resolution. U10 Rhythm Review boss uses this.
- **`UNITS` map + `RHYTHM_N` entries** (`src/data/skillTrail.js`): Backfilled when new units added (per v2.4 "RHYTHM_5/6 backfilled" decision in PROJECT.md). U8, U9, U10 entries needed; U1–U7 entries updated.
- **`FREE_NODE_IDS` JS Set ↔ Postgres `is_free_node()` sync** (v1.8 GATE pattern): Two-source sync; planner must update both in the same atomic deploy unit.
- **Validator prebuild hook**: `npm run verify:trail` runs as `prebuild`. Failures block production builds. New lint rules per D-14 must not regress existing assertions.
- **Clean-wipe progress reset** (v1.3 pattern): `student_skill_progress` rows targeted by `node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'`. `students_score.total_xp` untouched.

### Integration Points

- **Trail map UI is data-driven**: `TrailMap.jsx`, `TrailNode.jsx`, `TrailNodeModal.jsx`, `ZigzagTrailLayout.jsx`, `UnitProgressCard.jsx` consume `UNITS` + `SKILL_NODES` and `category` / `isBoss` flags. **No UI changes needed** if the new data follows existing shape contracts.
- **`expandedNodes.js` aggregator**: Imports all rhythm unit files and spreads into `EXPANDED_RHYTHM_NODES`. New U1–U10 files plug in here. Hidden U8 syncopation block (marked `HIDDEN-V1`) stays commented but uses renamed IDs.
- **i18n key resolution**: `t('trail:rhythm.unit_<N>.name')` and `t('trail:rhythm.unit_<N>.node_<M>.name')` patterns. New U8–U10 unit name keys + 55 new node keys + 12 scaffolding-content card-key blocks needed in both EN and HE.
- **MixedLessonGame `currentIndex` ref pattern (v3.3 CODE-01)**: Stale-closure guard. Scaffolding multi-card pagination must NOT regress this — pagination is INSIDE the discovery_intro question (one question = many cards), so `currentIndex` at the MixedLessonGame level still advances per question, not per card.

</code_context>

<specifics>
## Specific Ideas

- **Duolingo lesson-intro reference**: Spec Requirement 4 explicitly cites this. D-07's multi-card pattern is the structural match. Owner walkthrough is the acceptance gate per SPEC.md.
- **Hebrew nikud for Kodaly syllables**: User-confirmed diacritics in existing `trail.json` he locale. Do NOT change without asking — see user memory `feedback_hebrew_nikud.md`. New scaffolding card 1 ("meet the new note") reuses the existing syllable rendering (`getSyllable(duration, 'he')`).
- **6-node arc preserves the rhythm of today's units** (Intro → Practice → Discovery(mixed) → Practice → Speed → Mini-Boss). User explicitly chose the 6-node "Same 5-node pattern" option (label said 5 but listed 6; user's intent is the richer 6-node arc).
- **No eighth-rest, no sixteenth-rest, no dotted-rest scaffolding**: Today's trail doesn't include these. Spec scope is the existing rhythm content reordered + scaffolding added — not new rhythmic content. If the planner finds existing patterns rely on eighth-rests inside `quarter-eighth` tags, surface it; otherwise no new rest concepts.

</specifics>

<deferred>
## Deferred Ideas

- **Eighth-rest / Sixteenth-rest introduction nodes** — Could complete the rest-family symmetry (every duration has its rest scaffolding) but is content expansion, not restructure. Defer to a future content-expansion phase.
- **Re-enable hidden Unit 8 Syncopation (`rhythm_synco_*` after rename)** — Out of scope per SPEC.md. After this phase ships, a separate product decision triggers re-enable. The rename in D-10 makes the path mechanical.
- **Replacing `MetronomeTrainer.jsx` references to old unit IDs in user-facing copy** — Audit during planning; record any user-facing references to specific node names (e.g., level-up copy referencing "Quarter & Half Boss") so they update with the rename.
- **Interactive "tap-to-feel-the-beat" scaffolding card** — Rejected in favor of multi-card swipable in D-07. If owner walkthrough flags the scaffolding as "not engaging enough," revisit in a polish phase.

</deferred>

---

_Phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units_
_Context gathered: 2026-05-26_
