# Phase 01: Pre-Flight Bug Fixes - Research

**Researched:** 2026-03-15
**Domain:** React game state, VexFlow note rendering, regex-based pitch parsing, Vitest test infrastructure
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Auto-grow STOPS when current node has NO accidentals but the next node DOES — no accidentals injected into natural-notes sessions
- Per-note filtering: if a mixed node has [C4, D4, F#4], a natural-only session gets C4 and D4 but skips F#4
- Accidental nodes CAN grow freely into further accidental nodes (sharps node can pull from flats node)
- Accidental nodes CAN also grow into natural-only nodes (naturals are already learned, adds variety)
- Rule summary: the ONLY blocked direction is natural → accidental
- Derive enableSharps/enableFlats by scanning the node's notePool at navigation time
- Scanning logic lives in TrailNodeModal.jsx (in `navigateToExercise()`) — not a separate utility
- `notePool.some(n => n.includes('#'))` for sharps, `notePool.some(n => n.includes('b'))` for flats
- Trail sessions override user game settings — trail flags come from notePool, free play uses user settings
- Both NotesRecognitionGame AND SightReadingGame receive and use these flags from trail state
- Regex pattern: `/^([A-G][#b]?)(\d+)$/` — supports single sharp (#) and single flat (b) only
- No double-sharp, double-flat, or explicit natural support needed (YAGNI)
- Sweep entire codebase for the broken `/^([A-G])(\d+)$/` pattern and fix all instances, not just patternBuilder.js
- VexFlow conversion: F#4 → `f#/4` + `new Accidental('#')`, Bb4 → `bb/4` + `new Accidental('b')` — standard VexFlow v5 approach

### Claude's Discretion

- Exact implementation of the per-note accidental filter in auto-grow logic
- How to detect "is this note an accidental" in the auto-grow code (regex vs string check)
- Test file organization and test case selection
- Any additional regex instances found during the codebase sweep

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FIX-01 | Trail auto-start passes correct `enableSharps`/`enableFlats` flags derived from node's notePool | TrailNodeModal.jsx `navigateToExercise()` must derive and pass flags; NotesRecognitionGame.jsx must consume them from `location.state`; auto-grow must guard the natural→accidental boundary |
| FIX-02 | patternBuilder regex handles accidental pitches (F#4, Bb4) instead of silently dropping them | Two regexes in patternBuilder.js, one in noteDefinitions.js, plus the verifier's Node ESM import — all found and documented below |
</phase_requirements>

---

## Summary

Phase 01 fixes two bugs that silently corrupt the accidentals pipeline. Both bugs produce wrong behavior with no runtime errors, making them invisible without specific test cases.

**Bug 1 (FIX-01)** has two sub-problems: (a) `TrailNodeModal.jsx` never derives `enableSharps`/`enableFlats` from the node's `notePool` — it passes hardcoded `false` values — so trail sessions always start with accidentals disabled. (b) `NotesRecognitionGame.jsx` auto-configure effect also hardcodes both flags to `false` at line 524-525 and never reads them from `location.state`. Additionally, the auto-grow logic in `getNextPedagogicalNote` does not check whether a candidate pitch is an accidental before pulling it into a natural-notes session, violating the locked natural → accidental boundary rule.

**Bug 2 (FIX-02)** is a regex gap: `patternBuilder.js` uses `/^([A-G])(\d+)$/` in two places (lines 29 and 60). The first in `inferClefForPitch` causes any accidental pitch like `F#4` to return `"treble"` (match fails, default returns), which is harmless but wrong. The second in `toVexFlowNote` causes the match to fail entirely, falling through to the `c/4` fallback, which causes F#4 to render as C4. There is also a pre-existing Node ESM module resolution issue in `scripts/patternVerifier.mjs` that causes `npm run verify:patterns` to crash immediately (the import of `RhythmPatternGenerator` without the `.js` extension works in Vite but not bare Node ESM). A pre-existing broken test (`SightReadingGame.micRestart.test.jsx`) also needs fixing as the success criterion requires `npm test` to pass.

**Primary recommendation:** Fix all four defects in sequence: (1) Node ESM import in `durationConstants.js`, (2) regex in `patternBuilder.js`, (3) flag derivation in `TrailNodeModal.jsx`, (4) auto-grow boundary guard in `NotesRecognitionGame.jsx`. Then fix the pre-existing broken test and add new tests covering the accidentals pipeline.

---

## Standard Stack

No new libraries needed. All fixes use the existing stack.

### Core (already installed)
| Library | Version | Purpose | Why Used |
|---------|---------|---------|----------|
| VexFlow | 5.0.0 | SVG music notation rendering | Already used for sight reading |
| Vitest | 3.2.4 | Test runner | Existing test infrastructure |
| React Router v7 | 7.1.5 | Navigation state (location.state) | Already used for trail navigation |

### No New Installation Required
All fixes are pure logic changes in existing files.

---

## Architecture Patterns

### How Trail Navigation Flows (current — with bugs)

```
TrailNodeModal.jsx
  navigateToExercise()
    navState = { nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }
    // BUG: enableSharps/enableFlats NOT included in navState
    navigate('/notes-master-mode/notes-recognition-game', { state: navState })

NotesRecognitionGame.jsx
  const nodeConfig = location.state?.nodeConfig   // has notePool: ['F#4', 'C#4']
  const settings.enableSharps = false             // BUG: hardcoded, never reads from state
  const settings.enableFlats  = false             // BUG: hardcoded, never reads from state
  // useEffect auto-configure:
  trailSettings = { ..., enableSharps: false, enableFlats: false }  // BUG: line 524-525
```

### How Trail Navigation Must Flow (after fix)

```
TrailNodeModal.jsx
  navigateToExercise()
    const notePool = exercise.config?.notePool || []
    const enableSharps = notePool.some(n => n.includes('#'))
    const enableFlats  = notePool.some(n => n.includes('b'))
    navState = { nodeId, nodeConfig, exerciseIndex, totalExercises,
                 exerciseType, enableSharps, enableFlats }
    navigate('/notes-master-mode/notes-recognition-game', { state: navState })

NotesRecognitionGame.jsx
  const trailEnableSharps = location.state?.enableSharps ?? false
  const trailEnableFlats  = location.state?.enableFlats  ?? false
  // useEffect auto-configure:
  trailSettings = { ..., enableSharps: trailEnableSharps, enableFlats: trailEnableFlats }
```

### SightReadingGame also needs the flags

`SightReadingGame.jsx` also receives trail state via `location.state`. It must similarly read and apply `enableSharps`/`enableFlats` from state for sight reading exercises with accidentals. The locked decision confirms both games must consume the flags.

### Pattern Builder Fix: `toVexFlowNote`

```javascript
// BROKEN (line 60 in patternBuilder.js):
const pitchMatch = obj.pitch.match(/^([A-G])(\d+)$/);
// F#4 doesn't match → falls through to { keys: ["c/4"] }

// FIXED:
const pitchMatch = obj.pitch.match(/^([A-G][#b]?)(\d+)$/);
if (pitchMatch) {
  const [, note, octave] = pitchMatch;
  return {
    keys: [`${note.toLowerCase()}/${octave}`],
    duration: vexDuration,
    // Note: VexFlowStaffDisplay.buildStaveNote handles accidental glyph separately
    // patternBuilder only needs to supply the correct key string
  };
}
```

### Pattern Builder Fix: `inferClefForPitch`

```javascript
// BROKEN (line 29):
const match = String(pitch).match(/^([A-G])(\d+)$/i);
// F#4 → no match → "treble" by default (harmless, but wrong)

// FIXED:
const match = String(pitch).match(/^([A-G][#b]?)(\d+)$/i);
// F#4 → match[2] = "4" → treble (correct, now explicit)
```

### Note: `toVexFlowNote` Output vs VexFlow Key Format

`toVexFlowNote` produces `{ keys: ['f#/4'] }` — the standard VexFlow key format uses lowercase note + slash + octave. For accidentals, `f#/4` is the correct key string. The `Accidental` modifier is applied separately by `VexFlowStaffDisplay.buildStaveNote`, which already handles this correctly (confirmed: lines 449-484 use `([#b]?)` pattern and add `new Accidental(accidentalRaw)` modifier). The pattern builder only needs to output the correct key string.

### `noteDefinitions.js` Regex

```javascript
// Line 11 — this regex is used only to iterate NATURAL notes for generation of accidentals.
// It's purposefully strict (/^([A-G])(\d)$/) — it acts as a guard to skip non-natural pitches.
// This is CORRECT behavior — do NOT change it.
const match = pitch ? String(pitch).match(/^([A-G])(\d)$/) : null;
```

**Do not modify `noteDefinitions.js`** — the strict regex here is intentional. It processes the `TREBLE_NATURAL_NOTES` and `BASS_NATURAL_NOTES` arrays which only contain natural pitches. The restriction is the design.

### Auto-Grow Boundary Guard

The `getNextPedagogicalNote` function in `NotesRecognitionGame.jsx` (lines 872-901) walks forward through subsequent trail nodes using `getNextNodeInCategory`. The locked rule is: **natural → accidental is the only blocked direction**.

Current code has no boundary check — it will return any pitch from any next node. The fix adds a per-note filter:

```javascript
// In getNextPedagogicalNote, after finding candidatePitch:
const candidateIsAccidental = /[#b]/.test(candidatePitch);
const currentNodeHasAccidentals = currentPool.some(p => /[#b]/.test(p));

// Block: natural-only session trying to pull accidental note
if (candidateIsAccidental && !currentNodeHasAccidentals) {
  // Skip this candidate — try the next note in the next node's pool
  continue; // or advance searchNodeId
}
```

The locked decision also requires **per-note filtering** of mixed nodes: if a next node has `[C4, D4, F#4]`, a natural-only session should get C4 and D4 but skip F#4. The search loop must continue iterating through candidates in the same node's pool before advancing `searchNodeId`.

### Current `getNextPedagogicalNote` Logic Gap

The current implementation (lines 887-898) only finds the first `candidatePitch` in a node's pool that isn't already known. It does NOT filter accidentals from that candidate set. After the fix, the search must:

1. Get all candidates from `nextNode.noteConfig.notePool` that are not in `alreadyKnown`
2. Filter out accidentals if current session is natural-only
3. If any remain after filter, pick the first (or return it)
4. If all were filtered (e.g., mixed node where all new notes are accidentals), advance `searchNodeId` and continue

### `normalizeSelectedNotes` — Intentional Accidentals Filter

`normalizeSelectedNotes` in `noteSelectionUtils.js` explicitly strips accidentals (`shouldIncludePitch` at line 70-76). This is correct and intentional — accidentals are controlled via `enableSharps`/`enableFlats` toggles in `getRandomNote`, not via the note selection list. **Do not modify this behavior.**

### Node Config Structure

Trail nodes use `exercise.config.notePool` (not `node.noteConfig.notePool`) for the exercise-level note list:

```javascript
// Structure in unit files:
{
  type: 'note_recognition',
  config: {
    notePool: ['F#4', 'C#4'],   // ← used in navigateToExercise()
    questionCount: 10,
    clef: 'treble',
  }
}
```

The `getNextPedagogicalNote` function reads `currentNode.noteConfig?.notePool` (node-level config), which is correct for identifying what the current node teaches. Both paths exist in the data.

### Node ESM Import Fix

`durationConstants.js` line 4 imports `RhythmPatternGenerator` without the `.js` extension:

```javascript
// BROKEN for bare Node ESM (works in Vite/Vitest due to resolver):
import { DURATION_CONSTANTS } from '../../rhythm-games/RhythmPatternGenerator';

// FIXED:
import { DURATION_CONSTANTS } from '../../rhythm-games/RhythmPatternGenerator.js';
```

This fix has no impact on the Vite build or Vitest tests (both resolve extension-less imports). It only affects the `scripts/patternVerifier.mjs` Node.js runner which uses bare ESM resolution.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VexFlow accidental glyph | Custom SVG accidental rendering | `new Accidental('#')` / `new Accidental('b')` via VexFlowStaffDisplay | Already implemented and working in VexFlowStaffDisplay.jsx lines 482-484 |
| Note pitch validation | Custom pitch validator | `/^([A-G][#b]?)(\d+)$/` regex | Established pattern across the codebase (seen in VexFlowStaffDisplay, NotesRecognitionGame, SightReadingGame) |
| Flag propagation utility | Separate utility file | Inline in `navigateToExercise()` | Locked decision — logic stays in TrailNodeModal.jsx |

**Key insight:** VexFlowStaffDisplay already correctly renders accidentals. The bug is upstream in patternBuilder.js which never gets the accidental into the pitch string at all.

---

## Common Pitfalls

### Pitfall 1: Modifying `noteDefinitions.js` regex
**What goes wrong:** Changing `/^([A-G])(\d)$/` to include `[#b]?` would cause `withAccidentals()` to process accidental entries it generates, creating double-accidentals (F##4, Bbb4).
**Why it happens:** The function iterates `naturalNotes` but returns a combined array. If accidentals are in the input, they'd be iterated too.
**How to avoid:** Leave `noteDefinitions.js` untouched. The strict regex is a guard.
**Warning signs:** If `TREBLE_NOTE_DATA` ever contains `F##4` or `Bbb4`, this was accidentally changed.

### Pitfall 2: Hardcoding flags in `trailSettings` instead of reading from `location.state`
**What goes wrong:** Success criterion 1 fails — answer options still show only natural notes.
**Why it happens:** Easy to miss that `location.state` can carry the flags through navigation.
**How to avoid:** Read `location.state?.enableSharps` and `location.state?.enableFlats` explicitly before building `trailSettings`.

### Pitfall 3: Auto-grow check on `currentNodeHasAccidentals` uses wrong pool
**What goes wrong:** `getNextPedagogicalNote` reads `currentNode.noteConfig?.notePool`. For nodes where `noteConfig` is undefined but `exercises[0].config.notePool` has the data, the check evaluates `[]` and incorrectly concludes the session is natural-only.
**Why it happens:** Node data has two pool paths: `node.noteConfig.notePool` (node-level) and `exercise.config.notePool` (exercise-level).
**How to avoid:** The auto-grow function already uses `currentNode.noteConfig?.notePool`. Pass `nodeConfig.notePool` from the exercise config alongside `nodeId` so the function has the exercise-level pool as fallback.
**Warning signs:** A node with only `exercise.config.notePool` (and no `noteConfig`) would always be treated as natural-only.

### Pitfall 4: The `b` in flat detection also matches Hebrew note names
**What goes wrong:** `notePool.some(n => n.includes('b'))` could match Hebrew transliterations if they contain the letter 'b'. However, trail notePool arrays use English pitch notation only (e.g., `['Bb4', 'Eb4']`), not Hebrew names.
**Why it happens:** The `includes('b')` check is simple string search.
**How to avoid:** The locked decision approves this approach. Trail nodePools are always English pitch format. Confirm this assumption holds for all existing unit files before shipping.

### Pitfall 5: `normalizeSelectedNotes` silently drops accidentals from `selectedNotes`
**What goes wrong:** Even if `enableSharps: true` is correctly set, if `F#4` is in `settings.selectedNotes`, `normalizeSelectedNotes` strips it. The caller might expect `F#4` to appear as a button option.
**Why it happens:** `shouldIncludePitch` at line 70-76 intentionally excludes accidentals from the normalized list.
**How to avoid:** This is by design — accidentals appear as buttons via the `enableSharps`/`enableFlats` path in `getRandomNote`, not via `normalizedSelectedNotes`. The `selectedNotes` in trail settings should contain only natural notes (the note pool might include `F#4` as a question, but the answer buttons come from the filtered note arrays).

### Pitfall 6: Pre-existing test failures inflate scope
**What goes wrong:** `npm test` shows 1 failure before any changes — `SightReadingGame.micRestart.test.jsx` fails because `useAudioContext` is not mocked.
**Why it happens:** The test mocks the return value of `useAudioContext` but not the import itself, so the hook throws when there's no `AudioContextProvider`.
**How to avoid:** Add a `vi.mock` for the `AudioContextProvider` import to make the hook return the mocked values. This is within Claude's Discretion (test organization decisions). The fix is a 3-line mock addition to the test file.

---

## Code Examples

Verified patterns from the existing codebase:

### Correct VexFlow key format for accidentals
```javascript
// Source: VexFlowStaffDisplay.jsx line 452-454
const key = `${letterRaw.toLowerCase()}/${octaveRaw}`;
// F#4 → letter='F', octave='4' → key = 'f#/4'  (correct VexFlow format)
// Bb4 → letter='B', octave='4' → key = 'bb/4'  (correct VexFlow format)
```

### Correct accidental regex (verified across codebase)
```javascript
// Used in: VexFlowStaffDisplay.jsx, NotesRecognitionGame.jsx, SightReadingGame.jsx, MemoryGame.jsx
/^([A-G][#b]?)(\d)$/   // single-octave
/^([A-G][#b]?)(\d+)$/  // multi-octave (patternBuilder needs this form for C10 etc.)
```

### Flag derivation (locked pattern from CONTEXT.md)
```javascript
// In TrailNodeModal.jsx navigateToExercise():
const notePool = exercise.config?.notePool || [];
const enableSharps = notePool.some(n => n.includes('#'));
const enableFlats  = notePool.some(n => n.includes('b'));
const navState = {
  nodeId: node.id,
  nodeConfig: exercise.config,
  exerciseIndex,
  totalExercises,
  exerciseType: exercise.type,
  enableSharps,
  enableFlats,
};
```

### Consuming flags in NotesRecognitionGame
```javascript
// Reading from location.state (pattern already used for nodeId, nodeConfig, etc.):
const trailEnableSharps = location.state?.enableSharps ?? false;
const trailEnableFlats  = location.state?.enableFlats  ?? false;

// In auto-configure useEffect (replacing lines 524-525):
const trailSettings = {
  clef: nodeConfig.clef || 'treble',
  selectedNotes: nodeConfig.notePool || [],
  timedMode: nodeConfig.timeLimit !== null && nodeConfig.timeLimit !== undefined,
  timeLimit: nodeConfig.timeLimit || 45,
  enableSharps: trailEnableSharps,
  enableFlats: trailEnableFlats,
};
```

### Mocking `useAudioContext` in a test file
```javascript
// Fix for SightReadingGame.micRestart.test.jsx:
vi.mock('../../../contexts/AudioContextProvider', () => ({
  useAudioContext: () => ({
    audioContextRef: { current: { state: 'running' } },
    gainNodeRef: { current: {} },
    resumeAudioContext: vi.fn(async () => true),
    isReady: vi.fn(() => true),
    getCurrentTime: vi.fn(() => Date.now() / 1000),
  }),
}));
```

---

## Defect Inventory

All defects confirmed by reading source code. Confidence: HIGH.

| # | File | Location | Defect | Fix |
|---|------|----------|--------|-----|
| D1 | `src/components/games/sight-reading-game/constants/durationConstants.js` | Line 4 | Import without `.js` extension breaks Node ESM | Add `.js` extension |
| D2 | `src/components/games/sight-reading-game/utils/patternBuilder.js` | Line 29 | `inferClefForPitch` regex `/^([A-G])(\d+)$/i` — misses accidentals | Change to `/^([A-G][#b]?)(\d+)$/i` |
| D3 | `src/components/games/sight-reading-game/utils/patternBuilder.js` | Line 60 | `toVexFlowNote` regex `/^([A-G])(\d+)$/` — accidentals fall through to C4 fallback | Change to `/^([A-G][#b]?)(\d+)$/` |
| D4 | `src/components/trail/TrailNodeModal.jsx` | `navigateToExercise()` | Never derives or passes `enableSharps`/`enableFlats` | Derive from `exercise.config.notePool`, include in `navState` |
| D5 | `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | Line 524-525 | Auto-configure hardcodes `enableSharps: false, enableFlats: false` | Read from `location.state` |
| D6 | `src/components/games/notes-master-games/NotesRecognitionGame.jsx` | `getNextPedagogicalNote` | No accidental boundary guard — natural sessions can get accidentals at 10-combo | Add filter: skip accidental candidates when current pool has no accidentals |
| D7 | `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` | Top of file | `useAudioContext` not mocked — test crashes with missing provider | Add `vi.mock` for AudioContextProvider |

**Files NOT to change:**
- `src/components/games/sight-reading-game/constants/noteDefinitions.js` — strict regex is intentional
- `src/components/games/shared/noteSelectionUtils.js` — strips accidentals by design
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — already handles accidentals correctly

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.js` (root) |
| Quick run command | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIX-02 | accidental pitches (F#4, Bb4) in `toVexFlowNote` produce `f#/4`, `bb/4` — not C4 fallback | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | Partially — file exists, accidentals test case needed |
| FIX-02 | `inferClefForPitch('F#4')` returns `"treble"` (not default) | unit | same file | Wave 0 gap |
| FIX-01 | trail session with `notePool: ['F#4', 'C#4']` sets `enableSharps: true` | integration (manual) | manual-only: launch trail node and observe answer buttons | N/A |
| FIX-01 | auto-grow at 10-combo does NOT inject F#4 into natural-notes node session | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.test.js` | Wave 0 gap — file doesn't exist |
| Both | npm run test:run passes | regression | `npm run test:run` | Exists — D7 pre-existing failure must be fixed |
| Both | npm run verify:patterns passes | smoke | `npm run verify:patterns` | Exists — D1 fix unblocks it |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run test:run` green + `npm run verify:patterns` passes before verification

### Wave 0 Gaps
- [ ] New test cases in `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — covers FIX-02 regex fix (accidental pitches in `toVexFlowNote` and `inferClefForPitch`)
- [ ] `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` — unit tests for `getNextPedagogicalNote` boundary guard (FIX-01 auto-grow aspect)

---

## Open Questions

1. **Does `SightReadingGame` also need `enableSharps`/`enableFlats` consumed from `location.state`?**
   - What we know: The locked decision says "Both NotesRecognitionGame AND SightReadingGame receive and use these flags from trail state"
   - What's unclear: How SightReadingGame currently uses the flags when launched from the trail (it reads `location.state?.nodeConfig` but may not use `enableSharps`)
   - Recommendation: Planner should include a task to audit `SightReadingGame.jsx` for this path and add state consumption if missing

2. **`getNextPedagogicalNote` uses `node.noteConfig?.notePool` for current node pool — is this always populated?**
   - What we know: Most note-based nodes in `bassUnit*` and `trebleUnit*` files have `noteConfig.notePool`. The function uses this for `alreadyKnown`.
   - What's unclear: A future accidentals node authored in Phase 02 might use only `exercise.config.notePool` (exercise-level) without a `node.noteConfig`. If so, `currentPool` would be `[]` and the function would incorrectly treat every note as unknown.
   - Recommendation: Planner should note this for Phase 02 content authoring. For Phase 01, ensure the boundary guard correctly falls back to `nodeConfig.notePool` (from `location.state`) as the source of "what the current session teaches."

---

## Sources

### Primary (HIGH confidence)
- Direct source code inspection — `patternBuilder.js`, `TrailNodeModal.jsx`, `NotesRecognitionGame.jsx`, `noteDefinitions.js`, `noteSelectionUtils.js`, `VexFlowStaffDisplay.jsx`, `staffPositions.js`
- `scripts/patternVerifier.mjs` — confirms verify:patterns currently fails with Node ESM error
- `npm run test:run` output — confirms 1 pre-existing test failure in `SightReadingGame.micRestart.test.jsx`

### Secondary (MEDIUM confidence)
- VexFlow v5 accidental API: `note.addModifier(new Accidental('#'), 0)` — confirmed by existing working code in `VexFlowStaffDisplay.jsx` lines 482-484

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Defect identification: HIGH — all bugs confirmed by reading source code
- Fix approach: HIGH — follows patterns already established in the codebase
- Test gaps: HIGH — confirmed by running tests and verifier
- Auto-grow boundary logic: MEDIUM — exact implementation detail left to Claude's Discretion; the filter rule is clear but the loop structure needs care

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable codebase, no fast-moving dependencies)
