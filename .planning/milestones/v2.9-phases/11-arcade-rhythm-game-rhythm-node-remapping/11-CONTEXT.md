# Phase 11: Arcade Rhythm Game + Rhythm Node Remapping - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an arcade-style falling-tile rhythm game (ArcadeRhythmGame) and remap all 36 existing rhythm nodes to a mixed distribution of exercise types (~40% MetronomeTrainer, ~30% RhythmReading, ~20% Dictation, ~10% Arcade). Includes a DB migration clearing stale exercise_progress for remapped nodes.

Requirements covered: ARCR-01 through ARCR-05, RMAP-01 through RMAP-03.

Not in scope: Changes to RhythmReadingGame, RhythmDictationGame, or MetronomeTrainer (already built). Ear training content (Phase 10 complete). New rhythm nodes or units beyond the existing 36.

</domain>

<decisions>
## Implementation Decisions

### Falling Tile Visual Design
- **D-01:** Single lane, full-width tiles — one column of tiles descending down center of screen. Child taps anywhere on screen when tile hits the zone. Simplest interaction model for 8-year-olds.
- **D-02:** Color-coded tiles by duration — each note duration gets a distinct color (e.g., quarter=blue, half=green, eighth=orange). Quick visual recognition, builds duration-color association over play sessions.
- **D-03:** Glowing line hit zone — horizontal glowing line across screen at bottom, pulsing subtly with the beat. Tiles dissolve/pop when crossing it. Fits enchanted forest glass aesthetic.
- **D-04:** Ghost tiles for rests — semi-transparent/dimmed tiles fall for rest beats. Child learns NOT to tap when ghost tiles appear. Ghost tiles pass through hit zone without penalty. Teaches rest awareness visually.

### Game Feel & Feedback
- **D-05:** Floating text + tile burst on tap — "PERFECT!" / "GOOD" / "MISS" floats up from hit zone and fades (reuse FloatingFeedback pattern from RhythmReadingGame). On PERFECT, tile explodes into colored particles. On GOOD, tile dissolves. On MISS, tile grays out and falls through.
- **D-06:** Flame trail on-fire mode — after combo threshold, falling tiles gain a fire/glow trail effect. Hit zone line turns orange and pulses faster. Reuses on-fire concept from NotesRecognitionGame with arcade visual flair. Respects reducedMotion.
- **D-07:** Heart icons + screen shake for life loss — 3 hearts in top corner. On miss: heart breaks/drains with brief screen shake. Screen shake respects reducedMotion preference.
- **D-08:** Visual countdown + first tiles visible — "3, 2, 1, GO!" overlay with metronome clicks (same as RhythmReadingGame D-03). First few tiles already on screen and slowly descending during countdown so child previews the pattern.

### Difficulty Progression
- **D-09:** Fixed screen travel time — tiles always take the same time to cross the screen regardless of tempo. At higher tempo, tiles appear closer together (denser patterns). Consistent visual speed across all difficulty levels.
- **D-10:** Fixed difficulty per session — all 10 patterns in a session use the same tempo and complexity from the node config. Difficulty increases by progressing to harder nodes on the trail, not within a session.

### Node Remapping Strategy
- **D-11:** Mixed exercise types from the start — every unit has a mix of all available exercise types from Unit 1 onward. Maximum variety immediately rather than progressive introduction.
- **D-12:** Per-unit proportional split — each unit independently follows the ~40% MetronomeTrainer / ~30% RhythmReading / ~20% Dictation / ~10% Arcade distribution. Consistent variety in every unit.
- **D-13:** Arcade Rhythm for all boss nodes — every rhythm boss node uses the arcade_rhythm exercise type. Creates a consistent "boss battle" identity with the most exciting game type.

### Claude's Discretion
- Exact color palette for duration-coded tiles (within glass design system)
- Tile dimensions (width, height, border-radius, gap between tiles)
- Glowing line animation details (pulse speed, glow radius, color)
- Particle burst effect implementation (count, spread, duration)
- Flame trail visual details (gradient, animation speed, opacity)
- Combo threshold number for on-fire activation
- Ghost tile opacity and visual treatment
- Countdown animation timing and typography
- Exact per-node exercise type assignment (following D-11/D-12/D-13 rules)
- Screen travel time constant (e.g., 2.5s vs 3s vs 3.5s)
- PERFECT/GOOD/MISS timing windows relative to beat (ms thresholds)
- FloatingFeedback animation reuse vs new component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Rhythm Games (structural templates)
- `src/components/games/rhythm-games/RhythmReadingGame.jsx` — Game phase FSM (SETUP/READY/PLAYING/FEEDBACK/SESSION_COMPLETE), trail integration, FloatingFeedback usage, count-in pattern, landscape/timeout hooks
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Trail integration pattern, handleNextExercise, VictoryScreen integration
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Original rhythm game, beat scheduling with audioContext.currentTime, tap scoring

### Engagement Patterns (lives, combo, on-fire)
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — 3-lives system, combo counter, on-fire mode, auto-grow note pool — all reusable patterns for ArcadeRhythmGame

### Rhythm Pattern Generation
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — Pattern generation for rhythm exercises (used by all rhythm games)
- `src/components/games/rhythm-games/utils/rhythmScoringUtils.js` — scoreTap function with timing thresholds

### VexFlow & Feedback Components
- `src/components/games/rhythm-games/components/FloatingFeedback.jsx` — Floating PERFECT/GOOD/MISS text (reusable in arcade game)
- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` — VexFlow rhythm notation renderer

### Audio Infrastructure
- `src/hooks/usePianoSampler.js` — Piano note synthesis hook (C4 for rhythm playback)
- `src/contexts/AudioContextProvider.jsx` — Shared AudioContext with iOS interruption handling
- `src/hooks/useAudioEngine.js` — Metronome/timing engine, tap sound support

### Game Session Flow
- `src/components/games/VictoryScreen.jsx` — Post-game results + XP + trail progress
- `src/components/games/GameOverScreen.jsx` — Game over variants (lives depleted)
- `src/components/games/shared/AudioInterruptedOverlay.jsx` — iOS audio interruption overlay

### Trail Integration
- `src/data/constants.js` — EXERCISE_TYPES (ARCADE_RHYTHM already registered in Phase 7)
- `src/components/trail/TrailNodeModal.jsx` — Exercise type routing (currently routes arcade_rhythm to ComingSoon — needs redirect)

### Rhythm Node Data (all 8 units to be remapped)
- `src/data/units/rhythmUnit1Redesigned.js` through `rhythmUnit8Redesigned.js` — 36 rhythm nodes, all currently using EXERCISE_TYPES.RHYTHM (MetronomeTrainer)
- `src/data/nodeTypes.js` — NODE_TYPES and RHYTHM_COMPLEXITY constants

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card patterns, enchanted forest theme colors

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FloatingFeedback` component: Already renders floating PERFECT/GOOD/MISS text with animations — directly reusable in ArcadeRhythmGame
- `scoreTap()` from `rhythmScoringUtils.js`: Timing-based tap scoring — reusable for hit zone judgment
- `RhythmPatternGenerator.getPattern()`: Generates rhythm patterns from node config — provides beat schedules for falling tiles
- `usePianoSampler` + `useSounds`: Audio playback hooks for note sounds and UI feedback
- `useLandscapeLock` + `useRotatePrompt`: Landscape orientation handling for mobile
- `useSessionTimeout`: Pause/resume timer integration for child safety
- `GameOverScreen`: Existing game-over component with lives-depleted variant
- 3-lives/combo/on-fire logic in NotesRecognitionGame (pattern to follow, not direct import)

### Established Patterns
- Game phase FSM: All rhythm games use `GAME_PHASES` state machine (SETUP → READY → PLAYING → FEEDBACK → SESSION_COMPLETE)
- Trail auto-start: `hasAutoStartedRef` pattern + `location.state` for nodeId/exerciseIndex/totalExercises
- `handleNextExercise` callback: Standard trail exercise chaining (navigate to next exercise type via routing)
- `requestAnimationFrame` + `ref.style.transform`: Decided animation approach for GPU compositor performance (STATE.md)
- `audioContext.currentTime`: Mandatory tap capture clock (STATE.md)

### Integration Points
- TrailNodeModal `arcade_rhythm` case: Currently routes to ComingSoon — needs redirect to `/rhythm-mode/arcade-rhythm-game`
- Route registration in App.jsx: New route for ArcadeRhythmGame component
- LANDSCAPE_ROUTES array: Add arcade rhythm route for orientation lock
- 8 rhythm unit data files: Exercise type field in each node's `exercises` array needs updating
- DB migration: Must clear `exercise_progress` JSONB and reset `stars` for all `rhythm_*` node IDs in `student_skill_progress`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions captured above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-arcade-rhythm-game-rhythm-node-remapping*
*Context gathered: 2026-03-30*
