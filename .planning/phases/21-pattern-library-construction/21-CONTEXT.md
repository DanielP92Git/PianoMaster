# Phase 21: Pattern Library Construction - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Author ~120+ hand-crafted rhythm patterns as a new synchronous ES module at `src/data/patterns/rhythmPatterns.js`, tagged by duration set so Phase 22's resolver can serve pedagogically correct patterns to each trail node. Add build-time pattern validation to `scripts/validateTrail.mjs`. No existing source files are modified — this phase is pure addition.

</domain>

<decisions>
## Implementation Decisions

### Pattern data structure

- **D-01:** Each pattern is a plain JS object with fields: `id`, `description`, `beats`, `durationSet`, `tags`, `timeSignature`, `difficulty`, `measureCount`
- **D-02:** `beats` uses VexFlow duration strings in nested-by-measure format — always an array of arrays, even for 1-measure patterns: `[['q', 'q', 'q', 'q']]`
- **D-03:** Rests use VexFlow rest suffix convention: `'qr'` (quarter rest), `'hr'` (half rest), `'wr'` (whole rest)
- **D-04:** `durationSet` is an explicit array of unique VexFlow durations in the pattern (e.g. `['q', 'h']`) for build-time validation
- **D-05:** `difficulty` is a string enum: `'beginner'` | `'intermediate'` | `'advanced'` (matches existing `DIFFICULTY_LEVELS` in RhythmPatternGenerator.js)
- **D-06:** `measureCount` is an integer (1, 2, or 4) matching `beats.length`
- **D-07:** `timeSignature` is explicit per-pattern (e.g. `'4/4'`, `'3/4'`, `'6/8'`)
- **D-08:** Pattern IDs follow tag prefix + sequential convention: `'quarter_only_01'`, `'quarter_half_03'`, `'compound_basic_07'`
- **D-09:** All patterns start on beat 1 — no pickup measures (anacrusis) in this phase
- **D-10:** Tied notes: Claude's discretion based on what the unit files need

### Tagging taxonomy

- **D-11:** 15 tags total, using cumulative duration-set model (tags represent what a child knows at that stage). Multiple tags per pattern allowed for reuse across nodes.
- **D-12:** Cumulative duration tags (10): `quarter-only`, `quarter-half`, `quarter-half-whole`, `quarter-eighth`, `with-quarter-rest`, `with-half-rest`, `with-whole-rest`, `dotted-half`, `dotted-quarter`, `with-sixteenth`
- **D-13:** Special context tags (4): `compound-basic` (6/8 qd), `compound-mixed` (6/8 q+8), `syncopation-basic` (off-beat emphasis), `syncopation-dotted` (qd syncopation)
- **D-14:** 3/4 time signature tag (1): `three-four` — exclusive, not combined with cumulative tags
- **D-15:** Short descriptive tag names — `'quarter-eighth'` not `'quarter-half-whole-eighth'`. Names indicate what's NEW in the set.
- **D-16:** Difficulty is handled by the `difficulty` field, NOT encoded in tags
- **D-17:** Library exports a frozen `PATTERN_TAGS` array listing all 15 valid tag names for validator reference

### Content coverage

- **D-18:** 120+ unique patterns as floor (not ceiling) — write as many as make musical sense. If the total reaches 150-180, that's fine.
- **D-19:** Minimum 8 patterns per tag, weighted toward tags with more variety and more nodes using them (quarter-eighth: 12-15, quarter-only: 8)
- **D-20:** Every tag has patterns at all three difficulty levels (beginner, intermediate, advanced) — minimum 2 per difficulty per tag
- **D-21:** Every tag has patterns at all three measure lengths (1-bar, 2-bar, 4-bar) for Phase 23's UX-04 progressive measure length
- **D-22:** Distribution targets count unique patterns, not tag appearances (multi-tag reuse is expected)
- **D-23:** Pre-Unit 4 tags (quarter-only, quarter-half, quarter-half-whole, quarter-eighth) use sounded notes ONLY — no rests. Rests appear starting from `with-quarter-rest` tag.
- **D-24:** No pure-rest measures — every rest pattern includes at least one sounded note
- **D-25:** Boss/mini-boss nodes use regular patterns at advanced difficulty — no dedicated boss-specific patterns
- **D-26:** 3/4 tag patterns are exclusive to 3/4 time signature, not combined with cumulative 4/4 tags
- **D-27:** Patterns target the corrected node types from the Phase 20 audit (e.g. patterns suitable for RhythmReadingGame Discovery nodes, not legacy RHYTHM type)

### Authoring approach

- **D-28:** Claude authors all patterns following music theory principles: strong beat emphasis for beginners, gradual syncopation introduction, rhythmic variety over repetition
- **D-29:** Single file at `src/data/patterns/rhythmPatterns.js` — one import, one source of truth
- **D-30:** File includes helper lookup functions: `getPatternsByTag(tag)`, `getPatternById(id)`, `getPatternsByTagAndDifficulty(tag, difficulty)`
- **D-31:** File includes JSDoc section headers explaining pedagogical rationale for each tag group
- **D-32:** Build-time pattern validation added to `scripts/validateTrail.mjs` in this phase: unique IDs, durationSet matches beats, tags exist in PATTERN_TAGS, measureCount matches beats.length, each measure sums to time signature, minimum patterns per tag met
- **D-33:** Validation is build-time only (via `npm run build` prebuild hook) — no runtime assertions or Object.freeze

### Claude's Discretion

- Tied note inclusion (D-10) — based on what unit file configs actually need
- Quarter-only pattern variety — since this is the earliest stage (and CURR-05 pulse exercise covers Node 1), Claude should make quarter-only patterns engaging through tempo/length variation
- Exact pattern count per tag within the distribution guidelines
- Specific musical content of each pattern (rhythmic choices, beat placements)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Curriculum audit (Phase 20 output)

- `docs/curriculum-audit-v3.2.md` — Game-type policy (D-04 through D-11), one-concept rule, 8 unit node tables, remediation list. Patterns must cover all duration sets used by corrected nodes.

### Existing rhythm infrastructure

- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — Current generative pattern system with DURATION_CONSTANTS, TIME_SIGNATURES, DIFFICULTY_LEVELS. New patterns must use compatible VexFlow duration codes.
- `scripts/validateTrail.mjs` — Build-time trail validator. Phase 21 extends this with pattern validation checks.

### Rhythm trail data (8 unit files)

- `src/data/units/rhythmUnit1Redesigned.js` — Unit 1: quarter notes (q), half notes (h)
- `src/data/units/rhythmUnit2Redesigned.js` — Unit 2: whole notes (w)
- `src/data/units/rhythmUnit3Redesigned.js` — Unit 3: eighth notes (8)
- `src/data/units/rhythmUnit4Redesigned.js` — Unit 4: rests (qr, hr, wr)
- `src/data/units/rhythmUnit5Redesigned.js` — Unit 5: dotted notes (hd, qd), 3/4 time
- `src/data/units/rhythmUnit6Redesigned.js` — Unit 6: sixteenth notes (16)
- `src/data/units/rhythmUnit7Redesigned.js` — Unit 7: compound time (6/8)
- `src/data/units/rhythmUnit8Redesigned.js` — Unit 8: syncopation

### Requirements

- `.planning/REQUIREMENTS.md` §PAT-01, §PAT-02 — Pattern library requirements for this phase

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `RhythmPatternGenerator.js` exports `DURATION_CONSTANTS`, `TIME_SIGNATURES`, `DIFFICULTY_LEVELS` — new module should use compatible VexFlow duration codes but does NOT import from the generator (separate concerns)
- `scripts/validateTrail.mjs` — existing validation infrastructure to extend with pattern checks

### Established Patterns

- Unit files use consistent node structure: `rhythmConfig.durations`, `focusDurations`, `contextDurations`, `exercises[].config.rhythmPatterns`
- VexFlow duration codes used throughout: `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'qr'`, `'hr'`, `'wr'`, `'hd'`, `'qd'`
- `EXERCISE_TYPES` and `NODE_TYPES` enums in `src/data/constants.js` and `src/data/nodeTypes.js`

### Integration Points

- `src/data/patterns/rhythmPatterns.js` is a new file — no existing imports to update
- Phase 22 will wire this into node configs via `patternTags` / `patternIds` and update `RhythmPatternGenerator.js` to resolve from the library
- `validateTrail.mjs` prebuild hook already runs on `npm run build` — extending it means pattern validation is automatic

</code_context>

<specifics>
## Specific Ideas

- Quarter-only patterns may feel too easy/boring — CURR-05 (pulse exercise on Node 1) helps, but consider creative use of measure length and tempo variation for engagement
- Patterns should target corrected node types from audit (e.g. Discovery nodes will use RhythmReadingGame after Phase 22 fixes, not legacy RHYTHM type)
- User's custom Kodaly order: quarter → half → whole → eighth (not standard quarter → eighth → half → whole)

</specifics>

<deferred>
## Deferred Ideas

- **Pickup measures (anacrusis)** — A separate rhythm trail topic for a future milestone. After learning pickups, boss nodes could use pickup-starting patterns for challenge variety.
- **Adaptive difficulty system** (CURR-F02) — Future milestone. Current patterns use static difficulty levels.

</deferred>

---

_Phase: 21-pattern-library-construction_
_Context gathered: 2026-04-06_
