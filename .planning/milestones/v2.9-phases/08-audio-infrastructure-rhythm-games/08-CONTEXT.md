# Phase 8: Audio Infrastructure + Rhythm Games - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the `usePianoSampler` hook for piano note playback, create two new rhythm game components (RhythmReadingGame and RhythmDictationGame), add i18n for all new exercise types, and bump service worker cache for audio assets.

Requirements covered: INFRA-06, INFRA-07, INFRA-08, RTAP-01 through RTAP-05, RDICT-01 through RDICT-06.

Not in scope: ArcadeRhythmGame (Phase 11), ear training games (Phase 9), trail data changes.

</domain>

<decisions>
## Implementation Decisions

### Rhythm Reading Game (RhythmReadingGame)
- **D-01:** Static staff with moving highlight cursor — staff stays fixed on screen, a glowing vertical line sweeps left-to-right across notes in sync with tempo. Child sees the full pattern at once.
- **D-02:** 1 measure visible at a time — one bar per exercise, 10 exercises per session. Matches existing MetronomeTrainer pattern length. Advances to next measure after completing current one.
- **D-03:** Count-in uses both audio + visual — metronome clicks play while "3, 2, 1, GO!" countdown numbers pulse/fade on screen. Child hears the tempo AND sees when to start.
- **D-04:** Tap feedback uses floating text + note color change — "PERFECT!" / "GOOD" / "MISS" text floats up from tap point and fades. The note on the staff also changes color (green = PERFECT, yellow = GOOD, red = MISS).
- **D-05:** Tap produces an audible click — child hears a soft click/pop on each tap as tactile-audio feedback, separate from the pattern's piano note. Confirms input was registered. Two audio layers: pattern = piano note (auto), tap = light click (on touch).

### Rhythm Dictation Game (RhythmDictationGame)
- **D-06:** Vertical stack layout for choice cards — 3 full-width cards stacked vertically, each showing one measure of VexFlow notation. Natural scrolling on mobile, works in both portrait + landscape.
- **D-07:** 3 choices per question — 1 correct + 2 distractors. 33% random chance. Fits well on mobile in vertical stack.
- **D-08:** Auto-play + replay button — pattern plays automatically when question loads. A replay button lets child hear it again (RDICT-02). Faster gameplay flow.
- **D-09:** Correct/wrong feedback: highlight + replay correct — correct card glows green, wrong cards dim. On wrong answer, selected card flashes red, then correct card glows green and the correct pattern replays automatically. Brief pause (1.5s correct, 2s wrong) then next question.

### Piano Sampler (usePianoSampler)
- **D-10:** 2 octaves C3-B4 range — 24 chromatic notes covering bass and treble. Sufficient for rhythm games (single pitch C4) and ear training in Phase 9 (note comparison, intervals).
- **D-11:** Web Audio synthesis, not pre-recorded samples — use AudioContext oscillator to synthesize piano-like tones (sine + 2-3 harmonics with ADSR envelope). Zero external dependency, zero licensing risk, COPPA-safe.
- **D-12:** On-demand synthesis — create oscillator + gain envelope each time playNote() is called. Zero startup cost, zero memory footprint. No pre-generation or caching needed.

### Rhythm Audio
- **D-13:** Piano single pitch (C4) for rhythm pattern playback — both rhythm games use a piano note for each beat, not metronome clicks or drum sounds. More musical feel for children.

### Claude's Discretion
- Exact ADSR envelope shape for synthesized piano tones (attack, decay, sustain, release durations)
- Harmonic ratios for piano-like timbre
- Tap click sound design (frequency, duration)
- VexFlow rendering approach for notation cards (reuse VexFlowStaffDisplay vs new component)
- Distractor generation algorithm for dictation (systematic duration swaps per RDICT-04)
- Floating text animation details (font size, fade duration, easing)
- Cursor glow visual style (color, width, opacity)
- i18n key naming convention for new game strings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audio Infrastructure
- `src/contexts/AudioContextProvider.jsx` -- Shared AudioContext with iOS interruption handling (usePianoSampler must use this, not create its own)
- `src/hooks/useAudioEngine.js` -- Existing metronome/timing engine with tap sound support (reference for scheduler patterns)

### Existing Rhythm Game
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` -- Current rhythm game (game phase FSM, trail integration pattern, landscape/timeout hooks)
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` -- Pattern generation for rhythm exercises
- `src/components/games/rhythm-games/components/RhythmNotationRenderer.jsx` -- Canvas-based rhythm notation (being replaced by VexFlow for new games)
- `src/components/games/rhythm-games/components/MetronomeDisplay.jsx` -- Beat display and tap area components

### VexFlow Notation
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` -- Existing VexFlow SVG rendering component
- `src/components/games/sight-reading-game/utils/vexflowHelpers.js` -- VexFlow utility functions
- `docs/vexflow-notation/vexflow-guidelines.md` -- VexFlow implementation guidelines

### Game Session Flow
- `src/components/games/VictoryScreen.jsx` -- Post-game results + XP + trail progress (both rhythm games must integrate)
- `src/components/games/shared/AudioInterruptedOverlay.jsx` -- iOS audio interruption overlay (required in both games)

### Trail Integration
- `src/data/constants.js` -- EXERCISE_TYPES (RHYTHM_TAP and RHYTHM_DICTATION already added in Phase 7)
- `src/components/trail/TrailNodeModal.jsx` -- Exercise type routing (already routes to ComingSoon for new types)

### Architecture Research
- `.planning/research/ARCHITECTURE.md` -- Component boundaries, data flow, game component structure pattern

### Design System
- `docs/DESIGN_SYSTEM.md` -- Glass card patterns, color conventions

### i18n
- `src/locales/en/` -- English translation files
- `src/locales/he/` -- Hebrew translation files (RTL)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AudioContextProvider`: Shared AudioContext with iOS interruption recovery — usePianoSampler must consume this via `useAudioContext()` hook
- `useAudioEngine`: Has metronome click, tap sound, and lookahead scheduler — can be extended or referenced for timing
- `MetronomeTrainer`: Full game component with GAME_PHASES FSM, trail integration, landscape lock, session timeout — structural template for both new games
- `VexFlowStaffDisplay`: SVG-based VexFlow renderer — can be adapted for rhythm notation cards in dictation game
- `RhythmPatternGenerator`: Pattern generation with difficulty levels and time signatures — reusable for both new games
- `VictoryScreen` + `GameOverScreen`: Post-game flow components with trail/XP integration
- `useLandscapeLock` + `useRotatePrompt`: Orientation handling hooks (required in all games)
- `useSessionTimeout`: Inactivity timer with pause/resume (required in all games)
- `AudioInterruptedOverlay`: iOS recovery overlay (required in all audio games)
- `useSounds`: Correct/wrong sound effects hook

### Established Patterns
- Game component structure: trail state from `location.state`, `hasAutoStartedRef` guard, landscape hooks, session timeout, AudioContextProvider wrapping
- `audioContext.currentTime` for tap timing (not `Date.now()`)
- Base timing thresholds scaled by tempo (see MetronomeTrainer `calculateTimingThresholds`)
- Pattern generation via difficulty levels and time signature config

### Integration Points
- `App.jsx`: Add lazy routes for `/rhythm-mode/rhythm-reading-game` and `/rhythm-mode/rhythm-dictation-game` wrapped in `AudioContextProvider`
- `TrailNodeModal.jsx`: Already routes `rhythm_reading` and `rhythm_dictation` types to ComingSoon — needs update to route to actual game components
- `LANDSCAPE_ROUTES` in App.jsx: Add both new game route paths
- Service worker `public/sw.js`: Bump cache version for new assets

</code_context>

<specifics>
## Specific Ideas

No specific external references or "I want it like X" moments — decisions are clear and self-contained.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-audio-infrastructure-rhythm-games*
*Context gathered: 2026-03-27*
