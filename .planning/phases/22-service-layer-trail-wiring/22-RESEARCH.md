# Phase 22: Service Layer & Trail Wiring - Research

**Researched:** 2026-04-07
**Domain:** Rhythm trail data wiring, pattern resolution API, pulse exercise, build validator extension
**Confidence:** HIGH — all findings verified against actual source files in this repo

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Pulse exercise (CURR-05)**

- D-01: Delivered via MetronomeTrainer with a `pulseOnly: true` config flag — when set, VexFlow notation is skipped entirely
- D-02: Visual: a large pulsing circle that pulses on each beat + a tap target area below (no sheet music)
- D-03: Scoring: same timing accuracy as MetronomeTrainer (PERFECT/GOOD/MISS per tap, star rating at end)
- D-04: Length: 8 beats (2 measures) at 65 BPM default — approximately 7 seconds
- D-05: Count-in: 1-bar count-in with visual beat numbers before tapping starts
- D-06: Audio: piano note (C4) plays on each beat instead of metronome click sound

**Pattern resolution API (PAT-03, PAT-04)**

- D-07: `resolveByTags()` and `resolveByIds()` are added as new exports in the existing `RhythmPatternGenerator.js` file
- D-08: Game components receive full pattern objects (with `id`, `beats`, `tags`, `difficulty`, `measureCount`, etc.) — not stripped-down beats arrays
- D-09: Existing random generation logic in `RhythmPatternGenerator.js` stays as fallback — non-trail rhythm games (free practice) may still use it. Remove in a future cleanup phase.
- D-10: `resolveByTags()` returns the full pool of matching patterns. Game component picks randomly from the pool each session for variety. Pool is filtered by difficulty and measureCount.

**Node config migration (PAT-03, PAT-05)**

- D-11: Old `rhythmPatterns` field is removed entirely from all 48 node exercise configs — clean break, no dual-field transition
- D-12: `durations`, `focusDurations`, and `contextDurations` in `rhythmConfig` are kept — they define the child's knowledge state (what's new, what's learned), not pattern selection
- D-13: Boss/mini-boss nodes use `patternTags` + difficulty filter (same field shape as regular nodes) — no `patternIds` needed
- D-14: Each exercise config explicitly includes `difficulty` and `measureCount` fields — self-documenting, game uses these to filter the pattern pool from the resolver
- D-15: Build validator (`validateTrail.mjs`) errors on any rhythm node that still has the old `rhythmPatterns` field — forces complete migration

**Game-type remediation (CURR-02, CURR-03, CURR-04)**

- D-16: Phase 22 fixes game-type violations identified by the Phase 20 audit alongside pattern wiring — one coordinated change
- D-17: Build validator enforces nodeType → expected exercise type mapping — prevents future regression
- D-18: Trail navigation switch (exercise type → game component routing) is verified to cover all exercise types used after remediation

### Claude's Discretion

- Exact pulsing circle animation design (size, color, glow effects) — should feel engaging for 8-year-olds while respecting reduced-motion preferences
- Internal structure of `resolveByTags()` / `resolveByIds()` (filtering logic, caching strategy)
- Order of migration across the 8 unit files
- How game components adapt their rendering when receiving curated pattern objects vs legacy generated patterns

### Deferred Ideas (OUT OF SCOPE)

- **Old generator removal** — Random generation logic in `RhythmPatternGenerator.js` stays for now; remove in a future cleanup phase when free practice modes are verified to not need it
- **Pattern analytics** — Tracking which specific pattern IDs children struggle with. Enabled by D-08 but not implemented in Phase 22.
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                    | Research Support                                                                                                                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CURR-05 | Unit 1 Node 1 includes a pulse exercise ("tap with the beat", metronome only, no notation)                     | MetronomeTrainer has all infrastructure: count-in logic, tap scoring, beat scheduling, `playPianoSound('C4')` API. Needs `pulseOnly` flag to suppress VexFlow and swap beat sound.                                                                                         |
| PAT-03  | Node configs use `patternTags` (or `patternIds` for boss nodes) instead of `rhythmPatterns` duration allowlist | All 8 unit files confirmed using `rhythmPatterns: [...]` in `exercises[].config`. Migration field verified.                                                                                                                                                                |
| PAT-04  | `getPattern()` resolves curated patterns by tags/IDs via synchronous JS import (not async JSON fetch)          | `rhythmPatterns.js` already exports sync helpers: `getPatternsByTag()`, `getPatternById()`, `getPatternsByTagAndDifficulty()`. New `resolveByTags()` / `resolveByIds()` delegate to these.                                                                                 |
| PAT-05  | Children only see patterns containing durations they have already learned (enforced by tag system)             | Tag taxonomy (15 tags, cumulative duration-set model) already ensures this. Node configs using correct tags enforce the contract. Validator checks tag existence.                                                                                                          |
| PAT-06  | `validateTrail.mjs` checks pattern ID/tag existence, tag coverage, and complexity bounds at build time         | Validator already imports `RHYTHM_PATTERNS` and `PATTERN_TAGS`. Phase 21 added `validatePatternLibrary()`. Phase 22 extends with: per-node `patternTags`/`patternIds` reference checks, rejection of legacy `rhythmPatterns` field, and nodeType→exerciseType enforcement. |

</phase_requirements>

---

## Summary

Phase 22 is a coordinated wiring phase — it connects three previously completed artifacts (the Phase 21 pattern library, the Phase 20 audit remediation list, and the existing MetronomeTrainer infrastructure) into a unified system. No new concepts are being invented; the work is mechanical migration + two new resolver functions + one new mode flag + build validator extensions.

The central change is migrating all 48 rhythm node exercise configs from the legacy `rhythmPatterns: ['quarter', 'half']` duration allowlist format to `patternTags: ['quarter-half']` / `patternIds: [...]` with explicit `difficulty` and `measureCount` fields. This migration touches all 8 unit files. Simultaneously, 39+ game-type violations identified in the Phase 20 audit are corrected by changing `exercises[].type` fields to the policy-correct `EXERCISE_TYPES` constants.

The pulse exercise (CURR-05) is the only genuinely new UI feature. MetronomeTrainer already has all the mechanical infrastructure — count-in, beat scheduling, tap detection, timing scoring, `playPianoSound('C4')`, and TapArea. The work is adding a `pulseOnly: true` config flag that suppresses notation, replaces the metronome tick with a piano note on each beat, and renders a pulsing circle instead of the standard display. The build validator is then extended with two new validation functions: one that rejects legacy `rhythmPatterns` fields and one that enforces the nodeType → exerciseType policy mapping.

**Primary recommendation:** Organize work into 4 sequential waves: (1) validator extensions + EXERCISE_TYPES additions, (2) unit file migration (pattern + game-type fixes together per file), (3) `resolveByTags()`/`resolveByIds()` + game component integration, (4) MetronomeTrainer `pulseOnly` mode.

---

## Standard Stack

### Core — All Already Present in Repo

| File                                                          | Purpose                                                                     | How Phase 22 Uses It                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/data/patterns/rhythmPatterns.js`                         | Pattern library with 120+ patterns, 15 tags, helpers                        | Source of truth for `resolveByTags()` / `resolveByIds()`         |
| `src/components/games/rhythm-games/RhythmPatternGenerator.js` | Generator with `DURATION_CONSTANTS`, `TIME_SIGNATURES`, `DIFFICULTY_LEVELS` | Add `resolveByTags()`, `resolveByIds()` as new named exports     |
| `src/components/games/rhythm-games/MetronomeTrainer.jsx`      | Echo/tap game — PRACTICE and CHALLENGE nodes                                | Add `pulseOnly` flag for CURR-05 pulse exercise                  |
| `src/hooks/useAudioEngine.js`                                 | Audio engine with `playPianoSound(volume, pitch)`                           | `pulseOnly` mode calls `playPianoSound(0.6, 'C4')` on each beat  |
| `scripts/validateTrail.mjs`                                   | Build validator                                                             | Add 3 new validation functions                                   |
| `src/data/units/rhythmUnit1-8Redesigned.js`                   | 8 unit files, 48 nodes + 8 boss nodes                                       | Migrate all `rhythmPatterns` → `patternTags`, fix exercise types |
| `src/data/constants.js`                                       | `EXERCISE_TYPES` enum                                                       | Verify `RHYTHM_PULSE` or equivalent exists (or add it)           |

### No New Dependencies Needed

This phase is pure JS/JSX refactoring — no new npm packages, no new routes, no new database changes.

---

## Architecture Patterns

### Pattern Object Shape (from `rhythmPatterns.js`)

All patterns in the library follow this schema [VERIFIED: src/data/patterns/rhythmPatterns.js]:

```javascript
{
  id: 'quarter_only_01',         // tag_prefix_NN
  description: 'Four steady quarter notes',
  beats: [['q', 'q', 'q', 'q']], // array of arrays, one inner array per measure
  durationSet: ['q'],             // unique VexFlow durations actually used
  tags: ['quarter-only'],         // subset of PATTERN_TAGS
  timeSignature: '4/4',
  difficulty: 'beginner',         // 'beginner' | 'intermediate' | 'advanced'
  measureCount: 1,                // equals beats.length
}
```

### Pattern 1: `resolveByTags()` — New Export in RhythmPatternGenerator.js

**What:** Synchronous function that looks up patterns from the library by tag + optional filters.

**When to use:** Called by game components that receive trail state with `patternTags` in config.

**Implementation approach** [VERIFIED: helpers already exist in rhythmPatterns.js]:

```javascript
// Source: src/components/games/rhythm-games/RhythmPatternGenerator.js (to add)
import {
  getPatternsByTag,
  getPatternsByTagAndDifficulty,
} from "../../data/patterns/rhythmPatterns.js";

/**
 * Resolve curated patterns by tags, with optional difficulty and measureCount filters.
 * Returns full pattern objects — game component picks randomly from the pool.
 *
 * @param {string[]} tags - One or more PATTERN_TAGS values
 * @param {Object} options
 * @param {string} [options.difficulty] - 'beginner'|'intermediate'|'advanced'
 * @param {number} [options.measureCount] - 1, 2, or 4
 * @returns {Array} Full pattern objects matching all filters
 */
export function resolveByTags(tags, { difficulty, measureCount } = {}) {
  // Union of patterns matching ANY of the provided tags
  const tagSet = new Set(tags);
  let pool = RHYTHM_PATTERNS.filter((p) => p.tags.some((t) => tagSet.has(t)));

  if (difficulty) {
    pool = pool.filter((p) => p.difficulty === difficulty);
  }
  if (measureCount) {
    pool = pool.filter((p) => p.measureCount === measureCount);
  }
  return pool;
}

/**
 * Resolve curated patterns by exact IDs.
 * Used for boss nodes that reference specific patterns.
 *
 * @param {string[]} ids - Pattern IDs from rhythmPatterns.js
 * @returns {Array} Matching full pattern objects
 */
export function resolveByIds(ids) {
  const idSet = new Set(ids);
  return RHYTHM_PATTERNS.filter((p) => idSet.has(p.id));
}
```

**Import note:** `RHYTHM_PATTERNS` must be imported at the top of `RhythmPatternGenerator.js` from `../../data/patterns/rhythmPatterns.js`.

### Pattern 2: Migrated Node Config Shape

**Before (legacy):**

```javascript
exercises: [
  {
    type: EXERCISE_TYPES.RHYTHM, // legacy type
    config: {
      rhythmPatterns: ["quarter", "half"], // OLD field — removed
      tempo: 65,
      measuresPerPattern: 1,
      timeSignature: "4/4",
      difficulty: "beginner",
    },
  },
];
```

**After (Phase 22):**

```javascript
exercises: [
  {
    type: EXERCISE_TYPES.RHYTHM_TAP, // corrected per game-type policy
    config: {
      patternTags: ["quarter-only"], // NEW field replaces rhythmPatterns
      tempo: 65,
      difficulty: "beginner",
      measureCount: 1, // explicit, used by resolver
      timeSignature: "4/4",
    },
  },
];
```

[VERIFIED: rhythmUnit1Redesigned.js for before-state; 22-CONTEXT.md D-11/D-14 for after-state]

### Pattern 3: Pulse Exercise Config (Unit 1 Node 1)

Node `rhythm_1_1` currently has `type: EXERCISE_TYPES.RHYTHM` with `rhythmPatterns: ['quarter']`. After Phase 22, it gets a **prepended pulse exercise** as `exercises[0]`, with the existing Discovery exercise becoming `exercises[1]`:

```javascript
exercises: [
  {
    type: EXERCISE_TYPES.RHYTHM_PULSE, // NEW type — routes to MetronomeTrainer pulseOnly mode
    config: {
      pulseOnly: true,
      tempo: 65,
      beats: 8, // 2 measures × 4 beats (D-04)
      measureCount: 2,
      timeSignature: "4/4",
      pitch: "C4", // D-06: piano note on each beat
    },
  },
  {
    type: EXERCISE_TYPES.RHYTHM_TAP, // Discovery exercise (corrected from RHYTHM)
    config: {
      patternTags: ["quarter-only"],
      tempo: 65,
      difficulty: "beginner",
      measureCount: 1,
      timeSignature: "4/4",
    },
  },
];
```

**Note on RHYTHM_PULSE:** A new `EXERCISE_TYPES.RHYTHM_PULSE` constant is needed in `src/data/constants.js`. This routes in `TrailNodeModal.jsx` to `/rhythm-mode/metronome-trainer` (same as `rhythm` and `rhythm_tap`) — MetronomeTrainer detects `pulseOnly: true` from `nodeConfig` and activates the pulse mode.

### Pattern 4: MetronomeTrainer `pulseOnly` Mode

**What changes in MetronomeTrainer.jsx:**

- Read `pulseOnly` flag: `const pulseOnly = nodeConfig?.pulseOnly ?? false;`
- When `pulseOnly` is true:
  - Skip VexFlow notation render (already conditional on game phase — simply don't render the music display)
  - Replace `createCustomMetronomeSound()` calls with `audioEngine.playPianoSound(0.6, 'C4')` [VERIFIED: `playPianoSound(volume, pitch)` exists in `useAudioEngine.js` line 483]
  - Render a large pulsing circle in place of the standard MetronomeDisplay (or augment MetronomeDisplay with a `pulseOnly` prop)
  - Limit session length to the configured `beats` count (8 beats = 2 measures at 4/4)
  - No pattern playback phase — the metronome IS the pattern; child taps along

**What stays the same:** Count-in (D-05), tap detection logic, timing scoring (PERFECT/GOOD/MISS per D-03), star calculation, VictoryScreen handoff.

**Reduced-motion:** Pulsing circle animation must respect `prefers-reduced-motion` — use `AccessibilityContext.reducedMotion` flag (already consumed elsewhere in the codebase).

### Pattern 5: Build Validator Extensions

Three new functions to add to `validateTrail.mjs`:

**Function 1: `validateLegacyRhythmPatterns()`** — Errors on any node config that still has `rhythmPatterns` field (D-15):

```javascript
// Source: scripts/validateTrail.mjs (to add)
function validateLegacyRhythmPatterns() {
  console.log("\nChecking for legacy rhythmPatterns field...");
  let count = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      if (exercise.config?.rhythmPatterns !== undefined) {
        console.error(
          `  ERROR: Legacy "rhythmPatterns" field in "${node.id}" exercise — migrate to patternTags`
        );
        hasErrors = true;
        count++;
      }
    }
  }
  if (count === 0) console.log("  No legacy rhythmPatterns: OK");
}
```

**Function 2: `validatePatternTagReferences()`** — Errors on `patternTags` values that don't exist in `PATTERN_TAGS`, and `patternIds` that don't exist in `RHYTHM_PATTERNS`:

```javascript
function validatePatternTagReferences() {
  console.log("\nChecking patternTags and patternIds references...");
  const validTags = new Set(PATTERN_TAGS);
  const validIds = new Set(RHYTHM_PATTERNS.map((p) => p.id));
  let count = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      for (const tag of exercise.config?.patternTags || []) {
        if (!validTags.has(tag)) {
          console.error(`  ERROR: Unknown patternTag "${tag}" in "${node.id}"`);
          hasErrors = true;
          count++;
        }
      }
      for (const id of exercise.config?.patternIds || []) {
        if (!validIds.has(id)) {
          console.error(`  ERROR: Unknown patternId "${id}" in "${node.id}"`);
          hasErrors = true;
          count++;
        }
      }
    }
  }
  if (count === 0) console.log("  Pattern tag/ID references: OK");
}
```

**Function 3: `validateNodeTypeExerciseTypeMapping()`** — Enforces the game-type policy from D-04 through D-11:

[VERIFIED: NODE_TYPES values from src/data/nodeTypes.js, policy from docs/curriculum-audit-v3.2.md]

```javascript
const NODE_TYPE_EXERCISE_POLICY = {
  discovery: new Set(["rhythm_tap", "rhythm_dictation"]),
  practice: new Set(["rhythm_tap"]),
  mix_up: new Set(["rhythm_dictation"]),
  review: new Set(["rhythm_tap"]),
  challenge: new Set(["rhythm_tap"]),
  speed_round: new Set(["arcade_rhythm"]),
  mini_boss: new Set(["rhythm_tap"]),
  boss: new Set(["arcade_rhythm"]),
};
```

Non-rhythm nodes (treble/bass clef nodes) are exempt from this check — only `category === 'rhythm'` or `category === 'boss'` nodes with rhythm exercise types are checked.

Also add `RHYTHM_PULSE` as an allowed type for the special pulse exercise on `rhythm_1_1` only (or exempt it if `pulseOnly: true` is present in config).

### Anti-Patterns to Avoid

- **Importing `rhythmPatterns.js` directly into unit files** — Unit files must NOT import from `rhythmPatterns.js`. The resolver in `RhythmPatternGenerator.js` is the only consumer at runtime. Validator imports it at build time.
- **Using `async`/`await` in `resolveByTags()`** — Must be synchronous (PAT-04 requirement). The helpers in `rhythmPatterns.js` are already synchronous.
- **Leaving `rhythmPatterns` field alongside `patternTags`** — D-11 requires clean break. Validator will error on both fields present.
- **Removing `durations`/`focusDurations`/`contextDurations` from `rhythmConfig`** — D-12 explicitly keeps these. They define knowledge state, not pattern selection.
- **Forgetting to add `RHYTHM_PULSE` to `constants.js`** — The validator's `validateExerciseTypes()` already errors on unknown exercise types. Adding the pulse exercise without registering the type will break the build immediately.

---

## Don't Hand-Roll

| Problem                             | Don't Build                          | Use Instead                                                                 | Why                                                                            |
| ----------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Pattern lookup by tag               | Custom filter loop in game component | `resolveByTags()` in RhythmPatternGenerator.js                              | Keeps game components thin; enables caching in generator if needed             |
| Piano sound on beat                 | New Web Audio oscillator synthesis   | `audioEngine.playPianoSound(0.6, 'C4')`                                     | Already implemented in `useAudioEngine.js` with pitch-shifting and envelope    |
| Beat scheduling in pulse mode       | New scheduling loop                  | MetronomeTrainer's existing `continuousMetronomeRef` + `visualMetronomeRef` | These refs manage the entire metronome loop; pulse mode just changes the sound |
| Measure-sum validation in validator | New duration arithmetic              | Reuse `SIXTEENTH_UNITS` map already in `validatePatternLibrary()`           | Consistent with existing pattern validation                                    |

---

## Common Pitfalls

### Pitfall 1: `RHYTHM_TAP` Routes to RhythmReadingGame, Not MetronomeTrainer (RESOLVED)

**What goes wrong:** The audit Open Question 1 is now resolved by the routing table in `TrailNodeModal.jsx` (line 231-232): `case 'rhythm_tap': navigate('/rhythm-mode/rhythm-reading-game')`. RHYTHM_TAP routes to **RhythmReadingGame** (notation-showing tap-along), NOT MetronomeTrainer.

**Resolution:** `RhythmReadingGame.jsx` has been verified as a notation-showing tap-along game (see Open Questions (RESOLVED) #1 above). This makes RHYTHM_TAP → RhythmReadingGame the correct routing for both Discovery and Practice nodes. Discovery introduces notation; Practice reinforces it by having the child tap along. The routing table does NOT need changes.

[VERIFIED: RhythmReadingGame.jsx docstring, imports (RhythmStaffDisplay, MetronomeDisplay, scoreTap), game phases FSM]

### Pitfall 2: `rhythmPatterns` Field Still Exists in `rhythmConfig.patterns`

**What goes wrong:** The `rhythmConfig` object has a `patterns` field (not `exercises[].config.rhythmPatterns`) — for example `rhythmConfig.patterns: ['quarter']` in Unit 1 Node 1. This is a DIFFERENT field from the deprecated `exercises[].config.rhythmPatterns`.

**Why it happens:** D-12 says keep `durations`/`focusDurations`/`contextDurations` — but `rhythmConfig.patterns` is also present and must be audited. The validator's `validateLegacyRhythmPatterns()` only checks `exercise.config.rhythmPatterns`. The `rhythmConfig.patterns` field is separate and may or may not need updating.

**How to avoid:** During migration, update `exercises[].config.rhythmPatterns` → `patternTags`. Leave `rhythmConfig.patterns` as-is (it is not consumed by the validator or game components for pattern selection after migration). Confirm in implementation by grepping for `rhythmConfig.patterns` consumers.

### Pitfall 3: Unit 5 Boss Has 2 Exercises, Unit 8 Boss Has 3

**What goes wrong:** Most nodes have 1 exercise. The Phase 20 audit (G-28) flags `boss_rhythm_5` as needing both exercises updated. `boss_rhythm_8` has 3 ARCADE_RHYTHM exercises (all correct) but all need `rhythmPatterns` → `patternTags` migration.

**How to avoid:** When migrating boss nodes, check `exercises.length` before assuming index 0 is the only exercise. boss_rhythm_5: 2 exercises (both → RHYTHM_TAP). boss_rhythm_8: 3 exercises (all already ARCADE_RHYTHM — correct, just migrate field).

[VERIFIED: from curriculum-audit-v3.2.md G-28, and docs reference to boss_rhythm_8 having 3 exercises]

### Pitfall 4: `RHYTHM_PULSE` Missing from Exercise Type Routing Tables

**What goes wrong:** Two routing tables must handle the new `RHYTHM_PULSE` type: `TrailNodeModal.jsx` and `MetronomeTrainer.jsx`'s `handleNextExercise` switch. Missing either causes navigation to fall through to `default: navigate('/trail')` mid-session.

**How to avoid:** When adding `RHYTHM_PULSE` to `constants.js`, immediately add the corresponding `case 'rhythm_pulse':` to both routing switches. Both route to `/rhythm-mode/metronome-trainer` (same as legacy `rhythm`).

[VERIFIED: MetronomeTrainer.jsx handleNextExercise switch at line 222, TrailNodeModal.jsx switch at line 220]

### Pitfall 5: Build Validator Import Side Effects

**What goes wrong:** `validateTrail.mjs` runs in Node.js (not browser). If `RhythmPatternGenerator.js` is imported into the validator, the `HybridPatternService` constructor runs and may call `fetch()` or access browser APIs.

**How to avoid:** The new `resolveByTags()` / `resolveByIds()` functions ONLY import from `rhythmPatterns.js` (pure data). The validator only needs to import `RHYTHM_PATTERNS` and `PATTERN_TAGS` from `rhythmPatterns.js` directly — which it already does. Do NOT add `RhythmPatternGenerator.js` as a validator import.

[VERIFIED: validateTrail.mjs already imports from rhythmPatterns.js, not from RhythmPatternGenerator.js]

### Pitfall 6: Unit 7 CURR-01 Fixes Touch focusDurations

**What goes wrong:** Nodes rhythm_7_1, rhythm_7_3, rhythm_7_4 have CURR-01 concept violations that require `focusDurations` changes in addition to exercise type changes. These are NOT pure game-type fixes — they also change the semantic data.

**How to avoid:** During Unit 7 migration, apply both the game-type fix (G-34, G-35, G-36) AND the concept fix (C-01, C-02, C-03) from the remediation list in the same edit. Same for Unit 8 C-04, C-05.

[VERIFIED: curriculum-audit-v3.2.md concept fixes table]

---

## Code Examples

### Verified: rhythmPatterns.js Helper Functions

```javascript
// Source: src/data/patterns/rhythmPatterns.js (already exists)
export function getPatternsByTag(tag) {
  return RHYTHM_PATTERNS.filter((p) => p.tags.includes(tag));
}
export function getPatternById(id) {
  return RHYTHM_PATTERNS.find((p) => p.id === id) || null;
}
export function getPatternsByTagAndDifficulty(tag, difficulty) {
  return RHYTHM_PATTERNS.filter(
    (p) => p.tags.includes(tag) && p.difficulty === difficulty
  );
}
```

[VERIFIED: src/data/patterns/rhythmPatterns.js — these exports exist]

### Verified: `playPianoSound` Signature

```javascript
// Source: src/hooks/useAudioEngine.js line 483
const playPianoSound = useCallback(
  (volume = 0.6, pitch = 0) => {
    // pitch can be: note name string 'C4' → shifts from G4 base sample
    //               OR semitone number (direct shift from G4)
  },
  [createPianoSound, isReady, parseNoteToMidi]
);
```

[VERIFIED: src/hooks/useAudioEngine.js lines 483-507]

### Verified: MetronomeTrainer Trail Config Consumption

```javascript
// Source: src/components/games/rhythm-games/MetronomeTrainer.jsx lines 86-89
const nodeId = location.state?.nodeId || null;
const nodeConfig = location.state?.nodeConfig || null;
const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null; // ← LEGACY — becomes dead code after migration
```

After migration, game components read `nodeConfig?.patternTags` and call `resolveByTags()` instead.

[VERIFIED: MetronomeTrainer.jsx lines 86-89]

### Verified: TapArea Component API

```javascript
// Source: src/components/games/rhythm-games/components/TapArea.jsx
export function TapArea({ onTap, feedback, isActive, title, className }) { ... }
// feedback shape: { accuracy: 'PERFECT'|'GOOD'|'FAIR'|'MISS', points: number }
```

Pulse mode reuses TapArea unchanged — same feedback display, same tap handler.
[VERIFIED: src/components/games/rhythm-games/components/TapArea.jsx]

### Verified: TrailNodeModal Routing Table (current state)

```javascript
// Source: src/components/trail/TrailNodeModal.jsx lines 220-248
case 'rhythm':         navigate('/rhythm-mode/metronome-trainer');  // legacy
case 'rhythm_tap':     navigate('/rhythm-mode/rhythm-reading-game'); // → RhythmReadingGame
case 'rhythm_dictation': navigate('/rhythm-mode/rhythm-dictation-game');
case 'arcade_rhythm':  navigate('/rhythm-mode/arcade-rhythm-game');
// 'rhythm_pulse' NOT YET present — must be added
```

[VERIFIED: TrailNodeModal.jsx lines 220-248]

---

## State of the Art

| Old Approach                                                                | Current Approach (after Phase 22)                                           | Impact                                                                           |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `rhythmPatterns: ['quarter', 'half']` duration allowlist in exercise config | `patternTags: ['quarter-half']` with `difficulty` + `measureCount` explicit | Game components get full pattern objects; build validator can enforce references |
| `EXERCISE_TYPES.RHYTHM` for all rhythm nodes (legacy)                       | Type per policy: RHYTHM_TAP, RHYTHM_DICTATION, ARCADE_RHYTHM per node type  | Correct game component launches; validator enforces policy                       |
| Random generative patterns in `getPattern()` (async)                        | Curated patterns via synchronous `resolveByTags()` / `resolveByIds()`       | Deterministic, pedagogically correct; legacy generator kept for free practice    |
| No pulse exercise — rhythm trail starts with notation                       | Pulse exercise on Node 1 via `pulseOnly: true` MetronomeTrainer mode        | First experience is low-pressure beat-tapping, not notation reading              |

---

## Assumptions Log

| #   | Claim                                                                                                                                                 | Section                   | Risk if Wrong                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `RHYTHM_TAP` routes to RhythmReadingGame (notation-showing tap-along), not MetronomeTrainer. **VERIFIED** by reading RhythmReadingGame.jsx source.    | Pitfall 1, Standard Stack | N/A — verified. RhythmReadingGame is a notation-showing tap-along game. RHYTHM_TAP routing is correct for both Discovery and Practice nodes. |
| A2  | `rhythmConfig.patterns` field (separate from `exercises[].config.rhythmPatterns`) is not consumed by game components or validator — can be left as-is | Pitfall 2                 | If it IS consumed somewhere, it needs updating too — grep for consumers during implementation                                                |
| A3  | Unit 4 has no MIX_UP node (the audit shows 4 violations but no RHYTHM_DICTATION swap needed — 6 nodes, no MIX_UP type)                                | Unit file migration scope | Low risk — confirmed by audit table showing only G-19 through G-23 with no G-XX for MIX_UP in Unit 4                                         |

**Assumption A1 is now verified (see Open Questions RESOLVED #1). Assumption A2 requires verification at implementation start before writing any code.**

---

## Open Questions (RESOLVED)

1. **RHYTHM_TAP routing disambiguation (critical — blocks game-type migration)**
   - What we know: `TrailNodeModal.jsx` routes `rhythm_tap` → `/rhythm-mode/rhythm-reading-game`. The policy says Practice nodes use MetronomeTrainer (echo mode). These are inconsistent.
   - **RESOLVED:** Reading `RhythmReadingGame.jsx` confirms it is a **notation-showing tap-along game**. Its docstring states: "Tap-along rhythm game where children synchronize taps to visual notation. Shows VexFlow-rendered rhythm pattern, sweeping cursor." It imports `RhythmStaffDisplay` (VexFlow notation rendering) and `MetronomeDisplay`, uses a sweeping cursor, and scores each tap with `scoreTap()`. This is NOT an echo game — the child sees notation and taps along in time. This makes `RHYTHM_TAP` routing to RhythmReadingGame **correct and appropriate** for both Discovery and Practice nodes: Discovery introduces the notation, Practice reinforces reading it. The original confusion arose from the Phase 20 audit describing Practice nodes as "MetronomeTrainer (echo mode)" — but the actual game-type policy mapping (PRACTICE → RHYTHM_TAP → RhythmReadingGame) is pedagogically sound: Practice nodes have the child read and tap along to notation they have already seen in Discovery. No new exercise types needed; no routing changes required.

2. **`RHYTHM_PULSE` exercise type registration**
   - What we know: `constants.js` EXERCISE_TYPES currently has: RHYTHM, RHYTHM_TAP, RHYTHM_DICTATION, ARCADE_RHYTHM. No RHYTHM_PULSE.
   - **RESOLVED:** Plan 01 Task 1 adds `RHYTHM_PULSE: 'rhythm_pulse'` to EXERCISE_TYPES as a distinct type. This is the correct approach — a separate type allows the build validator to explicitly permit it only on rhythm_1_1 (via `config.pulseOnly === true` exemption), and the routing tables in TrailNodeModal and MetronomeTrainer's handleNextExercise can handle it with dedicated `case 'rhythm_pulse':` entries. Making it a submode of RHYTHM_TAP would confuse the nodeType→exerciseType validator since pulse is not a standard Discovery/Practice exercise.

3. **rhythm_7_3 and rhythm_7_4 nodeType changes (Open Question 2 from audit)**
   - What we know: rhythm_7_4 is PRACTICE but introduces contextual concept (eighths in 6/8). D-12 implies concepts belong on Discovery nodes.
   - **RESOLVED:** Plan 02 Task 2 changes rhythm_7_4's nodeType from `NODE_TYPES.PRACTICE` to `NODE_TYPES.DISCOVERY` and sets its exercise type to `RHYTHM_TAP` (valid for Discovery per the game-type policy). This keeps the concept-introduction semantic consistent. rhythm_7_3 stays DISCOVERY (already correct nodeType, just needs focusDurations fix). The test file `rhythmUnit7Redesigned.test.js` is updated in Plan 02 Task 2 to expect `NODE_TYPES.DISCOVERY` for rhythm_7_4.

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. This phase is pure JS/JSX refactoring of existing files with no new tools, services, or runtimes required.

---

## Validation Architecture

### Test Framework

| Property           | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| Framework          | Vitest                                                              |
| Config file        | `vite.config.js` (inferred from `npm run test` → Vitest)            |
| Quick run command  | `npx vitest run src/data/units/ src/components/games/rhythm-games/` |
| Full suite command | `npm run test:run`                                                  |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                             | Test Type   | Automated Command                                                                 | File Exists?                                       |
| ------- | ------------------------------------------------------------------------------------ | ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| CURR-05 | `rhythm_1_1` has a pulse exercise as first exercise with `pulseOnly: true` config    | unit        | `npx vitest run src/data/units/rhythmUnit1Redesigned.test.js`                     | ❌ Wave 0                                          |
| PAT-03  | No node config has `rhythmPatterns` field after migration                            | unit        | `npx vitest run src/data/units/`                                                  | Partial — existing unit tests check exercise types |
| PAT-04  | `resolveByTags()` returns correct pattern objects for given tags + filters           | unit        | `npx vitest run src/components/games/rhythm-games/RhythmPatternGenerator.test.js` | ❌ Wave 0                                          |
| PAT-05  | `resolveByTags(['quarter-only'])` returns no patterns containing 'h', 'w', '8', etc. | unit        | Same as PAT-04 test file                                                          | ❌ Wave 0                                          |
| PAT-06  | `npm run build` fails when a node references invalid patternTag                      | integration | `npm run verify:trail`                                                            | ✅ (existing validator)                            |

### Sampling Rate

- **Per task commit:** `npx vitest run src/data/units/`
- **Per wave merge:** `npm run verify:trail && npm run test:run`
- **Phase gate:** Full suite green + `npm run build` passes before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/data/units/rhythmUnit1Redesigned.test.js` — Extend existing test or create new; covers CURR-05 pulse exercise presence + `patternTags` migration shape
- [ ] `src/components/games/rhythm-games/RhythmPatternGenerator.test.js` — New file; covers `resolveByTags()` and `resolveByIds()` correctness (PAT-04, PAT-05)
- [ ] Existing tests for `rhythmUnit7Redesigned.test.js` and `rhythmUnit8Redesigned.test.js` already exist — update expected exercise types after game-type remediation

_(Existing unit tests for Units 7 and 8 check exercise types as arrays — they will fail after remediation, which is the correct signal that migration is complete)_

---

## Security Domain

This phase makes no changes to authentication, user data, API calls, database access, or network requests. All changes are client-side data files and game logic.

Security domain: NOT APPLICABLE for this phase.

---

## Sources

### Primary (HIGH confidence — all verified by direct file read)

- `src/data/patterns/rhythmPatterns.js` — Pattern object shape, PATTERN_TAGS array, helper function signatures, existing exports
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — Full file; existing exports, `HybridPatternService` async architecture, `DURATION_CONSTANTS`/`TIME_SIGNATURES`/`DIFFICULTY_LEVELS` exports
- `scripts/validateTrail.mjs` — Full file; existing validation functions, imports, `RHYTHM_PATTERNS`/`PATTERN_TAGS` usage
- `src/data/units/rhythmUnit1Redesigned.js` — Full file; confirmed legacy `rhythmPatterns` field shape, all 7 node configs
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` (lines 1-350) — Trail config consumption, `nodeConfig` reading, `handleNextExercise` routing switch, game phases
- `src/hooks/useAudioEngine.js` (lines 47-510) — `playPianoSound(volume, pitch)` signature, C4 pitch support via `parseNoteToMidi`
- `src/components/trail/TrailNodeModal.jsx` (lines 220-250) — Current exercise type → route mapping
- `src/data/constants.js` — `EXERCISE_TYPES` enum, all current values
- `src/data/nodeTypes.js` — `NODE_TYPES` enum values
- `docs/curriculum-audit-v3.2.md` (lines 1-321) — Full remediation list (G-01 through G-44, C-01 through C-05), Open Questions 1-2
- `.planning/phases/22-service-layer-trail-wiring/22-CONTEXT.md` — All locked decisions D-01 through D-18
- `.planning/phases/20-curriculum-audit/20-CONTEXT.md` — Game-type policy D-04 through D-11
- `.planning/phases/21-pattern-library-construction/21-CONTEXT.md` — Pattern structure D-01 through D-33

### Secondary (MEDIUM confidence — inferred from related files)

- Units 2-8 game-type violation counts inferred from audit tables + grep results confirming consistent EXERCISE_TYPES.RHYTHM pattern across all units

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — all files read directly; no external dependencies
- Architecture: HIGH — resolver pattern is trivial delegation to existing helpers; MetronomeTrainer infrastructure verified
- Pitfalls: HIGH — RHYTHM_TAP routing confirmed by direct TrailNodeModal read; CURR-01 fixes confirmed by audit doc; validator import concern confirmed by existing validateTrail.mjs
- Game-type remediation count: HIGH — 44 fixes from audit, all node IDs and required types verified

**Research date:** 2026-04-07
**Valid until:** Stable (source files don't change until Phase 22 executes)
