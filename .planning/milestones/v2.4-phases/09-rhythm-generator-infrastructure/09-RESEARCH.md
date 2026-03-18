# Phase 09: Rhythm Generator Infrastructure - Research

**Researched:** 2026-03-18
**Domain:** 6/8 compound time model — beat data, timing calculations, VexFlow beam grouping
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tempo interpretation**
- BPM in 6/8 means dotted-quarter = BPM (standard music convention)
- 80 BPM in 6/8 = 80 dotted-quarter beats per minute
- Default tempo range for 6/8: 50-70 BPM (slow, forgiving for beginners)
- UI displays tempo with beat-unit symbol: `♩. = 60` for compound time, `♩ = 60` for simple time

**Beat model change (RFIX-01)**
- Change TIME_SIGNATURES.SIX_EIGHT from `beats: 6` to `beats: 2`
- Add explicit `subdivisions: 6` field (not derived from beats * 3)
- Keep `measureLength: 12`, `isCompound: true`
- Update all code that reads `timeSignature.beats` to handle the new model
- `secondsPerSixteenth` calculation must use compound-aware beat duration

**Metronome click pattern (6/8)**
- 2 strong clicks on compound beats (1 and 4) + 4 lighter subdivision clicks on positions 2, 3, 5, 6
- Visual beat indicator shows 6 subdivision circles with positions 1 and 4 visually accented (bigger/brighter)
- Count-in: 2 measures (4 compound beats) for 6/8 — gives kids time to feel the groove
- Other time signatures keep existing 1-measure count-in

**Tap scoring**
- Same ms-based timing thresholds for 6/8 (PERFECT ±20ms, GOOD ±50ms, FAIR ±100ms with existing tempo scaling)
- Tap targets are note onsets only — a dotted-quarter = 1 tap, three eighth notes = 3 taps
- Nearest-note-wins for ambiguous taps between timing windows
- Sight-reading timing windows (useTimingAnalysis): keep existing duration-based scaling, no compound-specific adjustment

**Beam grouping (RFIX-02)**
- Build a general `beamGroupsForTimeSignature()` helper returning correct VexFlow beam groups for any time signature
- 4/4 = VexFlow default, 6/8 = groups of 3 eighth notes (3+3), future-proof for 9/8 (3+3+3), 12/8 (3+3+3+3)
- Pass groups to `Beam.generateBeams(notes, { groups })` in all rendering paths

### Claude's Discretion
- Sight-reading timing window adjustments for compound time (existing scaling may suffice)
- Internal implementation of beat duration calculation changes
- Exact visual styling of accented vs unaccented subdivision indicators
- How to structure the beamGroupsForTimeSignature() helper internally

### Deferred Ideas (OUT OF SCOPE)
- 6/8 trail node data (discovery nodes, practice nodes, boss challenges) — Phase 10
- Syncopation patterns (eighth-quarter-eighth, dotted quarter-eighth) — Phase 10
- 9/8 and 12/8 compound time signatures — future milestone (infrastructure is future-proofed with subdivisions field and general beam mapping)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RFIX-01 | Fix 6/8 beat model (beats:6 → beats:2 compound grouping) | Beat model cascade analysis below; all 5 affected call sites identified |
| RFIX-02 | Compound beaming uses correct 3+3 eighth-note grouping for 6/8 | VexFlow `Beam.generateBeams(notes, { groups })` API confirmed; Fraction import confirmed |
</phase_requirements>

---

## Summary

Phase 09 fixes two related bugs in the 6/8 rhythm implementation. The first (RFIX-01) is a data model error: `TIME_SIGNATURES.SIX_EIGHT.beats` is currently `6`, which causes the beat-wise generator, timing calculations, metronome visual, and pattern evaluator to treat 6/8 as simple six-beat time rather than compound two-beat time. The fix is a targeted change to one constant plus cascading updates to every call site that derives behaviour from `timeSignature.beats`. The second (RFIX-02) is a rendering error: `Beam.generateBeams()` is called without a `groups` parameter, so VexFlow uses its default 2-eighth grouping instead of the correct 3+3 grouping for compound time.

The two bugs are independent but related: RFIX-01 is pure data/logic, RFIX-02 is pure VexFlow rendering. They share no code but both trace back to the same conceptual mistake about 6/8. The changes are surgical: no new architecture is needed, no new files are needed (beyond the helper function that can live in an existing utilities module), and all four simple time signatures are entirely unaffected.

All 37 existing rhythm generator and patternBuilder tests pass on the current baseline. New tests for 6/8-specific behaviour (total units = 12, compound beats = 2, beaming groups) must be written as part of this phase.

**Primary recommendation:** Fix the `SIX_EIGHT` constant first (RFIX-01), then add the `beamGroupsForTimeSignature()` helper and thread it through all rendering paths (RFIX-02). Both can be done in a single logical plan.

---

## Standard Stack

### Core (no new dependencies)
| Component | Version | Role |
|-----------|---------|------|
| VexFlow | 5.0.0 (installed) | Beam API with `groups` parameter |
| Vitest | 3.2.4 (installed) | Test framework |

No new npm packages are required. `Fraction` is exported directly from `vexflow` and is already available via the package.

**Fraction import for beam groups:**
```javascript
import { Beam, Fraction, Stem } from "vexflow";
// Fraction(numerator, denominator) — e.g. new Fraction(3, 8) for 3 eighth notes
```

---

## Architecture Patterns

### Recommended Project Structure

No new directories. All changes are within existing files:

```
src/components/games/rhythm-games/
├── RhythmPatternGenerator.js    — TIME_SIGNATURES.SIX_EIGHT fix + subdivisions field
├── MetronomeTrainer.jsx          — beatDuration calc, count-in length, visual indicator

src/components/games/sight-reading-game/
├── constants/durationConstants.js         — resolveTimeSignature auto-updates (no change needed)
├── utils/rhythmGenerator.js               — compound-aware unitsPerBeat (auto-updates via durationConstants)
├── utils/patternBuilder.js                — secondsPerSixteenth compound-aware calc
├── utils/beamGroupUtils.js                — NEW: beamGroupsForTimeSignature() helper
├── hooks/useTimingAnalysis.js             — beatDurationMs (keep as-is per locked decision)
├── components/VexFlowStaffDisplay.jsx     — thread beam groups into all Beam.generateBeams() calls
├── components/RhythmPatternPreview.jsx    — thread beam groups into Beam.generateBeams() call
```

### Pattern 1: TIME_SIGNATURES.SIX_EIGHT Beat Model Fix

**What:** Change `beats: 6` to `beats: 2` and add `subdivisions: 6` in the constant.
**When to use:** Single source of truth. All downstream code auto-derives from this via `durationConstants.resolveTimeSignature`.

```javascript
// In: src/components/games/rhythm-games/RhythmPatternGenerator.js
SIX_EIGHT: {
  name: "6/8",
  beats: 2,          // CHANGED from 6 — compound time has 2 beats
  subdivisions: 6,   // NEW — explicit subdivision count (not beats*3)
  subdivision: 12,   // Unchanged — total eighth-note slots (for durationConstants compat)
  strongBeats: [0, 3],  // Unchanged — still positions in the 12-slot grid
  mediumBeats: [],
  weakBeats: [1, 2, 4, 5],
  measureLength: 12,    // Unchanged — 12 sixteenth units
  isCompound: true,
},
```

**Cascade effects (all confirmed by code reading):**

1. `durationConstants.buildTimeSignatureGrid()` recomputes `unitsPerBeat = measureLength / beats` — auto-updates to `12 / 2 = 6` (dotted-quarter = 6 sixteenth units per compound beat).
2. `rhythmGenerator.generateRhythmEvents()` reads `sig.beats` as total loop count — now iterates 2 beats, each 6 units. The beat-wise fill loop correctly fills 2 × 6 = 12 units.
3. `patternBuilder.generatePatternData()` reads `beatsPerMeasure` from `resolvedSignature.beats` — becomes 2, but `totalBeats * unitsPerBeat` still equals 12. **However, `secondsPerSixteenth = beatDurationSeconds / 4` is hardcoded for quarter-beat assumption** — see Pitfall 1 below.
4. `MetronomeTrainer.jsx` `beatDuration.current = 60 / gameSettings.tempo` — this is the dotted-quarter BPM interpretation. When `beats` was 6, each "beat" in the metronome loop was an eighth note duration. After fix, each "beat" is a dotted-quarter. The metronome visual `beatsPerMeasure` now shows 2 beats per measure — correct for compound time, but **the visual indicator must be redesigned** to show 6 subdivision clicks. See Pattern 3.
5. `MetronomeTrainer.jsx` count-in: `beatsInCountIn = currentTimeSignature.beats` — will become 2 beats (1 measure). The locked decision requires 4 compound beats (2 measures) for 6/8. Must explicitly override to `2 * 2 = 4` beats when `isCompound` is true.
6. `MetronomeTrainer.jsx` `expectedBeatPositions`: `beatPosition = index / 4` assumes 4 sixteenth-units per beat. For 6/8, each compound beat = 6 units. Must change to `index / unitsPerBeat` where `unitsPerBeat` comes from the resolved time signature.

### Pattern 2: secondsPerSixteenth Compound-Aware Fix

**What:** `patternBuilder.js` line 110 hardcodes `secondsPerSixteenth = beatDurationSeconds / 4` assuming a quarter-note beat. For 6/8 at 80 BPM dotted-quarter, each compound beat = 1.5 quarter notes, so secondsPerSixteenth must use the actual sixteenth-unit duration.

**Correct formula:**
```javascript
// In: src/components/games/sight-reading-game/utils/patternBuilder.js
const resolvedSignature = resolveTimeSignature(timeSignature);
const unitsPerBeat = resolvedSignature.unitsPerBeat;  // 6 for 6/8, 4 for 4/4/3/4/2/4
const beatDurationSeconds = 60 / Math.max(tempo, 1);
// secondsPerSixteenth: one sixteenth-unit = beatDuration / unitsPerBeat
const secondsPerSixteenth = beatDurationSeconds / unitsPerBeat;
// Source: derived from compound beat model — beatDuration covers unitsPerBeat sixteenth-units
```

**Why this is correct:** At 60 BPM dotted-quarter in 6/8, one compound beat = 1 second = 6 sixteenth-units, so each sixteenth-unit = 1/6 second. At 80 BPM in 4/4, one quarter beat = 0.75 second = 4 sixteenth-units, so each sixteenth-unit = 0.75/4 = 0.1875 second. The formula `beatDuration / unitsPerBeat` handles both correctly.

### Pattern 3: beamGroupsForTimeSignature() Helper

**What:** A pure function that returns the VexFlow `Fraction[]` array for the `groups` parameter of `Beam.generateBeams()`.

```javascript
// In: src/components/games/sight-reading-game/utils/beamGroupUtils.js
// Source: VexFlow Beam API docs + vexflow-guidelines.md

import { Fraction } from "vexflow";

/**
 * Returns VexFlow beam groups for a given time signature name.
 * Returns null for time signatures that use VexFlow's default grouping (4/4, 3/4, 2/4).
 *
 * @param {string} timeSignatureName - e.g. "4/4", "3/4", "6/8"
 * @returns {Fraction[] | null} - beam groups array, or null to use VexFlow default
 */
export function beamGroupsForTimeSignature(timeSignatureName) {
  switch (timeSignatureName) {
    case "6/8":
      // 6/8 compound: beam in groups of 3 eighth notes (3+3)
      return [new Fraction(3, 8), new Fraction(3, 8)];
    case "9/8":
      // Future-proofed: 9/8 = three groups of 3
      return [new Fraction(3, 8), new Fraction(3, 8), new Fraction(3, 8)];
    case "12/8":
      // Future-proofed: 12/8 = four groups of 3
      return [
        new Fraction(3, 8), new Fraction(3, 8),
        new Fraction(3, 8), new Fraction(3, 8),
      ];
    default:
      // 4/4, 3/4, 2/4: VexFlow default handles these correctly (returns null = omit groups param)
      return null;
  }
}
```

**Usage at all call sites:**
```javascript
// In VexFlowStaffDisplay.jsx (4 locations) and RhythmPatternPreview.jsx (1 location)
import { beamGroupsForTimeSignature } from "../utils/beamGroupUtils";  // adjust path

const groups = beamGroupsForTimeSignature(timeSignatureName);  // e.g. "6/8"
const beamConfig = groups ? { groups } : {};
const beams = Beam.generateBeams(notesArray, beamConfig);
```

### Pattern 4: 6/8 Metronome Visual Indicator

**What:** The `startContinuousMetronome` function currently uses `beatsPerMeasure` (now 2) as the modulo for visual beat counting. For 6/8, the visual must show 6 subdivision positions with positions 1 and 4 accented.

**Approach (Claude's discretion area):**

```javascript
// MetronomeTrainer.jsx — startContinuousMetronome
const beatsPerMeasure = currentTimeSignature.beats;  // 2 for 6/8
const subdivisions = currentTimeSignature.subdivisions ?? beatsPerMeasure;  // 6 for 6/8

// For visual: track subdivision position (0-5 for 6/8, 0-3 for 4/4)
const subdivisionPosition = totalBeatsCompleted % subdivisions;  // or use eigths-per-measure
const isCompoundStrongBeat = currentTimeSignature.isCompound
  ? [0, 3].includes(subdivisionPosition)  // positions 0 and 3 (1-indexed: 1 and 4)
  : subdivisionPosition === 0;
```

**Visual indicator:** `currentBeat` state should track subdivision index (0–5 for 6/8). The MetronomeDisplay component must be updated to render 6 circles for 6/8 vs 4 for 4/4, with circles 0 and 3 visually distinct (bigger/brighter per locked decision). This is in the MetronomeDisplay sub-component inside `src/components/games/rhythm-games/components/`.

### Pattern 5: Count-In Length Fix

**What:** Current count-in: `beatsInCountIn = currentTimeSignature.beats` = 2 for 6/8 after fix (1 measure). Locked decision: 4 compound beats (2 measures) for 6/8.

```javascript
// MetronomeTrainer.jsx — startCountInWithPattern
const beatsInCountIn = currentTimeSignature.isCompound
  ? currentTimeSignature.beats * 2  // 2 compound beats × 2 measures = 4
  : currentTimeSignature.beats;      // 1 measure for simple time
```

### Pattern 6: Tap Evaluation Beat Position Fix

**What:** `MetronomeTrainer.jsx` line 804: `beatPosition = index / 4` — converts sixteenth-index to beat position assuming 4 units per beat.

```javascript
// MetronomeTrainer.jsx — evaluatePerformance
const unitsPerBeat = gameSettings.timeSignature.unitsPerBeat
  ?? (gameSettings.timeSignature.measureLength / gameSettings.timeSignature.beats);

const expectedBeatPositions = [];
pattern.forEach((beat, index) => {
  if (beat === 1) {
    const beatPosition = index / unitsPerBeat;  // CHANGED from index / 4
    expectedBeatPositions.push(beatPosition);
  }
});

// Wrap-around guard also needs updating:
const wrappedBeatsPerMeasure = beatsPerMeasure;  // 2 for 6/8, correct for mod arithmetic
```

**Note:** `gameSettings.timeSignature` is a `TIME_SIGNATURES` object from `RhythmPatternGenerator.js`, not a resolved grid entry. It will not have `unitsPerBeat` directly — must compute it as `measureLength / beats` inline.

### Anti-Patterns to Avoid

- **Do not add compound-specific logic to `useTimingAnalysis.js`** — locked decision says existing duration-based scaling suffices.
- **Do not change `TIMING_TOLERANCES` or `BASE_TIMING_THRESHOLDS`** — thresholds are ms-based and tempo-scaled, which works for compound time.
- **Do not derive `subdivisions` from `beats * 3`** — locked decision requires explicit `subdivisions: 6` field.
- **Do not use `Beam.getDefaultBeamGroups("6/8")`** — the project guidelines say to pass explicit `groups` for custom groupings; do not rely on VexFlow's internal defaults for 6/8.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Beat grouping calculation | Custom 6/8 beam logic | `Beam.generateBeams(notes, { groups: [new Fraction(3,8), new Fraction(3,8)] })` | VexFlow handles all stem direction, flagging, beam angle automatically |
| Seconds-per-unit | Float arithmetic from scratch | `beatDuration / unitsPerBeat` (both values already computed) | Single formula handles all time signatures; no new variables |
| Compound beat detection | New `isCompound` checks scattered everywhere | Read `timeSignature.isCompound` from the existing constant | Already in `SIX_EIGHT` object; single location |

---

## Common Pitfalls

### Pitfall 1: secondsPerSixteenth Hardcoded Division by 4
**What goes wrong:** `patternBuilder.js` line 110: `const secondsPerSixteenth = beatDurationSeconds / 4`. For 4/4, one beat = 4 sixteenth-units, so dividing by 4 is correct. For 6/8, one compound beat = 6 sixteenth-units. At 60 BPM dotted-quarter, notes will play 50% too fast (6/4 = 1.5x the correct duration).
**Why it happens:** The formula was written when only simple time signatures existed.
**How to avoid:** Use `beatDurationSeconds / unitsPerBeat` where `unitsPerBeat` comes from `resolvedSignature.unitsPerBeat` (already computed by `buildTimeSignatureGrid`).
**Warning signs:** Existing 4/4 tests pass but a 6/8 test shows note startTimes progressing faster than expected.

### Pitfall 2: MetronomeTrainer beatDuration Already Correct — But Downstream Uses Are Not
**What goes wrong:** `beatDuration.current = 60 / gameSettings.tempo` is semantically correct for compound time (BPM = dotted-quarter). The problem is every downstream use that converts beatDuration to position via `/ 4` or `* beats` breaks with the new beat count.
**Why it happens:** Multiple assumptions about "beats per measure" and "sixteenth units per beat" are embedded in the playback and evaluation code.
**How to avoid:** Identify all uses of `beatDuration` and `beatsPerMeasure` in MetronomeTrainer; verify each computes positions correctly using `measureLength` and `beats` from the (now fixed) time signature object.
**Warning signs:** Tap windows shift to wrong positions; count-in is 1 measure instead of 2 for 6/8.

### Pitfall 3: MetronomeTrainer Uses RhythmPatternGenerator TIME_SIGNATURES Directly
**What goes wrong:** `gameSettings.timeSignature` is a raw `TIME_SIGNATURES` object (from `RhythmPatternGenerator.js`), not a resolved `TIME_SIGNATURE_GRID` entry (from `durationConstants.js`). The raw object does not have `unitsPerBeat` after the fix — only the derived grid does.
**Why it happens:** MetronomeTrainer and patternBuilder/rhythmGenerator use different time signature representations.
**How to avoid:** Compute `unitsPerBeat` inline as `measureLength / beats` when working inside MetronomeTrainer. Alternatively, use `resolveTimeSignature(gameSettings.timeSignature)` to get the full grid entry — this is already imported in `durationConstants.js` but not used in MetronomeTrainer.
**Warning signs:** `undefined` or `NaN` in beat position calculations after the fix.

### Pitfall 4: RhythmPatternGenerator.generatePattern() Uses beats * 4 for Position
**What goes wrong:** `generatePattern()` in `RhythmPatternGenerator.js` (the legacy generator used by `getPattern()`) has `const sixteenthIndex = beatIndex * 4` in the `strongBeats`, `mediumBeats`, `weakBeats` loops. For 6/8 after the fix, `beats: 2` means `strongBeats: [0, 3]` (which are sixth positions in the 12-unit array, not "beat * 4" positions).
**Why it happens:** The legacy generator was written for simple time only.
**How to avoid:** The `strongBeats[0, 3]` values in `SIX_EIGHT` represent eighth-note positions in a 12-slot array; `* 4` assumes quarter-note positions. After the fix, if `getPattern()` is called for 6/8, `beatIndex * 4` for beat `[0, 3]` gives positions `[0, 12]` — position 12 is out of bounds (array length 12). This will silently corrupt patterns. Must either:
  a. Fix the multiplication in `generatePattern()` to use subdivision-aware indexing, or
  b. Accept that 6/8 always uses curated patterns (falling back to generated means corrupt) — simplest short-term.
**Warning signs:** `pattern[12]` assignment on a length-12 array; silent truncation; fallback patterns used unexpectedly.

### Pitfall 5: durationConstants.resolveTimeSignature Ignores subdivisions Field
**What goes wrong:** `buildTimeSignatureGrid()` in `durationConstants.js` doesn't read a `subdivisions` property — it reads `measureLength` and `beats`. Adding `subdivisions: 6` to the constant is fine, but the grid entry won't expose it automatically.
**Why it happens:** The grid was built before compound time needed a separate `subdivisions` concept.
**How to avoid:** The new `subdivisions` field in `SIX_EIGHT` is for MetronomeTrainer and visual logic only. For `unitsPerBeat` calculations, the existing `measureLength / beats` formula gives the correct result (12/2=6) automatically. No changes needed to `durationConstants.js` for timing correctness; `subdivisions` is an informational field.

### Pitfall 6: VexFlowStaffDisplay Has 4 Beam.generateBeams() Call Sites
**What goes wrong:** Missing one call site means some rendering paths still use 2+2+2 grouping.
**Why it happens:** The file has multiple rendering modes (grand staff, single staff, multi-bar, single-bar).
**How to avoid:** The 4 confirmed call sites (from grep) are:
  - Line 713: grand staff treble, multi-bar
  - Line 714: grand staff bass, multi-bar
  - Line 960: grand staff treble, single-bar
  - Line 961: grand staff bass, single-bar
  - Line 1192: single staff, multi-bar
  - Line 1318: single staff, single-bar
  Additionally, `RhythmPatternPreview.jsx` line 126 is the 7th call site.
  The `beamGroupsForTimeSignature()` helper must be threaded into all 7 locations.

**Caveat:** VexFlowStaffDisplay receives a `pattern` prop that contains `timeSignature` as a string (e.g. `"6/8"`). Verify the prop is available in each rendering branch before calling the helper.

---

## Code Examples

### beamGroupsForTimeSignature() usage
```javascript
// Source: VexFlow Beam API (vexflow-guidelines.md) + Fraction confirmed exported from vexflow@5.0.0
import { Beam, Fraction, Stem } from "vexflow";
import { beamGroupsForTimeSignature } from "../utils/beamGroupUtils";

// In rendering loop:
const timeSignatureName = pattern?.timeSignature ?? "4/4";
const groups = beamGroupsForTimeSignature(timeSignatureName);
const beamConfig = groups ? { groups } : {};
const trebleBeams = Beam.generateBeams(trebleNotesOnly, beamConfig);
```

### Compound-aware secondsPerSixteenth
```javascript
// In patternBuilder.generatePatternData():
const resolvedSignature = resolveTimeSignature(timeSignature);
const unitsPerBeat = resolvedSignature.unitsPerBeat || 4;
const beatDurationSeconds = 60 / Math.max(tempo, 1);
const secondsPerSixteenth = beatDurationSeconds / unitsPerBeat;
// For 4/4 at 80 BPM: 0.75 / 4 = 0.1875 s/sixteenth (unchanged from current)
// For 6/8 at 60 BPM: 1.0 / 6 = 0.1667 s/sixteenth (previously was 1.0 / 4 = 0.25, 50% too slow)
```

### 6/8 count-in: 2 measures
```javascript
// In MetronomeTrainer.jsx startCountInWithPattern():
const beatsInCountIn = currentTimeSignature.isCompound
  ? currentTimeSignature.beats * 2   // 2 × 2 = 4 compound beats for 6/8
  : currentTimeSignature.beats;       // 4 beats for 4/4, 3 for 3/4, 2 for 2/4
```

### Compound-aware tap position evaluation
```javascript
// In MetronomeTrainer.jsx evaluatePerformance():
const timeSigObj = gameSettings.timeSignature;
const unitsPerBeat = timeSigObj.measureLength / timeSigObj.beats;  // 6 for 6/8, 4 for others

const expectedBeatPositions = [];
pattern.forEach((beat, index) => {
  if (beat === 1) {
    expectedBeatPositions.push(index / unitsPerBeat);
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| beats:6 (simple 6-beat model) | beats:2 (compound 2-beat model) | Phase 09 | Generator, metronome, scoring all work on correct beat boundaries |
| Beam.generateBeams() no groups | Beam.generateBeams(notes, { groups }) | Phase 09 | 6/8 displays 3+3 beaming instead of 2+2+2 |
| secondsPerSixteenth = dur/4 | secondsPerSixteenth = dur/unitsPerBeat | Phase 09 | Note timing correct for compound time |

---

## Open Questions

1. **Does MetronomeTrainer's getPattern() ever reach 6/8 generatePattern() fallback?**
   - What we know: `getPattern()` tries curated JSON first, falls back to `generatePattern()` if JSON load fails. For 6/8, there is no `/data/6-8.json` file in the repo (I did not find one). This means 6/8 always falls back to generated patterns. The fallback in `generatePattern()` has the `beatIndex * 4` bug (Pitfall 4).
   - What's unclear: Is this path actually exercised in real gameplay? Is the fallback acceptable with a simpler fix?
   - Recommendation: Fix `generatePattern()` for 6/8 as part of this phase. The simplest fix is: when `isCompound`, skip the `strongBeats/weakBeats` loop entirely and populate the pattern directly from `measureLength`. Or fix the multiplication to use subdivision-aware indexing. The safer path is to just populate a valid beginner-level 6/8 fallback pattern directly in the fallback code.

2. **Does VexFlowStaffDisplay receive `timeSignature` in all rendering branches?**
   - What we know: The component accepts `pattern` prop which has `pattern.timeSignature` as a string. The `timeSignature` is passed down from `generatePatternData` which copies `resolvedSignature.name`.
   - What's unclear: Whether all 6 rendering branches in VexFlowStaffDisplay access `pattern.timeSignature` before the beam generation call, or whether some branches have it in scope under a different variable name.
   - Recommendation: Trace `timeSignature` in scope for each of the 6 call sites before implementing the helper integration.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vite.config.js (test section) |
| Quick run command | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js src/components/games/sight-reading-game/utils/patternBuilder.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RFIX-01 | 6/8 generates exactly 12 sixteenth-units with 2 compound beats | unit | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js` | ✅ (add test) |
| RFIX-01 | 6/8 secondsPerSixteenth uses compound beat duration | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | ✅ (add test) |
| RFIX-01 | Existing 4/4, 3/4, 2/4 patterns unaffected (no regression) | unit | `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js` | ✅ existing (37 tests pass) |
| RFIX-02 | beamGroupsForTimeSignature returns 3+3 Fractions for 6/8 | unit | `npx vitest run src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` | ❌ Wave 0 |
| RFIX-02 | beamGroupsForTimeSignature returns null for 4/4, 3/4, 2/4 | unit | `npx vitest run src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/games/sight-reading-game/utils/rhythmGenerator.test.js src/components/games/sight-reading-game/utils/patternBuilder.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/games/sight-reading-game/utils/beamGroupUtils.test.js` — covers RFIX-02 (beamGroupsForTimeSignature unit tests)

*(The existing 37 tests cover RFIX-01 regression; new 6/8-specific tests to be added inline to existing files)*

---

## Sources

### Primary (HIGH confidence)
- Direct code reading — `RhythmPatternGenerator.js`, `rhythmGenerator.js`, `patternBuilder.js`, `durationConstants.js`, `MetronomeTrainer.jsx`, `VexFlowStaffDisplay.jsx`, `RhythmPatternPreview.jsx`, `timingConstants.js`, `useTimingAnalysis.js`
- VexFlow v5.0.0 — installed in project; `Fraction` confirmed as top-level export via `node -e`
- `docs/vexflow-notation/vexflow-guidelines.md` — `Beam.generateBeams(notes, { groups })` API with `Fraction` documented
- Vitest baseline run — 37 existing tests passing confirmed

### Secondary (MEDIUM confidence)
- VexFlow guidelines in-project — `Beam.getDefaultBeamGroups` and `groups` parameter documented with `[new Fraction(2, 8)]` example

### Tertiary (LOW confidence)
- None — all findings sourced from installed code or in-project documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all code read directly from source; no new packages needed
- Architecture: HIGH — all 7 beam call sites identified by grep; cascade effects traced through all 5 affected files
- Pitfalls: HIGH — each pitfall identified from actual code (specific line numbers cited where applicable)

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable codebase; VexFlow API is stable at v5)
