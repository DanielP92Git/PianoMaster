# Phase 03: Adaptive Pedagogy - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 14 (new + modified)
**Analogs found:** 13 / 14

## File Classification

| New/Modified File                                                                                    | Role                   | Data Flow                                 | Closest Analog                                                                                                                                                     | Match Quality                                                         |
| ---------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `src/components/games/sight-reading-game/utils/adaptiveEngine.js`                                    | utility                | transform (config-in/config-out)          | `src/components/games/sight-reading-game/utils/patternBuilder.js`                                                                                                  | role-match (transform shape identical, no adaptive precedent)         |
| `src/components/games/sight-reading-game/constants/adaptiveTiers.js`                                 | config                 | transform                                 | `src/components/games/sight-reading-game/constants/gradingModes.js` (secondary: `NotesRecognitionGame.jsx` `COMBO_TIERS`)                                          | exact (config-constants-module style)                                 |
| `src/components/games/sight-reading-game/utils/adaptiveEngine.test.js`                               | test                   | transform                                 | `src/services/skillProgressService.test.js` (pure-fn unit test style)                                                                                              | role-match                                                            |
| `src/contexts/SightReadingSessionContext.jsx`                                                        | provider               | event-driven (ref-mirrored session state) | itself (existing `combo`/`gradingMode` state)                                                                                                                      | exact (extend existing file, no external analog needed)               |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`                                       | controller/component   | request-response + event-driven           | itself (existing `handleNextExercise`/`loadExercisePattern`/`perNoteAccuracy` blocks) + `NotesRecognitionGame.jsx` (auto-grow precedent)                           | exact (extend existing file)                                          |
| `src/services/skillProgressService.js`                                                               | service                | CRUD (JSONB merge-upsert)                 | itself — `updateExerciseProgress`/`updateNodeProgress` (existing `exercise_progress` merge)                                                                        | exact                                                                 |
| `src/hooks/useVictoryState.js`                                                                       | hook                   | CRUD orchestration                        | itself — existing `processTrailCompletion` effect                                                                                                                  | exact (extend existing file)                                          |
| `src/components/games/VictoryScreen.jsx`                                                             | component              | request-response (prop passthrough)       | itself — existing prop → `useVictoryState` wiring                                                                                                                  | exact                                                                 |
| `supabase/migrations/<timestamp>_add_note_mastery.sql`                                               | migration              | batch (DDL)                               | `supabase/migrations/20260125000001_add_exercise_progress.sql`                                                                                                     | exact                                                                 |
| `src/components/games/sight-reading-game/components/LevelUpCue.jsx` (NEW, name planner's discretion) | component              | event-driven (presentational cue)         | `src/components/games/shared/hud/OnFireSplash.jsx` + `OnFireBadge.jsx`                                                                                             | role-match (distinct concept, same reduced-motion-aware splash shape) |
| `src/locales/en/common.json` / `src/locales/he/common.json`                                          | config (i18n resource) | transform                                 | itself — existing `sightReading.*` namespace                                                                                                                       | exact                                                                 |
| `src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx`               | test                   | request-response/event-driven             | existing sibling tests in same `__tests__/` dir (e.g. `.practiceMode.test.jsx`/`.combo.test.jsx` naming convention — not read directly, referenced by RESEARCH.md) | role-match                                                            |
| `src/services/skillProgressService.test.js` (extend)                                                 | test                   | CRUD                                      | itself — existing test file for `updateExerciseProgress`                                                                                                           | exact                                                                 |
| `src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` (extend)                   | test                   | transform                                 | itself — existing test file                                                                                                                                        | exact                                                                 |

## Pattern Assignments

### `src/components/games/sight-reading-game/utils/adaptiveEngine.js` (utility, transform)

**Analog:** `src/components/games/sight-reading-game/utils/patternBuilder.js` (config-in/config-out shape) + `NotesRecognitionGame.jsx` `COMBO_TIERS` (tier-array shape) + `constants/gradingModes.js` (module doc-comment convention)

**Config-in/config-out shape to follow** (`patternBuilder.js` lines 93-97, signature only — do not mutate internal generation logic):

```javascript
export async function generatePatternData({
  difficulty,
  timeSignature,
  tempo,
  selectedNotes = [],
  // ...
```

The adaptive engine must follow the same discipline: pure functions taking a full settings/tier object in, returning a new settings object out — **no internal mutable state**, no reads of component state. `computeNextTier(streakCount, currentTierIndex)` and `applyTierToSettings(gameSettings, tier, nodeNoteConfig)` should both be pure.

**Tier-array constant shape precedent** (`NotesRecognitionGame.jsx` lines 313-324):

```javascript
// === Engagement constants (outside component to avoid re-creation) ===
const COMBO_TIERS = [
  { min: 0, multiplier: 1 },
  { min: 3, multiplier: 2 },
  { min: 8, multiplier: 3 },
];
const SPEED_BONUS_THRESHOLD_MS = 3000;
const BASE_XP = 5;
const INITIAL_LIVES = 3;
const ON_FIRE_THRESHOLD = 5;
const MAX_EXTRA_NOTES = 3;
const GROW_INTERVAL = 3; // Reveal next hidden note every 3-combo
```

`constants/adaptiveTiers.js` should define its tier ladder as a similarly flat array of plain objects (module-level, outside any component), e.g. `{ index: -2, tempoDeltaBpm: -20, widenNotes: false, includeRests: false }, ...`. Per RESEARCH.md's Open Question 3 recommendation, a 5-tier symmetric ladder (`-2, -1, 0, +1, +2`) with tier 0 = node's authored baseline is the concrete shape to implement.

**Weighted note selection — no existing precedent, write fresh** (confirmed via RESEARCH.md: `grep` for "weighted" found nothing in `src/`). Nearest analogous randomization style is the plain `Math.random()` index pick already used in `patternBuilder.js` (lines 353, 410, 413, 417):

```javascript
staffPerBeat.set(beat, Math.random() < 0.5 ? "treble" : "bass");
// ...
candidates[Math.floor(Math.random() * candidates.length)];
notePool[Math.floor(Math.random() * notePool.length)];
```

`weightedNoteSelection(pool, masteryMap, minAttempts)` should follow this same "plain array + `Math.random()`" style (cumulative-weight array), not introduce a new abstraction.

**Node-lookup pattern for the real "stretch" pool** (`SightReadingGame.jsx` lines 56, 879, confirmed existing import):

```javascript
import { getNodeById, getTrailTabForNode } from "../../../data/skillTrail";
// ...
const node = getNodeById(nodeId);
// node.noteConfig.notePool  → full node pool (superset)
// node.noteConfig.focusNotes / contextNotes → node-level split (NOT exercise-level)
```

**Critical:** the widening/stretch pool for D-02 is `getNodeById(nodeId)?.noteConfig?.notePool` (superset) minus the exercise's own `gameSettings.selectedNotes` (subset) — NOT `nodeConfig.focusNotes` (always empty at exercise time for sight-reading, per RESEARCH.md Pitfall 1). `applyTierToSettings` must accept this superset pool as an explicit parameter, not derive it internally.

---

### `src/components/games/sight-reading-game/constants/adaptiveTiers.js` (config, transform)

**Analog:** `src/components/games/sight-reading-game/constants/gradingModes.js` (full file, 19 lines — module doc-comment + exported plain-object/array constants style):

```javascript
// Grading modes for the sight-reading game (Phase 02 — PRAC-03).
// Test mode is the default and the only scored path (D-01/D-03).
// Practice mode widens timing tolerances AND grades pitch-only (D-04).
export const GRADING_MODES = { PRACTICE: "practice", TEST: "test" };

// localStorage key — mirrors the existing "sightReadingInputMode" preference pattern (D-03).
export const GRADING_MODE_STORAGE_KEY = "sightReadingGradingMode";

// Practice-mode leniency. Must scale BOTH the base constants AND the duration-fraction clamps,
// because at fast tempos the clamp binds before the constant (RESEARCH.md Pitfall 5).
// ~2x is the starting hypothesis (Claude's discretion per CONTEXT.md); clamp fractions stay < 1.0
// to avoid full window overlap / neighbor misattribution.
export const PRACTICE_TIMING = {
  toleranceMultiplier: 2,
  lateClampFraction: 0.85,
  earlyClampFraction: 0.75,
  statusMultiplier: 2,
};
```

Follow this exact convention: a leading comment block explaining the phase/decision-ID rationale, then plain exported `const` objects/arrays — no classes, no factory functions. Tempo bounds should be expressed as `BASE_TEMPO_CLAMP_MIN_FRACTION = 0.75` / `_MAX_FRACTION = 1.25` (per D-06) alongside the tier array, mirroring how `PRACTICE_TIMING` bundles multiple related numeric knobs into one exported object.

---

### `src/contexts/SightReadingSessionContext.jsx` (provider, event-driven ref-mirrored state)

**Analog:** itself — existing `gradingMode`/`isModeLocked` and `combo`/`isOnFire` state pairs (full file read, lines 1-239)

**Ref-mirror pattern to replicate exactly** (lines 28-39, 41-50, 62-78):

```javascript
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);
const [isOnFire, setIsOnFire] = useState(false);
const isOnFireRef = useRef(false);

// Session-scoped grading mode (D-05): Practice vs Test, with a lock to prevent switching
// mid-exercise. gradingModeRef mirrors gradingMode so synchronous detection callbacks (e.g.
// pitch-detection handlers) can read the current mode without a stale closure (Pattern 1).
const [gradingMode, setGradingModeState] = useState(GRADING_MODES.TEST);
const gradingModeRef = useRef(GRADING_MODES.TEST);
const [isModeLocked, setIsModeLocked] = useState(false);
const isModeLockedRef = useRef(false);

const setGradingMode = useCallback((mode) => {
  if (isModeLockedRef.current) {
    return;
  }
  if (mode !== GRADING_MODES.PRACTICE && mode !== GRADING_MODES.TEST) {
    return;
  }
  gradingModeRef.current = mode;
  setGradingModeState(mode);
}, []);

const incrementCombo = useCallback(() => {
  comboRef.current += 1;
  setCombo(comboRef.current);
  if (comboRef.current >= ON_FIRE_THRESHOLD && !isOnFireRef.current) {
    isOnFireRef.current = true;
    setIsOnFire(true);
  }
}, []);
```

The new adaptive streak counter + current-tier-index state (D-01) should add an identical `[value, setValueState] = useState(...)` + `useRef` pair, with every setter writing the ref synchronously before/alongside `setState` — this is the load-bearing detail: **every** consumer of this state inside a callback (`handleNextExercise`, mic-detection handlers) must read the ref, never the state closure.

**Reset-on-session-boundary pattern** (lines 80-98, `startSession`/`resetSession` — both already reset `combo`/`isOnFire`):

```javascript
const startSession = useCallback(() => {
  setState(() => ({
    ...createInitialState(),
    status: "in-progress",
    sessionId: Date.now(),
  }));
  comboRef.current = 0;
  setCombo(0);
  isOnFireRef.current = false;
  setIsOnFire(false);
}, []);

const resetSession = useCallback(() => {
  setState(() => createInitialState());
  comboRef.current = 0;
  setCombo(0);
  isOnFireRef.current = false;
  setIsOnFire(false);
}, []);
```

The new streak/tier state must be reset in **both** `startSession` and `resetSession` identically — copy this exact dual-reset placement.

**Memoized context value + dependency array** (lines 148-212) — new state/refs/setters must be added to both the returned object literal and the `useMemo` dependency array, matching how `gradingMode`/`setGradingMode` were added alongside the pre-existing `combo`/`incrementCombo`.

---

### `src/components/games/sight-reading-game/SightReadingGame.jsx` (controller/component, request-response + event-driven)

**Analog:** itself (primary integration surface, ~3,900 lines) — the following exact blocks are the mutation/read points.

**Imports** (lines 1-60, relevant subset already present — no new import style needed, just add `adaptiveEngine`/`adaptiveTiers`):

```javascript
import { usePatternGeneration } from "./hooks/usePatternGeneration";
import {
  GRADING_MODES,
  GRADING_MODE_STORAGE_KEY,
  PRACTICE_TIMING,
} from "./constants/gradingModes";
import {
  SIGHT_READING_SESSION_CONSTANTS,
  useSightReadingSession,
} from "../../../contexts/SightReadingSessionContext";
import VictoryScreen from "../VictoryScreen";
import { getNodeById, getTrailTabForNode } from "../../../data/skillTrail";
```

Add `import { computeNextTier, applyTierToSettings } from "./utils/adaptiveEngine";` and `import { ADAPTIVE_TIERS } from "./constants/adaptiveTiers";` alongside these.

**perNoteAccuracy calculation — the exact D-10 shape, currently discarded** (lines 1453-1484, verified, full block):

```javascript
const perNoteAccuracy = currentPattern.notes
  .filter((event) => event.type === "note" && event.pitch)
  .reduce((acc, event) => {
    const key = event.pitch;
    if (!key) return acc;
    if (!acc[key]) {
      acc[key] = {
        total: 0,
        correct: 0,
        label: getNoteLabel(key),
      };
    }
    acc[key].total += 1;
    return acc;
  }, {});

performanceResults.forEach((result) => {
  const expected = result.expected;
  if (!expected || !perNoteAccuracy[expected]) return;
  if (result.isCorrect) {
    perNoteAccuracy[expected].correct += 1;
  }
});

Object.values(perNoteAccuracy).forEach((entry) => {
  entry.accuracy =
    entry.total === 0 ? 0 : Math.round((entry.correct / entry.total) * 100);
});

// perNoteAccuracy is retained on summaryStats for future per-note mastery tracking
// (deep-audit Phase D), but is intentionally not surfaced in the child-facing summary —
// the post-exercise panel is kept minimal (stars + accuracy bars + status breakdown).
```

This is set onto `summaryStats` at line ~1507 (`setSummaryStats({ ..., perNoteAccuracy, ... })`). Add a session-scoped accumulator (`sessionMasteryRef`) that merges this object into a running total — do this in the same effect or in `handleNextExercise` (see below), not by changing this calculation itself.

**Exercise-boundary hook point — where BOTH the tier mutation and mastery-merge must be inserted** (lines 2552-2575, verified, full function):

```javascript
const handleNextExercise = useCallback(() => {
  if (isSessionComplete) {
    return;
  }
  stopMetronomePlayback();
  // Record the exercise result when moving to next (not on Try Again)
  if (summaryStats && !exerciseRecorded) {
    recordSessionExercise(
      summaryStats.overallScore ?? 0,
      SESSION_MAX_EXERCISE_SCORE
    );
    setExerciseRecorded(true);
  }
  goToNextExercise();
  loadExercisePattern();
}, [
  loadExercisePattern,
  goToNextExercise,
  isSessionComplete,
  summaryStats,
  exerciseRecorded,
  recordSessionExercise,
  stopMetronomePlayback,
]);
```

**Landmine (RESEARCH.md Pitfall 2):** `loadExercisePattern` (below) closes over `gameSettings` state from the render that created it. Calling `setGameSettings(adaptedSettings)` then immediately `loadExercisePattern()` in this same function body will NOT use the new settings — React state updates are async. Fix: either (a) merge accumulated `summaryStats.perNoteAccuracy` into `sessionMasteryRef.current` here, compute `computeNextTier`/`applyTierToSettings` here, `setGameSettings(adaptedSettings)`, and modify `loadExercisePattern` to accept an explicit override argument read from a ref/param instead of the closure; or (b) add a `gameSettingsRef` mirror (see Shared Patterns below) and have `loadExercisePattern` read `gameSettingsRef.current` instead of the `gameSettings` closure.

**`loadExercisePattern` — the exact closure risk site** (lines 2347-2405, verified, full function):

```javascript
const loadExercisePattern = useCallback(
  async () => {
    try {
      audioEngine.stopScheduler();
      rhythmPlayback.stop();
      stopMetronomePlayback();
      setShowKeyboard(inputMode === "keyboard");
      if (previewPlaybackTimeoutRef.current) {
        clearTimeout(previewPlaybackTimeoutRef.current);
        previewPlaybackTimeoutRef.current = null;
      }

      const pattern = await generatePattern(
        gameSettings.difficulty,
        gameSettings.timeSignature,
        gameSettings.tempo,
        gameSettings.selectedNotes,
        gameSettings.clef,
        gameSettings.measuresPerPattern || 1,
        gameSettings.rhythmSettings,
        gameSettings.rhythmComplexity,
        gameSettings.keySignature || null
      );
      // ... setCurrentPattern(pattern), reset performance state, setGamePhase(DISPLAY) ...
    } catch (error) {
      console.error("Error loading exercise pattern:", error);
    }
  },
  // Deliberately omit stopMetronomePlayback: it's a stable callback (empty deps).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [gameSettings, generatePattern, audioEngine, rhythmPlayback, inputMode]
);
```

Every one of the 9 `gameSettings.*` reads here must reflect the freshly-adapted tier. Recommended: change this to `loadExercisePattern(overrideSettings)` where `const settings = overrideSettings ?? gameSettings;` is used for all 9 reads, and `handleNextExercise` passes the freshly-computed `adaptedSettings` explicitly.

**Node lookup + trail settings assembly (where the node's full note pool is available)** (lines 391-403, 879, verified):

```javascript
const buildTrailSettingsFromNode = useCallback(
  (config) => ({
    ...DEFAULT_SETTINGS,
    clef: config?.clef || "treble",
    selectedNotes: config?.notePool || [],
    measuresPerPattern: config?.measuresPerPattern || 1,
    timeSignature: config?.timeSignature || "4/4",
    enableSharps: trailEnableSharps,
    enableFlats: trailEnableFlats,
    keySignature: trailKeySignature,
  }),
  [trailEnableSharps, trailEnableFlats, trailKeySignature]
);
// ...
const node = getNodeById(nodeId); // already used elsewhere, e.g. handleNextTrailExercise
```

`applyTierToSettings` needs `getNodeById(nodeId)?.noteConfig?.notePool` as its "widen into" superset — fetch this once (e.g. in the node-auto-configure effect at lines 405-427) and store in a ref alongside `nodeConfig`, don't refetch on every exercise boundary.

**VictoryScreen invocation — where the accumulated session mastery must be threaded through** (lines 3773-3792, verified, full block):

```javascript
<VictoryScreen
  score={Math.round(sessionTotalScore)}
  totalPossibleScore={Math.max(1, totalPossibleSessionScore)}
  onReset={handleStartNewSession}
  timedMode={false}
  timeRemaining={0}
  initialTime={0}
  onExit={() => navigate("/practice-modes")}
  nodeId={nodeId}
  exerciseIndex={trailExerciseIndex}
  totalExercises={trailTotalExercises}
  exerciseType={trailExerciseType}
  onNextExercise={handleNextTrailExercise}
  suppressPersistence={isPracticeMode}
/>
```

Add a new prop here, e.g. `sessionMastery={sessionMasteryRef.current}`, following the exact same "pass accumulated ref/state as a new named prop" style already used for `suppressPersistence={isPracticeMode}`.

**Note-pool precedent for D-02/D-03 (auto-grow, no shrink precedent)** — see `NotesRecognitionGame.jsx` excerpts under Shared Patterns below.

---

### `src/services/skillProgressService.js` (service, CRUD JSONB merge-upsert)

**Analog:** itself — `updateExerciseProgress` (lines 385-494, verified, full function) and `updateNodeProgress` (lines 84+, signature verified)

**Exact JSONB read-merge-upsert pattern to extend** (lines 385-494):

```javascript
export const updateExerciseProgress = async (
  studentId,
  nodeId,
  exerciseIndex,
  exerciseType,
  stars,
  score,
  totalExercises,
  options = {}
) => {
  await verifyStudentDataAccess(studentId);
  try {
    if (!options.skipRateLimit) {
      const rateLimitResult = await checkRateLimit(studentId, nodeId);
      if (!rateLimitResult.allowed) {
        return { rateLimited: true, resetTime: rateLimitResult.resetTime };
      }
    }

    // Get existing node progress
    let nodeProgress = await getNodeProgress(studentId, nodeId);
    let exerciseProgressArray = nodeProgress?.exercise_progress || [];

    // ... find/merge/sort exerciseProgressArray, compute nodeStars/nodeBestScore ...

    const progressData = {
      student_id: studentId,
      node_id: nodeId,
      stars: nodeStars,
      best_score: nodeBestScore,
      exercises_completed: completedExercises.length,
      exercise_progress: exerciseProgressArray,
      last_practiced: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("student_skill_progress")
      .upsert(progressData, { onConflict: "student_id,node_id" })
      .select()
      .maybeSingle();

    if (error) throw error;

    return {
      ...data,
      nodeComplete: allExercisesComplete,
      exercisesRemaining: totalExercises - completedExercises.length,
    };
  } catch (error) {
    console.error("Error updating exercise progress:", error);
    throw error;
  }
};
```

Add an optional trailing parameter (e.g. `perNoteMastery = null`) to both `updateExerciseProgress` and `updateNodeProgress` — **must default to a no-op** (RESEARCH.md anti-pattern warning: these functions are shared across `NotesRecognitionGame`/`MemoryGame`/`MetronomeTrainer`/`SightReadingGame`; other callers must be byte-for-byte unaffected). Inside, read `nodeProgress?.note_mastery || {}`, merge per-pitch `{ correct: existing.correct + delta.correct, total: existing.total + delta.total }` (pure addition, D-10 — no decay), and add `note_mastery: mergedMastery` to the `progressData` object passed to the same `.upsert(progressData, { onConflict: 'student_id,node_id' })` call — do NOT create a second upsert call or a new table.

**Imports** (lines 1-13, verified, full import block):

```javascript
import supabase from "./supabase";
import { verifyStudentDataAccess } from "./authorizationUtils";
import { isNodeUnlocked, getUnlockedNodes } from "../data/skillTrail";
import { checkRateLimit } from "./rateLimitService";
import { isFreeNode } from "../config/subscriptionConfig";
import { Sentry } from "./sentryService";
```

No new imports needed for the mastery merge itself (pure JS object manipulation before the existing upsert call).

**`getNodeProgress`** (lines 54-72, verified) — the read-side counterpart; the mastery-read for D-09/D-11 weak-note targeting should reuse this exact function (`getNodeProgress(studentId, nodeId)` → `.note_mastery` field) rather than a new query.

---

### `src/hooks/useVictoryState.js` (hook, CRUD orchestration)

**Analog:** itself — `processTrailCompletion` effect (full file read, ~90-560 relevant range)

**Existing call sites that need a new param threaded through** (lines 385-509, verified):

```javascript
// Exercise-level path (lines 403-414):
const result = await updateExerciseProgress(
  user.id,
  nodeId,
  exerciseIndex,
  exerciseType || node.exercises?.[exerciseIndex]?.type || "unknown",
  earnedStars,
  Math.round(Math.min(scorePercentage, 100)),
  totalExercises,
  progressOptions
);

// Legacy/single-exercise path (lines 470-476):
const result = await updateNodeProgress(
  user.id,
  nodeId,
  earnedStars,
  Math.round(Math.min(scorePercentage, 100)),
  progressOptions
);
```

Add a new `useVictoryState({ ..., sessionMastery = null })` parameter (accept it as a new destructured prop, following the existing optional-prop style at lines 89-103: `nodeId = null, exerciseIndex = null, ..., suppressPersistence = false`), and pass it as the new trailing argument into both `updateExerciseProgress(...)` and `updateNodeProgress(...)` calls above.

**Practice-mode persistence-skip precedent to mirror for the mastery write** (lines 358-373, verified — `suppressPersistence` branch inside `processTrailCompletion`):

```javascript
if (suppressPersistence) {
  // Practice run: skip all trail-progress + XP persistence, but let
  // the UI still settle (stars were already computed above). Still
  // derive exercisesRemaining/nodeComplete locally so the "Next
  // Exercise" CTA works for multi-exercise nodes in Practice mode
  // (CR-02) — without this, VictoryScreen always falls back to the
  // "node complete" branch since exercisesRemaining stays at its
  // useState(0) initial value.
  if (exerciseIndex !== null && totalExercises !== null) {
    const remaining = Math.max(0, totalExercises - exerciseIndex - 1);
    setExercisesRemaining(remaining);
    setNodeComplete(remaining === 0);
  }
  setIsProcessingTrail(false);
  return;
}
```

Per RESEARCH.md Pitfall 4/Open Question 1, the recommended default is: mastery writes follow this exact same early-return branch (skip in Practice mode, same as trail-progress/XP), since `sessionMastery` never reaches the `updateExerciseProgress`/`updateNodeProgress` calls when this branch returns early — no additional gating code needed beyond passing `sessionMastery` after this existing check, it's already covered "for free" by this early return.

**Props destructuring style to extend** (lines 89-103, verified, full signature):

```javascript
export function useVictoryState({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
  onExit,
  nodeId = null,
  exerciseIndex = null,
  totalExercises = null,
  exerciseType = null,
  onNextExercise = null,
  suppressPersistence = false,
}) {
```

---

### `src/components/games/VictoryScreen.jsx` (component, prop passthrough)

**Analog:** itself (lines 1-90, verified)

**Prop declaration + passthrough style** (lines 15-83):

```javascript
const VictoryScreen = ({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
  onExit,
  nodeId = null,
  exerciseIndex = null,
  totalExercises = null,
  exerciseType = null,
  onNextExercise = null,
  challengeMode = false,
  challengeId = null,
  challengeXpReward = null,
  subtitle = null,
  suppressPersistence = false,
}) => {
  const {
    /* ... destructured hook return values used by render ... */
  } = useVictoryState({
    score,
    totalPossibleScore,
    onReset,
    timedMode,
    timeRemaining,
    initialTime,
    onExit,
    nodeId,
    exerciseIndex,
    totalExercises,
    exerciseType,
    onNextExercise,
    suppressPersistence,
  });
```

Add `sessionMastery = null` to the destructured props (matching the `= null` default style of every other optional prop here) and pass it straight through into the `useVictoryState({...})` call — this component does not need to read or render `sessionMastery` itself, only relay it (same as it currently relays `suppressPersistence`).

---

### `supabase/migrations/<timestamp>_add_note_mastery.sql` (migration, batch DDL)

**Analog:** `supabase/migrations/20260125000001_add_exercise_progress.sql` (full file, verified):

```sql
-- Migration: Add exercise_progress JSONB column for per-exercise tracking
-- This supports sequential exercise completion within trail nodes

-- Add JSONB column for per-exercise tracking
ALTER TABLE student_skill_progress
ADD COLUMN IF NOT EXISTS exercise_progress JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN student_skill_progress.exercise_progress IS 'Array of per-exercise progress: [{ "index": 0, "type": "note_recognition", "stars": 2, "bestScore": 85, "completedAt": "2026-01-25T..." }, ...]';

-- Create index for querying exercise progress
CREATE INDEX IF NOT EXISTS idx_student_skill_progress_exercise_progress
ON student_skill_progress USING GIN (exercise_progress);
```

Follow this identical shape, substituting the column name/type/default and comment:

```sql
-- Migration: Add note_mastery JSONB column for per-node per-pitch cumulative accuracy
-- Enables cross-session weak-note targeting in the sight-reading game (ADAPT-03)

ALTER TABLE student_skill_progress
ADD COLUMN IF NOT EXISTS note_mastery JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN student_skill_progress.note_mastery IS 'Per-pitch cumulative accuracy for this node, keyed by pitch: { "C4": { "correct": 7, "total": 9 }, ... }. No decay/recency-weighting (simple cumulative addition, D-10).';

CREATE INDEX IF NOT EXISTS idx_student_skill_progress_note_mastery
ON student_skill_progress USING GIN (note_mastery);
```

**No new RLS policy needed** — see Shared Patterns → RLS below. Do not author a new policy file; this migration is DDL-only.

---

### `src/components/games/sight-reading-game/components/LevelUpCue.jsx` (NEW component, event-driven presentational)

**Analog:** `src/components/games/shared/hud/OnFireSplash.jsx` (full file, verified) — closest structural match for a brief, positive-only, reduced-motion-aware full-screen cue:

```javascript
import { AnimatePresence, motion } from "framer-motion";
import flameIcon from "../../../../assets/icons/flame.png";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

export function OnFireSplash({ show }) {
  const { reduce } = useMotionTokens();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="fire-splash"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={
            reduce ? { opacity: 1 } : { opacity: 1, scale: [1, 1.15, 1] }
          }
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
        >
          <img
            src={flameIcon}
            alt=""
            className="h-24 w-24 drop-shadow-[0_0_16px_rgba(251,146,60,0.6)] sm:h-28 sm:w-28"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

Follow this exact structure (`AnimatePresence` + `motion.div`, `reduce`-branched `initial`/`animate` props, `fixed inset-0 z-[70]` full-viewport overlay, `pointer-events-none`) for the escalation "leveling up" cue (D-12), but use a distinct icon/copy and a new `sightReading.adaptive.*` i18n key — **do not literally reuse `OnFireSplash`/`OnFireBadge`** per CONTEXT.md's explicit note that this is "a distinct concept from combo and should not literally reuse those components without a naming/meaning check." Per D-12, this component only ever renders on escalation (never on easing) — there is no "ease" variant to build.

---

### `src/locales/en/common.json` / `src/locales/he/common.json` (config, i18n resource)

**Analog:** itself — existing `sightReading.*` namespace (`en/common.json` lines 1629-1668, verified excerpt):

```json
"sightReading": {
  "exercise": "Exercise {{current}} / {{total}}",
  "startPlaying": "Start Playing",
  "listenCountIn": "Listen to the count-in",
  "nextExercise": "Next Exercise",
  "tryAgain": "Try Again",
  "changeSettings": "Change Settings",
  "backToMenu": "Back to Menu",
  "finalScore": "Final Score",
  "encouragement": "Each attempt builds confidence and accuracy. Take a breath, reset, and try again - your next run could be the winning one!",
  "feedback": {
    "excellent": "Excellent!",
    "goodJob": "Good Job!",
    "keepPracticing": "Keep Practicing!",
    "tryAgain": "Try Again!"
  },
  "bpm": "{{value}} BPM",
  "timing": { "perfect": "Perfect!", "good": "Good", "okay": "Okay", "early": "Too Early", "late": "Too Late", "wrongNote": "Wrong Note!" },
  "summary": { "pitch": "Notes", "rhythm": "Rhythm", "correct": "Correct", "tooEarly": "Too Early", "tooLate": "Too Late", "missed": "Missed", "wrongNotes": "Wrong Notes", "practiceNotScored": "Practice run — not scored" },
```

Add new escalation-cue copy as a new nested key, e.g. `sightReading.adaptive.levelUp`, following this exact nesting/naming convention (flat, short, present-tense strings; `{{placeholder}}` interpolation style already used in `"exercise"` and `"bpm"`). The `he/common.json` file mirrors this same namespace at the equivalent line (verified present at line 710 and 1629 in `en/common.json` — two occurrences, confirm which is canonical `sightReading` vs. a differently-scoped duplicate before editing; `he/common.json` structure mirrors `en/common.json` 1:1 per established parity convention). No new copy for silent easing is needed (D-12 — easing has no UI signal).

---

### Test files (extend existing / new, following sibling conventions)

- `src/components/games/sight-reading-game/utils/adaptiveEngine.test.js` (NEW) — pure-function unit tests, no DOM needed (mirrors `src/services/skillProgressService.js`'s plain-Vitest, non-JSDOM test style per CLAUDE.md "Testing" conventions).
- `src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx` (NEW) — component/integration test, must explicitly regression-test the Pitfall 2 stale-closure scenario (tier applied at exercise N actually takes effect at exercise N+1's pattern generation, not N+2).
- `src/services/skillProgressService.test.js` (EXTEND, file already exists) — add test cases for the new `perNoteMastery` merge-upsert param on `updateExerciseProgress`/`updateNodeProgress`, following the existing test file's structure for `exercise_progress` merge assertions.
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` (EXTEND, file already exists) — add test cases verifying timing-window behavior at the top of the D-06 tempo range (1.25x base tempo) in both grading modes (RESEARCH.md Pitfall 5 regression guard).

## Shared Patterns

### Ref-mirror for stale-closure-prone session state

**Source:** `src/contexts/SightReadingSessionContext.jsx` lines 28-39 (combo/gradingMode pairs), reinforced by RESEARCH.md Pitfall 2 for `gameSettings` itself
**Apply to:** the new adaptive streak counter + current tier state in `SightReadingSessionContext.jsx`, AND (new instance not yet in the codebase) a `gameSettingsRef` mirror in `SightReadingGame.jsx` if the planner chooses approach (b) over passing an explicit override argument into `loadExercisePattern`.

```javascript
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);
// every setter writes both, synchronously, in this order:
comboRef.current = newValue;
setCombo(newValue);
```

### JSONB merge-on-upsert for per-node student state

**Source:** `src/services/skillProgressService.js` `updateExerciseProgress` (lines 409-483)
**Apply to:** the new `note_mastery` field — read `nodeProgress?.note_mastery || {}`, merge `{ correct: existing.correct + delta.correct, total: existing.total + delta.total }` per pitch, fold into the SAME `progressData` object and SAME `.upsert(progressData, { onConflict: 'student_id,node_id' })` call already used for `exercise_progress`/`stars`/`best_score` — do not add a second DB round-trip.

### RLS — no new policy required

**Source:** `supabase/migrations/20260124000001_add_skill_trail_system.sql` (existing row-level policies on `student_skill_progress`), confirmed by RESEARCH.md's live verification

```sql
CREATE POLICY student_skill_progress_insert_own
  ON student_skill_progress FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY student_skill_progress_update_own
  ON student_skill_progress FOR UPDATE
  USING (student_id = auth.uid());
```

**Apply to:** ADAPT-04 — the new `note_mastery` column is automatically covered by these existing row-level policies (Postgres RLS is row-level, not column-level). The migration for this phase must NOT attempt to author a new policy scoped to this column. The `/gsd-secure-phase` pass should confirm this explicitly (including the teacher-SELECT nuance — teachers CAN read `note_mastery` via the existing teacher-connected-student branch of `student_skill_progress_select_consolidated`, and this is intentional per D-04, not a gap to close).

### Note-pool auto-grow/shrink precedent (grow has precedent, shrink does not)

**Source:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 337-352 (`buildInitialTrailPool`) and lines 1687-1718 (auto-grow trigger)

```javascript
export function buildInitialTrailPool(nodeId) {
  if (!nodeId) return { initialNotes: [], hiddenNotes: [] };
  const node = getNodeById(nodeId);
  if (!node?.noteConfig) return { initialNotes: [], hiddenNotes: [] };
  const { notePool = [], focusNotes = [], contextNotes = [] } = node.noteConfig;
  if (focusNotes.length > 0 && contextNotes.length > 0) {
    return { initialNotes: [...contextNotes], hiddenNotes: [...focusNotes] };
  }
  return { initialNotes: [...notePool], hiddenNotes: [] };
}
```

```javascript
// Auto-grow note pool (trail mode only — reveals hidden notes from current node's pool)
if (nodeId && comboRef.current > 0 && hiddenNodeNotesRef.current.length > 0) {
  const visiblePoolSize =
    (normalizedSelectedNotes?.length || 0) +
    sessionExtraNotesRef.current.length;
  const shouldReveal =
    visiblePoolSize <= 1 || comboRef.current % GROW_INTERVAL === 0;
  if (shouldReveal) {
    const currentExtras = sessionExtraNotesRef.current;
    if (currentExtras.length < MAX_EXTRA_NOTES) {
      const nextNote = getNextHiddenNote();
      if (nextNote) {
        hiddenNodeNotesRef.current = hiddenNodeNotesRef.current.slice(1);
        const updated = [...currentExtras, nextNote];
        sessionExtraNotesRef.current = updated;
        setSessionExtraNotes(updated);
        setShowNewNoteBanner(true);
        setNewNoteBannerKey((prev) => prev + 1);
        setTimeout(() => setShowNewNoteBanner(false), 2000);
      }
    }
  }
}
```

**Apply to:** ADAPT-01/D-02 widening in `SightReadingGame.jsx`/`adaptiveEngine.js` — BUT note this pool is `node.noteConfig` (node-level), which per RESEARCH.md Pitfall 1 is NOT what `SightReadingGame.jsx` receives as `nodeConfig` via `location.state` (that's the exercise-level `config`). Reuse the "grow" mechanics/shape, but source the superset from a fresh `getNodeById(nodeId).noteConfig.notePool` call, and build the "shrink" (easing, D-03) logic fresh — there is no existing shrink precedent anywhere in the codebase to copy.

### Tempo/timing single-source-of-truth

**Source:** `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` lines 20-28, 36-60

```javascript
export function useTimingAnalysis({ tempo = 80, mode = GRADING_MODES.TEST } = {}) {
  const beatDurationMs = useMemo(() => {
    const bpm = Number(tempo) || 80;
    const safeBpm = Math.max(bpm, 1);
    return (60 / safeBpm) * 1000;
  }, [tempo]);
  // effectiveTolerances scales late/early/firstNoteEarly + lateClampFraction/earlyClampFraction
  // by PRACTICE_TIMING multipliers when mode === GRADING_MODES.PRACTICE
```

**Apply to:** ADAPT-02/D-06 tempo escalation — `gameSettings.tempo` is the single seam; this hook already re-derives `beatDurationMs`/clamp fractions from it automatically on every render. No new tempo-plumbing is needed beyond mutating `gameSettings.tempo` at exercise boundaries (same mutation point as note-range). RESEARCH.md Pitfall 5: explicitly test timing-window behavior at 1.25x base tempo in both grading modes since `lateClampFraction`/`earlyClampFraction` can bind before the raw tolerance constants at fast tempos.

## No Analog Found

| File                                                    | Role    | Data Flow | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------- | ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Shrink" tier-easing logic (inside `adaptiveEngine.js`) | utility | transform | First "shrink" mechanism in the codebase (RESEARCH.md, State of the Art table) — `NotesRecognitionGame.jsx`'s auto-grow only ever grows; no existing code narrows a note pool or reverts a tier. Planner should design this as new logic grounded in D-03's plain-English spec (narrow toward `focusNotes`, remove rests, lower tempo — mirror-image of the escalation tier step, not a wholly separate algorithm), not search further for a copy-paste source. |

## Metadata

**Analog search scope:** `src/components/games/sight-reading-game/` (full component + hooks + utils + constants), `src/contexts/SightReadingSessionContext.jsx`, `src/services/skillProgressService.js`, `src/hooks/useVictoryState.js`, `src/components/games/VictoryScreen.jsx`, `src/components/games/notes-master-games/NotesRecognitionGame.jsx`, `src/components/games/shared/hud/`, `supabase/migrations/`, `src/locales/{en,he}/common.json`
**Files scanned (read in full or targeted range):** 13 (SightReadingGame.jsx [4 ranges], SightReadingSessionContext.jsx [full], useVictoryState.js [full], skillProgressService.js [2 ranges], VictoryScreen.jsx [range], NotesRecognitionGame.jsx [2 ranges], patternBuilder.js [2 ranges], useTimingAnalysis.js [range], gradingModes.js [full], OnFireBadge.jsx [full], OnFireSplash.jsx [full], en/common.json [range], migration SQL [full])
**Pattern extraction date:** 2026-07-12
