# Phase 07: Key Signature Rendering Infrastructure - Research

**Researched:** 2026-03-18
**Domain:** VexFlow 5 key signature API, accidental suppression, config pipeline, UI settings
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New "Key" dropdown in UnifiedGameSettings alongside clef, time signature, and tempo
- Default to C major (no key signature)
- Available keys: C major (none), G major (1#), D major (2#), A major (3#), F major (1b), Bb major (2b), Eb major (3b) — matches curriculum
- Always visible in sight reading free-play settings (no unlock gating)
- When a key is selected, auto-filter note pool to in-key notes; player can still manually adjust after
- Standard music notation conventions: suppress accidentals covered by key signature, show natural signs when deviating from key
- Courtesy (reminder) accidentals: yes — if a natural was used earlier in the measure, show the key-sig accidental as a reminder on subsequent occurrences
- Generated patterns use only in-key notes for Phase 07 infrastructure; out-of-key notes (naturals) deferred to Phase 08 node data
- VexFlow's `Accidental.applyAccidentals()` handles the logic
- New `keySignature` field in trail node exercise config (e.g., `keySignature: 'G'`)
- Uses VexFlow key string format directly: 'G', 'D', 'A', 'F', 'Bb', 'Eb' — no translation layer
- When `keySignature` is set, it takes precedence over `enableSharps`/`enableFlats` flags
- When `keySignature` is null/absent, existing per-note accidental behavior unchanged
- Pipeline: trail node config → TrailNodeModal → navigation state → SightReadingGame → patternBuilder → VexFlowStaffDisplay
- Standard VexFlow rendering for key signature glyphs — no custom styling, no enlarged glyphs
- Stave width auto-adjusts to accommodate key signature glyphs (VexFlow handles spacing naturally)
- Key signature appears on first bar only in multi-bar patterns (standard music convention)

### Claude's Discretion
- Exact stave width adjustment calculation
- How `Accidental.applyAccidentals()` is integrated with existing `buildStaveNote()` function
- Internal note pool filtering implementation for key-based auto-selection
- How the key dropdown interacts with the existing settings state management

### Deferred Ideas (OUT OF SCOPE)
- Discovery nodes — Phase 08
- Out-of-key notes / natural signs in exercises — Phase 08 node data
- Key signature in Note Recognition game — explicitly out of scope per REQUIREMENTS
- Minor key signatures — explicitly out of scope per REQUIREMENTS
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RENDER-01 | VexFlow renders key signature glyphs on staff via `stave.addKeySignature()` | Verified: `Stave.addKeySignature()` exists in VexFlow 5.0.0, all 6 target keys confirmed working |
| RENDER-02 | Accidentals suppressed for notes covered by active key signature via `Accidental.applyAccidentals()` | Verified: `Accidental.applyAccidentals([voices], keySpec)` works correctly — F# in G major gets 0 modifiers, F natural in G major gets natural sign |
| RENDER-03 | Key signature config passes through trail node → game component pipeline | Mapped: TrailNodeModal.navigateToExercise → navState → SightReadingGame trailSettings → generatePatternData → VexFlowStaffDisplay prop |
</phase_requirements>

---

## Summary

Phase 07 adds key signature glyph rendering and automatic accidental suppression to the VexFlow sight reading display. All three requirements map to specific, verified VexFlow 5 APIs. The work is primarily a surgical extension to three existing files: `VexFlowStaffDisplay.jsx` (stave creation + note building), `SightReadingGame.jsx` (settings pipeline + prop passing), and `PreGameSetup.jsx` (key dropdown). `TrailNodeModal.jsx` and `patternBuilder.js` each receive a small passthrough change.

The most important technical finding: `Accidental.applyAccidentals([voice], keySpec)` in VexFlow 5 is fully automatic — it correctly suppresses in-key accidentals (e.g., no sharp shown on F# in G major), adds natural signs for deviations (F natural in G major), and handles courtesy accidentals (F# reminder after a natural F in the same measure). It works equally well whether or not notes have pre-existing manual modifiers; pre-existing modifiers on in-key notes are removed. The safe implementation pattern is to skip manual `note.addModifier(new Accidental(...))` calls in `buildStaveNote` when a key signature is active, then call `applyAccidentals` after the voice is assembled.

**Primary recommendation:** Wire `keySignature` through the config pipeline as a single string prop, call `stave.addKeySignature(keySignature)` between `addClef()` and `addTimeSignature()` on bar 0 only, and replace per-note manual accidental logic with a single `Accidental.applyAccidentals([voice], keySignature)` call per measure when key signature mode is active.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vexflow | 5.0.0 (installed) | Music notation rendering | Already in use throughout the app |

**No new dependencies required.** All needed APIs (`Stave.addKeySignature`, `Accidental.applyAccidentals`, `KeyManager`) are part of VexFlow 5.0.0, which is already installed.

**Version verification:** `npm view vexflow version` → 5.0.0 matches installed.

---

## Architecture Patterns

### VexFlow Key Signature Rendering Flow (per bar)

Standard pattern for bar 0 with key signature:
```javascript
// Source: VexFlow 5 API — verified in this project's node_modules
// Order: clef → key sig → time sig (standard music notation order)
const stave = new Stave(xPos, yPosition, staveWidth);
stave.addClef(clef);
if (barIdx === 0 && keySignature && keySignature !== 'C') {
  stave.addKeySignature(keySignature); // 'G', 'D', 'A', 'F', 'Bb', 'Eb'
}
stave.addTimeSignature(pattern.timeSignature);
stave.setContext(context).draw();
```

For bars 1+ in multi-bar patterns: no `addKeySignature()` call (standard convention, locked decision).

### Accidental Suppression Pattern

The critical change to `buildStaveNote`: in key signature mode, do NOT add manual accidentals. Then call `applyAccidentals` after voice assembly:

```javascript
// Source: VexFlow 5 — verified behavior in project's node_modules

// Step 1: Build note WITHOUT manual accidental when keySignature active
const buildStaveNote = ({ pitchStr, duration, targetClef, skipManualAccidental = false }) => {
  const parsedPitch = parsePitchForVexflow(pitchStr);
  const note = new StaveNote({ keys: [parsedPitch.key], duration, clef: targetClef });
  if (!skipManualAccidental && parsedPitch?.accidental) {
    note.addModifier(new Accidental(parsedPitch.accidental), 0);
  }
  // ... dot handling unchanged ...
  return note;
};

// Step 2: After voice assembly, call applyAccidentals
// Takes array of Voice objects + VexFlow key spec string
if (keySignature && keySignature !== 'C') {
  Accidental.applyAccidentals([voice], keySignature);
}
// 'C' skips applyAccidentals entirely (no accidentals to manage)
```

**Verified behavior (all tested in VexFlow 5.0.0):**
- F# note + `applyAccidentals([v], 'G')` → 0 modifiers (key sig glyph covers it)
- F natural note + `applyAccidentals([v], 'G')` → 1 modifier: natural sign `'n'`
- Bb note + `applyAccidentals([v], 'Bb')` → 0 modifiers
- F natural followed by F# in G major → F natural gets `'n'`, F# gets courtesy `'#'` (both correct)

### `applyAccidentals` Signature (VexFlow 5)

```javascript
// Confirmed from source inspection
Accidental.applyAccidentals(voices: Voice[], keySpec: string): void
// voices: array of Voice objects for the current measure
// keySpec: VexFlow key string ('G', 'Bb', 'Eb', etc.) — matches our config format directly
```

Note: `keySpec` defaults to `'C'` if falsy. No translation layer needed — the locked decision to use VexFlow key strings directly (`'G'`, `'Bb'`, etc.) aligns perfectly with this API.

### Config Pipeline Pattern

The `keySignature` field flows through the same pipeline as `clef` and `timeSignature`:

```
trail node config:       { keySignature: 'G', notePool: [...], clef: 'treble' }
    ↓ TrailNodeModal.navigateToExercise()
navState:                { nodeConfig: { keySignature: 'G', ... }, enableSharps, enableFlats }
    ↓ SightReadingGame useEffect (auto-configure from trail)
trailSettings:           { ...DEFAULT_SETTINGS, clef, selectedNotes, keySignature: 'G' }
    ↓ startGame(trailSettings) → generatePatternData()
patternBuilder:          keySignature param → note pool filtering
    ↓ generatePatternData return + gameSettings
VexFlowStaffDisplay:     keySignature prop → stave.addKeySignature + applyAccidentals
```

### Note Pool Filtering for In-Key Notes

When a key is selected in free-play, auto-filter `selectedNotes` to in-key pitches. Uses `KeyManager` from VexFlow (already imported as needed, or use a static map):

**Verified in-key pitch sets (all octaves use same note letters):**
| Key | In-key notes (letter names) |
|-----|----------------------------|
| C | C, D, E, F, G, A, B |
| G | C, D, E, G, A, B, F# |
| D | D, E, G, A, B, C#, F# |
| A | A, B, D, E, C#, F#, G# |
| F | C, D, E, F, G, A, Bb |
| Bb | C, D, F, G, A, Bb, Eb |
| Eb | C, D, F, G, Bb, Eb, Ab |

Implementation: a static `KEY_NOTE_LETTERS` map (keyed by VexFlow key string) is simpler and testable compared to runtime `KeyManager` calls. Filter `selectedNotes` by checking if the note's letter+accidental (e.g., `'F#'` from `'F#4'`) is in the in-key set.

### Stave Width Impact

Measured in VexFlow 5 (this project's installed version):
- Stave total width: unchanged (still set by constructor)
- `getNoteStartX()` difference with 3-sharp A major vs. no key sig: +17px at scale 1
- The existing `STAVE_WIDTH_BASE` and `formatterWidth` calculations in `VexFlowStaffDisplay` already account for clef/time-sig overhead with ~140px subtracted from stave width for the formatter. Key signature glyphs (max ~25px) fit within this existing buffer — **no stave width change required** for the 3-flat/3-sharp maximum in Phase 07.
- VexFlow handles internal layout automatically; the formatter width just needs to leave the occupied header space. Existing code: `Math.max(STAVE_WIDTH_BASE - 140, 200)` — this margin is sufficient for all 6 keys.

### Recommended Project Structure Changes

Only modifications to existing files; no new files needed for the core implementation:

```
src/
├── components/games/sight-reading-game/
│   ├── components/
│   │   ├── VexFlowStaffDisplay.jsx   # addKeySignature + applyAccidentals
│   │   └── PreGameSetup.jsx          # Add key dropdown step
│   ├── SightReadingGame.jsx          # keySignature in trailSettings + DEFAULT_SETTINGS
│   └── constants/
│       └── gameSettings.js           # keySignature: null in DEFAULT_SETTINGS
├── components/trail/
│   └── TrailNodeModal.jsx            # Pass keySignature in navState
├── components/games/shared/
│   └── UnifiedGameSettings.jsx       # KeySignatureSelection step component
└── locales/
    ├── en/common.json                # Key signature i18n keys
    └── he/common.json                # Hebrew translations
```

### Anti-Patterns to Avoid

- **Calling `addKeySignature('C')`**: VexFlow renders C major as "no glyphs" (correct behavior), but it is still a wasted call. Use `keySignature && keySignature !== 'C'` guard.
- **Adding key signature on bars 1+**: locked decision says first bar only. Multi-bar loop must explicitly skip `addKeySignature` on `barIdx > 0`.
- **Manual accidentals + applyAccidentals on same note**: While verified that applyAccidentals removes pre-existing modifiers for in-key notes, the cleanest pattern is passing `skipManualAccidental: true` to `buildStaveNote` when key signature mode is active — avoids accidental double-processing.
- **Passing key signature through `enableSharps`/`enableFlats`**: The locked decision says `keySignature` takes precedence. When `keySignature` is set, bypass the old `enableSharps`/`enableFlats` flags entirely for note pool filtering and accidental display.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Key signature glyphs | Custom SVG sharp/flat symbols | `stave.addKeySignature('G')` | VexFlow knows glyph positions, spacing, clef-specific placement |
| Accidental suppression logic | Track which notes are in key manually | `Accidental.applyAccidentals([voice], keySpec)` | Handles same-measure courtesy accidentals, natural signs, all edge cases |
| Key-to-scale mapping | Custom note-letter lookup table from scratch | Static `KEY_NOTE_LETTERS` map derived from VexFlow `KeyManager` (verified) | Already correct; no need for algorithm |
| In-key pitch filtering | Complex pitch parsing with accidental normalization | Filter by letter+accidental extracted from pitch string (e.g., `'F#4'` → letter `'F#'`) | Pitch strings already follow consistent `Note+Octave` format in this codebase |

**Key insight:** VexFlow's `applyAccidentals` is specifically designed for this use case. It handles the full notation ruleset including measure-scope tracking, courtesy accidentals, and natural signs. Any manual approach would replicate this logic imperfectly.

---

## Common Pitfalls

### Pitfall 1: Wrong Order — Time Signature Before Key Signature
**What goes wrong:** Glyph appears to the right of time signature, which is musically incorrect.
**Why it happens:** VexFlow renders modifiers in order of addition; standard music notation always puts key signature between clef and time signature.
**How to avoid:** Always `addClef()` → `addKeySignature()` → `addTimeSignature()` on bar 0.
**Warning signs:** Key signature glyph visually positioned after the time signature numerals.

### Pitfall 2: Calling applyAccidentals Before Voice Has All Tickables
**What goes wrong:** Accidentals computed for partial measure — courtesy/natural logic is wrong.
**Why it happens:** `applyAccidentals` processes the entire voice sequentially; calling it before `addTickables` is complete gives incorrect results.
**How to avoid:** Build the complete `staveNotes` array, create the voice, add ALL tickables, THEN call `applyAccidentals`.

### Pitfall 3: Not Guarding Against C Major / null keySignature
**What goes wrong:** `applyAccidentals([voice], 'C')` is harmless but wasteful; `applyAccidentals([voice], null)` defaults to 'C' (VexFlow source verified), which is also harmless but confusing.
**How to avoid:** Use guard: `if (activeKeySignature && activeKeySignature !== 'C')`. This also ensures existing non-key-signature exercises have zero behavior change (RENDER-03 regression requirement).

### Pitfall 4: Key Signature Not Passed to VexFlowStaffDisplay
**What goes wrong:** Key signature glyph never appears even when trail mode sets it.
**Why it happens:** `VexFlowStaffDisplay` currently receives `pattern`, `clef`, `performanceResults`, `gamePhase`. `keySignature` must be added as a new prop (or carried on the pattern object).
**How to avoid:** The cleaner approach is a dedicated `keySignature` prop on `VexFlowStaffDisplay` rather than embedding in `pattern` (pattern is a data object; key signature is a display concern passed alongside it).
**Warning signs:** `addKeySignature` never called in rendering code; glyph absent in dev.

### Pitfall 5: Note Pool Filter Applied Globally After Key Selection
**What goes wrong:** When the user selects a key in free-play, all their previously selected notes are replaced rather than filtered down.
**Why it happens:** Naive implementation replaces `selectedNotes` with the in-key set.
**How to avoid:** Filter the CURRENT `selectedNotes` to only retain pitches whose letter is in the key. Default to the full in-key set (all octaves) if no notes were previously selected.

### Pitfall 6: Grand Staff Mode Missing Key Signature
**What goes wrong:** `clef === 'both'` path has its own stave creation loop; if the fix is only applied to the single-clef path, grand staff renders without key signature.
**Why it happens:** `VexFlowStaffDisplay.jsx` has two separate stave rendering branches: single-clef (lines ~1073-1220) and grand staff (lines ~563-823). Both must be updated.
**How to avoid:** Apply `addKeySignature` in both branches' bar-0 stave creation.

---

## Code Examples

### Complete Key Signature Rendering (Single Clef, Single Bar)
```javascript
// Source: VexFlow 5.0.0 — verified in this project's node_modules
const stave = new Stave(STAVE_X, yPosition, TOTAL_STAVE_WIDTH);
stave.addClef(clef);
if (keySignature && keySignature !== 'C') {
  stave.addKeySignature(keySignature); // between clef and time sig
}
stave.addTimeSignature(pattern.timeSignature);
stave.setEndBarType(Barline.type.DOUBLE);
stave.setContext(context).draw();

// ... build staveNotes WITHOUT manual accidentals ...
// (pass skipManualAccidental: true to buildStaveNote in key sig mode)

const voice = new Voice({ num_beats: beatsPerMeasure, beat_value: 4 })
  .setMode(Voice.Mode.SOFT);
voice.addTickables(staveNotes);

// Apply accidentals AFTER voice is fully assembled, BEFORE formatter
if (keySignature && keySignature !== 'C') {
  Accidental.applyAccidentals([voice], keySignature);
}

new Formatter().joinVoices([voice]).format([voice], formatterWidth);
voice.draw(context, stave);
```

### Multi-Bar: Key Signature on Bar 0 Only
```javascript
// Source: matches existing multi-bar loop pattern in VexFlowStaffDisplay.jsx
for (let barIdx = 0; barIdx < totalBars; barIdx++) {
  const xPos = STAVE_X + (barIdx * staveWidthPerBar);
  const stave = new Stave(xPos, yPosition, staveWidthPerBar);

  if (barIdx === 0) {
    stave.addClef(clef);
    if (keySignature && keySignature !== 'C') {
      stave.addKeySignature(keySignature); // first bar only
    }
    stave.addTimeSignature(pattern.timeSignature);
  } else {
    stave.setBegBarType(Barline.type.NONE);
  }
  // ... rest of per-bar loop unchanged ...
}
```

### buildStaveNote with Key Signature Guard
```javascript
// Source: extension of existing buildStaveNote in VexFlowStaffDisplay.jsx
const buildStaveNote = ({ pitchStr, duration, targetClef, skipManualAccidental = false }) => {
  const isRest = String(duration || '').endsWith('r');
  let cleanDuration = String(duration || 'q').replace(/r$/, '');
  const isDotted = cleanDuration.endsWith('.');
  if (isDotted) cleanDuration = cleanDuration.slice(0, -1);

  const parsedPitch = isRest ? null : parsePitchForVexflow(pitchStr);
  const vexflowKey = isRest
    ? (targetClef === 'bass' ? 'd/3' : 'b/4')
    : parsedPitch.key;

  const note = new StaveNote({
    keys: [vexflowKey],
    duration: isRest ? `${cleanDuration}r` : cleanDuration,
    clef: targetClef,
  });

  // Only add manual accidental when NOT in key signature mode
  if (!isRest && !skipManualAccidental && parsedPitch?.accidental) {
    note.addModifier(new Accidental(parsedPitch.accidental), 0);
  }

  if (isDotted) {
    for (let i = 0; i < noteConfig.keys.length; i++) {
      note.addModifier(new Dot(), i);
    }
  }
  return note;
};
```

### TrailNodeModal: Adding keySignature to navState
```javascript
// Source: extension of existing navigateToExercise in TrailNodeModal.jsx
const navigateToExercise = (exerciseIndex) => {
  const exercise = node.exercises[exerciseIndex];
  const notePool = exercise.config?.notePool || [];
  const enableSharps = notePool.some(n => n.includes('#'));
  const enableFlats = notePool.some(n => /^[A-G]b\d/.test(n));

  const navState = {
    nodeId: node.id,
    nodeConfig: exercise.config,
    exerciseIndex,
    totalExercises,
    exerciseType: exercise.type,
    enableSharps,
    enableFlats,
    keySignature: exercise.config?.keySignature ?? null,  // NEW
  };
  // ... switch statement unchanged ...
};
```

### SightReadingGame: keySignature in trailSettings
```javascript
// Source: extension of existing auto-configure useEffect in SightReadingGame.jsx (lines 286-317)
const trailKeySignature = location.state?.keySignature ?? null;

// In the auto-configure useEffect:
const trailSettings = {
  ...DEFAULT_SETTINGS,
  clef: nodeConfig.clef || 'treble',
  selectedNotes: nodeConfig.notePool || [],
  measuresPerPattern: nodeConfig.measuresPerPattern || 1,
  timeSignature: nodeConfig.timeSignature || '4/4',
  enableSharps: trailEnableSharps,
  enableFlats: trailEnableFlats,
  keySignature: trailKeySignature,  // NEW
};
```

### Free-Play Key Dropdown: In-Key Note Pool Filtering
```javascript
// Source: new logic in PreGameSetup.jsx / UnifiedGameSettings.jsx
const KEY_NOTE_LETTERS = {
  'C':  ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'G':  ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'D':  ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'A':  ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'F':  ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
};

// Filter selectedNotes to in-key pitches when key changes
const filterNotesToKey = (currentNotes, keySignature) => {
  if (!keySignature || keySignature === 'C') return currentNotes;
  const inKeyLetters = new Set(KEY_NOTE_LETTERS[keySignature] || []);
  // Extract letter from pitch string e.g. 'F#4' -> 'F#', 'Bb3' -> 'Bb'
  return currentNotes.filter(pitch => {
    const match = String(pitch).match(/^([A-G][#b]?)\d/);
    return match && inKeyLetters.has(match[1]);
  });
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-note manual accidentals (`note.addModifier(new Accidental(...))`) | `Accidental.applyAccidentals([voice], keySpec)` for key sig mode | Phase 07 | Key-signature-aware suppression/addition is automatic and handles all edge cases |
| No key signature in sight reading | `stave.addKeySignature()` on bar 0 | Phase 07 | Visually correct key signature display |

**No deprecated API usage needed.** VexFlow 5's `addKeySignature` and `applyAccidentals` are both stable, present in 5.0.0, and match the documentation.

---

## Open Questions

1. **Does `pattern.keySignature` or a separate prop fit better for VexFlowStaffDisplay?**
   - What we know: `VexFlowStaffDisplay` currently takes `pattern`, `clef`, `performanceResults`, `gamePhase` as props. `clef` is already a separate top-level prop even though it could live in `pattern`.
   - What's unclear: whether other consumers of `VexFlowStaffDisplay` would need to pass `keySignature` (currently only `SightReadingGame` uses it).
   - Recommendation: Separate prop `keySignature` mirrors the `clef` precedent and keeps `pattern` as a pure data object. Default `keySignature={null}` ensures zero regression on existing call sites.

2. **PreGameSetup: New step or inline control for key selection?**
   - What we know: Existing `config.steps` array drives the wizard UI. Adding a step (`KeySignatureSelection`) is the established pattern (ClefSelection, TimeSignatureSelection are examples). However, key selection is related to note pool and could benefit from being on the same screen.
   - Recommendation (Claude's discretion): Add as a step before NoteSelection, similar to ClefSelection. Auto-filter happens immediately when the key is selected, and the user sees the filtered notes in the next step.

3. **`KEY_NOTE_LETTERS` map location**
   - What we know: It's used in PreGameSetup (filtering) and potentially for validation. It's a small, static, pure-data lookup.
   - Recommendation: Define it in a new `src/components/games/sight-reading-game/constants/keySignatureConfig.js`. Both PreGameSetup and VexFlowStaffDisplay could import from it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (globals: true) |
| Config file | `vitest.config.js` (root) |
| Quick run command | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RENDER-01 | `stave.addKeySignature()` called when `keySignature` prop is non-null | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | ❌ Wave 0 |
| RENDER-02 | `Accidental.applyAccidentals` suppresses in-key accidentals + adds naturals | unit | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` | ❌ Wave 0 |
| RENDER-03 | `generatePatternData` passes `keySignature` through and filters note pool | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | Extends existing |

Visual regression (null/absent keySignature renders identically to before) is a **manual-only** check — requires visual inspection of the rendered SVG. No automated assertion covers "no visual change."

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/games/sight-reading-game/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` — covers RENDER-02 (accidental suppression logic + in-key note filtering)
- [ ] Additional test cases in `patternBuilder.test.js` — covers RENDER-03 (`keySignature` param filters note pool)

---

## Sources

### Primary (HIGH confidence)
- VexFlow 5.0.0 installed package (`node_modules/vexflow`) — API verified at runtime: `Stave.addKeySignature`, `Accidental.applyAccidentals`, `KeyManager.scaleMap`
- `docs/vexflow-notation/vexflow-guidelines.md` — project's VexFlow implementation rules
- `docs/vexflow-notation/vexflow-tutorial.md` — VexFlow API reference
- `docs/vexflow-notation/vexflow-examples.md` — Code patterns

### Secondary (MEDIUM confidence)
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — existing stave creation code (lines 566-591 for single-clef path, ~563-623 for grand staff)
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — `generatePatternData` signature and note selection logic
- `src/components/trail/TrailNodeModal.jsx` — `navigateToExercise` navState shape (lines 159-208)
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — `trailSettings` assembly (lines 286-317) and `VexFlowStaffDisplay` usage (line 3492)
- `src/components/games/sight-reading-game/components/PreGameSetup.jsx` — existing steps config, where key dropdown step is added

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — VexFlow 5.0.0 installed, all APIs verified at runtime
- Architecture: HIGH — integration points identified by reading actual source files, no speculation
- Pitfalls: HIGH — pitfalls derived from reading the actual rendering code branches (grand staff path, multi-bar loop, etc.)

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable VexFlow 5, no churn expected)
