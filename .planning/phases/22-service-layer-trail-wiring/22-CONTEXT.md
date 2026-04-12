# Phase 22: Service Layer & Trail Wiring - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the Phase 21 curated pattern library into all 56 rhythm nodes via a new RhythmPatternGenerator module, replace duration allowlists with pattern tags, add a pulse exercise to Unit 1 Node 1, convert all node exercise types to match the Phase 20 audit, and extend the build validator to enforce pattern correctness and game-type policy.

</domain>

<decisions>
## Implementation Decisions

### Pulse Exercise (CURR-05)

- **D-01:** New exercise type `PULSE` added to EXERCISE_TYPES. Not a mode of MetronomeTrainer — clean separation.
- **D-02:** Implemented as a `PulseQuestion` renderer inside MixedLessonGame (same architecture as VisualRecognitionQuestion, SyllableMatchingQuestion). No new route needed.
- **D-03:** UI: Large centered pulsing circle that scales/glows on each metronome beat. Glass card background. No staff lines, no notation, no VexFlow.
- **D-04:** Session: 4 bars (16 beats) at 65 BPM (~15 seconds). Score = percentage of beats tapped within timing threshold. Stars at 60/80/95%.
- **D-05:** Unit 1 Node 1's mixed_lesson sequence starts with pulse questions before visual_recognition/syllable_matching questions.

### Binary-to-Notation Rendering

- **D-06:** Node's `rhythmConfig.durations` array controls VexFlow rendering. The renderer picks the longest matching duration for each onset gap in the binary pattern. No per-pattern VexFlow authoring.
- **D-07:** Ambiguity resolution: prefer sustain over rest. Default to longest sustaining note that fits the gap. Rests only appear when the gap is shorter than the minimum note duration or in explicit rest-only positions.
- **D-08:** Rendering logic lives inside RhythmPatternGenerator. `resolveByTags()` returns both the binary pattern AND the rendered VexFlow duration array in one call.

### RhythmPatternGenerator API

- **D-09:** Module with exported functions (not a class). Matches existing codebase style where services are function exports.
- **D-10:** API: `resolveByTags(tags, durations, options?)` and `resolveByIds(ids, durations)`. Both return objects containing the binary pattern and rendered VexFlow durations.
- **D-11:** File location: `src/data/patterns/RhythmPatternGenerator.js` (co-located with rhythmPatterns.js).

### Node Config Migration

- **D-12:** Question sequences authored via templates per nodeType, not per-node. Standard templates: Discovery (notation-weighted), Practice (balanced), MIX_UP (varied), REVIEW (spaced repetition), MINI_BOSS (longer 12-question covering all unit concepts). Consistent pedagogy across all nodes of the same type.
- **D-13:** `rhythmConfig.patterns` replaced entirely by `rhythmConfig.patternTags`. Clean break — old `patterns` field deleted from all 56 nodes.
- **D-14:** Arcade nodes (CHALLENGE, SPEED_ROUND, BOSS) also use `patternTags` in rhythmConfig. Same API as mixed_lesson nodes. Consistent pattern resolution across all node types.
- **D-15:** Exercise-level `rhythmPatterns` fields (e.g. `config.rhythmPatterns: ['quarter','half']`) also removed from all arcade_rhythm exercise configs. All pattern resolution goes through patternTags. Single source of truth.
- **D-16:** All 56 nodes updated per Phase 20 audit remediation column. Nodes already on mixed_lesson (Unit 1 nodes 1-3 from Phase 25) get patternTags added; remaining 53 nodes get both exercise type changes and patternTags.

### Build Validator (PAT-06)

- **D-17:** Three pattern checks added to `validateTrail.mjs` (runs as part of `npm run verify:trail` / prebuild):
  1. **Tag existence:** Every `patternTag` in node configs exists in rhythmPatterns.js tag taxonomy
  2. **Tag coverage:** Every tag in the pattern library is used by at least one node (no orphan tags)
  3. **Duration safety:** For each node, every pattern resolved by its patternTags only needs durations from the node's `rhythmConfig.durations` to render (no unintroduced durations leak through)
- **D-18:** Game-type policy enforcement at build time: validator checks that Discovery/Practice/MIX_UP/REVIEW/MINI_BOSS nodes use mixed_lesson and CHALLENGE/SPEED_ROUND/BOSS use arcade_rhythm. Build fails on mismatch.
- **D-19:** Pattern-node wiring checks integrated into `verify:trail` only. Existing `verify:patterns` stays for pattern-library-only checks (Phase 21 scope).

### Claude's Discretion

- Exact question sequence templates per nodeType (how many of each question type)
- Discovery template weighting toward notation (rhythm_tap) questions vs visual/syllable
- MINI_BOSS session length and question type distribution
- Internal implementation of binary-to-VexFlow rendering algorithm
- How resolveByTags handles random selection when multiple patterns match
- Test structure and coverage approach
- Whether pulse questions appear in nodes beyond Unit 1 Node 1

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 20 Audit (LOCKED — implementation must follow exactly)

- `.planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md` — Node-by-node remediation table for all 56 rhythm nodes. Game-type policy. One-concept rule. Concept introduction order.

### Pattern Library (Phase 21 output)

- `src/data/patterns/rhythmPatterns.js` — 122 curated binary patterns with tags. Pattern format, tag taxonomy, binary array conventions.
- `src/data/patterns/rhythmPatterns.test.js` — Existing pattern validation tests

### Mixed Lesson Engine (Phase 25 output)

- `src/components/games/rhythm-games/MixedLessonGame.jsx` — Engine that orchestrates question renderers
- `src/components/games/rhythm-games/renderers/` — Existing renderers: RhythmTapQuestion, VisualRecognitionQuestion, SyllableMatchingQuestion (PulseQuestion to be added here)

### Rhythm Node Data (all 8 unit files to modify)

- `src/data/units/rhythmUnit1Redesigned.js` through `rhythmUnit8Redesigned.js` — All 56 rhythm node definitions
- `src/data/nodeTypes.js` — NODE_TYPES enum and metadata
- `src/data/constants.js` — EXERCISE_TYPES enum (add PULSE)

### Build Validator

- `scripts/validateTrail.mjs` — Extend with pattern tag/ID checks, duration safety, game-type policy enforcement

### Trail System Integration

- `src/components/trail/TrailNodeModal.jsx` — Exercise type name switch and navigate switch
- `src/components/games/VictoryScreen.jsx` — Post-game results, updateExerciseProgress()
- `src/services/skillProgressService.js` — Exercise progress CRUD

### Game Components (consumers of pattern resolution)

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — Needs to use resolveByTags() for pattern selection
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — May need pattern resolution update
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — May need pattern resolution update

### Requirements

- `.planning/REQUIREMENTS.md` — CURR-05, PAT-03, PAT-04, PAT-05, PAT-06

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `MixedLessonGame.jsx`: Engine that orchestrates question renderers — PulseQuestion plugs in as a new renderer
- `RhythmTapQuestion`, `VisualRecognitionQuestion`, `SyllableMatchingQuestion`: Existing renderers — reference for PulseQuestion architecture
- `rhythmPatterns.js`: 122 patterns with tags — consumed by RhythmPatternGenerator
- `DurationCard.jsx`: Shared card component for visual/syllable games
- `durationInfo.js`: DURATION_INFO lookup + generateQuestions()

### Established Patterns

- MixedLessonGame renderer contract: stateless component receives question + node skills, calls back with answer
- Trail auto-start: `hasAutoStartedRef` pattern
- Exercise navigation: `location.state` with { nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }
- Unit files: export arrays of node objects with `exercises` arrays, import NODE_TYPES and EXERCISE_TYPES

### Integration Points

- All 8 rhythmUnit files: replace `patterns` with `patternTags`, update exercise types per audit
- `constants.js`: add PULSE to EXERCISE_TYPES
- `validateTrail.mjs`: import rhythmPatterns.js, add 4 new check functions
- Game components (ArcadeRhythm, MetronomeTrainer, RhythmReading): update to use RhythmPatternGenerator instead of old duration-based pattern generation
- MixedLessonGame: register PulseQuestion renderer in question type switch

</code_context>

<specifics>
## Specific Ideas

- Pulse exercise is the very first thing a child does in the rhythm trail — it should feel welcoming, simple, and impossible to fail badly at
- The pulsing circle should feel like a heartbeat visualization — calming and intuitive
- Binary-to-VexFlow rendering is the key technical challenge: the same binary pattern renders differently depending on which node plays it (because nodes have different duration vocabularies)
- Templates per nodeType keep the 56-node migration manageable and consistent, rather than hand-authoring each sequence

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 22-service-layer-trail-wiring_
_Context gathered: 2026-04-12_
