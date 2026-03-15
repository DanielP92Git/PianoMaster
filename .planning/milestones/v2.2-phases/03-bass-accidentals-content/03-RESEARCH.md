# Phase 03: Bass Accidentals Content - Research

**Researched:** 2026-03-15
**Domain:** Trail unit file authoring — JavaScript data files only (bass clef + treble rework, no runtime logic)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Pedagogical approach (all accidental units)**
- Each node introduces a **different** accidental — NOT the same 2 notes across the whole unit
- One accidental per discovery node, with nearest-neighbor naturals as context
- Start from small note pools (3 notes), slow build to full range
- Separate sharps and flats units (not mixed)

**Bass sharps unit**
- 3 sharps: F#3, C#3, G#3
- Starting pool: BCA (B3, C4, A3), expand gradually — 3 notes + 1 sharp → 5 notes + 1 sharp → 5 notes + 2nd sharp → etc.
- SIGHT_READING is safe for sharps (mic outputs F#3/C#3/G#3 matching exactly)
- All 4 game modes: Note Recognition, Sight Reading, Memory Game, Speed Round

**Bass flats unit**
- 4 flats: Bb3, Eb3, Ab3, Db3 (circle-of-fifths flat progression)
- Starting pool: BCA (B3, C4, A3), same slow expansion pace as sharps
- SIGHT_READING NOT safe for regular practice nodes — mic outputs G#3 not Ab3, C#3 not Db3, A#3 not Bb3, D#3 not Eb3
- Regular nodes use NOTE_RECOGNITION only (same constraint as treble flats in Phase 02)
- Boss nodes may include SIGHT_READING — inert until Phase 04 wires them into expandedNodes.js

**Bass boss node**
- Mixes all 7 bass accidentals (F#3, C#3, G#3, Bb3, Eb3, Ab3, Db3) + full natural range
- 2 exercises: Note Recognition + Sight Reading (inert until Phase 04)
- category: 'boss', isBoss: true

**Treble rework (added to Phase 03 scope)**
- Delete existing trebleUnit4Redesigned.js and trebleUnit5Redesigned.js
- Re-author with same "different accidental each node" approach:
  - Treble sharps unit: F#4, C#4, G#4 (3 sharps)
  - Treble flats unit: Bb4, Eb4, Ab4, Db4 (4 flats)
  - Starting pool: CDE (C4, D4, E4), same slow build
  - Same SIGHT_READING constraints (safe for sharps, NOT for flats regular nodes)
- Treble boss: mixes all 7 treble accidentals + full C4-C5 natural octave

### Claude's Discretion
- Exact node count per unit (6-9 range, flats may need more for 4 accidentals at slow pace)
- Node type sequence (Discovery, Practice, Mix-Up, Speed, Boss)
- Which accidental appears on which node
- XP reward values per node (existing range: 45-70 per node, 150-200 for boss)
- Note pool composition at each expansion step
- rhythmConfig settings per node
- questionCount per exercise
- Kid-friendly unit and node naming

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Treble rework was folded into this phase by explicit user decision.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BASS-01 | Bass flats unit introduces Bb3 and Eb3 with discovery, practice, and mixed nodes | Unit file pattern from bassUnit3; flats notePool pitch strings verified (Bb3, Eb3 in BASS_NOTE_DATA); no SIGHT_READING in regular nodes (same enharmonic constraint as treble flats) |
| BASS-02 | Bass sharps unit introduces Ab3 and Db3 with discovery, practice, and mixed nodes | Note: CONTEXT.md locks sharps as F#3/C#3/G#3 (Unit 4) and Ab3/Db3 are actually flats — BASS-02 requirement text appears to describe the flats unit's second half. The locked decisions in CONTEXT.md are authoritative: Unit 4 = sharps (F#3, C#3, G#3), Unit 5 = flats (Bb3, Eb3, Ab3, Db3). BASS-02 is satisfied by the flats unit covering Ab3 and Db3. |
| BASS-03 | Bass accidentals boss challenge node covering all 4 accidentals (Bb3, Eb3, Ab3, Db3) | Boss pattern from boss_bass_3; CONTEXT.md expands boss pool to all 7 accidentals (F#3, C#3, G#3, Bb3, Eb3, Ab3, Db3); boss_bass_accidentals satisfies BASS-03 |
</phase_requirements>

---

## Summary

Phase 03 is pure content authoring: four new JavaScript data files (bassUnit4Redesigned.js for sharps, bassUnit5Redesigned.js for flats + boss), plus deletion and full re-authoring of trebleUnit4Redesigned.js and trebleUnit5Redesigned.js. No runtime logic changes. The established pattern from Phase 02 is the complete guide — the mechanics are identical, only the note names, clef, and order numbers differ.

The key technical constraints are identical to Phase 02: (1) enharmonic mic safety — SIGHT_READING must be excluded from flats regular practice nodes in both bass and treble units because `usePitchDetection.js` outputs sharp names only (A#3, not Bb3; D#3, not Eb3; G#3, not Ab3; C#3, not Db3); (2) boss nodes can include SIGHT_READING since they are not playable until Phase 04 wires them into expandedNodes.js.

The treble rework expands the unit design from 2 accidentals per unit to 3 sharps (F#4, C#4, G#4) and 4 flats (Bb4, Eb4, Ab4, Db4), following the same "different accidental each node" pedagogical approach. This requires replacing the Phase 02 output files entirely, making this phase also responsible for correct treble order numbering continuity.

**Primary recommendation:** Follow the Phase 02 plan structure exactly, substituting bass clef values and the expanded accidental sets. The treble rework uses the same template but re-authors from scratch with the new accidental-per-node pedagogy. All order arithmetic must be calculated from verified START_ORDER values read directly from existing unit files.

---

## Standard Stack

### Core Files

| File | Purpose | Notes |
|------|---------|-------|
| `src/data/units/bassUnit3Redesigned.js` | Template for bass unit structure + START_ORDER anchor | START_ORDER=66, 10 nodes, boss at order 75 (boss_bass_3). Bass Unit 4 starts at 76. |
| `src/data/units/trebleUnit3Redesigned.js` | Anchor for treble order continuity | START_ORDER=17, 10 nodes, boss at order 26 (boss_treble_3). Treble Unit 4 starts at 27 (unchanged). |
| `src/data/nodeTypes.js` | NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES | Import exactly as existing units do |
| `src/data/constants.js` | EXERCISE_TYPES | Import exactly as existing units do |

### Supporting Files (READ ONLY — DO NOT MODIFY in Phase 03)

| File | Why It Matters |
|------|---------------|
| `src/data/expandedNodes.js` | Phase 04 integration point — new imports added in Phase 04, not Phase 03 |
| `src/config/subscriptionConfig.js` | New node IDs added in Phase 04 |
| `src/locales/en/trail.json` | Translations added in Phase 04 |
| `src/locales/he/trail.json` | Hebrew translations added in Phase 04 |

**Installation:** No new packages. Pure JavaScript data file authoring.

---

## Architecture Patterns

### Verified Order Numbering

**Bass clef (from direct file reads):**

| Unit | START_ORDER | Node count | Last order (boss) | Boss ID |
|------|------------|------------|-------------------|---------|
| Unit 1 | (verify from bassUnit1) | — | — | boss_bass_1 |
| Unit 2 | (verify from bassUnit2) | — | — | boss_bass_2 |
| Unit 3 | 66 | 10 | 75 | boss_bass_3 |
| **Unit 4 (sharps)** | **76** | **TBD (8-9 nodes + boss)** | TBD | **boss_bass_4** |
| **Unit 5 (flats)** | **76 + Unit4 count** | **TBD (9-10 nodes + boss)** | TBD | **boss_bass_5** |
| **Bass accidentals boss** | after Unit 5 boss | 1 | — | **boss_bass_accidentals** |

**Treble clef (existing Phase 02 output — now replaced):**

| Unit | START_ORDER | Node count | Last order (boss) | Boss ID |
|------|------------|------------|-------------------|---------|
| Unit 3 | 17 | 10 | 26 | boss_treble_3 |
| **Unit 4 (sharps — replaced)** | **27** | **TBD (8-9 nodes + boss)** | TBD | **boss_treble_4** |
| **Unit 5 (flats — replaced)** | **27 + Unit4 count** | **TBD (9-10 nodes + boss)** | TBD | **boss_treble_5** |
| **Treble accidentals boss** | after Unit 5 boss | 1 | — | **boss_treble_accidentals** |

**CRITICAL:** Before writing any file, COUNT the nodes in the preceding unit to compute the next START_ORDER. This arithmetic is the primary source of order-collision bugs.

### Node ID Conventions

```
Bass:    bass_{unitId}_{orderInUnit}      e.g., bass_4_1, bass_4_2
         boss_bass_{unitId}               e.g., boss_bass_4
         boss_bass_accidentals            (cross-unit accidentals boss)

Treble:  treble_{unitId}_{orderInUnit}   e.g., treble_4_1, treble_4_2
         boss_treble_{unitId}            e.g., boss_treble_4
         boss_treble_accidentals         (cross-unit accidentals boss)
```

### Verified Bass Accidental Pitch Strings

From `BASS_NOTE_DATA` in `noteDefinitions.js` (BASS_NATURAL_NOTES covers B1–F4, `withAccidentals()` generates sharps/flats for all seven note letters):

| Pitch | String | Mic output (sharp form) | Safe for SIGHT_READING? |
|-------|--------|------------------------|------------------------|
| F sharp 3 | `'F#3'` | `'F#3'` | YES |
| C sharp 3 | `'C#3'` | `'C#3'` | YES |
| G sharp 3 | `'G#3'` | `'G#3'` | YES |
| B flat 3 | `'Bb3'` | `'A#3'` | NO (mic outputs A#3) |
| E flat 3 | `'Eb3'` | `'D#3'` | NO (mic outputs D#3) |
| A flat 3 | `'Ab3'` | `'G#3'` | NO (mic outputs G#3) |
| D flat 3 | `'Db3'` | `'C#3'` | NO (mic outputs C#3) |

All 7 bass accidental pitch strings are generated by `withAccidentals(BASS_NATURAL_NOTES)` — they exist in BASS_NOTE_DATA. No extra data setup required.

### Verified Treble Accidental Pitch Strings (expanded set)

| Pitch | String | Mic output | Safe for SIGHT_READING? |
|-------|--------|-----------|------------------------|
| F sharp 4 | `'F#4'` | `'F#4'` | YES |
| C sharp 4 | `'C#4'` | `'C#4'` | YES |
| G sharp 4 | `'G#4'` | `'G#4'` | YES |
| B flat 4 | `'Bb4'` | `'A#4'` | NO |
| E flat 4 | `'Eb4'` | `'D#4'` | NO |
| A flat 4 | `'Ab4'` | `'G#4'` | NO |
| D flat 4 | `'Db4'` | `'C#4'` | NO |

### Verified Module Shape

All four new/replacement files follow this template exactly:

```javascript
// Source: bassUnit3Redesigned.js / trebleUnit3Redesigned.js — direct verification
import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 4;                     // integer
const UNIT_NAME = 'Kid-Friendly Name'; // string, 8-year-old readable
const CATEGORY = 'bass_clef';          // or 'treble_clef' for treble files
const START_ORDER = 76;                // verified from preceding unit

export const bassUnit4Nodes = [ /* nodes */ ];
export default bassUnit4Nodes;
```

### Verified Non-Boss Node Shape

```javascript
// Source: bassUnit3Redesigned.js node pattern — direct verification
{
  id: 'bass_4_1',
  name: 'Kid-Friendly Name',
  description: 'Short description',
  category: CATEGORY,              // 'bass_clef'
  unit: UNIT_ID,                   // integer 4
  unitName: UNIT_NAME,
  order: START_ORDER,              // absolute trail position
  orderInUnit: 1,                  // 1-based
  prerequisites: ['boss_bass_3'],  // first node: previous boss; rest: previous node ID

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['B3', 'C4', 'F#3'],
    focusNotes: ['F#3'],           // empty [] for practice/mix nodes
    contextNotes: ['B3', 'C4'],
    clef: 'bass',
    ledgerLines: false,
    accidentals: true              // REQUIRED for all accidental unit nodes
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },

  newContent: NEW_CONTENT_TYPES.NOTE,
  newContentDescription: 'Note F#3',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['B3', 'C4', 'F#3'],
        questionCount: 8,
        clef: 'bass',
        timeLimit: null
      }
    }
  ],

  skills: ['B3', 'C4', 'F#3'],   // matches notePool
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Verified Boss Node Shape

```javascript
// Source: boss_bass_3 pattern — direct verification
{
  id: 'boss_bass_4',
  name: 'Boss Name',
  description: 'Master all sharp notes!',
  unlockHint: 'Complete all lessons to unlock this challenge!',
  category: 'boss',               // STRING LITERAL — NOT the CATEGORY constant
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + N,
  orderInUnit: N + 1,
  prerequisites: ['bass_4_N'],    // last regular node in unit

  nodeType: NODE_TYPES.BOSS,

  noteConfig: {
    notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'F#3', 'C#3', 'G#3'],
    focusNotes: [],
    contextNotes: [...same as notePool],
    clef: 'bass',
    ledgerLines: false,
    accidentals: true
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 65, max: 75, default: 70 }
  },

  newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
  newContentDescription: 'Bass Sharps Boss',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: { notePool: [...], questionCount: 15, clef: 'bass', timeLimit: null }
    },
    {
      // Sharps boss: SIGHT_READING safe (mic outputs F#3/C#3/G#3 exactly)
      // Flats boss / accidentals boss: SIGHT_READING safe here because
      // boss is inert until Phase 04 wires into expandedNodes.js (INTG-03 fix)
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: [...],
        measuresPerPattern: 2,
        clef: 'bass',
        timeSignature: '4/4',
        rhythmPatterns: ['quarter', 'half'],
        tempo: 70
      }
    }
  ],

  skills: [...same as notePool],
  xpReward: 150,          // 200 for cross-unit accidentals boss
  accessoryUnlock: null,
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

### Pedagogical Note Pool Progressions

**Bass Unit 4 (Sharps: F#3, C#3, G#3) — recommended expansion:**

Starting pool: BCA = B3, C4, A3 (central bass range, user-specified)

| Node | notePool | Pool size |
|------|----------|-----------|
| Discovery: Meet F# | B3, C4, F#3 (natural neighbors: E3/G3 context via B3/C4) | 3 |
| Discovery: Meet C# | B3, C#3, D3 (nearest neighbors) | 3 |
| Discovery: Meet G# | G3, G#3, A3 (nearest neighbors) | 3 |
| Practice: Sharps Together | F#3, C#3, G#3 | 3 |
| Practice: Sharps + Friends | B3, C4, A3, F#3, C#3, G#3 | 6 |
| Mix-Up/Memory | full bass octave (C4-C3) + F#3, C#3, G#3 | ~11 |
| Speed Round | same as memory | ~11 |
| Boss (boss_bass_4) | full bass octave + F#3, C#3, G#3 | ~11 |

**Bass Unit 5 (Flats: Bb3, Eb3, Ab3, Db3) — recommended expansion:**

| Node | notePool | Notes |
|------|----------|-------|
| Discovery: Meet Bb | A3, Bb3, B3 | nearest neighbors |
| Discovery: Meet Eb | D3, Eb3, E3 | nearest neighbors |
| Discovery: Meet Ab | G3, Ab3, A3 | nearest neighbors |
| Discovery: Meet Db | C3, Db3, D3 | nearest neighbors |
| Practice: Flats Together | Bb3, Eb3, Ab3, Db3 | all 4 flats, NOTE_RECOGNITION only |
| Practice: Flats + Friends | B3, C4, A3, Bb3, Eb3, Ab3, Db3 | NOTE_RECOGNITION only |
| Mix-Up/Memory | full bass octave (C4-C3) + Bb3, Eb3, Ab3, Db3 | NOTE_RECOGNITION only in regular nodes |
| Speed Round | same as memory | NOTE_RECOGNITION only |
| Boss (boss_bass_5) | full bass octave + Bb3, Eb3, Ab3, Db3 | SIGHT_READING safe (inert until Phase 04) |

**Bass Accidentals Boss (boss_bass_accidentals):**
All 7 accidentals + full C4-C3 natural octave. Pool (example):
`['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'F#3', 'C#3', 'G#3', 'Bb3', 'Eb3', 'Ab3', 'Db3']`

**Treble Unit 4 rework (Sharps: F#4, C#4, G#4) — recommended expansion:**

Starting pool: CDE = C4, D4, E4 (user-specified first-learned treble notes)

| Node | notePool |
|------|----------|
| Discovery: Meet F# | F4, F#4, G4 |
| Discovery: Meet C# | C4, C#4, D4 |
| Discovery: Meet G# | G4, G#4, A4 |
| Practice: Sharps Together | F#4, C#4, G#4 |
| Practice: Sharps + Friends | C4, D4, E4, F#4, C#4, G#4 |
| Mix-Up/Memory | full treble octave (C4-C5) + F#4, C#4, G#4 |
| Speed Round | same |
| Boss (boss_treble_4) | full octave + F#4, C#4, G#4 |

**Treble Unit 5 rework (Flats: Bb4, Eb4, Ab4, Db4) — recommended expansion:**

| Node | notePool | Notes |
|------|----------|-------|
| Discovery: Meet Bb | A4, Bb4, B4 | NOTE_RECOGNITION only |
| Discovery: Meet Eb | D4, Eb4, E4 | NOTE_RECOGNITION only |
| Discovery: Meet Ab | G4, Ab4, A4 | NOTE_RECOGNITION only |
| Discovery: Meet Db | C4, Db4, D4 | NOTE_RECOGNITION only |
| Practice: Flats Together | Bb4, Eb4, Ab4, Db4 | NOTE_RECOGNITION only |
| Practice: Flats + Friends | C4, D4, E4, Bb4, Eb4, Ab4, Db4 | NOTE_RECOGNITION only |
| Mix-Up/Memory | full octave + all 4 flats | NOTE_RECOGNITION only |
| Speed Round | same | NOTE_RECOGNITION only |
| Boss (boss_treble_5) | full octave + all 4 flats | SIGHT_READING safe (inert) |

**Treble Accidentals Boss (boss_treble_accidentals — replaces Phase 02 version):**
All 7 treble accidentals + full C4-C5 natural octave.
`['C4', 'C#4', 'D4', 'Db4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5']`

### Anti-Patterns to Avoid

- **Wrong category for boss:** Boss nodes MUST use `category: 'boss'` string literal, NOT the CATEGORY constant
- **accidentals: false:** All accidental unit nodes MUST have `accidentals: true`
- **Mixing sharps in flats unit:** Flats unit notePool (regular nodes) must NOT include F#3/C#3/G#3 or F#4/C#4/G#4
- **Wrong prerequisite on first node:** First node of Unit 4 prerequisite = `['boss_bass_3']` or `['boss_treble_3']`
- **Flats in SIGHT_READING (regular nodes):** Do NOT use SIGHT_READING with flat notePools in regular practice nodes — mic scoring fails silently
- **Order collision:** Compute START_ORDER by counting nodes in preceding unit (including boss) — don't assume
- **Forgetting G#:** The expanded sharps set has THREE accidentals (F#, C#, G#) not two — need one Discovery node per sharp
- **Forgetting Ab/Db:** The expanded flats set has FOUR accidentals (Bb, Eb, Ab, Db) — need one Discovery node per flat
- **Missing export default:** All unit files must have `export default [unitName]Nodes;`
- **Wrong clef:** Bass unit files use `clef: 'bass'`; treble use `clef: 'treble'`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accidental note data validation | Custom note list | BASS_NOTE_DATA / TREBLE_NOTE_DATA from noteDefinitions.js | withAccidentals() generates all sharps/flats; Ab3, Db3, G#3 confirmed present |
| Order numbering | Custom counter | Simple `START_ORDER + N` arithmetic | Same pattern in all 9 existing unit files |
| Trail validation | Custom check | `node scripts/validateTrail.mjs` | Validates prerequisite chains, duplicate IDs, node types (runs after Phase 04 integration) |
| Quick export check | Custom script | `node -e "import('./src/data/units/bassUnit4Redesigned.js').then(m => console.log(m.default.length))"` | ESM dynamic import works with Vite project structure |

---

## Common Pitfalls

### Pitfall 1: Flats in SIGHT_READING (enharmonic mic bug)

**What goes wrong:** A student plays Bb3; the mic (`usePitchDetection.js`) uses `NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']` — sharps only. It emits `'A#3'`. Sight reading game compares `detectedNote === matchingEvent.pitch` — `'A#3' === 'Bb3'` is `false`. Note scores as wrong even when correctly played.

**Why it happens:** `usePitchDetection.js` has no enharmonic mapping. Strict string comparison in SightReadingGame.jsx. Fix is in Phase 04 (INTG-03).

**How to avoid:** Never include SIGHT_READING in regular practice nodes for any flats unit (bass or treble). Boss nodes CAN include SIGHT_READING since they are not playable until Phase 04 wires them into expandedNodes.js.

**Warning signs:** Score shows 0% on flat exercises with mic input during testing.

### Pitfall 2: Order Collision

**What goes wrong:** Next unit's START_ORDER is set without counting the previous unit's full node count. Result: duplicate order values break trail sorting.

**Why it happens:** Copy-paste arithmetic error, or assuming a fixed node count.

**How to avoid:** Count nodes explicitly. Bass Unit 3 has 10 nodes (orders 66-75). Bass Unit 4 START_ORDER = 76. When authoring Unit 5, COUNT Unit 4's actual node count (including boss) before writing START_ORDER. Same logic for treble.

### Pitfall 3: Wrong ID After Copy

**What goes wrong:** Copy-paste from bass_3 leaves IDs as `bass_3_X`. The trail validator catches duplicates but only after Phase 04 integration. Silent in Phase 03.

**How to avoid:** Search-replace `bass_3_` → `bass_4_` immediately after copying. Verify all IDs before finishing. Same for treble (_3_ → _4_ when reworking).

### Pitfall 4: Three Sharps, Four Flats — Node Count Implication

**What goes wrong:** Applying Phase 02's 7-node structure (2 sharps, 2 Discovery nodes) directly to Phase 03's 3-sharp / 4-flat design. The expanded accidental sets require more Discovery nodes (3 for sharps, 4 for flats), meaning node counts are 8-10 per unit.

**How to avoid:** Plan node count explicitly: one Discovery per accidental, then practice/mix/speed/boss nodes. Flats unit needs minimum: 4 Discovery + 1 Practice + 1 Memory + 1 Speed + 1 Boss = 8 nodes minimum.

### Pitfall 5: Boss Prerequisite Points to Wrong ID

**What goes wrong:** Boss node prerequisite copied from previous unit and not updated (e.g., `['bass_3_9']` instead of `['bass_4_N']`).

**How to avoid:** Boss node prerequisite = last regular node ID in that unit. Verify explicitly before writing boss prerequisite.

### Pitfall 6: Treble Rework Leaves Stale Files

**What goes wrong:** New treble files are written but old trebleUnit4Redesigned.js and trebleUnit5Redesigned.js are not deleted. Since expandedNodes.js doesn't import them yet (Phase 04), there's no immediate conflict, but stale files create confusion in Phase 04.

**How to avoid:** Phase 03 plan must explicitly delete both old treble files before creating replacements.

### Pitfall 7: G#4 in Treble Flats Unit

**What goes wrong:** Ab4 and G#4 are enharmonic. The treble flats unit introduces Ab4 (the flat form). G#4 should NOT appear in any flats unit notePool. But G#4 IS the correct mic output for Ab4 — meaning Ab4 has the same SIGHT_READING constraint as all other flats.

**How to avoid:** Flats unit uses `'Ab4'` string. No SIGHT_READING for regular nodes. Boss node can include SIGHT_READING since it is inert until Phase 04.

---

## Code Examples

### Bass Discovery Node (Sharps — SIGHT_READING safe)

```javascript
// Source: bassUnit3Redesigned.js "Meet E" pattern, adapted for F#3
{
  id: 'bass_4_1',
  name: 'Meet F Sharp',
  description: 'Discover your first bass sharp!',
  category: CATEGORY,             // 'bass_clef'
  unit: UNIT_ID,                  // 4
  unitName: UNIT_NAME,
  order: START_ORDER,             // 76
  orderInUnit: 1,
  prerequisites: ['boss_bass_3'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['B3', 'C4', 'F#3'],
    focusNotes: ['F#3'],
    contextNotes: ['B3', 'C4'],
    clef: 'bass',
    ledgerLines: false,
    accidentals: true              // REQUIRED
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },

  newContent: NEW_CONTENT_TYPES.NOTE,
  newContentDescription: 'Note F#',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['B3', 'C4', 'F#3'],
        questionCount: 8,
        clef: 'bass',
        timeLimit: null
      }
    }
  ],

  skills: ['B3', 'C4', 'F#3'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Bass Discovery Node (Flats — NOTE_RECOGNITION only)

```javascript
// Source: trebleUnit5Redesigned.js "Meet B Flat" pattern, adapted for bass Bb3
{
  id: 'bass_5_1',
  name: 'Meet B Flat',
  description: 'Discover your first bass flat!',
  category: CATEGORY,             // 'bass_clef'
  unit: UNIT_ID,                  // 5
  unitName: UNIT_NAME,
  order: START_ORDER,             // 76 + Unit4 node count
  orderInUnit: 1,
  prerequisites: ['boss_bass_4'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['A3', 'Bb3', 'B3'],
    focusNotes: ['Bb3'],
    contextNotes: ['A3', 'B3'],
    clef: 'bass',
    ledgerLines: false,
    accidentals: true
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },

  newContent: NEW_CONTENT_TYPES.NOTE,
  newContentDescription: 'Note Bb',

  exercises: [
    {
      // NOTE_RECOGNITION ONLY — mic outputs A#3 not Bb3 (enharmonic bug INTG-03)
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['A3', 'Bb3', 'B3'],
        questionCount: 8,
        clef: 'bass',
        timeLimit: null
      }
    }
  ],

  skills: ['A3', 'Bb3', 'B3'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Bass Accidentals Boss Node

```javascript
// Source: boss_treble_accidentals pattern, adapted for bass
{
  id: 'boss_bass_accidentals',
  name: 'Bass Accidentals Master',
  description: 'Face all seven bass accidentals in one epic challenge!',
  unlockHint: 'Complete both the sharps and flats units to face the ultimate challenge!',
  category: 'boss',              // string literal, NOT CATEGORY constant
  unit: 5,                       // last unit (flats)
  unitName: 'Accidentals Master', // override: cross-unit boss
  order: /* after Unit 5 boss */,
  orderInUnit: /* last in file */,
  prerequisites: ['boss_bass_5'],

  nodeType: NODE_TYPES.BOSS,

  noteConfig: {
    // All 7 accidentals + full C4-C3 bass natural range
    notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3',
               'F#3', 'C#3', 'G#3', 'Bb3', 'Eb3', 'Ab3', 'Db3'],
    focusNotes: [],
    contextNotes: [/* same as notePool */],
    clef: 'bass',
    ledgerLines: false,
    accidentals: true
  },

  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 65, max: 75, default: 70 }
  },

  newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
  newContentDescription: 'Bass Accidentals Master Challenge',

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: { notePool: [/* same 15-note pool */], questionCount: 15, clef: 'bass', timeLimit: null }
    },
    {
      // SIGHT_READING safe here — inert until Phase 04 wires it in (INTG-03 fix)
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: [/* same 15-note pool */],
        measuresPerPattern: 2,
        clef: 'bass',
        timeSignature: '4/4',
        rhythmPatterns: ['quarter', 'half'],
        tempo: 70
      }
    }
  ],

  skills: [/* same 15-note pool */],
  xpReward: 200,
  accessoryUnlock: null,
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

### Sight Reading Practice Node (Sharps — safe)

```javascript
// Source: trebleUnit4Redesigned.js "Sharps Together" pattern — SIGHT_READING safe for sharps
{
  id: 'bass_4_4',
  name: 'Sharps Together',
  description: 'Play F#, C#, and G# together',
  // ...
  exercises: [
    {
      type: EXERCISE_TYPES.SIGHT_READING,
      config: {
        notePool: ['F#3', 'C#3', 'G#3'],
        measuresPerPattern: 2,
        clef: 'bass',
        timeSignature: '4/4',
        rhythmPatterns: ['quarter'],
        tempo: 65
      }
    }
  ]
}
```

### Memory Game Node (safe for both sharps and flats — no mic)

```javascript
// Source: bassUnit3Redesigned.js "Octave Mix" pattern — memory game has no mic input
{
  type: EXERCISE_TYPES.MEMORY_GAME,
  config: {
    notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'Bb3', 'Eb3', 'Ab3', 'Db3'],
    gridSize: '4x4',             // picks 8 pairs from pool
    clef: 'bass',
    timeLimit: 150               // 2.5 minutes (matches bass Unit 3)
  }
}
```

### Export Verification Command

```bash
# Verify a new unit file after authoring
node -e "import('./src/data/units/bassUnit4Redesigned.js').then(m => {
  const n = m.default;
  console.log('count:', n.length);
  console.log('ids:', n.map(x => x.id).join(', '));
  console.log('orders:', n.map(x => x.order).join(', '));
  console.log('all accidentals:true', n.every(x => x.noteConfig.accidentals));
  console.log('boss cat:', n.at(-1).category);
  console.log('boss exercises:', n.at(-1).exercises.length);
})"
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Same 2-note sets per unit (Phase 02) | Different accidental per node, 3-4 accidentals per unit | More Discovery nodes needed per unit; unit count ~8-10 instead of 7 |
| Treble: F#4, C#4 only | Treble: F#4, C#4, G#4 (sharps) + Bb4, Eb4, Ab4, Db4 (flats) | Phase 02 treble files are stale — must delete and re-author |
| Manual enharmonic flag derivation | Phase 01 fix: enableSharps/enableFlats derived from notePool in TrailNodeModal | New accidental units with correct notePools auto-enable correct game flags |
| patternBuilder excluded accidentals | Phase 01 fix: regex handles [#b]? | Sharps/flats now appear in sight reading patterns |

**Deprecated/outdated:**
- `trebleUnit4Redesigned.js` (Phase 02 version): Replaced by Phase 03 with G#4 added and different pedagogy. Must be deleted.
- `trebleUnit5Redesigned.js` (Phase 02 version): Replaced by Phase 03 with Ab4, Db4 added and different pedagogy. Must be deleted.

---

## Open Questions

1. **Note pool for bass sharps Discovery nodes (BCA starting pool)**
   - What we know: User specified starting pool B3, C4, A3. For F#3 discovery, nearest neighbors are E3/G3. But F#3 sits between F3 and G3, so context F3 + G3 or B3 + C4 are both valid options.
   - What's unclear: Should discovery node use strict nearest neighbors (F3, G3 as context for F#3) or the BCA context the user mentioned?
   - Recommendation: Use nearest neighbors for max pedagogical clarity (F3, F#3, G3 pool for F#3 discovery). The "BCA starting pool" applies to the practice/expansion nodes, not the initial 3-note discovery context.

2. **Node count for flats unit (4 flats, 1 per Discovery)**
   - What we know: 4 Discovery nodes minimum (one per flat), plus Practice, Memory, Speed, Boss = minimum 8 nodes. Unit may benefit from 9 (extra Practice for reinforcement).
   - What's unclear: Exact optimal count
   - Recommendation: 9 nodes for flats unit (4 Discovery + 2 Practice + 1 Memory + 1 Speed + 1 Boss), 8 for sharps (3 Discovery + 2 Practice + 1 Memory + 1 Speed + 1 Boss). This is within Claude's Discretion.

3. **boss_treble_accidentals cross-unit notePool**
   - What we know: New design has 7 treble accidentals (F#4, C#4, G#4, Bb4, Eb4, Ab4, Db4) + full C4-C5 octave.
   - What's unclear: Whether to include G#4 AND Ab4 in the same pool (they're enharmonic). Answer: yes, they're different pitch string entries in TREBLE_NOTE_DATA and both belong in the accidentals boss pool for completeness. The game uses pitch strings, not frequencies.
   - Recommendation: Include all 7 accidental strings + all 8 natural notes in the boss pool (15 notes total).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (config: `vitest.config.js`) |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BASS-01 | Bass flats unit exports valid node array; Bb3 and Eb3 Discovery nodes present; no SIGHT_READING in regular nodes | smoke | `node -e "import('./src/data/units/bassUnit5Redesigned.js').then(m=>console.log(m.default.length))"` | ❌ Wave 0 — file authored in this phase |
| BASS-02 | Bass accidentals covered: Ab3 and Db3 appear in flats unit notePool; G#3 (sharps) distinct from Ab3 (flats) | smoke | same node export check | ❌ Wave 0 |
| BASS-03 | Boss accidentals node has category:'boss', isBoss:true, 2 exercises, all 7 accidentals in notePool | smoke | `node -e "import('./src/data/units/bassUnit5Redesigned.js').then(m=>{const b=m.default.at(-1);console.log(b.id,b.category,b.isBoss,b.exercises.length,b.noteConfig.notePool.length)})"` | ❌ Wave 0 |

**Note:** Phase 03 creates data-only files not yet wired into expandedNodes.js. `validateTrail.mjs` runs against SKILL_NODES which reads from expandedNodes.js — validator runs in Phase 04. Phase 03 verification is:
1. ESM dynamic import checks (as above) — verify export shape
2. Manual inspection: check all IDs, order values, prerequisite chains, accidentals flags, no SIGHT_READING in flats regular nodes

### Sampling Rate

- **Per task commit:** Manual node structure review + dynamic import export count check
- **Per wave merge:** `npx vitest run` (existing tests; won't fail for new data files)
- **Phase gate:** Full suite green + manual review of all IDs, orders, prerequisites, enharmonic safety before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/validateTrail.mjs` — covers BASS-01, BASS-02, BASS-03 (runs only after Phase 04 integration)
- No new Vitest test files needed — pure data authoring with structural validation via validateTrail.mjs in Phase 04

*(Existing test infrastructure covers all runtime behaviors. Phase 03 introduces no runtime logic.)*

---

## Sources

### Primary (HIGH confidence)

- `src/data/units/bassUnit3Redesigned.js` — template for bass unit structure; START_ORDER=66, 10 nodes (66-75), boss_bass_3 at order 75. Direct read confirmed.
- `src/data/units/trebleUnit3Redesigned.js` — treble order anchor; START_ORDER=17, 10 nodes (17-26), boss_treble_3 at order 26. Direct read confirmed.
- `src/data/units/trebleUnit4Redesigned.js` — Phase 02 output; current structure to be deleted + replaced. Direct read confirmed.
- `src/data/units/trebleUnit5Redesigned.js` — Phase 02 output; current structure to be deleted + replaced. Direct read confirmed.
- `src/data/nodeTypes.js` — NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES. All values verified by direct read.
- `src/data/constants.js` — EXERCISE_TYPES. All values verified by direct read.
- `src/data/expandedNodes.js` — aggregator pattern; confirmed does NOT import trebleUnit4/5 or any bassUnit4/5 yet. Phase 04 integration point.
- `src/components/games/sight-reading-game/constants/noteDefinitions.js` — BASS_NATURAL_NOTES covers B1-F4; withAccidentals() generates Bb3, Eb3, Ab3, Db3, F#3, C#3, G#3 from that range. Direct read confirmed.
- `.planning/milestones/v2.2-phases/03-bass-accidentals-content/03-CONTEXT.md` — Locked decisions source. Direct read.
- `.planning/milestones/v2.2-phases/02-treble-accidentals-content/02-RESEARCH.md` — Phase 02 research; enharmonic bug analysis applies directly. Direct read.

### Secondary (MEDIUM confidence)

- Phase 02 PLAN.md — node structure specification, order numbering arithmetic. Verified against trebleUnit4/5 actual output.
- `src/hooks/usePitchDetection.js` — NOTE_NAMES array (sharps only): confirms enharmonic constraint; not re-read but documented in Phase 02 research with line numbers.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by reading all source files directly; no external dependencies
- Architecture: HIGH — template is bassUnit3 file; pattern is mechanical; all pitch strings verified in BASS_NOTE_DATA
- Pitfalls: HIGH — enharmonic bug is code-verified (Phase 02 research); order math is arithmetic; three-sharp/four-flat count is locked decision
- Validation: MEDIUM — validateTrail.mjs won't run until Phase 04; manual review is the gate

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (30 days — stable data-authoring domain, no external dependencies)
