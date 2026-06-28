# Phase 36: Game Screen UI Unification — Research

**Researched:** 2026-06-10
**Domain:** React component extraction and refactor — game HUD shared components
**Confidence:** HIGH (internal codebase audit; no external dependencies)

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01** Base shell (ProgressBar + ScorePill + BackButton + AnswerFeedback) adopted by ALL
  exercise-based games: NotesRecognitionGame, SightReadingGame, RhythmReadingGame,
  RhythmDictationGame, MixedLessonGame, MetronomeTrainer (trail mode), MemoryGame,
  NoteComparisonGame, IntervalGame.
- **D-02** Engagement layer (ComboPill + OnFireBadge/Splash + SpeedBonusFlash + TierUpPopup)
  adopted by fast-recall games only: NoteComparisonGame, IntervalGame, ArcadeRhythmGame.
  Slow/staff-based games get base shell only.
- **D-03** MixedLessonGame's divergent progress bar replaced by shared `ProgressBar` (REQ-04).
- **D-04** Timer and new-note unlock banner are NOT forced onto other games. TimerDisplay
  extraction is optional (planner decides). New-note banner stays NotesRecognition-specific.
- **D-05** Three waves: Wave 1 = extract + refactor NotesRecognitionGame; Wave 2 = roll base
  shell to all others; Wave 3 = extract engagement layer + de-dup ArcadeRhythmGame.
- **D-06** Smallest blast radius per step.
- **D-07** No new GameOver paths. Only NotesRecognitionGame and ArcadeRhythmGame retain the
  lives→GameOverScreen path.
- **D-08** Ear-training games (NoteComparisonGame, IntervalGame) get combo/on-fire but NO lives.
  Always finish all questions; always end on VictoryScreen.
- **D-09** ArcadeRhythmGame's behavior preserved exactly after de-duplication: GameOver path +
  landscape lock must be unaffected.
- **D-10** Hybrid contract: value-in props, animation encapsulated. Parent games never manage
  animation timers. Components read reducedMotion internally.
- **D-11** ScorePill is one configurable component: `value`, optional `label`/unit, optional
  `comboTint` flag. No game forced to compute per-question XP it doesn't track.
- **D-12** Components live in `src/components/games/shared/hud/` with clean names: `ProgressBar`,
  `ScorePill`, `LivesDisplay`, `ComboPill`, `OnFireBadge`, `OnFireSplash`, `TimerDisplay`,
  `SpeedBonusFlash`, `TierUpPopup`.
- **D-13** Independent of v3.5 owner UAT — proceed in parallel.

### Claude's Discretion

- Exact prop names and signatures within the hybrid contract.
- Whether `TimerDisplay` is extracted (single consumer) or left inline.
- Whether `OnFireBadge` and `OnFireSplash` ship as one component or two.
- How finely Wave 2 is split into plans (per-game vs per-cluster).
- Per-game wiring of the configurable ScorePill label/value.

### Deferred Ideas (OUT OF SCOPE)

- Engagement layer on slow/staff games (SightReading, RhythmReading, RhythmDictation, MixedLesson, Memory).
- Lives→GameOver for ear-training games.
- Trail-mode new-note unlock banner as a shared component.
  </user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                                                 | Research Support                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| REQ-01 | Extract HUD into shared components. NotesRecognitionGame refactored to consume them with zero visual/behavioral regression. | Full HUD anatomy mapped below. Components can be extracted as direct lifts from the inline JSX.                        |
| REQ-02 | Per-game adoption matrix. Each other game adopts the agreed subset; incompatible pieces excluded with rationale.            | Adoption state map per game documented below. Each game's existing HUD state variables are catalogued.                 |
| REQ-03 | De-duplicate ArcadeRhythmGame's inline lives/combo/on-fire onto shared components, preserving behavior + landscape lock.    | ArcadeRhythmGame HUD anatomy and landscape wiring fully audited; key behavioral differences from reference documented. |
| REQ-04 | Visual consistency (glassmorphism design system). MixedLessonGame's divergent progress bar unified.                         | MixedLessonGame's `renderProgressBar()` fully mapped; visual delta from shared ProgressBar documented.                 |
| REQ-05 | Consistent end-of-game coverage. Games with lives/score model wire VictoryScreen/GameOverScreen; others documented.         | End-of-game paths per game catalogued. Only NotesRecognition and ArcadeRhythmGame have live-loss paths.                |
| REQ-06 | No regressions. All game tests pass; landscape-locked games still render; reduced-motion respected; Hebrew/RTL parity.      | Existing test inventory done. Reduced-motion dual-source pitfall documented. RTL specifics confirmed.                  |
| REQ-07 | i18n parity. New user-facing strings keyed in both `src/locales/en` and `src/locales/he`.                                   | All HUD strings verified present in both locales. ScorePill labels for non-XP games are the only potential new keys.   |

</phase_requirements>

---

## Summary

Phase 36 is a pure React component extraction and adoption refactor with zero external dependencies.
All research derives from direct codebase audit. The source of truth is
`NotesRecognitionGame.jsx`, which already contains the reference HUD as inline components and
functions (`TimerDisplay`, `StageCard`, `ProgressBar` declared at the top of the file, plus
all engagement-layer JSX inline in the render return).

The extraction is a "lift-and-shift" operation: the existing inline components are moved to
`src/components/games/shared/hud/`, their reduced-motion reads are internalized (instead of
relying on parent-provided `reduce`/`appReducedMotion` variables), and the DOM refs
(`scorePillRef`, `comboPillRef`) become component-owned. NotesRecognitionGame then imports from
`hud/` instead of declaring locally.

The main planning complexity is the adoption phase across eight other games, each of which has
its own progress/score state variables that need to be mapped to the shared component props.
The ArcadeRhythmGame de-dup is the highest-care task because it has its own layout, landscape
lock, and behavioral nuances that must be preserved.

**Primary recommendation:** Extract Wave 1 first as a single surgical plan on
NotesRecognitionGame only. Treat ArcadeRhythmGame as its own isolated plan in Wave 3. Batch
the remaining seven games into two or three Wave 2 plans grouped by structural similarity.

---

## Architectural Responsibility Map

| Capability                    | Primary Tier   | Secondary Tier | Rationale                                                                               |
| ----------------------------- | -------------- | -------------- | --------------------------------------------------------------------------------------- |
| HUD component rendering       | Browser/Client | —              | React components render client-side; no SSR                                             |
| Animation state (combo shake) | Browser/Client | —              | Encapsulated in HUD components per D-10; never in parent                                |
| Reduced-motion detection      | Browser/Client | —              | Read from `AccessibilityContext` + `useMotionTokens()` internally in each HUD component |
| Session state (score, lives)  | Browser/Client | —              | Existing game state stays in the game; HUD only reads via props                         |
| i18n / locale                 | Browser/Client | —              | All HUD strings use existing `useTranslation("common")` pattern                         |
| Landscape lock                | Browser/Client | —              | `useDeclareNeedsLandscape` stays in each rhythm game; HUD adoption does not touch it    |

---

## Standard Stack

### Confirmed Dependencies (already present — no installs needed)

[VERIFIED: direct codebase grep]

| Library              | Version | Purpose in HUD            | Already Used By                    |
| -------------------- | ------- | ------------------------- | ---------------------------------- |
| framer-motion        | —       | AnimatePresence, motion   | NotesRecognitionGame, ArcadeRhythm |
| lucide-react         | —       | Heart, Zap, Clock3, Flame | NotesRecognitionGame, ArcadeRhythm |
| react-i18next        | —       | `useTranslation`          | All games                          |
| tailwindcss 3        | —       | All styling               | All games                          |
| AccessibilityContext | —       | `useAccessibility()`      | NotesRecognitionGame, ArcadeRhythm |
| useMotionTokens      | —       | `reduce`, `soft` tokens   | NotesRecognitionGame               |

**No new packages are introduced in this phase.** [VERIFIED: SPEC.md boundary, no new deps in
any game file]

---

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Game Component (e.g. NotesRecognitionGame)         │
│  session state: [combo, lives, score, currentQ, totalQ, isOnFire …]  │
│                              │ props                                  │
│              ┌───────────────┴────────────────┐                       │
│              ▼                                ▼                       │
│   src/components/games/shared/hud/        game-specific render        │
│   ┌──────────────────────────┐              (note display, staff,    │
│   │ ProgressBar              │               answer buttons, etc.)   │
│   │ ScorePill                │                                        │
│   │ LivesDisplay             │                                        │
│   │ ComboPill                │ ← reads reducedMotion internally       │
│   │ OnFireBadge / OnFireSplash│   via useAccessibility()              │
│   │ SpeedBonusFlash          │   and useMotionTokens()                │
│   │ TierUpPopup              │                                        │
│   │ TimerDisplay (optional)  │                                        │
│   └──────────────────────────┘                                        │
│              │ reads internally                                        │
│    AccessibilityContext ──────── useMotionTokens                      │
└──────────────────────────────────────────────────────────────────────┘
```

Entry: game component renders during `session.isStarted && !session.isFinished`.
Flow: game state → props → hud/ components render & self-animate.
No data flows from HUD back to the game (read-only/display).

### Recommended Project Structure

```
src/components/games/shared/
├── hud/
│   ├── ProgressBar.jsx        # X-of-N bar (everyone)
│   ├── ScorePill.jsx          # Configurable score (everyone)
│   ├── LivesDisplay.jsx       # Hearts (NotesRecognition + ArcadeRhythm)
│   ├── ComboPill.jsx          # Zap/combo (NotesRecognition, ArcadeRhythm, ear-training)
│   ├── OnFireBadge.jsx        # Flame PNG badge (NotesRecognition, ArcadeRhythm, ear-training)
│   ├── OnFireSplash.jsx       # Full-screen flame overlay (NotesRecognition only — or merged)
│   ├── SpeedBonusFlash.jsx    # FAST! flash (NotesRecognition only this phase)
│   ├── TierUpPopup.jsx        # DOUBLE/TRIPLE XP popup (NotesRecognition only this phase)
│   └── TimerDisplay.jsx       # Timer (NotesRecognition only — planner decides)
├── AudioInterruptedOverlay.jsx  # existing — no change
├── UnifiedGameSettings.jsx      # existing — no change
└── noteSelectionUtils.js        # existing — no change
```

### Pattern 1: Extract-then-Swap (Wave 1 reference)

**What:** Copy the inline component declaration from NotesRecognitionGame into its own file in
`hud/`. Internalize the `reduce` / `appReducedMotion` reads. Export the component. Replace the
inline declaration with an import. Verify zero visual change.

**When to use:** All Wave 1 work on NotesRecognitionGame.

```jsx
// Source: NotesRecognitionGame.jsx lines 320-371 — ProgressBar BEFORE extraction
const ProgressBar = ({ current, total }) => {
  const { t } = useTranslation("common");
  const { soft } = useMotionTokens();
  // ... reads props, renders bar with checkpoints
};

// AFTER extraction — src/components/games/shared/hud/ProgressBar.jsx:
import { useTranslation } from "react-i18next";
import { useMotionTokens } from "../../../utils/useMotionTokens";
import { motion } from "framer-motion";

export function ProgressBar({ current, total }) {
  const { t } = useTranslation("common");
  const { soft } = useMotionTokens(); // reads reducedMotion internally via Framer
  // identical JSX body
}

// NotesRecognitionGame.jsx after extraction:
import { ProgressBar } from "../shared/hud/ProgressBar";
// inline declaration deleted
```

[VERIFIED: actual lines 320-371 of NotesRecognitionGame.jsx]

### Pattern 2: Internalize Reduced-Motion (Wave 1 — engagement layer)

**What:** The engagement components in NotesRecognitionGame reference two variables from parent
scope: `reduce` (from `useMotionTokens()`) and `appReducedMotion` (from `useAccessibility()`).
When extracted, each component must call these hooks internally.

```jsx
// BEFORE (inline in NotesRecognitionGame, using parent-scoped variables):
const { reducedMotion: appReducedMotion } = useAccessibility();
const { reduce } = useMotionTokens();
// ... later in JSX:
<motion.div className={reduce || appReducedMotion ? "" : "animate-pulse"}>

// AFTER (inside OnFireBadge.jsx — both hooks called internally):
export function OnFireBadge({ active }) {
  const { reducedMotion } = useAccessibility();    // for animate-pulse
  const { reduce } = useMotionTokens();            // for Framer animate props
  // ...
}
```

[VERIFIED: NotesRecognitionGame.jsx line 416 (appReducedMotion), line 415 (reduce), line 2428-2429 (combined usage)]

### Pattern 3: Value-In, Animation Encapsulated (D-10)

**What:** HUD components receive plain value props. Internal state (shake trigger, scale trigger)
is derived by comparing incoming props to previous values via `useRef` or `useEffect`.

```jsx
// ComboPill — detect changes to trigger animations:
export function ComboPill({ combo }) {
  const { reduce } = useMotionTokens();
  const prevComboRef = useRef(combo);
  const [animateState, setAnimateState] = useState(null); // 'shake' | 'scale' | null

  useEffect(() => {
    if (combo < prevComboRef.current) setAnimateState("shake");
    else if (combo > prevComboRef.current) setAnimateState("scale");
    prevComboRef.current = combo;
    const t = setTimeout(() => setAnimateState(null), 300);
    return () => clearTimeout(t);
  }, [combo]);

  // ... render with animateState
}
```

**Implication:** The parent game no longer manages `comboShake` state or `speedBonusKey` remounts.
Those become internal component concerns. [VERIFIED: CONTEXT.md D-10 contract]

### Pattern 4: ScorePill comboTint Prop

**What:** `comboTint` is a numeric enum `0 | 1 | 2` (none / amber / yellow). The parent computes
the tier based on its own `combo` value and passes the result. The pill itself renders the
appropriate glass tint.

```jsx
// Parent computes tier:
const comboTier = combo >= 8 ? 2 : combo >= 3 ? 1 : 0;
// Pass to ScorePill:
<ScorePill value={progress.score} label="XP" comboTint={comboTier} />;

// ScorePill maps tint to classes internally:
const TINT_CLASSES = [
  { border: "border-white/20", bg: "bg-white/10", text: "" },
  {
    border: "border-amber-400/30",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
  },
  {
    border: "border-yellow-400/40",
    bg: "bg-yellow-500/20",
    text: "text-yellow-300",
  },
];
```

[VERIFIED: NotesRecognitionGame.jsx lines 2358-2376 — existing tinting logic]

### Pattern 5: ArcadeRhythmGame De-Dup (D-09)

**What:** ArcadeRhythmGame's HUD uses a flat `<header>` layout (no StageCard). Its
lives/combo are already rendered without Framer Motion animations. After de-dup, it imports
`ComboPill` and `LivesDisplay` from `hud/`, but the shared components will ADD animations.
This is the only behavioral upgrade.

**Key differences to preserve:**

- `ComboPill` in ArcadeRhythm only renders when `combo >= 2` (conditional display)
- ArcadeRhythm uses `<Flame>` Lucide icon inside the combo pill for on-fire; this behavior
  should flow from `ComboPill` receiving `isOnFire={isOnFire}` prop
- `LivesDisplay` in ArcadeRhythm has no entry/exit animations — the shared component will
  add framer-motion animations; this is acceptable (upgrade, not regression)
- `useDeclareNeedsLandscape(isPhoneViewport)` call stays in ArcadeRhythmGame; HUD adoption
  does NOT touch it [VERIFIED: ArcadeRhythmGame.jsx lines 16, 141]

### Anti-Patterns to Avoid

- **Moving game logic into HUD components:** The HUD should not know how to update combo,
  lose a life, or detect on-fire. It only reads values. If a component needs to animate a
  CHANGE (combo shake), it detects it from prop diffs internally, not from callbacks.
- **Passing `reducedMotion` as a prop:** Per D-10, components read it internally. No game
  should pass `reducedMotion={reduce}` to a HUD component.
- **Using `comboShake`/`speedBonusKey` state in the parent:** These are animation triggers
  that must move inside `ComboPill` and `SpeedBonusFlash` respectively. Parents only set
  `showSpeedBonus={showSpeedBonus}` and `key={speedBonusKey}` — or better, the component
  takes `show={showSpeedBonus}` and handles its own remount via AnimatePresence.
- **Breaking the TierUpPopup fly-to animation:** `TierUpPopup` needs `targetRef` (the score
  pill DOM ref) to compute the fly-to destination. The `scorePillRef` must be passed as a
  prop. Do not try to derive the target position via global DOM queries.

---

## NotesRecognitionGame HUD Anatomy (Wave 1 Source)

The reference for every shared component. Source lines are stable identifiers for the
executor. [VERIFIED: direct file inspection]

### Inline Component Declarations (top of file)

| Component      | Lines   | Props                   | What it reads from scope            |
| -------------- | ------- | ----------------------- | ----------------------------------- |
| `TimerDisplay` | 295–308 | `formattedTime: string` | `useTranslation("common")` → `t`    |
| `StageCard`    | 310–318 | `children`, `className` | nothing from scope                  |
| `ProgressBar`  | 320–371 | `current`, `total`      | `useTranslation`, `useMotionTokens` |

`TimerDisplay` and `ProgressBar` are already named components — the executor can extract them
verbatim. `StageCard` is a layout wrapper; whether it belongs in `hud/` or stays local in
NotesRecognitionGame is a planner judgment call.

### Engagement Constants (module scope, lines 373–384)

```js
const COMBO_TIERS = [
  { min: 0, multiplier: 1 },
  { min: 3, multiplier: 2 },
  { min: 8, multiplier: 3 },
];
const SPEED_BONUS_THRESHOLD_MS = 3000;
const BASE_XP = 5;
const INITIAL_LIVES = 3;
const ON_FIRE_THRESHOLD = 5;
```

These stay in NotesRecognitionGame (game logic constants, not HUD constants). But `INITIAL_LIVES`
and `ON_FIRE_THRESHOLD` should be exported so tests can reference them. They already are not
directly exported — planner decides if they stay private.

### State Variables Feeding the HUD

| State variable            | Type         | Feeds                            | Note                                               |
| ------------------------- | ------------ | -------------------------------- | -------------------------------------------------- |
| `combo`                   | number       | ComboPill, ScorePill (comboTint) | `comboRef` mirrors it for mic callbacks            |
| `lives`                   | number       | LivesDisplay                     | `livesRef` mirrors it for RAF callbacks            |
| `showSpeedBonus`          | boolean      | SpeedBonusFlash                  | set by `handleAnswerSelect`                        |
| `speedBonusKey`           | number       | SpeedBonusFlash (force remount)  | incremented on each bonus                          |
| `tierUpMultiplier`        | 2\|3\|null   | TierUpPopup                      | cleared after animation                            |
| `tierUpTarget`            | {x, y}       | TierUpPopup (fly-to position)    | computed from `scorePillRef.getBoundingClientRect` |
| `isOnFire`                | boolean      | OnFireBadge, bg color            | `isOnFireRef` mirrors it                           |
| `showFireSplash`          | boolean      | OnFireSplash                     | 600ms auto-clear                                   |
| `floatingScore`           | number\|null | ScorePill (floating +score)      | `floatingScoreKey` for remount                     |
| `comboShake`              | boolean      | ComboPill (shake animation)      | cleared by parent timer → moves inside ComboPill   |
| `scorePillRef`            | Ref          | TierUpPopup targetRef            | DOM ref attached to ScorePill wrapper              |
| `comboPillRef`            | Ref          | (debug only currently)           | may not need to be passed                          |
| `progress.score`          | number       | ScorePill `value`                | from `useGameProgress`                             |
| `progress.totalQuestions` | number       | ProgressBar `current`            | from `useGameProgress`                             |

### HUD Layout in Render (lines 2334–2522)

```
<div> [full screen container with on-fire bg]
  <OnFireSplash show={showFireSplash} />           ← fixed overlay, z-[70]
  <div> [HUD row container]
    <StageCard>
      <div flex justify-between>
        [LEFT]  <BackButton>
        [CENTER] <ScorePill> <OnFireBadge> <ComboPill> <TimerDisplay?>
        [RIGHT]  <LivesDisplay> <PauseButton>
      </div>
    </StageCard>
  </div>
  <div> [content area]
    <ProgressBar current={...} total={...} />      ← mt-4
    <div h-7> <SpeedBonusFlash />                  ← reserved space
    <NewNoteBanner />                               ← stays NotesRecognition-specific
    <TierUpPopup multiplier={...} targetRef={...}> ← fixed overlay
    [note display + answer buttons]
  </div>
</div>
```

---

## Per-Game Adoption State Map

[VERIFIED: direct inspection of each game file]

### SightReadingGame (base shell only — D-01)

**File:** `src/components/games/sight-reading-game/SightReadingGame.jsx`

Current inline HUD: Has its own progress bar (h-1, bg-indigo-300, CSS transition) with exercise
counter text above. Has an inline score label. Has `BackButton`. Layout: compact top bar with
BackButton left, progress bar center, BPM pill + controls right.

| State to wire to HUD | Existing var            | Note                           |
| -------------------- | ----------------------- | ------------------------------ |
| ProgressBar.current  | `currentExerciseNumber` | from `useSightReadingSession`  |
| ProgressBar.total    | `sessionTotalExercises` | from `useSightReadingSession`  |
| ScorePill.value      | `sessionTotalScore`     | numeric score; label = "Score" |

No combo/lives. The existing custom progress bar (h-1, inline) is replaced by the shared `ProgressBar`
(h-4, Framer spring). The existing score display is replaced by `ScorePill`. BackButton is already shared.

### RhythmReadingGame (base shell only — D-01)

**File:** `src/components/games/rhythm-games/RhythmReadingGame.jsx`

Current inline HUD: Has a "pattern" progress bar via `progressFraction` (staff scroll). Has
`BackButton`. No explicit score pill. Session scope: `currentExercise` (0-indexed) /
`exerciseScores.length`.

| State to wire   | Existing var                           | Note                                         |
| --------------- | -------------------------------------- | -------------------------------------------- |
| ProgressBar     | `currentExercise`                      | TOTAL_EXERCISES constant from session config |
| ScorePill.value | aggregated from `exerciseScores` array | mean or running total                        |

The staff scroll `progressFraction` (the continuous scroll during a measure) is a DIFFERENT
concept from the session progress. The shared `ProgressBar` tracks session level
(exercise N of M), NOT the within-pattern scroll. Both can coexist.

### RhythmDictationGame (base shell only — D-01)

**File:** `src/components/games/rhythm-games/RhythmDictationGame.jsx`

Current inline HUD: Right-column sidebar with progress text `{currentQuestion+1}/{TOTAL_QUESTIONS}`
(lines 763-765) and score counter `{questionScores.filter(s=>s===1).length}`. No ProgressBar.

| State to wire   | Existing var                                              | Note                         |
| --------------- | --------------------------------------------------------- | ---------------------------- |
| ProgressBar     | `currentQuestion+1` / `TOTAL_QUESTIONS=10`                | simple numeric progress      |
| ScorePill.value | `correctCount` = `questionScores.filter(s=>s===1).length` | label = "Score" or "Correct" |

### MixedLessonGame (base shell + replace own progress bar — D-01, D-03)

**File:** `src/components/games/rhythm-games/MixedLessonGame.jsx`

Current inline progress bar: `renderProgressBar()` function (lines 656-675).

```jsx
// Current (divergent):
<div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15" role="progressbar" ...>
  <div className={`h-full rounded-full bg-green-400 transition-[width]`}
       style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
</div>
<span>{currentIndex}/{questions.length}</span>
```

Visual deltas vs shared `ProgressBar`:

- Track height: `h-2` (8px) → `h-4` (16px) — CHANGE
- Fill: `bg-green-400` → `bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400` — CHANGE
- Animation: CSS `transition-[width]` → Framer Motion `motion.div scaleX` spring — CHANGE
- Checkpoint dots: none → 5 dots at 0/25/50/75/100% — CHANGE
- Counter: inline `{currentIndex}/{questions.length}` → `"Question N of N"` via locale key — CHANGE (locale key)

The locale key change is important: MixedLessonGame uses its own `t("mixedLesson.progressLabel")`
for the bar's aria-label, but the shared `ProgressBar` uses `t("noteRecognition.questionProgress")`
for the counter text. Planner must decide which key to use (or add a `progressLabelKey` prop
to `ProgressBar`). [VERIFIED: locale files]

| State to wire   | Existing var                        | Note                        |
| --------------- | ----------------------------------- | --------------------------- |
| ProgressBar     | `currentIndex` / `questions.length` | replace `renderProgressBar` |
| ScorePill.value | `results.filter(Boolean).length`    | count of correct answers    |

### MetronomeTrainer (base shell only — D-01, trail/exercise mode)

**File:** `src/components/games/rhythm-games/MetronomeTrainer.jsx`

Current inline HUD: Compact header (lines 1397-1421) with BackButton left, centered game title

- settings text, and `exerciseProgress.currentExercise of totalExercises` text right. No
  ProgressBar element. Has `comboCount` computed at session END (not a live state), so no live
  ScorePill tracking.

| State to wire   | Existing var                                                           | Note                                |
| --------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| ProgressBar     | `exerciseProgress.currentExercise` / `exerciseProgress.totalExercises` |                                     |
| ScorePill.value | `exerciseProgress.totalScore`                                          | live-updating as exercises complete |

### MemoryGame (base shell only — D-01)

**File:** `src/components/games/notes-master-games/MemoryGame.jsx`

Current inline HUD: Inline score pill (lines 882-900) using `rounded-lg border border-white/20
bg-white/10` (NOT `rounded-full`). Has Timer/XP display in header. Has `BackButton`. No
ProgressBar.

| State to wire   | Existing var                                                               | Note                                 |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| ProgressBar     | `matchedIndexes.length/2` (matched pairs) / `cards.length/2` (total pairs) | progress as pairs found              |
| ScorePill.value | `score`                                                                    | XP per match (XP_PER_MATCH constant) |

The existing score display uses `rounded-lg` (not `rounded-full`). The shared `ScorePill` uses
`rounded-full`. This is a visual change to the existing MemoryGame — planner should be aware.

### NoteComparisonGame (base shell + engagement — D-01, D-02)

**File:** `src/components/games/ear-training-games/NoteComparisonGame.jsx`

Current inline HUD: Inline header (lines 430-443) with BackButton, progress counter
`{currentQuestion+1} / {TOTAL_QUESTIONS}`, score `{correctCount} ✓`. No ProgressBar, no
combo/fire.

Needs **new state** for the engagement layer (combo + on-fire). Currently has no `combo` or
`isOnFire` state. These must be added to the game component in Wave 3.

| State to wire      | Existing var / to add                       | Note                              |
| ------------------ | ------------------------------------------- | --------------------------------- |
| ProgressBar        | `currentQuestion` / `TOTAL_QUESTIONS` (=10) |                                   |
| ScorePill.value    | `correctCount`                              | label = "Correct"                 |
| ComboPill.combo    | ADD `combo` state                           | reset on wrong answer             |
| OnFireBadge.active | ADD `isOnFire` state                        | triggers at ON_FIRE_THRESHOLD = 5 |

Per D-08: no lives, no early GameOver. Wrong answer costs no life. Always end on VictoryScreen.

### IntervalGame (base shell + engagement — D-01, D-02)

**File:** `src/components/games/ear-training-games/IntervalGame.jsx`

Current inline HUD: Inline header (lines 535-545) with BackButton, progress counter, score
`{correctCount} ✓`. No ProgressBar, no combo/fire.

Same pattern as NoteComparisonGame: needs new combo + isOnFire state added in Wave 3.

| State to wire      | Existing var / to add                       | Note                   |
| ------------------ | ------------------------------------------- | ---------------------- |
| ProgressBar        | `questionScores.length` / `TOTAL_QUESTIONS` | or a dedicated counter |
| ScorePill.value    | `correctCount`                              | label = "Correct"      |
| ComboPill.combo    | ADD `combo` state                           |                        |
| OnFireBadge.active | ADD `isOnFire` state                        |                        |

### ArcadeRhythmGame (de-dup engagement — D-09)

**File:** `src/components/games/rhythm-games/ArcadeRhythmGame.jsx`

**Landscape wiring:** `useDeclareNeedsLandscape(isPhoneViewport)` at line 141, imported from
`NeedsLandscapeContext`. This call stays in the game component — HUD adoption does not touch it.
[VERIFIED: lines 16, 141]

Current inline HUD (lines 1145-1188): Flat `<header className="flex h-12">` containing
BackButton left, exercise counter text center, lives+combo right.

```jsx
// Existing combo badge (simplified):
{
  combo >= 2 && (
    <div
      className={`rounded-full border px-2 py-0.5 text-sm font-bold ${
        isOnFire
          ? "border-orange-400/40 bg-orange-400/20 text-orange-300"
          : "border-yellow-400/40 bg-yellow-400/20 text-yellow-300"
      }`}
    >
      {isOnFire && <Flame className="h-3 w-3" />}
      {combo}
      <Zap className="h-3 w-3" />
    </div>
  );
}

// Existing lives (simplified):
<div aria-label={`${lives} lives remaining`} role="group">
  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
    <Heart
      key={i}
      className={i < lives ? "fill-red-400 text-red-400" : "text-white/30"}
    />
  ))}
</div>;
```

[VERIFIED: ArcadeRhythmGame.jsx lines 1157-1186]

Behavioral differences from NotesRecognition to preserve exactly:

1. Combo pill ONLY renders when `combo >= 2` (NotesRecognition always renders it)
2. `Flame` Lucide icon inside combo pill when `isOnFire` (NotesRecognition uses `flame.png` as separate OnFireBadge)
3. Lives have NO Framer Motion animations (static class change only)
4. No ScorePill during gameplay (score computed at end only)
5. No ProgressBar (uses header text counter)

The shared `ComboPill` must support `isOnFire` prop to conditionally show the Flame icon. The
shared `LivesDisplay` will add Framer animations that ArcadeRhythmGame currently lacks — this is
an acceptable enhancement, not a regression. The `combo >= 2` guard stays in the parent game.

---

## Don't Hand-Roll

[VERIFIED: confirmed usage in NotesRecognitionGame.jsx]

| Problem                      | Don't Build                              | Use Instead                                                                                   | Why                                                      |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Progress bar fill animation  | CSS transition on width                  | Framer `motion.div scaleX` with `useMotionTokens().soft`                                      | Smooth spring, handles reduced-motion via `reduce` token |
| Reduced-motion detection     | Manual `window.matchMedia()`             | `useMotionTokens().reduce` (Framer's `useReducedMotion`) + `useAccessibility().reducedMotion` | Already wired to OS preference and app toggle            |
| AnimatePresence for HUD fade | `useState` + CSS opacity                 | Framer `AnimatePresence` + `motion.div`                                                       | Correct unmount behavior, exit animations                |
| Combo shake                  | `setTimeout` + CSS class toggle          | `motion.div animate={x: [0,-6,6,-4,4,0]}`                                                     | Correct interruptibility, reduced-motion-aware           |
| Tier-up fly-to animation     | CSS transforms with manual position calc | Framer `motion.div` with `x`/`y` keyframes from `scorePillRef.getBoundingClientRect()`        | Already implemented; lift as-is                          |

**Key insight:** All animation logic already exists in NotesRecognitionGame inline. The task is
lifting it into components, not rebuilding it. Do not reach for new animation libraries or
patterns.

---

## Reduced-Motion Dual-Source Pitfall

[VERIFIED: NotesRecognitionGame.jsx lines 415-416, 2428-2429]

NotesRecognitionGame uses **two different reduced-motion sources**:

```js
const { reducedMotion: appReducedMotion } = useAccessibility(); // app toggle
const { reduce } = useMotionTokens(); // Framer's useReducedMotion() = OS pref
```

- `reduce` (Framer): used for `initial`, `animate`, `transition` props on `motion.div`
- `appReducedMotion`: used ONLY for the `animate-pulse` CSS guard on `OnFireBadge`

They can differ when the user manually toggles reduced-motion in the app settings independently
from the OS setting. Extracted HUD components should internalize BOTH calls. The simplest
approach: call `useAccessibility()` and `useMotionTokens()` inside each HUD component that
needs animation behavior. Do not pick just one.

---

## Common Pitfalls

### Pitfall 1: Breaking the TierUpPopup fly-to animation

**What goes wrong:** `TierUpPopup` measures the score pill's DOM position to compute the
fly-to target. If `scorePillRef` is no longer attached (moved into `ScorePill` internally),
the animation breaks.

**Why it happens:** The current code uses `scorePillRef.current.getBoundingClientRect()` in the
parent to compute `tierUpTarget`. When `ScorePill` becomes a child component, the DOM ref must
be forwarded via `React.forwardRef` on `ScorePill`, or the popup must accept a `targetRef` prop
that the parent still owns.

**How to avoid:** Use `React.forwardRef` on `ScorePill` so the parent can still attach
`scorePillRef`. Then pass `scorePillRef` as `targetRef` to `TierUpPopup`. This is the pattern
described in 36-UI-SPEC.md.

**Warning signs:** TierUpPopup flies to wrong position or to (0,0) after extraction.

### Pitfall 2: Stale `comboShake` state in parent

**What goes wrong:** Planner leaves `comboShake` state management in the parent game, and the
extracted `ComboPill` receives a `shouldShake` prop. This means the parent must manage a timer
to clear `comboShake` — defeating D-10's "animation encapsulated" principle.

**How to avoid:** `ComboPill` detects wrong answer internally by comparing `combo` prop to
previous value via `useRef`. When it decreases, it triggers the shake. Parent never manages
`comboShake`.

**Warning signs:** `comboShake` / `shouldShake` props appearing in game component render code
after refactor.

### Pitfall 3: ArcadeRhythmGame landscape lock regression

**What goes wrong:** A wave-3 plan edits ArcadeRhythmGame and inadvertently removes or
reorders the `useDeclareNeedsLandscape(isPhoneViewport)` call.

**How to avoid:** Treat `useDeclareNeedsLandscape` as a SACRED LINE — verify it is present
unchanged in every commit touching ArcadeRhythmGame. It must remain before the return statement,
at the top of the component body.

**Warning signs:** ArcadeRhythmGame stops requesting landscape on phones after the refactor.

### Pitfall 4: MixedLessonGame i18n locale key mismatch

**What goes wrong:** The shared `ProgressBar` uses `t("noteRecognition.questionProgress",
{ current, total })` for its counter label. MixedLessonGame currently uses
`t("mixedLesson.progressLabel")` for its bar's aria-label. If the shared ProgressBar
hard-codes the `noteRecognition` key, MixedLessonGame loses its existing aria-label.

**How to avoid:** Either (a) add an optional `labelKey` prop to `ProgressBar` that defaults to
`"noteRecognition.questionProgress"`, or (b) treat `noteRecognition.questionProgress` as the
canonical shared key (semantically identical: "Question N of N" vs "N / N"). The planner must
decide. Both locales already have the `noteRecognition.questionProgress` key. [VERIFIED: locale
files]

### Pitfall 5: SpeedBonusFlash remount key

**What goes wrong:** `SpeedBonusFlash` relies on a `key` prop increment (`speedBonusKey`) to
force remount so AnimatePresence can re-run the entry animation on subsequent fast answers.
If `SpeedBonusFlash` internalizes the show/hide logic based on `show={showSpeedBonus}` alone,
rapid double-triggers may not replay the animation.

**How to avoid:** Keep the `key` prop pattern: parent passes `key={speedBonusKey}` alongside
`show={showSpeedBonus}`. Document this in the component's prop contract.

### Pitfall 6: MemoryGame's `rounded-lg` → `rounded-full` visual change

**What goes wrong:** MemoryGame's existing score display uses `rounded-lg border-white/20
bg-white/10`. Adopting `ScorePill` (which uses `rounded-full`) visually changes this corner
radius without calling it a regression.

**How to avoid:** Document in the plan that this is an intentional visual alignment (accepted
per REQ-04 design-system consistency). The owner walkthrough verifies it is acceptable.

### Pitfall 7: ArcadeRhythmGame NeedsLandscapeContext export

**What goes wrong:** ArcadeRhythmGame exports `INITIAL_LIVES`, `ON_FIRE_THRESHOLD`, and
`GAME_PHASES` (used by `ArcadeRhythmGame.test.js`). If the wave-3 refactor renames or moves
these constants, the existing tests break.

**How to avoid:** Keep all exported constants in `ArcadeRhythmGame.jsx`. If `INITIAL_LIVES` is
ever moved to a shared location, update the test import path.

---

## Code Examples

### ScorePill — existing inline rendering (to extract)

[VERIFIED: NotesRecognitionGame.jsx lines 2357-2412]

```jsx
// Source: NotesRecognitionGame.jsx lines 2375-2411 (ScorePill + floating score)
const tier = [...COMBO_TIERS].reverse().find((t) => combo >= t.min);
const mult = tier?.multiplier ?? 1;
const pillBorder = mult >= 3 ? "border-yellow-400/40" : mult >= 2 ? "border-amber-400/30" : "border-white/20";
const pillBg = mult >= 3 ? "bg-yellow-500/20" : mult >= 2 ? "bg-amber-500/15" : "bg-white/10";

<div ref={scorePillRef} className="relative">
  <div className={`flex items-center gap-2 rounded-full border ${pillBorder} ${pillBg} px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none`}>
    <span className="text-xs font-semibold text-white/80 sm:text-sm">XP</span>
    <span className="font-mono text-sm font-bold tracking-wide sm:text-base">{progress.score}</span>
  </div>
  <AnimatePresence>
    {floatingScore !== null && (
      <motion.span key={floatingScoreKey}
        initial={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        animate={reduce ? { opacity: 0 } : { opacity: 0, y: -28 }}
        transition={{ duration: 0.55 }}
        className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-mono font-bold drop-shadow-md ${...}`}
      >+{floatingScore}</motion.span>
    )}
  </AnimatePresence>
</div>
```

### LivesDisplay — existing inline rendering (to extract)

[VERIFIED: NotesRecognitionGame.jsx lines 2479-2509]

```jsx
// Source: NotesRecognitionGame.jsx lines 2479-2509
<div className="flex items-center gap-0.5">
  {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
    <AnimatePresence key={i} mode="wait">
      {i < lives ? (
        <motion.div
          key={`heart-${i}-alive`}
          initial={false}
          exit={reduce ? undefined : { scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 0.3 }}
        >
          <Heart className="h-5 w-5 fill-red-400 text-red-400 sm:h-6 sm:w-6" />
        </motion.div>
      ) : (
        <motion.div
          key={`heart-${i}-dead`}
          initial={reduce ? undefined : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.2 }}
        >
          <Heart className="h-5 w-5 text-white/30 sm:h-6 sm:w-6" />
        </motion.div>
      )}
    </AnimatePresence>
  ))}
</div>
```

### ComboPill — existing inline rendering (to extract)

[VERIFIED: NotesRecognitionGame.jsx lines 2435-2469]

```jsx
// Source: NotesRecognitionGame.jsx lines 2435-2469
<motion.div
  ref={comboPillRef}
  animate={
    comboShake
      ? { x: [0, -6, 6, -4, 4, 0] }
      : combo > 0
        ? { scale: [1, 1.18, 1] }
        : undefined
  }
  transition={
    reduce ? undefined : { type: "tween", duration: 0.22, ease: "easeInOut" }
  }
  className={`flex items-center gap-1 rounded-full border px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none ${
    combo >= 8
      ? "border-yellow-400/40 bg-yellow-500/20"
      : combo >= 3
        ? "border-amber-400/30 bg-amber-500/15"
        : "border-white/20 bg-white/10"
  }`}
>
  <Zap
    className={`h-4 w-4 ${combo >= 8 ? "fill-yellow-300 text-yellow-300" : combo >= 3 ? "fill-amber-300 text-amber-300" : "text-white/70"}`}
  />
  <span className="font-mono text-sm font-bold tracking-wide text-white sm:text-base">
    {combo}
  </span>
</motion.div>
```

### OnFireBadge + OnFireSplash — existing inline rendering (to extract)

[VERIFIED: NotesRecognitionGame.jsx lines 2228-2247, 2415-2432]

```jsx
// OnFireSplash (fixed overlay — lines 2228-2247):
<AnimatePresence>
  {showFireSplash && (
    <motion.div key="fire-splash"
      initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [1, 1.15, 1] }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
      <img src={flameIcon} alt="" className="h-24 w-24 drop-shadow-[0_0_16px_rgba(251,146,60,0.6)] sm:h-28 sm:w-28" />
    </motion.div>
  )}
</AnimatePresence>

// OnFireBadge (inline in HUD row — lines 2415-2432):
<AnimatePresence>
  {isOnFire && (
    <motion.div key="fire-badge"
      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={reduce || appReducedMotion ? "" : "animate-pulse"}>
      <img src={flameIcon} alt="" className="h-10 w-10" />
    </motion.div>
  )}
</AnimatePresence>
```

Note: `flameIcon` is `import flameIcon from "../../../assets/icons/flame.png"`. The extracted
component needs the correct relative path from `hud/`.

### MixedLessonGame's divergent progress bar (to replace)

[VERIFIED: MixedLessonGame.jsx lines 656-675]

```jsx
// BEFORE (delete this renderProgressBar function):
const renderProgressBar = () => (
  <div className="flex flex-1 items-center gap-3">
    <div
      className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
      role="progressbar"
      aria-valuenow={currentIndex}
      aria-valuemin={0}
      aria-valuemax={questions.length}
      aria-label={t("mixedLesson.progressLabel", "Lesson progress")}
    >
      <div
        className={`h-full rounded-full bg-green-400${reducedMotion ? "" : " transition-[width] duration-300"}`}
        style={{ width: `${(currentIndex / questions.length) * 100}%` }}
      />
    </div>
    <span className="whitespace-nowrap text-sm font-bold text-white/70">
      {currentIndex}/{questions.length}
    </span>
  </div>
);

// AFTER (replace call sites with):
<ProgressBar current={currentIndex} total={questions.length} />;
```

---

## i18n Surface

[VERIFIED: src/locales/en/common.json and src/locales/he/common.json direct inspection]

### Existing HUD keys (both locales — no new keys needed for shared components)

| Key                                | EN value                            | HE value                          |
| ---------------------------------- | ----------------------------------- | --------------------------------- |
| `noteRecognition.questionProgress` | "Question {{current}} of {{total}}" | "שאלה {{current}} מתוך {{total}}" |
| `games.time`                       | "Time"                              | exists (Hebrew)                   |
| `games.engagement.fast`            | "FAST!"                             | "מהיר!" (or "מהר!")               |
| `games.engagement.onFire`          | "ON FIRE!"                          | "מדהים!" or "על האש!"             |
| `games.engagement.doublePoints`    | "DOUBLE XP!"                        | "XP כפול!"                        |
| `games.engagement.triplePoints`    | "TRIPLE XP!"                        | "XP משולש!"                       |
| `games.gameOver.livesLost`         | "No lives left!"                    | "נגמרו הלבבות!"                   |
| `games.gameOver.timeUp`            | "Time's up!"                        | "הזמן נגמר!"                      |
| `mixedLesson.progressLabel`        | "Lesson progress"                   | "התקדמות בשיעור"                  |

### Potential new keys (ScorePill labels for non-XP games)

Games that track "correct count" rather than XP need a ScorePill label. Planner must decide
whether to use the existing `games.score` key ("Score") or add new game-specific keys.

| Game                | Score concept    | Suggested key                             |
| ------------------- | ---------------- | ----------------------------------------- |
| SightReadingGame    | numeric score    | `games.score` (existing)                  |
| RhythmReadingGame   | percent accuracy | `games.score` or `games.labels.score`     |
| RhythmDictationGame | correct count    | `games.score`                             |
| NoteComparisonGame  | correct count    | `games.score` or `games.labels.correct`   |
| IntervalGame        | correct count    | `games.score`                             |
| MemoryGame          | XP per match     | `games.score` or `XP` (same as NoteRecog) |
| MetronomeTrainer    | numeric score    | `games.score`                             |

If all non-XP games use `games.score` ("Score"), no new locale keys are needed. Only if
game-specific labels are desired are new keys required — both locales must be updated in
lockstep (REQ-07).

---

## Environment Availability

Step 2.6 SKIPPED — this phase is a pure code/component refactor with no external dependencies.
All tools (npm, vitest, eslint, prettier) are already verified working in the project.

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` → treated as enabled.

### Test Framework

| Property           | Value                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| Framework          | Vitest 3.2.4 + @testing-library/react 16.3.0 + @testing-library/jest-dom 6.9.1 |
| Config file        | `vitest.config.js` (project root)                                              |
| Environment        | jsdom                                                                          |
| Quick run command  | `npx vitest run src/components/games/shared/hud/`                              |
| Full suite command | `npm run test:run`                                                             |

### Phase Requirements → Test Map

| Req ID | Behavior                                                                             | Test Type    | Automated Command                                                                      | File Exists?    |
| ------ | ------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------- | --------------- |
| REQ-01 | ProgressBar renders correct fill width for given current/total                       | unit         | `npx vitest run src/components/games/shared/hud/ProgressBar`                           | ❌ Wave 0       |
| REQ-01 | ScorePill renders value + label; combo tint classes at tier 0/1/2                    | unit         | `npx vitest run src/components/games/shared/hud/ScorePill`                             | ❌ Wave 0       |
| REQ-01 | LivesDisplay renders correct heart states; exit animation skipped when reducedMotion | unit         | `npx vitest run src/components/games/shared/hud/LivesDisplay`                          | ❌ Wave 0       |
| REQ-01 | ComboPill renders combo count; tint classes per tier                                 | unit         | `npx vitest run src/components/games/shared/hud/ComboPill`                             | ❌ Wave 0       |
| REQ-01 | buildInitialTrailPool still passes (NotesRecognitionGame export unchanged)           | unit         | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow` | ✅ exists       |
| REQ-03 | ArcadeRhythmGame constants (INITIAL_LIVES, ON_FIRE_THRESHOLD) still exported         | unit         | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame`                    | ✅ exists       |
| REQ-03 | ArcadeRhythmGame lives logic (3 misses = 0 lives)                                    | unit         | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame`                    | ✅ exists       |
| REQ-06 | Full suite green after each wave                                                     | regression   | `npm run test:run`                                                                     | ✅ all existing |
| REQ-06 | ArcadeRhythmGame test: GameOverScreen renders when lives=0 (still works)             | unit         | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame`                    | ✅ exists       |
| REQ-07 | HE locale file has matching keys for any new ScorePill labels                        | manual check | `npm run test:run` (no automated i18n test exists)                                     | manual only     |

### Sampling Rate

- **Per task commit (Wave 1):** `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run test:run` full green + owner walkthrough of every restructured game screen

### Wave 0 Gaps

The following test files do not exist and should be created as part of Wave 1 before
NotesRecognitionGame is refactored:

- [ ] `src/components/games/shared/hud/ProgressBar.test.jsx` — tests correct fill %, checkpoint dot active states, aria counter text
- [ ] `src/components/games/shared/hud/ScorePill.test.jsx` — tests value rendering, label, comboTint class application at all three tiers
- [ ] `src/components/games/shared/hud/LivesDisplay.test.jsx` — tests heart count, active vs. spent state, aria-label
- [ ] `src/components/games/shared/hud/ComboPill.test.jsx` — tests combo count, tier color classes, Zap icon tint

There are NO existing full component render tests for NotesRecognitionGame itself (the existing
test only tests `buildInitialTrailPool`). The regression guarantee for Wave 1 relies on:

1. The new `hud/` unit tests verifying component correctness
2. Owner walkthrough of NotesRecognitionGame before and after

---

## Assumptions Log

| #   | Claim                                                                                                                              | Section                  | Risk if Wrong                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| A1  | `reduce` from `useMotionTokens()` and `appReducedMotion` from `useAccessibility()` can differ in practice (OS pref vs app toggle). | Reduced-Motion section   | If they are always in sync, using only one source is fine — lower complexity.                                 |
| A2  | ArcadeRhythmGame adding Framer Motion animations on LivesDisplay is "acceptable enhancement" not a regression per D-09.            | ArcadeRhythmGame section | If owner considers any animation addition a regression, LivesDisplay for Arcade needs a `noAnimation` prop.   |
| A3  | Using `games.score` ("Score") as the ScorePill label for non-XP games avoids new locale keys.                                      | i18n section             | If product wants game-specific labels (e.g. "Correct" for ear-training), new keys are needed in both locales. |

---

## Open Questions (RESOLVED)

1. **TimerDisplay extraction (D-04 discretion)**
   - What we know: `TimerDisplay` is already a named inline component with a clean single-prop contract (`formattedTime`). Extracting it is trivial.
   - What's unclear: Whether the single-consumer case warrants the overhead of a separate file.
   - RESOLVED: Extract it. The consistent pattern (all HUD pieces in `hud/`) is worth the trivial cost.

2. **OnFireBadge + OnFireSplash: one component or two?**
   - What we know: `OnFireBadge` (40px inline badge, always-visible when `isOnFire`) and `OnFireSplash` (96px fullscreen overlay, shown briefly on activation) are distinct elements with different props (`active: boolean` vs `show: boolean`).
   - What's unclear: Whether merging them saves complexity.
   - RESOLVED: Keep two components. They have different render positions (inline vs fixed), different z-indices, and different lifecycles. One file each.

3. **ComboPill `combo >= 2` guard in ArcadeRhythmGame**
   - What we know: ArcadeRhythmGame conditionally renders the combo badge `{combo >= 2 && <ComboPill .../>}`. NotesRecognitionGame renders it always.
   - What's unclear: Should this guard live inside `ComboPill` as a `hideBelow` prop, or remain in the parent?
   - RESOLVED: Keep it in the parent game. Components should not decide when to hide themselves based on thresholds — that's game-specific behavior.

4. **ProgressBar locale key prop for MixedLessonGame**
   - What we know: `ProgressBar` uses `t("noteRecognition.questionProgress")` which reads "Question N of N". MixedLessonGame uses `t("mixedLesson.progressLabel")` for aria-label.
   - What's unclear: The aria-label role attribute is currently on the bar container in MixedLessonGame, but is not in the shared ProgressBar.
   - RESOLVED: Add `aria-label` to the shared `ProgressBar` container, with value derived from `t("noteRecognition.questionProgress", { current, total })`. The MixedLessonGame bar drops its own aria-label in favor of the shared one. This is acceptable since the content ("Question N of N" or "N of N") is semantically equivalent.

---

## Security Domain

This phase is a pure client-side React component refactor with no network calls, no new
authentication surfaces, no new data storage, and no new user input vectors. ASVS categories
V2/V3/V4/V6 do not apply. V5 (input validation) is not applicable — HUD components receive
pre-validated numeric values from parent state. No security review needed for this phase.

---

## Sources

### Primary (HIGH confidence)

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — complete audit of inline HUD components (lines 295-384) and render section (lines 2208-2610)
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — HUD render section (lines 1119-1188), landscape wiring (lines 16, 141)
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — divergent progress bar (lines 656-675)
- `src/components/games/ear-training-games/NoteComparisonGame.jsx` — HUD rendering (lines 420-445)
- `src/components/games/ear-training-games/IntervalGame.jsx` — HUD rendering (lines 535-550)
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — header section (lines 1397-1421)
- `src/components/games/notes-master-games/MemoryGame.jsx` — score display (lines 882-900)
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — progress bar section (lines 3497-3530)
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — right column (lines 734-769)
- `src/locales/en/common.json` and `src/locales/he/common.json` — verified HUD locale keys
- `src/contexts/AccessibilityContext.jsx` — `useAccessibility()` API, `reducedMotion` field
- `src/utils/useMotionTokens.js` — `reduce`, `soft`, `snappy`, `fade` tokens
- `.planning/phases/36-game-screen-ui-unification/36-CONTEXT.md` — all locked decisions
- `.planning/phases/36-game-screen-ui-unification/36-SPEC.md` — requirements, gap matrix
- `.planning/phases/36-game-screen-ui-unification/36-UI-SPEC.md` — visual/animation contract

### Secondary (MEDIUM confidence)

- `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — verified existing test coverage scope (constants, lives/combo logic, game-over condition)
- `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` — verified test only covers `buildInitialTrailPool`, not HUD rendering

---

## Metadata

**Confidence breakdown:**

| Area                             | Level | Reason                                                              |
| -------------------------------- | ----- | ------------------------------------------------------------------- |
| NotesRecognitionGame HUD anatomy | HIGH  | Direct line-by-line inspection of the reference file                |
| Adoption state per game          | HIGH  | Direct inspection of all 9 game files                               |
| ArcadeRhythmGame wiring          | HIGH  | Lines 16/141 confirmed for landscape; HUD lines 1119-1188 confirmed |
| i18n surface                     | HIGH  | Both locale files inspected directly                                |
| Animation contract               | HIGH  | Matched to 36-UI-SPEC.md which cross-references actual source lines |
| Test coverage gaps               | HIGH  | All test files enumerated; confirmed no render tests for NRG HUD    |
| Wave sequencing feasibility      | HIGH  | No inter-wave dependencies beyond "Wave 1 proves ProgressBar API"   |

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (stable internal codebase — valid until next major refactor)
