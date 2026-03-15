# Phase 02: Treble Accidentals Content - Research

**Researched:** 2026-03-15
**Domain:** Trail unit file authoring — JavaScript data files only (no runtime logic changes)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Medium unit size (6-7 nodes per unit) — exact count is Claude's discretion
- One Discovery node per new note (F#4 separate from C#4; Bb4 separate from Eb4)
- All 4 game modes used across each unit: Note Recognition, Sight Reading, Memory Game, Speed Round
- Boss node has 2 exercises: Note Recognition + Sight Reading (matching boss_treble_3 pattern)
- Discovery nodes use nearest neighbor naturals as context:
  - F#4 → context: F4 + G4
  - C#4 → context: C4 + D4
  - Bb4 → context: A4 + B4
  - Eb4 → context: D4 + E4
- Gradual pool expansion: accidentals-only first, then add 3-4 naturals, then full octave + accidentals in final nodes
- Flats unit does NOT reference sharps — units stay independent
- Boss node mixes all 4 accidentals (F#4, C#4, Bb4, Eb4) with full C4-C5 natural octave (~12 note pool)
- Integration into expandedNodes.js and subscription gate happens in Phase 04 (NOT this phase)

### Claude's Discretion
- Exact node count per unit (6 or 7)
- Node type sequence (which node types in which order)
- XP reward values per node (existing range: 45-70 per node, 150 for boss)
- Unit and node naming (kid-friendly for 8-year-olds)
- Exact note pool composition at each gradual expansion step
- rhythmConfig settings per node (complexity, durations, tempo)
- questionCount per exercise

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TREB-01 | Treble sharps unit introduces F#4 and C#4 with discovery, practice, and mixed nodes | Unit file pattern, accidentals flag, order numbering, enharmonic risk |
| TREB-02 | Treble flats unit introduces Bb4 and Eb4 with discovery, practice, and mixed nodes | Same pattern; sight reading excluded for flats (enharmonic bug) |
| TREB-03 | Treble accidentals boss challenge node covering all 4 accidentals | Boss node pattern from boss_treble_3; boss has category: 'boss' |
</phase_requirements>

---

## Summary

Phase 02 is pure content authoring: create two new unit files (`trebleUnit4Redesigned.js` for sharps, `trebleUnit5Redesigned.js` for flats) and one boss challenge node. No runtime logic changes. The existing unit file pattern in `trebleUnit3Redesigned.js` is the complete template — copy, adapt node IDs, update order numbers, set `accidentals: true` in noteConfig, and carefully manage note pools across the progression.

The single non-trivial technical concern is **enharmonic equivalence in sight reading**: the pitch detection pipeline always outputs sharp notation (`A#4`, `C#4`, `F#4`) from `usePitchDetection.js`. The comparison in `SightReadingGame.jsx` is a strict string equality (`detectedNote === matchingEvent.pitch`). This means any SIGHT_READING exercise with flats in the notePool will silently score incorrectly with mic input. Sharps are safe (mic and pattern both use `F#4`, `C#4`). Flats are unsafe for sight reading. The fix belongs in Phase 04 (INTG-03), so the flat unit's SIGHT_READING exercises must be excluded from this phase — or restricted to Note Recognition and Memory Game only until Phase 04 resolves it.

The boss challenge node mixes both sharps and flats. Its SIGHT_READING exercise will have the same enharmonic problem for flat notes. The decision: either defer the boss SIGHT_READING exercise to Phase 04, or include it knowing Phase 04 will fix `SightReadingGame.jsx` before integration. Since Phase 04 integrates the files, the boss can safely have SIGHT_READING in its definition — it won't be playable until Phase 04 wires it in.

**Primary recommendation:** Create both unit files with SIGHT_READING exercises for sharps (safe) but only NOTE_RECOGNITION + MEMORY_GAME for flats in-unit practice nodes. The boss challenge node can include its SIGHT_READING exercise as-defined since it becomes playable only after Phase 04 fixes INTG-03.

---

## Standard Stack

### Core Files

| File | Version | Purpose | Notes |
|------|---------|---------|-------|
| `src/data/units/trebleUnit3Redesigned.js` | current | Template to copy | 10-node pattern with boss |
| `src/data/nodeTypes.js` | current | NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES | Import exactly as trebleUnit3 does |
| `src/data/constants.js` | current | EXERCISE_TYPES | Import exactly as trebleUnit3 does |

### Supporting Files (READ ONLY in Phase 02 — DO NOT MODIFY)

| File | Why It Matters |
|------|---------------|
| `src/data/expandedNodes.js` | Phase 04 integration point — new imports added here in Phase 04, not Phase 02 |
| `src/config/subscriptionConfig.js` | New node IDs added here in Phase 04 |
| `src/locales/en/trail.json` | Node names/descriptions added in Phase 04 |
| `src/locales/he/trail.json` | Hebrew translations added in Phase 04 |

**Installation:** No new packages. Pure JavaScript data file authoring.

---

## Architecture Patterns

### Verified Order Numbering

From reading all three existing treble unit files:

| Unit | START_ORDER | Node count | Last order (boss) | Boss ID |
|------|------------|------------|-------------------|---------|
| Unit 1 | 1 | 8 | 8 | boss_treble_1 |
| Unit 2 | 9 | 8 | 16 | boss_treble_2 |
| Unit 3 | 17 | 10 | 26 | boss_treble_3 |
| **Unit 4 (sharps)** | **27** | **TBD 6-7+boss** | TBD | **boss_treble_4** |
| **Unit 5 (flats)** | **starts after Unit 4** | **TBD** | TBD | **boss_treble_5** |
| **Accidentals boss** | after Unit 5 boss | 1 | — | **boss_treble_accidentals** |

Unit 4 START_ORDER = 27. Unit 5 START_ORDER = 27 + (Unit 4 node count including boss). The accidentals boss goes after all Unit 5 nodes.

### Verified Unit File Structure

The complete module shape (from `trebleUnit3Redesigned.js`):

```javascript
import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 4;                          // increment from Unit 3
const UNIT_NAME = 'Sharp Notes';            // kid-friendly, 8-year-old
const CATEGORY = 'treble_clef';
const START_ORDER = 27;

export const trebleUnit4Nodes = [ /* nodes */ ];
export default trebleUnit4Nodes;
```

### Verified Node Shape (mandatory fields)

Every non-boss node:

```javascript
{
  id: 'treble_4_1',                         // treble_{unitId}_{orderInUnit}
  name: 'Kid-Friendly Name',
  description: 'Short description',
  category: CATEGORY,                        // 'treble_clef'
  unit: UNIT_ID,                             // integer
  unitName: UNIT_NAME,                       // string
  order: START_ORDER,                        // absolute trail position
  orderInUnit: 1,                            // 1-based within unit
  prerequisites: ['boss_treble_3'],          // first node: previous boss; subsequent: previous node ID
  nodeType: NODE_TYPES.DISCOVERY,            // from NODE_TYPES enum
  noteConfig: {
    notePool: ['F4', 'F#4', 'G4'],
    focusNotes: ['F#4'],                     // empty [] for practice/mix nodes
    contextNotes: ['F4', 'G4'],
    clef: 'treble',
    ledgerLines: false,
    accidentals: true                        // KEY DIFFERENCE from natural units
  },
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    allowedDurations: ['q'],
    patterns: ['quarter'],
    tempo: { min: 60, max: 70, default: 65 }
  },
  newContent: NEW_CONTENT_TYPES.NOTE,        // NOTE | NONE | CHALLENGE_TYPE
  newContentDescription: 'Note F#',
  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['F4', 'F#4', 'G4'],
        questionCount: 8,
        clef: 'treble',
        timeLimit: null
      }
    }
  ],
  skills: ['F4', 'F#4', 'G4'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Verified Boss Node Shape

```javascript
{
  id: 'boss_treble_4',
  name: 'Sharp Star',                        // kid-friendly boss name
  description: 'Master all sharp notes!',
  unlockHint: 'Complete all lessons in this unit to unlock the big challenge!',
  category: 'boss',                          // NOT 'treble_clef'
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + N,
  orderInUnit: N + 1,
  prerequisites: ['treble_4_N'],             // last regular node
  nodeType: NODE_TYPES.BOSS,
  noteConfig: {
    notePool: ['C4','D4','E4','F4','F#4','G4','A4','C#4'],  // sharps + naturals
    focusNotes: [],
    contextNotes: [...],
    clef: 'treble',
    ledgerLines: false,
    accidentals: true
  },
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    allowedDurations: ['q', 'h'],
    patterns: ['quarter', 'half'],
    tempo: { min: 60, max: 75, default: 70 }
  },
  newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
  newContentDescription: 'Sharps Boss Challenge',
  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: { notePool: [...], questionCount: 15, clef: 'treble', timeLimit: null }
    },
    {
      type: EXERCISE_TYPES.SIGHT_READING,     // safe for sharps boss
      config: {
        notePool: [...],
        measuresPerPattern: 2,
        clef: 'treble',
        timeSignature: '4/4',
        rhythmPatterns: ['quarter', 'half'],
        tempo: 70
      }
    }
  ],
  skills: [...],
  xpReward: 150,
  accessoryUnlock: 'sharp_star_badge',       // or null if badge not yet defined
  isBoss: true,
  isReview: false,
  reviewsUnits: []
}
```

### Accidentals Boss (boss_treble_accidentals)

The combined boss node after Unit 5 follows the same pattern but uses `category: 'boss'`, `isBoss: true`, and has a mixed notePool of all 4 accidentals + full C4-C5 octave (~12 notes). Its SIGHT_READING exercise is structurally correct to include — it will only be playable after Phase 04 resolves INTG-03. Until then it's inert (not wired into expandedNodes.js).

### Pedagogical Note Pool Progression

**Unit 4 (Sharps) — recommended expansion:**

| Node | notePool | Pool size |
|------|----------|-----------|
| Discovery: Meet F# | F4, F#4, G4 | 3 |
| Discovery: Meet C# | C4, C#4, D4 | 3 |
| Practice: Sharps Together | F#4, C#4 | 2 |
| Practice: Sharps + Friends | C4, D4, F4, F#4, G4, C#4 | 6 |
| Mix-Up/Memory | full octave + F#4 + C#4 | ~10 |
| Speed Round | full octave + F#4 + C#4 | ~10 |
| Boss (boss_treble_4) | full octave + F#4 + C#4 | ~10 |

**Unit 5 (Flats) — recommended expansion:**

| Node | notePool | Pool size |
|------|----------|-----------|
| Discovery: Meet Bb | A4, Bb4, B4 | 3 |
| Discovery: Meet Eb | D4, Eb4, E4 | 3 |
| Practice: Flats Together | Bb4, Eb4 | 2 |
| Practice: Flats + Friends | D4, E4, A4, Bb4, Eb4, B4 | 6 |
| Mix-Up/Memory | full octave + Bb4 + Eb4 | ~10 |
| Speed Round | full octave + Bb4 + Eb4 | ~10 |
| Boss (boss_treble_5) | full octave + Bb4 + Eb4 | ~10 |

**Accidentals Boss (boss_treble_accidentals):**
`['C4','D4','E4','F4','F#4','G4','A4','Bb4','B4','C#4','Eb4','C5']` — 12 notes

### Pitch String Format (VERIFIED)

From `noteDefinitions.js` `withAccidentals()` and `patternBuilder.js`:
- Sharps: `'F#4'`, `'C#4'` (letter + `#` + octave digit)
- Flats: `'Bb4'`, `'Eb4'` (letter + `b` + octave digit — lowercase b)
- These exact strings appear in `TREBLE_NOTE_DATA` (verified in `noteDefinitions.js`)
- `patternBuilder.js` regex `^([A-G][#b]?)(\d+)$` handles both forms

### Anti-Patterns to Avoid

- **Wrong category for boss:** Boss nodes MUST use `category: 'boss'`, not `category: 'treble_clef'`
- **accidentals: false on new units:** Natural note units set `accidentals: false`; accidental units MUST set `accidentals: true`
- **Mixing sharps and flats:** Flats unit notePool must NOT include F#4 or C#4
- **Wrong prerequisite chain:** Unit 4 node 1 prerequisite = `['boss_treble_3']`; subsequent nodes chain linearly
- **Flats in SIGHT_READING:** Do not add SIGHT_READING exercises with flat notes (Bb4, Eb4) in Unit 5 regular practice nodes — mic always outputs sharps; scoring will silently fail until INTG-03 is fixed in Phase 04
- **Forgetting `export default`:** All unit files must have `export default trebleUnit4Nodes;`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Note pool validation | Custom validation logic | `npm run verify:trail` (validateTrail.mjs) | Already validates prerequisite chains, duplicate IDs, node types |
| Accidental note data | Custom note expansion | `noteDefinitions.js` `withAccidentals()` already has `Bb4`, `Eb4`, `F#4`, `C#4` | Verified in TREBLE_NOTE_DATA |
| Order numbering math | Custom counter | Simple `START_ORDER + N` pattern | Same as all existing units |

---

## Critical Pitfalls

### Pitfall 1: Flats in SIGHT_READING Exercises

**What goes wrong:** A student plays Bb4 on the piano; the mic (`usePitchDetection.js`) uses `NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']` — sharps only. It emits `'A#4'`. The sight reading game compares `detectedNote === matchingEvent.pitch` (`'A#4' === 'Bb4'`), which is `false`. The note is scored as wrong even when correctly played.

**Why it happens:** `usePitchDetection.js` has no enharmonic mapping — it only knows sharp names. `SightReadingGame.jsx` line 1682 uses strict string comparison.

**How to avoid:** For Unit 5 (flats), DO NOT include `EXERCISE_TYPES.SIGHT_READING` in any regular practice nodes. Use NOTE_RECOGNITION and MEMORY_GAME instead. The boss_treble_5 and boss_treble_accidentals nodes can include SIGHT_READING in their definition (since they become playable only after Phase 04 resolves INTG-03).

**For sharps:** F#4 and C#4 are safe — mic outputs `'F#4'` and `'C#4'`, which match the pattern exactly.

**Warning signs:** A student plays correctly but scores 0% on flat exercises with mic input.

### Pitfall 2: Wrong Unit Number in Node IDs

**What goes wrong:** Copy-pasting trebleUnit3 and forgetting to update all `id: 'treble_3_X'` to `id: 'treble_4_X'`. The trail validator (`validateTrail.mjs`) catches duplicate IDs — but only if the new files are wired into expandedNodes.js (which happens in Phase 04). Silent in Phase 02 execution.

**How to avoid:** Global find-replace `treble_3_` → `treble_4_` immediately after copying. Review all node IDs before finishing.

### Pitfall 3: Order Collision Between Unit 4 and 5

**What goes wrong:** Unit 5's START_ORDER = Unit 4 START_ORDER (27) without accounting for Unit 4's actual node count.

**How to avoid:** COUNT the nodes in Unit 4 (including boss). If Unit 4 has 7 nodes (6 regular + 1 boss), Unit 5 START_ORDER = 27 + 7 = 34. The accidentals boss goes after Unit 5. Document the count in the file header comment.

### Pitfall 4: Boss node prerequisite is wrong

**What goes wrong:** Boss node prerequisite points to the wrong ID (e.g., copied from previous unit and not updated).

**How to avoid:** Boss node prerequisites = `[last regular node ID in that unit]`. Verify the last regular node's ID explicitly before writing the boss prerequisite.

### Pitfall 5: skillTrail.js UNITS vs unit file IDs

**What goes wrong:** The UNITS map in `skillTrail.js` already has `TREBLE_4` defined as "Extended Range" (a different description from sharps). The unit file uses `unit: 4` which is an integer, not a reference to the UNITS map. The UNITS map is metadata-only and not tied to the node `unit` field. No conflict — the `unit` field on nodes is just an integer ID.

**How to avoid:** Use `unit: 4` and `unit: 5` as integers. The UNITS map metadata in skillTrail.js has stale names but does not affect runtime behavior.

---

## Code Examples

### Discovery Node for F#4 (verified pattern)

```javascript
// Source: trebleUnit3Redesigned.js "Meet A" node, adapted for accidentals
{
  id: 'treble_4_2',
  name: 'Meet F Sharp',
  description: 'Learn your first sharp note!',
  category: CATEGORY,
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + 1,
  orderInUnit: 2,
  prerequisites: ['treble_4_1'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['F4', 'F#4', 'G4'],
    focusNotes: ['F#4'],
    contextNotes: ['F4', 'G4'],
    clef: 'treble',
    ledgerLines: false,
    accidentals: true                        // REQUIRED for accidental units
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
        notePool: ['F4', 'F#4', 'G4'],
        questionCount: 8,
        clef: 'treble',
        timeLimit: null
      }
    }
  ],

  skills: ['F4', 'F#4', 'G4'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Flat Discovery Node (mic-safe: NOTE_RECOGNITION only)

```javascript
// Source: pattern verified — SIGHT_READING excluded for mic enharmonic safety
{
  id: 'treble_5_2',
  name: 'Meet B Flat',
  description: 'Learn your first flat note!',
  category: CATEGORY,
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER + 1,
  orderInUnit: 2,
  prerequisites: ['treble_5_1'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['A4', 'Bb4', 'B4'],          // Bb4 — lowercase b, verified in noteDefinitions.js
    focusNotes: ['Bb4'],
    contextNotes: ['A4', 'B4'],
    clef: 'treble',
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
      type: EXERCISE_TYPES.NOTE_RECOGNITION, // NOT SIGHT_READING — mic enharmonic bug (INTG-03)
      config: {
        notePool: ['A4', 'Bb4', 'B4'],
        questionCount: 8,
        clef: 'treble',
        timeLimit: null
      }
    }
  ],

  skills: ['A4', 'Bb4', 'B4'],
  xpReward: 45,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: []
}
```

### Memory Game Node (safe for both sharps and flats — no mic)

```javascript
// Source: trebleUnit3Redesigned.js "Octave Memory" node pattern
{
  type: EXERCISE_TYPES.MEMORY_GAME,
  config: {
    notePool: ['C4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'C#4'],
    gridSize: '4x4',                         // 8 pairs = 16 cards
    clef: 'treble',
    timeLimit: 180
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual accidental note lists | `withAccidentals()` in noteDefinitions.js generates all accidentals automatically | Bb4, Eb4, F#4, C#4 already exist in TREBLE_NOTE_DATA — no extra setup needed |
| Pattern builder excluding accidentals | Phase 01 fix: patternBuilder regex now handles `[#b]?` | Accidental pitches are included in generated patterns |
| Trail flag derivation inside games | Phase 01 fix: enableSharps/enableFlats derived from notePool in TrailNodeModal | Unit 4/5 nodes with accidental notePool will automatically enable correct game mode |

---

## Open Questions

1. **Unit 5 SIGHT_READING in regular nodes**
   - What we know: Mic enharmonic bug makes flat sight reading score 0% (strict string compare, mic outputs A#4 not Bb4)
   - What's unclear: Does the planner want to include SIGHT_READING in flats unit anyway (with a caveat it's mic-broken until Phase 04), or exclude entirely?
   - Recommendation: Exclude SIGHT_READING from all Unit 5 regular practice nodes. The boss nodes (boss_treble_5, boss_treble_accidentals) can include SIGHT_READING since they're not playable until Phase 04 integrates the files.

2. **Accidentals boss category field**
   - What we know: All boss nodes use `category: 'boss'`, but the accidentals boss spans both treble units 4 and 5
   - What's unclear: Should `unit` be 4, 5, or a new value?
   - Recommendation: Use `unit: 5` (last unit it completes) and `unitName: 'Accidentals Master'`. The `category: 'boss'` takes precedence for display.

3. **accessoryUnlock for new bosses**
   - What we know: boss_treble_3 uses `accessoryUnlock: 'octave_master_badge'`; the accessories map in trail.json does not yet have a sharps/flats badge entry
   - What's unclear: Should Phase 02 define new badge IDs or use `null`?
   - Recommendation: Use `null` for now. Phase 04 will add accessory definitions alongside i18n. Setting a badge ID that doesn't exist in the accessories map won't cause a crash (it just won't display).

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
| TREB-01 | Sharps unit file exports valid node array with correct IDs, order, accidentals:true | smoke | `node scripts/validateTrail.mjs` (after Phase 04 wires) | ❌ Wave 0 (validation runs at build time, not unit test) |
| TREB-02 | Flats unit file exports valid node array, no SIGHT_READING in regular nodes | smoke | `node scripts/validateTrail.mjs` | ❌ Wave 0 |
| TREB-03 | Boss challenge node has category:'boss', isBoss:true, 2 exercises | smoke | `node scripts/validateTrail.mjs` | ❌ Wave 0 |

**Note:** Phase 02 creates data-only files that are NOT yet wired into expandedNodes.js (that happens in Phase 04). The trail validator (`validateTrail.mjs`) reads from `SKILL_NODES` which comes from `expandedNodes.js`. Therefore the validator cannot run against Phase 02 output until Phase 04. The practical verification in Phase 02 is:
1. `node -e "import('./src/data/units/trebleUnit4Redesigned.js').then(m => console.log(m.default.length))"` — verify export
2. Manual inspection: check all node IDs, order values, prerequisite chains, accidentals flags

### Sampling Rate

- **Per task commit:** Manual node structure review (no automated test available pre-Phase 04)
- **Per wave merge:** `npx vitest run` (existing tests — won't fail for new data files)
- **Phase gate:** Full suite green + manual review of all node IDs, orders, prerequisites before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/validateTrail.mjs` — covers TREB-01, TREB-02, TREB-03 (but runs only after Phase 04 integration)
- No new test files needed for Phase 02 — pure data authoring with structural validation via validateTrail.mjs in Phase 04

*(Existing test infrastructure covers all runtime behaviors. Phase 02 introduces no runtime logic.)*

---

## Sources

### Primary (HIGH confidence)

- `src/data/units/trebleUnit3Redesigned.js` — complete unit file template, verified by direct read
- `src/data/units/trebleUnit1Redesigned.js` — START_ORDER=1 confirmed
- `src/data/units/trebleUnit2Redesigned.js` — START_ORDER=9 confirmed, verifies Unit 4 = 27
- `src/data/expandedNodes.js` — aggregator pattern, Phase 04 integration point
- `src/data/nodeTypes.js` — NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES (all verified values)
- `src/data/constants.js` — EXERCISE_TYPES (all verified values)
- `src/hooks/usePitchDetection.js` — NOTE_NAMES array (sharps only), enharmonic bug confirmed at line 25-38
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — strict string compare at line 1682 confirmed
- `src/components/games/sight-reading-game/constants/noteDefinitions.js` — Bb4, Eb4, F#4, C#4 confirmed in TREBLE_NOTE_DATA via withAccidentals()
- `src/components/trail/TrailNodeModal.jsx` — Phase 01 fix confirmed: enableSharps/enableFlats derived from notePool
- `src/config/subscriptionConfig.js` — explicit ID list pattern confirmed; Phase 04 adds new IDs
- `scripts/validateTrail.mjs` — build validator checks prerequisite chains, node types, duplicate IDs

### Secondary (MEDIUM confidence)

- `src/data/skillTrail.js` — UNITS map has TREBLE_4/TREBLE_5 with stale names but does not affect node `unit` integer field (metadata-only, confirmed not runtime-critical)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by reading all source files directly
- Architecture: HIGH — template is the trebleUnit3 file; pattern is mechanical
- Pitfalls: HIGH — enharmonic bug is code-verified (line numbers cited), order math is arithmetic
- Validation: MEDIUM — validateTrail.mjs won't run until Phase 04 wires; manual review is the gate

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (30 days — stable data-authoring domain, no external dependencies)
