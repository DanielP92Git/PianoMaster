# Phase 22: Service Layer & Trail Wiring - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the curated pattern library into the rhythm trail as a coordinated change: add `resolveByTags()`/`resolveByIds()` to `RhythmPatternGenerator.js`, migrate all 48 rhythm node configs from `rhythmPatterns` duration allowlists to `patternTags`, fix game-type violations per the Phase 20 audit, deliver Unit 1 Node 1's pulse exercise, and extend the build validator to enforce pattern references and game-type policy.

</domain>

<decisions>
## Implementation Decisions

### Pulse exercise (CURR-05)

- **D-01:** Delivered via MetronomeTrainer with a `pulseOnly: true` config flag — when set, VexFlow notation is skipped entirely
- **D-02:** Visual: a large pulsing circle that pulses on each beat + a tap target area below (no sheet music)
- **D-03:** Scoring: same timing accuracy as MetronomeTrainer (PERFECT/GOOD/MISS per tap, star rating at end)
- **D-04:** Length: 8 beats (2 measures) at 65 BPM default — approximately 7 seconds
- **D-05:** Count-in: 1-bar count-in with visual beat numbers before tapping starts
- **D-06:** Audio: piano note (C4) plays on each beat instead of metronome click sound

### Pattern resolution API (PAT-03, PAT-04)

- **D-07:** `resolveByTags()` and `resolveByIds()` are added as new exports in the existing `RhythmPatternGenerator.js` file
- **D-08:** Game components receive full pattern objects (with `id`, `beats`, `tags`, `difficulty`, `measureCount`, etc.) — not stripped-down beats arrays
- **D-09:** Existing random generation logic in `RhythmPatternGenerator.js` stays as fallback — non-trail rhythm games (free practice) may still use it. Remove in a future cleanup phase.
- **D-10:** `resolveByTags()` returns the full pool of matching patterns. Game component picks randomly from the pool each session for variety. Pool is filtered by difficulty and measureCount.

### Node config migration (PAT-03, PAT-05)

- **D-11:** Old `rhythmPatterns` field is removed entirely from all 48 node exercise configs — clean break, no dual-field transition
- **D-12:** `durations`, `focusDurations`, and `contextDurations` in `rhythmConfig` are kept — they define the child's knowledge state (what's new, what's learned), not pattern selection
- **D-13:** Boss/mini-boss nodes use `patternTags` + difficulty filter (same field shape as regular nodes) — no `patternIds` needed. Boss challenge comes from `difficulty: 'advanced'` + longer `measureCount`
- **D-14:** Each exercise config explicitly includes `difficulty` and `measureCount` fields — self-documenting, game uses these to filter the pattern pool from the resolver
- **D-15:** Build validator (`validateTrail.mjs`) errors on any rhythm node that still has the old `rhythmPatterns` field — forces complete migration

### Game-type remediation (CURR-02, CURR-03, CURR-04)

- **D-16:** Phase 22 fixes game-type violations identified by the Phase 20 audit alongside pattern wiring — one coordinated change rather than two passes through the same files
- **D-17:** Build validator enforces nodeType → expected exercise type mapping (D-04 through D-11 from Phase 20 context) — prevents future regression
- **D-18:** Trail navigation switch (exercise type → game component routing) is verified to cover all exercise types used after remediation — missing cases are added

### Claude's Discretion

- Exact pulsing circle animation design (size, color, glow effects) — should feel engaging for 8-year-olds while respecting reduced-motion preferences
- Internal structure of `resolveByTags()` / `resolveByIds()` (filtering logic, caching strategy)
- Order of migration across the 8 unit files
- How game components adapt their rendering when receiving curated pattern objects vs legacy generated patterns

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Curriculum audit (Phase 20 output)

- `docs/curriculum-audit-v3.2.md` — Game-type policy (D-04 through D-11), one-concept rule, node tables with violations, remediation list. Phase 22 implements the remediation list.

### Pattern library (Phase 21 output)

- `src/data/patterns/rhythmPatterns.js` — Curated pattern library with ~120+ patterns, 15-tag taxonomy, `RHYTHM_PATTERNS` array, `PATTERN_TAGS` array, and helper lookup functions (`getPatternsByTag`, `getPatternById`, `getPatternsByTagAndDifficulty`)

### Rhythm game components

- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — Existing generator with `DURATION_CONSTANTS`, `TIME_SIGNATURES`, `DIFFICULTY_LEVELS`. Add `resolveByTags()`/`resolveByIds()` here.
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Echo/tap game. Add `pulseOnly` mode here.
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — Notation reading game (Discovery nodes)
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Hear-and-tap-back game (Mix-Up nodes)
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Scrolling arcade game (Speed/Boss nodes)

### Rhythm trail data (8 unit files to migrate)

- `src/data/units/rhythmUnit1Redesigned.js` — Unit 1: quarter notes, half notes (7 nodes)
- `src/data/units/rhythmUnit2Redesigned.js` — Unit 2: whole notes (6 nodes)
- `src/data/units/rhythmUnit3Redesigned.js` — Unit 3: eighth notes (6 nodes)
- `src/data/units/rhythmUnit4Redesigned.js` — Unit 4: rests (6 nodes)
- `src/data/units/rhythmUnit5Redesigned.js` — Unit 5: dotted notes, 3/4 time (6 nodes)
- `src/data/units/rhythmUnit6Redesigned.js` — Unit 6: sixteenth notes (6 nodes)
- `src/data/units/rhythmUnit7Redesigned.js` — Unit 7: compound time 6/8 (6 nodes)
- `src/data/units/rhythmUnit8Redesigned.js` — Unit 8: syncopation (6 nodes)

### Build validator

- `scripts/validateTrail.mjs` — Already validates pattern library (Phase 21). Phase 22 extends with: pattern tag/ID reference checks per node, old `rhythmPatterns` field rejection, and nodeType → exercise type mapping enforcement.

### Node type system

- `src/data/nodeTypes.js` — `NODE_TYPES` enum and `NODE_TYPE_METADATA`
- `src/data/constants.js` — `EXERCISE_TYPES` enum

### Phase 20 context (game-type policy)

- `.planning/phases/20-curriculum-audit/20-CONTEXT.md` — Decisions D-04 through D-11 define the complete nodeType → game mapping

### Phase 21 context (pattern structure)

- `.planning/phases/21-pattern-library-construction/21-CONTEXT.md` — Pattern data structure (D-01 through D-10), tagging taxonomy (D-11 through D-17)

### Requirements

- `.planning/REQUIREMENTS.md` §CURR-05, §PAT-03, §PAT-04, §PAT-05, §PAT-06

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `RhythmPatternGenerator.js`: Existing `DURATION_CONSTANTS`, `TIME_SIGNATURES`, `DIFFICULTY_LEVELS` — new resolver functions share these constants
- `rhythmPatterns.js`: Already exports `getPatternsByTag()`, `getPatternById()`, `getPatternsByTagAndDifficulty()` — resolver can delegate to these helpers
- `validateTrail.mjs`: Already imports `RHYTHM_PATTERNS` and `PATTERN_TAGS`, has `validatePatternLibrary()` — extend with per-node validation
- MetronomeTrainer: Existing tap detection, timing scoring, count-in logic — pulse mode reuses all of this

### Established Patterns

- Unit files use consistent node structure: `rhythmConfig` with `durations`, `focusDurations`, `contextDurations`, `tempo`, `pitch`, `timeSignature`
- Exercise configs: `exercises[].type` (from `EXERCISE_TYPES`) + `exercises[].config` object
- VexFlow duration codes: `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'qr'`, `'hr'`, `'wr'`, `'hd'`, `'qd'`
- Game components consume node config via `location.state` trail navigation pattern

### Integration Points

- Trail navigation switch maps `EXERCISE_TYPES` → game components — must cover all types used after remediation
- `VictoryScreen` receives exercise results regardless of game type — no changes expected
- `skillProgressService.js` tracks per-node progress — node ID changes not in scope (order values immutable)

</code_context>

<specifics>
## Specific Ideas

- Piano note (C4) on each beat for the pulse exercise — more musical than a click, connects rhythm to the piano instrument
- The pulse exercise is the very first thing a child encounters on the rhythm trail — it should feel welcoming and low-pressure
- Pattern objects flowing through to game components enables future analytics on which specific patterns children struggle with (pattern ID tracking)

</specifics>

<deferred>
## Deferred Ideas

- **Old generator removal** — Random generation logic in `RhythmPatternGenerator.js` stays for now; remove in a future cleanup phase when free practice modes are verified to not need it
- **Pattern analytics** — Tracking which specific pattern IDs children struggle with. Enabled by D-08 (full pattern objects to games) but not implemented in Phase 22.

</deferred>

---

_Phase: 22-service-layer-trail-wiring_
_Context gathered: 2026-04-07_
