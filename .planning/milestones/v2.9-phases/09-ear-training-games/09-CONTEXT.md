# Phase 9: Ear Training Games - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build two new ear training game components (NoteComparisonGame, IntervalGame) with a shared piano keyboard SVG reveal component, and add subscription config entries for ear training nodes.

Requirements covered: PITCH-01 through PITCH-05, INTV-01 through INTV-05.

Not in scope: Ear training trail node data (Phase 10), trail tab activation (Phase 10), ArcadeRhythmGame (Phase 11), rhythm node remapping (Phase 11).

</domain>

<decisions>
## Implementation Decisions

### Piano Keyboard Reveal (shared component)
- **D-01:** 1 octave context view that shifts/centers around the two played notes. Child sees ~12 keys at a time, large enough for small screens.
- **D-02:** Color + label highlighting — Note 1 glows blue, Note 2 glows orange. Note name labels appear below each highlighted key. Direction arrow shows relationship between the notes.
- **D-03:** Keyboard is a shared SVG component used by both NoteComparisonGame and IntervalGame — same visual, different labels.

### NoteComparisonGame (Higher/Lower)
- **D-04:** Two big side-by-side buttons — HIGHER (arrow up) and LOWER (arrow down). Glass card style, large touch targets (48px+ min). Arrow icons + text labels.
- **D-05:** Animated direction reveal after answering: (1) selected button glows green/red, (2) piano keyboard slides in from below, (3) Note 1 highlights blue, (4) animated arrow slides to Note 2 (orange), (5) direction label appears ("HIGHER ▲" or "LOWER ▼"), (6) brief pause (1.5s correct, 2s wrong) then next question.

### IntervalGame (Step/Skip/Leap)
- **D-06:** Inline hints permanently visible on answer buttons — "Step (next door)", "Skip (jump one)", "Leap (far apart)" with spacing icons. No separate tutorial screen needed; learning happens through play.
- **D-07:** Vertical stack layout — three full-width glass card buttons stacked vertically. Same pattern as RhythmDictationGame choice cards.
- **D-08:** Keyboard reveal with interval label — same blue/orange note highlighting as NoteComparison, plus: keys between the two notes get a subtle dim-highlight, interval name label shows (e.g., "SKIP — C4 to E4"), sublabel explains what was skipped (e.g., "Jumped over D4").

### Difficulty Progression
- **D-09:** NoteComparison uses tiered bands across 10 questions: Tier 1 (Q1-3) wide intervals (octave/7th/6th), Tier 2 (Q4-7) medium (5th/4th/3rd), Tier 3 (Q8-10) close (2nd/minor 2nd). Trail nodes can override tier ranges.
- **D-10:** IntervalGame uses ascending-first split: first ~60% of session is ascending intervals only, last ~40% introduces mixed ascending + descending. Trail nodes can configure the split ratio or be all-descending.
- **D-11:** Both games use 10 questions per session, consistent with all other game modes (NotesRecognition, SightReading, MetronomeTrainer).

### Claude's Discretion
- Exact SVG keyboard rendering approach (inline SVG vs separate component file)
- Piano key dimensions and spacing within the 1-octave view
- Blue/orange exact color values (within glass design system)
- Arrow animation timing and easing curves
- Dim-highlight opacity for in-between keys in IntervalGame
- Note pair selection algorithm within each tier (random within bounds)
- Correct/wrong sound effects integration (reuse `useSounds` hook)
- Replay button placement for hearing the interval again
- Landscape layout adjustments for both games

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audio Infrastructure
- `src/hooks/usePianoSampler.js` — Piano note synthesis hook with C3-B4 range (the audio engine for both ear training games)
- `src/contexts/AudioContextProvider.jsx` — Shared AudioContext with iOS interruption handling (usePianoSampler already uses this)

### Existing Game Patterns
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Game phase FSM, trail integration pattern, landscape/timeout hooks (structural template)
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Vertical stack choice cards pattern (reusable for IntervalGame layout)
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — Combo/lives system, auto-grow, trail integration (reference for engagement patterns)

### Game Session Flow
- `src/components/games/VictoryScreen.jsx` — Post-game results + XP + trail progress (both games must integrate)
- `src/components/games/GameOverScreen.jsx` — Game over variants
- `src/components/games/shared/AudioInterruptedOverlay.jsx` — iOS audio interruption overlay (required in both games)

### Trail Integration
- `src/data/constants.js` — EXERCISE_TYPES (PITCH_COMPARISON and INTERVAL_ID already registered in Phase 7)
- `src/components/trail/TrailNodeModal.jsx` — Exercise type routing (currently routes to ComingSoon for these types — needs update)

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card patterns, color conventions for the enchanted forest theme

### i18n
- `src/locales/en/` — English translation files
- `src/locales/he/` — Hebrew translation files (RTL)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePianoSampler`: Ready-to-use piano synthesis with `playNote(noteId, { duration, velocity, startTime })` — covers C3-B4 range needed for both games
- `useSounds`: Correct/wrong sound effects hook — reuse for answer feedback
- `RhythmDictationGame`: Vertical stack choice card pattern — structural reference for IntervalGame's Step/Skip/Leap buttons
- `MetronomeTrainer`: GAME_PHASES FSM pattern — structural template for both new games
- `VictoryScreen` + `GameOverScreen`: Post-game flow with trail/XP integration
- `useLandscapeLock` + `useRotatePrompt`: Orientation handling (required in all games)
- `useSessionTimeout`: Inactivity timer with pause/resume (required in all games)
- `AudioInterruptedOverlay`: iOS recovery overlay (required in all audio games)
- `ComingSoon` component: Currently shown for pitch_comparison and interval_id — will be replaced by actual game components

### Established Patterns
- Game component structure: trail state from `location.state`, `hasAutoStartedRef` guard, landscape hooks, session timeout, AudioContextProvider wrapping
- `audioContext.currentTime` for precise audio scheduling
- Game routes wrapped in `AudioContextProvider` in App.jsx
- Glass card styling: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`

### Integration Points
- `App.jsx`: Add lazy routes for NoteComparisonGame and IntervalGame (likely under `/ear-training-mode/` or similar path)
- `TrailNodeModal.jsx`: Update `pitch_comparison` and `interval_id` cases from ComingSoon to actual game navigation
- `LANDSCAPE_ROUTES` in App.jsx: Add both new game route paths
- `src/config/subscriptionConfig.js`: Add ear training free node IDs (for Phase 10 trail nodes, but config needed now)

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

*Phase: 09-ear-training-games*
*Context gathered: 2026-03-29*
