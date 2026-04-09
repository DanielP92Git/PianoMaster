# Phase 24: Multi-Angle Rhythm Games — Research

**Researched:** 2026-04-09
**Domain:** React quiz-style game components, SVG sprite assets, trail system integration, rhythm pedagogy
**Confidence:** HIGH (all critical paths verified against live codebase)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Game Mechanics**

- D-01: Visual Recognition — "Which one is a quarter note?" text prompt + 4 SVG icon cards in 2x2 grid (portrait) / 1x4 row (landscape). Child taps the correct card.
- D-02: Syllable Matching — Large SVG note in glass panel at top + "What syllable is this?" + 4 text cards with Kodaly syllables below.
- D-03: 5 questions per exercise (not 10).
- D-04: No lives system — child always finishes all 5 questions. Score = percentage correct → stars (60%=1, 80%=2, 95%=3).
- D-05: Correct → green flash + success chime, auto-advance 0.8s. Wrong → red tap + green correct highlight + buzz, auto-advance 1.2s.
- D-06: Rests included (quarter rest, half rest, whole rest). Rest syllable = 'sh' (EN) / 'הָס' (HE).
- D-07: Progress indicator: dot progress bar (5 dots at top).
- D-08: Question pool from node's rhythmConfig durations. Distractors from global pool minus correct answer, randomly pick 3.
- D-09: Trail-only — no free practice mode entry point.
- D-10: Full i18n from start — English + Hebrew with Nikud. Phase 23 syllable mappings reused.

**Card Rendering**

- D-11: Note icon only (no staff lines). Static SVG sprite files — no VexFlow rendering per card.
- D-12: Custom-designed SVG sprites stored in `src/assets/icons/rhythm/`. White fill on glass background.
- D-13: SVG sprite list: quarter-note, half-note, whole-note, eighth-note, sixteenth-note, dotted-quarter, dotted-half, quarter-rest, half-rest, whole-rest.
- D-14: Eighth note = single with flag. Syllable = 'ti'. Sixteenth = single with double flag. Syllable = 'ti-ka'.
- D-15: Card layout: 2x2 grid portrait, 1x4 row landscape.
- D-16: Card sizing: min 80px per side, fill available space. ~170px portrait, ~320px landscape.
- D-17: No text labels on Visual Recognition cards — icons only. No duration name on Syllable Matching prompt — SVG only.
- D-18: Glass card styling: bg-white/10, border-white/20. Tap animation: scale(0.95) + color flash. Reduced-motion: skip scale, color only.
- D-19: Screen layout (top to bottom): progress dots → question/prompt → answer cards.
- D-20: Syllable Matching prompt: large SVG note in glass panel + "What syllable is this?" text below, then 2x2 text answer cards.
- D-21: Syllable Matching text cards: glass-styled with large centered syllable text.

**Trail Node Wiring**

- D-22: Two new EXERCISE_TYPES: `VISUAL_RECOGNITION: 'visual_recognition'` and `SYLLABLE_MATCHING: 'syllable_matching'`.
- D-23: Target nodes: low-variety rhythm nodes with ≤2 unique non-rest durations. Approximately 8-12 nodes across Units 1-2.
- D-24: Exercise order: rhythm_tap [0] → visual_recognition [1] → syllable_matching [2].
- D-25: Exercise config shape: `{ type: EXERCISE_TYPES.VISUAL_RECOGNITION, config: { questionCount: 5 } }`. Game reads node's rhythmConfig for duration pool.
- D-26: Build validator (validateTrail.mjs) extended with multi-angle game validation rules.
- D-27: TrailNodeModal.jsx getExerciseTypeName() switch gets new cases + i18n keys.
- D-28: TrailNodeModal.jsx navigate() switch gets new cases → their route paths.
- D-29: Import syllable mappings from existing `rhythmVexflowHelpers.js` — no duplication.
- D-30: Central DURATION_INFO lookup object mapping VexFlow duration codes → { svg filename, i18n name key, durationUnits, isRest }.
- D-31: Standard progress tracking: VictoryScreen calls updateExerciseProgress(). Node stars = min across all exercises.

**Component Structure**

- D-32: Two separate components: `VisualRecognitionGame.jsx` and `SyllableMatchingGame.jsx`.
- D-33: Located in `src/components/games/rhythm-games/`.
- D-34: Routes: `/rhythm-mode/visual-recognition-game` and `/rhythm-mode/syllable-matching-game`. Added to LANDSCAPE_ROUTES (App.jsx) AND gameRoutes (AppLayout.jsx).
- D-35: Shared `DurationCard.jsx` sub-component in `rhythm-games/components/`. Renders SVG icon or text based on `type` prop.
- D-36: `DURATION_INFO` lookup in `rhythm-games/utils/durationInfo.js`.

### Claude's Discretion

- Exact SVG sprite artwork design (proportions, stroke width, visual style)
- Internal quiz state machine implementation
- Sound effect selection for correct/wrong (reuse existing game sounds)
- Test structure and coverage approach
- Exact distractor shuffling algorithm
- Whether to extract shared quiz flow logic into a hook

### Deferred Ideas (OUT OF SCOPE)

- Free practice entry point for Visual Recognition and Syllable Matching
- Similarity-weighted distractors
- Reverse direction Syllable Matching ("syllable → pick note")
  </user_constraints>

---

## Summary

Phase 24 adds two quiz-style mini-games to the rhythm trail: Visual Recognition (pick the correct note icon from 4 SVG cards) and Syllable Matching (pick the correct Kodaly syllable for a shown note). Both games are trail-only exercises that slot into low-variety rhythm nodes (≤2 non-rest durations) in Units 1 and 2 at exercise positions [1] and [2] after the existing rhythm_tap exercise.

The implementation follows closely established patterns in the codebase. The nearest analogues are `NotesRecognitionGame.jsx` (4-option quiz with trail integration) and `DictationChoiceCard.jsx` (selectable glass card with state classes). The primary new work is: (1) creating 10 SVG sprite files from scratch, (2) writing two new game components with simple quiz state machines, (3) adding a shared DurationCard sub-component, (4) wiring two new EXERCISE_TYPES throughout the trail system (constants, TrailNodeModal navigation, App/AppLayout routes), and (5) adding exercises to ~9 qualifying rhythm nodes in Units 1-2, and (6) extending validateTrail.mjs.

**Primary recommendation:** Implement in this order — SVG sprites first (needed by both games), then DurationCard + durationInfo.js, then VisualRecognitionGame, then SyllableMatchingGame, then trail wiring (EXERCISE_TYPES, routes, modal, node unit files, validator).

---

## Standard Stack

### Core (all already installed — no new dependencies)

| Library             | Version | Purpose                      | Why Standard                   |
| ------------------- | ------- | ---------------------------- | ------------------------------ |
| React 18            | 18.x    | Component framework          | Project standard               |
| Tailwind CSS 3      | 3.x     | Styling                      | Project design system          |
| react-router-dom v7 | 7.x     | Navigation + location.state  | Trail navigation pattern       |
| react-i18next       | current | i18n (EN + Hebrew)           | Project standard               |
| framer-motion       | current | Animation (useReducedMotion) | `useMotionTokens` hook uses it |

**No new npm installs required.** [VERIFIED: codebase scan — all dependencies present in existing game components]

### Supporting Utilities (already exist, import directly)

| Utility                 | Path                                                 | Purpose                                    |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `useSounds`             | `src/features/games/hooks/useSounds.js`              | correct/wrong/victory chimes               |
| `useMotionTokens`       | `src/utils/useMotionTokens.js`                       | reduced-motion-aware animation tokens      |
| `useLandscapeLock`      | `src/hooks/useLandscapeLock.js`                      | Android PWA landscape lock                 |
| `useRotatePrompt`       | `src/hooks/useRotatePrompt.js`                       | iOS rotate prompt                          |
| `RotatePromptOverlay`   | `src/components/orientation/RotatePromptOverlay.jsx` | iOS rotate UI                              |
| `useSafeSessionTimeout` | `src/contexts/SessionTimeoutContext.jsx`             | inactivity timer pause/resume              |
| `VictoryScreen`         | `src/components/games/VictoryScreen.jsx`             | post-game results, XP, trail progress      |
| `BackButton`            | `src/components/ui/BackButton.jsx`                   | back navigation                            |
| SYLLABLE_MAP_EN/HE      | `rhythm-games/utils/rhythmVexflowHelpers.js`         | Kodaly syllables — import, don't duplicate |

[VERIFIED: all paths confirmed by codebase read]

---

## Architecture Patterns

### Recommended File Structure (new files this phase)

```
src/
├── assets/icons/rhythm/              # NEW — SVG sprite directory
│   ├── quarter-note.svg
│   ├── half-note.svg
│   ├── whole-note.svg
│   ├── eighth-note.svg
│   ├── sixteenth-note.svg
│   ├── dotted-quarter.svg
│   ├── dotted-half.svg
│   ├── quarter-rest.svg
│   ├── half-rest.svg
│   └── whole-rest.svg
├── components/games/rhythm-games/
│   ├── VisualRecognitionGame.jsx     # NEW — main game component
│   ├── SyllableMatchingGame.jsx      # NEW — main game component
│   └── components/
│       └── DurationCard.jsx          # NEW — shared card sub-component
└── utils/
    └── durationInfo.js               # NEW — DURATION_INFO lookup table
```

Modified files:

- `src/data/constants.js` — add VISUAL_RECOGNITION + SYLLABLE_MATCHING to EXERCISE_TYPES
- `src/components/trail/TrailNodeModal.jsx` — getExerciseTypeName() + navigate() switches
- `src/App.jsx` — LANDSCAPE_ROUTES array + lazy imports + Route elements
- `src/components/layout/AppLayout.jsx` — gameRoutes array
- `src/data/units/rhythmUnit1Redesigned.js` — add exercises to qualifying nodes
- `src/data/units/rhythmUnit2Redesigned.js` — add exercises to qualifying nodes
- `src/locales/en/trail.json` — add exerciseTypes.visual_recognition + exerciseTypes.syllable_matching
- `src/locales/he/trail.json` — same in Hebrew
- `src/locales/en/common.json` — add game.\* i18n keys for game UI strings
- `src/locales/he/common.json` — same in Hebrew
- `scripts/validateTrail.mjs` — extend with multi-angle validation rules

### Pattern 1: Quiz State Machine (for both games)

Both games use a simple linear state machine — no complex audio engine needed (unlike MetronomeTrainer):

```
idle → in_progress → (per question: show → feedback → advance) → complete → VictoryScreen
```

```javascript
// Source: pattern derived from NotesRecognitionGame.jsx quiz flow
const GAME_STATES = {
  IDLE: "idle",
  IN_PROGRESS: "in_progress",
  QUESTION_FEEDBACK: "question_feedback", // showing correct/wrong before auto-advance
  COMPLETE: "complete",
};

// Core state
const [gameState, setGameState] = useState(GAME_STATES.IDLE);
const [questions, setQuestions] = useState([]); // generated once on start
const [currentIndex, setCurrentIndex] = useState(0);
const [selectedIndex, setSelectedIndex] = useState(null);
const [results, setResults] = useState([]); // true/false per question
```

### Pattern 2: Trail Auto-Start (hasAutoStartedRef)

All trail game components use this pattern. The new games must too:

```javascript
// Source: MetronomeTrainer.jsx lines 125-179 (hasAutoConfigured ref pattern)
const hasAutoStartedRef = useRef(false);
const nodeConfig = location.state?.nodeConfig || null;

useEffect(() => {
  if (nodeConfig && !hasAutoStartedRef.current) {
    hasAutoStartedRef.current = true;
    startGame();
  }
}, [nodeConfig]);
```

The new games don't need audio context checks (no audio engine) — simpler than MetronomeTrainer.

### Pattern 3: VictoryScreen Integration

Pass `score`, `totalPossibleScore`, `nodeId`, `exerciseIndex`, `totalExercises`, `exerciseType`:

```javascript
// Source: VictoryScreen.jsx props + useVictoryState hook pattern
<VictoryScreen
  score={correctCount} // number correct (0–5)
  totalPossibleScore={5} // always 5 for these games
  onReset={handleReset}
  onExit={handleExit}
  nodeId={nodeId}
  exerciseIndex={trailExerciseIndex}
  totalExercises={trailTotalExercises}
  exerciseType={trailExerciseType}
/>
```

No `onNextExercise` callback needed — VictoryScreen uses `useVictoryState` which already handles `updateExerciseProgress()` and "Next Exercise" navigation when `exerciseIndex` is provided.

### Pattern 4: Route Registration (CRITICAL — both arrays)

```javascript
// Source: App.jsx LANDSCAPE_ROUTES + AppLayout.jsx gameRoutes
// In App.jsx OrientationController (line ~260):
const LANDSCAPE_ROUTES = [
  // ...existing routes...
  "/rhythm-mode/visual-recognition-game", // ADD
  "/rhythm-mode/syllable-matching-game", // ADD
];

// In AppLayout.jsx (line ~18):
const gameRoutes = [
  // ...existing routes...
  "/rhythm-mode/visual-recognition-game", // ADD
  "/rhythm-mode/syllable-matching-game", // ADD
];
```

MISSING EITHER causes sidebar/header to show during gameplay. [VERIFIED: CLAUDE.md critical note + App.jsx/AppLayout.jsx source confirmed]

### Pattern 5: Lazy-loaded Route Definition (App.jsx)

```javascript
// Source: App.jsx lines 119-130 (MetronomeTrainer / RhythmReadingGame pattern)
const VisualRecognitionGame = lazyWithRetry(
  () => import("./components/games/rhythm-games/VisualRecognitionGame")
);
const SyllableMatchingGame = lazyWithRetry(
  () => import("./components/games/rhythm-games/SyllableMatchingGame")
);

// In Routes JSX (inside ProtectedRoute):
<Route path="/rhythm-mode/visual-recognition-game" element={<VisualRecognitionGame />} />
<Route path="/rhythm-mode/syllable-matching-game" element={<SyllableMatchingGame />} />
```

### Pattern 6: SVG Import Convention

```javascript
// Source: CLAUDE.md Build Conventions — the ?react suffix is REQUIRED
import QuarterNoteIcon from "../../../assets/icons/rhythm/quarter-note.svg?react";
import HalfNoteIcon from "../../../assets/icons/rhythm/half-note.svg?react";
// etc.
```

### Pattern 7: DurationCard Component (shared)

The `DurationCard` is a simpler version of `DictationChoiceCard`. It renders either:

- An SVG icon (VisualRecognitionGame answer cards + SyllableMatchingGame prompt)
- Text only (SyllableMatchingGame answer cards)

```javascript
// Source: DictationChoiceCard.jsx STATE_CLASSES (reuse exactly, per UI-SPEC)
<DurationCard
  type="icon" // "icon" | "text"
  durationCode="q" // VexFlow duration code — used to pick SVG + aria-label
  syllable="ta" // Only for type="text"
  state="default" // "default" | "correct" | "wrong" | "dimmed"
  onSelect={handleSelect}
  disabled={false}
  cardIndex={0}
/>
```

### Pattern 8: DURATION_INFO Lookup Table

Central lookup mapping VexFlow duration codes to all display info:

```javascript
// Source: CONTEXT.md D-30 + UI-SPEC sprite filename table + rhythmVexflowHelpers.js syllable maps
export const DURATION_INFO = {
  q: {
    svgFilename: "quarter-note",
    i18nKey: "rhythm.duration.quarter",
    durationUnits: 4,
    isRest: false,
  },
  h: {
    svgFilename: "half-note",
    i18nKey: "rhythm.duration.half",
    durationUnits: 8,
    isRest: false,
  },
  w: {
    svgFilename: "whole-note",
    i18nKey: "rhythm.duration.whole",
    durationUnits: 16,
    isRest: false,
  },
  8: {
    svgFilename: "eighth-note",
    i18nKey: "rhythm.duration.eighth",
    durationUnits: 2,
    isRest: false,
  },
  16: {
    svgFilename: "sixteenth-note",
    i18nKey: "rhythm.duration.sixteenth",
    durationUnits: 1,
    isRest: false,
  },
  qd: {
    svgFilename: "dotted-quarter",
    i18nKey: "rhythm.duration.dottedQuarter",
    durationUnits: 6,
    isRest: false,
  },
  hd: {
    svgFilename: "dotted-half",
    i18nKey: "rhythm.duration.dottedHalf",
    durationUnits: 12,
    isRest: false,
  },
  qr: {
    svgFilename: "quarter-rest",
    i18nKey: "rhythm.duration.quarterRest",
    durationUnits: 4,
    isRest: true,
  },
  hr: {
    svgFilename: "half-rest",
    i18nKey: "rhythm.duration.halfRest",
    durationUnits: 8,
    isRest: true,
  },
  wr: {
    svgFilename: "whole-rest",
    i18nKey: "rhythm.duration.wholeRest",
    durationUnits: 16,
    isRest: true,
  },
};
```

### Pattern 9: Question Generation

For Visual Recognition: target = node's focusDurations (or all durations if no focus). Distractors from global pool minus correct answer.

For Syllable Matching: target = all durations in node's rhythmConfig.durations (cycling). Distractors = other duration codes from global pool, filtered to avoid syllable collisions where possible.

```javascript
// Pure function — testable without rendering
export function generateQuestions(durationPool, distractorPool, questionCount) {
  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    const correct = durationPool[i % durationPool.length];
    const distractors = pickDistractors(correct, distractorPool, 3);
    const choices = shuffle([correct, ...distractors]);
    questions.push({ correct, choices });
  }
  return questions;
}
```

### Pattern 10: i18n Trail Exercise Types

Add to both locale files under `exerciseTypes`:

```json
// Source: trail.json exerciseTypes structure (EN: verified)
"exerciseTypes": {
  "visual_recognition": "Visual Recognition",
  "syllable_matching": "Syllable Matching"
}
```

Hebrew values (from UI-SPEC copywriting contract):

```json
"exerciseTypes": {
  "visual_recognition": "זיהוי חזותי",
  "syllable_matching": "התאמת הברות"
}
```

### Pattern 11: Qualifying Node Identification

Analyzing rhythm Unit 1 and Unit 2 nodes, the qualifying nodes (≤2 unique non-rest durations in rhythmConfig.durations) are: [VERIFIED: direct codebase read of rhythmUnit1Redesigned.js and rhythmUnit2Redesigned.js]

**Unit 1 qualifying nodes:**
| Node ID | Name | Durations | Add exercises? |
|---------|------|-----------|----------------|
| rhythm_1_1 | Meet Quarter Notes | ["q"] | YES (1 duration) |
| rhythm_1_2 | Practice Quarter Notes | ["q"] | YES (1 duration) |
| rhythm_1_3 | Meet Half Notes | ["q","h"] | YES (2 durations) |
| rhythm_1_4 | Practice Quarters and Halves | ["q","h"] | YES (2 durations) |
| rhythm_1_5 | Rhythm Patterns | ["q","h"] | YES (2 durations) |
| rhythm_1_6 | Speed Challenge | ["q","h"] | Borderline — Speed Round node; discretion |
| boss_rhythm_1 | Basic Beats Master | ["q","h"] | NO — boss node |

**Unit 2 qualifying nodes:**
| Node ID | Name | Durations | Add exercises? |
|---------|------|-----------|----------------|
| rhythm_2_1 | Meet Whole Notes | ["q","h","w"] | NO — 3 durations |
| rhythm_2_2 | Practice Whole Notes | ["q","h","w"] | NO — 3 durations |
| rhythm_2_3 | Long and Short | ["q","w"] | YES (2 durations) |
| rhythm_2_4 | All Basic Durations | ["q","h","w"] | NO — 3 durations |
| rhythm_2_5 | Duration Mix | ["q","h","w"] | NO — 3 durations |
| rhythm_2_6 | Speed Basics | ["q","h","w"] | NO — 3 durations |
| boss_rhythm_2 | Duration Master | ["q","h","w"] | NO — boss node |

**Confirmed qualifying count: 6 nodes in Unit 1 (excluding Speed Round and boss), 1 in Unit 2 = 7 nodes.** The D-23 estimate of 8-12 was approximate. Whether to include Speed Round (rhythm_1_6) is Claude's discretion — recommend YES for rhythm_1_6 since it has only ["q","h"] and multi-angle reinforcement helps before the boss.

### Anti-Patterns to Avoid

- **Do NOT call `updateExerciseProgress()` directly from the game component.** VictoryScreen / `useVictoryState` handles this automatically when `exerciseIndex` and `nodeId` are passed as props. [VERIFIED: VictoryScreen.jsx + useVictoryState hook]
- **Do NOT render VexFlow in DurationCard.** D-11 is explicit: static SVG sprites only. VexFlow per-card would be expensive and unnecessary.
- **Do NOT skip the `?react` suffix on SVG imports.** vite-plugin-svgr requires it — omitting causes the SVG to be treated as a URL string, not a React component. [VERIFIED: CLAUDE.md Build Conventions]
- **Do NOT add only one of LANDSCAPE_ROUTES or gameRoutes.** Both must be updated or sidebar/header bleeds into gameplay.
- **Do NOT import from `rhythmVexflowHelpers.js` in `validateTrail.mjs`.** The validator runs in Node.js and `rhythmVexflowHelpers.js` imports from vexflow which is browser-only. D-30's `durationInfo.js` must be importable from Node.js (pure JS, no browser deps). [VERIFIED: constants.js file header warns about this same constraint — it must stay free of Vite-specific imports]

---

## Don't Hand-Roll

| Problem                 | Don't Build                       | Use Instead                                       | Why                                                                            |
| ----------------------- | --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Post-game XP + progress | Custom DB calls in game component | VictoryScreen + useVictoryState                   | Already handles updateExerciseProgress, XP, level-up, comeback bonus, confetti |
| Card state CSS classes  | Custom state → class mapping      | DictationChoiceCard.jsx STATE_CLASSES verbatim    | Exact same glassmorphism states; tested in existing game                       |
| Syllable lookup         | Duplicate syllable maps           | `SYLLABLE_MAP_EN/HE` from rhythmVexflowHelpers.js | Phase 23 decisions, user-confirmed Nikud                                       |
| Reduced-motion check    | `useReducedMotion()` directly     | `useMotionTokens` hook                            | Wraps framer-motion, provides typed tokens                                     |
| Route lazy loading      | `React.lazy()` directly           | `lazyWithRetry()` util                            | Auto-reloads on stale chunks after deploy                                      |
| Session inactivity      | Custom idle timer                 | `useSafeSessionTimeout`                           | Child safety; games must pauseTimer during play                                |

---

## Common Pitfalls

### Pitfall 1: Missing Route Registration in One Array

**What goes wrong:** Sidebar/header appears during gameplay, or landscape orientation doesn't lock.
**Why it happens:** LANDSCAPE_ROUTES in App.jsx and gameRoutes in AppLayout.jsx are parallel arrays — both must be updated.
**How to avoid:** Always update both arrays in the same commit. The CLAUDE.md critical note makes this explicit.
**Warning signs:** After implementing, test by navigating to the game from the trail — if sidebar is visible, one array was missed.

### Pitfall 2: SVG Import Without ?react Suffix

**What goes wrong:** Icon renders as `<img src="...">` or blank — no React component, no styling control.
**Why it happens:** vite-plugin-svgr requires the `?react` query suffix to transform SVG → React component.
**How to avoid:** Always `import Icon from './icon.svg?react'`.
**Warning signs:** TypeScript/lint errors about SVG prop types, or SVG renders as broken image in dev.

### Pitfall 3: validateTrail.mjs Importing Browser-Only Code

**What goes wrong:** Build fails with `ReferenceError: document is not defined` or vexflow import errors.
**Why it happens:** validateTrail.mjs runs in Node.js. If durationInfo.js imports SVG files or vexflow, it fails.
**How to avoid:** `durationInfo.js` must be pure JS data — only string/number literals, no imports. Do not import SVG files or any browser-only module from the validator.
**Warning signs:** `npm run build` or `npm run verify:trail` fails with module errors.

### Pitfall 4: Syllable Collision in Distractor Pool

**What goes wrong:** Syllable Matching game presents two answer cards with the same syllable text (e.g., "ta-a" appears for both dotted-quarter and half note).
**Why it happens:** Multiple duration codes map to the same Kodaly syllable (qd and h both = "ta-a"; qr, hr, wr all = "sh").
**How to avoid:** When picking distractors for Syllable Matching, filter by unique syllable text, not just unique duration code. Alternatively, restrict the distractor pool to durations with distinct syllables from the correct answer.
**Warning signs:** Two answer cards show identical text — confusing and unanswerable.

### Pitfall 5: Score Calculation Off-by-One

**What goes wrong:** 5 correct answers shows 1 star instead of 3 because `score / totalPossibleScore` is not normalized to 0-100.
**Why it happens:** VictoryScreen expects `score` and `totalPossibleScore` where the percentage = (score / totalPossibleScore) \* 100. Passing raw counts is correct, but passing a pre-calculated percentage would double-calculate.
**How to avoid:** Pass `score={correctCount}` and `totalPossibleScore={5}`. Let VictoryScreen/useVictoryState compute the percentage. [VERIFIED: VictoryScreen.jsx props + skillProgressService.js calculateStarsFromPercentage]

### Pitfall 6: exercise_progress Field Named 'index' Not 'exerciseIndex'

**What goes wrong:** Progress lookup fails because DB stores `index` field but code uses `exerciseIndex`.
**Why it happens:** Historical naming decision — field in JSONB is `index`.
**How to avoid:** When reading exercise progress records, use `ep.index`, not `ep.exerciseIndex`. [VERIFIED: TrailNodeModal.jsx getExerciseData() uses `ep.index`; project memory note confirms this]

### Pitfall 7: Auto-start Triggers Twice on Re-render

**What goes wrong:** Game starts twice, question generation runs twice, questions get doubled.
**Why it happens:** useEffect with nodeConfig dependency re-fires if component re-renders before ref is set.
**How to avoid:** Follow MetronomeTrainer's `hasAutoConfigured.current = true` pattern at the TOP of the effect body (before any async operations) to gate re-entry. [VERIFIED: MetronomeTrainer.jsx line 159]

---

## Code Examples

### TrailNodeModal navigate() Switch Addition

```javascript
// Source: TrailNodeModal.jsx lines 298-343 — add these two cases
case "visual_recognition":
  navigate("/rhythm-mode/visual-recognition-game", { state: navState });
  break;
case "syllable_matching":
  navigate("/rhythm-mode/syllable-matching-game", { state: navState });
  break;
```

### TrailNodeModal getExerciseTypeName() Switch Addition

```javascript
// Source: TrailNodeModal.jsx lines 28-55 — add these two cases
case "visual_recognition":
  return t("trail:exerciseTypes.visual_recognition");
case "syllable_matching":
  return t("trail:exerciseTypes.syllable_matching");
```

### EXERCISE_TYPES Addition in constants.js

```javascript
// Source: constants.js lines 26-41 — add under v3.2 comment
// v3.2 multi-angle games
VISUAL_RECOGNITION: 'visual_recognition',
SYLLABLE_MATCHING: 'syllable_matching',
```

### Node Exercise Entry (for qualifying Unit 1 nodes)

```javascript
// Source: CONTEXT.md D-24, D-25 — exercise order [0]=rhythm_tap, [1]=visual_recognition, [2]=syllable_matching
// Add to exercises array AFTER existing RHYTHM_TAP exercise:
{
  type: EXERCISE_TYPES.VISUAL_RECOGNITION,
  config: { questionCount: 5 },
},
{
  type: EXERCISE_TYPES.SYLLABLE_MATCHING,
  config: { questionCount: 5 },
},
```

### validateTrail.mjs Extension (multi-angle rules)

```javascript
// Add new validation function for multi-angle exercise rules
function validateMultiAngleGames() {
  console.log("\nChecking multi-angle game exercises...");

  const MULTI_ANGLE_TYPES = ["visual_recognition", "syllable_matching"];

  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      if (MULTI_ANGLE_TYPES.includes(exercise.type)) {
        // Rule 1: must have rhythmConfig
        if (!node.rhythmConfig) {
          console.error(
            `  ERROR: Node "${node.id}" has ${exercise.type} but no rhythmConfig`
          );
          hasErrors = true;
        }
        // Rule 2: config.questionCount > 0
        if (
          !exercise.config?.questionCount ||
          exercise.config.questionCount <= 0
        ) {
          console.error(
            `  ERROR: Node "${node.id}" exercise ${exercise.type} has invalid questionCount`
          );
          hasErrors = true;
        }
      }
    }
    // Rule 3: low-variety nodes must include at least one multi-angle game
    if (node.category === "rhythm" && node.rhythmConfig?.durations) {
      const nonRestDurations = node.rhythmConfig.durations.filter(
        (d) => !d.includes("r")
      );
      if (nonRestDurations.length <= 2 && !node.isBoss) {
        const hasMultiAngle = node.exercises?.some((e) =>
          MULTI_ANGLE_TYPES.includes(e.type)
        );
        if (!hasMultiAngle) {
          console.warn(
            `  WARNING: Low-variety node "${node.id}" (${nonRestDurations.length} durations) has no multi-angle game`
          );
          // Warning not error — some speed/boss nodes may intentionally skip
        }
      }
    }
  }
}
```

### SVG Sprite Structure (quarter-note.svg example)

```xml
<!-- viewBox 64x96, white fill, no staff lines, stem up -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 96" fill="none">
  <!-- Filled note head: ellipse at bottom -->
  <ellipse cx="24" cy="82" rx="12" ry="9" fill="white" transform="rotate(-20 24 82)"/>
  <!-- Stem: vertical line from head to top -->
  <line x1="36" y1="76" x2="36" y2="20" stroke="white" stroke-width="3" stroke-linecap="round"/>
</svg>
```

Spec from UI-SPEC: viewBox 64x96, stroke-width 3px for stems/flags, solid fill for note heads, open ellipse for half/whole, rectangle for rests. [VERIFIED: 24-UI-SPEC.md SVG sprite visual spec section]

---

## State of the Art

| Old Approach                 | Current Approach                      | Impact for This Phase                                          |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| VexFlow per card (expensive) | Static SVG sprites (D-11)             | No runtime rendering cost per card — instant display           |
| 10 questions per exercise    | 5 questions (D-03)                    | Keeps total node time ~3-4 min across 3 exercises              |
| Lives system                 | No lives — always finish all 5 (D-04) | Reduces frustration for 8-year-old; stars still reward mastery |

---

## Runtime State Inventory

Step 2.5 SKIPPED — this is a greenfield addition phase, not a rename/refactor. No existing string identifiers are being changed. New EXERCISE_TYPES values ('visual_recognition', 'syllable_matching') are net-new; no existing DB records reference them.

---

## Environment Availability

Step 2.6: Core tools confirmed available — this phase requires no external dependencies beyond the existing project stack. All npm packages are already installed. SVG editing may be done in-process (hand-crafted SVG markup). No new CLI tools, services, or runtimes required.

| Dependency       | Required By        | Available         | Notes                                             |
| ---------------- | ------------------ | ----------------- | ------------------------------------------------- |
| vite-plugin-svgr | SVG sprite imports | Already installed | `?react` suffix pattern already used project-wide |
| Vitest           | Tests              | Already installed | `npm run test:run` working                        |
| Tailwind CSS 3   | Component styling  | Already installed |                                                   |

---

## Validation Architecture

### Test Framework

| Property           | Value                                               |
| ------------------ | --------------------------------------------------- |
| Framework          | Vitest + @testing-library/react                     |
| Config file        | vite.config.js (vitest config inline)               |
| Quick run command  | `npx vitest run src/components/games/rhythm-games/` |
| Full suite command | `npm run test:run`                                  |

### Phase Requirements → Test Map

The two new game components expose pure functions that can be tested without DOM rendering (following the rhythm-games convention seen in RhythmReadingGame.test.js, ArcadeRhythmGame.test.js):

| Behavior                                                                      | Test Type | Automated Command                                                                     | File Exists? |
| ----------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------- | ------------ |
| `generateQuestions()` — correct answer always in choices                      | unit      | `npx vitest run src/components/games/rhythm-games/VisualRecognitionGame.test.js`      | Wave 0       |
| `generateQuestions()` — exactly 3 distractors, none equal to correct          | unit      | same                                                                                  | Wave 0       |
| `generateQuestions()` — cycling through duration pool                         | unit      | same                                                                                  | Wave 0       |
| `DURATION_INFO` — all 10 entries present, valid shape                         | unit      | `npx vitest run src/components/games/rhythm-games/utils/durationInfo.test.js`         | Wave 0       |
| Score calculation — 5/5 = 3 stars, 4/5 = 2 stars, 3/5 = 1 star, 2/5 = 0 stars | unit      | same file                                                                             | Wave 0       |
| Trail validator — visual_recognition without rhythmConfig errors              | unit      | `npx vitest run scripts/validateTrail.test.mjs` (if exists) or `npm run verify:trail` | existing     |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/games/rhythm-games/`
- **Per wave merge:** `npm run test:run && npm run verify:trail`
- **Phase gate:** Full suite green + `npm run build` succeeds (prebuild runs validateTrail)

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/VisualRecognitionGame.test.js` — covers question generation pure functions
- [ ] `src/components/games/rhythm-games/utils/durationInfo.test.js` — covers DURATION_INFO completeness

_(Existing test infrastructure covers trail validator and rhythm utilities — only new test files needed for new pure functions)_

---

## Security Domain

This phase adds no authentication, authorization, network calls, or user input beyond tap selection. Security domain is minimal:

| ASVS Category       | Applies               | Control                                      |
| ------------------- | --------------------- | -------------------------------------------- |
| V5 Input Validation | Low — tap index (0-3) | Bounds-check cardIndex before processing     |
| V4 Access Control   | Inherited             | Trail-only route; existing auth guards apply |
| All others          | No                    | No new data storage, crypto, or auth flows   |

No new Supabase queries introduced. VictoryScreen handles the DB write (updateExerciseProgress) via the existing skillProgressService which already has RLS + auth verification. [VERIFIED: skillProgressService.js uses verifyStudentDataAccess]

---

## Assumptions Log

All critical claims were verified against the live codebase. No high-risk assumptions remain.

| #   | Claim                                                                                               | Section           | Risk if Wrong                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| A1  | rhythm_1_6 (Speed Challenge) benefits from multi-angle games despite being SPEED_ROUND type         | Qualifying Nodes  | Low risk — skip it if planner determines speed-round nodes should stay single-exercise                             |
| A2  | Hebrew exercise type labels (זיהוי חזותי / התאמת הברות) are accurate translations                   | i18n              | Low — user reviews Hebrew before merging; existing Hebrew locale has mix of translated/untranslated exercise types |
| A3  | validateTrail.mjs low-variety warning (not error) for nodes missing multi-angle is the right policy | Validator pattern | Low — could be promoted to error; planner can decide                                                               |

**If this table is short:** Most decisions were locked in CONTEXT.md and verified directly in the codebase. The three assumptions above are all low-risk judgment calls, not factual unknowns.

---

## Open Questions

1. **Should rhythm_1_6 (Speed Challenge, SPEED_ROUND type) get multi-angle exercises?**
   - What we know: It has ["q","h"] — qualifies by duration count. SPEED_ROUND nodes are meant for fast-paced challenge.
   - What's unclear: Does adding visual_recognition/syllable_matching to a SPEED_ROUND node fit pedagogically? Or should speed rounds stay single-exercise?
   - Recommendation: Include it. The exercise_sequence [rhythm_tap → visual_recognition → syllable_matching] still works; the speed challenge comes from the ARCADE_RHYTHM exercise within rhythm_tap config.

2. **The `rhythm_1_1` node has two existing exercises (RHYTHM_PULSE + RHYTHM_TAP). Adding visual_recognition and syllable_matching would make it a 4-exercise node.**
   - What we know: RHYTHM_PULSE is 8 beats of pulse-only (very short). Adding 2 more exercises is consistent with D-24.
   - What's unclear: Does a 4-exercise node feel too long for the very first node?
   - Recommendation: Include all 4 — pulse is very short (< 1 min), and having rhythm_1_1 be the most thorough introduction node is pedagogically sound.

---

## Sources

### Primary (HIGH confidence — codebase verified)

- `src/data/constants.js` — EXERCISE_TYPES enum (confirmed existing values, insertion point)
- `src/components/trail/TrailNodeModal.jsx` — getExerciseTypeName() switch at line 28, navigate() switch at line 298
- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — SYLLABLE_MAP_EN/HE, REST_SYLLABLE_EN/HE, DURATION_TO_VEX
- `src/components/games/rhythm-games/components/DictationChoiceCard.jsx` — STATE_CLASSES, card pattern
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — hasAutoConfigured ref pattern (lines 125-179)
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — 4-option quiz flow reference
- `src/data/units/rhythmUnit1Redesigned.js` — all 7 nodes with full rhythmConfig
- `src/data/units/rhythmUnit2Redesigned.js` — all 7 nodes with full rhythmConfig
- `src/components/games/VictoryScreen.jsx` — props interface
- `src/App.jsx` — LANDSCAPE_ROUTES array (line 260-271), lazy import patterns
- `src/components/layout/AppLayout.jsx` — gameRoutes array (line 18-29)
- `scripts/validateTrail.mjs` — validation function patterns
- `.planning/phases/24-multi-angle-rhythm-games/24-UI-SPEC.md` — SVG spec, typography, interaction contract
- `.planning/phases/24-multi-angle-rhythm-games/24-CONTEXT.md` — all D-\* decisions

### Secondary (MEDIUM confidence — training + codebase corroboration)

- `src/locales/en/trail.json` — exerciseTypes structure (verified via Node.js eval)
- `src/locales/he/trail.json` — exerciseTypes Hebrew values (verified; several entries still in English)
- `src/features/games/hooks/useSounds.js` — sound file names and hook interface

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; all existing
- Architecture: HIGH — patterns copied from verified existing components
- Qualifying nodes: HIGH — read directly from unit files
- SVG sprite spec: HIGH — from 24-UI-SPEC.md
- i18n keys: HIGH — verified against live locale files
- Pitfalls: HIGH — derived from actual code constraints (validator Node.js constraint, dual-array route registration)

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase; 30-day window)
