# Architecture Research

**Domain:** Curated rhythm pattern integration — progressive rhythm curriculum for 8-year-old piano learners
**Researched:** 2026-04-06
**Confidence:** HIGH (based on direct codebase analysis — no external research needed; all architecture decisions derive from existing code)

---

## Current Architecture Audit

### Data Flow Today (Existing)

```
TrailNodeModal
    ↓ navigate(route, { state: { nodeId, nodeConfig, exerciseIndex, ... } })
Game Component (RhythmReadingGame / MetronomeTrainer / RhythmDictationGame / ArcadeRhythmGame)
    ↓ nodeConfig?.rhythmPatterns  (string[] | null, e.g. ['quarter','eighth'])
    ↓ nodeConfig?.difficulty      (string: 'beginner' | 'intermediate' | 'advanced')
    ↓ nodeConfig?.timeSignature   (string: '4/4' | '3/4' | '2/4' | '6/8')
getPattern(timeSignature, difficulty, rhythmPatterns)   [async, RhythmPatternGenerator.js]
    ↓ if rhythmPatterns is null → try curated JSON (public/data/4-4.json etc.) → fallback to generative
    ↓ if rhythmPatterns is set  → skip curated, constrain generative to allowed subdivisions
    ↓ returns { pattern: number[] (binary, 16-slot for 4/4), source, ... }
binaryPatternToBeats(pattern)  [rhythmVexflowHelpers.js]
    ↓ returns [{ durationUnits: number, isRest: boolean }]
Game loop uses beats for VexFlow rendering + audio scheduling
```

### The Core Tension

The existing `rhythmPatterns` parameter (`['quarter', 'eighth']`) is a **duration allowlist** that constrains _generative_ logic. It completely bypasses the curated JSON database when present. The curated JSON (`public/data/4-4.json`) is organized by difficulty tier (beginner/intermediate/advanced) only — it has no concept of which _specific_ durations are in play or which pedagogical unit a node belongs to.

The result: trail nodes use constrained generation, not the curated library. The curated library is only used in free-play mode (no `rhythmPatterns`). This means pedagogy-controlled trail sessions and the curated pattern library are currently decoupled, which is the exact problem the rework needs to solve.

---

## Recommended Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (static, build-time)               │
├──────────────────────────────────────────────────────────────────┤
│  Unit Data Files         Pattern Library         JSON Fallback   │
│  rhythmUnitN.js          src/data/patterns/      public/data/    │
│  (node definitions)      rhythmPatterns.js        4-4.json etc.  │
│  exercise.config refs    (keyed by nodeId OR tag)  (free-play)   │
│  pattern IDs / tags      ─────────────────────                   │
│                          Each pattern has:                       │
│                          - id, tags[], durations[]               │
│                          - schema [{duration,note}]              │
│                          - complexity score (0-10)               │
│                          - timeSignature, pedagogicalPhase       │
└───────────────────────────────┬──────────────────────────────────┘
                                │ imported at module load (no fetch)
┌───────────────────────────────▼──────────────────────────────────┐
│                 SERVICE LAYER (RhythmPatternGenerator.js)        │
├──────────────────────────────────────────────────────────────────┤
│  getPattern(timeSignature, difficulty, options)                  │
│                                                                  │
│  options.patternIds[]   → look up exact patterns by ID          │
│  options.tags[]         → filter pattern library by tag         │
│  options.allowedDurations[] → constrain generative (existing)   │
│  options.source         → 'curated' | 'generated' | 'hybrid'    │
│  (null options)         → free-play: curated->generative        │
│                                                                  │
│  Generative fallback retained for free-play and edge cases      │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                    GAME COMPONENTS (consume patterns)            │
├──────────────────────────────────────────────────────────────────┤
│  MetronomeTrainer  RhythmReadingGame  RhythmDictationGame        │
│  ArcadeRhythmGame                                                │
│                                                                  │
│  All call getPattern(timeSig, difficulty, options)               │
│  All receive { pattern: number[], schemaPattern, source, ... }   │
│  binaryPatternToBeats() -> VexFlow + audio scheduling            │
└──────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component                             | Responsibility                                                            | Communicates With             |
| ------------------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| `rhythmUnitN.js`                      | Node definitions; references patterns by ID or tag                        | `expandedNodes.js` aggregator |
| `src/data/patterns/rhythmPatterns.js` | Central pattern library; tagged + scored data                             | `RhythmPatternGenerator.js`   |
| `RhythmPatternGenerator.js`           | Pattern resolution: curated lookup, tag-based filter, generative fallback | All 4 game components         |
| Game components                       | Consume patterns via `getPattern()`; render + score                       | VictoryScreen, AudioContext   |
| `TrailNodeModal.jsx`                  | Routes to games with `nodeConfig` from unit data files                    | All 4 game components         |

---

## Recommended Project Structure

```
src/
├── data/
│   ├── units/
│   │   ├── rhythmUnit1Redesigned.js     # (modified) exercise.config now references pattern IDs/tags
│   │   ├── rhythmUnit2Redesigned.js     # ...
│   │   └── ...
│   ├── patterns/
│   │   └── rhythmPatterns.js            # NEW: central JS pattern library (not JSON fetch)
│   ├── constants.js                     # no change
│   └── nodeTypes.js                     # no change
├── components/games/rhythm-games/
│   ├── RhythmPatternGenerator.js        # (modified) new resolution path for patternIds + tags
│   ├── RhythmReadingGame.jsx            # (modified) options object instead of rhythmPatterns[]
│   ├── RhythmDictationGame.jsx          # (modified) same
│   ├── MetronomeTrainer.jsx             # (modified) same
│   ├── ArcadeRhythmGame.jsx             # (modified) same
│   └── utils/
│       ├── rhythmVexflowHelpers.js      # no change (binary->beats converter stays)
│       └── rhythmScoringUtils.js        # no change
public/data/
├── 4-4.json                             # retained for free-play backward compat
├── 3-4.json                             # retained
└── 6-8.json                             # retained
```

### Structure Rationale

- **`src/data/patterns/rhythmPatterns.js` (JS, not JSON fetch):** Moving patterns to a JS module eliminates the `async fetch` in `HybridPatternService.loadPatterns()`. This is the single biggest reliability improvement. The current JSON fetch can silently fail, causing a null fall-through to the generative path. A JS import fails loudly at build time. The public JSON files are retained only for free-play backward compatibility.

- **Unit files reference patterns by tag, not inline config:** `exercise.config.patternTags = ['quarter-only', 'steady-pulse']` instead of the current `rhythmPatterns: ['quarter']`. Tags are semantic (express musical intent) rather than structural (express duration constraints). This lets the library grow independently of unit file edits.

- **Generator stays as service boundary:** All 4 game components call `getPattern()`. This boundary is sound. The change is purely in what `getPattern()` does internally with the new options.

---

## Architectural Patterns

### Pattern 1: Tag-Based Pattern Selection (Recommended for Trail)

**What:** Each curated pattern has a `tags[]` array (`['quarter-only', 'steady-pulse', 'beginner']`). Trail nodes reference tags in their exercise config. `getPattern()` filters the library by matching tags, then picks randomly within that filtered set.

**When to use:** Trail nodes where the curriculum intent is "show patterns from this pedagogical category" rather than "show this exact pattern."

**Trade-offs:** Tags add indirection but decouple unit files from pattern authoring. A pattern author can add 10 new `'quarter-only'` patterns without touching any unit file.

```javascript
// In rhythmUnit1Redesigned.js — exercise config
exercises: [{
  type: EXERCISE_TYPES.RHYTHM_TAP,
  config: {
    patternTags: ['quarter-only', 'no-rests'],  // NEW field
    tempo: 65,
    timeSignature: '4/4',
    difficulty: 'beginner'
  }
}]

// In rhythmPatterns.js — pattern definition
{
  id: 'q4-solid',
  tags: ['quarter-only', 'no-rests', 'beginner'],
  timeSignature: '4/4',
  durations: ['quarter'],
  complexityScore: 1.0,
  schema: [
    { duration: 'quarter', note: true },
    { duration: 'quarter', note: true },
    { duration: 'quarter', note: true },
    { duration: 'quarter', note: true }
  ]
}

// In RhythmPatternGenerator.js — resolution
async function getPattern(timeSignature, difficulty, options = {}) {
  if (options.patternTags) {
    return resolveByTags(options.patternTags, timeSignature, difficulty);
  }
  if (options.patternIds) {
    return resolveByIds(options.patternIds);
  }
  // existing free-play path: try JSON fetch, fallback to generative
}
```

### Pattern 2: Explicit Pattern IDs for Boss/Assessment Nodes

**What:** For boss nodes and mini-boss checkpoints, reference specific pattern IDs directly. This guarantees the child encounters the exact patterns the curriculum intends for assessment.

**When to use:** Boss nodes, review nodes, and any node where predictability is pedagogically critical.

**Trade-offs:** Brittle — deleting a pattern ID breaks a node. Mitigated by the prebuild validator (`validateTrail.mjs`) which should be extended to verify pattern ID existence.

```javascript
// In boss node exercise config
config: {
  patternIds: ['q-half-mix-01', 'q-half-mix-03', 'eighth-synco-07'],
  tempo: 80,
  timeSignature: '4/4',
  difficulty: 'intermediate'
}
```

### Pattern 3: Complexity Score as First-Class Field

**What:** Each pattern has a computed `complexityScore` (0-10) using the existing `calculatePatternComplexity()` function from `RhythmPatternGenerator.js`. Store this pre-computed in the library. Unit data files can optionally add `complexityRange: [min, max]` to the exercise config as an additional filter.

**When to use:** When you want to ensure a pedagogical node stays within a complexity band without handpicking IDs.

**Trade-offs:** Adds one more filter dimension. Keep it optional — most nodes will use tags alone.

### Pattern 4: Generative System as Fallback Only

**What:** The existing generative path in `RhythmPatternGenerator.js` is retained but demoted to fallback role. Trail nodes always resolve to curated patterns. Generative only activates when: (a) free-play mode (no trail config), or (b) tag/ID resolution returns zero results.

**When to use:** This is the default after rework. Do not remove the generative system — it provides resilience and is still valuable for infinite free-play variety.

**Trade-offs:** The generative code produces musically correct but pedagogically unsituated patterns. For an 8-year-old curriculum, that is a bug in trail context, not a feature.

---

## Data Model for Pattern Library

### Pattern Schema (JS object in `rhythmPatterns.js`)

```javascript
{
  id: 'q4-solid',                   // unique string, stable reference for IDs
  tags: ['quarter-only', 'no-rests', 'beginner'],  // semantic curriculum tags
  timeSignature: '4/4',
  durations: ['quarter'],           // normalized list of duration names present
  complexityScore: 1.0,             // pre-computed via calculatePatternComplexity()
  pedagogicalPhase: 1,              // optional: maps to unit number for ordering
  schema: [                         // same schema as 4-4.json patterns
    { duration: 'quarter', note: true },
    { duration: 'quarter', note: true },
    { duration: 'quarter', note: true },
    { duration: 'quarter', note: true }
  ]
}
```

### Recommended Tag Vocabulary (starter set)

| Tag                                      | Meaning                           |
| ---------------------------------------- | --------------------------------- |
| `quarter-only`                           | Contains only quarter notes/rests |
| `half-only`                              | Contains only half notes/rests    |
| `quarter-half`                           | Quarters and halves mixed         |
| `eighth-present`                         | Contains eighth notes             |
| `sixteenth-present`                      | Contains sixteenth notes          |
| `dotted-present`                         | Contains dotted notes             |
| `syncopation`                            | Has off-beat attacks              |
| `no-rests`                               | All beats are notes               |
| `rests-present`                          | Has rest beats                    |
| `steady-pulse`                           | All same duration (pure pulse)    |
| `compound-68`                            | Is a 6/8 pattern                  |
| `beginner` / `intermediate` / `advanced` | Difficulty alignment              |

Tags are additive — a pattern can have multiple. Node configs request an intersection (all listed tags must match) or union (any tag matches) — a one-line filter policy in the generator. Recommend intersection as the default; it is stricter and catches mismatches early.

---

## Data Flow After Rework

### Trail Exercise Flow

```
Unit file exercise.config
  { patternTags: ['quarter-only'], tempo: 65, timeSignature: '4/4', difficulty: 'beginner' }
      |
TrailNodeModal.navigateToExercise()
  navState = { nodeId, nodeConfig: exercise.config, exerciseIndex, ... }
      |
Game Component (e.g. RhythmReadingGame)
  options = { patternTags: nodeConfig.patternTags ?? null }
      |
getPattern('4/4', 'beginner', { patternTags: ['quarter-only'] })
  -> import rhythmPatterns from 'src/data/patterns/rhythmPatterns.js'  (synchronous)
  -> filter by tags + timeSignature
  -> pick random from filtered set
  -> convertSchemaToBinary(selectedPattern)
  -> returns { pattern: number[], schemaPattern, source: 'curated', ... }
      |
binaryPatternToBeats(pattern)
      |
VexFlow rendering + audio scheduling (unchanged)
```

### Free-Play Flow (unchanged)

```
Game Component (no nodeConfig from trail)
  options = null / {}
      |
getPattern('4/4', 'beginner', null)
  -> try fetch public/data/4-4.json   (existing async path)
  -> fallback to generative if fetch fails
  -> returns pattern
```

---

## Integration Points

### Modified Components

| Component                            | Change Type | What Changes                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RhythmPatternGenerator.js`          | Modified    | Add `resolveByTags()` and `resolveByIds()` methods; import `rhythmPatterns.js`; existing `getPattern()` signature kept, third arg extended to accept options object (string array still accepted for backward compat with free-play callers passing null) |
| `rhythmUnit1-8Redesigned.js` (all 8) | Modified    | `exercise.config.rhythmPatterns` replaced with `exercise.config.patternTags` (or `patternIds` for boss nodes)                                                                                                                                             |
| `RhythmReadingGame.jsx`              | Modified    | Reads `nodeConfig.patternTags` / `nodeConfig.patternIds`; constructs options object for `getPattern()`                                                                                                                                                    |
| `MetronomeTrainer.jsx`               | Modified    | Same                                                                                                                                                                                                                                                      |
| `RhythmDictationGame.jsx`            | Modified    | Same                                                                                                                                                                                                                                                      |
| `ArcadeRhythmGame.jsx`               | Modified    | Same                                                                                                                                                                                                                                                      |
| `scripts/validateTrail.mjs`          | Modified    | Add pattern ID existence check when `patternIds` field present; warn on tags that match zero patterns                                                                                                                                                     |

### New Components

| Component                             | Type          | Purpose                                                               |
| ------------------------------------- | ------------- | --------------------------------------------------------------------- |
| `src/data/patterns/rhythmPatterns.js` | New data file | Central curated pattern library — synchronous JS module, Vite-bundled |

### No-Change Components

| Component                      | Why No Change Needed                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `TrailNodeModal.jsx`           | Passes `exercise.config` as-is; adding new fields to config is transparent to routing logic |
| `binaryPatternToBeats()`       | Consumes binary arrays; generator still outputs binary regardless of resolution path        |
| `rhythmVexflowHelpers.js`      | No change to binary-to-beats logic                                                          |
| `rhythmScoringUtils.js`        | Scores against beat times; pattern source is irrelevant                                     |
| `VictoryScreen.jsx`            | No dependency on pattern source                                                             |
| All non-rhythm game components | Completely unaffected                                                                       |
| `public/data/*.json`           | Retained for free-play; not removed                                                         |
| Supabase schema                | Zero DB changes needed — all changes are frontend data layer                                |

---

## Build Order for Refactoring

Order matters — later steps depend on earlier ones.

### Step 1: Build the Pattern Library (additive, no risk)

Create `src/data/patterns/rhythmPatterns.js`. This is a pure addition — no existing code references it yet. Port the patterns from `public/data/4-4.json`, `3-4.json`, and `6-8.json` into the JS module, adding `id`, `tags[]`, `complexityScore`, and `pedagogicalPhase` to each. Use `calculatePatternComplexity()` from the existing generator to pre-compute scores.

Verification: The file is a plain JS module — importable by Node.js for the validator without Vite. Write a unit test asserting all patterns have required fields and no duplicate IDs.

### Step 2: Extend RhythmPatternGenerator (backward compatible)

Add `resolveByTags()` and `resolveByIds()` as methods on `HybridPatternService`. Extend `getPattern()` to accept either a string array (existing compat) or an options object as the third argument. Options object keys: `patternTags`, `patternIds`, `allowedDurations` (maps to old `allowedPatterns`).

Existing callers passing `null` or a string array still work. The options object is additive.

Verification: All existing tests pass unchanged. New tests cover tag-resolution and ID-resolution paths with known fixtures.

### Step 3: Update Unit Data Files (systematic, unit-by-unit)

Replace `rhythmPatterns: ['quarter']` style configs with `patternTags: ['quarter-only']` across all 8 unit files. Do one unit at a time. Boss nodes switch to `patternIds` pointing to specific curated patterns.

Verification: Extend prebuild validator to catch unknown `patternIds`. Manual review of each unit's tags against available tags in the library.

### Step 4: Update Game Components (mechanical find-replace)

Replace `nodeConfig?.rhythmPatterns` with options object construction in all 4 game components. Each component changes approximately 3 lines: the variable read and the `getPattern()` call.

Verification: Play through each game type from a trail node (tags path) and free-play (null path). Both must produce valid patterns.

### Step 5: Validator Hardening

Extend `scripts/validateTrail.mjs` to: import the pattern library, verify all `patternIds` in unit files exist in the library, warn if a node's `patternTags` match zero patterns (would silently fall to generative).

---

## Anti-Patterns

### Anti-Pattern 1: Embedding Patterns Inline in Unit Files

**What people do:** Put full `schema: [...]` pattern arrays directly in each node's `exercise.config`.

**Why it's wrong:** Patterns become non-reusable. The same pedagogically useful "quarter + rest + quarter" pattern appears copy-pasted across 12 nodes. Fixing it in one place requires hunting every occurrence. Pattern authoring and curriculum authoring collapse into a single task when they have different cadences.

**Do this instead:** Patterns live in the library; unit files reference by ID or tag.

### Anti-Pattern 2: Keeping rhythmPatterns as Duration Allowlist Only

**What people do:** Continue using `rhythmPatterns: ['quarter', 'eighth']` as the mechanism, and extend the generative system with more sophisticated duration-constrained generation.

**Why it's wrong:** Duration constraints produce structurally correct but musically arbitrary patterns. An 8-year-old encounters a different random pattern every session with no curriculum coherence. Tags express musical intent — "this node introduces dotted quarter notes, show patterns where dotted quarters are meaningful" — which generative duration constraints cannot express.

**Do this instead:** Tags in the library; generative system as fallback only.

### Anti-Pattern 3: Async JSON Fetch for Trail Patterns

**What people do:** Keep `HybridPatternService.loadPatterns()` fetch as the resolution path for trail nodes.

**Why it's wrong:** The fetch is async, fails silently on network unavailability, and in trail mode `rhythmPatterns` is always set, which currently bypasses the fetch entirely. Extending it would add complexity to a path that does not currently work for trail anyway. It also breaks offline PWA behavior.

**Do this instead:** Synchronous JS module import. Vite-bundled. Works offline. Fails at build time if invalid.

### Anti-Pattern 4: One JSON File Per Difficulty or Unit

**What people do:** Extend the existing JSON files with sub-categories like `beginner-unit1`, `beginner-unit2`.

**Why it's wrong:** JSON files are runtime-fetched. Adding curriculum structure to a fetch payload makes resolution stateful and async. The JSON format has no mechanism for tags or pedagogical metadata without a schema redesign. It also splits the pattern library across two formats (`src/data/` and `public/data/`) with no clear ownership rule.

**Do this instead:** All curriculum-linked patterns live in the JS module. Free-play patterns remain in JSON.

---

## Scaling Considerations

This is a static curriculum — not user-generated content. Scale concerns are authoring ergonomics, not user load.

| Scale                           | Architecture Adjustments                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 50-100 patterns (current scope) | Single `rhythmPatterns.js` file — flat array, filter by tag                                            |
| 200-500 patterns                | Split by time signature (`rhythmPatterns4-4.js`, `rhythmPatterns6-8.js`) to keep files under 200 lines |
| 500+ patterns                   | Build-time step generates a pattern index (IDs + tags only) as JSON; lazy-load full schema on demand   |

For this milestone, 50-100 patterns in one file is the correct scope.

---

## Sources

- Direct analysis: `src/components/games/rhythm-games/RhythmPatternGenerator.js` — full file
- Direct analysis: `public/data/4-4.json` — existing schema format
- Direct analysis: `src/components/games/rhythm-games/{RhythmReadingGame,ArcadeRhythmGame,RhythmDictationGame,MetronomeTrainer}.jsx` — `rhythmPatterns` consumption pattern confirmed via grep
- Direct analysis: `src/data/units/rhythmUnit{1-8}Redesigned.js` — `rhythmPatterns` field in exercise configs
- Direct analysis: `src/components/trail/TrailNodeModal.jsx` lines 181-248 — routing logic and nodeConfig pass-through
- Direct analysis: `src/data/constants.js` — EXERCISE_TYPES enum (all rhythm types confirmed)
- Direct analysis: `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — binary-to-beats pipeline (no change needed)

---

_Architecture research for: Rhythm trail rework — curated pattern integration_
_Researched: 2026-04-06_
