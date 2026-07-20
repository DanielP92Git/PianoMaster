# Phase 02: Practice Tooling - Pattern Map

**Mapped:** 2026-07-10
**Files analyzed:** 20 (9 new, 11 modified)
**Analogs found:** 20 / 20 (all resolve to files already inside `sight-reading-game/` or its direct
siblings — this phase is a recomposition phase, so almost every analog is the same subsystem the
file will live next to)

## File Classification

| New/Modified File                                                        | Role           | Data Flow                       | Closest Analog                                                                                                              | Match Quality    |
| ------------------------------------------------------------------------ | -------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `sight-reading-game/constants/gradingModes.js` (NEW)                     | config         | transform                       | `sight-reading-game/constants/timingConstants.js`                                                                           | exact            |
| `sight-reading-game/hooks/useReviewDrill.js` (NEW)                       | hook           | event-driven                    | `sight-reading-game/hooks/useTimingAnalysis.js` (shape) + `contexts/SightReadingSessionContext.jsx` (ref-mirror discipline) | role-match       |
| `sight-reading-game/utils/comparisonPattern.js` (NEW)                    | utility        | transform                       | `sight-reading-game/utils/scoreCalculator.js`                                                                               | exact            |
| `sight-reading-game/utils/comparisonPattern.test.js` (NEW)               | test           | transform                       | `sight-reading-game/utils/scoreCalculator.test.js` (pattern; not re-read, referenced in RESEARCH.md as existing)            | role-match       |
| `sight-reading-game/components/ReviewDrillPanel.jsx` (NEW)               | component      | event-driven                    | `sight-reading-game/components/FeedbackSummary.jsx`                                                                         | role-match       |
| `locales/__tests__/sight-reading-parity.test.js` (NEW)                   | test           | batch                           | `locales/__tests__/scaffolding-card-parity.test.js`                                                                         | exact            |
| `sight-reading-game/SightReadingGame.replay.test.jsx` (NEW)              | test           | event-driven                    | `sight-reading-game/SightReadingGame.combo.test.jsx`                                                                        | exact            |
| `sight-reading-game/SightReadingGame.practiceMode.test.jsx` (NEW)        | test           | event-driven                    | `sight-reading-game/SightReadingGame.combo.test.jsx`                                                                        | exact            |
| `sight-reading-game/hooks/useTimingAnalysis.test.js` (NEW)               | test           | transform                       | none exists today for this hook — model on `comparisonPattern.test.js` (pure fn) + `renderHook` convention                  | no direct analog |
| `sight-reading-game/SightReadingGame.jsx` (MODIFIED)                     | controller     | event-driven / request-response | itself (self-analog — extend existing phase machine, header row, guidance region)                                           | exact            |
| `sight-reading-game/hooks/useTimingAnalysis.js` (MODIFIED)               | hook           | transform                       | itself                                                                                                                      | exact            |
| `sight-reading-game/utils/scoreCalculator.js` (MODIFIED)                 | utility        | transform                       | itself                                                                                                                      | exact            |
| `sight-reading-game/components/FeedbackSummary.jsx` (MODIFIED)           | component      | request-response                | itself                                                                                                                      | exact            |
| `sight-reading-game/components/VexFlowStaffDisplay.jsx` (MODIFIED)       | component      | transform (render)              | itself                                                                                                                      | exact            |
| `sight-reading-game/components/SightReadingLayout.jsx` (MODIFIED)        | component      | transform (layout)              | itself                                                                                                                      | exact            |
| `contexts/SightReadingSessionContext.jsx` (MODIFIED)                     | provider/store | event-driven                    | itself                                                                                                                      | exact            |
| `locales/en/common.json` + `locales/he/common.json` (MODIFIED)           | config         | batch                           | itself (`sightReading.*` namespace)                                                                                         | exact            |
| `sight-reading-game/SightReadingGame.combo.test.jsx` (MODIFIED — extend) | test           | event-driven                    | itself                                                                                                                      | exact            |
| `hooks/useVictoryState.js` (MODIFIED)                                    | hook/service   | CRUD (persistence gating)       | itself                                                                                                                      | exact            |
| `components/games/VictoryScreen.jsx` (MODIFIED)                          | component      | request-response                | itself                                                                                                                      | exact            |

## Pattern Assignments

### `sight-reading-game/constants/gradingModes.js` (NEW — config)

**Analog:** `sight-reading-game/constants/timingConstants.js` (full file, 9 lines)

**Full analog file** (copy this shape exactly — flat named exports + one aggregate object):

```javascript
// src/components/games/sight-reading-game/constants/timingConstants.js
export const FIRST_NOTE_EARLY_MS = 500;
export const NOTE_EARLY_MS = 200;
export const NOTE_LATE_MS = 300;

export const TIMING_TOLERANCES = {
  firstNoteEarly: FIRST_NOTE_EARLY_MS,
  early: NOTE_EARLY_MS,
  late: NOTE_LATE_MS,
};
```

**Apply as:**

```javascript
// NEW: constants/gradingModes.js
export const GRADING_MODES = { PRACTICE: "practice", TEST: "test" };
export const GRADING_MODE_STORAGE_KEY = "sightReadingGradingMode"; // mirrors sightReadingInputMode
export const PRACTICE_TIMING = {
  toleranceMultiplier: 2,
  lateClampFraction: 0.85,
  earlyClampFraction: 0.75,
  statusMultiplier: 2,
};
```

No imports, no logic — this codebase's constants files are pure data (see also
`constants/feedbackPalette.js`, referenced by `FeedbackSummary.jsx:12`). Do not add functions here;
put derivation logic in `useTimingAnalysis.js`/`scoreCalculator.js`.

---

### `sight-reading-game/hooks/useTimingAnalysis.js` (MODIFIED — hook, transform)

**Analog:** itself (full file already read, 108 lines)

**Imports pattern** (lines 1-2):

```javascript
import { useMemo, useCallback, useRef } from "react";
import { TIMING_TOLERANCES, NOTE_LATE_MS } from "../constants/timingConstants";
```

Add: `import { GRADING_MODES, PRACTICE_TIMING } from "../constants/gradingModes";`

**Core pattern — the two landmine sites to modify** (lines 4-8, 15, 53-56):

```javascript
const TIMING_STATUS_MAP = [
  { threshold: 100, status: "perfect", score: 1.0, label: "Perfect!" },
  { threshold: 200, status: "good", score: 0.8, label: "Good" },
  { threshold: 300, status: "okay", score: 0.5, label: "Okay" },
];
// ...
export function useTimingAnalysis({ tempo = 80 } = {}) {
// ...
        const scaledLate = Math.min(NOTE_LATE_MS, durationMs * 0.6);
        const earlyAllowance = isFirstPlayable
          ? TIMING_TOLERANCES.firstNoteEarly
          : Math.min(TIMING_TOLERANCES.early, durationMs * 0.5);
```

**Mode-aware rewrite shape:** add `mode = GRADING_MODES.TEST` to the destructured hook param,
scale `NOTE_LATE_MS`, `TIMING_TOLERANCES.early/firstNoteEarly`, and the `0.6`/`0.5` clamp fractions
by `PRACTICE_TIMING.*` when `mode === GRADING_MODES.PRACTICE`, and scale each `TIMING_STATUS_MAP`
`threshold` by `PRACTICE_TIMING.statusMultiplier` before the `evaluateTiming` loop reads it. Keep
`TIMING_STATUS_MAP` module-level scaling inside a `useMemo` keyed on `mode` — it is currently a
module constant read directly by `evaluateTiming`, so evaluateTiming's closure must switch to
reading the memoized array, not the module constant, when mode is practice.
`buildTimingWindows` must add `mode` (or the derived scaled values) to its `useCallback` deps.

**No-analog note:** no other hook in this codebase takes a `mode` parameter that reshapes both a
threshold table and clamp math — this is genuinely new composition. Model the memoization on the
existing `beatDurationMs` `useMemo` (line 16-20) for style consistency, not because a mode-aware
precedent exists elsewhere.

---

### `sight-reading-game/utils/scoreCalculator.js` (MODIFIED — utility, transform)

**Analog:** itself (full file already read, 189 lines)

**Current formula to make mode-aware** (lines 55-57):

```javascript
export function calculateOverallScore(pitchAccuracy, rhythmAccuracy) {
  return pitchAccuracy * 0.7 + rhythmAccuracy * 0.3;
}
```

**Target shape (from RESEARCH.md Code Example 5, verified against this exact function):**

```javascript
export function calculateOverallScore(
  pitchAccuracy,
  rhythmAccuracy,
  mode = "test"
) {
  if (mode === "practice") return pitchAccuracy; // pitch-focused grading (D-04)
  return pitchAccuracy * 0.7 + rhythmAccuracy * 0.3; // Test: unchanged
}
```

JSDoc convention to preserve (lines 48-54 style — `@param`/`@returns` blocks precede every export
in this file; match it for the new `mode` param).

**Call sites requiring the new arg** (both outside this file):

- `SightReadingGame.jsx:1343`-area summary effect (not yet re-read at exact line in this pass —
  confirmed present via RESEARCH.md; search `calculateOverallScore(` in `SightReadingGame.jsx`).
- `FeedbackSummary.jsx:67-69` fallback call (excerpt below) — needs `mode` threaded via prop.

**`getDetailedBreakdown` — reuse unmodified** (lines 103-149) is the exact D-19 review filter; do
not re-derive this logic in `useReviewDrill.js`, import and filter its _input_ (`performanceResults`)
directly with the `timingStatus === "missed" || "wrong_pitch"` predicate instead (see Review hook
pattern below) — `getDetailedBreakdown` returns counts, not the filtered records themselves.

---

### `sight-reading-game/utils/comparisonPattern.js` (NEW — utility, transform)

**Analog:** `sight-reading-game/utils/scoreCalculator.js` (pure-function-module shape: no React, no
side effects, JSDoc per export, imports from `constants/`)

**Imports pattern to copy** (scoreCalculator.js line 6):

```javascript
import { calculateStarsFromPercentage } from "../../../../services/skillProgressService";
```

i.e. relative-path imports up through the feature tree; for this new file:

```javascript
import { NOTE_FREQUENCIES } from "../constants/staffPositions";
```

**Full target implementation** (verified shape from RESEARCH.md Code Example 2, cross-checked
against `performanceResults` record shape in `SightReadingGame.jsx` and `useRhythmPlayback.js`'s
consumed fields `{type, startTime, endTime, frequency}`):

```javascript
export function buildPlayedRendition(patternNotes, performanceResults) {
  const byIndex = new Map(performanceResults.map((r) => [r.noteIndex, r]));
  const rendition = [];
  patternNotes.forEach((ev, i) => {
    if (ev.type !== "note") return; // rests: playback skips them anyway
    const r = byIndex.get(i);
    if (!r || r.timingStatus === "missed") return; // missed -> silence (the lesson, D-12)
    const pitch = r.isCorrect ? ev.pitch : r.detected; // wrong pitch -> what they played
    const frequency = NOTE_FREQUENCIES[pitch];
    if (!frequency) return;
    const offsetSec = (r.timeDiff || 0) / 1000; // wrong_pitch: 0 today unless D-15 closed
    rendition.push({
      type: "note",
      startTime: Math.max(0, ev.startTime + offsetSec),
      endTime: Math.max(
        ev.startTime + offsetSec + 0.05,
        ev.endTime + offsetSec
      ),
      frequency,
      noteIndex: i, // extra field ignored by play(); needed for staff-highlight mapping (Pitfall 6)
    });
  });
  return rendition;
}
```

Edge case per RESEARCH.md: if `rendition` ends up empty (everything missed), the caller
(`SightReadingGame.jsx`'s comparison starter) must skip pass 1 and play only the correct pass.

---

### `sight-reading-game/utils/comparisonPattern.test.js` (NEW — test, pure)

**Analog:** Vitest pure-function test convention used throughout `utils/` (no component test
tooling needed — same posture as `patternBuilder.test.js`, referenced but not re-read here since
its shape is standard `describe`/`it`/`expect` with fixture arrays; do not duplicate a full read,
follow the parity-test import style below for the top-of-file pattern).

**Cases to cover (from RESEARCH.md Test Map, PRAC-02 row):** correct note offset by `timeDiff`;
wrong-pitch note at the detected pitch/expected slot; missed note omitted entirely; rests skipped;
empty `performanceResults` array (no crash, empty rendition).

---

### `sight-reading-game/components/ReviewDrillPanel.jsx` (NEW — component)

**Analog:** `sight-reading-game/components/FeedbackSummary.jsx` (full file already read, 209 lines)

**Imports pattern** (lines 1-12):

```javascript
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { GameActionButton } from "../../shared/hud/GameActionButton";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
  getPerformanceRating,
  getDetailedBreakdown,
} from "../utils/scoreCalculator";
import { FEEDBACK_COLORS } from "../constants/feedbackPalette";
```

For `ReviewDrillPanel`, swap the score-calculator imports for `getDetailedBreakdown` (filter input)
and `FEEDBACK_COLORS` (reuse the same colorblind-safe palette per RESEARCH.md's "Supporting" table).

**Glass card shell pattern to copy verbatim** (lines 114-118, matches CLAUDE.md's glassmorphism
spec):

```javascript
<div className="w-full">
  <div className="relative w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-5 sm:py-3.5">
    <div className="flex flex-col items-center gap-2 text-center sm:gap-2.5">
```

**Action-button pattern to copy verbatim** (lines 185-204) — use `GameActionButton` with
`tone="retry"`/`"advance"`, never a bare `<button>`, for anything that reads as a primary CTA:

```javascript
<GameActionButton tone="retry" onClick={onTryAgain} className="flex-1">
  {t("sightReading.tryAgain")}
</GameActionButton>
```

For the D-16 "play it" affordance inside the review drill (advance-on-correct-pitch, no explicit
button needed) and any "skip this note" escape hatch (RESEARCH.md Assumption A5), prefer the
secondary-row text-button styling described in the D-23 pattern below rather than `GameActionButton`
(that component is reserved for the primary retry/advance CTAs).

**i18n usage pattern** (line 50, and every `t(...)` call in the file) — namespace call, then
plain keys under `sightReading.*`, with `defaultValue` fallback for dynamic keys (line 127):

```javascript
const { t } = useTranslation("common");
// ...
{
  rating.labelKey
    ? t(rating.labelKey, { defaultValue: rating.label })
    : rating.label;
}
```

---

### `sight-reading-game/hooks/useReviewDrill.js` (NEW — hook, event-driven)

**Analog (state-machine + ref-mirror discipline):** `src/contexts/SightReadingSessionContext.jsx`
(full file already read, 198 lines) — this is the codebase's canonical "ref mirrors a piece of
state that a hot-path callback must read synchronously" pattern (Pattern 1 in RESEARCH.md).

**Ref-mirror pattern to copy** (lines 27-39):

```javascript
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);
// ...
const incrementCombo = useCallback(() => {
  comboRef.current += 1;
  setCombo(comboRef.current);
  if (comboRef.current >= ON_FIRE_THRESHOLD && !isOnFireRef.current) {
    isOnFireRef.current = true;
    setIsOnFire(true);
  }
}, []);
```

Apply this shape to `useReviewDrill`: a `currentMistakeIndexRef` mirrored to `currentMistakeIndex`
state, and a `handlePitch(detectedPitch)` callback that compares against the current mistake's
target pitch and advances the ref + state together — mirroring `incrementCombo`'s
"mutate ref, then setState from the ref" order exactly.

**Explicit prohibition (Pitfall 3 / D-18 / D-22):** do NOT call `incrementCombo`/`resetCombo` from
this hook, and do NOT gate advancement on `canScoreNow` (`SightReadingGame.jsx:1042-1051`,
excerpt below) — that guard returns `false` for any phase it doesn't enumerate (COUNT_IN/
PERFORMANCE only) and would silently eat every review input:

```javascript
const canScoreNow = useCallback((phase) => {
  const state = timingStateRef.current;
  if (phase === GAME_PHASES.COUNT_IN) {
    return state === TIMING_STATE.EARLY_WINDOW;
  }
  if (phase === GAME_PHASES.PERFORMANCE) {
    return state === TIMING_STATE.LIVE;
  }
  return false;
}, []);
```

**Filter source (reuse, do not re-derive):** `getDetailedBreakdown()` in `scoreCalculator.js`
(lines 103-149) already separates `missed`/`wrongPitch` from `tooEarly`/`tooLate`, but returns
_counts_. The hook needs the _records_: filter `performanceResults` directly —

```javascript
const mistakes = performanceResults.filter(
  (r) => r.timingStatus === "missed" || r.timingStatus === "wrong_pitch"
);
```

(verified filter shape, RESEARCH.md Code Example 4 / D-19).

**Target-pitch audition:** reuse `audioEngine.playPianoSound(volume, pitchName)` — the same call
`handleKeyboardNoteInput` already makes (`SightReadingGame.jsx` near line 1979 per RESEARCH.md) —
do not add a new oscillator path.

---

### `sight-reading-game/SightReadingGame.jsx` (MODIFIED — controller, event-driven/request-response)

**Analog:** itself. All excerpts below are direct reads from this worktree (not RESEARCH.md
paraphrase) unless noted.

**Imports block** (lines 1-55) — the file's import ordering convention: React/router/query-client
first, then icon libs, then hooks (`../../../hooks/*`), then sibling `./components/*`, then
sibling `./hooks/*`, then `./constants/*`, then `./utils/*`, then cross-feature services/contexts,
then i18n last:

```javascript
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Piano, Settings, Mic } from "lucide-react";
import MetronomeIcon from "../../../assets/icons/metronome.svg";
import { useAudioEngine } from "../../../hooks/useAudioEngine";
// ...
import { PreGameSetup } from "./components/PreGameSetup";
import { VexFlowStaffDisplay } from "./components/VexFlowStaffDisplay";
// ...
import { usePatternGeneration } from "./hooks/usePatternGeneration";
import { useRhythmPlayback } from "./hooks/useRhythmPlayback";
import { useTimingAnalysis } from "./hooks/useTimingAnalysis";
// ...
import { NOTE_FREQUENCIES } from "./constants/staffPositions";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
} from "./utils/scoreCalculator";
import { FIRST_NOTE_EARLY_MS, NOTE_LATE_MS } from "./constants/timingConstants";
// ...
import {
  SIGHT_READING_SESSION_CONSTANTS,
  useSightReadingSession,
} from "../../../contexts/SightReadingSessionContext";
import { useTranslation } from "react-i18next";
```

New imports needed: `GRADING_MODES`, `PRACTICE_TIMING` from `./constants/gradingModes`;
`buildPlayedRendition` from `./utils/comparisonPattern`; `useReviewDrill` from
`./hooks/useReviewDrill`; `ReviewDrillPanel` from `./components/ReviewDrillPanel`.

**`GAME_PHASES` — add `REVIEW`** (lines 80-86):

```javascript
const GAME_PHASES = {
  SETUP: "setup",
  COUNT_IN: "count-in",
  DISPLAY: "display",
  PERFORMANCE: "performance",
  FEEDBACK: "feedback",
};
```

Becomes `..., FEEDBACK: "feedback", REVIEW: "review" };` — and every phase-list literal below must
be updated in the same commit (three verified sites):

**1. Session-timeout `activePhases`** (lines 261-276, exact):

```javascript
useEffect(() => {
  // Active phases where user is playing: COUNT_IN, DISPLAY, PERFORMANCE
  const activePhases = [
    GAME_PHASES.COUNT_IN,
    GAME_PHASES.DISPLAY,
    GAME_PHASES.PERFORMANCE,
  ];
  const isGameActive = activePhases.includes(gamePhase);
  if (isGameActive) {
    pauseTimer();
  } else {
    resumeTimer();
  }
  return () => resumeTimer(); // Always resume on unmount
}, [gamePhase, pauseTimer, resumeTimer]);
```

Add `GAME_PHASES.REVIEW` to the array (Pitfall 4, item 1).

**2. `showPlayableKeyboardBand`** (lines 3748-3752, exact):

```javascript
const showPlayableKeyboardBand =
  (gamePhase === GAME_PHASES.DISPLAY ||
    gamePhase === GAME_PHASES.COUNT_IN ||
    gamePhase === GAME_PHASES.PERFORMANCE) &&
  shouldShowKeyboard;
```

Add `|| gamePhase === GAME_PHASES.REVIEW` (Pitfall 4, item 2).

**3. Audio-interruption pause effect** (~line 3369-3376 per RESEARCH.md — decide REVIEW behavior
deliberately, recommended: treat as active, same list shape as #1).

**localStorage preference pattern — model for the grading-mode key** (read: lines 322-326, write
effect: lines 602-607, exact):

```javascript
const [inputMode, setInputMode] = useState(() => {
  const stored = localStorage.getItem("sightReadingInputMode");
  return stored === "mic" ? "mic" : "keyboard"; // Default to keyboard for safer UX
});
// ...
useEffect(() => {
  localStorage.setItem("sightReadingInputMode", inputMode);
  // ...
}, [...]);
```

Copy this exact allowlist-with-default shape for `sightReadingGradingMode`, defaulting to
`GRADING_MODES.TEST` per D-03 (see `constants/gradingModes.js` above for the key name).

**Header control row — where the mode pill goes** (lines 3606-3696, exact, full region):

```javascript
const headerRegion = (
  <div className="flex flex-shrink-0 items-center justify-between gap-2 px-2 py-1 sm:gap-3 sm:px-3">
    <BackButton ... />
    <div className="min-w-0 flex-1 px-2 sm:px-3">
      <ProgressBar current={currentExerciseNumber - 1} total={sessionTotalExercises} />
    </div>
    <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
      {isOnFire && (...)}
      <div role="status" aria-label={t("games.engagement.combo")}>
        <ComboPill combo={combo} isOnFire={isOnFire} />
      </div>
      <ScorePill value={Math.round(sessionTotalScore)} label={t("games.score")} />
      <div className="hidden items-center rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/90 sm:flex">
        {t("sightReading.bpm", { value: gameSettings.tempo })}
      </div>
      {currentPattern && gamePhase !== GAME_PHASES.SETUP && (
        <button
          onClick={() => setShowInputModeModal(true)}
          disabled={isFeedbackPhase}
          className={`rounded-lg p-1.5 transition-colors sm:p-2 ${
            inputMode === "mic" ? "bg-purple-600 hover:bg-purple-700" : "bg-white/10 hover:bg-white/20"
          } ${isFeedbackPhase ? "cursor-not-allowed opacity-60" : ""}`}
          title={...}
        >
          {inputMode === "keyboard" ? <Mic .../> : <Piano .../>}
        </button>
      )}
      <button onClick={...} className={`rounded-lg p-1.5 transition-colors sm:p-2 ${metronomeEnabled ? "bg-fuchsia-500 hover:bg-fuchsia-600" : "bg-white/10 hover:bg-white/20"}`} disabled={gamePhase === GAME_PHASES.COUNT_IN}>
        <img src={MetronomeIcon} alt="Metronome" className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button onClick={() => (nodeConfig ? openSettingsModal() : returnToSetup())} className="rounded-lg bg-white/10 p-1.5 transition-colors hover:bg-white/20 sm:p-2" title={t("sightReading.changeSettings")}>
        <Settings className="h-4 w-4 text-white sm:h-5 sm:w-5" />
      </button>
    </div>
  </div>
);
```

**D-02's mode pill** slots into this `gap-1.5 sm:gap-2` icon-button row, but per D-02 it needs a
**text label** (not icon-only like its neighbors) — closest shape is the BPM pill just above it
(`rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white/90`),
combined with the metronome button's active-state color-swap pattern
(`bg-fuchsia-500`/`bg-white/10` ternary) and its `disabled={gamePhase === GAME_PHASES.COUNT_IN}`
lock precedent — D-05 locks the mode pill the same way, just with a wider active-phase set (any
phase from COUNT_IN onward within the session, not only COUNT_IN itself; drive this from a
`isModeLocked` boolean derived from a "has any exercise reached COUNT_IN this session" ref, not the
instantaneous `gamePhase`).

**DISPLAY-phase guidance region — where the replay button goes** (lines 3710-3720, exact):

```javascript
const guidanceRegion =
  gamePhase === GAME_PHASES.DISPLAY ? (
    <div className="my-2 flex-shrink-0 text-center">
      <button
        onClick={() => beginPerformanceWithPattern()}
        disabled={!currentPattern || isStartingPerformance}
        className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-3 sm:text-base"
      >
        {t("sightReading.startPlaying")}
      </button>
    </div>
  ) : ...
```

D-07's replay button is a sibling `<button>` inside this same `div`, next to Start Playing — copy
the button's own Tailwind shape but use a secondary color (not `bg-green-600`, which is the primary
CTA) — e.g. the `bg-white/10 hover:bg-white/20` family used by the header icon buttons, to signal
"secondary action" per the app's CTA-weight-via-hue convention documented in `GameActionButton.jsx`
(lines 12-14: "on the purple app background green pops... primary action gets green").

**Double-play landmine — `previewPlaybackTimeoutRef` schedule + existing clear precedent**
(declared line 583; scheduled lines 2250-2255; already cleared twice, at 2213-2216 in
`loadExercisePattern` and 2978-2980 in `beginPerformanceWithPattern`, exact):

```javascript
if (previewPlaybackTimeoutRef.current) {
  clearTimeout(previewPlaybackTimeoutRef.current);
  previewPlaybackTimeoutRef.current = null;
}
// ...
previewPlaybackTimeoutRef.current = setTimeout(() => {
  previewPlaybackTimeoutRef.current = null;
  rhythmPlayback.play(pattern.notes, (index) => {
    setCurrentNoteIndex(index);
  });
}, 500);
```

D-11's replay handler must copy the clear block verbatim before calling `rhythmPlayback.play(...)`
directly (no new setTimeout) — this exact three-line guard already exists at two call sites, making
it the established idiom, not a new pattern.

**`canScoreNow` — the guard REVIEW input must bypass** (lines 1042-1051, exact, reproduced above
under `useReviewDrill.js`). Route review-phase input to the new hook **before** any
`handleNoteEvent`/`handleKeyboardNoteInput` call reaches this guard (Pitfall 3, D-22).

**D-01 persistence gate — the one effect that already lives in this file** (lines 1420-1497,
exact, the `updateStudentScore` submit effect):

```javascript
useEffect(() => {
  if (gamePhase !== GAME_PHASES.FEEDBACK || !summaryStats) {
    return;
  }
  if (!isStudent || !studentId) {
    setScoreSyncStatus("skipped");
    return;
  }
  if (scoreSubmitted || scoredStatsRef.current === summaryStats) {
    return;
  }
  // ... submitScore() calls updateStudentScore(...)
}, [
  summaryStats,
  gamePhase,
  isStudent,
  studentId,
  scoreSubmitted,
  queryClient,
  currentPattern,
]);
```

Add a `gradingModeRef.current === GRADING_MODES.PRACTICE` early-return guard immediately after the
`!isStudent || !studentId` check, using the same `setScoreSyncStatus("skipped")` early-exit idiom
already established for the "not a student" case — Practice mode should read as "intentionally
skipped," not as a silent failure. **This is only ONE of D-01's four persistence paths** — see
Pitfall 2 below and the `useVictoryState.js` / `VictoryScreen.jsx` entries for the other three.

**Session-boundary mode-unlock sites (D-05, Pitfall 8)** — `returnToSetup`, `openSettingsModal`,
`handleStartNewSession` are the three call sites RESEARCH.md verified as covering all five D-05
unlock boundaries (Victory's `onReset` and the encouragement screen's Try Again both funnel through
`handleStartNewSession`). Unlock the mode ref/state at the top of each of these three handlers; do
NOT unlock inside `replayPattern` (mid-exercise "Try Again" keeps the current mode per D-05).

---

### `sight-reading-game/components/SightReadingLayout.jsx` (MODIFIED — component, layout)

**Analog:** itself (full file already read, 225 lines) — a "dumb" layout component; its own header
comment (lines 1-34) is the authoritative contract and must be updated when `REVIEW` is added:

```javascript
/**
 * Props (contract):
 * - phase: "setup" | "display" | "count-in" | "performance" | "feedback"
 */
```

Extend the union to include `"review"`.

**Unhandled-phase fallback (verified, lines 56-62):**

```javascript
const showGuidanceOverlay = guidance && !isFeedbackPhase && phase !== "display";
const showDisplayGuidanceOverlay =
  phase === "display" && guidance && !isFeedbackPhase && !hasDockedBottom;
```

An unrecognized `phase="review"` value falls into the generic `showGuidanceOverlay` fixed-top-overlay
path today (per RESEARCH.md Pitfall 4) — acceptable as a default, but the plan should decide
explicitly whether REVIEW gets its own guidance-region treatment (likely yes, to host the
`ReviewDrillPanel`) rather than relying on the fallback silently doing something plausible.

---

### `sight-reading-game/components/VexFlowStaffDisplay.jsx` (MODIFIED — component, render/transform)

**Analog:** itself (targeted read, lines 1619-1730)

**The exact gap D-14 needs closed** (lines 1625-1670, exact):

```javascript
const getNoteColor = useCallback(
  (noteIndex) => {
    if (gamePhase !== "feedback" && gamePhase !== "performance") {
      return NOTE_COLOR_BLACK;
    }
    const result = performanceResults.find((r) => r.noteIndex === noteIndex);
    return colorForResult(result);
  },
  [performanceResults, gamePhase]
);

const highlightNote = useCallback(
  (_noteIndex) => {
    // <-- argument is ignored today; this is Pitfall 6
    if (!notesRef.current || notesRef.current.length === 0) return;
    notesRef.current.forEach((noteElement, idx) => {
      if (noteElement) {
        const colorInfo = getNoteColor(idx);
        const { fill, stroke, class: className } = colorInfo;
        noteElement.setAttribute("class", `vf-stavenote ${className}`);
        noteElement.setAttribute("fill", fill);
        noteElement.setAttribute("stroke", stroke || fill);
      }
    });
  },
  [getNoteColor]
);
```

**Additive fix pattern (per RESEARCH.md A4):** add a `playbackHighlightIndex` prop; inside
`highlightNote`, when `gamePhase` is `"feedback"` or `"review"` AND `playbackHighlightIndex >= 0`,
overlay an outline/glow class on `notesRef.current[playbackHighlightIndex]` in addition to (not
instead of) the existing `getNoteColor` fill — do not replace the existing coloring branch, extend
it, so result-fills during feedback are preserved while comparison playback adds a moving outline.

---

### `contexts/SightReadingSessionContext.jsx` (MODIFIED — provider/store)

**Analog:** itself (full file already read, 198 lines) — this is also the direct pattern-source for
`useReviewDrill.js`'s ref-mirror discipline (see above).

**Provider shape to extend** (lines 24-39, 118-171, exact) — the mode flag and its lock state join
`combo`/`isOnFire` as session-scoped state with the same `useState` + `useRef` + `useMemo(value)`
composition:

```javascript
export function SightReadingSessionProvider({ children }) {
  const [state, setState] = useState(() => createInitialState());
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const [isOnFire, setIsOnFire] = useState(false);
  const isOnFireRef = useRef(false);
  // ...
  const value = useMemo(
    () => ({
      // ...
      combo,
      isOnFire,
      incrementCombo,
      resetCombo,
    }),
    [
      state,
      startSession,
      resetSession,
      recordExerciseResult,
      goToNextExercise,
      combo,
      isOnFire,
      incrementCombo,
      resetCombo,
    ]
  );

  return (
    <SightReadingSessionContext.Provider value={value}>
      {children}
    </SightReadingSessionContext.Provider>
  );
}

export function useSightReadingSession() {
  const context = useContext(SightReadingSessionContext);
  if (!context) {
    throw new Error(
      "useSightReadingSession must be used within a SightReadingSessionProvider"
    );
  }
  return context;
}
```

Add `gradingMode`/`setGradingMode`/`isModeLocked`/`lockMode`/`unlockMode` following this exact
composition (state + ref mirror + inclusion in the memoized `value` + inclusion in its dep array).
The `// eslint-disable-next-line react-refresh/only-export-components` comments above the hook and
the exported constants (lines 180, 191) are a deliberate, documented exception in this file — copy
them verbatim if adding new exported constants (e.g. a `GRADING_MODES` re-export is NOT needed here
since it lives in `constants/gradingModes.js`, but any new _context-local_ constant follows this
lint-suppression convention).

---

### `hooks/useVictoryState.js` (MODIFIED — hook/service, CRUD persistence)

**Analog:** itself (targeted reads: signature lines 92-105, streak effect lines 328-342, free-play
XP lines 500-519)

**Signature — where a Practice-mode flag must be threaded through** (lines 92-105, exact):

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
}) {
```

**Streak-update path (Pitfall 2, part of the four D-01 persistence paths)** (lines 328-342, exact):

```javascript
useEffect(() => {
  if (scorePercentage >= 80 && !hasCalledStreakUpdate.current) {
    hasCalledStreakUpdate.current = true;
    updateStreakWithAchievements.mutate(undefined, {
      onSuccess: ({ newStreak }) => {
        /* freeze-earned toast */
      },
    });
  }
}, [scorePercentage, updateStreakWithAchievements, t]);
```

**Free-play XP path (Pitfall 2 — the CONTEXT.md-surfacing discovery: this fires even outside
trail mode)** (lines 500-519, exact):

```javascript
} else {
  // Free play: award XP based on score
  if (user?.id && scorePercentage > 0) {
    try {
      const freePlayXP = calculateFreePlayXP(scorePercentage, comebackActive ? 2 : 1);
      if (freePlayXP > 0) {
        const xpResult = await awardXP(user.id, freePlayXP);
        setXpData({ totalXP: freePlayXP, ...xpResult });
        queryClient.invalidateQueries({ queryKey: ["student-xp", user.id] });
      }
    } catch (error) {
      console.error("Error awarding free play XP:", error);
    }
  }
  setIsProcessingTrail(false);
```

**Recommended gate shape:** add a `suppressPersistence = false` param to the destructured signature
(matching the existing `= null`/`= false` default-parameter style already used for every optional
prop in this signature), and short-circuit each of: the streak `useEffect` (line 328), the trail
`updateExerciseProgress`/`updateNodeProgress` + `awardXP` block (verified at lines ~387-493 by
RESEARCH.md), and the free-play `awardXP` block above — three guarded sites, one new prop. This
directly answers RESEARCH.md's Pitfall 2 "option (b)" (prop through `useVictoryState`), which is
lower-blast-radius than option (a) (never rendering `VictoryScreen` in Practice) because it reuses
the shared hook other games also call, rather than forking the session-end UI per mode.

---

### `components/games/VictoryScreen.jsx` (MODIFIED — component, request-response)

**Analog:** itself (targeted read, lines 1-90)

**Imports** (lines 1-13):

```javascript
import { useEffect, useRef } from "react";
import { useVictoryState } from "../../hooks/useVictoryState";
import { ConfettiEffect } from "../celebrations/ConfettiEffect";
import {
  BossUnlockModal,
  BOSS_CONFETTI_COLORS,
} from "../celebrations/BossUnlockModal";
import AccessoryUnlockModal from "../ui/AccessoryUnlockModal";
import RateLimitBanner from "../ui/RateLimitBanner";
import { Trophy, Zap } from "lucide-react";
import { getNodeById } from "../../data/skillTrail";
import { completeDailyChallenge } from "../../services/dailyChallengeService";
import GoldStar from "../ui/GoldStar";
```

**Prop-forwarding pattern into `useVictoryState`** (lines 15-81, exact) — every prop
`VictoryScreen` receives is forwarded 1:1 into the hook call:

```javascript
const VictoryScreen = ({
  score, totalPossibleScore, onReset, timedMode, timeRemaining, initialTime, onExit,
  nodeId = null, exerciseIndex = null, totalExercises = null, exerciseType = null,
  onNextExercise = null, challengeMode = false, challengeId = null, challengeXpReward = null,
  subtitle = null,
}) => {
  const { /* ... */ } = useVictoryState({
    score, totalPossibleScore, onReset, timedMode, timeRemaining, initialTime, onExit,
    nodeId, exerciseIndex, totalExercises, exerciseType, onNextExercise,
  });
```

Add `suppressPersistence = false` to both this destructure and the forwarded call, plus surface a
D-06-required "practice run — not scored" notice near the existing `Trophy`/`Zap` celebration
markup (imported icons already establish the visual vocabulary for this screen). The daily-challenge
completion call (`completeDailyChallenge`, imported line 12, invoked inside a `challengeMode` guard
per lines 83-90) is the fourth D-01 persistence path — gate its `useEffect` on the same
`suppressPersistence` flag.

---

### `sight-reading-game/components/FeedbackSummary.jsx` (MODIFIED — component, D-23 layout)

**Analog:** itself (full file already read above under the ReviewDrillPanel entry)

**Current single-row action pattern to restructure into two rows** (lines 185-204, exact):

```javascript
<div className="flex w-full max-w-xs gap-2.5">
  <GameActionButton tone="retry" onClick={onTryAgain} className="flex-1">
    {t("sightReading.tryAgain")}
  </GameActionButton>
  {showNextButton && onNextPattern && (
    <GameActionButton
      tone="advance"
      onClick={onNextPattern}
      disabled={nextButtonDisabled}
      className="flex-1"
    >
      {nextButtonLabel}
    </GameActionButton>
  )}
</div>
```

D-23 wraps this existing block unchanged as "row 2" and adds a new secondary "row 1" above it
(`♫ Hear yours vs correct` / `↺ Review mistakes`) using lighter-weight styling than
`GameActionButton` — model row-1 buttons on the breakdown chip's typography scale (line 171:
`text-xs font-medium text-white/80`) rather than the bold CTA styling, to establish the "learn
above / navigate below" visual hierarchy D-23 specifies. Row 1 must conditionally collapse per D-20
(hide, not disable, when `breakdown.wrongPitch + breakdown.missed === 0`) — the `breakdown` object
is already computed at lines 76-79 via `getDetailedBreakdown`, so the hide condition is a one-line
addition using data already in scope.

**New props needed:** `onCompare`, `onReview`, `hasMistakes` (or derive from existing `breakdown`),
`gradingMode` (for the D-06 "not scored" notice — the accuracy bars already render unconditionally
per D-01's "still displays... they simply do not persist," so the notice is additive text, not a
conditional render).

---

### `locales/en/common.json` + `locales/he/common.json` (MODIFIED — config, i18n)

**Analog:** itself, `sightReading.*` block (EN read, lines 1629-1698, exact)

**Existing structure to extend (do not fork a new top-level namespace, per D-24):**

```json
"sightReading": {
  "exercise": "Exercise {{current}} / {{total}}",
  "startPlaying": "Start Playing",
  "controls": {
    "toggleMetronome": "Toggle metronome",
    "switchToMic": "Switch to microphone",
    "switchToKeyboard": "Switch to keyboard"
  },
  "summary": {
    "pitch": "Notes",
    "rhythm": "Rhythm",
    "correct": "Correct",
    "tooEarly": "Too Early",
    "tooLate": "Too Late",
    "missed": "Missed",
    "wrongNotes": "Wrong Notes"
  },
  "errors": {
    "startPerformance": "Failed to start performance. Please try again.",
    "startGame": "Failed to start game. Please try again."
  }
}
```

New keys land inside the existing `controls.*` (replay button, compare button, mode pill label x2
for practice/test, review button) and `summary.*` (practice-not-scored notice) subtrees per D-24 —
do not add a sibling `sightReading.review.*` block unless the volume of review-specific strings
(count in, "play it", progress "N of M") genuinely warrants its own subtree; if so, nest it as
`sightReading.review.*`, still inside the existing namespace, matching the existing `inputMode.*`/
`penalty.*`/`session.*` subtree precedent already in the file.

**Hebrew file mirrors the identical key path structure** — every key added to `en/common.json`'s
`sightReading.*` must have a byte-identical path (not necessarily identical string, translated
value) in `he/common.json`'s `sightReading.*`, enforced by the new parity test below. Nikud
diacritics in existing Hebrew strings are owner-approved — do not alter existing HE strings when
adding new ones (per CLAUDE.md "Hebrew Nikud" note).

---

### `locales/__tests__/sight-reading-parity.test.js` (NEW — test, batch/i18n)

**Analog:** `locales/__tests__/scaffolding-card-parity.test.js` (full file already read, 52 lines)
— this is a near-exact template; only the JSON path changes.

**Full analog file (copy structure, swap the path):**

```javascript
import { describe, it, expect } from "vitest";
import enCommon from "../en/common.json";
import heCommon from "../he/common.json";

function collectPaths(obj, prefix = "") {
  const paths = new Set();
  if (!obj || typeof obj !== "object") return paths;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const p of collectPaths(v, key)) paths.add(p);
    } else {
      paths.add(key);
    }
  }
  return paths;
}

describe("sightReading EN <-> HE locale parity", () => {
  it("every EN sightReading key has a HE counterpart", () => {
    const enPaths = collectPaths(enCommon.sightReading || {});
    const hePaths = collectPaths(heCommon.sightReading || {});
    const missing = [...enPaths].filter((p) => !hePaths.has(p));
    expect(missing).toEqual([]);
  });

  it("every HE sightReading key has an EN counterpart (no orphan HE keys)", () => {
    const enPaths = collectPaths(enCommon.sightReading || {});
    const hePaths = collectPaths(heCommon.sightReading || {});
    const orphan = [...hePaths].filter((p) => !enPaths.has(p));
    expect(orphan).toEqual([]);
  });
});
```

This passes vacuously-true-but-real today (52/52 keys already match per RESEARCH.md's verified
node-script count) — land this test in Wave 0, before any new `sightReading.*` string lands, exactly
per the analog file's own header comment rationale (lines 10-17 of the analog: "makes the gap
impossible to ship").

---

### `sight-reading-game/SightReadingGame.replay.test.jsx` + `SightReadingGame.practiceMode.test.jsx` (NEW — component tests)

**Analog:** `sight-reading-game/SightReadingGame.combo.test.jsx` (targeted read, lines 1-120 of the
mock harness)

**Mock-harness pattern to copy (this IS the established component-test convention for this file):**

```javascript
import { useState, useCallback } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SightReadingGame } from "./SightReadingGame";

const incrementComboSpy = vi.hoisted(() => vi.fn());
const resetComboSpy = vi.hoisted(() => vi.fn());
let capturedIncrementCombo = null;
let capturedOnNoteEvent = null;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing" /* ... */,
      };
      return translations[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn(), language: "en", dir: () => "ltr" },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));
vi.mock("../../ui/BackButton", () => ({ default: () => null }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null, pathname: "/" }),
  };
});
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});
vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));
vi.mock("../../../features/authentication/useUser", () => ({
  useUser: () => ({ user: null, isStudent: false }),
}));
vi.mock("../../../services/apiScores", () => ({ updateStudentScore: vi.fn() }));
vi.mock("../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

// Stateful mock: uses REAL React state internally (valid since this hook runs inside
// SightReadingGame's render) so combo/mode transitions drive genuine re-renders.
vi.mock("../../../contexts/SightReadingSessionContext", () => ({
  SIGHT_READING_SESSION_CONSTANTS: { DEFAULT_MAX_SCORE_PER_EXERCISE: 1000 },
  useSightReadingSession: () => {
    const [combo, setCombo] = useState(0);
    // ... incrementCombo/resetCombo wired to spies, capturedIncrementCombo = incrementCombo
    return {
      /* full session context shape */
    };
  },
}));
```

**Reuse this exact mock set** for the new test files — `updateStudentScore` is already mocked as a
spy (`vi.mock("../../../services/apiScores", ...)`), which is the direct assertion point for
`SightReadingGame.practiceMode.test.jsx`'s "Practice mode never calls `updateStudentScore`" case.
For `SightReadingGame.replay.test.jsx`, additionally mock `useRhythmPlayback`'s `play`/`stop` as
spies (not shown in the combo test since it doesn't need audio assertions) and use
`vi.useFakeTimers()` to assert the `previewPlaybackTimeoutRef` double-play guard (tap replay, flush
timers, assert `play` called exactly once).

---

### `sight-reading-game/hooks/useTimingAnalysis.test.js` (NEW — hook test)

**No existing analog** — this hook has no test today. Model on Vitest's `renderHook` convention
(standard for this codebase's other hook tests, e.g. `usePatternGeneration`-family tests referenced
in RESEARCH.md) combined with the pure-function assertion style of `scoreCalculator.test.js`/
`comparisonPattern.test.js`. Cases per RESEARCH.md's Test Map: Practice widens both the raw
constants AND the clamp-bound fast-tempo case (assert the clamp math explicitly, not just the
unclamped constants — this is exactly Pitfall 5's "clamp binds before the constant" landmine); Test
mode byte-for-byte unchanged from today's output.

---

### `sight-reading-game/SightReadingGame.combo.test.jsx` (MODIFIED — extend, regression guard)

**Analog:** itself. Add one case per RESEARCH.md's Phase Requirements → Test Map "D-04 side effect"
row: wider Practice-mode windows delay miss finalization, which delays the live combo break —
assert the combo break fires later (or not at all within the test's note count) under a
Practice-mode render of the same harness used for the existing combo-break assertions in this file.

---

## Shared Patterns

### Ref-mirror discipline (mandatory for every new hot-path-read flag)

**Source:** `src/contexts/SightReadingSessionContext.jsx:27-39` (combo/isOnFire)
**Apply to:** `gradingModeRef` (read inside `handleNoteDetected`, the miss sweep, and
`buildTimingWindows`), and `useReviewDrill`'s internal mistake-index ref.

```javascript
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);
const incrementCombo = useCallback(() => {
  comboRef.current += 1;
  setCombo(comboRef.current);
}, []);
```

Phase B (PR #11) removed two 60Hz `setState` sources from the mic hot path — no new file in this
phase may reintroduce a `setState` call inside `handleNoteEvent`/`handleNoteDetected`'s per-frame
path. Every new mode/review flag read there must be a ref, with at most one `setState` per
discrete event (advance, not per audio frame).

### localStorage preference with allowlist default

**Source:** `SightReadingGame.jsx:322-326` (read) / `:602-607` (write effect) — `sightReadingInputMode`

```javascript
const stored = localStorage.getItem("sightReadingInputMode");
return stored === "mic" ? "mic" : "keyboard"; // allowlist, safe default
```

**Apply to:** the new `sightReadingGradingMode` key — allowlist `"practice"`, default to
`GRADING_MODES.TEST` on anything else (including tampered/junk values — this doubles as the D-03
default-to-Test rule and the ASVS V5 input-validation control from RESEARCH.md's Security Domain).

### `GameActionButton` for primary CTAs only

**Source:** `src/components/games/shared/hud/GameActionButton.jsx` (full file, 55 lines)
**Apply to:** row 2 of `FeedbackSummary` (unchanged), never for row 1's secondary "learn" actions
(Compare/Review) — those get lighter-weight styling per D-23's two-tier hierarchy.

```javascript
const TONES = {
  advance: "bg-gradient-to-br from-green-500 to-emerald-600 ...",
  retry: "bg-gradient-to-br from-indigo-500 to-violet-600 ...",
  neutral: "bg-gradient-to-br from-slate-500 to-slate-600 ...",
};
```

### `useRhythmPlayback.play(pattern, onBeatChange)` — reused unmodified for PRAC-01 and PRAC-02

**Source:** `src/components/games/sight-reading-game/hooks/useRhythmPlayback.js` (full file, 197
lines) — consumes only `{type, startTime, endTime, frequency}` per note (lines 73-79), self-stops
prior playback (`stop()` called at top of `play`, line 55), and fires `onBeatChange(-1)` exactly
once at pattern end (lines 172-179) — the chaining signal for D-14's sequential comparison passes.
No changes needed to this file for either PRAC-01 or PRAC-02.

### i18next namespace + defaultValue fallback

**Source:** `FeedbackSummary.jsx:50, :126-128`

```javascript
const { t } = useTranslation("common");
// ...
{
  rating.labelKey
    ? t(rating.labelKey, { defaultValue: rating.label })
    : rating.label;
}
```

**Apply to:** all new copy in `ReviewDrillPanel.jsx`, the mode pill, and the replay/compare buttons
— always resolve through `sightReading.*` keys, never inline English strings, per D-24 and
CLAUDE.md's i18n section.

### Persistence-gate idiom: early-return with an explicit "skipped" status, not a silent no-op

**Source:** `SightReadingGame.jsx:1425-1428`

```javascript
if (!isStudent || !studentId) {
  setScoreSyncStatus("skipped");
  return;
}
```

**Apply to:** the new Practice-mode guard in the same effect, and (via `suppressPersistence`) the
three `useVictoryState.js` sites — Practice mode should read as an intentional, visible "skipped"
state (D-06: "visibly, continuously legible"), matching this existing idiom rather than inventing a
new one.

## No Analog Found

| File                                                                  | Role                                   | Data Flow    | Reason                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------- | -------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sight-reading-game/hooks/useReviewDrill.js`                          | hook                                   | event-driven | No existing hook in this codebase combines a mistake-list state machine with pitch-match advancement; closest precedent is the ref-mirror _pattern_ (from `SightReadingSessionContext`), not a whole-hook analog — treat as new composition of an established idiom, not a copy of an existing file. |
| `sight-reading-game/hooks/useTimingAnalysis.js` mode-aware clamp math | (modification within an existing file) | transform    | No other hook in this codebase parameterizes both a threshold table and a duration-based clamp fraction by a caller-supplied mode; RESEARCH.md's own Pattern 2 code sample is the only precedent, and it is prescriptive (new), not observed in existing code.                                       |

## Metadata

**Analog search scope:** `src/components/games/sight-reading-game/**`, `src/contexts/**`,
`src/hooks/useVictoryState.js`, `src/components/games/VictoryScreen.jsx`,
`src/components/games/shared/hud/**`, `src/locales/**`
**Files read directly in this pass (not just cited from RESEARCH.md):**
`SightReadingGame.jsx` (imports, GAME_PHASES, session-timeout activePhases, canScoreNow,
loadExercisePattern/previewPlaybackTimeoutRef, header region, guidance region, keyboard band,
score-submit effect), `useTimingAnalysis.js` (full), `scoreCalculator.js` (full),
`SightReadingSessionContext.jsx` (full), `FeedbackSummary.jsx` (full), `SightReadingLayout.jsx`
(full), `timingConstants.js` (full), `useRhythmPlayback.js` (full), `GameActionButton.jsx` (full),
`VexFlowStaffDisplay.jsx` (targeted, highlightNote/getNoteColor region),
`scaffolding-card-parity.test.js` (full), `SightReadingGame.combo.test.jsx` (targeted, mock
harness), `useVictoryState.js` (targeted, signature + streak + free-play XP), `VictoryScreen.jsx`
(targeted, imports + prop-forwarding), `locales/en/common.json` (`sightReading.*` block).
**Pattern extraction date:** 2026-07-10
