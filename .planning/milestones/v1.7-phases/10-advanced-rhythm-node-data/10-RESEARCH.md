# Phase 10: Advanced Rhythm Node Data - Research

**Researched:** 2026-03-19
**Domain:** Trail node data authoring — 6/8 compound meter + syncopation (pure data, no engine changes)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary:** Create two new rhythm unit files only. No game engine changes, no UI changes, no integration wiring (Phase 11 handles expandedNodes.js, gate, and i18n).

**6/8 Unit Structure (Rhythm Unit 7):**
- 7 nodes: Discovery → Practice → Discovery (mix) → Practice → Mix-Up → Speed → Mini-Boss
- Mini-Boss (not true Boss) at end of Unit 7 — true Boss is in Unit 8
- Gradual duration progression: dotted-quarter only → add quarters → add eighths → all 6/8 durations mixed
- Tempo range: slow start 60-70 BPM, ramp to 80-90 BPM by Mini-Boss
- Unit starts after `boss_rhythm_6` (order 142+), prerequisite: `boss_rhythm_6`

**Syncopation Unit Structure (Rhythm Unit 8):**
- 7 nodes: same standard pattern, ending with a TRUE Boss (trail milestone)
- All syncopation nodes in 4/4 time signature
- Two syncopation patterns: eighth-quarter-eighth and dotted quarter-eighth
- Node 1 introduces eighth-quarter-eighth; Node 3 introduces dotted quarter-eighth
- Tempo range: 65-85 BPM
- True Boss at end is the capstone of the entire advanced rhythm section

**Discovery Node Teaching:**
- 6/8 discovery: very slow tempo (55-60 BPM), only dotted-quarter notes, 1 measure per pattern
- 6/8 newContentDescription: "6/8 Time: Two big beats per bar"
- Syncopation discovery newContentDescription: "Syncopation: Tap between the beats!"
- No new UI or tutorial overlay needed

**Boss Challenge Design:**
- Final boss mixes 6/8 compound AND 4/4 syncopation
- 15 questions total, 250 XP reward
- `accessoryUnlock: 'advanced_rhythm_badge'` or similar

**Order arithmetic:**
- Unit 7 START_ORDER = 142 (after boss_rhythm_6 at order 141)
- Unit 8 START_ORDER = 149 (after boss_rhythm_7 at order 148)
- boss_rhythm_7 id: `boss_rhythm_7` at order 148
- boss_rhythm_8 id: `boss_rhythm_8` at order 155

### Claude's Discretion

- Boss exercise sequence design (how to split 6/8 vs syncopation exercises)
- Exact duration combinations at each node
- Node names and descriptions (age-appropriate, encouraging for 8-year-olds)
- `focusDurations` vs `contextDurations` splits at each node
- `patterns` array values at each node
- Whether to include a Review node type in either unit
- XP rewards for non-boss nodes (follow existing 75-90 range)
- `measuresPerPattern` at each node

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RADV-01 | 6/8 compound meter discovery nodes with scaffolding | rhythmUnit7Redesigned.js — discovery nodes with `timeSignature: '6/8'`, very slow tempo, dotted-quarter-only durations, `newContent: NEW_CONTENT_TYPES.RHYTHM` |
| RADV-02 | 6/8 compound meter practice nodes (basic → intermediate → advanced) | 5 additional Unit 7 nodes following rhythmUnit6 template, progressively adding quarters, eighths, and mixed 6/8 durations |
| RADV-03 | Syncopation pattern nodes (eighth-quarter-eighth, dotted quarter-eighth) | rhythmUnit8Redesigned.js — 4/4 time, two discovery nodes introducing each syncopation pattern; evaluator confirmed event-level timing is already in MetronomeTrainer |
| RADV-04 | Advanced rhythm boss challenge (6/8 + syncopation mixed) | boss_rhythm_8 node as NODE_TYPES.BOSS with multi-exercise config mixing both time signatures; 15 questions, 250 XP |

</phase_requirements>

---

## Summary

This phase is pure data authoring — no code changes to any game engine, renderer, or service. Two new JavaScript unit files must be created following the exact structural pattern of `rhythmUnit6Redesigned.js`. The game engine (MetronomeTrainer + RhythmPatternGenerator) already fully supports both `timeSignature: '6/8'` and the syncopation patterns targeted; Phase 09 completed all required infrastructure fixes.

The two files to create are `src/data/units/rhythmUnit7Redesigned.js` (6/8 compound meter, 7 nodes, Mini-Boss terminus) and `src/data/units/rhythmUnit8Redesigned.js` (syncopation in 4/4, 7 nodes, TRUE Boss terminus). Both files export a named array and a default export, following the identical import/export convention as Unit 6. Integration into `expandedNodes.js` and `skillTrail.js` UNITS metadata is deliberately deferred to Phase 11.

**Primary recommendation:** Copy the verbatim structure of `rhythmUnit6Redesigned.js` for both new unit files, substituting the correct UNIT_ID, START_ORDER, time signature, duration sets, tempo ranges, node types, and IDs. Do not invent new fields or deviate from established patterns — the validator (`validateTrail.mjs`) will reject unknown node type strings and prerequisite cycles.

---

## Standard Stack

### Core (all already in project — no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NODE_TYPES (nodeTypes.js) | project | Node type classification | All trail nodes MUST use these string values; validator rejects unknown types |
| RHYTHM_COMPLEXITY (nodeTypes.js) | project | Complexity enum for rhythmConfig | Consumer field; not validated at build time but used by game UI |
| NEW_CONTENT_TYPES (nodeTypes.js) | project | Badge/highlight for what's new in node | Drives "NEW" banner in trail UI |
| EXERCISE_TYPES (constants.js) | project | Exercise type identifier | Drives navigation routing in MetronomeTrainer |

No new npm packages required. This phase is entirely data authoring within the existing module system.

---

## Architecture Patterns

### Recommended Project Structure

```
src/data/units/
├── rhythmUnit1Redesigned.js     # existing
├── ...
├── rhythmUnit6Redesigned.js     # existing — template to follow
├── rhythmUnit7Redesigned.js     # NEW: 6/8 compound meter
└── rhythmUnit8Redesigned.js     # NEW: syncopation in 4/4
```

### Pattern 1: Unit File Structure

**What:** Each unit file is a self-contained ES module with two exports — a named array and a default export of the same array.

**When to use:** Always — this is the only structure `expandedNodes.js` consumes.

**Example (verified from rhythmUnit6Redesigned.js):**
```javascript
// Source: src/data/units/rhythmUnit6Redesigned.js
import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 7;             // Change per unit
const UNIT_NAME = 'Big Beats'; // Age-appropriate unit name
const CATEGORY = 'rhythm';
const START_ORDER = 142;       // Unit 7: after boss_rhythm_6 at 141

export const rhythmUnit7Nodes = [ /* node objects */ ];
export default rhythmUnit7Nodes;
```

### Pattern 2: Rhythm Node Object Shape

**What:** The complete set of required fields for a rhythm trail node.

**Example (distilled from all existing rhythm unit files):**
```javascript
// Source: src/data/units/rhythmUnit6Redesigned.js — all fields
{
  id: 'rhythm_7_1',                 // pattern: rhythm_{unit}_{orderInUnit}
  name: 'Two Big Beats',            // age-appropriate
  description: 'Feel the 1-2-3, 1-2-3 compound beat',
  category: CATEGORY,               // 'rhythm' for regular nodes
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER,               // global trail position
  orderInUnit: 1,
  prerequisites: ['boss_rhythm_6'], // first node prereqs unit boss

  nodeType: NODE_TYPES.DISCOVERY,   // DISCOVERY | PRACTICE | MIX_UP | SPEED_ROUND | MINI_BOSS | BOSS

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.ALL,  // SIMPLE | MEDIUM | VARIED | ALL
    durations: ['qd'],                  // VexFlow duration codes
    focusDurations: ['qd'],             // new durations being introduced
    contextDurations: [],               // known supporting durations
    patterns: ['dotted-quarter'],       // human-readable pattern names
    tempo: { min: 55, max: 60, default: 58 },
    pitch: 'C4',                        // ALL rhythm nodes use 'C4'
    timeSignature: '6/8'                // '4/4' or '6/8'
  },

  newContent: NEW_CONTENT_TYPES.RHYTHM, // RHYTHM | EXERCISE_TYPE | CHALLENGE_TYPE | NONE
  newContentDescription: '6/8 Time: Two big beats per bar',

  exercises: [
    {
      type: EXERCISE_TYPES.RHYTHM,      // always EXERCISE_TYPES.RHYTHM for rhythm nodes
      config: {
        rhythmPatterns: ['dotted-quarter'],
        tempo: 58,
        measuresPerPattern: 1,
        timeSignature: '6/8',
        difficulty: 'beginner'          // 'beginner' | 'intermediate' | 'advanced'
      }
    }
  ],

  skills: ['dotted_quarter_note_68'],   // skill tag for tracking
  xpReward: 75,                         // 75-90 for regular, 200+ for boss
  accessoryUnlock: null,                // string or null
  isBoss: false,                        // true only for NODE_TYPES.BOSS
  isReview: false,
  reviewsUnits: []
}
```

### Pattern 3: Boss Node ID Convention

**What:** Boss nodes at the end of each unit use a special ID format and `category: 'boss'` (not `'rhythm'`).

**Example:**
```javascript
// Source: src/data/units/rhythmUnit6Redesigned.js lines 344-392
{
  id: 'boss_rhythm_6',          // boss_rhythm_{unit} — NOT rhythm_6_7
  category: 'boss',             // CRITICAL: boss nodes use 'boss' category, not 'rhythm'
  nodeType: NODE_TYPES.BOSS,    // or NODE_TYPES.MINI_BOSS for unit 7
  isBoss: true,                 // only true here
  xpReward: 200,                // Unit 6 boss; Unit 8 boss gets 250 (per CONTEXT.md)
  accessoryUnlock: 'rhythm_champion_badge',
  // ... all other fields same shape
}
```

### Pattern 4: Multi-Exercise Boss (Unit 8 Boss Design)

**What:** The final boss node (boss_rhythm_8) must test both 6/8 and 4/4 syncopation. Based on Claude's discretion, the recommended approach is a 3-exercise boss:

```javascript
// Recommended boss exercise sequence for boss_rhythm_8
exercises: [
  {
    // Exercise 1: 6/8 compound meter
    type: EXERCISE_TYPES.RHYTHM,
    config: {
      rhythmPatterns: ['dotted-quarter', 'quarter', 'eighth'],
      tempo: 75,
      measuresPerPattern: 2,
      timeSignature: '6/8',
      difficulty: 'advanced',
      questionCount: 5
    }
  },
  {
    // Exercise 2: Syncopation (eighth-quarter-eighth)
    type: EXERCISE_TYPES.RHYTHM,
    config: {
      rhythmPatterns: ['eighth', 'quarter', 'dotted-quarter'],
      tempo: 75,
      measuresPerPattern: 2,
      timeSignature: '4/4',
      difficulty: 'advanced',
      questionCount: 5
    }
  },
  {
    // Exercise 3: Combined challenge — both concepts
    type: EXERCISE_TYPES.RHYTHM,
    config: {
      rhythmPatterns: ['dotted-quarter', 'eighth', 'quarter'],
      tempo: 80,
      measuresPerPattern: 2,
      timeSignature: '4/4',  // end on syncopation as hardest
      difficulty: 'advanced',
      questionCount: 5
    }
  }
]
// Total: 15 questions across 3 exercises — matches CONTEXT.md spec
```

**Note:** MetronomeTrainer's `handleNextExercise` already routes to the next exercise in `node.exercises[nextIndex]`, so multi-exercise bosses work without any engine changes.

### Anti-Patterns to Avoid

- **Wrong category for boss nodes:** Regular rhythm nodes use `category: CATEGORY` ('rhythm'). Boss/mini-boss nodes MUST use `category: 'boss'`. The validator does not catch this but the trail map display groups nodes by category.
- **Wrong isBoss value:** Only `NODE_TYPES.BOSS` nodes set `isBoss: true`. Mini-boss nodes set `isBoss: false`. This drives XP award logic in VictoryScreen.
- **timeSignature mismatch:** `rhythmConfig.timeSignature` and `exercises[x].config.timeSignature` must match. MetronomeTrainer reads from `nodeConfig.timeSignature` (the exercise config) to configure the TIME_SIGNATURES object.
- **Off-by-one in order arithmetic:** Unit 7 has 7 nodes: orders 142-148. boss_rhythm_7 is at 148. Unit 8 starts at 149 (START_ORDER = 149). boss_rhythm_8 is at 155.
- **Duplicate prerequisite reference:** The first node of Unit 8 must prerequisite `boss_rhythm_7`, NOT `boss_rhythm_6`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duration string mapping | Custom duration → VexFlow code lookup | Use established `durations` strings: `'qd'` = dotted quarter, `'8'` = eighth, `'q'` = quarter | These strings are the established vocabulary consumed by rhythmGenerator |
| Pattern name mapping | Custom name strings | Use established `patterns` names: `'dotted-quarter'`, `'eighth'`, `'quarter'` | Names passed to `rhythmPatterns` in exercise config; RhythmPatternGenerator uses them |
| Tap evaluation for off-beat events | Custom timing window for syncopation | None needed — MetronomeTrainer's `evaluatePerformance` already uses event-level timing via `expectedBeatPositions` array derived from binary pattern | Any position (on-beat or off-beat) in the binary pattern is evaluated with the same `calculateTimingThresholds` window |
| Order arithmetic | Computed constants | Use explicit constants: `START_ORDER = 142` (Unit 7), `START_ORDER = 149` (Unit 8) | Ensures no collision with existing nodes |

**Key insight:** The game engine treats syncopation identically to on-beat notes — it computes `beatPosition = index / unitsPerBeat` for every `1` in the binary pattern, whether that position falls on or off the beat. No special syncopation handling is needed in node data.

---

## Common Pitfalls

### Pitfall 1: 6/8 Duration Vocabulary
**What goes wrong:** Using `'q.'` or non-standard VexFlow notation for dotted quarter in 6/8 context.
**Why it happens:** VexFlow uses `'qd'` for dotted quarter. The existing units all use `'qd'`, `'hd'` etc.
**How to avoid:** Use the exact strings from existing units: `'qd'` (dotted quarter = 1 compound beat in 6/8), `'8'` (eighth), `'q'` (quarter = 2 eighth-notes in 6/8). All three fit evenly within a 6/8 measure's 12 sixteenth-unit space.
**Warning signs:** If `rhythmGenerator` produces malformed measures, the `validateBinaryPattern` check in RhythmPatternGenerator.js will log a fallback warning at runtime.

### Pitfall 2: Syncopation Pattern Strings
**What goes wrong:** Using incorrect pattern name strings in `patterns` / `rhythmPatterns` arrays.
**Why it happens:** These are informal label strings passed through to the generator — they're not validated at build time, but must match what RhythmPatternGenerator recognizes.
**How to avoid:** The `getDurationValue()` method in RhythmPatternGenerator maps: `'dotted-quarter'` → 6, `'eighth'` → 2, `'quarter'` → 4. The eighth-quarter-eighth syncopation pattern is `['eighth', 'quarter', 'eighth']` which represents a note on the off-beat, a note tied across the beat, and another off-beat note.
**Warning signs:** Unexpected pattern generation at runtime — check browser console for "Could not load patterns" or generator fallback warnings.

### Pitfall 3: Prerequisite Chain Integrity
**What goes wrong:** Referencing `boss_rhythm_7` in Unit 8 before that ID is defined in Unit 7.
**Why it happens:** Both files are authored in the same phase; if Unit 7's boss ID is spelled differently, `validateTrail.mjs` will throw ERROR on missing prerequisite.
**How to avoid:** Confirm boss ID spelling: Unit 7 boss = `'boss_rhythm_7'`, Unit 8 boss = `'boss_rhythm_8'`. First node of Unit 8 must use `prerequisites: ['boss_rhythm_7']`.
**Warning signs:** `npm run verify:patterns` exits with code 1 citing "Missing prerequisite".

### Pitfall 4: Mini-Boss vs Boss Distinction
**What goes wrong:** Setting `nodeType: NODE_TYPES.BOSS` on the Unit 7 terminus instead of `NODE_TYPES.MINI_BOSS`.
**Why it happens:** CONTEXT.md clearly says Unit 7 ends with a Mini-Boss, not a true Boss. The distinction matters for trail visual rendering and for `isBoss` flag which affects XP awarding.
**How to avoid:** Unit 7 final node: `nodeType: NODE_TYPES.MINI_BOSS`, `isBoss: false`. Unit 8 final node: `nodeType: NODE_TYPES.BOSS`, `isBoss: true`.
**Warning signs:** Trail map displays wrong icon (crown vs trophy); VictoryScreen XP logic may differ.

### Pitfall 5: Missing validateTrail Fields
**What goes wrong:** Build-time validation fails due to missing `prerequisites` array or invalid `nodeType`.
**Why it happens:** `validateTrail.mjs` checks: (1) all prerequisite IDs exist in SKILL_NODES, (2) no cycles, (3) valid nodeType strings, (4) unique IDs. Since Phase 11 wires the files into expandedNodes.js, running `verify:patterns` locally requires manually adding the import in expandedNodes.js first — or treating validation as a Phase 11 gate.
**How to avoid:** Author all 14 nodes with correct IDs, prerequisites, and NODE_TYPES values. Double-check the boss IDs match exactly between Unit 7 export and Unit 8 prerequisite reference.

---

## Code Examples

Verified patterns from existing source files:

### 6/8 Discovery Node (very slow, dotted-quarter only)
```javascript
// Following pattern from rhythmUnit6Redesigned.js, node 1
// 6/8-specific: timeSignature '6/8', very slow tempo, dotted-quarter only
{
  id: 'rhythm_7_1',
  name: 'Two Big Beats',
  description: 'Feel 1-2-3, 1-2-3 — two big beats per measure',
  category: CATEGORY,
  unit: 7,
  unitName: UNIT_NAME,
  order: 142,
  orderInUnit: 1,
  prerequisites: ['boss_rhythm_6'],
  nodeType: NODE_TYPES.DISCOVERY,
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    durations: ['qd'],
    focusDurations: ['qd'],
    contextDurations: [],
    patterns: ['dotted-quarter'],
    tempo: { min: 55, max: 60, default: 58 },
    pitch: 'C4',
    timeSignature: '6/8'
  },
  newContent: NEW_CONTENT_TYPES.RHYTHM,
  newContentDescription: '6/8 Time: Two big beats per bar',
  exercises: [{
    type: EXERCISE_TYPES.RHYTHM,
    config: {
      rhythmPatterns: ['dotted-quarter'],
      tempo: 58,
      measuresPerPattern: 1,
      timeSignature: '6/8',
      difficulty: 'beginner'
    }
  }],
  skills: ['68_compound_meter'],
  xpReward: 75,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Syncopation Discovery Node (eighth-quarter-eighth)
```javascript
// Source pattern: rhythmUnit6Redesigned.js node 1 structure, adapted for syncopation
{
  id: 'rhythm_8_1',
  name: 'Off-Beat Magic',
  description: 'Learn to tap between the beats',
  category: CATEGORY,
  unit: 8,
  unitName: UNIT_NAME,
  order: 149,
  orderInUnit: 1,
  prerequisites: ['boss_rhythm_7'],
  nodeType: NODE_TYPES.DISCOVERY,
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.VARIED,
    durations: ['8', 'q'],
    focusDurations: ['8'],          // eighth-quarter-eighth is the focus
    contextDurations: ['q'],
    patterns: ['eighth', 'quarter', 'eighth'],
    tempo: { min: 65, max: 70, default: 67 },
    pitch: 'C4',
    timeSignature: '4/4'
  },
  newContent: NEW_CONTENT_TYPES.RHYTHM,
  newContentDescription: 'Syncopation: Tap between the beats!',
  exercises: [{
    type: EXERCISE_TYPES.RHYTHM,
    config: {
      rhythmPatterns: ['eighth', 'quarter', 'eighth'],
      tempo: 67,
      measuresPerPattern: 1,
      timeSignature: '4/4',
      difficulty: 'intermediate'
    }
  }],
  skills: ['syncopation_eighth_quarter'],
  xpReward: 75,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Unit 7 Mini-Boss Node
```javascript
// Unit 7 terminus: MINI_BOSS, NOT BOSS; isBoss: false
{
  id: 'boss_rhythm_7',           // ID follows boss_rhythm_{unit} convention
  name: 'Compound Commander',
  description: 'Prove you can feel the compound beat!',
  unlockHint: 'Complete all 6/8 lessons to unlock this challenge!',
  category: 'boss',              // CRITICAL: 'boss' category, not 'rhythm'
  unit: 7,
  unitName: UNIT_NAME,
  order: 148,                    // START_ORDER(142) + 6 = 148
  orderInUnit: 7,
  prerequisites: ['rhythm_7_6'],
  nodeType: NODE_TYPES.MINI_BOSS, // NOT NODE_TYPES.BOSS
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.ALL,
    durations: ['qd', 'q', '8'],
    focusDurations: [],
    contextDurations: ['qd', 'q', '8'],
    patterns: ['dotted-quarter', 'quarter', 'eighth'],
    tempo: { min: 80, max: 90, default: 85 },
    pitch: 'C4',
    timeSignature: '6/8'
  },
  newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
  newContentDescription: '6/8 Mastery Check',
  exercises: [{
    type: EXERCISE_TYPES.RHYTHM,
    config: {
      rhythmPatterns: ['dotted-quarter', 'quarter', 'eighth'],
      tempo: 85,
      measuresPerPattern: 2,
      timeSignature: '6/8',
      difficulty: 'advanced',
      questionCount: 10
    }
  }],
  skills: ['68_compound_meter', 'dotted_quarter_note', 'eighth_note'],
  xpReward: 150,                // Mini-boss: between regular (90) and true boss (200+)
  accessoryUnlock: 'compound_badge',
  isBoss: false,                // MINI_BOSS does NOT set isBoss: true
  isReview: false,
  reviewsUnits: []
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SIX_EIGHT.beats = 6 | SIX_EIGHT.beats = 2, subdivisions: 6 | Phase 09 (2026-03-18) | RhythmPatternGenerator now correctly generates 2-compound-beat patterns; count-in uses 2 measures |
| Manual beam grouping | beamGroupsForTimeSignature helper with 3+3 eighth grouping | Phase 09 (2026-03-18) | 6/8 beams display correctly in MetronomeDisplay |
| Simple time count-in | Compound count-in: `beats * 2` for 6/8 | Phase 09 | MetronomeTrainer gives 2 full measures of count-in in 6/8 to help feel the dotted-quarter pulse |

**Deprecated/outdated:**
- `beats: 6` in SIX_EIGHT: replaced in Phase 09; any old test data or documentation referencing 6 beats should be ignored

---

## Open Questions

1. **MetronomeTrainer timeSignature routing for multi-exercise boss**
   - What we know: `handleNextExercise` reads `nextExercise.config.timeSignature` and passes it through to `getTimeSignatureObject()`. The mapping includes `'6/8' → TIME_SIGNATURES.SIX_EIGHT`.
   - What's unclear: Whether a boss node that switches time signature mid-session (6/8 exercise 1, 4/4 exercise 2) correctly resets the metronome and visual display between exercises via the same `replace: true` + reload pattern used for same-route navigation.
   - Recommendation: Research flag from STATE.md notes "Phase 10 (syncopation tap windows): Confirm MetronomeTrainer tap evaluator uses event-level windows for off-beat events." The `evaluatePerformance` code (lines 826-943) was verified: it computes `expectedBeatPositions` from every `1` in the binary pattern array, regardless of on-beat/off-beat position, using `calculateTimingThresholds`. This is event-level evaluation. The open question is the multi-time-signature exercise transition — the planner should include a manual test step for the boss node.

2. **`questionCount` field in exercise config**
   - What we know: The Unit 6 boss uses `questionCount: 15` in its exercise config. Regular nodes do not set questionCount (MetronomeTrainer defaults to 10 exercises).
   - What's unclear: Whether `questionCount` in the exercise config is actually consumed by MetronomeTrainer or whether it's cosmetic. MetronomeTrainer reads `trailSettings.totalExercises: 10` (hardcoded line 215), not from `nodeConfig`.
   - Recommendation: The 15-question boss spec in CONTEXT.md may need MetronomeTrainer support. The planner should either (a) use 10 questions (safe, existing behavior) or (b) check whether a `questionCount` prop wires through. Since Phase 10 is data-only, if `questionCount` is not consumed, noting this for Phase 11 review is sufficient.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (no explicit version pinned in package.json — uses workspace version) |
| Config file | No separate vitest.config — uses vite.config.js |
| Quick run command | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RADV-01 | 6/8 discovery node data has correct shape and prerequisite chain | unit (data validation) | `npm run verify:patterns` | ✅ (validateTrail.mjs) |
| RADV-02 | 6/8 practice nodes have valid IDs, prereqs, and 6/8 timeSignature | unit (data validation) | `npm run verify:patterns` | ✅ |
| RADV-03 | Syncopation nodes have valid IDs, prereqs, and 4/4 timeSignature | unit (data validation) | `npm run verify:patterns` | ✅ |
| RADV-04 | Boss node has correct ID, isBoss: true, multi-exercise array, 250 XP | unit (data validation) | `npm run verify:patterns` | ✅ |

**Note:** `verify:patterns` only runs after Phase 11 wires the files into `expandedNodes.js`. During Phase 10, the data files exist but are not imported; validation must be done by manual import or held for Phase 11.

**Manual smoke test (highest value for Phase 10):**
1. Temporarily add imports to `expandedNodes.js` locally (do not commit)
2. Run `npm run verify:patterns` — confirm zero errors
3. Revert the temporary import
4. Phase 11 will perform the permanent wire-up

### Sampling Rate
- **Per task commit:** Confirm file is syntactically valid JS (`node --check src/data/units/rhythmUnit7Redesigned.js`)
- **Per wave merge:** Manual import + `npm run verify:patterns`
- **Phase gate:** Full trail validation green before Phase 11 starts

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. No new test files needed for this phase (pure data authoring; structural validation is already in validateTrail.mjs).

---

## Sources

### Primary (HIGH confidence)
- `src/data/units/rhythmUnit6Redesigned.js` — Canonical template; every field, import, pattern, and ID convention verified
- `src/data/nodeTypes.js` — All NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES values verified
- `src/data/constants.js` — EXERCISE_TYPES.RHYTHM verified
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — SIX_EIGHT definition (beats:2, subdivisions:6, measureLength:12, isCompound:true) verified; getDurationValue() mapping verified; getTimeSignatureDefinition() supports '6/8' verified
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — getTimeSignatureObject() mapping verified (line 169-177); evaluatePerformance() event-level tap evaluation verified (lines 826-943); multi-exercise routing via handleNextExercise verified (lines 228-268)
- `src/data/skillTrail.js` — UNITS structure verified (RHYTHM_1 through RHYTHM_4 only; RHYTHM_7 and RHYTHM_8 needed in Phase 11); SKILL_NODES sourced entirely from expandedNodes.js confirmed
- `src/data/expandedNodes.js` — Import/export pattern verified; Phase 11 will add rhythmUnit7Nodes and rhythmUnit8Nodes
- `scripts/validateTrail.mjs` — Validation rules verified: prereq chains, nodeType values, duplicate IDs, XP economy
- `.planning/milestones/v1.7-phases/10-advanced-rhythm-node-data/10-CONTEXT.md` — All locked decisions
- `.planning/STATE.md` — Phase 09 completion status confirmed; research flag about tap windows addressed

### Secondary (MEDIUM confidence)
- Music theory consensus: 6/8 "feels in 2" compound meter; dotted-quarter as one beat; eighth note as subdivision — standard pedagogical framing for children
- Pedagogical principle: discovery node before performance node matches Duolingo-style scaffolding; confirmed by existing units 1-6 all using Discovery → Practice → ... pattern

### Tertiary (LOW confidence)
- XP value for mini-boss (150 recommended): extrapolated from Unit 6 boss (200) and regular node ceiling (90). Not verified against any design doc. Planner should confirm or adjust.
- `questionCount` in exercise config: observed in Unit 6 boss node but MetronomeTrainer hardcodes `totalExercises: 10`. The field may be ignored at runtime.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are in-project; no external dependencies
- Architecture: HIGH — directly verified from rhythmUnit6Redesigned.js template and MetronomeTrainer source
- Pitfalls: HIGH — directly observed from validator source and MetronomeTrainer evaluation code
- Boss multi-exercise transition: MEDIUM — routing code verified, but multi-time-signature transition not end-to-end tested

**Research date:** 2026-03-19
**Valid until:** Stable indefinitely — this is internal code, not a third-party API. Valid until MetronomeTrainer or expandedNodes.js is refactored.
