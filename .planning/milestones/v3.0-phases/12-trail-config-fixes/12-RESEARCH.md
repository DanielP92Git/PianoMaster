# Phase 12: Trail Config Fixes - Research

**Researched:** 2026-03-30
**Domain:** Rhythm game configuration wiring, trail data validation, test expectations
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Fix the data files, not the code. Change `'easy'`→`'beginner'`, `'medium'`→`'intermediate'`, `'hard'`→`'advanced'` in all rhythm unit exercise configs (units 1-2 affected). No mapping layer — the generator already uses `beginner`/`intermediate`/`advanced` natively.
- **D-02:** Add optional 3rd parameter to `getPattern(timeSig, difficulty, allowedPatterns)`. When `allowedPatterns` is provided, the generator constrains output to only include specified durations. When omitted (free-play mode), behavior is unchanged.
- **D-03:** All 4 rhythm games (MetronomeTrainer, RhythmReadingGame, RhythmDictationGame, ArcadeRhythmGame) pass `rhythmPatterns` and `difficulty` from trail node config when in trail mode. RhythmDictationGame currently hardcodes `DEFAULT_DIFFICULTY` — update it to read from `nodeConfig` like the other 3 games.
- **D-04:** Unit 7/8 test files get exact per-node exercise type assertions matching the D-12 distribution (3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM for regular nodes, ARCADE_RHYTHM for boss). Not ratio checks — exact per-node type verification.
- **D-05:** Only unit 7/8 tests are updated per success criteria. Units 1-6 test updates deferred.
- **D-06:** Add a regression test that validates all rhythm unit exercise configs use only `['beginner', 'intermediate', 'advanced']` for difficulty values. Prevents the easy/beginner mismatch from recurring.
- **D-07:** Enhance `scripts/validateTrail.mjs` to check: (1) all exercise config `difficulty` values are in `['beginner', 'intermediate', 'advanced']`, (2) all `rhythmPatterns` arrays use recognized duration names. Build fails on violation, same pattern as existing prereq/XP validation.

### Claude's Discretion

- Internal implementation of pattern filtering in `getPattern()` (filter during generation vs post-filter)
- How `allowedPatterns` string names (e.g., `'quarter'`, `'dotted-quarter'`) map to generator internals
- Whether to use `GENERATION_RULES[difficulty].allowedSubdivisions` intersection with `allowedPatterns` or override

### Deferred Ideas (OUT OF SCOPE)

- Units 1-6 test updates for D-12 distribution — not required by TCFG-03, can be done in a future pass
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                     | Research Support                                                                  |
| ------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| TCFG-01 | Rhythm games read `rhythmPatterns` from trail node config to constrain which durations appear                   | `getPattern()` signature change + 4 game call-site updates                        |
| TCFG-02 | Trail difficulty values (`easy`/`medium`/`hard`) map to generator levels (`beginner`/`intermediate`/`advanced`) | Data-only fix in rhythmUnit1 + rhythmUnit2; generator already uses correct values |
| TCFG-03 | rhythmUnit7/8 test expectations updated to validate D-12 distribution                                           | Replace "all exercises use RHYTHM type" assertions with per-node type assertions  |

</phase_requirements>

## Summary

Phase 12 fixes three disconnected bugs in the rhythm trail system that were introduced when Phase 11 remapped exercise types. The core problem: data files emit config values that the receiving code either ignores (rhythmPatterns never passed to generator) or mismatches (difficulty strings like `'easy'` not recognized by a generator that only knows `'beginner'`). Additionally, test files written before the Phase 11 remapping still assert that all exercises use `EXERCISE_TYPES.RHYTHM`, which is now false.

All three fixes are surgical: no new game types, no new components, no structural changes to the trail. TCFG-02 is a pure string substitution in two data files. TCFG-01 is a signature extension to one function plus four call-site updates. TCFG-03 is replacing stale `forEach`/`expect` assertions with accurate per-node assertions. The D-07 validator enhancement acts as a sentinel ensuring the TCFG-02 fix can never regress.

**Primary recommendation:** Implement in dependency order — TCFG-02 (data fix) first since it is pure substitution with zero risk, then TCFG-01 (generator + games), then TCFG-03 (tests), then D-07 (validator). The build validator added in D-07 will immediately confirm TCFG-02 is correct.

## Standard Stack

### Core (all already in project)

| Library/Tool                  | Version             | Purpose                        | Why Standard                                        |
| ----------------------------- | ------------------- | ------------------------------ | --------------------------------------------------- |
| Vitest                        | (project-installed) | Unit testing                   | Already in use for all test files                   |
| React Router `location.state` | v7                  | Trail config delivery to games | Established pattern across all 4 rhythm games       |
| `RhythmPatternGenerator.js`   | internal            | Pattern generation entry point | The single `getPattern()` function all 4 games call |

### No new dependencies required

All changes are to existing files. No npm installs needed.

## Architecture Patterns

### Recommended Project Structure

No structural changes. All files already exist.

```
src/
├── components/games/rhythm-games/
│   ├── RhythmPatternGenerator.js   # getPattern() signature change (TCFG-01)
│   ├── MetronomeTrainer.jsx        # 2 call sites: pass allowedPatterns (TCFG-01)
│   ├── RhythmReadingGame.jsx       # 1 call site: pass allowedPatterns (TCFG-01)
│   ├── RhythmDictationGame.jsx     # hardcoded DEFAULT_DIFFICULTY fix (TCFG-01, D-03)
│   └── ArcadeRhythmGame.jsx        # 1 call site: pass allowedPatterns (TCFG-01)
├── data/units/
│   ├── rhythmUnit1Redesigned.js    # 'easy' -> 'beginner' (5 occurrences) (TCFG-02)
│   ├── rhythmUnit2Redesigned.js    # 'easy' -> 'beginner' (5 occurrences) (TCFG-02)
│   ├── rhythmUnit7Redesigned.test.js  # Replace stale assertion (TCFG-03)
│   └── rhythmUnit8Redesigned.test.js  # Replace stale assertion (TCFG-03)
└── scripts/
    └── validateTrail.mjs           # Add difficulty + rhythmPatterns validation (D-07)
```

### Pattern 1: getPattern() Signature Extension (TCFG-01)

**What:** Add an optional third parameter `allowedPatterns` (array of duration name strings). When provided, constrain generated patterns to only those durations.

**Current signature:**

```javascript
export async function getPattern(timeSignature, difficulty, preferCurated = true)
```

**Problem:** The third positional parameter is already `preferCurated = true`. The new `allowedPatterns` parameter must not displace this or break existing calls that pass `preferCurated` explicitly.

**Resolution:** `preferCurated` is only used in `generatePracticeSession()` internally. All 4 game call sites pass only 2 arguments — `getPattern(timeSig, difficulty)`. It is safe to replace the third parameter with `allowedPatterns = null` since no external caller passes `preferCurated=true` explicitly. The internal `generatePracticeSession()` function will need its own `preferCurated` flag handled separately or inlined.

**Verified call sites (all pass 2 args only):**

- `MetronomeTrainer.jsx:732` — `getPattern(currentSettings.timeSignature.name, currentSettings.difficulty)`
- `MetronomeTrainer.jsx:1183` — `getPattern(gameSettings.timeSignature.name, gameSettings.difficulty)`
- `RhythmReadingGame.jsx:259` — `getPattern(timeSignatureStr, difficulty)`
- `ArcadeRhythmGame.jsx:324` — `getPattern(timeSignatureStr, difficulty)`
- `RhythmDictationGame.jsx:219` — `getPattern(currentTimeSig, DEFAULT_DIFFICULTY)` — hardcoded, needs fixing

**Recommended new signature:**

```javascript
export async function getPattern(timeSignature, difficulty, allowedPatterns = null)
```

The `preferCurated` toggle inside the function body becomes internal logic (always try curated first, then generate). The `generatePracticeSession()` caller passes only 2 args so it is unaffected.

### Pattern 2: allowedPatterns Filtering Implementation (Claude's Discretion)

**What:** When `allowedPatterns` is provided, filter generated patterns to include only durations whose names match the provided list.

**Key mapping to understand:**

The `GENERATION_RULES[difficulty].allowedSubdivisions` arrays contain numeric values from `DURATION_CONSTANTS`:

```javascript
BEGINNER: [DURATION_CONSTANTS.QUARTER, DURATION_CONSTANTS.HALF]; // [4, 8]
INTERMEDIATE: [QUARTER, EIGHTH, DOTTED_QUARTER]; // [4, 2, 6]
ADVANCED: [QUARTER, EIGHTH, SIXTEENTH, DOTTED_QUARTER, DOTTED_EIGHTH]; // [4, 2, 1, 6, 3]
```

The `rhythmPatterns` values in trail node configs are human-readable names:

```javascript
[
  "quarter",
  "half",
  "whole",
  "eighth",
  "dotted-quarter",
  "dotted-eighth",
  "dotted-half",
  "quarter-triplet",
  "eighth-triplet",
  "sixteenth-triplet",
  "sixteenth",
];
```

The `getDurationValue()` method already converts names → numbers. Reverse mapping (numbers → names) is not built but is trivial to add, or the filter can work by resolving `allowedPatterns` to numeric values first.

**Recommended approach (intersection override):**

```javascript
// In generatePattern(), after computing rules:
let effectiveSubdivisions = rules.allowedSubdivisions;
if (allowedPatterns && allowedPatterns.length > 0) {
  // Resolve allowed pattern names to DURATION_CONSTANTS values
  const allowedValues = allowedPatterns
    .map((name) => generator.getDurationValue(name))
    .filter((v) => v !== null);
  // Override: only use subdivisions that are in both the difficulty rules AND allowedPatterns
  effectiveSubdivisions = effectiveSubdivisions.filter((v) =>
    allowedValues.some((av) => Math.abs(av - v) < 0.001)
  );
  // If intersection is empty (mismatch between config and difficulty), fall back to full rules
  if (effectiveSubdivisions.length === 0)
    effectiveSubdivisions = rules.allowedSubdivisions;
}
```

For curated patterns: the curated JSON database selects by difficulty only (no duration filter). Since curated patterns are pre-validated compositions, it is acceptable to skip filtering curated results and only filter generated patterns. The intersection approach is cleaner than post-filtering since it operates during generation.

**Alternative (post-filter):** After `generatePattern()` returns a binary pattern, zero out positions that correspond to disallowed durations. This is harder to implement correctly because binary patterns don't encode which duration produced which position.

**Verdict:** Intersection override during generation is simpler and more correct. Curated patterns are not filtered (their patterns are already musically valid for the time signature).

### Pattern 3: RhythmDictationGame nodeConfig Wiring (TCFG-01, D-03)

**Current state:** RhythmDictationGame extracts `nodeConfig` from `location.state` (lines 68-72) but `generateQuestion()` hardcodes `DEFAULT_DIFFICULTY` (line 219) instead of reading `nodeConfig.difficulty`.

The other 3 games extract difficulty at the component level from `nodeConfig`:

- `RhythmReadingGame.jsx:98` — `const difficulty = nodeConfig?.difficulty ?? ... ?? 'beginner'`
- `ArcadeRhythmGame.jsx:124` — `const difficulty = nodeConfig?.difficulty ?? ... ?? 'beginner'`

`RhythmDictationGame` does NOT have a component-level `difficulty` variable — it uses `DEFAULT_DIFFICULTY` constant directly in `generateQuestion()`.

**Fix approach:** Derive `difficulty` from `nodeConfig` at the component level (same as the other games), then pass it to `generateQuestion()` as an argument (similar to how `currentTempo` and `currentTimeSig` are already passed). The `generateQuestion` signature becomes:

```javascript
const generateQuestion = useCallback(
  async (questionIndex, currentTempo, currentTimeSig, currentDifficulty) => {
    const result = await getPattern(currentTimeSig, currentDifficulty, allowedPatterns);
    ...
  }, [...deps]
);
```

All call sites of `generateQuestion` must also pass the difficulty:

- `advanceQuestion()` (line 344)
- `handleStartGame()` (line 372)
- Auto-start `useEffect` (line 360)

**Also:** `rhythmPatterns` from `nodeConfig` must be extracted and passed through to `getPattern` at both sites (in `generateQuestion` and wherever it is called from). The component-level extraction follows:

```javascript
const rhythmPatterns = nodeConfig?.rhythmPatterns ?? null;
```

### Pattern 4: Game Call-Site Update Template (TCFG-01)

For games that already extract `difficulty` at component level and call `getPattern()`:

**MetronomeTrainer** — Two call sites, both use `currentSettings.difficulty` or `gameSettings.difficulty`. The `rhythmPatterns` comes from `nodeConfig?.rhythmPatterns`. Since MetronomeTrainer builds `trailSettings` from `nodeConfig` at lines 184-188, add `rhythmPatterns: nodeConfig?.rhythmPatterns || null` to the settings object, and pass it at the `getPattern()` call sites.

**RhythmReadingGame** — One call site at line 259 inside `fetchNewPattern()`. The component already has `difficulty` variable. Add `rhythmPatterns` extraction at component level and pass to `getPattern()`.

**ArcadeRhythmGame** — One call site at line 324. Already extracts `difficulty` from `nodeConfig`. Add `rhythmPatterns` extraction and pass to `getPattern()`.

### Pattern 5: Test Assertion Replacement (TCFG-03)

**Unit 7 current failing assertion (lines 81-85):**

```javascript
it("all exercises use RHYTHM type", () => {
  rhythmUnit7Nodes.forEach((node) => {
    expect(node.exercises[0].type).toBe(EXERCISE_TYPES.RHYTHM);
  });
});
```

**Unit 7 actual data (verified by reading rhythmUnit7Redesigned.js):**
| Node | Exercise Type |
|---|---|
| rhythm_7_1 | RHYTHM |
| rhythm_7_2 | RHYTHM |
| rhythm_7_3 | RHYTHM_TAP |
| rhythm_7_4 | RHYTHM_DICTATION |
| rhythm_7_5 | RHYTHM_TAP |
| rhythm_7_6 | RHYTHM |
| boss_rhythm_7 | ARCADE_RHYTHM |

That is 3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM — exactly the D-12 distribution.

**Unit 8 actual data (verified by reading rhythmUnit8Redesigned.js):**
| Node | Exercise Type |
|---|---|
| rhythm_8_1 | RHYTHM |
| rhythm_8_2 | RHYTHM |
| rhythm_8_3 | RHYTHM_TAP |
| rhythm_8_4 | RHYTHM_DICTATION |
| rhythm_8_5 | RHYTHM_TAP |
| rhythm_8_6 | RHYTHM |
| boss_rhythm_8 | ARCADE_RHYTHM (3 exercises, all ARCADE_RHYTHM) |

Unit 8 boss has 3 exercises (lines 373-408), all `EXERCISE_TYPES.ARCADE_RHYTHM`. The current stale assertion at lines 80-86 asserts all exercises (forEach on all exercises, not just first) use RHYTHM type.

**Replacement assertion for Unit 7:**

```javascript
it("exercise types match D-12 distribution", () => {
  const types = rhythmUnit7Nodes.map((n) => n.exercises[0].type);
  expect(types).toEqual([
    EXERCISE_TYPES.RHYTHM, // rhythm_7_1
    EXERCISE_TYPES.RHYTHM, // rhythm_7_2
    EXERCISE_TYPES.RHYTHM_TAP, // rhythm_7_3
    EXERCISE_TYPES.RHYTHM_DICTATION, // rhythm_7_4
    EXERCISE_TYPES.RHYTHM_TAP, // rhythm_7_5
    EXERCISE_TYPES.RHYTHM, // rhythm_7_6
    EXERCISE_TYPES.ARCADE_RHYTHM, // boss_rhythm_7
  ]);
});
```

**Replacement assertion for Unit 8 regular nodes:**

```javascript
it("exercise types match D-12 distribution", () => {
  const regularNodes = rhythmUnit8Nodes.slice(0, 6);
  const types = regularNodes.map((n) => n.exercises[0].type);
  expect(types).toEqual([
    EXERCISE_TYPES.RHYTHM, // rhythm_8_1
    EXERCISE_TYPES.RHYTHM, // rhythm_8_2
    EXERCISE_TYPES.RHYTHM_TAP, // rhythm_8_3
    EXERCISE_TYPES.RHYTHM_DICTATION, // rhythm_8_4
    EXERCISE_TYPES.RHYTHM_TAP, // rhythm_8_5
    EXERCISE_TYPES.RHYTHM, // rhythm_8_6
  ]);
});

it("boss node exercises are all ARCADE_RHYTHM", () => {
  const bossNode = rhythmUnit8Nodes[rhythmUnit8Nodes.length - 1];
  bossNode.exercises.forEach((ex) => {
    expect(ex.type).toBe(EXERCISE_TYPES.ARCADE_RHYTHM);
  });
});
```

**IMPORTANT:** The existing Unit 8 test already passes the boss node separately in `describe('Rhythm Unit 8 — Boss Challenge (RADV-04)')`. The stale assertion in the first `describe` block iterates `.exercises` (plural, includes boss's 3 exercises), so the replacement must only cover the first 6 regular nodes.

### Pattern 6: D-06 Regression Test

**What:** A test that scans all rhythm unit data files and asserts every `exercises[*].config.difficulty` uses only allowed values.

**Where to add:** A new test file `src/data/units/rhythmUnits.difficulty.test.js` (or similar) that imports all 8 units and validates.

```javascript
import { describe, it, expect } from "vitest";
import { rhythmUnit1Nodes } from "./rhythmUnit1Redesigned.js";
// ... import all 8 units

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const allUnits = [
  ...rhythmUnit1Nodes,
  ...rhythmUnit2Nodes,
  // ... all 8
];

describe("Rhythm unit difficulty values", () => {
  it("all exercise configs use valid difficulty values", () => {
    allUnits.forEach((node) => {
      (node.exercises || []).forEach((ex) => {
        if (ex.config?.difficulty !== undefined) {
          expect(VALID_DIFFICULTIES).toContain(ex.config.difficulty);
        }
      });
    });
  });
});
```

### Pattern 7: validateTrail.mjs Enhancement (D-07)

**What:** Two new validation functions called from the main execution block.

**VALID_DIFFICULTIES** set: `['beginner', 'intermediate', 'advanced']`

**VALID_RHYTHM_PATTERNS** set (from `getDurationValue()` keys in `RhythmPatternGenerator.js`):

```
'whole', 'half', 'quarter', 'eighth', 'sixteenth',
'dotted-half', 'dotted-quarter', 'dotted-eighth',
'quarter-triplet', 'eighth-triplet', 'sixteenth-triplet'
```

**Implementation template:**

```javascript
function validateExerciseDifficultyValues() {
  console.log("\nChecking exercise difficulty values...");
  const VALID = new Set(["beginner", "intermediate", "advanced"]);
  let invalidCount = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      const d = exercise.config?.difficulty;
      if (d !== undefined && !VALID.has(d)) {
        console.error(
          `  ERROR: Invalid difficulty "${d}" in node "${node.id}"`
        );
        hasErrors = true;
        invalidCount++;
      }
    }
  }
  if (invalidCount === 0) console.log("  Exercise difficulty values: OK");
  else console.error(`  Found ${invalidCount} invalid difficulty value(s)`);
}

function validateRhythmPatternNames() {
  console.log("\nChecking rhythmPatterns duration names...");
  const VALID = new Set([
    "whole",
    "half",
    "quarter",
    "eighth",
    "sixteenth",
    "dotted-half",
    "dotted-quarter",
    "dotted-eighth",
    "quarter-triplet",
    "eighth-triplet",
    "sixteenth-triplet",
  ]);
  let invalidCount = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      for (const pattern of exercise.config?.rhythmPatterns || []) {
        if (!VALID.has(pattern)) {
          console.error(
            `  ERROR: Unknown rhythmPattern "${pattern}" in node "${node.id}"`
          );
          hasErrors = true;
          invalidCount++;
        }
      }
    }
  }
  if (invalidCount === 0) console.log("  Rhythm pattern names: OK");
  else console.error(`  Found ${invalidCount} invalid rhythm pattern name(s)`);
}
```

Both functions are added to the main execution block after `validateExerciseTypes()`.

### Anti-Patterns to Avoid

- **Mapping layer for difficulty:** Adding a translation map `{ easy: 'beginner', medium: 'intermediate' }` in the generator or games. Decision D-01 explicitly rejects this — fix the data, not the code.
- **Changing generatePracticeSession():** This internal function uses a `preferCurated` loop that should not be affected by the signature change. Do not alter it.
- **Post-filtering binary patterns:** Zeroing out individual positions in a binary pattern after generation is fragile. The intersection approach during generation is correct.
- **Filtering curated patterns:** Curated JSON patterns are pre-composed musical phrases — constraining them by duration names would break their musical validity. Only apply `allowedPatterns` filtering during generative path.
- **Adding `rhythmPatterns` to MetronomeTrainer's `gameSettings` state:** The `gameSettings` object is used for both trail mode and manual setup mode. Do not add `rhythmPatterns` to `gameSettings` — extract it separately from `nodeConfig` and pass directly to `getPattern()` call sites to avoid polluting the settings object.

## Don't Hand-Roll

| Problem                              | Don't Build      | Use Instead                                            | Why                                                  |
| ------------------------------------ | ---------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| Duration string-to-number conversion | Custom map       | `getDurationValue()` already in `HybridPatternService` | Already handles all 11 duration names                |
| Test data iteration                  | Custom traversal | Vitest `forEach` + `expect`                            | Standard pattern already in all test files           |
| Build validation                     | Custom CI check  | Extend `validateTrail.mjs`                             | Already runs as prebuild hook, exit code 1 on errors |

**Key insight:** The generator already has all the building blocks. `getDurationValue()` provides the name→number mapping needed to resolve `allowedPatterns` to numeric values for intersection with `allowedSubdivisions`.

## Common Pitfalls

### Pitfall 1: Third Parameter Displacement

**What goes wrong:** Replacing `preferCurated = true` with `allowedPatterns = null` as the third parameter without auditing all callers. If any code passes `true` as the third arg, it would be misinterpreted as `allowedPatterns = true`.
**Why it happens:** `generatePracticeSession()` internally calls `getPattern(timeSignature, difficulty, preferCurated)` at line 778.
**How to avoid:** Update `generatePracticeSession()` to not pass the third arg (just call `getPattern(ts, diff)`) since its alternating `preferCurated` logic is internal and can be handled by internal state or randomness.
**Warning signs:** If the curated-vs-generated toggle breaks after the signature change, this is the cause.

### Pitfall 2: Empty Intersection Fallback

**What goes wrong:** `allowedPatterns` from the node config lists durations (e.g., `['dotted-quarter']`) that have numeric values not present in the difficulty's `allowedSubdivisions`. For example, BEGINNER only allows `[QUARTER, HALF]` — requesting `'dotted-quarter'` (value 6) would produce an empty intersection.
**Why it happens:** Trail node configs can specify rhythmPatterns at a harder difficulty than the difficulty setting.
**How to avoid:** When the intersection is empty, fall back to the full `rules.allowedSubdivisions` (not to an empty array). Log a warning.
**Warning signs:** Patterns that ignore the `rhythmPatterns` constraint silently.

### Pitfall 3: RhythmDictationGame advanceQuestion stale closure

**What goes wrong:** `advanceQuestion` captures `tempo` and `timeSignature` state values. Adding `difficulty` must use the same pattern — derive from state or pass as argument consistently.
**Why it happens:** The game uses React state for `tempo`/`timeSignature` but a constant for `difficulty`. When converting difficulty to be dynamic, the `advanceQuestion` callback dependency array must include it.
**How to avoid:** Derive `difficulty` from `nodeConfig` (not state) at component level, same as `RhythmReadingGame` does. Since `nodeConfig` is immutable per session, no state needed.

### Pitfall 4: Unit 8 Boss Exercise Assertion Overlap

**What goes wrong:** The existing Unit 8 test has TWO describe blocks. The stale assertion in the first block iterates over ALL exercises including the boss's 3 exercises. The second block (`describe('Rhythm Unit 8 — Boss Challenge')`) already tests boss exercise types. Replacing the stale assertion must only cover the 6 regular nodes to avoid duplicating boss assertions.
**Why it happens:** The original test was written before Phase 11 added mixed types and multiple exercises per node.
**How to avoid:** Use `rhythmUnit8Nodes.slice(0, 6)` in the replacement assertion. Keep all boss-specific tests in the second describe block.

### Pitfall 5: validateTrail.mjs runs before rhythm unit data is valid

**What goes wrong:** Running `npm run build` before TCFG-02 is applied will correctly fail the new `validateExerciseDifficultyValues()` check. This is expected behavior, not a bug.
**Why it happens:** D-07 is intentionally a build gate.
**How to avoid:** Always apply the TCFG-02 data fix before running the build. Implement in the recommended order: TCFG-02 → TCFG-01 → TCFG-03 → D-07.

## Code Examples

Verified patterns from reading source files:

### TCFG-02: Difficulty Occurrences in Unit 1

Each of these 5 nodes in `rhythmUnit1Redesigned.js` has `difficulty: 'easy'`:

- `rhythm_1_1` (line 69), `rhythm_1_2` (line 122), `rhythm_1_3` (line 172), `rhythm_1_4` (line 222), `rhythm_1_5` (line 273)
- `rhythm_1_6` (line 326) uses `'intermediate'` — already correct
- `boss_rhythm_1` (line 378) uses `'intermediate'` — already correct

Unit 2 has the same pattern: nodes 1-5 use `'easy'`, node 6 and boss use `'intermediate'`.

### TCFG-01: Where rhythmPatterns Lives in nodeConfig

Trail navigation passes the exercise's config object directly as `nodeConfig` (from `TrailNodeModal.jsx`). The exercise config structure is:

```javascript
{
  rhythmPatterns: ['quarter', 'half'],   // array of duration name strings
  tempo: 70,
  measuresPerPattern: 2,
  timeSignature: '4/4',
  difficulty: 'beginner'
}
```

So `nodeConfig?.rhythmPatterns` is the correct extraction path in all 4 games.

### TCFG-03: Confirmed Unit 7 Distribution

The actual exercise types in `rhythmUnit7Redesigned.js` (confirmed by reading file):

```
rhythm_7_1: EXERCISE_TYPES.RHYTHM
rhythm_7_2: EXERCISE_TYPES.RHYTHM
rhythm_7_3: EXERCISE_TYPES.RHYTHM_TAP
rhythm_7_4: EXERCISE_TYPES.RHYTHM_DICTATION
rhythm_7_5: EXERCISE_TYPES.RHYTHM_TAP
rhythm_7_6: EXERCISE_TYPES.RHYTHM
boss_rhythm_7: EXERCISE_TYPES.ARCADE_RHYTHM
```

That matches: 3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM.

### TCFG-03: Confirmed Unit 8 Distribution

The actual exercise types in `rhythmUnit8Redesigned.js` (confirmed by reading file):

```
rhythm_8_1: EXERCISE_TYPES.RHYTHM
rhythm_8_2: EXERCISE_TYPES.RHYTHM
rhythm_8_3: EXERCISE_TYPES.RHYTHM_TAP
rhythm_8_4: EXERCISE_TYPES.RHYTHM_DICTATION
rhythm_8_5: EXERCISE_TYPES.RHYTHM_TAP
rhythm_8_6: EXERCISE_TYPES.RHYTHM
boss_rhythm_8: EXERCISE_TYPES.ARCADE_RHYTHM (x3 exercises)
```

### D-07: Existing validateTrail.mjs Pattern for New Functions

The existing pattern to follow (from `validateExerciseTypes()`):

```javascript
function validateExerciseTypes() {
  console.log("\nChecking exercise types...");
  const validTypes = new Set(Object.values(EXERCISE_TYPES));
  let invalidCount = 0;
  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      if (!validTypes.has(exercise.type)) {
        console.error(
          `  ERROR: Unknown exercise type "${exercise.type}" in node "${node.id}"`
        );
        hasErrors = true;
        invalidCount++;
      }
    }
  }
  if (invalidCount === 0) console.log("  Exercise types: OK");
  else console.error(`  Found ${invalidCount} unknown exercise type(s)`);
}
```

New validation functions follow the exact same pattern: iterate SKILL_NODES, iterate exercises, check, set `hasErrors = true` on violation.

## State of the Art

| Old Approach                                                | Current Approach                                | When Changed          | Impact                                           |
| ----------------------------------------------------------- | ----------------------------------------------- | --------------------- | ------------------------------------------------ |
| All rhythm nodes use EXERCISE_TYPES.RHYTHM                  | Mixed types per D-12 distribution               | Phase 11 (2026-03-30) | Tests written for old approach are now stale     |
| getPattern(timeSig, difficulty) ignores node rhythmPatterns | getPattern will accept optional allowedPatterns | Phase 12 (this phase) | Trail config finally constrains generator output |

**Current state of TCFG-02 violations:**

Running `npm run verify:trail` would currently fail if D-07 were already in place. The violations are:

rhythmUnit1: `rhythm_1_1`, `rhythm_1_2`, `rhythm_1_3`, `rhythm_1_4`, `rhythm_1_5` — all use `difficulty: 'easy'`
rhythmUnit2: `rhythm_2_1`, `rhythm_2_2`, `rhythm_2_3`, `rhythm_2_4`, `rhythm_2_5` — all use `difficulty: 'easy'`

Units 3-8 already use `beginner`/`intermediate`/`advanced` correctly (verified by reading).

## Open Questions

1. **Curated pattern filtering**
   - What we know: The curated JSON patterns are loaded from `/data/4-4.json` etc. and are pre-composed phrases. Filtering them by `allowedPatterns` would require post-processing.
   - What's unclear: Whether curated patterns actually respect the `allowedSubdivisions` structure from `GENERATION_RULES`.
   - Recommendation: Skip filtering of curated patterns. The curated path is a bonus for musical variety; when `allowedPatterns` is specified, fall back to generative path only (pass `preferCurated = false` internally when `allowedPatterns` is non-null). This is simpler and avoids the risk of breaking valid curated patterns.

2. **D-06 test file location**
   - What we know: Test files live as siblings of source files per CLAUDE.md conventions.
   - What's unclear: Whether the regression test belongs in a new file or should be appended to an existing unit test.
   - Recommendation: New file `src/data/units/rhythmUnits.difficulty.test.js` to keep it isolated from per-unit tests. Imports all 8 units.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — all changes are to existing source files, test infrastructure, and a build script that already runs in the CI environment).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (project-installed)                                                                                 |
| Config file        | `vite.config.js` (vitest config co-located)                                                                |
| Quick run command  | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js` |
| Full suite command | `npm run test:run`                                                                                         |

### Phase Requirements → Test Map

| Req ID         | Behavior                                          | Test Type   | Automated Command                                                                                          | File Exists?                             |
| -------------- | ------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| TCFG-01        | getPattern passes allowedPatterns constraint      | unit        | `npx vitest run src/components/games/rhythm-games/RhythmPatternGenerator.test.js`                          | No — Wave 0 gap                          |
| TCFG-02        | Rhythm unit configs use valid difficulty values   | unit        | `npx vitest run src/data/units/rhythmUnits.difficulty.test.js`                                             | No — Wave 0 gap (D-06)                   |
| TCFG-03        | Unit 7/8 tests assert D-12 distribution           | unit        | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js` | Yes (stale assertions — update in place) |
| TCFG-02 + D-07 | Build validator rejects invalid difficulty values | integration | `npm run verify:trail`                                                                                     | Yes (enhancement needed)                 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run test:run` green + `npm run verify:trail` passes before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/RhythmPatternGenerator.test.js` — covers TCFG-01 (getPattern with allowedPatterns arg). May already exist — verify before creating.
- [ ] `src/data/units/rhythmUnits.difficulty.test.js` — covers TCFG-02 + D-06 regression test

## Sources

### Primary (HIGH confidence)

- Direct source code reading — all findings verified against actual file content
  - `RhythmPatternGenerator.js` — `getPattern()` signature, `DIFFICULTY_LEVELS`, `GENERATION_RULES`, `getDurationValue()` map
  - `MetronomeTrainer.jsx` — nodeConfig extraction (lines 88, 171-199), `getPattern()` call sites (lines 732, 1183)
  - `RhythmReadingGame.jsx` — difficulty extraction (line 98), `getPattern()` call (line 259)
  - `RhythmDictationGame.jsx` — hardcoded `DEFAULT_DIFFICULTY` at line 219, auto-start wiring (lines 351-363)
  - `ArcadeRhythmGame.jsx` — nodeConfig extraction (lines 107, 122-124), `getPattern()` call (line 324)
  - `rhythmUnit1Redesigned.js` + `rhythmUnit2Redesigned.js` — `difficulty: 'easy'` occurrences confirmed
  - `rhythmUnit7Redesigned.js` + `rhythmUnit8Redesigned.js` — actual exercise types confirmed
  - `rhythmUnit7Redesigned.test.js` + `rhythmUnit8Redesigned.test.js` — stale assertions confirmed (lines 81-85, 80-86)
  - `validateTrail.mjs` — existing function structure for extension
  - `src/data/constants.js` — EXERCISE_TYPES enum confirmed

### Secondary (MEDIUM confidence)

- Phase 11 CONTEXT.md — D-12 distribution definition and D-13 boss node rule confirmed

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries are already in the project, no new dependencies
- Architecture: HIGH — all patterns verified by direct code reading, no assumptions
- Pitfalls: HIGH — all identified from actual code analysis (third parameter, empty intersection, stale closures)
- Test assertions: HIGH — actual exercise type arrays verified by reading unit data files

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase, no expected external changes)
