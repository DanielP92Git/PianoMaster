# Phase 24: Multi-Angle Rhythm Games - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add two new quiz-style mini-games — Visual Recognition and Syllable Matching — that teach rhythm notation from different angles. Wire them into low-variety rhythm trail nodes (≤2 unique durations) as additional exercises, so early nodes feel engaging despite limited note vocabulary. Create custom SVG sprites for rhythm notation icons and integrate both games with the trail system (progress tracking, star rating, XP).

</domain>

<decisions>
## Implementation Decisions

### Game Mechanics

- **D-01:** Visual Recognition: "Which one is a quarter note?" text prompt + 4 SVG icon cards in 2x2 grid (portrait) / 1x4 row (landscape). Child taps the correct card.
- **D-02:** Syllable Matching: Large SVG note in glass panel at top + "What syllable is this?" + 4 text cards with Kodaly syllables below. Child picks the matching syllable.
- **D-03:** 5 questions per exercise (not 10), since these are exercises within multi-exercise nodes. Keeps total node time ~3-4 min.
- **D-04:** No lives system — child always finishes all 5 questions. Score = percentage correct → stars (60%=1, 80%=2, 95%=3).
- **D-05:** Feedback: correct → card flashes green + success chime, auto-advance after 0.8s. Wrong → tapped card red + correct card highlights green + gentle buzz, auto-advance after 1.2s.
- **D-06:** Rests included in both games (quarter rest, half rest, whole rest). Rest syllable = 'sh' (EN) / 'הָס' (HE).
- **D-07:** Progress indicator: dot progress bar (5 dots at top), green = correct, red = wrong.
- **D-08:** Question pool: node's rhythmConfig durations (focusDurations + contextDurations) for targets. Distractors from global pool of all duration types minus correct answer, randomly pick 3.
- **D-09:** Trail-only — no free practice mode entry point.
- **D-10:** Full i18n from start — English + Hebrew with Nikud. Phase 23 syllable mappings reused.

### Card Rendering

- **D-11:** Note icon only (no staff lines). Static SVG sprite files — no VexFlow rendering per card.
- **D-12:** Custom-designed SVG sprites stored in `src/assets/icons/rhythm/`. One file per duration type. White fill on glass background.
- **D-13:** SVG sprite list: quarter-note, half-note, whole-note, eighth-note (single with flag), sixteenth-note (single with double flag), dotted-quarter, dotted-half, quarter-rest, half-rest, whole-rest.
- **D-14:** Eighth note = single with flag (not beamed pair). Syllable = 'ti' (singular). Sixteenth = single with double flag. Syllable = 'ti-ka'.
- **D-15:** Card layout: 2x2 grid in portrait, 1x4 horizontal row in landscape. Prompt text above, centered.
- **D-16:** Card sizing: min 80px per side, fill available space in grid. ~170px portrait, ~320px landscape.
- **D-17:** No text labels on Visual Recognition cards — icons only. No duration name on Syllable Matching prompt — SVG only.
- **D-18:** Glass card styling: bg-white/10, border-white/20. Tap animation: scale(0.95) press + color flash (bg-green-500/30 or bg-red-500/30). Reduced-motion: skip scale, color only.
- **D-19:** Screen layout (top to bottom): progress dots → question/prompt → answer cards.
- **D-20:** Syllable Matching prompt: large SVG note in glass panel + "What syllable is this?" text below the note, then 2x2 text answer cards.
- **D-21:** Syllable Matching text cards: glass-styled (bg-white/10, border-white/20) with large centered syllable text.

### Trail Node Wiring

- **D-22:** Two new EXERCISE_TYPES: `VISUAL_RECOGNITION: 'visual_recognition'` and `SYLLABLE_MATCHING: 'syllable_matching'`.
- **D-23:** Target nodes: low-variety rhythm nodes with ≤2 unique non-rest durations in rhythmConfig.durations. Approximately 8-12 nodes across Units 1-2.
- **D-24:** Exercise order in nodes: rhythm_tap [0] → visual_recognition [1] → syllable_matching [2]. Pedagogical progression: do → see → name.
- **D-25:** Exercise config shape: `{ type: EXERCISE_TYPES.VISUAL_RECOGNITION, config: { questionCount: 5 } }`. Game reads node's rhythmConfig for duration pool.
- **D-26:** Build validator (validateTrail.mjs) extended: (1) visual_recognition/syllable_matching must have rhythmConfig, (2) config.questionCount > 0, (3) low-variety nodes (≤2 durations) must include at least one multi-angle game.
- **D-27:** TrailNodeModal.jsx: add cases to getExerciseTypeName() switch + i18n keys for both new types.
- **D-28:** TrailNodeModal.jsx: add navigate() cases for both types → their route paths.
- **D-29:** Import syllable mappings from existing `rhythmVexflowHelpers.js` (SYLLABLE_MAP_EN, SYLLABLE_MAP_HE, REST_SYLLABLE_EN, REST_SYLLABLE_HE). No duplication.
- **D-30:** Central DURATION_INFO lookup object mapping VexFlow duration codes → { svg filename, i18n name key, durationUnits, isRest }.
- **D-31:** Standard progress tracking: VictoryScreen calls updateExerciseProgress() with 60/80/95% star thresholds. Node stars = min across all exercises.

### Component Structure

- **D-32:** Two separate components: `VisualRecognitionGame.jsx` and `SyllableMatchingGame.jsx`.
- **D-33:** Located in `src/components/games/rhythm-games/`.
- **D-34:** Routes: `/rhythm-mode/visual-recognition-game` and `/rhythm-mode/syllable-matching-game`. Added to LANDSCAPE_ROUTES (App.jsx) AND gameRoutes (AppLayout.jsx).
- **D-35:** Shared `DurationCard.jsx` sub-component in `rhythm-games/components/`. Renders either SVG icon or text based on `type` prop. Handles glass styling, tap animation, correct/wrong state, reduced-motion.
- **D-36:** `DURATION_INFO` lookup object in `rhythm-games/utils/durationInfo.js`.

### Claude's Discretion

- Exact SVG sprite artwork design (proportions, stroke width, visual style)
- Internal quiz state machine implementation
- Sound effect selection for correct/wrong (reuse existing game sounds)
- Test structure and coverage approach
- Exact distractor shuffling algorithm
- Whether to extract shared quiz flow logic into a hook

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Exercise types and trail system

- `src/data/constants.js` — EXERCISE_TYPES enum (add VISUAL_RECOGNITION + SYLLABLE_MATCHING)
- `src/data/nodeTypes.js` — NODE_TYPES enum and metadata
- `src/components/trail/TrailNodeModal.jsx` — Exercise type name switch (line ~28) and navigate switch (line ~298). Both need new cases.

### Syllable mappings (existing — import, don't duplicate)

- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — SYLLABLE_MAP_EN, SYLLABLE_MAP_HE, REST_SYLLABLE_EN, REST_SYLLABLE_HE, SYLLABLE_HE_TE

### Rhythm game components (reference patterns)

- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — Trail auto-start pattern (hasAutoStartedRef)
- `src/components/games/rhythm-games/components/DictationChoiceCard.jsx` — Existing card component pattern
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — 4-option quiz game reference
- `src/components/games/notes-master-games/NoteSpeedCards.jsx` — Card game with SVG note rendering

### Trail data (nodes to modify)

- `src/data/units/rhythmUnit1Redesigned.js` — Unit 1 nodes (7 nodes, target ~4-5 for multi-angle)
- `src/data/units/rhythmUnit2Redesigned.js` — Unit 2 nodes (6 nodes, target ~3-4 for multi-angle)

### Build validator

- `scripts/validateTrail.mjs` — Extend with multi-angle game validation rules

### Route registration (CRITICAL: update both arrays)

- `src/App.jsx` — LANDSCAPE_ROUTES[] + lazy import + Route elements
- `src/components/layout/AppLayout.jsx` — gameRoutes[] array

### Game session flow

- `src/components/games/VictoryScreen.jsx` — Post-game results, calls updateExerciseProgress()
- `src/services/skillProgressService.js` — Exercise progress CRUD

### Prior phase context

- `.planning/phases/23-ux-polish/23-CONTEXT.md` — Kodaly syllable decisions (D-13 through D-20), Nikud strings
- `.planning/phases/22-service-layer-trail-wiring/22-CONTEXT.md` — Pattern resolution API, node config structure

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `rhythmVexflowHelpers.js`: Syllable maps (SYLLABLE_MAP_EN/HE) — import directly for Syllable Matching game
- `DictationChoiceCard.jsx`: Existing selectable card component — reference for DurationCard implementation
- `NoteSpeedCards.jsx`: Card game pattern with target/distractor logic — reference for question generation
- `NotesRecognitionGame.jsx`: 4-option quiz flow with trail integration — closest existing analog
- `useSounds` hook: Existing sound effects for correct/wrong feedback
- `useMotionTokens` hook: Respects reduced-motion preferences
- `useLandscapeLock` + `useRotatePrompt`: Landscape orientation support

### Established Patterns

- Trail auto-start: `hasAutoStartedRef` pattern in all game components
- Game session flow: idle → in-progress → complete → VictoryScreen
- Exercise navigation: `location.state` with { nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }
- SVG imports: `import Icon from './icon.svg?react'` (vite-plugin-svgr with `?react` suffix)
- i18n: `useTranslation('common')` for game labels, `useTranslation('trail')` for exercise type names
- Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`

### Integration Points

- `TrailNodeModal.jsx` navigate switch: needs `visual_recognition` and `syllable_matching` cases
- `App.jsx` LANDSCAPE_ROUTES + route definitions: new lazy-loaded routes
- `AppLayout.jsx` gameRoutes: new paths for sidebar/header hiding
- `constants.js` EXERCISE_TYPES: two new enum values
- `validateTrail.mjs`: new validation rules for multi-angle exercise types
- Node unit files (rhythmUnit1/2Redesigned.js): add exercises[] entries to qualifying nodes

</code_context>

<specifics>
## Specific Ideas

- The whole point of multi-angle games is to make single-duration nodes diverse — each game type is a separate exercise, so the child cycles through do (tap) → see (visual recognition) → name (syllable matching)
- Eighth note syllable is "ti" (singular for single note), not "ti-ti" (which describes a pair) — per user decision
- Sixteenth note syllable is "ti-ka" — per user decision
- Hebrew syllable Nikud already confirmed in Phase 23 — use same mappings
- SVG sprites should be clean, simple geometric shapes — white on glass background, appropriate for 8-year-old recognition

</specifics>

<deferred>
## Deferred Ideas

- **Free practice entry** — Add Visual Recognition and Syllable Matching to the practice modes grid for non-trail play. Consider after validating the games work well in trail context.
- **Similarity-weighted distractors** — Pick distractors that look similar to the correct answer for harder questions. Could be a difficulty progression in later nodes.
- **Reverse direction** — "Syllable → pick note" direction for Syllable Matching. Could alternate with current direction for variety in advanced nodes.

</deferred>

---

_Phase: 24-multi-angle-rhythm-games_
_Context gathered: 2026-04-09_
