# Sight Reading Game – Robustness & Accuracy Improvement Plan

This document is a **detailed implementation plan** for improving the robustness and musical accuracy of the Sight Reading game. It assumes the current code structure centered on `SightReadingGame.jsx` and its related hooks/components.

---

## 1. Prep & Orientation

### 1.1. Files & modules to know

- **Core game**
  - `src/components/games/sight-reading-game/SightReadingGame.jsx`
  - `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx`
  - `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx`
  - `src/components/games/sight-reading-game/components/FeedbackSummary.jsx`
- **Hooks & utilities**
  - `src/components/games/sight-reading-game/hooks/usePatternGeneration.js`
  - `src/components/games/sight-reading-game/hooks/useRhythmPlayback.js`
  - `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js`
  - `src/hooks/useAudioEngine.js`
  - `src/hooks/usePitchDetection.js`
  - `src/components/games/sight-reading-game/utils/scoreCalculator.js`
- **Session & persistence**
  - `src/contexts/SightReadingSessionContext.jsx`
  - `src/services/apiScores.js`

### 1.2. High‑level goals

- **Timing robustness**
  - Reduce subtle clock drift and off‑by‑one‑beat effects.
  - Make early/late scoring consistent across tempos and note values.
- **Input reliability**
  - Prevent double‑counting or missed first notes.
  - Align mic vs keyboard behavior.
- **Feedback clarity**
  - Make it obvious which notes are rests vs played notes.
  - Improve debugability (logs + overlays).
- **Test safety nets**
  - Extract a pure scoring core and cover edge‑cases with tests.

---

## 2. Timing System Improvements

### 2.1. Introduce a unified timing reference

**Goal**: Centralize how wall‑clock ms and AudioContext seconds are related, so every part of the game uses the same mapping.

- **In `SightReadingGame.jsx`**
  - **Add state/refs**:

    ```js
    const audioStartTimeRef = useRef(null);          // AudioContext time at performance start
    const wallClockStartTimeRef = useRef(null);      // Date.now() at performance start (ms)
    ```

  - **When scheduling count‑in in `beginPerformanceWithPattern`**:
    - After computing `countInStartTime` and `countInEndWallClockMs`, set:

      ```js
      audioStartTimeRef.current = countInStartTime;          // seconds
      wallClockStartTimeRef.current = countInEndWallClockMs; // ms; when note 1 is scheduled
      ```

  - **Add a helper** to convert between wall clock and audio time:

    ```js
    const getElapsedMsFromPerformanceStart = () => {
      if (!wallClockStartTimeRef.current) return 0;
      return Date.now() - wallClockStartTimeRef.current;
    };
    ```

  - **Update**:
    - `handleNoteDetected` to use `getElapsedMsFromPerformanceStart()` instead of recomputing `Date.now() - performanceStartTimeRef.current` in multiple places.
    - Any other use of `performanceStartTimeRef` to go through this helper.

**Result**: All scoring logic sees the same elapsed time in ms; count‑in, cursor animation, and scoring share a single origin.

---

### 2.2. Dynamic early/late tolerances

**Goal**: Scale timing windows based on tempo and note duration.

- **In `useTimingAnalysis.js`**
  - Right now tolerances come from `DEFAULT_TOLERANCES` with fixed ms.
  - **Change the API** of `useTimingAnalysis` to accept tempo and maybe a "difficulty" factor:

    ```js
    export function useTimingAnalysis({ tempo = 80, difficulty = "medium" } = {}) { ... }
    ```

  - **Inside `buildTimingWindows`**:
    - Compute **beatDurationMs** (already done).
    - Define **relative tolerance factors**:

      ```js
      const BASE_EARLY_RATIO = 0.2;  // 20% of note duration
      const BASE_LATE_RATIO = 0.25;  // 25% of note duration
      ```

    - For each event:

      ```js
      const noteDurationMs = durationMs; // from existing logic
      const isFirstPlayable = ...;

      const earlyAllowance = isFirstPlayable
        ? Math.max(200, noteDurationMs * BASE_EARLY_RATIO * 1.5)
        : Math.max(120, noteDurationMs * BASE_EARLY_RATIO);

      const lateAllowance = Math.max(150, noteDurationMs * BASE_LATE_RATIO);
      ```

    - Use those instead of the current fixed `DEFAULT_TOLERANCES.early/late`.

  - **Adjust `evaluateTiming` thresholds** to remain in relative terms (e.g. 10%, 20%, 30% of noteDuration) or leave as absolute ms but tuned to work well across tempos.

**Result**: Timing windows feel fair across slow and fast exercises; quarter‑note at 60 BPM and 120 BPM scale appropriately.

---

### 2.3. Optional latency calibration mode

**Goal**: Allow users to calibrate typical input latency once per device.

- **Add a `LatencyCalibration` component** (new file) that:
  - Plays a steady click (using `useAudioEngine`) for N beats (~16).
  - Prompts user to tap the same key (`space` or mapped piano key).
  - Collects pairs: `{ clickTime, tapTime }` in ms.
  - Computes:

    ```js
    const avgOffsetMs = mean(tapTime - clickTime);
    ```

  - Stores in `localStorage["sightReadingLatencyOffsetMs"]`.

- **In `SightReadingGame.jsx`**
  - Load the stored offset:

    ```js
    const latencyOffsetMs = useMemo(
      () => Number(localStorage.getItem("sightReadingLatencyOffsetMs") || 0),
      []
    );
    ```

  - Apply in scoring:

    ```js
    const elapsedMs = getElapsedMsFromPerformanceStart() - latencyOffsetMs;
    ```

  - Optionally, allow a "Reset calibration" UI in settings.

**Result**: Players with consistent hardware latency see more accurate timing judgments, especially on the first note.

---

## 3. Scoring Core & Debouncing

### 3.1. Extract a pure scoring function

**Goal**: Make timing/note matching unit‑testable.

- **Create** `src/components/games/sight-reading-game/utils/scoringCore.js`:

  ```js
  export function matchDetectionToNote({
    timingWindows,        // array from useTimingAnalysis
    performanceResults,   // current results
    elapsedMs,
    detectedPitch,
    phase,                // "count-in" | "performance"
  }) {
    // 1. scan windows
    // 2. apply rest skipping and override rules
    // 3. return { matchedIndex, matchedEvent, timingInfo } or null
  }
  ```

- **Refactor `handleNoteDetected`** to:
  - Call `matchDetectionToNote` to get `matchingNoteIndex`, `matchingEvent`, `timeDiff`, etc.
  - Keep only React state updates + logging in `handleNoteDetected`.

- **Add tests** (see section 6) around `matchDetectionToNote`.

---

### 3.2. Per‑note debouncing

**Goal**: Prevent multiple rapid hits on the same note from confusing scoring.

- **In `SightReadingGame.jsx`**
  - Add a ref:

    ```js
    const lastDetectionTimesRef = useRef({}); // key: noteIndex, value: ms
    ```

  - In `handleNoteDetected`, once `matchingNoteIndex` found:
    - Check the last time for that index:

      ```js
      const lastTime = lastDetectionTimesRef.current[matchingNoteIndex] ?? -Infinity;
      const DEBOUNCE_MS = 80;

      if (elapsedTimeMs - lastTime < DEBOUNCE_MS) {
        // ignore this detection; too close to previous one
        return;
      }
      lastDetectionTimesRef.current[matchingNoteIndex] = elapsedTimeMs;
      ```

  - Reset `lastDetectionTimesRef.current = {}` whenever a new performance starts or pattern reloads.

**Result**: A single note is scored once per musical attempt rather than being overwritten by "jitter" taps.

---

### 3.3. Simplify "count‑in vs performance" gating

**Goal**: Replace dual booleans (`scoringActive`, `isPerformanceLive`) with a clearer enum.

- **Define** a small timing state type:

  ```js
  const TIMING_STATE = {
    OFF: "off",
    EARLY_WINDOW: "early_window",  // count-in last beat
    LIVE: "live",                  // performance
  };
  ```

- **Replace** `scoringActive` and `isPerformanceLive` with:

  ```js
  const [timingState, setTimingState] = useState(TIMING_STATE.OFF);
  const timingStateRef = useRef(timingState);
  useEffect(() => { timingStateRef.current = timingState; }, [timingState]);
  ```

- **Transitions**:
  - Start of count‑in: `setTimingState(OFF)`.
  - When early scoring window opens: `setTimingState(EARLY_WINDOW)`.
  - When performance actually begins: `setTimingState(LIVE)`.

- **Single helper**:

  ```js
  const canScoreNow = (phase) => {
    const state = timingStateRef.current;
    if (phase === GAME_PHASES.COUNT_IN)
      return state === TIMING_STATE.EARLY_WINDOW;
    if (phase === GAME_PHASES.PERFORMANCE)
      return state === TIMING_STATE.LIVE;
    return false;
  };
  ```

- **Use `canScoreNow`** in:
  - `handleNoteDetected`.
  - `handleKeyboardNoteInput`.
  - Keydown handler.
  - (Optionally) mic pitch handler, if it bypasses `handleKeyboardNoteInput`.

**Result**: All paths rely on one consistent rule; fixing timing gating in one place fixes it everywhere.

---

## 4. Mic & Keyboard Consistency

### 4.1. Normalize frequency usage

**Goal**: Make scoring independent of frequency until you intentionally need pitch‑deviation analysis.

- **In `handleNoteDetected`**:
  - Treat `frequency` as optional; do not use it for correctness, only for logging.
- **In keyboard path**:
  - It already passes a dummy frequency (440). You can:
    - Stop logging `frequency.toFixed(1)` unless `frequency` is non‑null.
- **Optionally**:
  - In the future, use frequency to compute cents deviation and feed that into a more nuanced pitch score; structure the code now to keep that easy (`pitchDeviationCents` field in result object).

---

### 4.2. Mic noise gate & sustain

**Goal**: Reduce random noise contributions in mic mode.

- **In `usePitchDetection.js`**:
  - Already tracks `audioLevel` (RMS). Add:
    - A small **state machine**:
      - `IDLE` → `ARMED` (level > threshold for N ms) → `ACTIVE` (we're confident this is a note).
    - Only call `onPitchDetected(note, frequency)` when in `ACTIVE` state, and remain active until level falls below threshold for M ms.

  - Pseudocode:

    ```js
    const STATE = { IDLE, ARMED, ACTIVE };
    const [state, setState] = useState(STATE.IDLE);
    const levelHistoryRef = useRef([]);

    // inside detection loop
    levelHistoryRef.current.push({ time: performance.now(), level });
    // prune old entries

    if (state === IDLE && level > gate) {
      if (sustainedAboveGateFor(50 /*ms*/)) setState(ARMED);
    }

    if (state === ARMED && stablePitchDetected()) {
      setState(ACTIVE);
      onPitchDetected(note, freq);
    }

    if (state === ACTIVE && level < gate) {
      if (belowGateFor(80 ms)) setState(IDLE);
    }
    ```

**Result**: Only intentional, sustained notes emit detections; quick pops or background noise are ignored.

---

## 5. Feedback & UX Improvements

### 5.1. Distinguish rests in feedback

**Goal**: Avoid rests looking like missed notes.

- **In `VexFlowStaffDisplay.jsx`**:
  - When constructing performance overlay:
    - For each pattern event:
      - If `event.type === "rest"`:
        - Either **don't draw a colored marker**.
        - Or draw a small gray rest symbol above the staff line.

- **In `FeedbackSummary`**:
  - Show "X/Y notes correct" **where Y only counts note events**.
  - If necessary, add a text line: "This pattern contained N rests that are not graded."

**Result**: The visual output matches the user's mental model of what they had to play.

---

### 5.2. Clearer start cues

**Goal**: Reduce cognitive confusion around when to start playing.

- **In `SightReadingGame.jsx` DISPLAY UI**:
  - Add subtle guidance text near the start button:  
    "Listen to the 4‑beat count‑in, then play **when the cursor starts moving**."
- **Optionally**:
  - Add a short **flash highlight** on the first note exactly when phase changes to PERFORMANCE (e.g. a glow around the first note's head for 200 ms).

These tweaks are tiny but reduce user behaviors that look like "buggy timing".

---

## 6. Tests & Instrumentation

### 6.1. Unit tests for scoring core

**Goal**: Lock in correct behavior for edge‑cases.

- **Create test file** `src/components/games/sight-reading-game/utils/scoringCore.test.js` using your test runner (likely Vitest/Jest).
- Test scenarios:
  - **Single note, on‑time**:
    - Expect `perfect/good` status and correct index.
  - **Early first note during count‑in**:
    - Detection at `-300 ms` relative to note start while state is `EARLY_WINDOW`.
    - Expect it matches note 0, counted once.
  - **Early then on‑time**:
    - Early detection during COUNT_IN, second detection in PERFORMANCE.
    - Expect override logic to replace first result.
  - **Rest between notes**:
    - Pattern: note, rest, note.
    - Detections near rest should not be matched.
  - **Multiple rapid hits**:
    - Two detections within debounce window → only first scored.

**Result**: Confidence that refactors won't re‑introduce original bugs.

---

### 6.2. Enhanced debug mode

**Goal**: Make field bug reports actionable without deep logs each time.

- **In `VexFlowStaffDisplay.jsx`**:
  - Under `VITE_DEBUG_FIRST_NOTE` (or a new `VITE_DEBUG_SCORING` flag):
    - Draw small vertical lines showing `windowStart` and `windowEnd` of timing window under/above each note.
    - Optionally render detected hit time as a small triangle symbol.

- **In `SightReadingGame.jsx`**:
  - Add a helper logger:

    ```js
    const debugScoring = (info) => {
      if (!import.meta.env.VITE_DEBUG_SCORING) return;
      console.debug("[ScoringDebug]", info);
    };
    ```

  - Call in `handleNoteDetected` with payloads like:
    - `elapsedMs`, `noteIndex`, `eventPitch`, `detectedPitch`, `timeDiff`, `phase`.

**Result**: When you see a screenshot/log from a user, you can reconstruct exactly what happened.

---

## 7. Rollout Plan

### 7.1. Implementation order (recommended)

1. **Refactor timing origin & `matchDetectionToNote` extraction** (Section 2.1 & 3.1).
2. **Introduce timing state enum and `canScoreNow`** (Section 3.3), rewiring mic + keyboard gating.
3. **Add debouncing** (Section 3.2).
4. **Tighten mic noise gate** (Section 4.2).
5. **Make rests visually distinct** (Section 5.1).
6. **Add unit tests** (Section 6.1) and only then tweak dynamic tolerances / calibration (Sections 2.2 & 2.3).
7. **Optional UX improvements** (Section 5.2) and debug overlays (Section 6.2).

### 7.2. Verification steps after each stage

- **Manual scenarios to repeat every time**:
  - Early G3 on last count‑in beat, then F4, E4, D4 in time.
  - Playing only later notes (skip the first) to ensure indexing remains correct.
  - Patterns with rests between notes.
  - Fast tempo with short notes; slower tempo with long notes.

- **Automated**:
  - Run unit tests for scoring core.
  - Run existing test suite (if present) and `npm run lint`.

---

## 8. Summary

This plan addresses the core robustness and accuracy challenges in the Sight Reading Game by:

- **Centralizing timing logic** to eliminate drift and inconsistency.
- **Hardening input handling** with debouncing and noise gating.
- **Improving feedback clarity** so rests don't confuse users.
- **Building test coverage** to prevent regressions.

Follow the implementation order above, verify at each step, and you'll have a significantly more reliable and musically accurate game.

---

**Next Steps**: Pick a section (e.g., 3.3: timing state enum) and begin implementation. Each chunk can be tackled independently, tested, and merged before moving to the next.

