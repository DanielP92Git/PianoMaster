# Phase 22: Service Layer & Trail Wiring - Research

**Researched:** 2026-04-12
**Domain:** Rhythm pattern resolution, trail node migration, pulse exercise, build validation
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Pulse Exercise (CURR-05)**

- D-01: New exercise type `PULSE` added to `EXERCISE_TYPES`. Not a mode of MetronomeTrainer — clean separation.
- D-02: Implemented as a `PulseQuestion` renderer inside MixedLessonGame (same architecture as VisualRecognitionQuestion, SyllableMatchingQuestion). No new route needed.
- D-03: UI: Large centered pulsing circle that scales/glows on each metronome beat. Glass card background. No staff lines, no notation, no VexFlow.
- D-04: Session: 4 bars (16 beats) at 65 BPM (~15 seconds). Score = percentage of beats tapped within timing threshold. Stars at 60/80/95%.
- D-05: Unit 1 Node 1's mixed_lesson sequence starts with pulse questions before visual_recognition/syllable_matching questions.

**Binary-to-Notation Rendering**

- D-06: Node's `rhythmConfig.durations` array controls VexFlow rendering. The renderer picks the longest matching duration for each onset gap.
- D-07: Ambiguity resolution: prefer sustain over rest. Default to longest sustaining note that fits the gap. Rests only when gap is shorter than minimum note duration or in explicit rest-only positions.
- D-08: Rendering logic lives inside RhythmPatternGenerator. `resolveByTags()` returns both the binary pattern AND the rendered VexFlow duration array in one call.

**RhythmPatternGenerator API**

- D-09: Module with exported functions (not a class). Matches existing codebase style.
- D-10: API: `resolveByTags(tags, durations, options?)` and `resolveByIds(ids, durations)`. Both return objects containing the binary pattern and rendered VexFlow durations.
- D-11: File location: `src/data/patterns/RhythmPatternGenerator.js` (co-located with rhythmPatterns.js).

**Node Config Migration**

- D-12: Question sequences authored via templates per nodeType, not per-node. Standard templates: Discovery (notation-weighted), Practice (balanced), MIX_UP (varied), REVIEW (spaced repetition), MINI_BOSS (longer 12-question covering all unit concepts).
- D-13: `rhythmConfig.patterns` replaced entirely by `rhythmConfig.patternTags`. Clean break — old `patterns` field deleted from all 56 nodes.
- D-14: Arcade nodes (CHALLENGE, SPEED_ROUND, BOSS) also use `patternTags` in rhythmConfig. Same API as mixed_lesson nodes.
- D-15: Exercise-level `rhythmPatterns` fields (e.g. `config.rhythmPatterns: ['quarter','half']`) also removed from all arcade_rhythm exercise configs.
- D-16: All 56 nodes updated per Phase 20 audit remediation column.

**Build Validator (PAT-06)**

- D-17: Three pattern checks added to `validateTrail.mjs`:
  1. Tag existence: Every `patternTag` in node configs exists in rhythmPatterns.js tag taxonomy
  2. Tag coverage: Every tag in the pattern library is used by at least one node (no orphan tags)
  3. Duration safety: For each node, every pattern resolved by its patternTags only needs durations from the node's `rhythmConfig.durations` to render
- D-18: Game-type policy enforcement at build time: validator checks that Discovery/Practice/MIX_UP/REVIEW/MINI_BOSS nodes use mixed_lesson and CHALLENGE/SPEED_ROUND/BOSS use arcade_rhythm.
- D-19: Pattern-node wiring checks integrated into `verify:trail` only.

### Claude's Discretion

- Exact question sequence templates per nodeType (how many of each question type)
- Discovery template weighting toward notation (rhythm_tap) questions vs visual/syllable
- MINI_BOSS session length and question type distribution
- Internal implementation of binary-to-VexFlow rendering algorithm
- How resolveByTags handles random selection when multiple patterns match
- Test structure and coverage approach
- Whether pulse questions appear in nodes beyond Unit 1 Node 1

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                            | Research Support                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CURR-05 | Unit 1 Node 1 includes a pulse exercise (tap with the beat, no notation)                               | PulseQuestion renderer architecture, MixedLessonGame renderer contract, PULSE constant in EXERCISE_TYPES, validator RENDERER_TYPES extension                                   |
| PAT-03  | Node configs use `patternTags` (or `patternIds`) instead of `rhythmPatterns` duration allowlist        | All 56 unit files surveyed; `patterns` field found in all nodes; migration path confirmed                                                                                      |
| PAT-04  | `getPattern()` resolves curated patterns by tags/IDs via synchronous JS import                         | New `RhythmPatternGenerator.js` at `src/data/patterns/` (separate from existing async one at `src/components/games/rhythm-games/RhythmPatternGenerator.js`); must be Node-safe |
| PAT-05  | Children only see patterns containing durations they have already learned                              | Tag taxonomy maps directly to duration vocabulary; `resolveByTags` filters by node `rhythmConfig.durations`; duration safety check in validator enforces this                  |
| PAT-06  | `validateTrail.mjs` checks pattern ID/tag existence, tag coverage, and complexity bounds at build time | Existing validator structure confirmed; three new check functions integrate at bottom of main execution                                                                        |

</phase_requirements>

---

## Summary

Phase 22 wires the Phase 21 pattern library (`src/data/patterns/rhythmPatterns.js`, 122 patterns) into all 56 rhythm nodes via a new `RhythmPatternGenerator.js` at `src/data/patterns/` (not to be confused with the existing async generator at `src/components/games/rhythm-games/RhythmPatternGenerator.js`). The work decomposes into five parallel tracks: (1) the new RhythmPatternGenerator module with `resolveByTags`/`resolveByIds` API, (2) the PulseQuestion renderer added to MixedLessonGame, (3) the 56-node unit file migration replacing `patterns` allowlists with `patternTags`, (4) updating game consumers (ArcadeRhythmGame, RhythmTapQuestion) to call the new API, and (5) extending `validateTrail.mjs` with four new checks.

The most technically novel piece is the binary-to-VexFlow rendering algorithm inside `resolveByTags`. A binary pattern like `[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]` must be interpreted differently for a `quarter-only` node (renders as `q qr q qr...` or `q h...`) vs a `quarter-half` node — the node's `rhythmConfig.durations` constrains which note values are legal. The algorithm greedily assigns the longest fitting note value to each onset gap (prefer sustain over rest per D-07).

The existing `MixedLessonGame` already supports pluggable renderers via a type switch. PulseQuestion follows the exact same contract as `RhythmTapQuestion` (stateful, manages its own sub-state machine, calls `onComplete` with a score). The validator already has a `RENDERER_TYPES` Set that must be extended to include `"pulse"`.

**Primary recommendation:** Build RhythmPatternGenerator.js first (data layer), then PulseQuestion (UI), then migrate all 56 unit files (data/config), then update game consumers, then extend the validator. The validator should be the last step so it catches errors in the migration.

---

## Standard Stack

### Core (all [VERIFIED: codebase grep])

| Library / File                                                | Version / Location | Purpose                                                                  | Why Standard                                       |
| ------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `src/data/patterns/rhythmPatterns.js`                         | Phase 21 output    | 122 curated binary patterns with tag taxonomy                            | The single source of truth for all rhythm patterns |
| `src/data/patterns/RhythmPatternGenerator.js`                 | NEW — to create    | Exports `resolveByTags`, `resolveByIds`                                  | Node-safe synchronous JS import (no async/fetch)   |
| `src/components/games/rhythm-games/RhythmPatternGenerator.js` | Existing (keep)    | Async hybrid generator used by ArcadeRhythm, MetronomeTrainer, RhythmTap | Consumed by game components via `getPattern()`     |
| `scripts/validateTrail.mjs`                                   | Existing           | Build-time ESM validator                                                 | Extends with 4 new check functions                 |
| `src/data/units/rhythmUnit1-8Redesigned.js`                   | All 8 files        | Node definitions — migration target                                      | All exercise types + patternTags go here           |
| `src/data/constants.js`                                       | Existing           | `EXERCISE_TYPES` enum                                                    | Add `PULSE: "pulse"`                               |

### Supporting

| File                                                                | Purpose               | When to Use                                         |
| ------------------------------------------------------------------- | --------------------- | --------------------------------------------------- |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`             | Renderer orchestrator | Add `pulse` case to question type switch            |
| `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` | Reference renderer    | Model PulseQuestion architecture on this            |
| `src/components/trail/TrailNodeModal.jsx`                           | Navigation switch     | Add `pulse` to `getExerciseTypeName` display name   |
| `src/data/nodeTypes.js`                                             | NODE_TYPES enum       | Read-only reference for game-type policy validation |

---

## Architecture Patterns

### The Two RhythmPatternGenerator Files

**Critical distinction** [VERIFIED: codebase grep]:

| File          | Location                                                      | Purpose                                                                    | Sync/Async |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- |
| OLD generator | `src/components/games/rhythm-games/RhythmPatternGenerator.js` | Async `getPattern()` using class HybridPatternService, JSON fetch          | async      |
| NEW generator | `src/data/patterns/RhythmPatternGenerator.js`                 | Synchronous `resolveByTags()` / `resolveByIds()` importing RHYTHM_PATTERNS | sync       |

The new generator at `src/data/patterns/` must be Node-safe (no React, no browser APIs, no VexFlow imports) because `validateTrail.mjs` imports it at build time. The comment at the top of `rhythmPatterns.js` already documents this constraint:

```javascript
// CRITICAL: This file must be Node-safe (no VexFlow, React, or browser imports).
// It is consumed by validateTrail.mjs at build time (Phase 22).
```

### Pattern 1: `resolveByTags(tags, durations, options?)` API Contract

**What:** Synchronously selects a matching pattern from RHYTHM_PATTERNS, then renders VexFlow durations from the binary array.

**Returns:**

```javascript
{
  patternId: string,            // e.g. "q_44_001"
  binary: number[],             // e.g. [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0]
  timeSignature: string,        // e.g. "4/4"
  vexDurations: string[],       // e.g. ["q", "q", "q", "q"]
  tags: string[],               // tags the pattern matched
}
```

**Selection algorithm:**

1. Filter `RHYTHM_PATTERNS` where `pattern.tags` contains ALL of the requested `tags`
2. Filter by `timeSignature` if needed (derived from node's `rhythmConfig.timeSignature`)
3. Pick randomly from matching patterns (seeded or unseeded per `options.seed`)
4. Run binary-to-VexFlow render with `durations` as the allowed vocabulary

**Example:**

```javascript
// Source: src/data/patterns/RhythmPatternGenerator.js (to create)
import { RHYTHM_PATTERNS } from "./rhythmPatterns.js";

export function resolveByTags(tags, durations, options = {}) {
  const matching = RHYTHM_PATTERNS.filter((p) =>
    tags.every((tag) => p.tags.includes(tag))
  );
  if (matching.length === 0) return null;
  const selected = matching[Math.floor(Math.random() * matching.length)];
  const vexDurations = binaryToVexDurations(
    selected.pattern,
    durations,
    selected.timeSignature
  );
  return {
    patternId: selected.id,
    binary: selected.pattern,
    timeSignature: selected.timeSignature,
    vexDurations,
    tags: selected.tags,
  };
}
```

### Pattern 2: Binary-to-VexFlow Rendering Algorithm

**What:** Converts a binary onset array to a VexFlow duration string array, constrained to a node's allowed duration set.

**Duration slot sizes (sixteenth-note units)** [VERIFIED: existing RhythmPatternGenerator.js]:

```
w=16  h=8  q=4  8=2  16=1  hd=12  qd=6  qr=4  hr=8  wr=16
```

**Algorithm (greedy, prefer-sustain per D-07):**

```
For each onset position i where binary[i] === 1:
  gap = distance to next onset (or end of measure)
  candidates = durations that fit within gap AND are in node.rhythmConfig.durations
  pick = longest candidate (prefer sustain over rest)
  if no sustaining note fits: use rest for the gap
  advance position by pick.slots
```

**Example for `[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0]` with durations `["q","h"]`:**

- Position 0, gap=8: longest q/h that fits is `h` (8 slots) → "h"
- Position 8, gap=8: longest q/h that fits is `h` (8 slots) → "h"
- Result: `["h", "h"]` ✓

**Example with durations `["q"]` only:**

- Position 0, gap=8: only `q` (4 slots) fits → "q", then gap remaining=4, no onset → "qr"
- Position 8: "q", "qr"
- Result: `["q", "qr", "q", "qr"]` ✓

### Pattern 3: PulseQuestion Renderer Contract

**Contract (identical to existing renderers):**

```javascript
// Stateful component — manages listen/tap sub-state (like RhythmTapQuestion)
export default function PulseQuestion({
  question,       // { type: "pulse", rhythmConfig: { tempo, timeSignature } }
  isLandscape,
  onComplete,     // (score: 0-1, maxScore: 1) => void
  disabled,
})
```

**Internal state machine:**

```
WAITING → PLAYING (metronome beats) → USER_TAPPING → EVALUATING → DONE
```

**Scoring:** taps within timing threshold / total expected beats → fractional score 0-1.

**Stars:** 0.6 = 1 star, 0.8 = 2 stars, 0.95 = 3 stars (per D-04).

### Pattern 4: MixedLessonGame Renderer Registration

The game's `startGame` function has a type switch. Add `pulse` case [VERIFIED: MixedLessonGame.jsx line 144-156]:

```javascript
if (entry.type === "pulse") {
  return { type: "pulse", rhythmConfig: buildRhythmTapConfig() };
}
```

The render section has a type switch for the current question — add:

```javascript
case "pulse":
  return <PulseQuestion ... onComplete={handleRhythmComplete} />;
```

### Pattern 5: Unit 1 Node 1 Pulse Sequence

Per D-05, Node 1's questions array starts with pulse before moving to visual/syllable:

```javascript
questions: [
  { type: "pulse" },
  { type: "pulse" },
  { type: "rhythm_tap" },
  { type: "visual_recognition" },
  { type: "syllable_matching" },
  { type: "rhythm_tap" },
  { type: "visual_recognition" },
  { type: "syllable_matching" },
];
```

### Pattern 6: Node Config Migration Shape

**Before (current in unit files):**

```javascript
rhythmConfig: {
  durations: ['q', 'h'],
  patterns: ['quarter', 'half'],   // OLD: duration allowlist for async generator
  ...
},
exercises: [{
  type: EXERCISE_TYPES.RHYTHM,
  config: {
    rhythmPatterns: ['quarter', 'half'],  // OLD: exercise-level allowlist
    tempo: 70, measuresPerPattern: 2, ...
  }
}]
```

**After (Phase 22 target):**

```javascript
rhythmConfig: {
  durations: ['q', 'h'],
  patternTags: ['quarter-half'],   // NEW: tag-based resolution
  // patterns field DELETED
  ...
},
exercises: [{
  type: EXERCISE_TYPES.MIXED_LESSON,
  config: {
    questions: [
      { type: 'rhythm_tap' },
      { type: 'visual_recognition' },
      // ... per nodeType template
    ]
    // rhythmPatterns field DELETED
  }
}]
```

### Pattern 7: Build Validator Extension

`validateTrail.mjs` currently ends with a fixed sequence of function calls [VERIFIED: validateTrail.mjs lines 452-460]. Three new functions append before the main execution block:

```javascript
// Import at top — must be static import for ESM
import { RHYTHM_PATTERNS } from "../src/data/patterns/rhythmPatterns.js";
import { resolveByTags } from "../src/data/patterns/RhythmPatternGenerator.js";
```

Three new check functions:

**Check 1: Tag existence** — for every rhythm node, every tag in `rhythmConfig.patternTags` must exist in the set of all tags present across `RHYTHM_PATTERNS`.

**Check 2: Tag coverage** — every tag that appears in any pattern in `RHYTHM_PATTERNS` must be referenced by at least one node. No orphan tags.

**Check 3: Duration safety** — for each rhythm node, for each `patternTag`, call `resolveByTags([tag], node.rhythmConfig.durations)` and verify it returns a non-null result. A null result means no pattern with that tag can render with the node's duration set — a configuration error.

**Check 4 (D-18): Game-type policy** — for each rhythm node, verify nodeType matches its exercise type per the policy table:

```
DISCOVERY/PRACTICE/MIX_UP/REVIEW/MINI_BOSS → mixed_lesson
CHALLENGE/SPEED_ROUND/BOSS → arcade_rhythm
```

### Anti-Patterns to Avoid

- **Importing new RhythmPatternGenerator in game components:** Game components (ArcadeRhythmGame, RhythmTapQuestion) still call the OLD `getPattern()` from `src/components/games/rhythm-games/RhythmPatternGenerator.js`. The new synchronous generator lives at `src/data/patterns/` and is for the trail validator and potentially future preloading. Don't mix them.
- **Making RhythmPatternGenerator.js async:** The validator runs at Node.js build time. Using `async/await` or dynamic imports in `src/data/patterns/RhythmPatternGenerator.js` will break the build validator.
- **Leaving `patterns` field in rhythmConfig:** The old `patterns: ['quarter', 'half']` fields in rhythmConfig are consumed by `buildRhythmTapConfig()` in MixedLessonGame (line 130). After migration, this must fall through gracefully. Check that `buildRhythmTapConfig` is updated to use `patternTags` instead, or that the fallback is harmless.
- **Forgetting to extend `RENDERER_TYPES` in validateTrail.mjs:** Currently `const RENDERER_TYPES = new Set(['visual_recognition', 'syllable_matching', 'rhythm_tap'])` (line 391). Must add `'pulse'` or the validator will reject Node 1's question sequence.
- **Forgetting `pulse` case in `getExerciseTypeName` (TrailNodeModal):** Not a breaking error but will show raw type string in UI.

---

## Don't Hand-Roll

| Problem                         | Don't Build                 | Use Instead                                       | Why                                                           |
| ------------------------------- | --------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| Random pattern selection        | Custom random with dedup    | `Math.random()` over filtered array               | Pattern library has 122 entries; simple random suffices       |
| Binary-to-VexFlow (whole notes) | Custom whole-note detection | Greedy longest-fit algorithm                      | `w=16` is just the largest slot in the table                  |
| Metronome in PulseQuestion      | New audio scheduler         | `useAudioEngine` hook (same as RhythmTapQuestion) | Already handles iOS/Web Audio API, count-in, beat scheduling  |
| Pulse animation timing          | `setInterval`               | CSS `animation` keyed to beat duration            | CSS animation is more reliable than JS timers for visual sync |

**Key insight:** The binary-to-VexFlow algorithm looks novel but reduces to a greedy interval cover problem with a fixed set of slot sizes. Do not over-engineer it.

---

## Common Pitfalls

### Pitfall 1: Circular Import Between Data and Components

**What goes wrong:** `src/data/patterns/RhythmPatternGenerator.js` accidentally imports from `src/components/` or `src/contexts/`, causing the validator (`validateTrail.mjs`) to fail with a Node.js import error.

**Why it happens:** Developers follow autocomplete and accidentally pull in a component.

**How to avoid:** The file must have zero imports beyond `./rhythmPatterns.js`. Add a JSDoc comment at top: "CRITICAL: No React, VexFlow, or browser imports."

**Warning signs:** `validateTrail.mjs` crashing with `Cannot find module` or `ReferenceError: document is not defined` during `npm run verify:trail`.

### Pitfall 2: `buildRhythmTapConfig()` Still Reads `rc.patterns`

**What goes wrong:** After migration removes the `patterns` field from `rhythmConfig`, `MixedLessonGame`'s `buildRhythmTapConfig()` (line 130) falls back to `["quarter"]` for every node because `rc.patterns` is now `undefined`.

**Why it happens:** The migration deletes `patterns` but doesn't update the consumer that reads it.

**How to avoid:** Update `buildRhythmTapConfig()` to resolve patterns via `resolveByTags(rc.patternTags, rc.durations)` and return the binary array instead. Or keep `patterns` temporarily during migration and clean up in a follow-on commit.

**Warning signs:** All `rhythm_tap` questions show identical 4-quarter-note patterns regardless of node content.

### Pitfall 3: validateTrail.mjs Cannot Import `resolveByTags` If It Uses Browser APIs

**What goes wrong:** New `RhythmPatternGenerator.js` at `src/data/patterns/` is imported by the validator but uses `window`, `document`, or dynamic imports — Node.js throws at require time.

**Why it happens:** Copy-paste from `src/components/games/rhythm-games/RhythmPatternGenerator.js` which does use async fetches.

**How to avoid:** Start from scratch, not from the existing component-level generator.

**Warning signs:** `npm run build` fails with `ReferenceError: window is not defined` or similar.

### Pitfall 4: RENDERER_TYPES Not Updated Breaks Node 1 Validator

**What goes wrong:** `validateTrail.mjs` line 391 has `const RENDERER_TYPES = new Set(['visual_recognition', 'syllable_matching', 'rhythm_tap'])`. After adding `pulse` questions to Node 1, the validator raises an error on every `pulse` question entry.

**Why it happens:** The validator was written before PULSE existed.

**How to avoid:** Add `'pulse'` to RENDERER_TYPES as part of the same commit that adds pulse questions to Node 1.

**Warning signs:** `npm run verify:trail` fails with `ERROR: Node "rhythm_1_1" mixed_lesson question[0] has unknown type "pulse"`.

### Pitfall 5: Tag Taxonomy Mismatch Between Nodes and Patterns

**What goes wrong:** A unit file uses `patternTags: ['quarter-and-half']` but the actual tag in `rhythmPatterns.js` is `'quarter-half'`. No pattern is found, game shows no content.

**Why it happens:** Tags are strings with no IDE autocomplete.

**How to avoid:** The complete valid tag taxonomy (from grep verification) is:

```
quarter-only | quarter-half | quarter-half-whole | quarter-half-whole-eighth
quarter-eighth | quarter-rest | half-rest | whole-rest
dotted-half | dotted-quarter | dotted-syncopation | syncopation
sixteenth | three-four | six-eight
```

Plan must include a reference table of which tag maps to which unit/node.

**Warning signs:** Duration safety check in validator returns null for a tag.

### Pitfall 6: MINI_BOSS Question Count vs Validator Warning

**What goes wrong:** The current validator warns when `mixed_lesson` has fewer than 8 or more than 10 questions (line 428). MINI_BOSS template calls for 12 questions per the audit document.

**Why it happens:** The validator warning range was authored before MINI_BOSS had its own template.

**How to avoid:** Update the validator to allow 12 questions for MINI_BOSS nodes (check `node.nodeType === 'mini_boss'` before applying the 8-10 warning). Do this in the same wave as the validator extension.

**Warning signs:** `npm run verify:trail` passes with many warnings for all MINI_BOSS nodes.

---

## Code Examples

### Existing: How MixedLessonGame Reads RhythmConfig (to update)

```javascript
// Source: src/components/games/rhythm-games/MixedLessonGame.jsx lines 123-135
const buildRhythmTapConfig = useCallback(() => {
  if (!nodeId) return {};
  const node = getNodeById(nodeId);
  if (!node?.rhythmConfig) return {};
  const rc = node.rhythmConfig;
  return {
    patterns: rc.patterns || ["quarter"], // <-- reads OLD field, needs updating
    tempo: typeof rc.tempo === "object" ? rc.tempo.default : rc.tempo || 80,
    timeSignature: rc.timeSignature || "4/4",
    difficulty: "beginner",
  };
}, [nodeId]);
```

### Existing: How ArcadeRhythmGame Calls getPattern (to update)

```javascript
// Source: src/components/games/rhythm-games/ArcadeRhythmGame.jsx lines 329-344
const fetchNewPattern = useCallback(async () => {
  const result = await getPattern(
    timeSignatureStr,
    difficulty,
    rhythmPatterns           // <-- currently reads nodeConfig?.rhythmPatterns (OLD field)
  );
  ...
}, [timeSignatureStr, difficulty, rhythmPatterns]);
```

After migration, `nodeConfig.rhythmPatterns` will be absent. ArcadeRhythmGame needs to read `patternTags` from the node's `rhythmConfig` and resolve via the synchronous generator (or keep using the async generator and translate tags to the old duration-name format).

### Existing: Validator Check Structure (reference pattern for new checks)

```javascript
// Source: scripts/validateTrail.mjs lines 292-314
function validateRhythmPatternNames() {
  console.log('\nChecking rhythmPatterns duration names...');
  const VALID = new Set([...]);
  let invalidCount = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of (node.exercises || [])) {
      for (const pattern of (exercise.config?.rhythmPatterns || [])) {
        if (!VALID.has(pattern)) {
          console.error(`  ERROR: Unknown rhythmPattern "${pattern}" in node "${node.id}"`);
          hasErrors = true; invalidCount++;
        }
      }
    }
  }
  if (invalidCount === 0) console.log('  Rhythm pattern names: OK');
  else console.error(`  Found ${invalidCount} invalid rhythm pattern name(s)`);
}
```

---

## Tag-to-Unit Mapping

This is the critical reference for the migration. Each unit's nodes should use these tags based on their `rhythmConfig.durations`:

| Unit | Duration Vocabulary | Applicable patternTags                                        |
| ---- | ------------------- | ------------------------------------------------------------- |
| 1    | q                   | `quarter-only`                                                |
| 1    | q, h                | `quarter-only`, `quarter-half`                                |
| 2    | q, h, w             | `quarter-half`, `quarter-half-whole`                          |
| 3    | q, h, w, 8          | `quarter-eighth`, `quarter-half-whole-eighth`                 |
| 4    | q, h, w, 8, qr      | `quarter-rest`, `quarter-eighth`, `quarter-half-whole-eighth` |
| 4    | + hr                | `half-rest`                                                   |
| 4    | + wr                | `whole-rest`                                                  |
| 5    | + hd                | `dotted-half`                                                 |
| 5    | 3/4 nodes           | `three-four`                                                  |
| 5    | + qd                | `dotted-quarter`                                              |
| 6    | + 16                | `sixteenth`                                                   |
| 7    | 6/8                 | `six-eight`                                                   |
| 8    | syncopation         | `syncopation`, `dotted-syncopation`                           |

[VERIFIED: tag values from rhythmPatterns.js grep; unit vocabulary from 20-CURRICULUM-AUDIT.md Concept Introduction Order table]

---

## State of the Art

| Old Approach                                       | Current Approach                                       | When Changed                          | Impact                                                  |
| -------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------- |
| Duration allowlist (`rhythmPatterns: ['quarter']`) | Tag-based resolution (`patternTags: ['quarter-only']`) | Phase 22                              | Pattern selection is now curated, not random/procedural |
| Async `getPattern()` via JSON fetch                | Synchronous `resolveByTags()` via JS import            | Phase 22                              | Works at build time in Node.js validator                |
| Separate game-per-exercise                         | Unified `mixed_lesson` with interleaved questions      | Phase 25 (already done for Units 1-3) | All 56 nodes migrate to this model                      |
| Procedural pattern generation                      | Curated 122-pattern library                            | Phase 21 (done)                       | Pedagogically controlled patterns                       |

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — all work is JS module edits and file creation within the existing project)

---

## Validation Architecture

### Test Framework

| Property           | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| Framework          | Vitest                                                       |
| Config file        | `vite.config.js` (inferred from `npm run test` using Vitest) |
| Quick run command  | `npx vitest run src/data/patterns/`                          |
| Full suite command | `npm run test:run`                                           |

### Phase Requirements → Test Map

| Req ID  | Behavior                                       | Test Type   | Automated Command                                                 | File Exists?         |
| ------- | ---------------------------------------------- | ----------- | ----------------------------------------------------------------- | -------------------- |
| PAT-03  | Node configs have `patternTags` not `patterns` | unit        | `npx vitest run src/data/units/`                                  | ❌ Wave 0            |
| PAT-04  | `resolveByTags` returns binary + vexDurations  | unit        | `npx vitest run src/data/patterns/RhythmPatternGenerator.test.js` | ❌ Wave 0            |
| PAT-05  | Duration safety: no unintroduced durations     | unit        | `npx vitest run src/data/patterns/RhythmPatternGenerator.test.js` | ❌ Wave 0            |
| PAT-06  | Build validator catches bad tags               | integration | `npm run verify:trail`                                            | ✅ (extend existing) |
| CURR-05 | PulseQuestion renders and scores taps          | unit        | `npx vitest run src/components/games/rhythm-games/renderers/`     | ❌ Wave 0            |

### Sampling Rate

- Per task commit: `npm run verify:trail` (fast, catches config errors)
- Per wave merge: `npm run test:run` (full Vitest suite)
- Phase gate: Full suite green + `npm run build` passes before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/data/patterns/RhythmPatternGenerator.test.js` — covers `resolveByTags`, `resolveByIds`, binary-to-VexFlow rendering, tag filtering
- [ ] `src/components/games/rhythm-games/renderers/__tests__/PulseQuestion.test.jsx` — covers render, beat detection, scoring
- [ ] Unit file migration test (could be snapshot or structural assertion that `patterns` field is absent)

---

## Security Domain

This phase has no authentication, data access, or user input beyond tap timing. ASVS V5 (Input Validation) is N/A — timing thresholds are computed from AudioContext timestamps, not user-supplied strings. Security domain: SKIPPED for this phase.

---

## Assumptions Log

| #   | Claim                                                                                               | Section                     | Risk if Wrong                                                                  |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| A1  | `buildRhythmTapConfig()` in MixedLessonGame reads `rc.patterns` and must be updated                 | Pitfall 2 / Code Examples   | If it already falls back gracefully, no action needed — verify before planning |
| A2  | ArcadeRhythmGame reads `nodeConfig?.rhythmPatterns` as the allowedPatterns passed to `getPattern()` | Code Examples               | If it reads from node directly, the migration approach for that file changes   |
| A3  | The 8-10 question count warning in validateMixedLessons will trigger for MINI_BOSS (12 questions)   | Common Pitfalls / Pitfall 6 | If MINI_BOSS already has a special path, no validator change needed            |
| A4  | `src/data/patterns/RhythmPatternGenerator.js` (new file) must be a new file, not a rename           | Architecture Patterns       | Renaming the existing file would break all existing game component imports     |

**Note:** A1 and A2 are confirmed by codebase grep (lines cited above). A1 is HIGH confidence. A2 is HIGH confidence (line 105 of ArcadeRhythmGame.jsx confirmed `rhythmPatterns = nodeConfig?.rhythmPatterns`).

---

## Open Questions

1. **Does `resolveByTags` need a `timeSignature` parameter or can it infer from node?**
   - What we know: Each pattern has a `timeSignature` field. The node has `rhythmConfig.timeSignature`.
   - What's unclear: Whether the planner wants the resolver to auto-filter by time signature or require explicit passing.
   - Recommendation: Pass `timeSignature` as part of `options` parameter (optional, defaults to "4/4"). The validator can use it for duration safety checks.

2. **What happens when `resolveByTags` finds no matching pattern?**
   - What we know: Some tag combinations may not have patterns (e.g., narrow tags at unusual time signatures).
   - What's unclear: Whether to return `null`, throw, or fall back to a generative pattern.
   - Recommendation: Return `null` and log a warning. The validator will catch this as a duration safety error at build time, so runtime null is a development-only edge case.

3. **Does the REVIEW nodeType appear in any of the 56 rhythm nodes?**
   - What we know: Phase 20 audit table only documents DISCOVERY/PRACTICE/MIX_UP/SPEED_ROUND/MINI_BOSS/BOSS. No REVIEW nodes are listed.
   - What's unclear: Whether any REVIEW nodes exist or will be added.
   - Recommendation: Include REVIEW in the game-type policy validator check (maps to mixed_lesson) but don't expect any current nodes to require it.

---

## Sources

### Primary (HIGH confidence)

- `src/data/patterns/rhythmPatterns.js` — full tag taxonomy, binary format, 122 patterns [VERIFIED: file read + grep]
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — existing async generator, `getPattern()` signature [VERIFIED: file read]
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — renderer contract, `buildRhythmTapConfig()` implementation [VERIFIED: file read]
- `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` — stateful renderer pattern [VERIFIED: file read]
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — `fetchNewPattern()` and `rhythmPatterns` extraction [VERIFIED: file read]
- `scripts/validateTrail.mjs` — complete validator structure, RENDERER_TYPES Set, validateMixedLessons() [VERIFIED: file read]
- `src/data/units/rhythmUnit1Redesigned.js` — current node shape with `patterns` field [VERIFIED: file read]
- `.planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md` — node-by-node remediation, question mix guidelines, concept introduction order [VERIFIED: file read]
- `src/components/trail/TrailNodeModal.jsx` — exercise type navigation switch [VERIFIED: file read]
- `src/data/constants.js` — EXERCISE_TYPES (no PULSE yet) [VERIFIED: file read]

### Secondary (MEDIUM confidence)

- Phase 22 CONTEXT.md — all locked decisions (D-01 through D-19) [VERIFIED: file read, authored by user]

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all files read directly from codebase
- Architecture: HIGH — all integration points confirmed via grep and file reads
- Pitfalls: HIGH — most pitfalls derived from direct code inspection (line numbers cited)
- Tag taxonomy: HIGH — extracted via grep from rhythmPatterns.js

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (stable codebase, no external dependencies)
