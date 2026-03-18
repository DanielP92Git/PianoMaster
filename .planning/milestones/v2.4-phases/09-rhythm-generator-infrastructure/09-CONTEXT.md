# Phase 09: Rhythm Generator Infrastructure - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the 6/8 compound beat model and correct beam grouping so the rhythm generator and VexFlow renderer correctly model 6/8 as 2 compound beats with 3+3 eighth-note beam groups. Timing windows and tap scoring must work correctly for compound beats. Existing 4/4, 3/4, and 2/4 exercises must be completely unaffected.

No new rhythm trail nodes are added in this phase — that's Phase 10. No game-layer UI changes beyond what's needed for infrastructure correctness.

</domain>

<decisions>
## Implementation Decisions

### Tempo interpretation
- BPM in 6/8 means dotted-quarter = BPM (standard music convention)
- 80 BPM in 6/8 = 80 dotted-quarter beats per minute
- Default tempo range for 6/8: 50-70 BPM (slow, forgiving for beginners)
- UI displays tempo with beat-unit symbol: `♩. = 60` for compound time, `♩ = 60` for simple time

### Beat model change (RFIX-01)
- Change TIME_SIGNATURES.SIX_EIGHT from `beats: 6` to `beats: 2`
- Add explicit `subdivisions: 6` field (not derived from beats * 3)
- Keep `measureLength: 12`, `isCompound: true`
- Update all code that reads `timeSignature.beats` to handle the new model
- `secondsPerSixteenth` calculation must use compound-aware beat duration

### Metronome click pattern (6/8)
- 2 strong clicks on compound beats (1 and 4) + 4 lighter subdivision clicks on positions 2, 3, 5, 6
- Visual beat indicator shows 6 subdivision circles with positions 1 and 4 visually accented (bigger/brighter)
- Count-in: 2 measures (4 compound beats) for 6/8 — gives kids time to feel the groove
- Other time signatures keep existing 1-measure count-in

### Tap scoring
- Same ms-based timing thresholds for 6/8 (PERFECT ±20ms, GOOD ±50ms, FAIR ±100ms with existing tempo scaling)
- Tap targets are note onsets only — a dotted-quarter = 1 tap, three eighth notes = 3 taps
- Nearest-note-wins for ambiguous taps between timing windows
- Sight-reading timing windows (useTimingAnalysis): keep existing duration-based scaling, no compound-specific adjustment

### Beam grouping (RFIX-02)
- Build a general `beamGroupsForTimeSignature()` helper returning correct VexFlow beam groups for any time signature
- 4/4 = VexFlow default, 6/8 = groups of 3 eighth notes (3+3), future-proof for 9/8 (3+3+3), 12/8 (3+3+3+3)
- Pass groups to `Beam.generateBeams(notes, { groups })` in all rendering paths

### Claude's Discretion
- Sight-reading timing window adjustments for compound time (existing scaling may suffice)
- Internal implementation of beat duration calculation changes
- Exact visual styling of accented vs unaccented subdivision indicators
- How to structure the beamGroupsForTimeSignature() helper internally

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Rhythm infrastructure
- `src/components/games/sight-reading-game/utils/rhythmGenerator.js` — Core beat-wise pattern generator; beats/unitsPerBeat assumptions
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — Rhythm-to-notation conversion; secondsPerSixteenth calculation
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — TIME_SIGNATURES definitions including SIX_EIGHT; duration constants
- `src/components/games/sight-reading-game/constants/durationConstants.js` — NOTE_DURATION_DEFINITIONS, time signature grid with unitsPerBeat

### Timing and scoring
- `src/components/games/sight-reading-game/constants/timingConstants.js` — TIMING_TOLERANCES, tap scoring window constants
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` — BPM-adaptive timing windows, evaluateTiming logic

### Game components
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Game state machine, beat duration calc, visual beat indicator, count-in logic
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — Beam.generateBeams() calls, stem direction logic
- `src/components/games/sight-reading-game/components/RhythmPatternPreview.jsx` — Rhythm-only VexFlow rendering with beam config

### Existing tests
- `src/components/games/sight-reading-game/utils/patternBuilder.test.js` — Pattern generation tests
- `src/components/games/sight-reading-game/utils/rhythmGenerator.test.js` — Rhythm generator tests

### VexFlow guidelines
- `docs/vexflow-notation/vexflow-guidelines.md` — Project VexFlow patterns and conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RhythmPatternGenerator.TIME_SIGNATURES.SIX_EIGHT` — Already defined with `isCompound: true`, needs `beats` fix from 6→2 and new `subdivisions: 6` field
- `durationConstants.js` TIME_SIGNATURE_GRID — Computes `unitsPerBeat` from `measureLength / beats`; will auto-update when beats changes
- `Beam.generateBeams()` — VexFlow API accepts optional `groups` parameter for custom beam grouping
- `MetronomeTrainer.jsx` `calculateTimingThresholds()` — Already does tempo-adaptive scaling

### Established Patterns
- Beat-wise pattern generation in rhythmGenerator: fills beats individually, respects `unitsPerBeat` from time signature
- Duration-based timing windows in useTimingAnalysis: `scaledLate = min(NOTE_LATE_MS, durationMs * 0.6)` — naturally adapts to note length
- `noBeam` flag on notation objects prevents incorrect beam connections (used for dotted-quarter + eighth patterns)

### Integration Points
- `patternBuilder.js` line: `secondsPerSixteenth = beatDurationSeconds / 4` — hardcoded assumption, needs compound-aware calc
- `MetronomeTrainer.jsx`: `beatDuration = 60 / gameSettings.tempo` — needs to account for compound beat (dotted-quarter)
- All `Beam.generateBeams()` call sites — need to pass beam groups from new helper
- `useTimingAnalysis.js`: `beatDurationMs = (60 / bpm) * 1000` — standard quarter-note assumption

</code_context>

<specifics>
## Specific Ideas

- For 6/8 exercises, the count-in should feel like "ONE-two-three TWO-two-three ONE-two-three TWO-two-three" — 2 full measures
- Accented subdivision indicators (positions 1 and 4) should be visually distinct but not overwhelming — bigger/brighter, same style
- The `♩. = 60` tempo display is educational and teaches kids to associate beat unit with tempo

</specifics>

<deferred>
## Deferred Ideas

- 6/8 trail node data (discovery nodes, practice nodes, boss challenges) — Phase 10
- Syncopation patterns (eighth-quarter-eighth, dotted quarter-eighth) — Phase 10
- 9/8 and 12/8 compound time signatures — future milestone (infrastructure is future-proofed with subdivisions field and general beam mapping)

</deferred>

---

*Phase: 09-rhythm-generator-infrastructure*
*Context gathered: 2026-03-18*
