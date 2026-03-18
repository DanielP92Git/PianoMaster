# Phase 08: Key Signature Node Data — Research

**Researched:** 2026-03-18
**Domain:** Trail node data authoring — key signature nodes for treble and bass clef paths
**Confidence:** HIGH — all findings verified directly from codebase source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Node structure per key:** 2 nodes per key (1 Discovery + 1 Practice). Unit 6: G + D = 4 nodes. Unit 7: A + F + Bb + Eb + 1 Memory Mix-Up + 1 Boss = 10 nodes. Total per clef path: 14 nodes (~28 total across treble + bass).
- **Exercise types:** Primary: Sight reading only. Memory game in Unit 7 Mix-Up node. Note Recognition explicitly excluded.
- **Discovery nodes:** "Meet G Major", "Meet D Major", etc. Exercise: 8 patterns, 1 measure, quarter notes only, full in-key octave. `newContent: NEW_CONTENT_TYPES.NOTE`, `newContentDescription: 'Key of G Major (1♯)'` etc. `nodeType: NODE_TYPES.DISCOVERY`.
- **Practice nodes:** 10 patterns, 1–2 measures, quarters + halves (MEDIUM rhythm). `nodeType: NODE_TYPES.PRACTICE`.
- **Note pools:** Full in-key octave — treble: C4–C5 filtered to key, bass: C3–C4 filtered to key. `filterNotesToKey()` handles filtering automatically. Each exercise config includes `keySignature: 'G'` (etc.) field.
- **Difficulty progression:** SIMPLE for Discovery (60–70 bpm), MEDIUM for Practice (65–80 bpm), VARIED for Boss. No double-stacking tempo/rhythm on harder keys.
- **Boss challenge:** 3 exercises: (1) sharp keys mixed (G+D+A), (2) flat keys mixed (F+Bb+Eb), (3) all 6 keys mixed. 2 measures per pattern. 150 XP reward. Bass boss mirrors treble exactly with C3–C4 range.
- **Unit metadata:** Treble Unit 6: "Key Signatures: Sharps" (G, D). Treble Unit 7: "Key Signatures: Mixed" (A, F, Bb, Eb + memory + boss). Bass mirrors treble naming with bass clef range.
- **All nodes premium-only.** No additions to FREE_NODE_IDS.
- **Bass clef mirroring:** Bass units mirror treble units exactly in structure, naming, node types, difficulty params. Only difference: clef = 'bass', note pools use C3–C4 range.

### Claude's Discretion

- Exact `order` and `START_ORDER` values for new units (must follow existing numbering)
- Prerequisite chain details (which boss unlocks Unit 6)
- Memory game note pool composition and grid size
- How the "mixed keys" boss exercises handle per-exercise key signature assignment
- Whether memory game needs key signature glyph support on cards (may be out of scope)

### Deferred Ideas (OUT OF SCOPE)

- **Key signature in Note Recognition game** — Explicitly out of scope per requirements (key sig is staff-level concept)
- **Minor key signatures** — Explicitly out of scope
- **Memory game key signature glyph on cards** — May need investigation; if not feasible, memory node uses note pools without key sig display
- **Out-of-key naturals in exercises** — Natural signs when deviating from key; future phases
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TREB-01 | G major (1 sharp) treble nodes with discovery scaffolding | `filterNotesToKey(['C4','D4','E4','F4','G4','A4','B4','C5'], 'G')` yields `['C4','D4','E4','F4','G4','A4','B4','C5']` (all 8 notes valid — F stays on the F line; key sig renders the sharp). `keySignature: 'G'` in exercise config. |
| TREB-02 | D major (2 sharps) treble nodes | Note pool: `['C4','D4','E4','F4','G4','A4','B4','C5']` + `keySignature: 'D'`. filterNotesToKey keeps all — F and C natural kept (staff positions valid via key sig). |
| TREB-03 | A major (3 sharps) treble nodes | Note pool: same C4–C5 octave + `keySignature: 'A'`. filterNotesToKey keeps all 8. |
| TREB-04 | F major (1 flat) treble nodes | Note pool: `['C4','D4','E4','F4','G4','A4','B4','C5']` + `keySignature: 'F'`. B natural kept (Bb staff position). |
| TREB-05 | Bb major (2 flats) treble nodes | Note pool: same + `keySignature: 'Bb'`. E and B naturals kept (staff positions valid). |
| TREB-06 | Eb major (3 flats) treble nodes | Note pool: same + `keySignature: 'Eb'`. E, A, B naturals kept. |
| TREB-07 | Treble key signatures boss challenge (all 6 keys mixed) | 3 separate exercises with `keySignature` assigned per exercise. See Architecture Patterns. |
| BASS-01 | G major (1 sharp) bass nodes | Note pool: `['C3','D3','E3','F3','G3','A3','B3','C4']` + `keySignature: 'G'`. Mirrors TREB-01. |
| BASS-02 | D major (2 sharps) bass nodes | Same C3–C4 pool + `keySignature: 'D'`. |
| BASS-03 | A major (3 sharps) bass nodes | Same C3–C4 pool + `keySignature: 'A'`. |
| BASS-04 | F major (1 flat) bass nodes | Same C3–C4 pool + `keySignature: 'F'`. |
| BASS-05 | Bb major (2 flats) bass nodes | Same C3–C4 pool + `keySignature: 'Bb'`. |
| BASS-06 | Eb major (3 flats) bass nodes | Same C3–C4 pool + `keySignature: 'Eb'`. |
| BASS-07 | Bass key signatures boss challenge (all 6 keys mixed) | Same 3-exercise structure as treble boss with bass clef and C3–C4 range. |
</phase_requirements>

---

## Summary

Phase 08 is a pure data-authoring phase. The infrastructure was fully built in Phase 07 (VexFlow key signature glyphs, accidental suppression, `filterNotesToKey`, pipeline). This phase creates four new unit files: `trebleUnit6Redesigned.js`, `trebleUnit7Redesigned.js`, `bassUnit6Redesigned.js`, `bassUnit7Redesigned.js`. All files follow the exact same structure as the Phase 03 redesigned units (trebleUnit5Redesigned.js is the canonical template).

The critical new field is `keySignature` added to each exercise's `config` object. `TrailNodeModal.navigateToExercise()` already reads `exercise.config?.keySignature ?? null` and passes it through the navigation state. `SightReadingGame.jsx` reads it as `trailKeySignature` and applies it to `gameSettings.keySignature`. The pipeline is complete and verified — Phase 08 only needs the node data files.

The `validateTrail.mjs` script checks prerequisite chains, node types, duplicate IDs, and XP economy. It does NOT validate `noteConfig` or `keySignature` fields, so unknown fields in exercise config are safe. `npm run verify:patterns` runs `validateTrail.mjs` and must pass with zero errors.

**Primary recommendation:** Author four unit files following the trebleUnit5Redesigned.js template. Add `keySignature: 'G'` (etc.) to each `SIGHT_READING` exercise config. Do not touch expandedNodes.js or skillTrail.js — that is Phase 11.

---

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|---|---|---|---|
| Node.js data files | — | Trail unit definitions in `src/data/units/` | Established pattern across all 10 existing unit files |
| `NODE_TYPES` | local | Discovery, Practice, MIX_UP, BOSS enum values | Must use; validator checks nodeType field |
| `RHYTHM_COMPLEXITY` | local | SIMPLE, MEDIUM, VARIED constants | Used in all existing unit files |
| `NEW_CONTENT_TYPES` | local | NOTE, CHALLENGE_TYPE, NONE enum values | Required for TrailNode UI rendering |
| `EXERCISE_TYPES` | local | SIGHT_READING, MEMORY_GAME enum values | TrailNodeModal routes on this value |

### Imports Required in Each New Unit File
```javascript
import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';
```

No npm packages needed — this phase is purely declarative data authoring.

---

## Architecture Patterns

### Recommended Project Structure

New files to create:
```
src/data/units/
├── trebleUnit6Redesigned.js   # Key Signatures: Sharps (G, D major)
├── trebleUnit7Redesigned.js   # Key Signatures: Mixed (A, F, Bb, Eb + memory + boss)
├── bassUnit6Redesigned.js     # Key Signatures: Sharps, bass range
└── bassUnit7Redesigned.js     # Key Signatures: Mixed, bass range
```

expandedNodes.js and skillTrail.js are NOT touched in Phase 08 (Phase 11 handles wiring).

### Pattern 1: Order Numbering (Discretion Area)

**Treble Unit 5** ends at `START_ORDER + 9 = 35 + 9 = 44`.
Therefore:
- **Treble Unit 6** `START_ORDER = 45` (nodes 45–48, 4 nodes)
- **Treble Unit 7** `START_ORDER = 49` (nodes 49–58, 10 nodes)

**Bass Unit 5** ends at `START_ORDER + 9 = 84 + 9 = 93`.
Therefore:
- **Bass Unit 6** `START_ORDER = 94` (nodes 94–97, 4 nodes)
- **Bass Unit 7** `START_ORDER = 98` (nodes 98–107, 10 nodes)

### Pattern 2: Prerequisite Chain (Discretion Area)

Unit 6 first node requires the Unit 5 accidentals boss:
- Treble Unit 6 Node 1 prerequisite: `['boss_treble_accidentals']`
- Bass Unit 6 Node 1 prerequisite: `['boss_bass_accidentals']`

This is consistent with the existing pattern: each unit's first node requires the previous unit's final boss.

Linear chain within each unit:
```
treble_6_1 (G Discovery) → treble_6_2 (G Practice) → treble_6_3 (D Discovery) → treble_6_4 (D Practice)
→ treble_7_1 (A Discovery) → treble_7_2 (A Practice) → ... → treble_7_8 (Eb Practice)
→ treble_7_9 (Key Sig Memory Mix-Up) → boss_treble_keysig (Key Signatures Boss)
```

### Pattern 3: Discovery Node Structure

```javascript
// Source: trebleUnit5Redesigned.js (template)
{
  id: 'treble_6_1',
  name: 'Meet G Major',
  description: 'Discover the key of G major — one sharp on every F',
  category: CATEGORY,                     // 'treble_clef'
  unit: UNIT_ID,                          // 6
  unitName: UNIT_NAME,                    // 'Key Signatures: Sharps'
  order: START_ORDER,                     // 45
  orderInUnit: 1,
  prerequisites: ['boss_treble_accidentals'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],  // Full octave; key sig handles the sharp
    focusNotes: [],                        // No single focus note — the KEY is the new concept
    contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    clef: 'treble',
    ledgerLines: false,
    accidentals: false                     // Key sig handles accidentals, not explicit notePool accidentals
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },

  newContent: NEW_CONTENT_TYPES.NOTE,
  newContentDescription: 'Key of G Major (1♯)',

  exercises: [
    {
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        patternCount: 8,                   // 8 patterns for Discovery
        measuresPerPattern: 1,
        clef: 'treble',
        timeSignature: '4/4',
        keySignature: 'G',                 // CRITICAL: this is the new field
        rhythmPatterns: ['quarter'],
        tempo: 65
      }
    }
  ],

  skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Pattern 4: Practice Node Structure

```javascript
{
  id: 'treble_6_2',
  name: 'G Major Practice',
  description: 'Read music in G major — watch for that sharp F!',
  category: CATEGORY,
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + 1,
  orderInUnit: 2,
  prerequisites: ['treble_6_1'],

  nodeType: NODE_TYPES.PRACTICE,

  noteConfig: {
    notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    focusNotes: [],
    contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    clef: 'treble',
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 65, max: 80, default: 72 }
  },

  newContent: NEW_CONTENT_TYPES.NONE,
  newContentDescription: 'G Major Practice',

  exercises: [
    {
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        patternCount: 10,                  // 10 patterns for Practice
        measuresPerPattern: 2,             // 1-2 measures
        clef: 'treble',
        timeSignature: '4/4',
        keySignature: 'G',
        rhythmPatterns: ['quarter', 'half'],
        tempo: 72
      }
    }
  ],

  skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  xpReward: 50,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Pattern 5: Boss Node with Multi-Exercise Key Assignment (Discretion Area)

The boss has 3 exercises with different `keySignature` values per exercise. `TrailNodeModal.navigateToExercise()` reads `exercise.config?.keySignature` per-exercise, so each exercise independently sets the active key.

```javascript
{
  id: 'boss_treble_keysig',
  name: 'Key Signature Master',
  description: 'Face all 6 key signatures in one epic challenge!',
  unlockHint: 'Complete all key signature lessons to unlock this challenge!',
  category: 'boss',                        // String literal, not CATEGORY constant
  unit: UNIT_ID,                           // 7
  unitName: UNIT_NAME,
  order: START_ORDER + 9,                  // Last in unit
  orderInUnit: 10,
  prerequisites: ['treble_7_9'],           // After memory mix-up

  nodeType: NODE_TYPES.BOSS,

  noteConfig: {
    notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    focusNotes: [],
    contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    clef: 'treble',
    ledgerLines: false,
    accidentals: false
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.VARIED,
    allowedDurations: ['q', 'h', '8'],
    patterns: ['quarter', 'half', 'eighth'],
    tempo: { min: 70, max: 90, default: 80 }
  },

  newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
  newContentDescription: 'Key Signatures Boss',

  exercises: [
    {
      // Exercise 1: Sharp keys (G, D, A mixed)
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        patternCount: 5,
        measuresPerPattern: 2,
        clef: 'treble',
        timeSignature: '4/4',
        keySignature: 'A',               // Hardest sharp key covers G+D+A (3 sharps = superset)
        rhythmPatterns: ['quarter', 'half'],
        tempo: 80
      }
    },
    {
      // Exercise 2: Flat keys (F, Bb, Eb mixed)
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        patternCount: 5,
        measuresPerPattern: 2,
        clef: 'treble',
        timeSignature: '4/4',
        keySignature: 'Eb',              // Hardest flat key (3 flats = superset of F+Bb)
        rhythmPatterns: ['quarter', 'half'],
        tempo: 80
      }
    },
    {
      // Exercise 3: All 6 keys mixed — one key at a time per pattern
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        patternCount: 6,
        measuresPerPattern: 2,
        clef: 'treble',
        timeSignature: '4/4',
        keySignature: 'G',               // Planner to decide: single key or rotation (see Open Questions)
        rhythmPatterns: ['quarter', 'half'],
        tempo: 80
      }
    }
  ],

  skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  xpReward: 150,
  accessoryUnlock: null,
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

### Pattern 6: Memory Mix-Up Node (Discretion Area)

The memory game node does not use `keySignature` in the exercise config (MEMORY_GAME exercise type uses piano keyboard matching, not staff reading). Uses the full in-key note pool for note matching.

```javascript
{
  id: 'treble_7_9',
  name: 'Key Sig Memory Mix-Up',
  description: 'Match notes from all 6 key signatures',
  nodeType: NODE_TYPES.MIX_UP,
  exercises: [
    {
      type: EXERCISE_TYPES.MEMORY_GAME,
      config: {
        notePool: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],  // Mixed-key pool
        gridSize: '4x4',
        clef: 'treble',
        timeLimit: 180
      }
    }
  ],
  xpReward: 60
}
```

Note: The memory game's key sig glyph display is deferred. The MEMORY_GAME exercise config has no `keySignature` field — this is intentional and safe.

### Pattern 7: Bass Clef Note Pools (C3–C4 range)

All bass unit note pools use the C3–C4 octave:

```javascript
// Bass Discovery/Practice note pool (full octave)
const BASS_FULL_OCTAVE = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];

// For keys with flats — natural pool (filterNotesToKey handles mapping)
// Same pool, keySignature does the filtering at runtime
```

The C3–C4 range mirrors the C4–C5 treble range. All 8 natural notes are valid in any of the 6 key signatures when using the staff-position approach (same as treble).

### Pattern 8: Key-Specific newContentDescription Values

| Key | newContentDescription |
|-----|-----------------------|
| G major | `'Key of G Major (1♯)'` |
| D major | `'Key of D Major (2♯)'` |
| A major | `'Key of A Major (3♯)'` |
| F major | `'Key of F Major (1♭)'` |
| Bb major | `'Key of B♭ Major (2♭)'` |
| Eb major | `'Key of E♭ Major (3♭)'` |

Unicode: `♯` = U+266F, `♭` = U+266D. Use these directly in string literals.

### Anti-Patterns to Avoid

- **Do NOT add `accidentals: true` to noteConfig for key sig nodes.** Key signature nodes use the key sig glyph to imply accidentals, not explicit in-pool accidental spellings. The `accidentals: true` flag was specific to the Phase 03 accidentals units (Bb4, Eb4, etc.).
- **Do NOT use NOTE_RECOGNITION exercise type.** These are sight reading nodes. NOTE_RECOGNITION is excluded per requirements.
- **Do NOT put sharp/flat note spellings in the notePool.** The pool should be natural names (`'F4'` not `'F#4'`). The key signature + `filterNotesToKey`/`mapNoteToKey` handles the rendering. Exception: if the generated patterns include the explicit accidental form, VexFlow accidental suppression handles it via `applyAccidentals`.
- **Do NOT touch `FREE_NODE_IDS` in subscriptionConfig.js.** All new nodes are premium. The default-deny gate applies automatically to any node ID not in `FREE_NODE_IDS`.
- **Do NOT wire new units into expandedNodes.js.** Phase 11 handles integration. New unit files are authored but not yet imported anywhere.
- **Do NOT add NEW_CONTENT_TYPES.KEY_SIGNATURE** — this enum value does not exist. Use `NEW_CONTENT_TYPES.NOTE` for Discovery nodes (per CONTEXT.md decision).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-key note filtering | Manual per-key note lists | `filterNotesToKey(pool, keySignature)` from Phase 07 | Already implemented, tested, handles all 6 keys |
| Accidental mapping | Custom F→F# substitution | `mapNoteToKey(pitch, keySignature)` | Already implemented with full test coverage |
| Note pool construction | Hard-coding `['G4','A4','B4','C5','D5','E5','F#5']` | Use natural octave `['C4','D4','E4','F4','G4','A4','B4','C5']` + `keySignature` | The `patternBuilder` calls `filterNotesToKey` at pattern generation time; explicit accidental pools bypass the key sig system |
| Prerequisite linking | Runtime linking code | Declare prerequisites statically in each node | All existing units use static prerequisites; `linkUnitPrerequisites` in expandedNodes.js is a no-op |

**Key insight:** The only new field required vs. existing unit patterns is `keySignature` inside each SIGHT_READING exercise config. Everything else (enums, field names, ordering conventions, boss structure) is identical to prior units.

---

## Common Pitfalls

### Pitfall 1: keySignature in Wrong Location

**What goes wrong:** Putting `keySignature` in `noteConfig` instead of `exercises[n].config`.
**Why it happens:** `noteConfig` is the node-level metadata; `exercises[n].config` is what `TrailNodeModal` reads when building `navState`.
**How to avoid:** Verified from `TrailNodeModal.jsx` line 184: `keySignature: exercise.config?.keySignature ?? null`. Always put `keySignature` inside `exercises[n].config`, not in `noteConfig`.
**Warning sign:** If `trailKeySignature` in SightReadingGame is always null, the field is in the wrong location.

### Pitfall 2: START_ORDER Collision

**What goes wrong:** Reusing an order value already taken by another unit, causing silent visual overlap on the trail map.
**Why it happens:** Order values are global across all units in a category (treble, bass).
**How to avoid:** Treble Unit 6 `START_ORDER = 45` (Unit 5 ends at 44). Treble Unit 7 `START_ORDER = 49` (Unit 6 ends at 48 with 4 nodes: 45, 46, 47, 48). Bass Unit 6 `START_ORDER = 94`. Bass Unit 7 `START_ORDER = 98`. These are confirmed from reading the existing files.
**Warning sign:** The validateTrail script does not check for order collisions (only ID collisions), so manual verification is required.

### Pitfall 3: Boss category Field

**What goes wrong:** Using `category: CATEGORY` (which is `'treble_clef'`) for boss nodes instead of `category: 'boss'`.
**Why it happens:** Non-boss nodes use the `CATEGORY` constant; boss nodes must use the string literal.
**How to avoid:** Boss nodes in trebleUnit5Redesigned.js line 497 use `category: 'boss'` explicitly. Follow the same pattern.

### Pitfall 4: Wrong Prerequisite for Unit 6 First Node

**What goes wrong:** Pointing Unit 6 Node 1 at `boss_treble_5` instead of `boss_treble_accidentals`.
**Why it happens:** Unit 5 has two bosses; `boss_treble_accidentals` (order 44) is the actual terminal node.
**How to avoid:** The final node in trebleUnit5Redesigned.js is `boss_treble_accidentals` at `START_ORDER + 9 = 44`. That is the prerequisite for `treble_6_1`. Similarly, `boss_bass_accidentals` is the prerequisite for `bass_6_1`.

### Pitfall 5: validateTrail keySignature False Alarm

**STATE.md research flag:** "Check whether `validateTrail.mjs` rejects unknown `keySignature` fields in `noteConfig`."
**Finding (verified):** `validateTrail.mjs` reads from `SKILL_NODES` (which comes from `expandedNodes.js`). Since Phase 08 does NOT wire new units into `expandedNodes.js`, the validator never sees the new nodes. `npm run verify:patterns` will continue to pass with zero errors regardless of what fields the new unit files contain.
**When units ARE wired in Phase 11:** The validator only checks `id`, `nodeType`, `prerequisites`, and XP economy. It does NOT validate `noteConfig`, `rhythmConfig`, or `exercises[n].config` fields. `keySignature` in exercise config is safe and will not cause a validation error.

### Pitfall 6: Boss Exercise Count for Mixed Keys

**What goes wrong:** Defining a single exercise with `keySignature` for the "all 6 keys" boss, when the intent is to cycle through all 6 keys.
**Why it happens:** The game engine presents one `keySignature` value per exercise invocation — it does not cycle keys within a single exercise call.
**How to avoid:** Use 3 separate exercises in the boss node (one per key group as locked in CONTEXT.md). The `keySignature` value per exercise determines which key that exercise plays in. See Open Questions for the multi-key-per-exercise question.

---

## Code Examples

### Verified: keySignature Pipeline (source: TrailNodeModal.jsx line 184)

```javascript
// TrailNodeModal.navigateToExercise()
const navState = {
  nodeId: node.id,
  nodeConfig: exercise.config,
  exerciseIndex: exerciseIndex,
  totalExercises: totalExercises,
  exerciseType: exercise.type,
  enableSharps,
  enableFlats,
  keySignature: exercise.config?.keySignature ?? null,  // Reads from exercise config
};
```

### Verified: SightReadingGame keySignature consumption (source: SightReadingGame.jsx line 176, 309)

```javascript
const trailKeySignature = location.state?.keySignature ?? null;

// Applied in auto-config effect:
keySignature: trailKeySignature,
```

### Verified: filterNotesToKey behavior for key sig node pools

```javascript
// From keySignatureUtils.test.js (all passing):
filterNotesToKey(['C4', 'D4', 'E4', 'F4', 'F#4'], 'G')
// → ['C4', 'D4', 'E4', 'F4', 'F#4']  (F natural kept — staff position valid via key sig)

filterNotesToKey(['C4', 'Bb4', 'Eb5'], 'Bb')
// → ['C4', 'Bb4', 'Eb5']  (all valid in Bb major)
```

### Verified: Note pool for key sig nodes (derived from KEY_NOTE_LETTERS)

All 8 natural notes C–C pass through `filterNotesToKey` unchanged for all 6 key signatures, because:
- Sharp keys (G, D, A): natural notes use the staff position; the key sig glyph applies the sharp
- Flat keys (F, Bb, Eb): same — natural notes land on the staff line; key sig glyph applies the flat

This means the `notePool` in all key sig nodes is simply `['C4','D4','E4','F4','G4','A4','B4','C5']` (treble) or `['C3','D3','E3','F3','G3','A3','B3','C4']` (bass), with `keySignature` carrying the tonal context.

### Verified: Unit 5 boss IDs to use as prerequisites

```javascript
// trebleUnit5Redesigned.js line 563:
id: 'boss_treble_accidentals'  // This is the terminal Unit 5 node (order 44)

// bassUnit5Redesigned.js line 562:
id: 'boss_bass_accidentals'    // This is the terminal Unit 5 node (order 93)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| No key signature in node data | `keySignature` field in `exercises[n].config` | Phase 07 pipeline built | Existing units have no `keySignature` field; Phase 08 is the first to use it |
| Only NOTE_RECOGNITION + MEMORY_GAME in redesigned units | SIGHT_READING as primary exercise type | Phase 08 (key sig = staff concept) | Discovery/Practice nodes use SIGHT_READING, not NOTE_RECOGNITION |
| expandedNodes.js wired same phase as authoring | Unit files authored first, wired in Phase 11 | Phase 03 pattern | New unit files are standalone JS modules with no import of them yet |

**Not deprecated:** The `accidentals: true` noteConfig field is still used by accidentals units (Units 4–5). Key sig units use `accidentals: false` because the key sig glyph handles accidentals implicitly. Both patterns coexist.

---

## Open Questions

1. **Boss Exercise 3: single key vs. rotation across all 6 keys**
   - What we know: The game engine reads `keySignature` from `exercise.config` and holds it for the entire exercise duration. There is no built-in mechanism to cycle key signatures within a single exercise.
   - What's unclear: Whether "all 6 keys mixed" means a single exercise with one key (e.g. `'G'` as the representative) or whether the intent is met by running 6 separate single-key exercises.
   - Recommendation: Use 3 exercises (as locked in CONTEXT.md) with representative keys. Exercise 3 could be `keySignature: 'D'` (2 sharps, middle difficulty) as a representative "mixed" key. Alternatively, expand to 6 exercises (one per key). Planner should decide based on target session length — 3 exercises at 5 patterns each = ~15 patterns total for the boss.

2. **Memory game note pool composition (Discretion Area)**
   - What we know: Existing memory games use a full octave pool (12 notes in Unit 5). The 4x4 grid picks 8 pairs from the pool.
   - What's unclear: Whether the memory pool should use natural names (same as sight reading pool) or the explicit accidental forms (e.g. `'F#4'` instead of `'F4'`).
   - Recommendation: Use a representative mixed-key pool with explicit accidental spellings for variety (e.g. `['C4','D4','E4','F#4','G4','A4','Bb4','B4','C5']`), since the memory game does not use `keySignature` and shows notes individually on piano cards. This creates a richer matching challenge without requiring key sig glyph support.

3. **`patternCount` vs `questionCount` field name in SIGHT_READING exercise config**
   - What we know: Looking at trebleUnit5Redesigned.js boss node (line 538), the SIGHT_READING exercise config uses `measuresPerPattern`, `timeSignature`, `rhythmPatterns`, `tempo` but NOT a `patternCount` or `questionCount` field.
   - What's unclear: Whether SightReadingGame reads a `patternCount` from `nodeConfig` or uses a default.
   - Recommendation: The planner should verify whether a pattern count field is needed in the exercise config, or if SightReadingGame manages its own exercise count internally. Checking `SightReadingGame.jsx` lines 288–319 shows `measuresPerPattern`, `clef`, `selectedNotes`, `timeSignature`, `keySignature` are read — but NOT a patternCount. The session length is controlled by `useSightReadingSession`. Do NOT add a `patternCount` field; omit it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|---|---|
| Framework | Vitest |
| Config file | `vite.config.js` (vitest config inline) |
| Quick run command | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TREB-01 through TREB-07 | keySignature pipeline passes through TrailNodeModal | unit | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` | Yes |
| BASS-01 through BASS-07 | filterNotesToKey works for C3–C4 range | unit | same as above | Yes — test covers generic pitch format |
| All (TREB/BASS) | validateTrail passes with zero errors | integration | `npm run verify:patterns` | Yes — script exists |
| All (TREB/BASS) | notePool natural octave filters correctly per key | unit | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` | Yes |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run verify:patterns` passes with zero errors before `/gsd:verify-work`

**Note:** `npm run verify:patterns` will NOT validate the new unit files until Phase 11 wires them into expandedNodes.js. The validate script runs against `SKILL_NODES` from `skillTrail.js`. The planner should note this: final validation of prerequisite chains happens in Phase 11, not Phase 08.

### Wave 0 Gaps
None — existing test infrastructure covers all key signature utility functions. Phase 08 is data authoring only; no new functions requiring tests are introduced.

---

## Sources

### Primary (HIGH confidence)
- `src/data/units/trebleUnit5Redesigned.js` — Canonical template for all field names, comment style, boss structure, unit header comment format
- `src/data/units/bassUnit5Redesigned.js` — Bass clef template, C3–C4 range conventions
- `src/data/nodeTypes.js` — NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES enum values (all verified by direct read)
- `src/data/constants.js` — EXERCISE_TYPES enum values
- `src/components/trail/TrailNodeModal.jsx` lines 159–209 — keySignature pipeline: `exercise.config?.keySignature ?? null` into navState
- `src/components/games/sight-reading-game/SightReadingGame.jsx` lines 168–319 — `trailKeySignature` consumption, `nodeConfig` auto-config
- `src/components/games/sight-reading-game/constants/keySignatureConfig.js` — KEY_NOTE_LETTERS for all 6 keys; verified note pools
- `src/components/games/sight-reading-game/utils/keySignatureUtils.js` — filterNotesToKey and mapNoteToKey implementations
- `src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` — 20 passing tests confirming filterNotesToKey behavior
- `scripts/validateTrail.mjs` — Full validator source read; confirmed it does NOT check exercise config fields
- `src/config/subscriptionConfig.js` — Confirmed no new nodes needed in FREE_NODE_IDS

### Secondary (MEDIUM confidence)
- `src/data/expandedNodes.js` — Confirmed Phase 08 does not touch this file; Phase 11 handles imports
- `src/data/skillTrail.js` — UNITS metadata; confirmed TREBLE_6, TREBLE_7, BASS_6, BASS_7 do not exist yet (Phase 11)

### Tertiary (LOW confidence)
None — all findings verified from source files directly.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all enums, imports, and field names verified from source
- Architecture (order numbers): HIGH — computed from verified START_ORDER and node count in existing files
- Architecture (prerequisite chains): HIGH — terminal boss IDs verified from unit file source
- Architecture (keySignature pipeline): HIGH — traced from unit file → TrailNodeModal → SightReadingGame
- Pitfalls: HIGH — each pitfall traced to specific source line
- Validator behavior: HIGH — read validateTrail.mjs in full; confirmed no exercise config checking
- Boss exercise 3 multi-key question: LOW/OPEN — no existing multi-key boss precedent; left as open question

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable codebase; no fast-moving dependencies)
