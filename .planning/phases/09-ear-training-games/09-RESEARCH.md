# Phase 9: Ear Training Games - Research

**Researched:** 2026-03-29
**Domain:** React game component authoring, Web Audio API scheduling, SVG keyboard rendering
**Confidence:** HIGH

## Summary

Phase 9 introduces two new game components — `NoteComparisonGame` (higher/lower pitch discrimination) and `IntervalGame` (step/skip/leap interval identification) — plus a shared `PianoKeyboardReveal` SVG component. The entire audio foundation is already in place: `usePianoSampler` synthesizes piano notes via the Web Audio API, `AudioContextProvider` handles iOS interruption, and `useSounds` provides correct/wrong feedback sounds. No new npm packages are required.

The structural template for both games is `RhythmDictationGame.jsx`. Its GAME_PHASES FSM, trail state extraction from `location.state`, `hasAutoStartedRef` auto-start guard, session timeout integration, `AudioInterruptedOverlay`, `useRotatePrompt`, and VictoryScreen handoff are all directly reusable patterns. The UI contract is fully specified in `09-UI-SPEC.md` (approved 2026-03-29), so executor-level decisions about color values, button dimensions, and animation timing are already resolved and should not be re-researched.

Integration points are clear and bounded: two new lazy routes in `App.jsx` under `/ear-training-mode/`, additions to `LANDSCAPE_ROUTES`, two case updates in `TrailNodeModal.jsx`, and new i18n keys under `games.noteComparison` and `games.intervalGame`. The `subscriptionConfig.js` pattern is well-established — ear training free node IDs can be added as `FREE_EAR_NODE_IDS` once Phase 10 determines the actual IDs.

**Primary recommendation:** Clone `RhythmDictationGame.jsx` as the structural skeleton for both new game components. Start with `NoteComparisonGame` first (simpler FSM — only 2 answer buttons, no VexFlow). Build `PianoKeyboardReveal` as a pure SVG component alongside it, then build `IntervalGame` reusing both.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 1 octave context view that shifts/centers around the two played notes. Child sees ~12 keys at a time, large enough for small screens.
- **D-02:** Color + label highlighting — Note 1 glows blue, Note 2 glows orange. Note name labels appear below each highlighted key. Direction arrow shows relationship between the notes.
- **D-03:** Keyboard is a shared SVG component used by both NoteComparisonGame and IntervalGame — same visual, different labels.
- **D-04:** Two big side-by-side buttons — HIGHER (arrow up) and LOWER (arrow down). Glass card style, large touch targets (48px+ min). Arrow icons + text labels.
- **D-05:** Animated direction reveal after answering: (1) selected button glows green/red, (2) piano keyboard slides in from below, (3) Note 1 highlights blue, (4) animated arrow slides to Note 2 (orange), (5) direction label appears ("HIGHER ▲" or "LOWER ▼"), (6) brief pause (1.5s correct, 2s wrong) then next question.
- **D-06:** Inline hints permanently visible on answer buttons — "Step (next door)", "Skip (jump one)", "Leap (far apart)" with spacing icons. No separate tutorial screen needed.
- **D-07:** Vertical stack layout — three full-width glass card buttons stacked vertically. Same pattern as RhythmDictationGame choice cards.
- **D-08:** Keyboard reveal with interval label — same blue/orange note highlighting as NoteComparison, plus: keys between the two notes get a subtle dim-highlight, interval name label shows (e.g., "SKIP — C4 to E4"), sublabel explains what was skipped (e.g., "Jumped over D4").
- **D-09:** NoteComparison uses tiered bands across 10 questions: Tier 1 (Q1-3) wide intervals (octave/7th/6th), Tier 2 (Q4-7) medium (5th/4th/3rd), Tier 3 (Q8-10) close (2nd/minor 2nd). Trail nodes can override tier ranges.
- **D-10:** IntervalGame uses ascending-first split: first ~60% of session is ascending intervals only, last ~40% introduces mixed ascending + descending. Trail nodes can configure the split ratio or be all-descending.
- **D-11:** Both games use 10 questions per session, consistent with all other game modes.

### Claude's Discretion
- Exact SVG keyboard rendering approach (inline SVG vs separate component file)
- Piano key dimensions and spacing within the 1-octave view
- Blue/orange exact color values (within glass design system)
- Arrow animation timing and easing curves
- Dim-highlight opacity for in-between keys in IntervalGame
- Note pair selection algorithm within each tier (random within bounds)
- Correct/wrong sound effects integration (reuse `useSounds` hook)
- Replay button placement for hearing the interval again
- Landscape layout adjustments for both games

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PITCH-01 | User hears two piano notes played sequentially via usePianoSampler | `usePianoSampler.playNote()` + `audioContext.currentTime` scheduling covers sequential playback. Pattern established in `RhythmDictationGame.schedulePatternPlayback`. |
| PITCH-02 | User taps HIGHER or LOWER to identify the second note's relation | 2-button layout (D-04). Answer evaluation: compare `noteIndex` of Note 1 vs Note 2 in `NOTE_FREQS` map ordering. |
| PITCH-03 | Interval distance narrows progressively through the session (wide to close) | D-09 tiered bands. Implemented via question-index-to-tier mapping; note pairs selected randomly within each tier's semitone range. |
| PITCH-04 | Animated direction reveal after each answer | D-05 timing sequence. CSS `translateY` + `translateX` via inline style state. `animate-floatUp` Tailwind keyframe exists in `tailwind.config.js`. |
| PITCH-05 | Session completes through VictoryScreen with star rating and XP award | VictoryScreen props: `score`, `totalPossibleScore`, `nodeId`, `exerciseIndex`, `totalExercises`, `exerciseType`, `onNextExercise`. Pattern established in all existing games. |
| INTV-01 | User hears a melodic interval (two notes) played via usePianoSampler | Same audio scheduling as PITCH-01. Duration per note: ~0.5s; gap between notes: configurable. |
| INTV-02 | User identifies as Step, Skip, or Leap (age-appropriate vocabulary) | 3-button vertical stack (D-07, D-06). Interval classification: Step = 1-2 semitones, Skip = 3-4 semitones, Leap = 5+ semitones. |
| INTV-03 | Ascending intervals before descending in progression | D-10 ascending-first split (~60% ascending, ~40% mixed). Configurable via `nodeConfig.ascendingRatio`. |
| INTV-04 | Piano keyboard SVG reveals played notes after answer | D-03 shared `PianoKeyboardReveal` component. Inline SVG; key highlights via controlled fill color state. In-between key dim-highlight per D-08. |
| INTV-05 | Session completes through VictoryScreen with star rating and XP award | Same VictoryScreen integration as PITCH-05. |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — zero new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component framework | Project standard |
| react-router-dom | v7 | Route registration, `useLocation`, `useNavigate` | Project standard |
| i18next / react-i18next | installed | EN + HE translation strings | Project standard |
| lucide-react | installed | `ArrowUp`, `ArrowDown`, `Volume2`, `RotateCcw` icons | Project standard |
| Tailwind CSS | 3.x | All styling, including `animate-floatUp` keyframe | Project standard |

### Project Hooks (existing, used directly)

| Hook / Component | Location | Provides |
|-----------------|----------|---------|
| `usePianoSampler` | `src/hooks/usePianoSampler.js` | `playNote(noteId, { duration, velocity, startTime })` — Web Audio synthesis |
| `useAudioContext` | `src/contexts/AudioContextProvider.jsx` | `audioContextRef`, `isInterrupted`, `handleTapToResume`, `getOrCreateAudioContext` |
| `useSounds` | `src/features/games/hooks/useSounds.js` | `playCorrectSound()`, `playWrongSound()` |
| `useSessionTimeout` | `src/contexts/SessionTimeoutContext.jsx` | `pauseTimer()`, `resumeTimer()` |
| `useRotatePrompt` | `src/hooks/useRotatePrompt.js` | `shouldShowPrompt`, `dismissPrompt` |
| `useLandscapeLock` | `src/hooks/useLandscapeLock.js` | Android PWA orientation lock (used in MetronomeTrainer) |
| `AudioInterruptedOverlay` | `src/components/games/shared/AudioInterruptedOverlay.jsx` | iOS audio interruption recovery UI |
| `RotatePromptOverlay` | `src/components/orientation/RotatePromptOverlay.jsx` | iOS rotate-to-landscape prompt |
| `VictoryScreen` | `src/components/games/VictoryScreen.jsx` | Post-game results with XP + trail progress |
| `BackButton` | `src/components/ui/BackButton.jsx` | Consistent navigation back |

**Installation:** No new packages. Zero `npm install` commands required.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/games/
│   ├── ear-training-games/           # New directory (mirrors rhythm-games/)
│   │   ├── NoteComparisonGame.jsx    # PITCH-01 through PITCH-05
│   │   ├── IntervalGame.jsx          # INTV-01 through INTV-05
│   │   └── components/
│   │       └── PianoKeyboardReveal.jsx  # Shared SVG reveal (D-03)
```

### Pattern 1: GAME_PHASES FSM (from RhythmDictationGame)

**What:** Finite-state machine using a string constant object. Drives all conditional rendering and prevents double-triggers.

**When to use:** All game components in this project follow this pattern. Both new games must too.

**States for NoteComparisonGame:**
```javascript
// Source: RhythmDictationGame.jsx — adapted for ear training
const GAME_PHASES = {
  SETUP: 'setup',       // pre-game / settings
  LISTENING: 'listening', // auto-playing the two notes
  CHOOSING: 'choosing',   // awaiting user tap
  FEEDBACK: 'feedback',   // reveal sequence running
  SESSION_COMPLETE: 'session-complete', // → VictoryScreen
};
```

IntervalGame uses identical phases. No additional states needed.

### Pattern 2: Sequential Note Playback

**What:** Schedule two notes using `audioContext.currentTime` with a fixed gap between them.

**When to use:** Both games play two notes sequentially and must complete before transitioning to CHOOSING phase.

```javascript
// Source: usePianoSampler.js + RhythmDictationGame schedulePatternPlayback pattern
const playNotePair = useCallback((note1, note2, onComplete) => {
  const ctx = audioContextRef.current || getOrCreateAudioContext();
  if (!ctx) { onComplete?.(); return; }

  const noteDuration = 0.6;    // seconds per note
  const gapBetween = 0.3;      // silence between notes
  const when1 = ctx.currentTime + 0.05; // small scheduling offset
  const when2 = when1 + noteDuration + gapBetween;

  playNote(note1, { duration: noteDuration, startTime: when1 });
  playNote(note2, { duration: noteDuration, startTime: when2 });

  const totalMs = (when2 + noteDuration - ctx.currentTime + 0.2) * 1000;
  feedbackTimeoutRef.current = setTimeout(() => {
    onComplete?.();
  }, totalMs);
}, [audioContextRef, playNote, getOrCreateAudioContext]);
```

### Pattern 3: Trail State Extraction (from RhythmDictationGame)

**What:** Extract trail navigation state from `location.state` on mount. Auto-start if `nodeConfig` present.

```javascript
// Source: RhythmDictationGame.jsx lines 69-73
const nodeId = location.state?.nodeId ?? null;
const nodeConfig = location.state?.nodeConfig ?? null;
const trailExerciseIndex = location.state?.exerciseIndex ?? null;
const trailTotalExercises = location.state?.totalExercises ?? null;
const trailExerciseType = location.state?.exerciseType ?? null;
```

The `hasAutoStartedRef = useRef(false)` guard prevents double-start on StrictMode double-render:

```javascript
// Source: RhythmDictationGame.jsx lines 351-363
useEffect(() => {
  if (nodeConfig && !hasAutoStartedRef.current) {
    hasAutoStartedRef.current = true;
    startGame(nodeConfig);
  }
}, [nodeConfig]);
```

### Pattern 4: handleNextExercise Trail Routing

**What:** When VictoryScreen signals "Next Exercise", navigate to the correct game component for the next `exerciseType`. Both new games must handle `pitch_comparison` and `interval_id` cases in addition to all existing types.

```javascript
// Source: RhythmDictationGame.jsx lines 392-424 — add two cases:
case 'pitch_comparison':
  navigate('/ear-training-mode/note-comparison-game', { state: navState });
  break;
case 'interval_id':
  navigate('/ear-training-mode/interval-game', { state: navState });
  break;
```

This same switch must be updated in ALL existing game components' `handleNextExercise` functions so they can chain to the new ear training games.

### Pattern 5: PianoKeyboardReveal as Pure SVG Component

**What:** An inline SVG rendering 7+ white keys and 5 black keys, with controlled `fill` attributes for highlight states. No canvas, no VexFlow dependency.

**Key geometry (from 09-UI-SPEC.md):**
- White keys: 28px wide × 120px tall
- Black keys: 14px wide × 72px tall
- 7 white keys = 196px total SVG canvas width
- Black key x-positions relative to white keys (standard piano layout): C#=20, D#=48, F#=104, G#=132, A#=160 (within one octave)

**Octave centering algorithm:** Given two notes `note1` and `note2`, find the lower note's octave as the display root. If both notes span more than one octave, center on the lower note's octave (always show C-B of that octave).

**State model:**
```javascript
// highlight prop: { note1: 'C4', note2: 'E4', inBetween: ['D4'] }
// Derived inside component from note names
const KEY_STATE = {
  NOTE1: 'note1',    // blue highlight
  NOTE2: 'note2',    // orange highlight
  BETWEEN: 'between', // dim white
  DEFAULT: 'default',
};
```

**SVG fill values (from 09-UI-SPEC.md):**
- Note 1 white key: `#60a5fa` (blue-400)
- Note 1 black key: `#3b82f6` (blue-500)
- Note 2 white key: `#fb923c` (orange-400)
- Note 2 black key: `#ea580c` (orange-600)
- In-between keys: `rgba(255,255,255,0.2)`
- Default white key: `white`
- Default black key: `#1e1b4b`

### Pattern 6: Interval Classification

**What:** Map a semitone distance to a Step/Skip/Leap category.

```javascript
// Classification boundaries for IntervalGame (age-appropriate)
function classifyInterval(semitones) {
  const abs = Math.abs(semitones);
  if (abs <= 2) return 'step';   // minor 2nd or major 2nd
  if (abs <= 4) return 'skip';   // minor 3rd or major 3rd
  return 'leap';                  // perfect 4th and above
}
```

**Note index for semitone calculation:**
```javascript
// All 24 notes in chromatic order — index difference = semitones
const NOTE_ORDER = Object.keys(NOTE_FREQS); // from usePianoSampler.js
// e.g. NOTE_ORDER.indexOf('C4') = 12, NOTE_ORDER.indexOf('E4') = 16 → 4 semitones → Skip
```

### Pattern 7: NoteComparison Tier-Band Note Pair Selection

**What:** Deterministic tier-to-semitone mapping. Note pairs chosen randomly within bounds per question index.

```javascript
// D-09 tier ranges
const TIERS = [
  { questions: [0, 1, 2], minSemitones: 6, maxSemitones: 12 }, // Tier 1: wide (6th-octave)
  { questions: [3, 4, 5, 6], minSemitones: 3, maxSemitones: 5 }, // Tier 2: medium (3rd-5th)
  { questions: [7, 8, 9], minSemitones: 1, maxSemitones: 2 },   // Tier 3: close (2nd)
];

function getTierForQuestion(questionIndex) {
  return TIERS.find(t => t.questions.includes(questionIndex)) ?? TIERS[0];
}
```

### Pattern 8: Accessibility — aria-live for Feedback

**What:** Screen reader announcement after answer selection (from 09-UI-SPEC.md).

```jsx
// Feedback text: aria-live="polite" for general feedback
// Direction label: aria-live="assertive" for HIGHER/LOWER result
<div aria-live="polite" className="sr-only">{feedbackText}</div>
<div aria-live="assertive" className="sr-only">{directionLabel}</div>
```

### Anti-Patterns to Avoid

- **Creating a new AudioContext inside the game component:** `usePianoSampler` uses the shared context from `AudioContextProvider`. Never call `new AudioContext()` directly in game components — the route must be wrapped in `<AudioContextProvider>` in `App.jsx`.
- **Using `Date.now()` for audio scheduling:** Always use `audioContext.currentTime`. `Date.now()` drifts relative to the audio clock.
- **Rendering PianoKeyboardReveal before answer:** The keyboard is hidden pre-answer (`display: none` or conditional render). Only mount/show after `gamePhase === FEEDBACK`.
- **Forgetting the `hasAutoStartedRef` guard:** Without it, React StrictMode double-invokes effects and auto-starts the game twice.
- **Setting `aria-hidden` on interactive elements:** Piano keyboard SVG is `aria-hidden="true"` (decorative); answer buttons get full `aria-label` values.
- **Using fixed note ranges without bounds checking:** `NOTE_FREQS` covers C3-B4 (24 notes). Note pair selection must clamp to valid indices — don't pick a note at index -1 or 24.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Piano synthesis | Custom oscillator synthesis | `usePianoSampler.playNote()` | Already built, tested (9 tests), ADSR envelope tuned |
| Correct/wrong sounds | New Audio() instances | `useSounds.playCorrectSound/Wrong()` | Already handles path resolution, cleanup |
| iOS audio interruption | Custom onstatechange handler | `AudioContextProvider` + `AudioInterruptedOverlay` | Already covers interrupted/suspended, tap-to-resume pattern |
| Session timeout | Custom inactivity timer | `useSessionTimeout().pauseTimer/resumeTimer()` | Already handles role-based durations |
| Orientation handling | Custom matchMedia listener | `useRotatePrompt` + `useLandscapeLock` | Already covers iOS vs Android differences |
| VictoryScreen XP + stars | Custom scoring display | `VictoryScreen` component | Already handles 0-3 stars, XP animation, trail progress, comeback multiplier |
| Answer button states | Custom CSS state machine | `DictationChoiceCard.STATE_CLASSES` pattern | Copy verbatim — green glow, red flash, dimmed pattern is established |
| Piano key layout math | Custom SVG coordinate calculation | Fixed dimensions from UI-SPEC | Dimensions already resolved: 28px white, 14px black, 7-key octave = 196px |

**Key insight:** This phase is almost entirely composition of existing building blocks. The only genuinely new code is (1) the note-pair selection algorithms, (2) the `PianoKeyboardReveal` SVG component, and (3) the GAME_PHASES FSM wiring specific to ear training flow.

---

## Common Pitfalls

### Pitfall 1: AudioContext Suspension on iOS Before First User Gesture

**What goes wrong:** `usePianoSampler.playNote()` is called in the auto-start `useEffect` but the AudioContext is still suspended because no user gesture has occurred yet.

**Why it happens:** iOS Safari requires a user gesture to resume an AudioContext. Auto-start from `useEffect` fires without a gesture when navigating from the trail (the tap on "Start" in TrailNodeModal counts, but only if the AudioContext was created in the same gesture chain — which it was not if `AudioContextProvider` created it eagerly).

**How to avoid:** The `usePianoSampler.playNote()` implementation already calls `ctx.resume().catch(() => {})` when `ctx.state === 'suspended'`. On iOS, the trail navigation tap (the gesture that triggered TrailNodeModal's navigate) should be sufficient to unsuspend the context. The `AudioInterruptedOverlay` handles the recovery case where it wasn't sufficient. No additional guard needed beyond what `usePianoSampler` already provides.

**Warning signs:** In testing, notes play fine in Chrome but silently fail on iOS simulator.

### Pitfall 2: Note Pair Duplicates (same note picked twice)

**What goes wrong:** The random note-pair selection algorithm picks the same semitone distance as 0, producing two identical notes. This makes the HIGHER/LOWER question unanswerable.

**Why it happens:** Arithmetic error or off-by-one in the random range, or `Math.random()` edge case.

**How to avoid:** After generating `note1Index` and computing `note2Index = note1Index + delta`, assert `delta !== 0` and that both indices are within `[0, NOTE_ORDER.length - 1]`. Add a retry loop (max 10 attempts) before falling back to a safe default pair.

**Warning signs:** VictoryScreen shows 0/10 score because both buttons were technically wrong (undefined behavior).

### Pitfall 3: Animation Sequence Race Condition

**What goes wrong:** The D-05 reveal sequence uses `setTimeout` chains. If the user navigates away mid-sequence, the timeouts fire on an unmounted component, causing React state update warnings or crashes.

**Why it happens:** `setTimeout` callbacks hold closure references to `setState` functions. React 18 doesn't throw errors for this but it produces console warnings and potentially stale state.

**How to avoid:** Store all pending timeouts in `feedbackTimeoutRef.current` (a ref holding an array, or clear the previous one before setting a new one). In the `useEffect` cleanup, call `clearTimeout(feedbackTimeoutRef.current)`. This is the same pattern `RhythmDictationGame` uses.

**Warning signs:** Console: "Warning: Can't perform a React state update on an unmounted component" after navigating away during feedback phase.

### Pitfall 4: RTL Keyboard Direction Inversion

**What goes wrong:** In Hebrew RTL mode, the `dir="rtl"` on the game container causes the SVG piano keyboard to flip — C appears on the right instead of the left.

**Why it happens:** SVG `dir` attribute is inherited from parent DOM if not explicitly overridden.

**How to avoid:** Set `dir="ltr"` directly on the `PianoKeyboardReveal` container `<div>` and/or the `<svg>` element itself. From 09-UI-SPEC.md: "Piano keyboard SVG: force `dir="ltr"` — musical pitch order (C to B) is always left-to-right."

**Warning signs:** Hebrew users see the note ordering reversed; the direction arrow points the wrong way.

### Pitfall 5: Missing `handleNextExercise` Cases in Existing Games

**What goes wrong:** A trail node sequences from, say, `note_recognition` into `pitch_comparison`. The `handleNextExercise` in `NotesRecognitionGame.jsx` doesn't have a `pitch_comparison` case, so it falls through to `navigate('/trail')`, abandoning the sequence mid-flow.

**Why it happens:** All existing games have a `handleNextExercise` switch that was written before ear training games existed. They have no cases for `pitch_comparison` or `interval_id`.

**How to avoid:** As part of this phase's integration tasks, update `handleNextExercise` in ALL four existing game components: `NotesRecognitionGame.jsx`, `SightReadingGame.jsx`, `MetronomeTrainer.jsx`, `MemoryGame.jsx`, and `RhythmDictationGame.jsx` (and `RhythmReadingGame.jsx` if it has one). Add `pitch_comparison` → `/ear-training-mode/note-comparison-game` and `interval_id` → `/ear-training-mode/interval-game`.

**Warning signs:** In trail-mode multi-exercise nodes that mix ear training with other types, the sequence breaks after the non-ear-training exercise.

### Pitfall 6: dailyGoalsService Category Arrays

**What goes wrong:** `dailyGoalsService.js` goal templates' `checkProgress` functions reference `exercisesCompleted`, `threeStarsEarned`, etc. — these are category-agnostic. No hardcoded category arrays were found in `dailyGoalsService.js`. The STATE.md concern ("Audit `dailyGoalsService.js` for hardcoded category arrays before ear training games ship") appears to refer to whether the progress fields would fail to count ear training completions.

**Why it happens:** The concern is that if the daily goals system only increments `exercisesCompleted` for certain exercise types (e.g., filtered by category), ear training completions would not count toward daily goals.

**Audit finding (MEDIUM confidence):** The `checkProgress` functions in `GOAL_TEMPLATES` operate on `progressUpdate` data fields that are passed in by callers — they don't filter by category internally. Whether ear training completions reach those callers depends on where `updateDailyGoalsProgress()` is called (likely in VictoryScreen or a service it calls). Since VictoryScreen is reused and the `nodeId` is not filtered there, ear training completions should increment daily goals automatically.

**How to avoid:** Verify that `VictoryScreen` (or `useVictoryState`) calls `updateDailyGoalsProgress()` for all node completions, not just certain categories. This is a low-risk audit item — no code change is likely needed, but an executor should verify the call path.

---

## Code Examples

### Scheduling Two Notes Sequentially

```javascript
// Source: usePianoSampler.js API + pattern adapted from RhythmDictationGame schedulePatternPlayback
const playNotePair = useCallback((noteId1, noteId2, { onComplete } = {}) => {
  const ctx = audioContextRef.current || getOrCreateAudioContext();
  if (!ctx) { onComplete?.(); return; }

  const NOTE_DURATION = 0.6;  // seconds
  const NOTE_GAP = 0.25;      // silence between notes
  const scheduleOffset = 0.05; // buffer against scheduling jitter

  const when1 = ctx.currentTime + scheduleOffset;
  const when2 = when1 + NOTE_DURATION + NOTE_GAP;

  playNote(noteId1, { duration: NOTE_DURATION, velocity: 0.7, startTime: when1 });
  playNote(noteId2, { duration: NOTE_DURATION, velocity: 0.7, startTime: when2 });

  // Transition after both notes finish + small buffer
  const totalMs = ((when2 + NOTE_DURATION - ctx.currentTime) + 0.2) * 1000;
  feedbackTimeoutRef.current = setTimeout(() => {
    onComplete?.();
  }, totalMs);
}, [audioContextRef, playNote, getOrCreateAudioContext]);
```

### PianoKeyboardReveal — Key State Derivation

```javascript
// Source: 09-UI-SPEC.md key highlight states + NOTE_FREQS ordering from usePianoSampler.js
const NOTE_ORDER = [
  'C3','C#3','D3','D#3','E3','F3','F#3','G3','G#3','A3','A#3','B3',
  'C4','C#4','D4','D#4','E4','F4','F#4','G4','G#4','A4','A#4','B4',
];

function getKeyStates(note1, note2) {
  const i1 = NOTE_ORDER.indexOf(note1);
  const i2 = NOTE_ORDER.indexOf(note2);
  if (i1 === -1 || i2 === -1) return {};

  const lo = Math.min(i1, i2);
  const hi = Math.max(i1, i2);
  const states = {};

  states[note1] = 'note1';
  states[note2] = 'note2';

  // Keys strictly between the two notes = in-between (IntervalGame only)
  for (let i = lo + 1; i < hi; i++) {
    const noteName = NOTE_ORDER[i];
    if (!(noteName in states)) {
      states[noteName] = 'between';
    }
  }

  return states;
}
```

### Answer Button State Classes (reuse DictationChoiceCard pattern verbatim)

```javascript
// Source: DictationChoiceCard.jsx STATE_CLASSES — copy exactly for answer buttons
const STATE_CLASSES = {
  default: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 cursor-pointer transition-colors duration-150',
  correct: 'bg-green-500/20 backdrop-blur-md border-2 border-green-400 rounded-xl shadow-[0_0_12px_rgba(74,222,128,0.4)] transition-all duration-300',
  wrong:   'bg-red-500/20 backdrop-blur-md border-2 border-red-400 rounded-xl transition-all duration-300',
  dimmed:  'opacity-40 pointer-events-none bg-white/10 border border-white/20 rounded-xl',
};
```

### VictoryScreen Props (from RhythmDictationGame)

```jsx
// Source: RhythmDictationGame.jsx lines 451-465
<VictoryScreen
  score={correctCount}
  totalPossibleScore={TOTAL_QUESTIONS}
  onReset={handleReset}
  onExit={() => navigate('/trail')}
  nodeId={nodeId}
  exerciseIndex={trailExerciseIndex}
  totalExercises={trailTotalExercises}
  exerciseType={trailExerciseType}
  onNextExercise={handleNextExercise}
/>
```

### TrailNodeModal Cases to Update

```javascript
// Source: TrailNodeModal.jsx lines 240-245 — replace ComingSoon with actual routes
case 'pitch_comparison':
  navigate('/ear-training-mode/note-comparison-game', { state: navState });
  break;
case 'interval_id':
  navigate('/ear-training-mode/interval-game', { state: navState });
  break;
```

### App.jsx Route Registration Pattern

```jsx
// Source: App.jsx lines 362-369 — follow exact same pattern as rhythm games
const NoteComparisonGame = lazyWithRetry(
  () => import("./components/games/ear-training-games/NoteComparisonGame")
);
const IntervalGame = lazyWithRetry(
  () => import("./components/games/ear-training-games/IntervalGame")
);

// In LANDSCAPE_ROUTES array:
"/ear-training-mode/note-comparison-game",
"/ear-training-mode/interval-game",

// In Routes:
<Route
  path="/ear-training-mode/note-comparison-game"
  element={<AudioContextProvider><NoteComparisonGame /></AudioContextProvider>}
/>
<Route
  path="/ear-training-mode/interval-game"
  element={<AudioContextProvider><IntervalGame /></AudioContextProvider>}
/>
```

### i18n Key Addition Pattern

```json
// Source: src/locales/en/common.json — add under "games" key, following "rhythmDictation" structure
// Both en/ and he/ files require matching keys
{
  "games": {
    "noteComparison": {
      "title": "Note Comparison",
      "question": "Which note is HIGHER?",
      "higher": "HIGHER",
      "lower": "LOWER",
      "reveal": { "higher": "HIGHER ▲", "lower": "LOWER ▼" },
      "listening": "Listen...",
      "playAgain": "Play Again",
      "startGame": "Start Listening",
      "correct": "Correct!",
      "wrong": "Try again!",
      "errors": {
        "audioUnavailable": "Audio not available. Tap to try again.",
        "generationFailed": "Something went wrong. Go back and try again."
      }
    },
    "intervalGame": {
      "title": "Interval Training",
      "question": "How far apart are the notes?",
      "step": "Step", "stepHint": "next door",
      "skip": "Skip", "skipHint": "jump one",
      "leap": "Leap", "leapHint": "far apart",
      "listening": "Listen...",
      "playAgain": "Play Again",
      "startGame": "Start Listening",
      "correct": "Correct!",
      "wrong": "Try again!",
      "errors": {
        "audioUnavailable": "Audio not available. Tap to try again.",
        "generationFailed": "Something went wrong. Go back and try again."
      }
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rhythm games routed to `/coming-soon` for `pitch_comparison` and `interval_id` | Will route to actual game components | Phase 9 | TrailNodeModal routing updates required |
| `usePianoSampler` using runtime-fetched WAV samples | Synthesis via Web Audio oscillators (no external files) | Phase 8 | No audio file assets needed for ear training |
| `AudioContextProvider` (Phase 08): `isInterrupted` + `handleTapToResume` added | Already available for Phase 9 games | Phase 8 | AudioInterruptedOverlay pattern is fully established |

**No deprecated patterns discovered.** All referenced code is current as of Phase 8.

---

## Open Questions

1. **dailyGoalsService ear training category filtering**
   - What we know: `GOAL_TEMPLATES.checkProgress` functions are category-agnostic; they operate on a `progressUpdate` object passed by callers.
   - What's unclear: Whether the caller (likely `useVictoryState` or a service it invokes) filters by category before calling `updateDailyGoalsProgress()`.
   - Recommendation: Executor should trace the call from `VictoryScreen` → `useVictoryState` → daily goals service to verify ear training completions increment `exercisesCompleted`. Likely no code change needed, but must verify.

2. **`subscriptionConfig.js` ear training free node IDs**
   - What we know: Phase 10 will define the actual ear training trail node IDs. The `subscriptionConfig.js` pattern (explicit ID sets) is established and documented.
   - What's unclear: Whether the planner should add an empty `FREE_EAR_NODE_IDS = []` placeholder now or defer entirely to Phase 10.
   - Recommendation: Defer to Phase 10. No ear training trail nodes exist yet; adding an empty array to `subscriptionConfig.js` adds noise with no current value. The `isFreeNode()` function already returns `false` for unknown IDs, which is the correct free-tier behavior (all locked until Phase 10 configures them).

3. **Route naming convention: `/ear-training-mode/` vs `/ear-training/`**
   - What we know: Existing game paths follow a `/-mode/` convention (`/notes-master-mode/`, `/rhythm-mode/`).
   - What's unclear: This is a Claude's Discretion item (route naming not locked).
   - Recommendation: Use `/ear-training-mode/` to be consistent with the existing naming convention.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 9 is purely React component authoring with no external service dependencies. All tools (Node, npm, browser APIs) are already established from earlier phases. No new CLIs, databases, or runtimes required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 1.x + @testing-library/react |
| Config file | `vitest.config.js` (root) |
| Quick run command | `npx vitest run src/components/games/ear-training-games/` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PITCH-01 | Two notes played sequentially via usePianoSampler | unit | `npx vitest run src/components/games/ear-training-games/NoteComparisonGame.test.js` | Wave 0 |
| PITCH-02 | HIGHER/LOWER answer evaluation correct | unit | same | Wave 0 |
| PITCH-03 | Tier progression narrows interval distance | unit | `npx vitest run src/components/games/ear-training-games/earTrainingUtils.test.js` | Wave 0 |
| PITCH-04 | Reveal sequence state transitions | unit | same NoteComparisonGame.test.js | Wave 0 |
| PITCH-05 | SESSION_COMPLETE renders VictoryScreen | unit | same NoteComparisonGame.test.js | Wave 0 |
| INTV-01 | Two notes played via usePianoSampler | unit | `npx vitest run src/components/games/ear-training-games/IntervalGame.test.js` | Wave 0 |
| INTV-02 | Step/Skip/Leap classification correct | unit | `npx vitest run src/components/games/ear-training-games/earTrainingUtils.test.js` | Wave 0 |
| INTV-03 | Ascending-first question ordering | unit | same earTrainingUtils.test.js | Wave 0 |
| INTV-04 | PianoKeyboardReveal renders with correct key states | unit | `npx vitest run src/components/games/ear-training-games/PianoKeyboardReveal.test.js` | Wave 0 |
| INTV-05 | SESSION_COMPLETE renders VictoryScreen | unit | same IntervalGame.test.js | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/games/ear-training-games/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/games/ear-training-games/earTrainingUtils.test.js` — covers tier logic (PITCH-03), interval classification (INTV-02), ascending-first ordering (INTV-03), note pair generation bounds checking
- [ ] `src/components/games/ear-training-games/NoteComparisonGame.test.js` — covers sequential playback mock (PITCH-01), answer evaluation (PITCH-02), FSM state transitions (PITCH-04), VictoryScreen render (PITCH-05)
- [ ] `src/components/games/ear-training-games/IntervalGame.test.js` — covers sequential playback mock (INTV-01), answer evaluation (INTV-02), VictoryScreen render (INTV-05)
- [ ] `src/components/games/ear-training-games/PianoKeyboardReveal.test.js` — covers key state derivation for note1/note2/between (INTV-04), dir=ltr enforcement, aria-hidden

Existing test infrastructure (`vitest.config.js`, `src/test/setupTests.js`, `@testing-library/react`) covers all requirements. No framework install needed.

Mock pattern for `usePianoSampler` in tests: use `vi.mock('../../../hooks/usePianoSampler', () => ({ usePianoSampler: () => ({ playNote: vi.fn() }) }))` — identical to existing `usePianoSampler.test.js` mock setup.

---

## Project Constraints (from CLAUDE.md)

These directives are LOCKED and must be followed by the planner:

| Directive | Constraint |
|-----------|-----------|
| SVG imports | Use `import Icon from './icon.svg?react'` (with `?react` suffix). Not applicable to PianoKeyboardReveal (inline SVG, not an imported file). |
| Styling | Glassmorphism on purple gradient. Glass card: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`. |
| Audio | Central `AudioContext` via `AudioContextProvider`. All audio through `useAudioContext()` hook. Never create a standalone `new AudioContext()`. |
| iOS | Requires `AudioInterruptedOverlay` in all audio games. |
| i18n | All new strings require EN + HE keys. |
| Testing | Vitest + JSDOM. Test files as `*.test.{js,jsx}` siblings or in `__tests__/` directories. |
| Pre-commit | Husky + lint-staged: ESLint + Prettier on staged files. |
| Build validation | `validateTrail.mjs` runs as prebuild hook — no trail node authoring in this phase so no risk, but trail-touching code must pass validation. |
| Session timeout | Games must call `pauseTimer()` during active gameplay and `resumeTimer()` when idle. |
| Route wrapping | Game routes must be wrapped in `<AudioContextProvider>` in `App.jsx`. |
| LANDSCAPE_ROUTES | All game route paths must be added to `LANDSCAPE_ROUTES` array in `App.jsx`. |
| `lazyWithRetry` | Use `lazyWithRetry()` (not React.lazy()) for game component imports in `App.jsx`. |

---

## Sources

### Primary (HIGH confidence)

- `src/hooks/usePianoSampler.js` — Full implementation inspected. API: `playNote(noteId, { duration, velocity, startTime })`. Range C3-B4 (24 notes). Synthesis: two oscillators + ADSR envelope.
- `src/contexts/AudioContextProvider.jsx` — Full implementation inspected. iOS handling: `isInterrupted`, `handleTapToResume`, `onstatechange`.
- `src/components/games/rhythm-games/RhythmDictationGame.jsx` — Full implementation inspected. Used as structural template.
- `src/components/games/rhythm-games/components/DictationChoiceCard.jsx` — Full implementation inspected. `STATE_CLASSES` confirmed.
- `src/components/games/VictoryScreen.jsx` — Props interface confirmed from source.
- `src/components/trail/TrailNodeModal.jsx` — `pitch_comparison` and `interval_id` routing to `/coming-soon` confirmed at lines 240-244.
- `src/App.jsx` — `LANDSCAPE_ROUTES` array (lines 191-200), route registrations (lines 332-370), `lazyWithRetry` pattern confirmed.
- `src/data/constants.js` — `EXERCISE_TYPES.PITCH_COMPARISON`, `EXERCISE_TYPES.INTERVAL_ID`, `TRAIL_TAB_CONFIGS[3]` (ear_training) all confirmed.
- `src/config/subscriptionConfig.js` — Free node ID pattern confirmed. No ear training entries present (correct for Phase 9).
- `tailwind.config.js` — `animate-floatUp` keyframe confirmed at line 85.
- `vitest.config.js` — Environment: jsdom, globals: true, setupFiles: `src/test/setupTests.js`.
- `.planning/phases/09-ear-training-games/09-UI-SPEC.md` — Full UI contract read. All dimensions, colors, animation timings, and copy confirmed.
- `.planning/phases/09-ear-training-games/09-CONTEXT.md` — All 11 decisions (D-01 through D-11) read.

### Secondary (MEDIUM confidence)

- `src/services/dailyGoalsService.js` — Partial inspection (160 lines). `GOAL_TEMPLATES.checkProgress` functions are category-agnostic. Full call chain from VictoryScreen not traced (open question).
- `src/locales/en/common.json` — `games.rhythmDictation` key structure confirmed at lines 783-796 as nesting template for new keys.

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries inspected in source; zero new packages required
- Architecture patterns: HIGH — all patterns sourced from existing game implementations
- Pitfalls: HIGH (1-4) / MEDIUM (5-6) — pitfalls 1-4 sourced from existing code; pitfalls 5-6 based on architectural analysis
- Validation architecture: HIGH — vitest config and test patterns confirmed from existing test files

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days — stable project, no external dependencies)
