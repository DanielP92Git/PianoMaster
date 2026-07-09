# Phase 01: Engagement HUD Parity - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 5 (2 modified source, 1 modified test, 2 new test)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File                                                                                                  | Role             | Data Flow    | Closest Analog                                                                                                                                                                                            | Match Quality                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/contexts/SightReadingSessionContext.jsx`                                                                      | provider/store   | event-driven | `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (combo/on-fire state block, adapted from local component state to context ownership)                                                   | role-match (state pattern is exact; container differs — component state vs. context) |
| `src/components/games/sight-reading-game/SightReadingGame.jsx`                                                     | component (game) | event-driven | `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (HUD wiring + render sites)                                                                                                            | exact (same role, same shared-HUD integration pattern, same app)                     |
| `src/contexts/SightReadingSessionContext.test.jsx` (new)                                                           | test             | unit         | No direct sibling test exists for this context; closest analog is `src/components/games/shared/hud/ComboPill.test.jsx` for Vitest/RTL conventions, and the context file itself for state-shape assertions | no analog (new territory — context has zero existing tests)                          |
| `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` (new)                                    | test             | integration  | `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`                                                                                                                            | exact (same file's sibling test, same component, same mocking conventions)           |
| `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` (modified — mock shape update only) | test             | integration  | itself (must extend its own `useSightReadingSession` mock)                                                                                                                                                | exact                                                                                |

**No locale file changes needed** — `games.engagement.combo`/`games.engagement.onFire` already exist in
both `src/locales/en/common.json` (lines 685-693) and `src/locales/he/common.json` (lines 685-693).
Per D-07/I18N-01, these are reused verbatim; no new keys, no file edits to locales unless the planner
decides a genuinely sight-reading-specific string is needed (not indicated by CONTEXT.md/RESEARCH.md).

## Pattern Assignments

### `src/contexts/SightReadingSessionContext.jsx` (provider/store, event-driven)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (combo/on-fire local
state block, lines 313-324, 662-710, 1636-1736) — pattern copied and re-homed from component-local
`useState`/`useRef` into this context's existing `useState`/`useCallback`/`useMemo` structure.

**Current full file already read in full (157 lines) — this IS the target file, not a separate analog file.**

**Existing state container pattern to extend** (lines 12-18, 22-35):

```javascript
const createInitialState = () => ({
  totalExercises: TOTAL_EXERCISES_PER_SESSION,
  currentExerciseIndex: 0,
  exerciseResults: Array(TOTAL_EXERCISES_PER_SESSION).fill(null),
  status: "idle", // idle | in-progress | complete
  sessionId: Date.now(),
});
// ...
export function SightReadingSessionProvider({ children }) {
  const [state, setState] = useState(() => createInitialState());
```

Combo/isOnFire should NOT go inside this `state` object (it's replaced wholesale by
`createInitialState()` on `resetSession`, which is correct for combo too — see reset boundaries below
— but the `NotesRecognitionGame` precedent keeps combo as sibling `useState`/`useRef` pairs, not nested
in a single state blob). Mirror that: add sibling `useState`/`useRef` pairs at the top of
`SightReadingSessionProvider`, alongside `state`.

**Existing stable-callback pattern to mirror exactly** (lines 25-35, `startSession`/`resetSession` —
these are the two functions that must ALSO reset combo, per D-05/Pitfall 4 in RESEARCH.md):

```javascript
const startSession = useCallback(() => {
  setState(() => ({
    ...createInitialState(),
    status: "in-progress",
    sessionId: Date.now(),
  }));
}, []);

const resetSession = useCallback(() => {
  setState(() => createInitialState());
}, []);
```

**Action required:** `incrementCombo`/`resetCombo` must be added as NEW stable `useCallback`s (empty
deps, exactly like `recordExerciseResult`/`goToNextExercise` below), and `startSession`/`resetSession`
must ALSO reset the combo ref+state to 0 (they currently only reset the `exerciseResults`/`status`
blob — combo lives outside that blob per the sibling-state approach above, so it needs its own reset
call inside these two functions). Do NOT reset combo inside `goToNextExercise` (line 66-83) — that
function only advances `currentExerciseIndex`, and combo must survive it (D-05).

**Core CRUD-like update pattern** (lines 37-64, `recordExerciseResult` — model for how a new stable
callback should read/write via functional `setState`):

```javascript
const recordExerciseResult = useCallback(
  (score = 0, maxScore = DEFAULT_MAX_SCORE_PER_EXERCISE) => {
    setState((prev) => {
      // ...
      return { ...prev, exerciseResults, status: /* ... */ };
    });
  },
  []
);
```

Combo's own callbacks should follow the ref+state double-write style from `NotesRecognitionGame`
instead (see below), NOT this `setState((prev) => ...)` style, because combo needs synchronous
ref reads inside the RAF `tick()` closure (per RESEARCH.md Pattern 1) — `NotesRecognitionGame`'s
`comboRef`/`setCombo` pattern (lines 663-664 of that file) is the correct template:

```javascript
// Source: src/components/games/notes-master-games/NotesRecognitionGame.jsx:662-679
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);
// ...
const [isOnFire, setIsOnFire] = useState(false);
const isOnFireRef = useRef(false); // Mirror ref — read inside handler to avoid stale closure
```

And the increment/reset logic itself (adapted from lines 1636-1731 of that file — the
`handleAnswerSelect` correct/wrong branches):

```javascript
// correct branch (lines 1636-1643, 1652, 1679-1686 — adapted, drop unrelated tier/speed/XP logic)
comboRef.current += 1;
setCombo(comboRef.current);
if (comboRef.current >= ON_FIRE_THRESHOLD && !isOnFireRef.current) {
  isOnFireRef.current = true;
  setIsOnFire(true);
}

// wrong/miss branch (lines 1719-1731 — adapted)
comboRef.current = 0;
setCombo(0);
if (isOnFireRef.current) {
  isOnFireRef.current = false;
  setIsOnFire(false);
}
```

`ON_FIRE_THRESHOLD = 5` and `COMBO_TIERS` (`[{min:0,multiplier:1},{min:3,multiplier:2},{min:8,multiplier:3}]`)
are defined module-level in `NotesRecognitionGame.jsx` at lines 314-324 — reuse the same numeric
values per D-06 (tiers aren't strictly needed here since `ComboPill` computes its own tier tint
internally from the raw `combo` number — see Shared Patterns below — but `ON_FIRE_THRESHOLD` is
needed as a local constant in the context file).

**`useMemo` value block to extend** (lines 85-130 — add `combo`, `isOnFire`, `incrementCombo`,
`resetCombo` to both the returned object and the dependency array):

```javascript
return {
  // ...existing fields...
  startSession,
  resetSession,
  recordExerciseResult,
  goToNextExercise,
  // NEW:
  combo,
  isOnFire,
  incrementCombo,
  resetCombo,
};
```

---

### `src/components/games/sight-reading-game/SightReadingGame.jsx` (component, event-driven)

**Analog:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx`

**Imports pattern** (analog file, lines 36-38 — exact import lines to replicate, adjusting relative
path since `SightReadingGame.jsx` is one directory shallower):

```javascript
// Source: src/components/games/notes-master-games/NotesRecognitionGame.jsx:36-38
import { ComboPill } from "../shared/hud/ComboPill";
import { OnFireBadge } from "../shared/hud/OnFireBadge";
import { OnFireSplash } from "../shared/hud/OnFireSplash";
```

`SightReadingGame.jsx` already imports two sibling HUD components from the same directory (lines
56-57 of the target file): `import { ProgressBar } from "../shared/hud/ProgressBar";` and
`import { ScorePill } from "../shared/hud/ScorePill";` — confirms the `../shared/hud/X` relative path
is correct for this file too (same nesting depth as `NotesRecognitionGame.jsx`).

**Session-context destructure to extend** (target file, lines 222-235 — the exact block to add
`combo`/`isOnFire`/`incrementCombo`/`resetCombo` to):

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:222-235 (current)
const {
  totalExercises: sessionTotalExercises,
  currentExerciseNumber,
  isSessionComplete,
  isVictory,
  percentage: sessionPercentage,
  totalScore: sessionTotalScore,
  maxPossibleScore: sessionMaxScore,
  status: _sessionStatus,
  startSession,
  resetSession,
  recordExerciseResult: recordSessionExercise,
  goToNextExercise,
  // ADD: combo, isOnFire, incrementCombo, resetCombo
} = useSightReadingSession();
```

**Correct-note increment hook site** (target file, line 1858 — inside `handleNoteDetected`'s
`useCallback`, correct-match branch):

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:1858
recordPerformanceResult(result);
// ADD: incrementCombo();
```

Note: `handleNoteDetected`'s `useCallback` dependency array is at lines 1941-1949 — `incrementCombo`
(a stable context callback, empty-deps `useCallback`) must be added to this array (it will not cause
re-creation churn since its identity never changes, matching how `recordPerformanceResult` — itself
a stable empty-deps callback at line 1485 — is already safely listed there).

**Miss/reset hook site** (target file, line 2135 — inside `schedulePerformanceTimeline`'s `tick()`
RAF loop, inside the `already`-guarded miss block at lines 2090-2093/2135):

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:2135
recordPerformanceResult(missed);
// ADD: resetCombo();
```

This single site covers BOTH pure silent misses (`timingStatus: "missed"`) and notes where a wrong
pitch was seen but never corrected before window close (`timingStatus: "wrong_pitch"`, same branch,
see lines 2095-2096) — confirmed by reading lines 2079-2139 directly; there is no separate immediate
wrong-pitch record site (the wrong-pitch branch at lines 1905-1937 only sets `wrongPitchSeenRef`, it
does NOT call `recordPerformanceResult`).

**Local ephemeral side-effect pattern** (analog file, lines 1679-1686 for the sound+splash trigger,
adapted per RESEARCH.md Pattern 2 to react off the context's `isOnFire` transition instead of an
inline conditional):

```javascript
// Source: pattern mirrored from NotesRecognitionGame.jsx:1679-1686, adapted for context-owned isOnFire
const [showFireSplash, setShowFireSplash] = useState(false);
const prevIsOnFireRef = useRef(isOnFire);

useEffect(() => {
  if (isOnFire && !prevIsOnFireRef.current) {
    playFireSound(); // optional — Claude's Discretion (D-08 area); copy verbatim from analog if used
    setShowFireSplash(true);
    const t = setTimeout(() => setShowFireSplash(false), 1500);
    prevIsOnFireRef.current = isOnFire;
    return () => clearTimeout(t);
  }
  prevIsOnFireRef.current = isOnFire;
}, [isOnFire]);
```

**Fire sound (optional, planner's discretion per D-08/Assumption A3)** — copy verbatim if used:

```javascript
// Source: src/components/games/notes-master-games/NotesRecognitionGame.jsx:688-710
const playFireSound = useCallback(() => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1760,
      audioCtx.currentTime + 0.15
    );
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.3);
    setTimeout(() => audioCtx.close().catch(() => {}), 500);
  } catch {
    // Sound is non-critical — fail silently
  }
}, []);
```

**Header render pattern** (target file, lines 3609-3616 — existing "Right Controls" flex container;
analog file's placement convention at lines 2291-2295 — "OnFireBadge, then ComboPill, left of the
score/streak pill"):

```jsx
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:3610-3615 (current)
<div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
  {/* ADD, mirroring NotesRecognitionGame.jsx:2291-2295 order (badge, then pill, before score): */}
  <OnFireBadge active={isOnFire} />
  <ComboPill combo={combo} isOnFire={isOnFire} />
  <ScorePill value={Math.round(sessionTotalScore)} label={t("games.score")} />
  {/* ...existing BPM pill, input mode button, metronome button... */}
</div>
```

**Note on `isOnFire` prop:** the analog file's actual live usage does NOT pass `isOnFire` to
`ComboPill` (`NotesRecognitionGame.jsx:2295` is `<ComboPill combo={combo} />` only — it relies solely
on the numeric tier-tint, not the Flame-icon swap). `ComboPill.jsx`'s prop contract DOES accept
`isOnFire` (confirmed in source, lines 16, 60-68) and `ComboPill.test.jsx:53-57` explicitly tests the
Flame-icon-swap behavior, so passing it is safe and arguably more consistent with the on-fire moment;
planner's discretion which to follow, but passing it (matching RESEARCH.md's example) surfaces a
double signal (separate `OnFireBadge` + `ComboPill`'s own flame icon) — acceptable and intentional
per "maximum motivational juice" (D-04 framing).

**Root-level overlay placement** (target file, lines 3811-3840 — top-level return fragment; sibling
overlays already at this level: `RotatePromptOverlay`, and later in the same fragment the input-mode
modal / `AudioInterruptedOverlay` / `MicErrorOverlay` / penalty modal):

```jsx
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:3811-3840 (current)
return (
  <>
    {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
    <div className="relative">
      {/* ...MicDebugPanel, countInOverlay... */}
      <SightReadingLayout /* ...existing props... */ />
    </div>

    {/* ADD — root-level sibling, NOT inside SightReadingLayout (D-08, Pitfall 3) */}
    <OnFireSplash show={showFireSplash} />

    {/* ...existing input-mode modal, AudioInterruptedOverlay, MicErrorOverlay, penalty modal... */}
  </>
);
```

---

### `src/contexts/SightReadingSessionContext.test.jsx` (new test file)

**No direct analog exists** — this context currently has zero test coverage (confirmed via glob: only
`SightReadingGame.micRestart.test.jsx` mocks this module; no test file targets the context directly).

**Closest structural analog for Vitest/RTL context-testing conventions in this codebase:**
`src/components/games/shared/hud/ComboPill.test.jsx` (plain Vitest + `@testing-library/react`
`render`/`screen`, no extra setup needed — see full excerpt above). For testing a context provider in
isolation (no component under test other than a probe), the standard React pattern is a small test
harness component that calls `useSightReadingSession()` and renders its values as text/data
attributes, wrapped in `<SightReadingSessionProvider>`. No existing in-repo example of this exact
"test a context directly" pattern was found via search — this will be genuinely new test scaffolding,
but using only already-installed tools (`@testing-library/react`'s `render`, no new libraries).

**What to assert (from RESEARCH.md's Phase Requirements → Test Map):**

- `combo`/`isOnFire` start at `0`/`false`.
- Calling `incrementCombo()` N times increments `combo` to N; at N=5 (`ON_FIRE_THRESHOLD`), `isOnFire`
  becomes `true`.
- Calling `resetCombo()` sets `combo` back to `0` and `isOnFire` back to `false`.
- Calling `startSession()` or `resetSession()` resets `combo`/`isOnFire` to `0`/`false`.
- Calling `goToNextExercise()` does NOT reset `combo` (session-wide, D-05).

---

### `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` (new test file)

**Analog:** `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` (full file
read; exact mocking conventions to extend, not fork).

**`useSightReadingSession` mock — MUST be extended with the new fields** (current full mock, lines
61-78 of the analog/sibling file — this exact object shape appears in only this one test file in the
whole repo, confirmed via grep):

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx:61-78 (current — needs extending)
vi.mock("../../../contexts/SightReadingSessionContext", () => ({
  SIGHT_READING_SESSION_CONSTANTS: { DEFAULT_MAX_SCORE_PER_EXERCISE: 1000 },
  useSightReadingSession: () => ({
    totalExercises: 3,
    currentExerciseNumber: 1,
    progressFraction: 0,
    isSessionComplete: false,
    isVictory: false,
    percentage: 0,
    totalScore: 0,
    maxPossibleScore: 0,
    status: "idle",
    startSession: vi.fn(),
    resetSession: vi.fn(),
    recordExerciseResult: vi.fn(),
    goToNextExercise: vi.fn(),
    // MUST ADD: combo: 0, isOnFire: false, incrementCombo: vi.fn(), resetCombo: vi.fn()
    // (component will destructure these as `undefined` otherwise — not a crash, but combo/isOnFire
    // silently render as undefined, per RESEARCH.md's Wave 0 Gaps warning)
  }),
}));
```

For a NEW `SightReadingGame.combo.test.jsx` that wants to assert LIVE increment/reset behavior (not
just render with a static mock), the mock above must instead be a mutable/stateful mock (e.g. backed
by a real `useState` inside a wrapper, or by capturing the `incrementCombo`/`resetCombo` `vi.fn()`
calls and asserting they were invoked with the right call count/timing) — the analog file uses
`vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` to drive the RAF-based miss detection
(`schedulePerformanceTimeline`), which is the proven, existing way to trigger a "missed" record
deterministically; reuse that exact mechanism to trigger `resetCombo()` calls in the new test.

**Correct-note simulation:** the analog file drives note input via the mocked `KlavierKeyboard`'s
`onNotePlayed` prop (see the analog file's keyboard-mock section) or via capturing
`useMicNoteInput`'s `onNoteEvent` callback — same two options RESEARCH.md's Validation Architecture
section already documents; no new technique needed.

---

## Shared Patterns

### On-fire threshold & combo tier constants

**Source:** `src/components/games/notes-master-games/NotesRecognitionGame.jsx:314-324`
**Apply to:** `SightReadingSessionContext.jsx` (as a local module-level constant, reused verbatim per D-06)

```javascript
const ON_FIRE_THRESHOLD = 5;
```

(`COMBO_TIERS` itself is not strictly needed in the context — `ComboPill` computes its own tier tint
internally from the raw `combo` prop, see below — but keep `ON_FIRE_THRESHOLD` named/exported so
future re-tuning per D-06/Open Question 3 is a one-line change, per RESEARCH.md's recommendation.)

### `ComboPill` self-contained tier tinting (no tier prop needed)

**Source:** `src/components/games/shared/hud/ComboPill.jsx:52-58`
**Apply to:** No action needed in either modified file — `ComboPill` internally computes its own
tint from the raw `combo` number (`combo >= 8` / `combo >= 3` / else), matching
`NotesRecognitionGame`'s `COMBO_TIERS` thresholds (3/8) already. Just pass `combo={combo}`.

### Reduced-motion — self-contained in HUD components, do not pass a prop

**Source:** `src/components/games/shared/hud/ComboPill.jsx:17` (`useMotionTokens().reduce`),
`src/components/games/shared/hud/OnFireBadge.jsx:18-19` (dual: `useMotionTokens().reduce` AND
`useAccessibility().reducedMotion`), `src/components/games/shared/hud/OnFireSplash.jsx:18`
(`useMotionTokens().reduce`)
**Apply to:** `SightReadingGame.jsx` — do not add any reduced-motion prop or logic when rendering
`ComboPill`/`OnFireBadge`/`OnFireSplash` (D-08). This is fully self-contained already.

### Stable-callback (empty-deps `useCallback`, ref+state double-write) for cross-closure state mutation

**Source:** `src/contexts/SightReadingSessionContext.jsx:25-35` (existing `startSession`/
`resetSession`, empty-deps pattern already established in this exact file) and
`src/components/games/notes-master-games/NotesRecognitionGame.jsx:663-664, 1638, 1652` (ref+state
double-write for the specific case of values read inside stale-closure-prone callbacks)
**Apply to:** `incrementCombo`/`resetCombo` in `SightReadingSessionContext.jsx` — combine both: empty
deps (like the context's existing callbacks) AND ref+state double-write internally (like
`NotesRecognitionGame`'s combo handling), because the consuming call sites in `SightReadingGame.jsx`
include a RAF-loop closure (`tick()`) that is itself a known stale-closure risk (RESEARCH.md
Anti-Patterns/Pitfall 4) — a stable function identity sidesteps needing yet another ref-mirror in the
game component.

### Session-boundary reset ownership

**Source:** `src/contexts/SightReadingSessionContext.jsx:25-35` (`startSession`/`resetSession`) vs.
`:66-83` (`goToNextExercise`)
**Apply to:** Combo MUST reset inside `startSession`/`resetSession` (session boundaries) and MUST NOT
reset inside `goToNextExercise` (per-exercise advance) — this is the exact distinction already
encoded in this file's existing design (exercise-scoped vs. session-scoped state), just needs to be
extended consistently to combo (D-05).

## No Analog Found

| File                                               | Role | Data Flow | Reason                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------- | ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/contexts/SightReadingSessionContext.test.jsx` | test | unit      | No context-level test file exists anywhere in the repo to serve as a structural template (all existing tests target components, not bare context providers); use `ComboPill.test.jsx`'s Vitest/RTL conventions plus a minimal harness-component pattern (standard React testing technique, not project-specific) |

## Metadata

**Analog search scope:** `src/components/games/notes-master-games/`, `src/components/games/shared/hud/`,
`src/components/games/sight-reading-game/`, `src/contexts/`, `src/locales/en/`, `src/locales/he/`
**Files scanned:** 11 (3 shared HUD components + 1 HUD test, `SightReadingSessionContext.jsx`,
`SightReadingGame.jsx` targeted sections, `NotesRecognitionGame.jsx` targeted sections,
`SightReadingGame.micRestart.test.jsx`, 2 locale JSON files, plus glob/grep scans confirming no other
test files mock `useSightReadingSession`)
**Pattern extraction date:** 2026-07-09
