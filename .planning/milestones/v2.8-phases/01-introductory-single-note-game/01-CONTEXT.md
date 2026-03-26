# Phase 1: Introductory Single-Note Game - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a "speed card" game for trail nodes where the learner knows only one note. Note cards flash by on a treble/bass staff; the child taps the screen when the target note appears. This replaces the current `note_recognition` exercise on single-note first nodes (treble_1_1, bass_1_1) which is trivially easy and not engaging with only one note in the pool.

</domain>

<decisions>
## Implementation Decisions

### Game Mechanic
- **D-01:** Speed card format — notes flash by at a pace, child taps when target note (e.g., middle C) appears
- **D-02:** Speed ramps up — start slow (~2 sec per card), gradually increase speed as the child scores correct taps
- **D-03:** Distractor cards show real notes on the staff (D4, E4, F4, G4 etc.), NOT shapes or symbols — builds actual note discrimination
- **D-04:** Session size (total cards, target ratio) — Claude's discretion based on age-appropriate attention span research

### Visual Presentation
- **D-05:** Notes displayed on a treble/bass clef staff — consistent with all other games in the app
- **D-06:** Cards slide in from the right and out to the left (conveyor belt animation)

### Interaction & Feedback
- **D-07:** Tap anywhere on screen to "catch" the target note — large tap target for 8-year-olds on mobile
- **D-08:** Correct catch: card flashes green + happy sound + combo counter increments (reuse combo pattern from NotesRecognitionGame)
- **D-09:** Wrong tap (tapping on non-target): card flashes red, combo resets, NO lives lost, NO punishment
- **D-10:** Missed target note (didn't tap in time): Claude's discretion based on common game patterns

### Scope
- **D-11:** Apply to treble first node (`treble_1_1`, notePool: `['C4']`) AND bass first node (notePool: `['C3']`)
- **D-12:** Does NOT apply to rhythm first nodes
- **D-13:** REPLACES the current `note_recognition` exercise on these nodes (not added alongside)

### Integration
- **D-14:** New exercise type added to `EXERCISE_TYPES` in `src/data/constants.js` (e.g., `NOTE_CATCH` or similar)
- **D-15:** New game component (e.g., `NoteSpeedCards.jsx` or similar) in `src/components/games/`
- **D-16:** New case added to TrailNodeModal.jsx switch statement for routing
- **D-17:** Must support trail auto-start via `hasAutoStartedRef` pattern (consistent with all 4 existing game components)
- **D-18:** Must flow into VictoryScreen with trail progress + XP on completion

### Claude's Discretion
- Session card count and target-to-distractor ratio (D-04)
- Missed note behavior — whether to hint, highlight, or silently pass (D-10)
- Speed ramp curve (how aggressive the acceleration is)
- Component naming and file structure within existing game directories

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Trail Data & Constants
- `src/data/constants.js` — EXERCISE_TYPES enum (add new type here)
- `src/data/nodeTypes.js` — NODE_TYPES and NODE_TYPE_METADATA
- `src/data/units/trebleUnit1Redesigned.js` — treble_1_1 node definition (modify exercise type)
- `src/data/units/bassUnit1Redesigned.js` — bass first node definition (modify exercise type)

### Trail Navigation
- `src/components/trail/TrailNodeModal.jsx` — exercise type switch statement (add new case)

### Existing Game Patterns
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — combo/lives/on-fire mechanics, trail auto-start pattern
- `src/components/games/notes-master-games/NoteImageDisplay.jsx` — note image rendering (may reuse)
- `src/components/games/VictoryScreen.jsx` — post-game results + XP + trail progress
- `src/components/games/GameOverScreen.jsx` — game over handling (reference, but this game has no lives)

### Build Validation
- `scripts/validateTrail.mjs` — trail node validation (must pass after node data changes)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NoteImageDisplay.jsx` — renders note images, could be used for card content
- Combo system in `NotesRecognitionGame.jsx` — combo counter + shake + on-fire mode pattern
- `useSounds` hook — for correct/incorrect sound effects
- `useMotionTokens` — for reduced-motion-aware animations
- `useSessionTimeout` — must call `pauseTimer()` during gameplay
- `useLandscapeLock` + `useRotatePrompt` — landscape orientation support
- `framer-motion` — already used for game animations (AnimatePresence, motion)

### Established Patterns
- Trail auto-start: `hasAutoStartedRef` pattern in all game components
- Game state flow: `idle` → `in-progress` → `complete`
- Navigation state: `{ nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }` via `location.state`
- i18n: All user-facing strings in `src/locales/en/` and `src/locales/he/`

### Integration Points
- `TrailNodeModal.jsx` switch — add new exercise type routing
- `src/data/constants.js` — add to EXERCISE_TYPES enum
- Node data files — change exercise type from `note_recognition` to new type
- VictoryScreen — receives trail state and handles XP/progress

</code_context>

<specifics>
## Specific Ideas

- "Duolingo-kids style" — the game should feel playful, arcade-like, not educational-test-like
- Conveyor belt metaphor — cards sliding right-to-left creates a sense of urgency without stress
- No punishment philosophy — wrong taps are learning moments (red flash), not failures (no lives)

</specifics>

<deferred>
## Deferred Ideas

- Expanding speed card game to rhythm first nodes (user explicitly excluded for now)
- Multiple-choice quiz variant ("Which is middle C?") — considered but speed card chosen instead
- Silly shapes/symbols as distractors — rejected in favor of real notes for educational value
- Adding speed card as a SECOND exercise alongside note_recognition — rejected, it replaces it

</deferred>

---

*Phase: 01-introductory-single-note-game*
*Context gathered: 2026-03-25*
