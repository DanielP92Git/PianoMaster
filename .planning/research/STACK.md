# Stack Research

**Domain:** Piano learning PWA — v2.4 Key Signatures + Advanced Rhythm content expansion
**Researched:** 2026-03-18
**Confidence:** HIGH (all VexFlow claims verified against installed vexflow@5.0.0)

> This is an **additive** research document. The existing validated stack (React 18, Vite 6,
> Supabase, VexFlow v5, pitchy, Web Audio API, Tailwind, i18next) is unchanged.
> This file answers only: **what is needed for v2.4 Key Signatures and Advanced Rhythm?**

---

## Summary Answer: No New Dependencies Required

All capabilities needed for v2.4 are present in `vexflow@5.0.0` (already installed at that
exact version). The work is **configuration and logic changes inside existing files**, not
new packages.

Verified against installed build at `node_modules/vexflow/build/cjs/vexflow.js`:

| Capability | VexFlow API | Verified |
|---|---|---|
| Key signature display on stave | `Stave.addKeySignature(key)` | YES |
| All 15 major key signatures | `new KeySignature('G')`, `'Bb'`, `'F#'`, `'Cb'` etc. | YES |
| Minor key signatures | `new KeySignature('Am')`, `'Em'`, `'Bm'`, `'F#m'` | YES |
| Compound time signatures (6/8, 9/8, 12/8) | `Stave.addTimeSignature('6/8')` | YES |
| Key-context accidental suppression | `Accidental.applyAccidentals(voices, key)` | YES |
| Key-aware per-note logic | `KeyManager('G').selectNote('f#')` → `{ change: false }` | YES |
| Compound beam groups (3 eighth notes) | `Beam.generateBeams(notes, { groups: [new Fraction(3,8)] })` | YES (Fraction class present) |
| Dotted notes as beat unit in 6/8 | `Dot.buildAndAttach([note], { all: true })` | Already used in codebase |
| Syncopation ties | `StaveTie({ first_note, last_note, first_indices, last_indices })` | YES (already imported) |
| Triplet bracket | `new Tuplet(notes, { num_notes: 3, beats_occupied: 2 })` | YES |
| Cancel previous key signature | `stave.addKeySignature(newKey, prevKey)` | YES |

---

## Recommended Stack

### Core Technologies (existing — no changes)

| Technology | Version | Purpose | v2.4 Impact |
|---|---|---|---|
| vexflow | 5.0.0 | SVG music notation | Already installed; all needed APIs confirmed present |
| React 18 | 18.3.1 | UI rendering | No change needed |
| Vite 6 | 6.3.5 | Build tooling | No change needed |
| i18next | 25.7.0 | EN/HE translations | New key name translations needed (e.g. `"G major"`, `"מי מינור"`) |
| pitchy | 4.1.0 | McLeod pitch detection | Unchanged — key sigs affect display, not pitch detection |
| @supabase/supabase-js | 2.48.1 | Database + auth | No schema changes — `node_id TEXT` handles new node IDs |

### VexFlow APIs Needed for v2.4 (subset of existing vexflow@5.0.0)

These APIs are in the installed package but **not yet imported** in `VexFlowStaffDisplay.jsx`:

| API | Import | Purpose |
|---|---|---|
| `KeySignature` | `import { KeySignature } from 'vexflow'` | Render key sig accidentals on stave |
| `Fraction` | `import { Fraction } from 'vexflow'` | Beam group config for compound time |
| `Tuplet` | `import { Tuplet } from 'vexflow'` | Triplet visual bracket (advanced rhythm) |

Already imported in `VexFlowStaffDisplay.jsx` and usable without changes:
- `Accidental` — `Accidental.applyAccidentals(voices, key)` is a static method, already available
- `StaveTie` — already imported, needs usage in syncopation render path
- `Beam` — `Beam.generateBeams` already used; just needs `groups` config for compound time
- `Dot` — already imported and used

`KeyManager` is used internally by `Accidental.applyAccidentals` — no direct import needed.

---

## Supporting Libraries

### No New Libraries

| Existing Library | v2.4 Role | Notes |
|---|---|---|
| `pitchy` 4.1.0 | Unchanged | Key signatures are display-only; McLeod detects raw pitch regardless of key context |
| `i18next` 25.7.0 | Add `keySignature.*` namespace | Additive translations only — e.g. `"G major"`, `"D major"`, `"F major"`, Hebrew solfege equivalents |
| `@supabase/supabase-js` 2.48.1 | No changes | New nodes use same `student_skill_progress` schema; `node_id TEXT` is flexible by design |

---

## Development Tools

### No New Tools

| Tool | v2.4 Impact |
|---|---|
| `scripts/validateTrail.mjs` | Automatically validates new nodes at prebuild — no script changes needed |
| Vitest 3.2.4 | New unit tests for `rhythmGenerator` compound/syncopation extensions use existing test infrastructure |

---

## Integration Points

### 1. Key Signatures in VexFlowStaffDisplay.jsx

**What changes:** Add optional `keySignature` prop (e.g. `'G'`, `'F'`, `'Bb'`, `'F#'`).

When `keySignature` is provided:
1. `stave.addKeySignature(keySignature)` on the first stave renders the key sig symbols
2. After all `StaveNote` objects are created and added to voices, call
   `Accidental.applyAccidentals(voices, keySignature)` — this walks the notes and
   suppresses accidental symbols for notes already covered by the key signature, and
   adds natural signs where a note deviates from the key

**What does NOT change:** Note data format. Notes in `notePool` remain as `'F#4'`, `'Bb4'`
etc. The key signature only determines which accidental symbols VexFlow renders on-screen.
`patternBuilder.js` already handles accidental pitch strings correctly (fixed in v2.2).

**Key signature cancel** (for exercises that modulate): `stave.addKeySignature(newKey, prevKey)`
renders cancellation naturals. For v2.4, each exercise is self-contained so this can be
omitted — worth noting for future multi-key exercises.

**Verified:** `Accidental.applyAccidentals` source confirmed to accept `(voices, keyString)`
where `keyString` is the same format used by `addKeySignature` (e.g. `'G'`, `'F#m'`).

### 2. Compound Time in rhythmGenerator.js + durationConstants.js

`RhythmPatternGenerator.js` already defines `SIX_EIGHT` with `isCompound: true` and
`measureLength: 12`. The data structure is ready. What needs attention:

**Beat unit problem:** `rhythmGenerator.js` uses `unitsPerBeat = measureLength / beats`.
For 6/8 as currently defined (`beats: 6`, `measureLength: 12`), `unitsPerBeat = 2`
(one eighth note per "beat"). This treats 6/8 as 6 individual eighth note beats, which
is metrically wrong for pedagogy — 6/8 has 2 compound beats of 3 eighths each.

Two options:
- **Option A (recommended):** Add `compoundBeats` and `unitsPerCompoundBeat` to compound
  time signature definitions. The generator fills measures in compound-beat groups (3 eighths
  = one beat unit). This keeps the existing simple-time logic clean.
- **Option B:** Change `beats: 6` to `beats: 2` for 6/8 in `RhythmPatternGenerator.js`
  and adjust `measureLength` math. Risk: touches shared code used by existing rhythm games.

Option A is safer — additive change, no risk to existing 4/4/3/4/2/4 nodes.

**Beam groups:** `Beam.generateBeams(notes, { groups: [new Fraction(3, 8)] })` produces
correct 3-eighth-note beaming for 6/8. Fraction is confirmed available. The existing
`Beam.generateBeams` call in `VexFlowStaffDisplay.jsx` needs to pass this config when
`isCompound: true` in the resolved time signature.

**9/8 and 12/8:** Same `Fraction(3, 8)` group works — 9/8 gets 3 groups of 3, 12/8 gets
4 groups of 3. The generator fills by groups of 3 eighths, display beams by groups of 3.

### 3. Syncopation Pattern Generation in rhythmGenerator.js

Syncopation = note attack on a weak beat with duration crossing a strong beat boundary.
This requires no new VexFlow APIs. The existing `rhythmPatterns.js` complex pattern
system (with `beatsSpan`) already supports cross-beat events conceptually.

**What's missing:**
- New complex pattern definitions in `rhythmPatterns.js` for classic syncopation archetypes:
  - Off-beat eighth + tied quarter (beat 4-and into beat 1)
  - Dotted-quarter/eighth alternation in 4/4 (creates off-beat emphasis)
  - Anticipation figure (quarter on beat 4-and, tied into next measure)
- Tie rendering: `VexFlowStaffDisplay.jsx` builds notes per-measure and already imports
  `StaveTie`. The render path needs to detect paired tied-note events (where `event.tiedTo`
  references the next note) and create `StaveTie` objects. This is a localized change to
  the per-measure render loop.

**Cross-measure ties** (anticipation): `StaveTie` accepts `first_note` from stave N and
`last_note` from stave N+1. The component already renders multi-measure patterns with
a `measures` array, so tie references can be tracked across the measure loop.

### 4. Node Data Files (new units)

New unit files follow the exact pattern of existing `rhythmUnit*.js` and `trebleUnit*.js`.
No structural changes to the schema. Two new config fields needed:

```javascript
// Key signature nodes — extend noteConfig
noteConfig: {
  notePool: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'],
  keySignature: 'G',        // NEW: key for stave display + Accidental.applyAccidentals
  clef: 'treble',
  accidentals: true,        // Already supported
}

// Compound time rhythm nodes — extend rhythmConfig
rhythmConfig: {
  timeSignature: '6/8',     // Already in TIME_SIGNATURES with isCompound: true
  durations: ['8', 'q.'],   // Dotted quarter = compound beat unit
  isCompound: true,         // NEW: signals compound beat-group logic in generator
  pitch: 'C4',
}
```

### 5. expandedNodes.js + subscriptionConfig.js

Same wiring pattern as v2.2 accidental nodes. All new nodes are premium by default —
not added to `FREE_NODE_IDS`. No Postgres migration needed (exclusion-by-default pattern).

---

## Installation

```bash
# No new dependencies to install.
# vexflow@5.0.0 already installed contains all required APIs.
```

Add to existing vexflow imports in `VexFlowStaffDisplay.jsx`:

```javascript
import {
  // ... existing imports ...
  KeySignature,  // render key sig on stave
  Fraction,      // compound time beam groups
  Tuplet,        // triplet visual bracket (advanced rhythm)
} from 'vexflow';
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|---|---|---|
| `Accidental.applyAccidentals(voices, key)` for key-context accidentals | Manually track key state with `KeyManager.selectNote()` per note | `applyAccidentals` is the intended batch API; manual tracking duplicates VexFlow internal logic and is error-prone across multi-note patterns |
| `Beam.generateBeams(notes, { groups: [new Fraction(3,8)] })` for compound beaming | Manual `new Beam(noteGroup)` for each group of 3 | Auto-beaming handles edge cases (rests, stem direction) correctly; manual beaming requires duplicating that logic |
| `StaveTie` for syncopation ties | CSS visual-only pseudo-arc | `StaveTie` is semantic, renders correctly across measure boundaries, survives resize; CSS workaround breaks under SVG redraws |
| Extend `rhythmPatterns.js` with compound/syncopation archetypes | Separate generator for advanced rhythm | Single generator with compound-aware mode is simpler; the existing beat-wise loop architecture in `rhythmGenerator.js` supports it cleanly |
| `vexflow@5.0.0` (stay) | Upgrade to hypothetical vexflow@5.x | The 80KB `VexFlowStaffDisplay.jsx` is production-tested; unnecessary upgrade risks regression in a heavily customized component |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| EasyScore API for key signature context | EasyScore string format does not pass key context to `Accidental.applyAccidentals`; key accidentals won't be suppressed | Direct `Stave.addKeySignature()` + `Accidental.applyAccidentals(voices, key)` |
| Triplet duration code `'8t'` | Not valid in VexFlow v5 — throws `RuntimeError: The provided duration is not valid: t` (verified) | Three standard `StaveNote`s with `'q'` duration wrapped in `new Tuplet(notes, { num_notes: 3, beats_occupied: 2 })` |
| `new StaveNote({ duration: 'q.' })` | Throws `RuntimeError: Invalid note initialization object` in VexFlow v5 (verified — dotted duration strings not accepted in note constructor) | `new StaveNote({ duration: 'q' })` then `Dot.buildAndAttach([note], { all: true })` — already the pattern in codebase |
| New npm package for music theory (tonal.js, teoria) | Overkill for key signature display; `KeyManager` (bundled in vexflow) handles the one thing needed: which accidentals a key implies | `KeyManager` from installed vexflow package, or `Accidental.applyAccidentals` which wraps it |
| Web Audio API changes for key context | Key signatures are notation/display only; pitch detection (pitchy/McLeod) correctly identifies absolute pitch regardless of key | No audio changes needed for key signatures |

---

## Stack Patterns by Variant

**Key signature nodes (note recognition):**
- `noteConfig.keySignature = 'G'` in the node definition
- `VexFlowStaffDisplay` receives `keySignature` prop from game settings
- `stave.addKeySignature(key)` renders the key signature symbols at stave start
- `Accidental.applyAccidentals(voices, key)` after voice creation handles per-note display
- Pitch detection unchanged — McLeod outputs absolute chromatic pitch; MIDI equality check
  (already `noteToMidi`-based from v2.2) handles enharmonic equivalence correctly

**Key signature nodes (sight reading):**
- Same `keySignature` prop flow
- `patternBuilder.js` already accepts accidental pitch strings (fixed v2.2)
- For G major, notes in `selectedNotes` include `'F#4'`; VexFlow renders it without a `#` symbol
  because `Accidental.applyAccidentals` sees it's implied by the key
- Natural notes that deviate from key (e.g. F♮ in G major context) automatically get `♮` symbol

**Compound time rhythm (6/8):**
- `rhythmConfig.timeSignature = '6/8'` and `isCompound: true`
- `rhythmGenerator.js` fills measures in groups of 3 eighths (compound beat unit)
- `VexFlowStaffDisplay.jsx` passes `{ groups: [new Fraction(3, 8)] }` to `Beam.generateBeams`
- The dotted quarter (`q.`) is the visual beat unit — expressed as `StaveNote({ duration: 'q' })`
  + `Dot.buildAndAttach` per existing codebase pattern

**Syncopation in simple time (4/4):**
- No time signature change
- New pattern archetypes in `rhythmPatterns.js` with `isDotted` and multi-event beatsSpan
- `StaveTie` objects created in the measure render loop for tied-note pairs
- No new VexFlow APIs; localized change to the measure rendering loop in `VexFlowStaffDisplay.jsx`

---

## Version Compatibility

| Package | Compatible With | Notes |
|---|---|---|
| vexflow@5.0.0 | React 18.3.1, Vite 6.3.5 | Already in production with zero issues |
| vexflow@5.0.0 | `KeySignature`, `Fraction`, `Tuplet` APIs documented here | Verified by direct inspection of installed build |
| i18next@25.7.0 | New `keySignature.*` translation keys | Additive; no breaking changes |

---

## Sources

- `node_modules/vexflow/build/cjs/vexflow.js` (installed) — Direct runtime API inspection:
  `KeySignature`, `TimeSignature`, `KeyManager`, `Fraction`, `Tuplet`, `Accidental.applyAccidentals`,
  `Stave.addKeySignature`, `Stave.addTimeSignature`, `StaveTie` all confirmed present and
  functional (HIGH confidence)
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — Existing
  imports, rendering architecture, Dot/Beam/StaveTie usage patterns confirmed (HIGH confidence)
- `src/components/games/sight-reading-game/constants/durationConstants.js` — Dotted durations
  already defined; `6/8` with `isCompound: true` already in TIME_SIGNATURES (HIGH confidence)
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — `SIX_EIGHT` time signature
  with `isCompound: true` already defined; compound beat unit issue identified (HIGH confidence)
- `src/components/games/sight-reading-game/utils/rhythmPatterns.js` — Complex pattern
  architecture confirmed; syncopation archetypes are additive to existing structure (HIGH confidence)
- `docs/vexflow-notation/vexflow-guidelines.md` — Project-specific VexFlow conventions and
  `Beam.generateBeams` groups documentation (HIGH confidence)
- `package.json` — vexflow@5.0.0 confirmed as installed version (HIGH confidence)

---
*Stack research for: v2.4 Key Signatures and Advanced Rhythm content expansion*
*Researched: 2026-03-18*
