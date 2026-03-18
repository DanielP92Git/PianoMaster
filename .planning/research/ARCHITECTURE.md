# Architecture Research

**Domain:** Key Signatures and Advanced Rhythm (v2.4 Content Expansion)
**Researched:** 2026-03-18
**Confidence:** HIGH — based on direct codebase inspection + VexFlow v5 type definitions

---

## Standard Architecture

### System Overview

```
Trail Data Layer (src/data/)
  ┌──────────────────────────────────────────────────────────────┐
  │  units/trebleUnit6Redesigned.js  (Key Signatures - treble)   │
  │  units/trebleUnit7Redesigned.js  (Key Signatures - treble)   │
  │  units/bassUnit6Redesigned.js    (Key Signatures - bass)     │
  │  units/bassUnit7Redesigned.js    (Key Signatures - bass)     │
  │  units/rhythmUnit7Redesigned.js  (Advanced Rhythm)           │
  │  units/rhythmUnit8Redesigned.js  (Compound Meters / 6/8)     │
  └───────────────────────────┬──────────────────────────────────┘
                              │ import + spread
                              ▼
  expandedNodes.js  ── aggregates EXPANDED_NODES array
                              │
                              ▼
  skillTrail.js  ── getNodeById(), isNodeUnlocked(), etc.
```

```
Game Execution Pipeline
  Trail → VictoryScreen → location.state
    { nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }
                              │
              ┌───────────────┴───────────────────┐
              ▼                                   ▼
  SightReadingGame.jsx                 MetronomeTrainer.jsx
  (Key Signatures: noteConfig.keySignature)  (Advanced Rhythm: rhythmConfig.timeSignature)
              │                                   │
              ▼                                   ▼
  generatePatternData()                generateRhythmEvents()
  (patternBuilder.js)                  (rhythmGenerator.js)
              │                                   │
              ▼                                   ▼
  VexFlowStaffDisplay.jsx              MetronomeDisplay.jsx + TapArea.jsx
  stave.addKeySignature(key)           stave.addTimeSignature("6/8")
  Accidental.applyAccidentals()        Beam.generateBeams() with compound groups
```

---

## Component Responsibilities

| Component | Responsibility | New vs Modified |
|-----------|----------------|-----------------|
| `units/trebleUnit6-7Redesigned.js` | Key signature node definitions (treble path) | NEW |
| `units/bassUnit6-7Redesigned.js` | Key signature node definitions (bass path) | NEW |
| `units/rhythmUnit7-8Redesigned.js` | Advanced rhythm + compound meter node defs | NEW |
| `expandedNodes.js` | Aggregates all unit arrays into EXPANDED_NODES | MODIFIED (add 5 imports + spreads) |
| `VexFlowStaffDisplay.jsx` | VexFlow rendering; must call `stave.addKeySignature()` and `Accidental.applyAccidentals()` | MODIFIED |
| `patternBuilder.js` | `generatePatternData()` must accept and forward `keySignature` param | MODIFIED |
| `rhythmGenerator.js` | Must handle 6/8 dotted-quarter beat unit (3 eighth-units per beat) | MODIFIED |
| `durationConstants.js` / `RhythmPatternGenerator.js` | 6/8 entry already exists in TIME_SIGNATURES (SIX_EIGHT) but `unitsPerBeat` needs verification for compound grouping | VERIFY |
| `rhythmPatterns.js` | Must add compound meter patterns (dotted quarter + three-eighths groups) | MODIFIED |
| `gameSettings.js` | DEFAULT_SETTINGS.timeSignature is single object; no change needed — node config drives it | NO CHANGE |
| `subscriptionConfig.js` | All new nodes are premium (no new FREE_NODE_IDS entries) | NO CHANGE |
| Postgres `is_free_node()` | Mirrors subscriptionConfig; no new free IDs means no migration needed | NO CHANGE |

---

## Recommended Project Structure

The new unit files slot into the existing pattern:

```
src/data/units/
  trebleUnit1Redesigned.js   (existing)
  trebleUnit2Redesigned.js   (existing)
  trebleUnit3Redesigned.js   (existing)
  trebleUnit4Redesigned.js   (existing — sharps)
  trebleUnit5Redesigned.js   (existing — flats + boss)
  trebleUnit6Redesigned.js   <- NEW: G major, D major, A major key sigs
  trebleUnit7Redesigned.js   <- NEW: F major, Bb major, Eb major key sigs
  bassUnit1Redesigned.js     (existing)
  ...
  bassUnit5Redesigned.js     (existing)
  bassUnit6Redesigned.js     <- NEW: bass key signatures (mirrors treble Unit 6)
  bassUnit7Redesigned.js     <- NEW: bass key signatures (mirrors treble Unit 7)
  rhythmUnit1Redesigned.js   (existing)
  ...
  rhythmUnit6Redesigned.js   (existing — sixteenth notes, ends at order 141)
  rhythmUnit7Redesigned.js   <- NEW: syncopation (dotted quarter, complex patterns)
  rhythmUnit8Redesigned.js   <- NEW: compound meters (6/8, 9/8 optional)
```

### Order Space Allocation

Current rhythm units end at order 141 (rhythmUnit6 START_ORDER=135 + 6 nodes = 141).
New rhythm units:
- `rhythmUnit7`: START_ORDER = 142
- `rhythmUnit8`: START_ORDER = 149 (7 nodes in unit 7)

Current treble units end at approximately order ~52 (trebleUnit5 last node).
New treble units:
- `trebleUnit6`: START_ORDER = 53 (or next available)
- `trebleUnit7`: START_ORDER = 60 (or next available)

Bass units mirror treble ordering (START_ORDER = 51 + treble offset).

---

## Architectural Patterns

### Pattern 1: Key Signature Flow — Node Config to VexFlow

**What:** The node config carries a `keySignature` string that flows from trail data through `generatePatternData()` into `VexFlowStaffDisplay.jsx`, where it is applied via `stave.addKeySignature(key)` and `Accidental.applyAccidentals(voices, key)`.

**When to use:** All Key Signature trail nodes. The `keySignature` field is optional — absence means C major (no accidentals, current behavior), so existing nodes are unaffected.

**VexFlow API (verified from type definitions in `node_modules/vexflow/build/types/src/`):**

```javascript
// stave.d.ts — addKeySignature signature:
// addKeySignature(keySpec: string, cancelKeySpec?: string, position?: number): this
//
// Valid key names (from VexFlow tables.ts, verified):
// Major: "C","G","D","A","E","B","F#","C#","F","Bb","Eb","Ab","Db","Gb","Cb"
// Minor: "Am","Em","Bm","F#m","C#m","G#m","D#m","Dm","Gm","Cm","Fm","Bbm","Ebm","Abm"
stave.addClef("treble")
     .addKeySignature("G")
     .addTimeSignature("4/4");

// accidental.d.ts — applyAccidentals signature:
// static applyAccidentals(voices: Voice[], keySignature: string): void
// Automatically adds cautionary accidentals and suppresses redundant ones based on key.
Accidental.applyAccidentals([voice], "G");
```

**Data flow changes:**

```javascript
// In trail node definition (noteConfig):
noteConfig: {
  notePool: ['F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
  clef: 'treble',
  keySignature: 'G'   // NEW optional field — defaults absent to 'C'
}

// In exercises config:
config: {
  notePool: ['F#4', 'G4', 'A4', 'B4'],
  clef: 'treble',
  keySignature: 'G'   // Propagated to generatePatternData
}

// patternBuilder.js — add keySignature param:
export async function generatePatternData({
  // ...existing params...
  keySignature = 'C',  // new optional param
}) {
  // ...existing logic unchanged...
  return {
    notes: enrichedNotation,
    // ...existing fields...
    keySignature,      // new return field
  };
}

// VexFlowStaffDisplay.jsx — use pattern.keySignature:
const activeKeySignature = pattern.keySignature ?? 'C';
if (activeKeySignature !== 'C') {
  stave.addKeySignature(activeKeySignature);
}
// After all voices are built:
Accidental.applyAccidentals([voice], activeKeySignature);
```

**Trade-offs:**
- Using `Accidental.applyAccidentals()` is the correct VexFlow approach — it handles courtesy accidentals, suppresses redundant ones, and is context-aware across the measure.
- Key signatures affect visual rendering only in VexFlow. Pitch detection (mic/keyboard) already uses absolute pitch strings (`F#4`), so no audio pipeline changes are needed.
- The `notePool` in the node config must contain absolute pitches (`F#4`, not `F4` for G major). The key signature is display-only: it tells VexFlow to render the F# symbol in the key signature area and suppress per-note accidentals.

### Pattern 2: 6/8 Compound Meter — Beat Unit is Dotted Quarter

**What:** In 6/8 time, the felt beat is a dotted quarter (3 eighth-note subdivisions), not a quarter note. The rhythm generator's `unitsPerBeat` contract changes for compound meters.

**Current state (verified in RhythmPatternGenerator.js):**

```javascript
SIX_EIGHT: {
  name: "6/8",
  beats: 6,           // 6 eighth-note counts per measure
  subdivision: 12,    // 12 eighth-note slots per measure
  strongBeats: [0, 3],
  measureLength: 12,
  isCompound: true,
}
```

The existing `SIX_EIGHT` entry treats each eighth note as 1 beat count, which is rhythmically correct for beginning compound meter exposure. `durationConstants.js` imports `TIME_SIGNATURES` and builds a grid where `unitsPerBeat` is computed as `measureLength / beats = 12 / 6 = 2` (2 sixteenth-units per eighth-note beat).

**Two valid models for 6/8 trail nodes:**

Option A — "Simple 6/8" (6 eighth-note counts): Matches current generator; correct for beginner compound meter nodes. `unitsPerBeat: 2`. Use for Unit 7 introduction nodes.

Option B — "Felt 6/8" (2 dotted-quarter beats): Requires a new config where `beats: 2` and `unitsPerBeat: 6`. Better for challenge nodes showing syncopation across the dotted-quarter pulse. Avoid naming it `"6/8"` internally (see Anti-Pattern 2).

**Recommendation:** Use Option A (existing SIX_EIGHT) for Unit 7-8 introduction nodes. Add Option B only if advanced challenge nodes need felt-beat syncopation. Both use `isCompound: true`.

### Pattern 3: Syncopation Patterns — Extending rhythmPatterns.js

**What:** `COMPLEX_EXAMPLE_PATTERNS` in `rhythmPatterns.js` already contains `eighthQuarterEighth` (the canonical syncopation pattern, `beatsSpan: 2`). Advanced rhythm Unit 7 needs additional syncopation archetypes.

**Patterns to add to COMPLEX_EXAMPLE_PATTERNS:**

```javascript
// Compound 6/8 primary group: dotted-quarter + eighth (half a 6/8 measure)
{
  id: "compound68HalfBar",
  label: "6/8 half-bar group",
  events: [
    { type: "note", duration: "q", dotted: true },  // 6 sixteenth-units
    { type: "note", duration: "8" },                 // 2 sixteenth-units (total: 8)
  ],
  totalUnits: 8,
  beatsSpan: 4,   // 4 eighth-note beats (based on SIX_EIGHT unitsPerBeat=2)
}
```

Note: `beatsSpan` is interpreted relative to the active time signature's `unitsPerBeat`. For 6/8 with `unitsPerBeat: 2`, a pattern with `totalUnits: 8` spans 4 "beats" (eighth-note counts). This means compound patterns should be gated by the `isCompound` flag or only used when `timeSignature === "6/8"` in node config.

### Pattern 4: Key Signature Node Exercise Type Progression

**What:** Key signature learning requires a specific pedagogical sequence. The student must connect the visual key signature to the expected pitch alteration.

**Recommended exercise sequence per unit:**
- Discovery nodes: `NOTE_RECOGNITION` with `keySignature` set — one note at a time, student names the note while seeing the key context
- Practice nodes: `NOTE_RECOGNITION` with expanded pool — multiple notes from the key
- Mix-Up/Challenge nodes: `SIGHT_READING` with `keySignature` set — reads melodic passages in key context
- Boss nodes: `SIGHT_READING` multi-measure with fuller key coverage

No new exercise types are needed. Existing `NOTE_RECOGNITION` and `SIGHT_READING` accept `keySignature` via `config` passthrough.

---

## Data Flow

### Key Signature Request Flow

```
Trail node clicked
    ↓
TrailNodeModal → location.state
  { nodeId, nodeConfig, exerciseType, exerciseIndex, totalExercises }
    ↓
SightReadingGame.jsx
  settings.keySignature = nodeConfig.keySignature || 'C'
    ↓
generatePatternData({ keySignature: 'G', notePool: ['G4', 'A4', 'B4', ...] })
  → rhythmGenerator produces events (unchanged)
  → note assignment picks from notePool (unchanged, absolute pitches)
  → returns { ...pattern, keySignature: 'G' }
    ↓
VexFlowStaffDisplay.jsx receives pattern.keySignature
  → stave.addKeySignature('G')     [visual: adds F# glyph to key sig area]
  → Accidental.applyAccidentals(voices, 'G')
      [suppresses redundant # on F#4 notes; adds courtesy natural on F4]
    ↓
Pitch detection (mic/keyboard) uses pattern.notes[i].pitch ('F#4')
  → No change — detection already works with absolute pitch strings
```

### Advanced Rhythm (6/8) Request Flow

```
Trail node clicked (rhythmUnit7 or rhythmUnit8 node)
    ↓
MetronomeTrainer.jsx
  timeSignature = nodeConfig.timeSignature || '6/8'
    ↓
getPattern('6/8', difficulty) in RhythmPatternGenerator.js
  → TIME_SIGNATURES.SIX_EIGHT exists; compound-aware generation
    ↓
generateRhythmEvents({ timeSignature: resolved6_8, ... })
  → resolveTimeSignature('6/8') returns SIX_EIGHT entry
  → fillBeatSimple/fillBeatComplex operates on 2-unit (eighth-note) beats
  → returns events array with isCompound flag available
    ↓
MetronomeDisplay.jsx / VexFlowStaffDisplay.jsx
  → stave.addTimeSignature('6/8')
  → Beam.generateBeams(notes, { groups: [new Fraction(3, 8)] })
      [forces 3-eighth beaming for compound grouping]
```

---

## Integration Points

### Modified Files (surgical changes)

| File | Change Required | Risk |
|------|-----------------|------|
| `src/data/expandedNodes.js` | Add 6 import statements + 6 array spreads into EXPANDED_NODES | LOW — pure addition |
| `src/components/games/sight-reading-game/utils/patternBuilder.js` | Add `keySignature` param to `generatePatternData()`; include in return value | LOW — backward-compatible default `'C'` |
| `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` | Call `stave.addKeySignature()` when `pattern.keySignature` is set; call `Accidental.applyAccidentals()` after voice construction; do NOT add manual Accidental modifiers when key sig is active | MEDIUM — VexFlow rendering is complex; test with multiple key signatures |
| `src/components/games/sight-reading-game/utils/rhythmPatterns.js` | Add compound 6/8 patterns to `COMPLEX_EXAMPLE_PATTERNS` | LOW — additive |
| `src/components/games/rhythm-games/RhythmPatternGenerator.js` | Verify `SIX_EIGHT.measureLength = 12` for beaming; optionally add `SIX_EIGHT_COMPOUND` for felt-2 model | LOW-MEDIUM |

### New Files (zero risk to existing nodes)

| File | Contents |
|------|----------|
| `src/data/units/trebleUnit6Redesigned.js` | ~7 nodes: G major, D major key signature introduction and practice |
| `src/data/units/trebleUnit7Redesigned.js` | ~8 nodes: A major, F major, Bb major + key signature boss |
| `src/data/units/bassUnit6Redesigned.js` | Mirrors trebleUnit6 for bass clef |
| `src/data/units/bassUnit7Redesigned.js` | Mirrors trebleUnit7 for bass clef + boss |
| `src/data/units/rhythmUnit7Redesigned.js` | ~7 nodes: advanced syncopation in 4/4 and 3/4 |
| `src/data/units/rhythmUnit8Redesigned.js` | ~8 nodes: 6/8 compound meter introduction and boss |

### Confirmed Unchanged

| System | Reason |
|--------|--------|
| Pitch detection (mic / pitchy) | Works on absolute pitch strings; `F#4` detected correctly whether in G major or not |
| `NotesRecognitionGame.jsx` | Does not render VexFlow staves; key signature is irrelevant to note image display |
| `MemoryGame.jsx` | Does not render VexFlow staves |
| `MetronomeTrainer.jsx` | Already accepts `timeSignature` from node config; `'6/8'` passes through to `getPattern()` unchanged |
| `subscriptionConfig.js` + Postgres `is_free_node()` | No new free nodes; all new content is premium by exclusion |
| `students_score` + `student_skill_progress` tables | Generic `node_id TEXT` columns; no schema change needed |
| Build-time validation script | Validates prerequisite chains and exercise types; new nodes use existing `EXERCISE_TYPES` values |

---

## Key Signature — Accidental Handling Contract

This is the most nuanced integration point and must be implemented carefully.

**Problem:** When rendering a note in G major (one sharp: F#), VexFlow must:
1. Show the F# accidental glyph in the key signature area at the start of the stave
2. Suppress the per-note `#` modifier on all F#4 notes within the measure
3. Render a courtesy natural (F♮) on any F♮ note within the measure

**Solution (VexFlow built-in):**
`Accidental.applyAccidentals(voices, keySignature)` handles all three steps automatically when called after voice construction.

**Critical constraint:** The current `buildStaveNote()` in `VexFlowStaffDisplay.jsx` (line ~482-485) manually calls `note.addModifier(new Accidental(parsedPitch.accidental))` for notes with `#` or `b` in their pitch string. When `Accidental.applyAccidentals()` is used, these manual modifiers must NOT be added — or doubled accidentals will render.

The code must be branched:

```
if (pattern.keySignature is set AND keySignature !== 'C'):
  → in buildStaveNote(): do NOT add Accidental modifiers
  → after voice construction: call Accidental.applyAccidentals()
else:
  → current behavior: add Accidental modifiers manually per note
```

This is a conditional branch, not a rewrite. The `buildStaveNote()` function needs an `omitAccidentals` option flag, and the render loop calls `Accidental.applyAccidentals()` as a post-step.

---

## 6/8 Beaming — Compound Meter Requirement

**Problem (confirmed from community reports):** `Beam.generateBeams()` defaults to grouping by 2 in simple time. In 6/8, the correct grouping is 3 eighths per beam (two groups of 3 per measure), not 3 groups of 2.

**Solution:** VexFlow's `Beam.generateBeams()` accepts an options object with a `groups` array:

```javascript
import { Fraction } from 'vexflow';

// For 6/8: force groups of 3 eighth notes = one dotted-quarter beat
const beams = Beam.generateBeams(notes, {
  groups: [new Fraction(3, 8)]
});
```

This conditional beaming call must be applied in `VexFlowStaffDisplay.jsx` and (if the MetronomeDisplay renders staves) in `MetronomeDisplay.jsx` when `pattern.timeSignature === '6/8'` or when the resolved time signature has `isCompound: true`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Relative Pitch Names in Node Config

**What people do:** Store relative note names in `notePool` (e.g., `['F', 'G', 'A']` implying F# via key) and try to derive the actual pitch from the key signature at runtime.

**Why it's wrong:** Pitch detection, note comparison, score tracking, and MIDI matching all use absolute pitches (`F#4`). Mixing relative naming creates divergence between what is displayed and what is detected.

**Do this instead:** Always store absolute pitches in `notePool` (e.g., `['F#4', 'G4', 'A4']`). The key signature is a rendering hint only — the audio/detection pipeline is untouched.

### Anti-Pattern 2: Duplicate Time Signature Names in TIME_SIGNATURES

**What people do:** Add a `SIX_EIGHT_COMPOUND` entry to `RhythmPatternGenerator.js` with `name: "6/8"` — the same `name` as the existing `SIX_EIGHT` entry.

**Why it's wrong:** `buildTimeSignatureGrid()` in `durationConstants.js` iterates `Object.values(TIME_SIGNATURES)` and keys the grid by `signature.name`. Duplicate names cause silent overwrite; `resolveTimeSignature('6/8')` returns whichever entry is last in the object.

**Do this instead:** Use a unique internal key (`SIX_EIGHT_COMPOUND`) and gate the compound-beat model via the node config (e.g., a `compoundBeat: true` flag in `rhythmConfig`). Keep `name: "6/8"` for display. Alternatively, extend the existing `SIX_EIGHT` entry with the `unitsPerBeat` needed for compound beaming.

### Anti-Pattern 3: Using SIGHT_READING for Initial Key Signature Discovery

**What people do:** Set `type: EXERCISE_TYPES.SIGHT_READING` for the very first key signature nodes ("Meet G Major").

**Why it's wrong:** Sight reading requires recognizing multiple notes while tracking rhythm. First exposure to key context must use `NOTE_RECOGNITION` — one note at a time — so the learner can focus entirely on understanding that the F♯ symbol in the key signature means all Fs are sharp.

**Do this instead:** Discovery and first Practice nodes use `NOTE_RECOGNITION` with `keySignature` set. Only Challenge and Boss nodes use `SIGHT_READING` with an active key signature.

### Anti-Pattern 4: Forgetting expandedNodes.js Registration

**What people do:** Create the unit file with valid node definitions, but forget to add the import and spread into `EXPANDED_NODES` in `expandedNodes.js`.

**Why it's wrong:** The build-time validator and all runtime trail logic reads only from `EXPANDED_NODES`. Nodes not in that array are invisible to the trail system.

**Do this instead:** Treat the import + spread in `expandedNodes.js` as the registration step. Run `npm run verify:patterns` immediately after adding the import to confirm node counts and prerequisites are valid.

### Anti-Pattern 5: Doubled Accidentals from Manual + applyAccidentals

**What people do:** Call `Accidental.applyAccidentals()` after building voices but leave the existing manual `note.addModifier(new Accidental('#'))` calls in `buildStaveNote()` active.

**Why it's wrong:** `Accidental.applyAccidentals()` adds its own accidental modifiers to notes that need them. The pre-existing manual modifiers plus the auto-applied ones produce doubled accidental glyphs on the rendered staff.

**Do this instead:** Add an `omitAccidentals` flag to `buildStaveNote()`. When key signature mode is active, pass `omitAccidentals: true` so the function skips adding Accidental modifiers. Then call `Accidental.applyAccidentals()` as a post-step.

---

## Build Order (Dependencies Drive Sequence)

Each phase depends on the previous one completing cleanly.

**Phase 1: Trail Data Layer**
Create all 6 new unit files. These are pure data with no imports from game components. Verify prerequisite chains (last node of trebleUnit5 → first node of trebleUnit6). Wire all 6 imports into `expandedNodes.js`. Run `npm run verify:patterns` to confirm no broken prerequisites or invalid exercise types.

**Phase 2: VexFlow Key Signature Rendering**
Modify `patternBuilder.js` to accept and return `keySignature`. Add `omitAccidentals` option to `buildStaveNote()` in `VexFlowStaffDisplay.jsx`. Add `stave.addKeySignature()` and `Accidental.applyAccidentals()` calls. Test with free-play SightReadingGame by manually passing a key signature before trail wiring.

**Phase 3: Key Signature Trail Integration**
Wire `keySignature` from trail node config through `location.state` → game `settings` → `generatePatternData()`. Verify `NotesRecognitionGame` handles key-aware note pools correctly (display only — detection uses absolute pitch strings unchanged). Confirm the node modal displays the key signature name.

**Phase 4: Advanced Rhythm Data + Generator**
Add syncopation and compound meter patterns to `rhythmPatterns.js`. Verify `resolveTimeSignature('6/8')` returns correct `unitsPerBeat`. Add conditional 6/8 beaming (groups of 3) in `VexFlowStaffDisplay.jsx`.

**Phase 5: Compound Meter Trail Integration**
Wire 6/8 nodes through MetronomeTrainer. Verify audio engine beat timing is correct for the dotted-quarter pulse (6/8 at ~60 BPM felt = 180 eighth-note BPM). Test progression from rhythmUnit6 boss to rhythmUnit7. Run full regression to confirm all 129 existing nodes are unaffected.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 30 new trail nodes | No performance impact — node array size is irrelevant at runtime |
| Key sig rendering per pattern | `Accidental.applyAccidentals()` runs once per render cycle — no perf concern |
| 6/8 generator at scale | Beat-wise loop unchanged; compound beaming is post-processing on pre-built arrays — no perf concern |
| Additional key signatures later | Adding more key sig units is identical to trebleUnit6-7; no architecture change needed |

---

## Sources

- VexFlow v5 type definitions (verified directly from installed package):
  - `node_modules/vexflow/build/types/src/keysignature.d.ts` — `KeySignature` class, `setKeySig()`
  - `node_modules/vexflow/build/types/src/stave.d.ts` line 111 — `addKeySignature(keySpec, cancelKeySpec?, position?)`
  - `node_modules/vexflow/build/types/src/accidental.d.ts` line 45 — `Accidental.applyAccidentals(voices, keySignature)`
- VexFlow tables.ts (fetched from GitHub) — valid key names: `C,G,D,A,E,B,F#,C#,F,Bb,Eb,Ab,Db,Gb,Cb` (major) and minor equivalents
- [VexFlow compound beaming community issue](https://groups.google.com/g/vexflow/c/Mw1e41jzTe8)
- [VexFlow official API docs](https://0xfe.github.io/vexflow/api/)
- Direct codebase inspection (all HIGH confidence):
  - `src/components/games/sight-reading-game/utils/patternBuilder.js`
  - `src/components/games/sight-reading-game/utils/rhythmGenerator.js`
  - `src/components/games/sight-reading-game/utils/rhythmPatterns.js`
  - `src/components/games/sight-reading-game/constants/durationConstants.js`
  - `src/components/games/rhythm-games/RhythmPatternGenerator.js`
  - `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx`
  - `src/data/expandedNodes.js`
  - `src/data/units/rhythmUnit1Redesigned.js` and `rhythmUnit6Redesigned.js`
  - `src/config/subscriptionConfig.js`

---
*Architecture research for: Key Signatures and Advanced Rhythm (v2.4 Content Expansion)*
*Researched: 2026-03-18*
