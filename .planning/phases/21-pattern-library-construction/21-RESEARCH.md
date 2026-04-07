# Phase 21: Pattern Library Construction - Research

**Researched:** 2026-04-06
**Domain:** Music data authoring — synchronous ES module, VexFlow duration schema, build-time validation
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Pattern data structure**

- D-01: Each pattern is a plain JS object: `id`, `description`, `beats`, `durationSet`, `tags`, `timeSignature`, `difficulty`, `measureCount`
- D-02: `beats` is always an array of arrays (nested by measure): `[['q', 'q', 'q', 'q']]`
- D-03: Rests use VexFlow rest suffix: `'qr'`, `'hr'`, `'wr'`
- D-04: `durationSet` is an explicit array of unique VexFlow durations in the pattern (e.g. `['q', 'h']`)
- D-05: `difficulty` is string enum: `'beginner'` | `'intermediate'` | `'advanced'`
- D-06: `measureCount` is integer (1, 2, or 4) matching `beats.length`
- D-07: `timeSignature` is explicit per-pattern (e.g. `'4/4'`, `'3/4'`, `'6/8'`)
- D-08: Pattern IDs follow tag prefix + sequential: `'quarter_only_01'`, `'quarter_half_03'`
- D-09: All patterns start on beat 1 — no pickup measures
- D-10: Tied notes: Claude's discretion based on unit file needs

**Tagging taxonomy**

- D-11: 15 tags total, cumulative duration-set model; multiple tags per pattern allowed
- D-12: Cumulative duration tags (10): `quarter-only`, `quarter-half`, `quarter-half-whole`, `quarter-eighth`, `with-quarter-rest`, `with-half-rest`, `with-whole-rest`, `dotted-half`, `dotted-quarter`, `with-sixteenth`
- D-13: Special context tags (4): `compound-basic`, `compound-mixed`, `syncopation-basic`, `syncopation-dotted`
- D-14: 3/4 exclusive tag (1): `three-four`
- D-15: Short descriptive tag names indicating what's NEW in the set
- D-16: Difficulty handled by `difficulty` field, NOT encoded in tags
- D-17: File exports frozen `PATTERN_TAGS` array listing all 15 valid tag names

**Content coverage**

- D-18: 120+ unique patterns as floor (up to 150-180 is fine)
- D-19: Minimum 8 patterns per tag, more for high-variety/high-node-count tags (quarter-eighth: 12-15, quarter-only: 8)
- D-20: Every tag has all three difficulty levels (min 2 per difficulty per tag)
- D-21: Every tag has patterns at all three measure lengths (1-bar, 2-bar, 4-bar)
- D-22: Distribution counts unique patterns, not tag appearances
- D-23: Pre-Unit 4 tags (quarter-only, quarter-half, quarter-half-whole, quarter-eighth) use sounded notes ONLY — no rests
- D-24: No pure-rest measures — every rest pattern includes at least one sounded note
- D-25: Boss/mini-boss use regular patterns at advanced difficulty
- D-26: 3/4 tag exclusive to 3/4 time signature, not combined with cumulative 4/4 tags
- D-27: Patterns target corrected node types from Phase 20 audit

**Authoring approach**

- D-28: Claude authors all patterns following music theory principles
- D-29: Single file at `src/data/patterns/rhythmPatterns.js`
- D-30: File includes helper lookups: `getPatternsByTag(tag)`, `getPatternById(id)`, `getPatternsByTagAndDifficulty(tag, difficulty)`
- D-31: File includes JSDoc section headers explaining pedagogical rationale
- D-32: Build-time validation added to `scripts/validateTrail.mjs`
- D-33: Validation is build-time only — no runtime assertions or Object.freeze

### Claude's Discretion

- Tied note inclusion (D-10)
- Quarter-only pattern variety (engage through tempo/length variation)
- Exact pattern count per tag within distribution guidelines
- Specific musical content of each pattern

### Deferred Ideas (OUT OF SCOPE)

- Pickup measures (anacrusis) — future milestone
- Adaptive difficulty system (CURR-F02) — future milestone
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                              | Research Support                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| PAT-01 | Curated pattern library exists at `src/data/patterns/rhythmPatterns.js` with ~120+ hand-crafted patterns | File must be a pure synchronous ES module; `src/data/patterns/` directory does not yet exist — Wave 0 creates it    |
| PAT-02 | Each pattern is tagged by duration set (e.g. `quarter-only`, `quarter-half`, `quarter-eighth`)           | 15 tags confirmed from CONTEXT.md decisions D-11 through D-14; validator checks tag membership against PATTERN_TAGS |

</phase_requirements>

---

## Summary

Phase 21 is a pure data-authoring phase. No existing source files are modified. The deliverable is `src/data/patterns/rhythmPatterns.js` — a new synchronous ES module exporting 120+ hand-crafted rhythm patterns as plain JS objects, tagged by duration-set so Phase 22's resolver can serve pedagogically correct patterns to each of the 56 rhythm trail nodes.

The module structure is fully locked by CONTEXT.md decisions. VexFlow duration codes used throughout the existing unit files (`'q'`, `'h'`, `'w'`, `'8'`, `'16'`, `'qd'`, `'hd'`, `'qr'`, `'hr'`, `'wr'`) must be used verbatim in the `beats` arrays. The module must also export `PATTERN_TAGS` (frozen array) and three helper functions. Build-time validation in `scripts/validateTrail.mjs` must be extended to validate the pattern library.

The curriculum audit (Phase 20 output) reveals that the 8 unit files cover 6 pedagogical stages — quarter-only, quarter+half, quarter+half+whole, quarter+eighth (cumulative), then rests, dotted notes, sixteenth, compound (6/8), and syncopation — each requiring specific tag coverage. Tag `quarter-eighth` must receive the most patterns (12-15) because it maps to the most nodes and represents the first subdivision.

**Primary recommendation:** Author patterns unit-by-unit following the Kodaly order baked into the trail (q → h → w → 8 → rests → dotted → 16 → compound). For each tag, write beginner/intermediate/advanced patterns at 1-bar/2-bar/4-bar lengths first, then add variety. This ensures D-20 and D-21 are satisfied before the count check.

---

## Standard Stack

### Core

| Library                       | Version                | Purpose                                           | Why Standard                                                          |
| ----------------------------- | ---------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| VexFlow (duration codes only) | v5 (already installed) | `beats` arrays use VexFlow duration strings       | The rhythm games render via VexFlow; patterns must use the same codes |
| Vitest                        | v3 (already installed) | Test the helper functions and PATTERN_TAGS export | Already configured project-wide                                       |

No new npm packages are required for this phase. [VERIFIED: codebase grep — all duration codes come from VexFlow already in use]

### VexFlow Duration Code Reference

[VERIFIED: `src/components/games/rhythm-games/RhythmPatternGenerator.js` and all 8 unit files]

| VexFlow Code | Duration       | Beats in 4/4 | Notes                               |
| ------------ | -------------- | ------------ | ----------------------------------- |
| `'q'`        | Quarter        | 1            | Standard unit                       |
| `'h'`        | Half           | 2            |                                     |
| `'w'`        | Whole          | 4            |                                     |
| `'8'`        | Eighth         | 0.5          |                                     |
| `'16'`       | Sixteenth      | 0.25         |                                     |
| `'qd'`       | Dotted quarter | 1.5          | Must pair with `'8'` to sum to beat |
| `'hd'`       | Dotted half    | 3            | Must pair with `'q'` to sum to 4/4  |
| `'qr'`       | Quarter rest   | 1            |                                     |
| `'hr'`       | Half rest      | 2            |                                     |
| `'wr'`       | Whole rest     | 4            |                                     |

**Important gap:** Unit files use long-form duration names (`'quarter'`, `'half'`) in `rhythmPatterns` configs for the old generative system, but VexFlow codes (`'q'`, `'h'`) in `durations` and `durationSet` fields. The new pattern library's `beats` field uses VexFlow short codes — this matches D-02 which says "VexFlow duration strings."

---

## Architecture Patterns

### New Directory

```
src/
└── data/
    └── patterns/            # NEW — created in Wave 0
        └── rhythmPatterns.js
```

No subdirectories. Single file only per D-29.

### Pattern Object Shape (from CONTEXT.md D-01 through D-09)

```javascript
// Source: CONTEXT.md decisions D-01 through D-09 [VERIFIED]
{
  id: 'quarter_only_01',              // D-08: tag prefix + sequential
  description: 'Four steady quarter notes', // D-01
  beats: [['q', 'q', 'q', 'q']],     // D-02: array of arrays, always
  durationSet: ['q'],                 // D-04: unique durations present
  tags: ['quarter-only'],             // D-11: one or more from PATTERN_TAGS
  timeSignature: '4/4',              // D-07: explicit per-pattern
  difficulty: 'beginner',            // D-05: beginner | intermediate | advanced
  measureCount: 1                    // D-06: must equal beats.length
}
```

### Measure Sum Validation Logic

Each measure must sum to the time signature. [VERIFIED: `validateTrail.mjs` uses sixteenth-note units for checking, `RhythmPatternGenerator.js` defines `DURATION_CONSTANTS`]

| Time Signature | Total Sixteenth Units                   | VexFlow Code Value                                        |
| -------------- | --------------------------------------- | --------------------------------------------------------- |
| 4/4            | 16 sixteenth units                      | q=4, h=8, w=16, 8=2, 16=1, qd=6, hd=12, qr=4, hr=8, wr=16 |
| 3/4            | 12 sixteenth units                      | q=4 × 3; hd=12                                            |
| 6/8            | 12 sixteenth units (6 eighth positions) | qd=6 × 2; q=4+8=2(8-units)                                |

**4/4 valid single-measure combinations (examples):**

- `['q','q','q','q']` = 4+4+4+4 = 16 ✓
- `['h','h']` = 8+8 = 16 ✓
- `['h','q','q']` = 8+4+4 = 16 ✓
- `['w']` = 16 ✓
- `['q','8','8','q','q']` = 4+2+2+4+4 = 16 ✓
- `['qd','8','qd','8']` = 6+2+6+2 = 16 ✓
- `['hd','q']` = 12+4 = 16 ✓ (dotted-half tag patterns)
- `['q','qr','h']` = 4+4+8 = 16 ✓

**3/4 valid single-measure combinations:**

- `['q','q','q']` = 4+4+4 = 12 ✓
- `['hd']` = 12 ✓
- `['h','q']` = 8+4 = 12 ✓
- `['q','q','qr']` = 4+4+4 = 12 ✓

**6/8 valid single-measure combinations:**

- `['qd','qd']` = 6+6 = 12 ✓ (compound-basic: two big dotted-quarter beats)
- `['q','8','q','8']` = 4+2+4+2 = 12 ✓ (compound-mixed: quarter + eighth subdivision)
- `['8','8','8','8','8','8']` = 2×6 = 12 ✓ (all eighths)
- `['q','8','qd']` = 4+2+6 = 12 ✓

### File Module Structure

```javascript
// Source: CONTEXT.md decisions D-17, D-29, D-30, D-31 [VERIFIED]

// ============================================
// PATTERN TAGS (D-17: exported for validator)
// ============================================
export const PATTERN_TAGS = Object.freeze([
  'quarter-only', 'quarter-half', 'quarter-half-whole', 'quarter-eighth',
  'with-quarter-rest', 'with-half-rest', 'with-whole-rest',
  'dotted-half', 'dotted-quarter', 'with-sixteenth',
  'compound-basic', 'compound-mixed',
  'syncopation-basic', 'syncopation-dotted',
  'three-four'
]);

// ============================================
// TAG GROUP 1: QUARTER NOTES ONLY (D-12, D-23)
// quarter-only = q only, sounded notes, no rests
// ============================================
// [JSDoc with pedagogical rationale]
const quarterOnlyPatterns = [ ... ];

// ... (one section per tag group)

// ============================================
// COMPLETE LIBRARY
// ============================================
export const RHYTHM_PATTERNS = [
  ...quarterOnlyPatterns,
  // etc.
];

// ============================================
// HELPER FUNCTIONS (D-30)
// ============================================
export function getPatternsByTag(tag) {
  return RHYTHM_PATTERNS.filter(p => p.tags.includes(tag));
}

export function getPatternById(id) {
  return RHYTHM_PATTERNS.find(p => p.id === id) || null;
}

export function getPatternsByTagAndDifficulty(tag, difficulty) {
  return RHYTHM_PATTERNS.filter(p =>
    p.tags.includes(tag) && p.difficulty === difficulty
  );
}

export default RHYTHM_PATTERNS;
```

### Validator Extension Pattern

```javascript
// Source: scripts/validateTrail.mjs structure [VERIFIED]
// Add after existing validators in validateTrail.mjs

import {
  RHYTHM_PATTERNS,
  PATTERN_TAGS,
} from "../src/data/patterns/rhythmPatterns.js";

function validatePatternLibrary() {
  console.log("\nChecking pattern library...");
  // D-32 checks:
  // 1. Unique IDs
  // 2. durationSet matches beats (all durations in beats are in durationSet, no extras)
  // 3. tags subset of PATTERN_TAGS
  // 4. measureCount === beats.length
  // 5. each measure sums to timeSignature
  // 6. minimum patterns per tag (≥8)
  // 7. difficulty coverage per tag (≥2 per level)
  // 8. measure length coverage per tag (1-bar, 2-bar, 4-bar all present)
}
```

### Anti-Patterns to Avoid

- **Mixed beat/sixteenth counting in same array:** Don't mix VexFlow codes from different naming systems (e.g., no `'quarter'` string — use `'q'`)
- **Off-by-one measure sums:** `['hd', 'h']` = 12+8 = 20, not valid for 4/4. Must be `['hd', 'q']` = 16
- **Gaps in difficulty coverage:** Easiest mistake is writing all patterns at one difficulty, then discovering tag D-20 is violated
- **Rests before Unit 4 tags:** D-23 prohibits rests in `quarter-only`, `quarter-half`, `quarter-half-whole`, `quarter-eighth` tags
- **`three-four` tag combined with 4/4 patterns:** D-26 makes this tag exclusive to 3/4 time signatures
- **Missing 4-bar patterns:** 4-bar patterns are easiest to forget; D-21 requires all three lengths per tag

---

## Don't Hand-Roll

| Problem                     | Don't Build                | Use Instead                                                         | Why                                                                                                    |
| --------------------------- | -------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Measure sum validation      | Custom fraction arithmetic | Sixteenth-unit integer arithmetic (already in `DURATION_CONSTANTS`) | Floating-point errors; the codebase already defines whole=16, half=8, quarter=4, eighth=2, sixteenth=1 |
| Pattern uniqueness checking | Runtime dedup              | Build-time validator in `validateTrail.mjs`                         | D-33 requires build-time only; runtime assertions increase bundle weight                               |
| Tag constant sharing        | Duplicate the array        | Import `PATTERN_TAGS` from the module                               | Single source of truth; validator already imports from pattern file                                    |

---

## Tag Coverage Map

This section maps the 15 tags to their corresponding curriculum context, based on reading all 8 unit files. This is the authoritative guide for pattern authoring.

[VERIFIED: All 8 rhythmUnit*Redesigned.js files read in full]

### Cumulative 4/4 Tags

| Tag                  | VexFlow Durations  | Curriculum Stage  | Minimum Patterns | Primary Units          |
| -------------------- | ------------------ | ----------------- | ---------------- | ---------------------- |
| `quarter-only`       | `q`                | Unit 1, Nodes 1-2 | 8                | U1N1, U1N2             |
| `quarter-half`       | `q`, `h`           | Unit 1, Nodes 3-7 | 8                | U1N3-7, U2N7 (boss)    |
| `quarter-half-whole` | `q`, `h`, `w`      | Unit 2, all nodes | 8                | U2N1-7                 |
| `quarter-eighth`     | `q`, `h`, `w`, `8` | Unit 3, all nodes | 12-15            | U3N1-7, most mix nodes |
| `with-quarter-rest`  | + `qr`             | Unit 4, Nodes 1-2 | 8                | U4N1, U4N2             |
| `with-half-rest`     | + `hr`             | Unit 4, Nodes 3-4 | 8                | U4N3, U4N4             |
| `with-whole-rest`    | + `wr`             | Unit 4, Nodes 5-7 | 8                | U4N5-7                 |
| `dotted-half`        | + `hd`             | Unit 5, Nodes 1-2 | 8                | U5N1, U5N2             |
| `dotted-quarter`     | + `qd`             | Unit 5, Nodes 4-7 | 8                | U5N4-7, U8             |
| `with-sixteenth`     | + `16`             | Unit 6, all nodes | 8                | U6N1-7                 |

**Note on cumulative model:** `quarter-eighth` includes q, h, w, and 8 — it is cumulative, meaning a child who has learned through Unit 3 knows all four. The tag name indicates the newest element (`eighth`), not the exclusive content. Patterns for this tag may use any combination of q, h, w, 8 freely.

### Special Context Tags

| Tag                  | VexFlow Durations             | Context                                 | Minimum Patterns | Primary Units |
| -------------------- | ----------------------------- | --------------------------------------- | ---------------- | ------------- |
| `compound-basic`     | `qd` only                     | 6/8 time, pure dotted-quarter beats     | 8                | U7N1, U7N2    |
| `compound-mixed`     | `qd`, `q`, `8`                | 6/8 time, mixed subdivision             | 8                | U7N3-7        |
| `syncopation-basic`  | `8`, `q` in off-beat emphasis | 4/4 syncopation (eighth-quarter-eighth) | 8                | U8N1-4        |
| `syncopation-dotted` | `qd`, `8`, `q` in off-beat    | 4/4 dotted syncopation                  | 8                | U8N3-7        |

### 3/4 Exclusive Tag

| Tag          | VexFlow Durations         | Context       | Minimum Patterns | Primary Units                            |
| ------------ | ------------------------- | ------------- | ---------------- | ---------------------------------------- |
| `three-four` | `q`, `hd`, optionally `h` | 3/4 time only | 8                | U5N3 (and boss_rhythm_5 second exercise) |

---

## Common Pitfalls

### Pitfall 1: Dotted Note Pairing Error

**What goes wrong:** `hd` (dotted half = 12 sixteenth units) cannot fill a 4/4 measure alone. Must be paired with `q` (4 units) to sum to 16.
**Why it happens:** Dotted half "feels like 3 beats" so developers try `['hd']` thinking it fills three of four beats.
**How to avoid:** Always verify: 12 (hd) + 4 (q) = 16. Pattern must be `['hd', 'q']` not `['hd']`.
**Warning signs:** measureCount=1 with a pattern containing only `'hd'`

### Pitfall 2: `quarter-eighth` Tag Thinking It's Exclusive

**What goes wrong:** Writing `quarter-eighth` patterns with only q and 8, missing that the tag is cumulative — h and w are also allowed.
**Why it happens:** The tag name seems to imply "these two durations."
**How to avoid:** Per D-12 and D-15, tags are cumulative. `quarter-eighth` means "student knows q, h, w, and 8." All four can appear in these patterns.

### Pitfall 3: D-23 Violation (Rests in Early Tags)

**What goes wrong:** A `quarter-half` or `quarter-eighth` pattern containing `'qr'`.
**Why it happens:** Rest patterns feel natural for variety.
**How to avoid:** D-23 explicitly forbids rests in the four pre-Unit-4 tags. The `with-quarter-rest` tag is where rests begin.
**Warning signs:** Validator will flag this if the check is implemented.

### Pitfall 4: 6/8 Measure Sum Confusion

**What goes wrong:** 6/8 has 12 sixteenth-note units. `['qd', 'q', '8']` = 6+4+2 = 12 ✓ but `['qd', 'q', 'q']` = 6+4+4 = 14 ✗.
**Why it happens:** 6/8 has a non-obvious measure length.
**How to avoid:** Always check against 12 units. Use `qd`=6, `q`=4, `8`=2 in 6/8.

### Pitfall 5: ID Naming Convention Drift

**What goes wrong:** IDs like `'syncopation_01'` instead of `'syncopation_basic_01'`.
**Why it happens:** Tag names have hyphens but IDs use underscores, and tag names are long.
**How to avoid:** D-08 specifies tag prefix (with hyphens replaced by underscores) + sequential number. The prefix must match the primary tag: `syncopation_basic_01`, `compound_mixed_03`.

### Pitfall 6: Missing 4-Bar Patterns

**What goes wrong:** Meeting the minimum 8 patterns per tag but all at 1-bar and 2-bar lengths.
**Why it happens:** 4-bar patterns require 4 arrays inside `beats` and more planning.
**How to avoid:** Plan each tag in three passes: beginner (1+2+4 bar), intermediate (1+2+4 bar), advanced (1+2+4 bar). This guarantees D-20 and D-21 coverage simultaneously.

### Pitfall 7: Syncopation Tag Confusion

**What goes wrong:** `syncopation-basic` uses eighth-quarter-eighth grouping (the off-beat is ON the eighth subdivision); `syncopation-dotted` uses dotted-quarter-eighth (longer off-beat). These are different rhythmic feels.
**Why it happens:** Both involve eighth notes.
**How to avoid:**

- `syncopation-basic`: Pattern must have a note that starts on the "and" of a beat (e.g., `['8', 'q', '8', 'q', 'q']`)
- `syncopation-dotted`: Pattern uses `qd` followed by `8` as the syncopated cell (e.g., `['qd', '8', 'qd', '8']` or `['q', 'qd', '8', 'q']`)

---

## Minimum Pattern Count Table

Based on D-18 through D-22, here is the minimum distribution plan that satisfies all coverage constraints:

| Tag                  | Min Patterns | Difficulty × Length Grid (min 2 per cell) | Total Min |
| -------------------- | ------------ | ----------------------------------------- | --------- |
| `quarter-only`       | 8            | 3 diff × 3 lengths × 2+ = 18 total min    | 18        |
| `quarter-half`       | 8            | 3 diff × 3 lengths × 2+ = 18 total min    | 18        |
| `quarter-half-whole` | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `quarter-eighth`     | 12-15        | 3 diff × 3 lengths × 2+                   | 18+       |
| `with-quarter-rest`  | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `with-half-rest`     | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `with-whole-rest`    | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `dotted-half`        | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `dotted-quarter`     | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `with-sixteenth`     | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `compound-basic`     | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `compound-mixed`     | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `syncopation-basic`  | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `syncopation-dotted` | 8            | 3 diff × 3 lengths × 2+                   | 18        |
| `three-four`         | 8            | 3 diff × 3 lengths × 2+                   | 18        |

**Important note on multi-tag patterns:** A single pattern can carry two tags (e.g., a pattern tagged both `dotted-quarter` and `syncopation-dotted`). This means the total unique pattern count can be less than the sum of individual tag minimums. With smart multi-tagging, 120-135 unique patterns can satisfy all 15 tag minimums.

**Concrete minimum calculation:**

- If each tag needs ≥8 unique patterns and 15 tags exist: 15 × 8 = 120 (the exact floor from D-18)
- But tags 5-7 (rest tags) can reuse patterns across them via multi-tagging; same for syncopation tags
- Realistically: ~130-140 unique patterns with efficient multi-tagging satisfies all constraints

---

## Code Examples

### Valid Pattern Object — All Fields

```javascript
// Source: CONTEXT.md D-01 through D-09 [VERIFIED against unit file conventions]

// quarter-only, 1-bar, beginner
{
  id: 'quarter_only_01',
  description: 'Four steady quarter notes',
  beats: [['q', 'q', 'q', 'q']],
  durationSet: ['q'],
  tags: ['quarter-only'],
  timeSignature: '4/4',
  difficulty: 'beginner',
  measureCount: 1
}

// quarter-half, 2-bar, intermediate
{
  id: 'quarter_half_05',
  description: 'Alternating quarter and half note phrases',
  beats: [
    ['q', 'q', 'h'],
    ['h', 'q', 'q']
  ],
  durationSet: ['q', 'h'],
  tags: ['quarter-half'],
  timeSignature: '4/4',
  difficulty: 'intermediate',
  measureCount: 2
}

// dotted-quarter tag, 1-bar, intermediate, syncopated feel
{
  id: 'dotted_quarter_03',
  description: 'Dotted quarter-eighth-quarter pattern',
  beats: [['qd', '8', 'q']],  // 6+2+4+... wait — this sums to 12, not 16
  // WRONG! This only has 12 units in 4/4 (which needs 16)
  // Correct: ['qd', '8', 'q', 'q'] = 6+2+4+4 = 16
}

// CORRECT dotted-quarter, 1-bar
{
  id: 'dotted_quarter_03',
  description: 'Dotted quarter leading to quarter pair',
  beats: [['qd', '8', 'q', 'q']],  // 6+2+4+4 = 16 ✓
  durationSet: ['qd', '8', 'q'],
  tags: ['dotted-quarter'],
  timeSignature: '4/4',
  difficulty: 'intermediate',
  measureCount: 1
}

// compound-basic, 6/8, 2-bar, beginner
{
  id: 'compound_basic_02',
  description: 'Two big beats per bar',
  beats: [
    ['qd', 'qd'],   // 6+6 = 12 ✓
    ['qd', 'qd']
  ],
  durationSet: ['qd'],
  tags: ['compound-basic'],
  timeSignature: '6/8',
  difficulty: 'beginner',
  measureCount: 2
}

// three-four exclusive tag, 2-bar, beginner
{
  id: 'three_four_01',
  description: 'Three quarter notes in waltz time',
  beats: [
    ['q', 'q', 'q'],  // 4+4+4 = 12 ✓
    ['hd']            // 12 ✓
  ],
  durationSet: ['q', 'hd'],
  tags: ['three-four'],
  timeSignature: '3/4',
  difficulty: 'beginner',
  measureCount: 2
}
```

### Validator Extension Skeleton

```javascript
// Source: scripts/validateTrail.mjs pattern [VERIFIED]
// Add import at top of validateTrail.mjs:
// import { RHYTHM_PATTERNS, PATTERN_TAGS } from '../src/data/patterns/rhythmPatterns.js';

function validatePatternLibrary() {
  console.log("\nChecking pattern library...");

  const SIXTEENTH_UNITS = {
    q: 4,
    h: 8,
    w: 16,
    8: 2,
    16: 1,
    qd: 6,
    hd: 12,
    qr: 4,
    hr: 8,
    wr: 16,
  };
  const MEASURE_LENGTHS = { "4/4": 16, "3/4": 12, "6/8": 12 };
  const VALID_TAG_SET = new Set(PATTERN_TAGS);
  const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);
  const VALID_MEASURE_COUNTS = new Set([1, 2, 4]);

  let errors = 0;
  const seenIds = new Set();
  const tagStats = {};

  for (const pattern of RHYTHM_PATTERNS) {
    // 1. Unique IDs
    if (seenIds.has(pattern.id)) {
      console.error(`  ERROR: Duplicate pattern ID "${pattern.id}"`);
      errors++;
    }
    seenIds.add(pattern.id);

    // 2. Required fields present
    // 3. tags subset of PATTERN_TAGS
    for (const tag of pattern.tags) {
      if (!VALID_TAG_SET.has(tag)) {
        console.error(
          `  ERROR: Unknown tag "${tag}" in pattern "${pattern.id}"`
        );
        errors++;
      }
      // accumulate tag stats
      if (!tagStats[tag])
        tagStats[tag] = { total: 0, byDifficulty: {}, byMeasureCount: {} };
      tagStats[tag].total++;
      tagStats[tag].byDifficulty[pattern.difficulty] =
        (tagStats[tag].byDifficulty[pattern.difficulty] || 0) + 1;
      tagStats[tag].byMeasureCount[pattern.measureCount] =
        (tagStats[tag].byMeasureCount[pattern.measureCount] || 0) + 1;
    }

    // 4. measureCount === beats.length
    if (pattern.measureCount !== pattern.beats.length) {
      console.error(
        `  ERROR: measureCount ${pattern.measureCount} != beats.length ${pattern.beats.length} in "${pattern.id}"`
      );
      errors++;
    }

    // 5. Each measure sums to timeSignature
    const expectedLength = MEASURE_LENGTHS[pattern.timeSignature];
    for (let i = 0; i < pattern.beats.length; i++) {
      const sum = pattern.beats[i].reduce(
        (acc, dur) => acc + (SIXTEENTH_UNITS[dur] || 0),
        0
      );
      if (sum !== expectedLength) {
        console.error(
          `  ERROR: Measure ${i + 1} of "${pattern.id}" sums to ${sum}, expected ${expectedLength}`
        );
        errors++;
      }
    }

    // 6. durationSet matches beats (all codes in beats are in durationSet, no extras)
    const actualDurs = new Set(pattern.beats.flat());
    const claimedDurs = new Set(pattern.durationSet);
    for (const dur of actualDurs) {
      if (!claimedDurs.has(dur)) {
        console.error(
          `  ERROR: Duration "${dur}" in beats but not in durationSet for "${pattern.id}"`
        );
        errors++;
      }
    }
  }

  // 7. Minimum patterns per tag (≥8)
  for (const tag of PATTERN_TAGS) {
    const stats = tagStats[tag] || { total: 0 };
    if (stats.total < 8) {
      console.error(
        `  ERROR: Tag "${tag}" has only ${stats.total} patterns (minimum 8 required)`
      );
      errors++;
    }
    // 8. Difficulty coverage (≥2 per level)
    for (const diff of ["beginner", "intermediate", "advanced"]) {
      const count = stats.byDifficulty?.[diff] || 0;
      if (count < 2) {
        console.error(
          `  ERROR: Tag "${tag}" has ${count} "${diff}" patterns (minimum 2 required)`
        );
        errors++;
      }
    }
    // 9. Measure length coverage
    for (const len of [1, 2, 4]) {
      const count = stats.byMeasureCount?.[len] || 0;
      if (count < 1) {
        console.error(`  ERROR: Tag "${tag}" has no ${len}-bar patterns`);
        errors++;
      }
    }
  }

  if (errors === 0) {
    console.log(
      `  Pattern library: OK (${RHYTHM_PATTERNS.length} patterns, ${PATTERN_TAGS.length} tags)`
    );
  } else {
    console.error(`  Found ${errors} pattern library error(s)`);
    hasErrors = true;
  }
}
```

---

## State of the Art

| Old Approach                                     | Current Approach                                     | When Changed          | Impact                                                             |
| ------------------------------------------------ | ---------------------------------------------------- | --------------------- | ------------------------------------------------------------------ |
| `RhythmPatternGenerator.js` async JSON fetch     | Synchronous ES module import                         | Phase 21 (this phase) | No network latency; tree-shakeable; Vite bundles it at build time  |
| Beat patterns as binary arrays (`[1,0,1,0,...]`) | Named VexFlow duration arrays (`['q','8','q','qr']`) | Phase 21              | Human-readable; directly renderable by VexFlow without conversion  |
| Duration allowlist per node config               | Pattern tag system                                   | Phases 21-22          | Richer semantic tagging; Phase 22 resolver picks by tag+difficulty |

**Deprecated/outdated:**

- `rhythmPatterns: ['quarter', 'half']` config field in unit files — long-form names. Phase 22 will replace with `patternTags`. Phase 21 does NOT touch unit files.

---

## Environment Availability

Step 2.6: This phase is code/data authoring only. No external tools, databases, or services beyond Node.js + npm. Environment check is minimal.

| Dependency | Required By                              | Available | Version           | Fallback |
| ---------- | ---------------------------------------- | --------- | ----------------- | -------- |
| Node.js    | `scripts/validateTrail.mjs`              | ✓         | v22.15.0          | —        |
| Vitest     | Unit tests for helper functions          | ✓         | v3 (project-wide) | —        |
| VexFlow    | Duration code reference (no runtime dep) | ✓         | v5 (installed)    | —        |

No missing dependencies.

---

## Validation Architecture

### Test Framework

| Property           | Value                               |
| ------------------ | ----------------------------------- |
| Framework          | Vitest v3                           |
| Config file        | `vite.config.js` (project root)     |
| Quick run command  | `npx vitest run src/data/patterns/` |
| Full suite command | `npm run test:run`                  |

### Phase Requirements → Test Map

| Req ID    | Behavior                                        | Test Type | Automated Command                                         | File Exists?         |
| --------- | ----------------------------------------------- | --------- | --------------------------------------------------------- | -------------------- |
| PAT-01    | `RHYTHM_PATTERNS` array has ≥120 entries        | unit      | `npx vitest run src/data/patterns/rhythmPatterns.test.js` | ❌ Wave 0            |
| PAT-01    | All helper functions return correct results     | unit      | `npx vitest run src/data/patterns/rhythmPatterns.test.js` | ❌ Wave 0            |
| PAT-02    | Each pattern has ≥1 valid tag from PATTERN_TAGS | unit      | `npx vitest run src/data/patterns/rhythmPatterns.test.js` | ❌ Wave 0            |
| PAT-01/02 | Build validator passes with 0 errors            | build     | `npm run build` (prebuild runs validateTrail.mjs)         | ✅ (extend existing) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/data/patterns/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run build` passes (runs validateTrail.mjs which includes pattern checks)

### Wave 0 Gaps

- [ ] `src/data/patterns/rhythmPatterns.test.js` — covers PAT-01 (count, helpers) and PAT-02 (tags)
- [ ] `src/data/patterns/` directory — does not yet exist

_(Existing test infrastructure covers everything else — no additional conftest needed)_

---

## Security Domain

Step skipped — this phase is pure data authoring of a static ES module. No authentication, database, API, or user input involved. ASVS categories V2-V6 do not apply.

---

## Open Questions

1. **Tied note representation (D-10 — Claude's discretion)**
   - What we know: VexFlow supports tied notes; the CONTEXT.md defers this to Claude's discretion
   - What's unclear: Whether any unit node configs currently reference tied rhythms
   - Recommendation: Survey unit file configs for `tied` mentions before deciding. If no current node needs ties, omit from Phase 21. Ties can be added in Phase 22 when node configs are wired.

2. **`with-whole-rest` tag — is `'wr'` used alone in a measure?**
   - What we know: D-24 prohibits pure-rest measures; wr fills an entire 4/4 measure
   - What's unclear: How to create interesting patterns with whole rest if it takes the full measure
   - Recommendation: Use 2-bar and 4-bar patterns for this tag where wr appears in one measure and notes appear in adjacent measures. A single 1-bar pattern of just `['wr']` is explicitly forbidden by D-24 — so 1-bar whole-rest patterns must have a partial-rest measure design... except wr alone fills 4/4. Resolution: The 1-bar whole-rest patterns should be in 4/4 with a single whole-rest measure preceded/followed by note measures in 2-bar or 4-bar contexts. For the minimum 1-bar length coverage, consider using `['hr', 'q', 'q']` (half rest + two quarters, tagged `with-whole-rest` via multi-tag) but this doesn't actually include `wr`. This is a genuine design tension that Claude's implementation should resolve by: making the `with-whole-rest` 1-bar examples use `wr` only in multi-measure patterns (marking the whole-rest measure as `measureCount: 1` is not possible since D-21 asks for 1-bar patterns and wr alone is forbidden). **Resolution: 1-bar whole-rest coverage = 1-bar of quarter+half-rest combos tagged `with-whole-rest` multi-tagged alongside a 2-bar or 4-bar pattern containing `wr`. Alternatively, accept that the 1-bar minimum for `with-whole-rest` is satisfied by a pattern like `['q', 'hr', 'q']` which includes a half-rest but is a precursor pattern for the whole-rest stage.** Planner should confirm this interpretation.

---

## Assumptions Log

| #   | Claim                                                                                                                                | Section          | Risk if Wrong                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| A1  | VexFlow codes `'qd'` (dotted quarter) and `'hd'` (dotted half) are valid in the `beats` array without special renderer configuration | Standard Stack   | VexFlow render phase would fail; but evidence from unit files using `'qd'` and `'hd'` throughout makes this near-certain |
| A2  | The `three-four` tag requires ONLY 3/4 time signature patterns — no 4/4 pattern can carry this tag                                   | Tag Coverage Map | Phase 22 resolver could incorrectly serve 4/4 patterns to 3/4 nodes; D-26 states this explicitly                         |
| A3  | `with-whole-rest` 1-bar coverage can be satisfied by patterns that include `'hr'` combinations (since pure `['wr']` violates D-24)   | Open Questions   | Validator would reject insufficient 1-bar coverage for this tag                                                          |

**Unverified assumptions: 3 (A1 is LOW risk; A2 is VERIFIED by D-26; A3 needs design resolution)**

---

## Sources

### Primary (HIGH confidence)

- `src/data/units/rhythmUnit1-8Redesigned.js` (all 8 files read) — definitive VexFlow duration codes in use, unit structure, pedagogical stage of each node
- `.planning/phases/21-pattern-library-construction/21-CONTEXT.md` — all locked decisions
- `scripts/validateTrail.mjs` — validator structure and extension pattern
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — `DURATION_CONSTANTS` (sixteenth-unit values), `DIFFICULTY_LEVELS`, `TIME_SIGNATURES`
- `docs/curriculum-audit-v3.2.md` — game-type policy, CURR-01 violations, remediation list
- `.planning/REQUIREMENTS.md` — PAT-01, PAT-02 requirements

### Secondary (MEDIUM confidence)

- `src/data/nodeTypes.js` — NODE_TYPES enum confirming node type labels
- `.planning/config.json` — workflow configuration (nyquist_validation not set to false = enabled)

### Tertiary (LOW confidence)

- None for this phase.

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — all duration codes verified from existing codebase
- Architecture: HIGH — locked by CONTEXT.md decisions; file structure confirmed from validator and unit files
- Pitfalls: HIGH — derived from concrete measure-sum arithmetic and explicit D-23/D-24/D-26 rules
- Tag coverage: HIGH — all 8 unit files read; tag-to-node mapping directly observed

**Research date:** 2026-04-06
**Valid until:** 2026-06-01 (stable — depends only on locked decisions and existing codebase)
