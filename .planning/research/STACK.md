# Stack Research

**Domain:** Piano learning PWA — Sharps & Flats trail content expansion
**Researched:** 2026-03-15
**Confidence:** HIGH — All findings verified against existing codebase; no new external libraries required

---

## Executive Summary

The Sharps & Flats milestone requires **zero new libraries**. Every capability needed — accidental rendering, note naming, audio playback, pitch comparison, subscription gating — is already implemented and working in the existing codebase. The work is entirely additive: new data files under `src/data/units/`, two migrations, and targeted bug fixes to existing conversion logic.

---

## Recommended Stack

### Core Technologies

All previously validated. No changes.

| Technology | Version | Purpose | Why Relevant to This Milestone |
|------------|---------|---------|-------------------------------|
| VexFlow | v5 (existing) | SVG music notation rendering | `Accidental` class already imported and used in `VexFlowStaffDisplay.jsx`; `#` and `b` accidentals render correctly via `note.addModifier(new Accidental('#'), 0)` |
| pitchy | existing | McLeod Pitch Method pitch detection | `frequencyToNote()` already returns sharped notes (`C#4`, `F#3`, etc.) from MIDI math via the `NOTE_NAMES` array which includes all 12 chromatic tones |
| Klavier | existing | Keyboard input | Already handles all 88 piano keys including black keys |
| Supabase | existing | Database + RLS | `is_free_node()` Postgres function and `subscriptionConfig.js` both need updating for the ~20 new premium nodes |

### Supporting Libraries

No additions required. All supporting infrastructure is present:

| Library | Version | Status | Notes |
|---------|---------|--------|-------|
| `NOTE_AUDIO_LOADERS` (internal) | — | Complete | All accidental WAV samples already registered: `Db4`, `Eb4`, `Gb4`, `Ab4`, `Bb4`, `C#4`, `D#4`, `F#4`, `G#4`, `A#4` etc. — see `NotesRecognitionGame.jsx` lines 42–128 |
| `TREBLE_IMAGE_MAP` / bass equivalents | — | Complete | All accidental SVG note images already imported: flat series (`Db4`, `Eb4`, `Gb4`, `Ab4`, `Bb4`), sharp series (`C#4`, `D#4`, `F#4`, `G#4`, `A#4`) — see `gameSettings.js` lines 44–225 |
| `withAccidentals()` (internal) | — | Complete | `noteDefinitions.js` already generates full accidental variants for every natural note in both treble and bass clef ranges |
| `staffPositions.js` | — | No gap | Accidentals share the staff line/space of their base natural note — musically correct, no separate Y-coordinate data needed |

---

## New Capabilities vs. Existing

### What Already Works (no code changes needed)

**VexFlow accidental rendering** — `VexFlowStaffDisplay.jsx` already handles this path:
```javascript
// parsePitchForVexflow already parses "F#4" -> key:"f/4", accidental:"#"
const match = raw.match(/^([A-Ga-g])([#b]?)(\d)$/);
const accidental = accidentalRaw === "#" ? "#" : accidentalRaw === "b" ? "b" : null;
// note.addModifier(new Accidental(parsedPitch.accidental), 0) called when accidental present
```
This is live and tested for the free-play sight reading game.

**Mic pitch detection for accidentals** — `usePitchDetection.js` returns chromatic names:
```javascript
export const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
// frequencyToNote() returns "C#4", "F#3" etc. — sharps only, no flats
```
The detection pipeline already handles black keys. Enharmonic comparison (detecting `C#4` when the score shows `Db4`) is handled in `NotesRecognitionGame.jsx` via `toFlatEnharmonic()`.

**Audio samples for accidentals** — All flat variants already loaded as `Db`, `Eb`, `Gb`, `Ab`, `Bb` files. Sharp-to-flat audio routing already implemented via `toFlatEnharmonic()`.

**Note image SVGs for accidentals** — Complete flat and sharp SVG sets already exist and are imported in `gameSettings.js` for both treble and bass clefs.

**Note definitions infrastructure** — `withAccidentals()` already generates `C#4`, `Cb4`, `Db4`, etc. from any natural note array. New trail nodes can use pitch strings like `'F#4'`, `'Bb3'` directly in `notePool`.

---

## What DOES Need Changes

### 1. PatternBuilder accidental pitch gap — HIGH PRIORITY

The `toVexFlowNote()` function in `patternBuilder.js` only matches natural notes:
```javascript
// Line 60 — gap: does not match "F#4", "Bb3" etc.
const pitchMatch = obj.pitch.match(/^([A-G])(\d+)$/);
```
This regex excludes the `#` and `b` character between the letter and octave. If an accidental pitch is passed to `generatePatternData()` (as will happen with sight reading exercises using accidental note pools), it silently falls through to the `c/4` fallback. The `inferClefForPitch()` function on line 29 has the same gap.

**Fix required:** Change both regexes from `/^([A-G])(\d+)$/` to `/^([A-G][#b]?)(\d+)$/` and ensure the VexFlow key string correctly places only the letter before the slash (e.g., `'f/4'` not `'f#/4'`) and passes the accidental separately via `addModifier`. Cross-check against how `VexFlowStaffDisplay.jsx` already handles this correctly.

**Scope impact:** This gap does NOT affect `NOTE_RECOGNITION` or `MEMORY_GAME` exercises — those use the SVG image path, not VexFlow pattern generation. Only `SIGHT_READING` exercises are affected. `NOTE_RECOGNITION`-only nodes are safe to add without fixing this first.

### 2. Trail unit data files — the bulk of the work

New files needed in `src/data/units/`:
- `trebleUnit4Redesigned.js` — Sharps & Flats, treble clef (~10 nodes + boss)
- `bassUnit4Redesigned.js` — Sharps & Flats, bass clef (~10 nodes + boss)

Use the exact same structure as existing unit files. Key fields for accidental nodes:
```javascript
{
  id: 'treble_4_1',
  category: 'treble_clef',
  unit: 4,
  prerequisites: ['boss_treble_3'],
  noteConfig: {
    notePool: ['F4', 'F#4'],    // Pitch strings must match NOTE_AUDIO_LOADERS keys exactly
    accidentals: true           // Informational only — not enforced at runtime
  },
  exercises: [{
    type: EXERCISE_TYPES.NOTE_RECOGNITION,
    config: { notePool: ['F4', 'F#4'], questionCount: 10, clef: 'treble' }
  }]
}
```

**Pitch string convention:** Use `'F#4'` (sharp) and `'Bb4'` (flat). These match `NOTE_AUDIO_LOADERS` keys exactly. Do NOT use `'F♯4'` or `'B♭4'` (Unicode symbols) — those are display-only in Hebrew note labels, not accepted by the audio system or VexFlow parser.

**Note ordering for pedagogical scaffolding:** Introduce one accidental at a time. Recommended treble sequence: F#4 (easy staff position recognition), C#4/Db4 pair (enharmonic concept), Bb4, Eb4, Ab4, Gb4. Boss node should test 3-4 accidentals mixed with naturals.

### 3. `src/data/expandedNodes.js` — two import additions

```javascript
import trebleUnit4Nodes from './units/trebleUnit4Redesigned.js';
import bassUnit4Nodes from './units/bassUnit4Redesigned.js';
```
Add to the `EXPANDED_NODES` spread array.

### 4. `src/config/subscriptionConfig.js` — no new free nodes

All ~20 new sharps & flats nodes are premium-only per the milestone spec. No IDs are added to `FREE_NODE_IDS`. The `is_free_node()` Postgres function already excludes anything not in the allowlist by design — no migration needed.

### 5. Build validation — automatic

The existing `scripts/validateTrail.mjs` validator runs at build time via `npm run verify:patterns`. It will automatically catch prerequisite cycles and invalid node types for the new units. No script changes required.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Extend existing unit files (trebleUnit4, bassUnit4) | Add accidentals to Unit 3 nodes | Breaks the pedagogy pattern; Unit 3 is the "full octave" milestone; accidentals are a distinct conceptual unit |
| Use `#`/`b` suffix pitch strings (`F#4`, `Bb4`) | Add accidentals field to node config as a separate list | Redundant — the notePool already carries all needed information; separate list creates a sync risk |
| Fix patternBuilder regex before adding SIGHT_READING exercises | Skip fixing and only use NOTE_RECOGNITION in new nodes | Only fixing is correct long-term; skipping creates a silent rendering failure that is hard to debug later |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New audio sample library | All chromatic WAV files already present up to C7 | Existing `NOTE_AUDIO_LOADERS` in `NotesRecognitionGame.jsx` |
| New SVG note images | Full accidental set already imported in `gameSettings.js` | Existing `TREBLE_IMAGE_MAP` / `BASS_IMAGE_MAP` entries |
| Key signature rendering in VexFlow | Unnecessary for note-by-note recognition exercises; key sigs are Unit 5 territory | Per-note `Accidental` modifier already in place |
| Natural sign (♮) notation | Accidentals introduced one at a time; no context where a natural cancellation arises within a node | Defer to Key Signatures milestone |
| New Postgres columns for accidental tracking | Node progress is already tracked generically by `node_id` | Existing `student_skill_progress` table |
| Double sharps (`##`) or double flats (`bb`) | Not appropriate for beginner level | Defer indefinitely |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| VexFlow accidental rendering | HIGH | Verified working code in `VexFlowStaffDisplay.jsx` lines 446–485 |
| Mic detection with accidentals | HIGH | `NOTE_NAMES` array and `frequencyToNote()` verified in `usePitchDetection.js` |
| Audio samples completeness | HIGH | All `Db`/`Eb`/`Gb`/`Ab`/`Bb` and `D#`/`E#`/`F#`/`G#`/`A#` entries verified in `NOTE_AUDIO_LOADERS` |
| SVG image completeness | HIGH | All accidental SVGs verified imported in `gameSettings.js` |
| patternBuilder gap | HIGH | Confirmed by direct regex inspection, line 60 |
| No new libraries needed | HIGH | Infrastructure survey complete across all 4 game modes |

---

## Sources

- `VexFlowStaffDisplay.jsx` lines 446–485 — accidental rendering via `Accidental` modifier
- `usePitchDetection.js` lines 25–38, 59–66 — chromatic `NOTE_NAMES`, `frequencyToNote()`
- `NotesRecognitionGame.jsx` lines 42–195 — complete WAV loader map, `toFlatEnharmonic()`, `normalizePitchKey()`
- `gameSettings.js` lines 44–225 — complete SVG import map for all accidentals, treble and bass
- `noteDefinitions.js` lines 1–34 — `withAccidentals()` function
- `patternBuilder.js` line 60 — confirmed gap in accidental regex
- `subscriptionConfig.js` — premium gate logic verified
- VexFlow v5 `Accidental` class — valid codes `'#'`, `'b'`, `'n'`, `'bb'`, `'##'` verified against existing working code in codebase

---
*Stack research for: v2.2 Sharps & Flats content expansion*
*Researched: 2026-03-15*
