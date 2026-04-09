# Phase 25: Unified Mixed Lesson Engine for Trail Nodes - Research

**Researched:** 2026-04-09
**Domain:** React game engine architecture, renderer extraction, trail system integration
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Renderer Extraction**

- D-01: Extract quiz UI from VisualRecognitionGame and SyllableMatchingGame into stateless renderers: `VisualRecognitionQuestion` and `SyllableMatchingQuestion`. These renderers receive a question + node skills and call back with the answer.
- D-02: Extracted renderers live in `src/components/games/rhythm-games/renderers/`.
- D-03: Existing standalone games become thin wrappers around the renderers — no breaking changes to standalone routes.
- D-04: Reuse existing building blocks: DurationCard, generateQuestions(), DURATION_INFO, syllable maps from rhythmVexflowHelpers.js.

**Lesson Sequence Schema**

- D-05: New exercise type `MIXED_LESSON: 'mixed_lesson'` added to EXERCISE_TYPES in constants.js.
- D-06: Sequence defined inline as a `mixed_lesson` exercise with a `questions[]` config array (type strings only).
- D-07: Questions always inherit node's rhythmConfig durations — no per-question overrides.
- D-08: 8-10 questions per mixed lesson. Authored per-node.
- D-09: Pre-structured sequences, not random.

**Session UX & Transitions**

- D-10: Horizontal progress bar at top (green fill on glass track `bg-white/15` / `bg-green-400`). Fraction text "3/10".
- D-11: Smooth crossfade (~300ms) between question types. Feedback flash first, then crossfade.
- D-12: Single score across all questions: correct/total → percentage → stars (60%=1, 80%=2, 95%=3).
- D-13: Per-question feedback same as standalone: green correct flash + chime (0.8s), red wrong + highlight + buzz (1.2s).
- D-14: Reduced-motion: skip crossfade, instant swap. Color feedback still shows.

**Standalone Coexistence**

- D-15: Both standalone and mixed exercise types coexist. No forced migration.
- D-16: Standalone routes remain functional. Phase 24 wiring untouched.
- D-17: New route `/rhythm-mode/mixed-lesson`. Added to BOTH `LANDSCAPE_ROUTES` (App.jsx) AND `gameRoutes` (AppLayout.jsx).
- D-18: TrailNodeModal.jsx: add navigate case for `mixed_lesson` → `/rhythm-mode/mixed-lesson`.

### Claude's Discretion

- Migration scope: which nodes (if any) to convert from standalone to mixed_lesson
- MixedLessonGame internal state machine implementation
- Whether to extract a shared quiz engine hook
- Crossfade animation implementation details
- Test structure and coverage approach
- Build validator extensions for mixed_lesson type

### Deferred Ideas (OUT OF SCOPE)

- Rhythm tap as a renderer
- Treble/Bass mixed lessons
- Adaptive difficulty mid-lesson
- Free practice mixed lessons
  </user_constraints>

---

## Summary

Phase 25 builds a `MixedLessonGame` component that orchestrates multiple question types in a single Duolingo-style session. The key engineering challenge is extracting stateless question renderers from the Phase 24 standalone games without breaking those games, then wiring a new engine component that sequences the renderers with crossfade transitions and a unified progress bar.

The architecture is straightforward because the existing Phase 24 games have already established clean separation between question data (from `generateQuestions()`) and answer rendering (in `DurationCard`). The extraction is mostly pulling the "render a question" JSX out of each game's return statement into a dedicated renderer component that accepts `{ question, cardStates, isLandscape, onSelect, disabled }` and renders the appropriate UI.

The trail integration follows the exact same pattern as Phase 24: add the exercise type to constants.js, add a navigate case to TrailNodeModal, register the route in App.jsx and AppLayout.jsx. The only new consideration is the `mixed_lesson` config schema — the `questions[]` array is validated at build time by extending validateTrail.mjs.

**Primary recommendation:** Extract renderers first (smallest diff, no behavior change), then build MixedLessonGame as a new self-contained component. Refactor standalone games to use renderers in the same wave.

---

## Standard Stack

### Core (all verified in codebase — no new libraries needed)

| Library         | Version | Purpose                                         | Why Standard                               |
| --------------- | ------- | ----------------------------------------------- | ------------------------------------------ |
| React 18        | 18.x    | Component model, state, hooks                   | Project standard [VERIFIED: package.json]  |
| React Router v7 | 7.x     | Route registration, `useLocation`/`useNavigate` | All games use it [VERIFIED: codebase]      |
| react-i18next   | current | EN/HE translation                               | All games use it [VERIFIED: codebase]      |
| Tailwind CSS 3  | 3.x     | Styling, glassmorphism classes                  | Project design system [VERIFIED: codebase] |

### Supporting (reused from Phase 24 — no new installs)

| Component/Utility     | Source File                                  | What It Provides                                                             |
| --------------------- | -------------------------------------------- | ---------------------------------------------------------------------------- |
| `DurationCard`        | `rhythm-games/components/DurationCard.jsx`   | Glass card with 4 states (default/correct/wrong/dimmed), icon and text modes |
| `generateQuestions()` | `rhythm-games/utils/durationInfo.js`         | Question + distractor generation from duration pool                          |
| `DURATION_INFO`       | `rhythm-games/utils/durationInfo.js`         | VexFlow code → display metadata (i18nKey, durationUnits, isRest)             |
| `ALL_DURATION_CODES`  | `rhythm-games/utils/durationInfo.js`         | Full distractor pool                                                         |
| `SVG_COMPONENTS`      | `rhythm-games/components/DurationCard.jsx`   | Duration code → SVG component map                                            |
| `SYLLABLE_MAP_EN/HE`  | `rhythm-games/utils/rhythmVexflowHelpers.js` | Kodaly syllables with Nikud                                                  |
| `REST_SYLLABLE_EN/HE` | `rhythm-games/utils/rhythmVexflowHelpers.js` | Rest syllable strings                                                        |
| `useSounds`           | `features/games/hooks/useSounds`             | `playCorrectSound`, `playWrongSound`                                         |
| `useMotionTokens`     | `utils/useMotionTokens`                      | `reduce` flag for reduced-motion                                             |
| `useLandscapeLock`    | `hooks/useLandscapeLock`                     | Android PWA orientation lock                                                 |
| `useRotatePrompt`     | `hooks/useRotatePrompt`                      | iOS rotate prompt state                                                      |
| `VictoryScreen`       | `components/games/VictoryScreen.jsx`         | Post-game results, XP, trail progress                                        |
| `BackButton`          | `components/ui/BackButton`                   | Consistent back navigation                                                   |
| `RotatePromptOverlay` | `components/orientation/RotatePromptOverlay` | iOS landscape prompt                                                         |

**Installation:** No new packages required. All dependencies already present.

---

## Architecture Patterns

### Recommended File Structure

```
src/components/games/rhythm-games/
├── renderers/                          # NEW — stateless question renderers
│   ├── VisualRecognitionQuestion.jsx   # Extracted from VisualRecognitionGame
│   └── SyllableMatchingQuestion.jsx    # Extracted from SyllableMatchingGame
├── MixedLessonGame.jsx                 # NEW — the orchestrating engine
├── VisualRecognitionGame.jsx           # REFACTORED — thin wrapper using renderer
└── SyllableMatchingGame.jsx            # REFACTORED — thin wrapper using renderer
```

### Pattern 1: Stateless Renderer Contract

Each renderer is a pure presentational component. It knows nothing about session state, timers, or navigation.

**Props contract (both renderers):**

```jsx
// VisualRecognitionQuestion.jsx
// Source: extracted from VisualRecognitionGame.jsx renderCards() + prompt
function VisualRecognitionQuestion({
  question,          // { correct: string, choices: string[] }
  cardStates,        // ['default','default','default','default']
  isLandscape,       // boolean
  onSelect,          // (cardIndex: number) => void
  disabled,          // boolean — true during feedback phase
})

// SyllableMatchingQuestion.jsx
// Source: extracted from SyllableMatchingGame.jsx renderCards() + renderPromptPanel()
function SyllableMatchingQuestion({
  question,          // { correct: string, choices: string[] }
  cardStates,        // ['default','default','default','default']
  isLandscape,       // boolean
  onSelect,          // (cardIndex: number) => void
  disabled,          // boolean
})
// Note: SyllableMatchingQuestion needs i18n internally (getSyllable logic uses i18n.language)
```

**What renderers contain:**

- The card grid JSX (`renderCards()` from existing games)
- The prompt panel JSX (`renderPromptPanel()` for syllable, prompt text for visual)
- Landscape vs portrait layout branching

**What renderers do NOT contain:**

- `useState` for score/session
- `useEffect` for timers
- `useNavigate`/`useLocation`
- VictoryScreen
- `useSounds` (sounds stay in the engine)
- `useLandscapeLock` / `useRotatePrompt` (orientation stays in the engine)

### Pattern 2: MixedLessonGame State Machine

The engine holds all session state. The state machine is nearly identical to the standalone games but operates over a flat list of engine-generated questions tagged by type.

```
IDLE → IN_PROGRESS → FEEDBACK → IN_PROGRESS (loop) → COMPLETE
```

**Session question structure (engine-internal):**

```javascript
// Each item in the engine's questions array
{
  type: 'visual_recognition' | 'syllable_matching',
  correct: string,          // duration code
  choices: string[],        // 4 choices
}
```

**Engine question generation:**

The engine reads `exercise.config.questions[]` from the node config (the authored sequence), then for each entry calls `generateQuestions()` to produce one question of that type. This is a 1:1 mapping: 8 entries → 8 questions.

```javascript
// Pseudocode for question pre-generation at startGame()
const allQuestions = nodeConfig.questions.map((entry) => {
  const generated = generateQuestions(durationPool, ALL_DURATION_CODES, 1, {
    dedupSyllables: entry.type === "syllable_matching",
  });
  return { type: entry.type, ...generated[0] };
});
```

**State variables:**

```javascript
const [gameState, setGameState] = useState("idle"); // idle|in_progress|feedback|complete
const [questions, setQuestions] = useState([]); // pre-generated full sequence
const [currentIndex, setCurrentIndex] = useState(0); // 0-based index into questions
const [results, setResults] = useState([]); // boolean[] per question
const [cardStates, setCardStates] = useState([
  "default",
  "default",
  "default",
  "default",
]);
const [fadeKey, setFadeKey] = useState(0); // incremented on question type change to trigger crossfade
```

### Pattern 3: Crossfade Between Question Types

**When to animate:** When the question type changes between currentIndex and currentIndex+1.

**CSS approach (no new libraries):**

```css
/* Add to index.css or use Tailwind animate-fadeIn */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.animate-fadeIn {
  animation: fadeIn 300ms ease-in-out;
}
```

**Implementation:** The renderer wrapper div uses `key={fadeKey}`. When transitioning to a question of a different type, increment `fadeKey` in the timeout callback. When staying in the same type, leave `fadeKey` unchanged (no animation). With `reducedMotion`, skip `animate-fadeIn` class.

```javascript
// In the auto-advance timeout:
const nextQuestion = questions[nextIndex];
const currentQuestion = questions[currentIndex];
const typeChanged = nextQuestion?.type !== currentQuestion.type;
if (typeChanged && !reducedMotion) {
  setFadeKey((k) => k + 1);
}
```

This is consistent with how `animate-fadeIn` is already used in `VisualRecognitionGame.jsx` and `SyllableMatchingGame.jsx` (their outer container `div` already has `animate-fadeIn`). [VERIFIED: codebase]

### Pattern 4: Progress Bar (Duolingo-style)

Replaces progress dots. Fraction text "3/10" alongside.

```jsx
// Track + fill + label
<div className="flex flex-1 items-center gap-3">
  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
    <div
      className="h-full rounded-full bg-green-400 transition-all duration-300"
      style={{ width: `${(currentIndex / questions.length) * 100}%` }}
    />
  </div>
  <span className="whitespace-nowrap text-sm font-medium text-white/70">
    {currentIndex}/{questions.length}
  </span>
</div>
```

D-10 specifies: `bg-white/15` track, `bg-green-400` fill. [VERIFIED: context decisions]

### Pattern 5: Standalone Game Refactoring (Thin Wrapper)

After renderer extraction, `VisualRecognitionGame` becomes:

```jsx
// VisualRecognitionGame.jsx after refactor — all session logic stays here
// Only change: replace inline renderCards()/prompt JSX with renderer component

import VisualRecognitionQuestion from "./renderers/VisualRecognitionQuestion";

// In the render section:
<VisualRecognitionQuestion
  question={currentQuestion}
  cardStates={cardStates}
  isLandscape={isLandscape}
  onSelect={handleSelect}
  disabled={gameState === GAME_STATES.FEEDBACK}
/>;
```

The standalone game retains: all `useState`, `useEffect`, VictoryScreen, `useSounds`, orientation hooks, `hasAutoStartedRef`, `buildDurationPool`, `startGame`, `handleSelect`, error state, back button, and progress dots. Only the JSX for cards/prompt moves into the renderer.

### Pattern 6: Trail Integration (exercise type → route)

Following the established pattern in `TrailNodeModal.jsx`:

```javascript
// Add to getExerciseTypeName switch:
case 'mixed_lesson':
  return t('trail:exerciseTypes.mixed_lesson');

// Add to navigateToExercise switch:
case 'mixed_lesson':
  navigate('/rhythm-mode/mixed-lesson', { state: navState });
  break;
```

`navState` is identical to other exercise types: `{ nodeId, nodeConfig, exerciseIndex, totalExercises, exerciseType }`. The `nodeConfig` will be the mixed_lesson exercise's config (containing `questions[]`).

### Pattern 7: Node Data Schema

```javascript
// In unit file (e.g., rhythmUnit1Redesigned.js)
{
  type: EXERCISE_TYPES.MIXED_LESSON,
  config: {
    questions: [
      { type: 'visual_recognition' },
      { type: 'syllable_matching' },
      { type: 'visual_recognition' },
      { type: 'syllable_matching' },
      { type: 'visual_recognition' },
      { type: 'syllable_matching' },
      { type: 'visual_recognition' },
      { type: 'syllable_matching' },
    ]
  }
}
```

Durations come from node's `rhythmConfig` — same `buildDurationPool()` logic as standalone games. No per-question config overrides needed (D-07).

### Anti-Patterns to Avoid

- **Renderer with state:** Renderers must be pure presentational — no `useState`, no `useEffect`, no hooks except `useTranslation` and `useMotionTokens`.
- **Per-question duration override:** D-07 explicitly locks duration source to node's rhythmConfig.
- **Separate route per question type within the engine:** The engine renders different question types in-place — no navigate() calls mid-session.
- **Changing standalone game behavior:** Standalone routes must continue to work exactly as before Phase 25.
- **Random question order:** D-09 locks sequences as authored, not shuffled.

---

## Don't Hand-Roll

| Problem             | Don't Build              | Use Instead                                                        | Why                                                                              |
| ------------------- | ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Question generation | Custom distractor picker | `generateQuestions()` from durationInfo.js                         | Already handles syllable dedup, Fisher-Yates shuffle, and pool cycling           |
| Card rendering      | New card component       | `DurationCard` from DurationCard.jsx                               | Already has all 4 states, reduced-motion, keyboard/touch handling, accessibility |
| Sound effects       | Audio API calls          | `useSounds()` hook                                                 | Already provides `playCorrectSound`/`playWrongSound` with correct timing         |
| Post-game results   | Custom victory UI        | `VictoryScreen` with standard props                                | Already handles XP, stars, trail progress, multi-exercise navigation             |
| Crossfade animation | CSS transitions library  | React `key` prop + existing `animate-fadeIn` CSS                   | Already defined in index.css, used by existing games                             |
| Syllable lookup     | Custom syllable map      | `SYLLABLE_MAP_EN/HE` + `REST_SYLLABLE_*` from rhythmVexflowHelpers | Hebrew Nikud already verified by user — do not duplicate                         |
| Duration metadata   | New lookup table         | `DURATION_INFO` from durationInfo.js                               | Node-safe (no VexFlow import), already used everywhere                           |

**Key insight:** Phase 24 already solved the hard problems. Phase 25 is orchestration, not invention.

---

## Common Pitfalls

### Pitfall 1: Missing from BOTH route arrays

**What goes wrong:** Route is added to App.jsx but not AppLayout.jsx (or vice versa), causing sidebar/header to show during gameplay or orientation lock to fail.
**Why it happens:** Two arrays to maintain — easy to update one and miss the other.
**How to avoid:** Always grep for both `LANDSCAPE_ROUTES` and `gameRoutes` when adding any game route. CLAUDE.md documents this pattern explicitly.
**Warning signs:** Sidebar visible during MixedLessonGame playthrough.

### Pitfall 2: Renderer importing VexFlow-touching utilities

**What goes wrong:** Renderer imports from `rhythmVexflowHelpers.js` which imports VexFlow — valid in browser but `durationInfo.js` exists precisely because validateTrail.mjs is Node.js.
**Why it happens:** `rhythmVexflowHelpers.js` has syllable maps but also imports VexFlow. `durationInfo.js` has a standalone SYLLABLE_BY_UNITS copy for Node safety.
**How to avoid:** Renderers import syllables from `rhythmVexflowHelpers` (browser-only, fine for React components). The validator uses `durationInfo.js`. Keep this separation — don't merge them.
**Warning signs:** `npm run build` or `npm run verify:trail` crashes with "Cannot use import statement" or "window is not defined".

### Pitfall 3: buildDurationPool called with wrong nodeId source

**What goes wrong:** Engine uses `location.state?.nodeConfig` as the duration source but nodeConfig for a mixed_lesson is the exercise config (containing `questions[]`), not the node's rhythmConfig.
**Why it happens:** For standalone games, `nodeConfig = exercise.config` which directly has the relevant config. For mixed_lesson, the engine needs to call `getNodeById(nodeId)` and read `rhythmConfig` from the node object — same as standalone games already do in `buildDurationPool()`.
**How to avoid:** Read `buildDurationPool()` in VisualRecognitionGame carefully — it already calls `getNodeById(nodeId)` and ignores nodeConfig for duration lookup. Copy this exact pattern into MixedLessonGame.
**Warning signs:** Empty question pool, game never starts.

### Pitfall 4: validateTrail.mjs not updated for mixed_lesson

**What goes wrong:** Adding `MIXED_LESSON` to constants.js makes `validateExerciseTypes()` accept it, but `validateMultiAngleGames()` only checks for `visual_recognition` and `syllable_matching` — mixed_lesson exercises with invalid configs would silently pass.
**Why it happens:** The validator has a `MULTI_ANGLE_TYPES` set that doesn't include `mixed_lesson` (it's a new type).
**How to avoid:** Add a new `validateMixedLessons()` function to validateTrail.mjs that checks: (1) node has `rhythmConfig`, (2) `config.questions` is a non-empty array, (3) each question entry has a `type` field that is one of the known renderer types (`visual_recognition`, `syllable_matching`).
**Warning signs:** `npm run build` passes but a malformed mixed_lesson config doesn't throw an error.

### Pitfall 5: VictoryScreen props for mixed_lesson exercise

**What goes wrong:** MixedLessonGame passes `totalPossibleScore` as the authored question count (e.g., 8), but standalone games use `QUESTION_COUNT = 5`. The star thresholds are percentage-based so this is fine — but `exerciseType` must be passed as `'mixed_lesson'` for VictoryScreen's internal handling.
**Why it happens:** Copy-paste from standalone game sets wrong totalPossibleScore.
**How to avoid:** `totalPossibleScore = questions.length` (the actual pre-generated question count, always 8-10). Pass `exerciseType={trailExerciseType}` verbatim from location.state.
**Warning signs:** Stars calculated incorrectly (e.g., 5/8 showing wrong star count vs 5/5).

### Pitfall 6: Timer cleanup on unmount

**What goes wrong:** If user navigates away mid-feedback timer, the timeout fires on an unmounted component — either a React warning or a navigate() call that corrupts state.
**Why it happens:** `setTimeout` in `handleSelect` fires after component unmount.
**How to avoid:** Copy the exact cleanup pattern from existing games: `feedbackTimerRef.current` + `clearTimeout` in `useEffect(() => { return () => clearTimeout(feedbackTimerRef.current) }, [])`.
**Warning signs:** "Can't perform a React state update on an unmounted component" in console.

---

## Code Examples

### VisualRecognitionQuestion Renderer Skeleton

```jsx
// src/components/games/rhythm-games/renderers/VisualRecognitionQuestion.jsx
// Source: extracted from VisualRecognitionGame.jsx renderCards() and prompt section

import { useTranslation } from "react-i18next";
import DurationCard from "../components/DurationCard";
import { DURATION_INFO } from "../utils/durationInfo";

export default function VisualRecognitionQuestion({
  question,
  cardStates,
  isLandscape,
  onSelect,
  disabled,
}) {
  const { t } = useTranslation("common");
  const durationName = t(DURATION_INFO[question.correct].i18nKey);
  const promptText = t("visualRecognition.prompt", { durationName });

  const gridClass = isLandscape
    ? "grid grid-cols-4 gap-3 w-full max-w-2xl"
    : "grid grid-cols-2 gap-4 w-full max-w-sm";

  return (
    <>
      <div className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-md">
        <h2 className="text-center text-lg font-bold text-white">
          {promptText}
        </h2>
      </div>
      <div className={gridClass}>
        {question.choices.map((choice, i) => (
          <DurationCard
            key={`${question.correct}-${i}`}
            type="icon"
            durationCode={choice}
            state={cardStates[i]}
            onSelect={onSelect}
            disabled={disabled}
            cardIndex={i}
            ariaLabel={t(DURATION_INFO[choice].i18nKey)}
          />
        ))}
      </div>
    </>
  );
}
```

### SyllableMatchingQuestion Renderer Skeleton

```jsx
// src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx
// Source: extracted from SyllableMatchingGame.jsx renderCards() and renderPromptPanel()

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import DurationCard, { SVG_COMPONENTS } from "../components/DurationCard";
import { DURATION_INFO } from "../utils/durationInfo";
import {
  SYLLABLE_MAP_EN,
  SYLLABLE_MAP_HE,
  REST_SYLLABLE_EN,
  REST_SYLLABLE_HE,
} from "../utils/rhythmVexflowHelpers";

export default function SyllableMatchingQuestion({
  question,
  cardStates,
  isLandscape,
  onSelect,
  disabled,
}) {
  const { t, i18n } = useTranslation("common");

  const getSyllable = useCallback(
    (code) => {
      const info = DURATION_INFO[code];
      if (!info) return code;
      const lang = i18n.language;
      if (info.isRest)
        return lang === "he" ? REST_SYLLABLE_HE : REST_SYLLABLE_EN;
      const map = lang === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
      return map[info.durationUnits] || code;
    },
    [i18n.language]
  );

  const SvgIcon = SVG_COMPONENTS[question.correct];
  const gridClass = isLandscape
    ? "grid grid-cols-4 gap-3 w-full max-w-2xl"
    : "grid grid-cols-2 gap-4 w-full max-w-sm";

  return (
    <>
      <div className="flex flex-col items-center rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div dir="ltr" className="flex items-center justify-center">
          {SvgIcon && (
            <SvgIcon
              className={`${isLandscape ? "h-16" : "h-24"} w-auto`}
              aria-label={t(DURATION_INFO[question.correct].i18nKey)}
            />
          )}
        </div>
        <p className="mt-2 text-center text-base text-white/60">
          {t("syllableMatching.prompt")}
        </p>
      </div>
      <div className={gridClass}>
        {question.choices.map((choice, i) => {
          const syllable = getSyllable(choice);
          return (
            <DurationCard
              key={`${question.correct}-${i}`}
              type="text"
              text={syllable}
              state={cardStates[i]}
              onSelect={onSelect}
              disabled={disabled}
              cardIndex={i}
              ariaLabel={syllable}
            />
          );
        })}
      </div>
    </>
  );
}
```

### MixedLessonGame Progress Bar

```jsx
// Source: D-10 spec + existing game patterns
const renderProgressBar = () => (
  <div className="flex flex-1 items-center gap-3">
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
      <div
        className="h-full rounded-full bg-green-400 transition-all duration-300"
        style={{ width: `${(currentIndex / questions.length) * 100}%` }}
      />
    </div>
    <span className="whitespace-nowrap text-sm font-medium text-white/70">
      {currentIndex}/{questions.length}
    </span>
  </div>
);
```

### validateTrail.mjs: New Mixed Lesson Validator

```javascript
// Add to scripts/validateTrail.mjs
const RENDERER_TYPES = new Set(["visual_recognition", "syllable_matching"]);

function validateMixedLessons() {
  console.log("\nChecking mixed lesson exercises...");
  let errorCount = 0;

  for (const node of SKILL_NODES) {
    for (const exercise of node.exercises || []) {
      if (exercise.type !== "mixed_lesson") continue;

      // Must have rhythmConfig
      if (!node.rhythmConfig) {
        console.error(
          `  ERROR: Node "${node.id}" has mixed_lesson exercise but no rhythmConfig`
        );
        hasErrors = true;
        errorCount++;
      }

      // Must have questions array
      const questions = exercise.config?.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        console.error(
          `  ERROR: Node "${node.id}" mixed_lesson has no questions array`
        );
        hasErrors = true;
        errorCount++;
        continue;
      }

      // Each question entry must have a valid type
      for (const [i, q] of questions.entries()) {
        if (!RENDERER_TYPES.has(q.type)) {
          console.error(
            `  ERROR: Node "${node.id}" mixed_lesson question[${i}] has unknown type "${q.type}"`
          );
          hasErrors = true;
          errorCount++;
        }
      }
    }
  }

  if (errorCount === 0) console.log("  Mixed lessons: OK");
  else console.error(`  Found ${errorCount} mixed lesson error(s)`);
}
```

### Route Registration Pattern

```javascript
// App.jsx — add lazy import:
const MixedLessonGame = lazyWithRetry(
  () => import('./components/games/rhythm-games/MixedLessonGame')
);

// App.jsx — add to LANDSCAPE_ROUTES:
'/rhythm-mode/mixed-lesson',

// App.jsx — add Route element (no AudioContextProvider needed — no mic):
<Route path="/rhythm-mode/mixed-lesson" element={<MixedLessonGame />} />

// AppLayout.jsx — add to gameRoutes:
'/rhythm-mode/mixed-lesson',
```

---

## Integration Inventory

### Files That MUST Change

| File                                      | Change                                                                | Risk                              |
| ----------------------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| `src/data/constants.js`                   | Add `MIXED_LESSON: 'mixed_lesson'` to EXERCISE_TYPES                  | LOW — additive                    |
| `src/components/trail/TrailNodeModal.jsx` | Add `mixed_lesson` to getExerciseTypeName + navigateToExercise switch | LOW — additive case               |
| `src/App.jsx`                             | Add lazy import, LANDSCAPE_ROUTES entry, Route element                | LOW — follows established pattern |
| `src/components/layout/AppLayout.jsx`     | Add gameRoutes entry                                                  | LOW — one line                    |
| `scripts/validateTrail.mjs`               | Add `validateMixedLessons()` function + call                          | LOW — additive                    |
| `src/locales/en/trail.json`               | Add `"mixed_lesson": "Mixed Lesson"` to exerciseTypes                 | LOW                               |
| `src/locales/he/trail.json`               | Add Hebrew translation for mixed_lesson                               | LOW                               |

### Files That WILL BE Created

| File                                                                                       | Purpose                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------- |
| `src/components/games/rhythm-games/renderers/VisualRecognitionQuestion.jsx`                | Stateless visual recognition renderer |
| `src/components/games/rhythm-games/renderers/SyllableMatchingQuestion.jsx`                 | Stateless syllable matching renderer  |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`                                    | Unified engine component              |
| `src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx`                     | Engine tests                          |
| `src/components/games/rhythm-games/renderers/__tests__/VisualRecognitionQuestion.test.jsx` | Renderer unit tests                   |
| `src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx`  | Renderer unit tests                   |

### Files That WILL BE Refactored (thin wrapper)

| File                                                          | Change Summary                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/components/games/rhythm-games/VisualRecognitionGame.jsx` | Replace inline renderCards() + prompt with `<VisualRecognitionQuestion>`             |
| `src/components/games/rhythm-games/SyllableMatchingGame.jsx`  | Replace inline renderPromptPanel() + renderCards() with `<SyllableMatchingQuestion>` |

### Node Data Files (Claude's Discretion — migration scope)

Based on codebase review, Unit 1 and Unit 2 rhythm nodes already have `VISUAL_RECOGNITION` and `SYLLABLE_MATCHING` as separate exercises (not mixed). The migration question: convert any of these to `MIXED_LESSON`?

**Recommendation:** Add `mixed_lesson` as an additional exercise on a small set of nodes (2-3 nodes from Unit 1) to demonstrate the feature working. Do not remove standalone exercises — honor D-15 (coexistence). This gives the planner a clean starting point without creating a large data migration surface.

---

## Validation Architecture

The config.json does not set `workflow.nyquist_validation` to false — treat as enabled.

### Test Framework

| Property           | Value                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------- |
| Framework          | Vitest                                                                                |
| Config file        | `vite.config.js` (vitest section)                                                     |
| Quick run command  | `npx vitest run src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx` |
| Full suite command | `npm run test:run`                                                                    |

### Phase Requirements → Test Map

| Behavior                                                        | Test Type   | Notes                                            |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| Renderer renders correct prompt for visual_recognition question | Unit        | VisualRecognitionQuestion.test.jsx               |
| Renderer renders SVG prompt for syllable_matching question      | Unit        | SyllableMatchingQuestion.test.jsx                |
| Engine generates correct question count from config             | Unit        | MixedLessonGame.test.jsx                         |
| Engine advances question index on selection                     | Unit        | MixedLessonGame.test.jsx                         |
| Engine tracks correct/wrong results                             | Unit        | MixedLessonGame.test.jsx                         |
| Progress bar reflects current index / total                     | Unit        | MixedLessonGame.test.jsx                         |
| Crossfade key increments on type change                         | Unit        | MixedLessonGame.test.jsx                         |
| VictoryScreen receives correct score props                      | Unit        | MixedLessonGame.test.jsx                         |
| Standalone VisualRecognitionGame unchanged behavior             | Integration | VisualRecognitionGame.test.jsx (existing passes) |
| Standalone SyllableMatchingGame unchanged behavior              | Integration | SyllableMatchingGame.test.jsx (existing passes)  |

### Established Mock Pattern (from existing tests)

```javascript
// Standard mock set required by all rhythm game tests:
vi.mock('react-router-dom', ...) // useLocation + useNavigate
vi.mock('react-i18next', ...)    // useTranslation
vi.mock('../../../../features/games/hooks/useSounds', ...)
vi.mock('../../../../contexts/SessionTimeoutContext', ...)
vi.mock('../../../../hooks/useLandscapeLock', ...)
vi.mock('../../../../hooks/useRotatePrompt', ...)
vi.mock('../../../../utils/useMotionTokens', ...)
vi.mock('../../../data/skillTrail', ...) // getNodeById
vi.mock('../VictoryScreen', ...)  // prevent actual XP calls
```

Tests use `vi.useFakeTimers()` with `vi.runAllTimersAsync()` or `act()` for feedback delays.

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/__tests__/MixedLessonGame.test.jsx` — covers engine session flow
- [ ] `src/components/games/rhythm-games/renderers/__tests__/VisualRecognitionQuestion.test.jsx` — covers renderer rendering
- [ ] `src/components/games/rhythm-games/renderers/__tests__/SyllableMatchingQuestion.test.jsx` — covers renderer rendering

Existing tests in `__tests__/VisualRecognitionGame.test.jsx` and `__tests__/SyllableMatchingGame.test.jsx` should continue to pass after the thin-wrapper refactor with no changes — they test the full game component which will still exist.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this is a pure code addition, no new CLIs, services, or runtimes required beyond the existing Node.js/npm stack).

---

## State of the Art

| Old Approach                                  | Current Approach               | Impact                           |
| --------------------------------------------- | ------------------------------ | -------------------------------- |
| Progress dots (standalone games)              | Progress bar (MixedLessonGame) | Lesson metaphor vs quiz metaphor |
| Separate exercise per game type               | Single interleaved session     | Duolingo-style continuity        |
| Exercise navigation via VictoryScreen buttons | Seamless in-engine advancement | No break in flow mid-session     |

---

## Assumptions Log

| #   | Claim                                                                               | Section                            | Risk if Wrong                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `animate-fadeIn` CSS class already exists in index.css                              | Architecture Patterns - Crossfade  | LOW: class is used in both VisualRecognitionGame and SyllableMatchingGame outer divs [VERIFIED: codebase]                                                     |
| A2  | No AudioContextProvider wrapper needed for MixedLessonGame route (no mic/audio API) | Code Examples - Route Registration | LOW: visual/syllable games have no AudioContextProvider in existing routes [VERIFIED: App.jsx lines 482-488]                                                  |
| A3  | Hebrew translation for `mixed_lesson` exerciseType needs to be authored             | Integration Inventory              | LOW: other Phase 24 types (rhythm_tap, etc.) have Hebrew translations [VERIFIED: he/trail.json] — but the exact Hebrew string for "Mixed Lesson" is not known |

**A3 clarification:** rhythm_tap, rhythm_dictation, arcade_rhythm, pitch_comparison, interval_id all show as English in the Hebrew locale file (not yet translated). `mixed_lesson` will follow the same pattern — add English as placeholder, user can provide Hebrew later.

---

## Open Questions

1. **Which nodes should get mixed_lesson exercises in Phase 25?**
   - What we know: Units 1 and 2 exist with standalone visual_recognition + syllable_matching per node; D-15 allows coexistence
   - What's unclear: Whether to add mixed_lesson as a third exercise type on existing nodes, or author new nodes with only mixed_lesson
   - Recommendation: Add mixed_lesson as an additional exercise on `rhythm_1_1` through `rhythm_1_3` (3 nodes) as a demonstration. This is clean, reversible, and tests the full integration without large data changes. The planner should implement this as a separate task so it can be scoped independently if needed.

2. **Question count: exactly 8 or variable 8-10?**
   - What we know: D-08 says "8-10 questions per mixed lesson. Authored per-node (the questions[] array length IS the count)"
   - What's unclear: Whether initial demo nodes should use 8 or a mix
   - Recommendation: Use 8 for initial nodes (4 visual_recognition + 4 syllable_matching alternating). Simple, clean, easy to validate.

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: codebase] `src/components/games/rhythm-games/VisualRecognitionGame.jsx` — state machine, buildDurationPool, handleSelect pattern
- [VERIFIED: codebase] `src/components/games/rhythm-games/SyllableMatchingGame.jsx` — getSyllable, renderPromptPanel, renderCards
- [VERIFIED: codebase] `src/components/games/rhythm-games/components/DurationCard.jsx` — SVG_COMPONENTS export, STATE_CLASSES, props contract
- [VERIFIED: codebase] `src/components/games/rhythm-games/utils/durationInfo.js` — generateQuestions(), DURATION_INFO, ALL_DURATION_CODES
- [VERIFIED: codebase] `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — SYLLABLE_MAP_EN/HE, REST_SYLLABLE_EN/HE
- [VERIFIED: codebase] `src/data/constants.js` — EXERCISE_TYPES enum, current values
- [VERIFIED: codebase] `src/components/trail/TrailNodeModal.jsx` — getExerciseTypeName switch, navigateToExercise switch pattern
- [VERIFIED: codebase] `src/App.jsx` — LANDSCAPE_ROUTES array, Route element pattern for visual-recognition-game and syllable-matching-game
- [VERIFIED: codebase] `src/components/layout/AppLayout.jsx` — gameRoutes array
- [VERIFIED: codebase] `scripts/validateTrail.mjs` — validateMultiAngleGames() pattern to extend
- [VERIFIED: codebase] `src/data/units/rhythmUnit1Redesigned.js` — node structure, existing VISUAL_RECOGNITION/SYLLABLE_MATCHING exercises
- [VERIFIED: codebase] `src/locales/en/trail.json` and `src/locales/he/trail.json` — exerciseTypes section

### Secondary (MEDIUM confidence)

- [VERIFIED: codebase] `src/components/games/rhythm-games/__tests__/VisualRecognitionGame.test.jsx` — mock pattern for renderer tests
- [VERIFIED: codebase] `src/components/games/rhythm-games/__tests__/SyllableMatchingGame.test.jsx` — mock pattern for renderer tests

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all dependencies verified in codebase, no new installs
- Architecture: HIGH — patterns directly derived from reading Phase 24 source code
- Pitfalls: HIGH — identified from direct code analysis of integration points
- Validator extension: HIGH — validateMixedLessons() modeled directly on existing validateMultiAngleGames()

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable codebase — 30 days)
