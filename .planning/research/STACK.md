# Technology Stack: v3.2 Rhythm Trail Rework

**Project:** PianoApp2 (PianoMaster)
**Researched:** 2026-04-06
**Milestone:** v3.2 — Curated rhythm pattern database + pedagogically sound difficulty curve
**Overall confidence:** HIGH

---

## What This Document Covers

Only NEW or CHANGED capabilities required by v3.2. The following are confirmed working and must NOT be re-researched or re-added:

- React 18, Vite 6, React Router v7
- Supabase (auth, database, RLS)
- VexFlow v5 — SVG rhythm notation (`RhythmStaffDisplay.jsx`, `rhythmVexflowHelpers.js`)
- Web Audio API — `useAudioEngine`, `AudioContextProvider`, `useSounds`
- `smplr` — piano instrument samples
- `RhythmPatternGenerator.js` — `HybridPatternService` with `loadPatterns()`, `generatePattern()`, `getCuratedPattern()`, binary pattern format (array of 0/1 per sixteenth-note slot)
- Existing pattern JSON files: `public/data/4-4.json`, `public/data/3-4.json`, `public/data/6-8.json`
- 4 rhythm game components: `MetronomeTrainer`, `RhythmReadingGame`, `RhythmDictationGame`, `ArcadeRhythmGame`
- 50 rhythm trail nodes across 8 units in `src/data/units/rhythmUnit*Redesigned.js`
- `rhythmScoringUtils.js` — `scoreTap()` pure function with PERFECT/GOOD/MISS thresholds
- `validateTrail.mjs` — pre-build validation for trail node integrity
- Tailwind CSS 3, i18next (EN/HE), `framer-motion` v12, `lucide-react`

---

## Core Finding: No New npm Dependencies Needed

The existing stack is sufficient for the v3.2 rework. The gap is NOT missing libraries — it is missing **curated data** and **missing structural conventions** in the existing data layer.

Every component needed for a structured, pedagogically sound rhythm system already exists:

- Pattern data format: the JSON schema in `public/data/4-4.json` (`{ duration, note: boolean }` objects) is correct and already consumed by `HybridPatternService.getCuratedPattern()`
- Complexity scoring: `calculatePatternComplexity()` is already exported from `RhythmPatternGenerator.js`
- Tempo progression: the `tempo: { min, max, default }` field already exists on every `rhythmConfig` in node files
- VexFlow rendering: `RhythmStaffDisplay.jsx` already converts the binary pattern to notation
- Game routing: all 4 rhythm exercise types are wired end-to-end

What's missing is the **content**: the node files specify `rhythmPatterns: ['quarter', 'half']` (name arrays) but the curated JSON files do not contain per-node pattern sets — they contain flat per-difficulty lists that the generator draws from randomly. There is no mechanism to assign a specific hand-crafted pattern set to a specific node.

---

## Recommended Stack Additions

### None — zero new npm packages required.

Rationale for each category investigated:

---

## Pattern Authoring Format: Extend Existing JSON Schema (No New Library)

**Decision:** Extend the existing `public/data/4-4.json` schema. No new format (ABC, MusicXML, LilyPond) needed.

**Why the existing schema is the right choice:**

The current format — an array of `{ duration: string, note: boolean }` objects — is already:

- Consumed by `HybridPatternService.validatePattern()` and `convertSchemaToBinary()`
- Rendered correctly by `RhythmStaffDisplay.jsx` via `rhythmVexflowHelpers.js`
- Validated by `validatePatternDuration()` (measure-length check)
- Simple enough for a developer to author by hand without tooling

ABC notation and MusicXML were evaluated. Both are designed for full multi-voice pieces with lyrics, key signatures, and clef information — far heavier than needed for single-measure rhythm cells. They would require a parsing library and a custom converter to binary format. Overhead is not justified.

**What to add to the schema:** A `nodePatterns` map, keyed by node ID, inside each time-signature file. This lets each node reference a named pattern set without touching any game component code.

**Proposed schema extension (illustrative, not a new library):**

```json
{
  "timeSignature": "4/4",
  "patterns": {
    "beginner": [...],
    "intermediate": [...],
    "advanced": [...]
  },
  "nodePatterns": {
    "rhythm_1_1": [
      [
        { "duration": "quarter", "note": true },
        { "duration": "quarter", "note": true },
        { "duration": "quarter", "note": true },
        { "duration": "quarter", "note": true }
      ]
    ],
    "rhythm_1_2": [
      [
        { "duration": "quarter", "note": true },
        { "duration": "quarter", "note": false },
        { "duration": "quarter", "note": true },
        { "duration": "quarter", "note": false }
      ]
    ]
  },
  "metadata": { "version": "2.0" }
}
```

`HybridPatternService.getCuratedPattern()` gains an optional `nodeId` parameter. When provided, it looks up `nodePatterns[nodeId]` before falling back to the flat `patterns[difficulty]` array. No breaking changes to any game component.

---

## Rhythm Complexity Scoring: Existing `calculatePatternComplexity()` is Sufficient

**Decision:** Extend the existing function rather than adopting an external library.

**Why:**

`calculatePatternComplexity()` already computes a 0–10 score from density and syncopation. For v3.2's purpose — verifying that a pattern authored for a beginner node is not accidentally more complex than an intermediate node — this is sufficient.

The academic literature on rhythm complexity (Toussaint, Thul/Godfrey McGill thesis, Musiplectics) defines complexity as a function of: note density, syncopation (events on metrically weak positions), interval variance between onset times, and Lempel-Ziv compression ratio. The existing implementation covers the two highest-impact factors (density + syncopation).

If automated complexity gating during pattern authoring is desired, add one validation step to `validateTrail.mjs` that calls `calculatePatternComplexity()` on each node's patterns and asserts the score falls within bounds appropriate to the node's `difficulty` field. This is a pure JavaScript addition, no library needed.

**Confidence:** HIGH — the complexity algorithm is domain logic, not a dependency problem.

---

## Music Education Data Model: Augment Existing Node Schema (No New Library)

**Decision:** Add three fields to `rhythmConfig` in the unit files. No external data model library needed.

**Why:**

The Kodaly/Orff pedagogical research (HIGH confidence, based on decades of classroom practice) establishes that rhythm progression for 8-year-olds should follow:

1. Quarter notes first ("ta") — steady pulse, walking speed
2. Paired eighth notes ("ti-ti") — running speed, introduced only after quarter mastery
3. Half notes — holding, requires counting through silence
4. Quarter rest — explicit silence awareness (harder than note rests for children)
5. Dotted patterns — taught as a feeling before notation
6. Syncopation — last, requires internalized beat grid

The existing node files already honor this sequence. The gap is that `rhythmConfig` lacks two fields that the game components need to implement curated behavior:

```javascript
rhythmConfig: {
  // Existing fields (keep as-is):
  complexity: RHYTHM_COMPLEXITY.SIMPLE,
  durations: ['q'],
  tempo: { min: 60, max: 70, default: 65 },
  timeSignature: '4/4',

  // NEW fields for v3.2:
  curatedPatternIds: ['rhythm_1_1'],  // References nodePatterns key in JSON file
  tempoRamp: 'fixed',                 // 'fixed' | 'progressive' | 'unlocked'
  //   fixed = always use tempo.default (beginner nodes)
  //   progressive = start at tempo.min, unlock to tempo.max after 3-star score
  //   unlocked = player-controlled (free play / speed round nodes)
}
```

The `curatedPatternIds` field is the bridge between node data and the extended JSON schema above. It replaces the current `rhythmPatterns: ['quarter', 'half']` name-array approach (which only constrained generative logic) with direct lookup of hand-authored patterns.

**Confidence:** HIGH — this is a data-layer refactor with no external surface area.

---

## Tempo Progression: No Library Needed

**Decision:** Express tempo progression as data on the node, not as an algorithmic library.

**Why:**

Evaluated whether a BPM-curve library (e.g. Tone.js `Transport.rampTo()`) would be useful. It would not: the tempo in rhythm games is set once at exercise start and held constant for the duration. The `useAudioEngine` beat scheduler already reads a BPM value and schedules beats ahead with a lookahead buffer. What's needed is a rule for which BPM to use per play-through, which is a three-state enum (`fixed`, `progressive`, `unlocked`) on the node, not a runtime animation.

Tone.js itself was evaluated as a wholesale replacement for `useAudioEngine`. Rejected. The existing scheduler is already battle-tested on iOS (a known Tone.js pain point), handles AudioContext interruption recovery, and has no additional bundle cost. Tone.js would add ~40kB gzipped for capabilities already built.

**Confidence:** HIGH — Tone.js integration was validated as unnecessary in v1.7 when the custom scheduler was built.

---

## Pattern Validation at Build Time: Extend `validateTrail.mjs` (No New Library)

**Decision:** Add rhythm pattern validation to the existing pre-build script.

**What to add:**

1. For each rhythm node, if `curatedPatternIds` is set, verify that each ID exists in the corresponding time-signature JSON file's `nodePatterns` map.
2. For each hand-authored pattern in `nodePatterns`, call `validatePatternDuration()` to assert measure-length correctness.
3. For each node, call `calculatePatternComplexity()` on its patterns and assert the score is within bounds for its declared `difficulty`:
   - `beginner`: complexity ≤ 3.5
   - `intermediate`: complexity ≤ 6.0
   - `advanced`: complexity ≤ 10.0

This catches authoring errors at `npm run build` time, consistent with how prerequisite cycles and invalid node types are caught today.

**Confidence:** HIGH — follows existing validation architecture exactly.

---

## Alternatives Considered and Rejected

| Category           | Considered                  | Decision                  | Reason Rejected                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pattern format     | ABC notation                | Rejected                  | Parser overhead; single-measure cells need none of ABC's multi-voice/lyrics features                                                                                                                                                                                                                                                                              |
| Pattern format     | MusicXML                    | Rejected                  | Heavy XML schema; no JS parser with VexFlow output that doesn't duplicate what `rhythmVexflowHelpers.js` already does                                                                                                                                                                                                                                             |
| Complexity scoring | `@tonaljs/rhythm-pattern`   | Rejected (for complexity) | Its `euclid()`, `binary()`, `hex()` methods generate patterns; they don't score complexity. `RhythmPattern.onsets()` counts density but not syncopation. The existing `calculatePatternComplexity()` is equivalent and zero-dependency.                                                                                                                           |
| Duration utilities | `@tonaljs/duration-value`   | Rejected                  | Already have `DURATION_CONSTANTS` in `RhythmPatternGenerator.js` with the same mapping. Adding a 4kB package to replace a 10-line constant object is unnecessary.                                                                                                                                                                                                 |
| Tempo scheduling   | Tone.js                     | Rejected                  | `useAudioEngine` already handles iOS-safe scheduling with lookahead; Tone.js ~40kB gzipped for no net capability gain                                                                                                                                                                                                                                             |
| Tempo scheduling   | `@tonaljs/time-signature`   | Rejected                  | Time signature parsing is already handled by `TIME_SIGNATURES` constants in `RhythmPatternGenerator.js`                                                                                                                                                                                                                                                           |
| Schema validation  | Zod                         | Considered                | Would be useful for runtime validation of the extended JSON schema in dev. However, the existing `validatePatternDatabase()` in `HybridPatternService` already validates structure at load time. Adding Zod is low-priority; the build-time validator in `validateTrail.mjs` catches authoring errors before deploy. Revisit if the pattern authoring team grows. |
| Data model         | External music education DB | N/A                       | There is no npm package for a curated elementary rhythm exercise database. This content must be hand-authored by the developer using Kodaly/Orff pedagogical principles.                                                                                                                                                                                          |

---

## What `@tonaljs/rhythm-pattern` Is Useful For (If Needed Later)

The library is worth knowing about for one specific future use case: **Euclidean rhythm generation** for procedural "Endless Practice" mode (listed as a future candidate in PROJECT.md). `RhythmPattern.euclid(steps, beats)` distributes `beats` evenly across `steps` positions — a musically coherent generative technique validated in ethnomusicology (Toussaint 2005). If/when procedural infinite content is built, import this package then.

- Package: `@tonaljs/rhythm-pattern`
- Version: part of `tonal` monorepo, currently `tonal@6.4.3` (last published ~3 months before research date)
- Install: `npm install @tonaljs/rhythm-pattern`
- Integration: its binary array output is directly compatible with the existing binary pattern format

**Do not add this now.** v3.2 is about curated content, not generative content.

---

## Implementation Checklist for v3.2 (No New Dependencies)

1. **Extend JSON pattern files** — add `nodePatterns` map to `public/data/4-4.json`, `3-4.json`, `6-8.json`
2. **Author patterns** — hand-craft 3–8 patterns per rhythm node following Kodaly progression (quarter → eighth pairs → half → rests → dotted → syncopation)
3. **Update `HybridPatternService`** — add `nodeId` optional parameter to `getCuratedPattern()`; resolve from `nodePatterns[nodeId]` when present
4. **Update node files** — replace `rhythmPatterns: ['quarter', 'half']` with `curatedPatternIds: ['rhythm_1_1']` and add `tempoRamp` field
5. **Update game components** — pass `nodeId` from `location.state` into `getPattern()` calls (already flows through as part of trail state)
6. **Extend `validateTrail.mjs`** — validate `curatedPatternIds` references exist and patterns pass complexity bounds
7. **Rename game UI labels** — "MetronomeTrainer" → child-friendly name (e.g. "Keep the Beat") in i18n locale files only; no component rename needed

---

## Sources

- `RhythmPatternGenerator.js` (direct code read) — pattern format, `HybridPatternService`, `calculatePatternComplexity()` confirmed
- `public/data/4-4.json` (direct code read) — existing pattern schema confirmed, `nodePatterns` map absent
- `src/data/units/rhythmUnit1Redesigned.js` through `rhythmUnit8Redesigned.js` (direct code read) — 50 node structure, `rhythmConfig` shape confirmed
- `src/data/nodeTypes.js` (direct code read) — `RHYTHM_COMPLEXITY` enum confirmed
- [tonaljs/tonal GitHub README](https://github.com/tonaljs/tonal/blob/main/README.md) — packages confirmed: `@tonaljs/rhythm-pattern`, `@tonaljs/duration-value`, `@tonaljs/time-signature`
- [@tonaljs/rhythm-pattern README](https://github.com/tonaljs/tonal/blob/main/packages/rhythm-pattern/README.md) — `euclid()`, `binary()`, `onsets()`, `random()`, `probability()`, `rotate()` confirmed; Toussaint Euclidean reference confirmed
- [@tonaljs/duration-value README](https://github.com/tonaljs/tonal/blob/main/packages/duration-value/README.md) — duration names, shorthand codes confirmed (MEDIUM — WebFetch summary, not raw file)
- [WebSearch: tonal npm](https://www.npmjs.com/package/tonal) — version 6.4.3 confirmed (MEDIUM — from search result snippet)
- [Kodaly method Wikipedia](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method) — ta/ti-ti syllable sequence, quarter-first progression confirmed (HIGH — established pedagogical record)
- [Plum Rose Publishing: Kodaly vs Orff rhythm syllables](https://plumrosepublishing.com/kodaly-versus-orff-rhythm-syllable-system/) — syllable system comparison (MEDIUM)
- [McGill thesis: Measuring Complexity of Musical Rhythm](https://cgm.cs.mcgill.ca/~godfried/teaching/mir-reading-assignments/Eric-Thul-Thesis.pdf) — density + syncopation as dominant complexity factors (HIGH — academic primary source)
- [Musiplectics paper](https://people.cs.vt.edu/tilevich/papers/musiplectics.pdf) — computational complexity model (HIGH — peer-reviewed)
- [Midnight Music: Top 11 Rhythm Reading Apps 2024](https://midnightmusic.com/2024/05/top-11-rhythm-reading-apps-for-music-teachers/) — competitive landscape for rhythm apps (LOW — editorial, not primary)
- [Good Music Academy: How to Teach Kids to Read Rhythms](https://goodmusicacademy.com/how-to-teach-kids-to-read-rhythms/) — practical pedagogy for children (MEDIUM — practitioner-sourced)

---

_Stack research for: v3.2 Rhythm Trail Rework (curated patterns + pedagogy)_
_Researched: 2026-04-06_
