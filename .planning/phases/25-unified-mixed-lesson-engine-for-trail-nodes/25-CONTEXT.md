# Phase 25: Unified Mixed Lesson Engine for Trail Nodes - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a MixedLessonGame component that plays through a pre-authored sequence of different question types (visual recognition, syllable matching, and future types) within one unified game session — Duolingo-style interleaved learning. Refactor Phase 24's standalone quiz games into stateless question renderers that the engine orchestrates. Wire the new `mixed_lesson` exercise type into the trail system alongside existing standalone exercises.

</domain>

<decisions>
## Implementation Decisions

### Renderer Extraction

- **D-01:** Extract quiz UI from VisualRecognitionGame and SyllableMatchingGame into stateless renderers: `VisualRecognitionQuestion` and `SyllableMatchingQuestion`. These renderers receive a question + node skills and call back with the answer.
- **D-02:** Extracted renderers live in `src/components/games/rhythm-games/renderers/`.
- **D-03:** Existing standalone games (VisualRecognitionGame.jsx, SyllableMatchingGame.jsx) become thin wrappers around the renderers — they keep their own state management, VictoryScreen integration, and trail wiring. No breaking changes to standalone routes.
- **D-04:** Reuse existing building blocks: DurationCard, generateQuestions(), DURATION_INFO, syllable maps from rhythmVexflowHelpers.js.

### Lesson Sequence Schema

- **D-05:** New exercise type `MIXED_LESSON: 'mixed_lesson'` added to EXERCISE_TYPES in constants.js.
- **D-06:** Sequence defined inline in the node's exercises array as a `mixed_lesson` exercise with a `questions[]` config array:
  ```javascript
  {
    type: EXERCISE_TYPES.MIXED_LESSON,
    config: {
      questions: [
        { type: 'visual_recognition' },
        { type: 'syllable_matching' },
        { type: 'visual_recognition' },
        { type: 'syllable_matching' },
        // ... 8-10 questions total
      ]
    }
  }
  ```
- **D-07:** Questions always inherit the node's rhythmConfig durations. No per-question overrides — durations come from one source of truth.
- **D-08:** 8-10 questions per mixed lesson. Authored per-node (the questions[] array length IS the count). More Duolingo-like session length.
- **D-09:** Pre-structured sequences, not random. Authored question order for pedagogical control: introduce → recognize → recall → reinforce.

### Session UX & Transitions

- **D-10:** Progress indicator: horizontal progress bar at top (Duolingo-style). Green fill on glass track (`bg-white/15` track, `bg-green-400` fill). Shows fraction text: "3/10".
- **D-11:** Transitions between question types: smooth crossfade (~300ms). Old question fades out, new fades in. Feedback flash (correct/wrong) happens first, then crossfade to next question.
- **D-12:** Single score across all questions: correct / total → percentage → stars (60%=1, 80%=2, 95%=3). Same star thresholds as all other games.
- **D-13:** Feedback per question: same as standalone games — correct card flashes green + success chime (0.8s delay), wrong card red + correct highlights green + gentle buzz (1.2s delay). Then crossfade to next.
- **D-14:** Reduced-motion: skip crossfade animation, instant swap. Color feedback still shows.

### Standalone Coexistence

- **D-15:** Both standalone and mixed exercise types coexist. Nodes can use either `visual_recognition`/`syllable_matching` (standalone routes) or `mixed_lesson` (unified engine). No forced migration.
- **D-16:** Standalone VisualRecognitionGame and SyllableMatchingGame routes remain functional. Phase 24 wiring untouched.
- **D-17:** New route for mixed engine: `/rhythm-mode/mixed-lesson`. Added to LANDSCAPE_ROUTES (App.jsx) AND gameRoutes (AppLayout.jsx).
- **D-18:** TrailNodeModal.jsx: add navigate case for `mixed_lesson` exercise type → `/rhythm-mode/mixed-lesson` route.

### Claude's Discretion

- Migration scope: Claude decides which nodes (if any) to convert from standalone to mixed_lesson in this phase, prioritizing a clean build. Can convert low-variety nodes, leave all standalone, or mix — whatever produces the cleanest result.
- MixedLessonGame internal state machine implementation
- Whether to extract a shared quiz engine hook
- Crossfade animation implementation details
- Test structure and coverage approach
- Build validator extensions for mixed_lesson type

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 24 components (source for extraction)

- `src/components/games/rhythm-games/VisualRecognitionGame.jsx` — Standalone game to extract renderer from
- `src/components/games/rhythm-games/SyllableMatchingGame.jsx` — Standalone game to extract renderer from
- `src/components/games/rhythm-games/components/DurationCard.jsx` — Shared card component (reuse as-is)
- `src/components/games/rhythm-games/utils/durationInfo.js` — DURATION_INFO lookup + generateQuestions() (reuse as-is)

### Exercise types and trail system

- `src/data/constants.js` — EXERCISE_TYPES enum (add MIXED_LESSON)
- `src/components/trail/TrailNodeModal.jsx` — Exercise type name switch + navigate switch (add mixed_lesson cases)

### Syllable mappings (import, don't duplicate)

- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — SYLLABLE_MAP_EN, SYLLABLE_MAP_HE, REST_SYLLABLE_EN, REST_SYLLABLE_HE

### Trail data (nodes that may use mixed_lesson)

- `src/data/units/rhythmUnit1Redesigned.js` — Unit 1 rhythm nodes
- `src/data/units/rhythmUnit2Redesigned.js` — Unit 2 rhythm nodes

### Route registration (CRITICAL: update both arrays)

- `src/App.jsx` — LANDSCAPE_ROUTES[] + lazy import + Route elements
- `src/components/layout/AppLayout.jsx` — gameRoutes[] array

### Game session flow

- `src/components/games/VictoryScreen.jsx` — Post-game results, calls updateExerciseProgress()
- `src/services/skillProgressService.js` — Exercise progress CRUD

### Build validator

- `scripts/validateTrail.mjs` — Extend with mixed_lesson validation rules

### Prior phase context

- `.planning/phases/24-multi-angle-rhythm-games/24-CONTEXT.md` — Phase 24 decisions (all D-01 through D-36)
- `.planning/phases/23-ux-polish/23-CONTEXT.md` — Kodaly syllable decisions, Nikud strings

### Game route registration feedback

- See memory: `feedback_game_routes_dual_array.md` — new game routes need BOTH LANDSCAPE_ROUTES and gameRoutes

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `VisualRecognitionGame.jsx`: Quiz UI with 4 SVG icon cards, progress dots, feedback state — extract into VisualRecognitionQuestion renderer
- `SyllableMatchingGame.jsx`: Quiz UI with large SVG note prompt + 4 text syllable cards — extract into SyllableMatchingQuestion renderer
- `DurationCard.jsx`: Glass-styled card component handling SVG icons, text, tap animation, correct/wrong states, reduced-motion
- `durationInfo.js`: DURATION_INFO lookup table + generateQuestions() for question/distractor generation
- `rhythmVexflowHelpers.js`: Syllable maps (EN/HE) with Nikud
- `useSounds` hook: Existing sound effects for correct/wrong
- `useMotionTokens` hook: Reduced-motion preferences
- `useLandscapeLock` + `useRotatePrompt`: Landscape orientation support

### Established Patterns

- Trail auto-start: `hasAutoStartedRef` pattern in all game components
- Game session flow: idle → in-progress → complete → VictoryScreen
- Exercise navigation: `location.state` with { nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }
- SVG imports: `import Icon from './icon.svg?react'` (vite-plugin-svgr)
- Glass card pattern: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`
- Progress bar pattern: track `bg-white/15`, fill with color gradient

### Integration Points

- `constants.js` EXERCISE_TYPES: add MIXED_LESSON
- `TrailNodeModal.jsx`: add exercise type name + navigate case for mixed_lesson
- `App.jsx` LANDSCAPE_ROUTES + route definitions: new lazy-loaded route
- `AppLayout.jsx` gameRoutes: new path for sidebar/header hiding
- `validateTrail.mjs`: validation rules for mixed_lesson question configs
- Node unit files: may add mixed_lesson exercises to qualifying nodes

</code_context>

<specifics>
## Specific Ideas

- The mixed lesson is a Duolingo-style interleaved session — the child doesn't know they're switching between "games," it just feels like a continuous lesson with varied questions
- 8-10 questions gives enough variety to interleave 2+ question types multiple times
- Progress bar (not dots) emphasizes the lesson metaphor over the quiz metaphor
- Crossfade between question types makes the transition feel seamless rather than jarring
- Renderers are stateless — they receive a question, render it, and call back with the answer. The engine manages all state.

</specifics>

<deferred>
## Deferred Ideas

- **Rhythm tap as a renderer** — Future: extract MetronomeTrainer quiz flow into a RhythmTapQuestion renderer so mixed lessons can include tap-along questions too
- **Treble/Bass mixed lessons** — Architecture supports future note_recognition and sight_reading renderers for pitch-based nodes
- **Adaptive difficulty** — Engine could adjust question difficulty mid-lesson based on accuracy. Not for v1.
- **Free practice mixed lessons** — Add mixed lesson to practice modes grid for non-trail play

</deferred>

---

_Phase: 25-unified-mixed-lesson-engine-for-trail-nodes_
_Context gathered: 2026-04-09_
