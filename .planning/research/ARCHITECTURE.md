# Architecture Research

**Domain:** Piano learning PWA — Sharps & Flats trail content expansion
**Researched:** 2026-03-15
**Confidence:** HIGH (entire codebase analyzed directly)

---

## System Overview

This is not a greenfield architecture question. The Sharps & Flats milestone slots new data files into an existing, fully-wired system. The existing system already supports accidentals end-to-end: SVG note images exist, VexFlow renders them via the `Accidental` modifier, pitch detection outputs sharp names (`C#4`, `Gb3`), and `NotesRecognitionGame` already separates natural and accidental answer buttons. The main work is **content definition** (new unit files) with one targeted bug fix where the trail auto-start path hard-codes `enableSharps: false, enableFlats: false`.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER (build-time)                        │
│  trebleUnit4.js  trebleUnit5.js  bassUnit4.js  bassUnit5.js          │
│  (new files)     (new files)     (new files)   (new files)           │
│           │                           │                              │
│           └─────────────────────────→ expandedNodes.js              │
│                (add imports + spreads)                               │
│                          │                                           │
│                       skillTrail.js (SKILL_NODES — unchanged)        │
│                          │                                           │
│                   validateTrail.mjs  (unchanged)                     │
└─────────────────────────────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────────────────┐
│           │              GATE LAYER                                   │
│   subscriptionConfig.js  ←  all new nodes: premium by absence        │
│   Postgres is_free_node()    (no changes to FREE_NODE_IDS)           │
└───────────┼──────────────────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────────────────┐
│           │              GAME LAYER (one fix required)                │
│                                                                       │
│  NotesRecognitionGame.jsx  ← auto-start block forces                 │
│    enableSharps:false / enableFlats:false regardless of node config  │
│    FIX: derive from notePool contents                                │
│                                                                       │
│  SightReadingGame.jsx  ← patternBuilder uses notePool as-is;         │
│    accidentals already render via VexFlow Accidental modifier         │
│    No changes needed                                                  │
│                                                                       │
│  MemoryGame.jsx  ← uses notePool directly; no changes needed         │
└──────────────────────────────────────────────────────────────────────┘
            │
┌───────────┼──────────────────────────────────────────────────────────┐
│           │              RENDERING LAYER (no changes needed)          │
│                                                                       │
│  VexFlowStaffDisplay.jsx  ← parsePitchForVexflow() already handles   │
│    Eb4 → key:"e/4" + Accidental("b")                                 │
│    F#3 → key:"f/3" + Accidental("#")                                 │
│                                                                       │
│  NoteImageDisplay.jsx  ← renders ImageComponent from note object;    │
│    SVG assets already exist for all sharps/flats in octave range     │
│                                                                       │
│  usePitchDetection.js  ← outputs sharp names natively                │
│    NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]│
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Role | Change for v2.2 |
|-----------|------|-----------------|
| `trebleUnit4Redesigned.js` (new) | Node definitions for treble sharps | NEW FILE |
| `trebleUnit5Redesigned.js` (new) | Node definitions for treble flats | NEW FILE |
| `bassUnit4Redesigned.js` (new) | Node definitions for bass sharps | NEW FILE |
| `bassUnit5Redesigned.js` (new) | Node definitions for bass flats | NEW FILE |
| `expandedNodes.js` | Aggregates all unit node arrays | ADD 4 imports + spreads |
| `subscriptionConfig.js` | Declares free node IDs | No changes — new nodes are premium by absence |
| `validateTrail.mjs` | Build-time prerequisite/type/XP checks | No changes needed |
| `skillTrail.js` UNITS object | Unit metadata | Optional: add TREBLE_4/5, BASS_4/5 entries |
| `NotesRecognitionGame.jsx` | Trail auto-start injects settings | MODIFY auto-start block only (~3 lines) |
| `SightReadingGame.jsx` | Pattern generation + VexFlow rendering | No changes needed |
| `MemoryGame.jsx` | Memory card pairs from notePool | No changes needed |
| `VexFlowStaffDisplay.jsx` | SVG music notation rendering | No changes needed |
| `patternBuilder.js` | Generates note sequences from notePool | No changes needed |
| `noteDefinitions.js` | Note data including accidentals | No changes needed |
| `gameSettings.js` | Image map lookup for note SVGs | No changes needed (SVGs already present) |

---

## Recommended File Structure

New files are all in `src/data/units/`. Nothing outside that directory needs new files.

```
src/data/units/
├── trebleUnit1Redesigned.js    (existing)
├── trebleUnit2Redesigned.js    (existing)
├── trebleUnit3Redesigned.js    (existing)
├── trebleUnit4Redesigned.js    NEW: Unit 4, sharps (treble) — START_ORDER = 27
├── trebleUnit5Redesigned.js    NEW: Unit 5, flats (treble) — START_ORDER = 27 + len(unit4)
├── bassUnit1Redesigned.js      (existing)
├── bassUnit2Redesigned.js      (existing)
├── bassUnit3Redesigned.js      (existing)
├── bassUnit4Redesigned.js      NEW: Unit 4, sharps (bass) — START_ORDER = lastBassOrder + 1
├── bassUnit5Redesigned.js      NEW: Unit 5, flats (bass) — START_ORDER = lastBassUnit4Order + 1
└── (rhythm units untouched)

src/data/
├── expandedNodes.js            MODIFY: add 4 imports and 4 spreads
├── skillTrail.js               (unchanged)
├── constants.js                (unchanged)
├── nodeTypes.js                (unchanged, all NODE_TYPES already sufficient)

src/components/games/notes-master-games/
└── NotesRecognitionGame.jsx    MODIFY: auto-start useEffect block only
```

---

## Architectural Patterns

### Pattern 1: Accidentals-in-notePool

**What:** Put accidental pitches directly in `noteConfig.notePool` and `exercises[].config.notePool` using the existing format (`'Eb4'`, `'F#3'`). Set `noteConfig.accidentals: true`.

**When to use:** This is the correct approach for all new nodes. The entire rendering and detection pipeline already handles these pitch formats natively. No new abstraction is needed.

**Trade-offs:** Simple and consistent. The `accidentals: true/false` flag on `noteConfig` is currently metadata-only (nothing reads it at runtime), but setting it correctly is good practice and prepares for future filtering logic.

**Example (treble Unit 4, first accidental discovery node):**
```javascript
{
  id: 'treble_4_1',
  name: 'Meet F-Sharp',
  category: 'treble_clef',
  unit: 4,
  unitName: 'Sharps World',
  order: 27,          // After boss_treble_3 which is at order 26
  prerequisites: ['boss_treble_3'],

  nodeType: NODE_TYPES.DISCOVERY,

  noteConfig: {
    notePool: ['F4', 'G4', 'F#4'],   // Context naturals + new accidental
    focusNotes: ['F#4'],
    contextNotes: ['F4', 'G4'],
    clef: 'treble',
    ledgerLines: false,
    accidentals: true              // Informational flag; pipeline reads notePool directly
  },

  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_RECOGNITION,
      config: {
        notePool: ['F4', 'G4', 'F#4'],
        questionCount: 8,
        clef: 'treble',
        timeLimit: null
      }
    }
  ],

  skills: ['F#4'],
  xpReward: 60,
  isBoss: false
}
```

### Pattern 2: Auto-Start Accidentals Fix in NotesRecognitionGame

**What:** The trail auto-start block at lines ~518-536 currently injects `enableSharps: false, enableFlats: false` regardless of the node being played. This prevents accidental answer buttons from appearing, making any sharps/flats node unplayable via the trail.

**When to use:** Required change before any accidentals node can function end-to-end.

**Fix (surgical change to one block):**
```javascript
// In NotesRecognitionGame.jsx, inside the useEffect that fires when nodeConfig exists:

const notePool = nodeConfig.notePool || [];
const hasSharps = notePool.some(p => /[A-G]#\d/.test(String(p)));
const hasFlats  = notePool.some(p => /[A-G]b\d/.test(String(p)));

const trailSettings = {
  clef: nodeConfig.clef || 'treble',
  selectedNotes: notePool,
  timedMode: nodeConfig.timeLimit !== null && nodeConfig.timeLimit !== undefined,
  timeLimit: nodeConfig.timeLimit || 45,
  enableSharps: hasSharps,
  enableFlats: hasFlats,
};
```

**Trade-offs:** Regex-based detection is more robust than checking `accidentals: true` flag alone — defensive against unit files that might forget the flag. The change is limited to the auto-start block and does not affect free-play or manual settings paths.

### Pattern 3: Boss Node ID Naming Convention

**What:** Boss nodes use the ID prefix `boss_treble_N` or `boss_bass_N`. The TrailMap component assigns boss nodes to tabs by prefix: `node.id.startsWith('boss_treble_')` maps to the Treble tab.

**When to use:** All boss nodes in new treble/bass units must follow this convention exactly.

**Example:**
```javascript
{
  id: 'boss_treble_4',    // Not 'treble_boss_4' or 'treble_4_boss'
  category: 'boss',       // Required, not 'treble_clef'
  isBoss: true,
  accessoryUnlock: 'accidental_master_badge'  // Matches UNITS.TREBLE_5 in skillTrail.js
}
```

**Anti-example:** `'treble_4_boss'` silently causes the node to disappear from the Treble tab.

### Pattern 4: Order Numbering

**What:** `order` determines visual position and "next node" traversal via `getNextNodeInCategory()`. Collisions cause unpredictable sort; gaps cause auto-grow note pool to skip nodes.

**Current state:**
- Treble units 1-3: orders 1-26 (unit 3 starts at 17, has 10 nodes, boss at order 26)
- Bass units 1-3: start at order 51 — read `bassUnit3Redesigned.js` to find the last order before setting bass unit 4's `START_ORDER`

**Convention:** Use a named `START_ORDER` constant at the top of each unit file. Example:
```javascript
const START_ORDER = 27;  // After boss_treble_3 (order 26)
```

### Pattern 5: Separate Sharps Unit from Flats Unit

**What:** Introduce sharps in one unit (Unit 4) and flats in a separate unit (Unit 5) for each clef.

**Why:** Sharps and flats that are enharmonically equivalent (F#4 and Gb4 sound identical) cannot coexist in a single node's notePool when using microphone input — the detector outputs one spelling only. Pedagogically, 8-year-olds need to learn one symbol family before encountering the other.

**Suggested pitch sets:**
- Treble sharps (Unit 4): F#4, C#4, G#4, D#4 (the 4 most common sharps in 1-4 sharp key signatures)
- Treble flats (Unit 5): Bb4, Eb4, Ab4, Db4 (the 4 most common flats in 1-4 flat key signatures)
- Bass sharps (Unit 4): F#3, C#3, G#3, D#3
- Bass flats (Unit 5): Bb3, Eb3, Ab3, Db3

---

## Data Flow

### Trail Game Launch (Sharps/Flats Node) — After Fix

```
User taps node on TrailMap
    |
    v
TrailNodeModal reads node from SKILL_NODES (via getNodeById)
    |
    v
Navigate to game route with location.state:
  { nodeId, nodeConfig: {notePool: ['F4','F#4','G4'], clef:'treble', ...},
    exerciseIndex, totalExercises, exerciseType }
    |
    v
NotesRecognitionGame mounts → useEffect detects nodeConfig
    |
    v
Regex derives: hasSharps=true, hasFlats=false
trailSettings = { ..., enableSharps: true, enableFlats: false }
    |
    v
normalizeSelectedNotes({ selectedNotes: ['F4','F#4','G4'], enableSharps: true })
  Filters to natural notes for the base pool; sharps are tracked separately
    |
    v
useGameSettings tracks enableSharps = true
    |
    v
availableNotes useMemo includes F#4 alongside F4, G4
    |
    v
Answer buttons: naturals panel (F4, G4) + accidentals panel (F#4)
    |
    v
User plays F# on keyboard/mic → detected as "F#4" → correct answer
    |
    v
VictoryScreen → updateExerciseProgress() → DB write
```

### Sight Reading Accidental Rendering (No Change Needed)

```
nodeConfig.notePool = ['Bb4', 'A4', 'G4']
    |
    v
patternBuilder.generatePatternData({ selectedNotes: ['Bb4','A4','G4'], clef: 'treble' })
  Randomly selects pitches including 'Bb4'
  notationObject: { pitch: 'Bb4', notation: 'q', ... }
    |
    v
VexFlowStaffDisplay renders:
  parsePitchForVexflow('Bb4') → { key: 'b/4', accidental: 'b' }
  new StaveNote({ keys: ['b/4'], duration: 'q' })
  note.addModifier(new Accidental('b'), 0)   ← flat symbol on staff
    |
    v
Mic detects frequency → frequencyToNote → "A#4"
  → enharmonic check: toFlatEnharmonic("A#4") = "Bb4" ← correct
```

### Subscription Gate (No Change Needed)

```
User taps new premium node (e.g., treble_4_1)
    |
    v
isFreeNode('treble_4_1')
  → FREE_NODE_IDS.has('treble_4_1') = false  ← not in the set
  → returns false → show paywall modal
    |
    v
DB RLS (if bypassed somehow):
  is_free_node('treble_4_1') = FALSE  ← hardcoded list in Postgres
  has_active_subscription(auth.uid()) = FALSE (no sub)
  → row write blocked at database level
```

---

## Integration Points

### New Content to Existing Infrastructure

| Integration Point | What Connects | Notes |
|-------------------|---------------|-------|
| `expandedNodes.js` imports | New unit files → SKILL_NODES | Must import and spread all 4 new files |
| `subscriptionConfig.js` | New node IDs absent = premium | No action needed |
| `validateTrail.mjs` | Runs on `npm run build` | Automatically validates new nodes; no changes needed |
| `skillTrail.js` UNITS object | Unit metadata for display | Optional: add TREBLE_4, TREBLE_5, BASS_4, BASS_5 entries |
| `NotesRecognitionGame.jsx` auto-start | `enableSharps`/`enableFlats` injection | Single required fix — ~3 lines |
| `SightReadingGame.jsx` | `notePool` passed to `patternBuilder` | Works as-is |
| `MemoryGame.jsx` | `notePool` passed to card generation | Works as-is |

### Pitch Detection Compatibility

`usePitchDetection.js` always outputs sharp-form names (`C#4`, `F#3`) using `NOTE_NAMES = ["C","C#","D",...]`. When a node uses flat-form pitches (e.g., `Eb4`), the existing `toFlatEnharmonic()` function in `NotesRecognitionGame.jsx` and the `SHARP_TO_FLAT_MAP` handle conversion: detected `D#4` maps to `Eb4` before comparison. This path is already wired and runs for trail-launched sessions.

**Verify during implementation:** The `calculatePitchAccuracy` function in `scoreCalculator.js` (used by SightReadingGame) needs checking for enharmonic equivalence. If it does strict string comparison, a flat-form pattern note (e.g., `Eb4`) will never match the mic input (`D#4`). This is the highest-risk gap for SightReadingGame exercises.

### Note Image Coverage

All required accidental SVGs are already imported in `gameSettings.js`. The treble image map covers: Cb/Db/Eb/Fb/Gb/Ab/Bb flats and C#/D#/E#/F#/G#/A#/B# sharps across octaves 3-6. The bass image map covers equivalent sets for octaves 1-4. No new image assets are needed for the pitch ranges used in Units 4-5 (F#3-D#4 for bass, F#4-D#5 for treble).

---

## Anti-Patterns

### Anti-Pattern 1: Using Flags Without Putting Pitches in notePool

**What people do:** Add `accidentals: true` to the node but leave only natural pitches in `notePool`, expecting the game to automatically include sharps/flats.

**Why it's wrong:** `notePool` is the source of truth for which pitches appear as questions. `enableSharps`/`enableFlats` only control which answer buttons are shown. Without the accidental pitch in `notePool`, it is never selected as a question even with the flag set.

**Do this instead:** Always put the actual accidental pitches (`'F#4'`, `'Eb4'`) in `notePool` directly. The fix in Pattern 2 derives the flags automatically from pool contents.

### Anti-Pattern 2: Sharps and Enharmonic Flats in the Same Node

**What people do:** Put both `F#4` and `Gb4` (enharmonically identical) in a single node's `notePool`.

**Why it's wrong:** The microphone outputs one spelling only (sharp-form). Having both means one answer is always unreachable via mic. For 8-year-olds it also creates pedagogical confusion — they need to understand one symbol before encountering its enharmonic twin.

**Do this instead:** Sharps-only nodes in Unit 4, flats-only nodes in Unit 5. Never mix enharmonic spellings within a single node.

### Anti-Pattern 3: Wrong Boss Node ID Prefix

**What people do:** Name the boss node `'treble_4_boss'`, `'treble_boss_4'`, or `'boss_4_treble'`.

**Why it's wrong:** The TrailMap component assigns boss nodes to tabs via `node.id.startsWith('boss_treble_')`. Any other prefix causes the node to be excluded from the Treble tab with no error.

**Do this instead:** Follow the convention: `boss_treble_4`, `boss_treble_5`, `boss_bass_4`, `boss_bass_5`.

### Anti-Pattern 4: Order Value Collisions

**What people do:** Start a new unit at `order: 1` or use the same `START_ORDER` as an existing unit.

**Why it's wrong:** `getNextNodeInCategory()` sorts by `order` to find the next node. Collisions cause unpredictable ordering and break the auto-grow note pool feature in NotesRecognitionGame's arcade mode.

**Do this instead:** Read the last `order` value from the preceding unit file before authoring the new one. Use a named `START_ORDER` constant.

### Anti-Pattern 5: Teaching Naturals-Only Sight Reading With Accidental notePool

**What people do:** Use `EXERCISE_TYPES.SIGHT_READING` for early accidentals nodes without setting appropriate `rhythmConfig` — creating confusingly complex rhythms when the learner is focused on a new symbol.

**Why it's wrong:** Cognitive load theory: new note symbols already demand attention. Complex rhythms simultaneously are overwhelming for 8-year-olds.

**Do this instead:** For DISCOVERY nodes with accidentals, use `RHYTHM_COMPLEXITY.SIMPLE` (quarter notes only) and limit `notePool` to 2-3 pitches including context naturals. Match the pattern from trebleUnit1_1 (first node) where new content = 1 thing only.

---

## Build Order (Recommended)

Each step leaves the app in a working state and is independently testable.

### Step 1: Treble Sharps Unit (trebleUnit4Redesigned.js)

Safest first step. Treble clef is more familiar and SVG coverage is confirmed for treble sharps.

**Deliverables:**
- `src/data/units/trebleUnit4Redesigned.js` — 8 nodes, sharps focus, `START_ORDER = 27`
- `src/data/expandedNodes.js` — add import and spread

**Node sequence (model on existing units):**
1. REVIEW — Review all treble naturals (prerequisite: `boss_treble_3`)
2. DISCOVERY — Meet F-Sharp (`F4`, `G4`, `F#4` in pool)
3. PRACTICE — Sight reading with F#4
4. DISCOVERY — Meet C-Sharp (`C4`, `D4`, `C#4`)
5. MIX_UP — Memory Game with F#4, C#4
6. DISCOVERY — Meet G-Sharp (`G4`, `A4`, `G#4`)
7. CHALLENGE — Sharp Mix (F#4, C#4, G#4 interleaved)
8. MINI_BOSS — `boss_treble_4` (note recognition + sight reading, all 3 sharps)

Run `npm run verify:trail` after adding each unit file.

### Step 2: NotesRecognitionGame Auto-Start Fix

**Deliverables:**
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — modify auto-start `useEffect` block (~lines 518-536, ~3 line change)

**Test:** Launch treble_4_2 (Meet F-Sharp) from the trail. The F#4 answer button must appear in the accidentals panel.

### Step 3: Bass Sharps Unit (bassUnit4Redesigned.js)

Mirrors treble unit 4 in structure, uses bass clef pitches (F#3, C#3, G#3).

**Prerequisite for authoring:** Read `bassUnit3Redesigned.js` to find the last `order` value before setting `START_ORDER`.

**Deliverables:**
- `src/data/units/bassUnit4Redesigned.js`
- `src/data/expandedNodes.js` — add import and spread

### Step 4: Treble Flats Unit (trebleUnit5Redesigned.js)

Separate unit from sharps to avoid enharmonic confusion. Introduce Bb4, Eb4, Ab4, Db4 progressively.

**Deliverables:**
- `src/data/units/trebleUnit5Redesigned.js` — 8 nodes, flats focus
- `src/data/expandedNodes.js` — add import and spread

**Boss node:** `boss_treble_5`, `accessoryUnlock: 'accidental_master_badge'` (matches existing `UNITS.TREBLE_5` definition in `skillTrail.js`)

### Step 5: Bass Flats Unit (bassUnit5Redesigned.js)

**Deliverables:**
- `src/data/units/bassUnit5Redesigned.js`
- `src/data/expandedNodes.js` — final import + spread

**Boss node:** `boss_bass_5`, `accessoryUnlock: 'bass_accidental_badge'` (matches `UNITS.BASS_5`)

### Step 6: Subscription Gate Verification

Run the app in development without a subscription. Attempt to access the new nodes. Verify:
1. React UI shows gold lock (paywall modal)
2. Direct DB progress writes fail under RLS

No code changes expected. This is a verification-only step.

### Step 7: XP Economy Validation

Run `npm run verify:trail`. The XP variance check warns at >10% between paths. Adding ~20 nodes to treble and bass (not rhythm) will shift balance. Target xpReward values in the 55-150 XP range, matching the existing treble/bass distribution from units 1-3.

---

## Scaling Considerations

This milestone adds ~20 nodes to a 93-node trail. No scaling concerns exist at this size. `SKILL_NODES` grows from 93 to ~113; all lookups are O(n) linear scans over a trivially small dataset.

The SVG import bundle for note images is unchanged. All accidental SVGs are already imported in `gameSettings.js`. No new image assets are needed for the octave ranges in scope. No bundle size increase from new nodes.

---

## Gaps Requiring Verification During Implementation

The following were identified by code review as requiring hands-on validation:

1. **Enharmonic matching in SightReadingGame scoreCalculator**: The mic detects `D#4`; the pattern contains `Eb4`. Check `scoreCalculator.js` `calculatePitchAccuracy()` for enharmonic equivalence logic. If it uses strict string comparison, flat-form sight reading exercises will always score zero via mic. This is the highest-risk gap.

2. **Memory Game card matching with accidentals**: `MemoryGame.jsx` generates card pairs from `notePool`. If it matches cards by pitch string equality and both `Eb4` and `D#4` somehow appear, they would be treated as different notes. Confirm the matching logic is consistent within a single notePool (no enharmonic mixing per anti-pattern 2 should prevent this in practice).

3. **Order values for bass units 4 and 5**: Bass units 1-3 start at order 51. Read `bassUnit3Redesigned.js` to confirm the last node's order before setting bass unit 4's `START_ORDER`. Do not guess.

4. **`accidentals: true` flag not read at runtime**: The flag exists in `noteConfig` as metadata but nothing in the game pipeline reads it. The auto-start fix in Step 2 correctly bypasses the flag and reads `notePool` contents directly. The flag remains useful for future tooling or validation scripts.

---

## Sources

All findings are from direct codebase analysis (2026-03-15).

- `src/data/units/trebleUnit{1,2,3}Redesigned.js` — node structure, conventions, order values
- `src/data/expandedNodes.js` — aggregation pattern, import convention
- `src/data/skillTrail.js` — UNITS metadata, helper functions, boss tab prefix logic
- `src/config/subscriptionConfig.js` — gate by absence pattern confirmed
- `src/components/games/sight-reading-game/constants/gameSettings.js` — full accidentals SVG map confirmed (treble + bass, sharps + flats)
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — `parsePitchForVexflow()` + `Accidental` modifier confirmed
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — auto-start block (lines ~518-536), accidentals layout confirmed, enharmonic mapping confirmed
- `src/components/games/shared/noteSelectionUtils.js` — `normalizeSelectedNotes` behavior with accidentals confirmed
- `src/hooks/usePitchDetection.js` — sharp-form NOTE_NAMES output confirmed
- `scripts/validateTrail.mjs` — validation rules confirmed (no accidentals-specific validation)

---
*Architecture research for: Sharps & Flats trail content expansion (v2.2)*
*Researched: 2026-03-15*
