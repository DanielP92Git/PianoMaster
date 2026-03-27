# Phase 8: Audio Infrastructure + Rhythm Games - Research

**Researched:** 2026-03-27
**Domain:** Web Audio API synthesis, VexFlow rhythm notation, React game components, i18n
**Confidence:** HIGH — all findings based on direct codebase inspection, no external lookups needed

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Static staff with moving highlight cursor — staff fixed, glowing vertical line sweeps left-to-right in sync with tempo. Child sees the full pattern at once.

**D-02:** 1 measure visible at a time — one bar per exercise, 10 exercises per session.

**D-03:** Count-in uses both audio + visual — metronome clicks + "3, 2, 1, GO!" countdown numbers pulse/fade.

**D-04:** Tap feedback uses floating text + note color change — "PERFECT!" / "GOOD" / "MISS" floats up from tap point and fades. Note changes color: green = PERFECT, yellow = GOOD, red = MISS.

**D-05:** Tap produces an audible click — soft click/pop on each tap. Two audio layers: pattern = piano note (auto), tap = light click (on touch).

**D-06:** Vertical stack layout for choice cards — 3 full-width cards stacked vertically.

**D-07:** 3 choices per question — 1 correct + 2 distractors.

**D-08:** Auto-play + replay button — pattern plays automatically when question loads. Replay button available.

**D-09:** Correct/wrong feedback: highlight + replay correct — correct card glows green, wrong cards dim. On wrong: selected flashes red, then correct glows green + replays. Brief pause (1.5s correct, 2s wrong) then next question.

**D-10:** 2 octaves C3-B4 range for usePianoSampler — 24 chromatic notes.

**D-11:** Web Audio synthesis, not pre-recorded samples — use AudioContext oscillator (sine + 2-3 harmonics + ADSR). Zero external dependency.

**D-12:** On-demand synthesis — create oscillator + gain envelope each call. Zero startup cost.

**D-13:** Piano single pitch (C4) for rhythm pattern playback — both rhythm games use C4 piano note for each beat.

### Claude's Discretion

- Exact ADSR envelope shape for synthesized piano tones
- Harmonic ratios for piano-like timbre
- Tap click sound design (frequency, duration)
- VexFlow rendering approach for notation cards (reuse VexFlowStaffDisplay vs new component)
- Distractor generation algorithm for dictation (systematic duration swaps per RDICT-04)
- Floating text animation details (font size, fade duration, easing)
- Cursor glow visual style (color, width, opacity)
- i18n key naming convention for new game strings

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-06 | usePianoSampler hook plays piano notes via runtime-fetched AudioBuffers from shared AudioContext | D-11, D-12: synthesize via oscillator using `audioContextRef` from `useAudioContext()`; no file fetch needed |
| INFRA-07 | Service worker cache version bumped for new audio assets | SW is at `pianomaster-v8`; bump to `pianomaster-v9` |
| INFRA-08 | i18n keys added for all new exercise types and game UI in EN and HE | Both `src/locales/en/common.json` and `src/locales/he/common.json` need new game-specific keys; trail keys partially done |
| RTAP-01 | User sees VexFlow notation and taps screen in time with the rhythm | Adapt VexFlowStaffDisplay with rhythm-only rendering (all notes at `b/4` treble position, `Stem.UP`) |
| RTAP-02 | Visual scrolling cursor advances through notation synced to tempo | Implement via CSS `left` absolute positioning on a fixed overlay div; use `audioContext.currentTime` for position |
| RTAP-03 | Count-in plays before pattern starts (1-2 bars) | Use `createCustomMetronomeSound` pattern from MetronomeTrainer; visual: countdown state variable |
| RTAP-04 | Each tap scored PERFECT/GOOD/MISS using audioContext.currentTime | Port `calculateTimingThresholds` from MetronomeTrainer; capture tap time via `audioContextRef.current.currentTime` |
| RTAP-05 | Session completes through VictoryScreen with star rating and XP | Follow VictoryScreen integration pattern from MetronomeTrainer/Architecture doc |
| RDICT-01 | User hears a rhythm pattern played audio-only | Sequence synthesized C4 notes per beat using `audioContext.currentTime + offset` scheduling |
| RDICT-02 | User can replay the rhythm before answering | Replay button re-runs the same playback sequence; state flag `isPlaying` prevents double-start |
| RDICT-03 | User picks correct notation from 2-4 VexFlow multiple-choice cards | 3 VexFlowStaffDisplay instances in vertical stack; tap any card to answer |
| RDICT-04 | Wrong answer distractors differ by at least one audible duration element | Duration-swap distractor algorithm: replace one note's duration with a shorter/longer neighbour value |
| RDICT-05 | Correct/wrong feedback with reveal animation and optional notation replay | Tailwind transition on card border color; replay runs same audio scheduler as RDICT-01 |
| RDICT-06 | Session completes through VictoryScreen with star rating and XP | Same VictoryScreen integration as RTAP-05 |
</phase_requirements>

---

## Summary

Phase 8 is a self-contained game component build with three layers: a new audio synthesis hook (`usePianoSampler`), two new game components (`RhythmReadingGame` and `RhythmDictationGame`), and i18n completion for all rhythm exercise types. All required infrastructure is already in the codebase — the shared `AudioContextProvider`, the `useAudioEngine` scheduler patterns, `VexFlowStaffDisplay`, `RhythmPatternGenerator`, `VictoryScreen`, and the orientation/session hooks.

The key design decision (D-11) is to synthesize piano notes via Web Audio API oscillators rather than loading WAV files. This is the right call because: (1) the existing `usePianoSampler` architecture design in ARCHITECTURE.md assumed WAV files from `public/sounds/piano-samples/`, but the codebase has WAV samples only in `src/assets/sounds/piano/` (not in `public/`); (2) D-11 locks synthesis as the approach; (3) `useAudioEngine` already demonstrates the oscillator pattern for metronome clicks and pattern sounds. The piano sample at `public/sounds/piano/G4.mp3` is used by the metronome — the new synthesized approach is independent.

The VexFlow rendering for rhythm notation cards requires special handling: rhythm games use a single pitch (`b/4` for treble staff) with `Stem.UP` forced on all notes. The existing `VexFlowStaffDisplay` accepts a `pattern` object — for rhythm games, all notes will share the same pitch key, distinguishing only duration codes. This adaptation is well within Claude's discretion (per CONTEXT.md).

**Primary recommendation:** Build `usePianoSampler` as a thin oscillator wrapper around `useAudioContext()`, create `RhythmReadingGame` and `RhythmDictationGame` following the MetronomeTrainer structural template exactly, and complete i18n for the five new exercise type strings in Hebrew.

---

## Standard Stack

### Core (already in project)

| Library | Version | Purpose | Role in Phase 8 |
|---------|---------|---------|-----------------|
| React | 18.x | Component framework | Game component structure |
| VexFlow | 5.0.0 | SVG music notation | Rhythm notation cards in both games |
| Web Audio API | Browser built-in | Audio scheduling and synthesis | usePianoSampler synthesis + tap clock |
| i18next | 25.x | Internationalization | New game UI strings EN + HE |
| React Router v7 | 7.x | Navigation | New routes in App.jsx |
| Tailwind CSS 3 | 3.x | Styling | Glass card pattern, animations |

### Supporting (already in project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useAudioContext` | internal | Shared AudioContext with iOS recovery | Required in usePianoSampler and both games |
| `useAudioEngine` | internal | Metronome scheduler with lookahead | Reference for scheduling patterns; may be used directly for count-in |
| `RhythmPatternGenerator` | internal | Rhythm pattern generation | Source of patterns for both games |
| `VexFlowStaffDisplay` | internal | VexFlow SVG wrapper | Adapt for rhythm-only notation |
| `useLandscapeLock` / `useRotatePrompt` | internal | Orientation control | Required in both games |
| `useSessionTimeout` | internal | Inactivity timer | Required in both games |
| `AudioInterruptedOverlay` | internal | iOS recovery overlay | Required in both games |
| `VictoryScreen` | internal | Post-game flow | Required in both games |
| `useSounds` | internal | Correct/wrong sound effects | Required in both games |

### No New Dependencies Needed

This phase introduces zero new npm packages. All required capabilities are available via Web Audio API (built-in) and existing project libraries.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── usePianoSampler.js              CREATE — oscillator synthesis hook
├── components/games/rhythm-games/
│   ├── RhythmReadingGame.jsx           CREATE — tap-along game
│   ├── RhythmDictationGame.jsx         CREATE — hear-and-pick game
│   └── components/
│       └── (existing components unchanged)
├── locales/en/
│   └── common.json                     MODIFY — add rhythmReading + rhythmDictation game UI keys
└── locales/he/
    └── common.json                     MODIFY — add Hebrew translations for same keys
```

Plus modifications to:
- `src/App.jsx` — 2 new lazy routes + LANDSCAPE_ROUTES entries
- `src/components/trail/TrailNodeModal.jsx` — update `rhythm_tap` and `rhythm_dictation` cases to real routes
- `public/sw.js` — bump cache version `pianomaster-v8` → `pianomaster-v9`

### Pattern 1: usePianoSampler — Oscillator Synthesis

**What:** Synthesize a piano-like tone on demand using Web Audio API oscillators with ADSR envelope.

**When to use:** Any time a note needs to play in `RhythmReadingGame` (C4 beat) or `RhythmDictationGame` (C4 pattern).

**Why synthesis (D-11):** Zero external dependency, no file licensing, no fetch latency, COPPA-safe, zero memory footprint between calls.

**ADSR recommendation (Claude's discretion):** Piano attack is extremely fast (0-1ms), decay is rapid (100-200ms), sustain is low-level, release is medium (300-500ms). Use sine fundamental + second harmonic at 0.5× gain for piano-like timbre.

```javascript
// src/hooks/usePianoSampler.js
import { useCallback } from 'react';
import { useAudioContext } from '../contexts/AudioContextProvider';

export function usePianoSampler() {
  const { audioContextRef, getOrCreateAudioContext } = useAudioContext();

  const playNote = useCallback((noteId = 'C4', { duration = 0.5, velocity = 0.7, startTime = null } = {}) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    // IOS-CRITICAL: resume() must be called synchronously before bufferSource.start()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const when = startTime ?? ctx.currentTime;

    // Fundamental oscillator (sine wave, ~piano fundamental)
    const freq = noteNameToHz(noteId); // e.g., C4 = 261.63 Hz
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, when);

    // Second harmonic for piano-like timbre
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, when);

    const gainEnv = ctx.createGain();
    gainEnv.gain.setValueAtTime(0, when);
    gainEnv.gain.linearRampToValueAtTime(velocity, when + 0.005); // 5ms attack
    gainEnv.gain.exponentialRampToValueAtTime(velocity * 0.4, when + 0.08); // 80ms decay
    gainEnv.gain.setValueAtTime(velocity * 0.4, when + duration - 0.05);
    gainEnv.gain.exponentialRampToValueAtTime(0.001, when + duration); // release

    const harmGain = ctx.createGain();
    harmGain.gain.value = 0.4; // Second harmonic at 40% of fundamental

    osc1.connect(gainEnv);
    osc2.connect(harmGain);
    harmGain.connect(gainEnv);
    gainEnv.connect(ctx.destination);

    osc1.start(when);
    osc2.start(when);
    osc1.stop(when + duration + 0.01);
    osc2.stop(when + duration + 0.01);
  }, [audioContextRef]);

  return { playNote };
}
```

**Note name to frequency helper:**
```javascript
const NOTE_FREQS = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
  'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
  'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
};
function noteNameToHz(noteId) { return NOTE_FREQS[noteId] ?? 261.63; }
```

### Pattern 2: RhythmReadingGame FSM

**What:** Game follows the same GAME_PHASES FSM as MetronomeTrainer. New phases for this game:

```javascript
const GAME_PHASES = {
  SETUP: 'setup',
  COUNT_IN: 'count-in',       // 1-bar metronome + visual countdown
  PLAYING: 'playing',          // Cursor sweeps, user taps
  FEEDBACK: 'feedback',        // Brief pause showing tap results
  SESSION_COMPLETE: 'session-complete', // → VictoryScreen
};
```

**Count-in implementation:** Reuse `createCustomMetronomeSound` from MetronomeTrainer. Schedule 4 clicks (or 3 for 3/4) at `tempo`-derived intervals using `audioContext.currentTime`. Visual: `countdownValue` state (3→2→1→GO) with `setInterval` tied to beat duration.

**Cursor position:** CSS `position: absolute; left: ${cursorPct}%` on a glowing vertical div overlaid on the VexFlow SVG container. Update `cursorPct` via `requestAnimationFrame` using `audioContext.currentTime` relative to pattern start time. The cursor sweeps from left edge to right edge over exactly `beatDuration * beatsInMeasure` seconds.

**Tap capture timing:** Use `audioContextRef.current.currentTime` in the `onPointerDown` handler (not `Date.now()`). Compare against scheduled beat times to compute PERFECT/GOOD/MISS using `calculateTimingThresholds(tempo)` (copy from MetronomeTrainer).

**Tap click sound (D-05):** Create a short 800Hz sine burst via oscillator (same technique as `createCustomMetronomeSound`). Duration 15ms, gain 0.25. Schedule at `ctx.currentTime + 0.005`.

**Note color feedback (D-04):** After each tap, update a `tapResults` array `[{noteIdx, quality: 'PERFECT'|'GOOD'|'MISS'}]`. VexFlow SVG note elements must be queried by index and their `fill` attribute set. Use the `notesRef` array pattern from `VexFlowStaffDisplay` — expose note SVG elements via ref.

### Pattern 3: VexFlow Rhythm-Only Rendering

**What:** Render rhythm notation with all notes on `b/4` (middle of treble staff) with stems up. No pitch variation — only duration/rest variation.

**Why b/4:** Standard convention for unpitched rhythm notation on treble staff. All noteheads on the middle line, stems pointing up. Rests render at normal staff positions regardless of pitch.

**Example rendering approach:**
```javascript
// Convert pattern beats to VexFlow notes
// pattern beat: { duration: 4, isRest: false } → StaveNote({ keys: ['b/4'], duration: 'q' })
// pattern beat: { duration: 4, isRest: true  } → StaveNote({ keys: ['b/4'], duration: 'qr' })
// Force stem up for all notes
note.setStemDirection(Stem.UP);
```

**Duration mapping from RhythmPatternGenerator sixteenth-unit system:**
```
WHOLE (16)          → 'w'
HALF (8)            → 'h'
QUARTER (4)         → 'q'
EIGHTH (2)          → '8'
DOTTED_HALF (12)    → 'hd'  (+ Dot.buildAndAttach)
DOTTED_QUARTER (6)  → 'qd'  (+ Dot.buildAndAttach)
DOTTED_EIGHTH (3)   → '8d'  (+ Dot.buildAndAttach)
```

**Reuse vs new component decision (Claude's discretion):** Create a new lightweight `RhythmStaffDisplay.jsx` component rather than extending `VexFlowStaffDisplay`. Reason: `VexFlowStaffDisplay` is tightly coupled to pitch-based patterns with pitch-specific features (key signatures, accidentals, stem-direction-from-pitch). A focused rhythm component avoids this complexity. It will accept `{ notes: [{duration, isRest}], timeSignature }` props.

### Pattern 4: RhythmDictationGame Flow

**What:** Question loop: play audio → show 3 cards → user taps → feedback → next.

**Distractor generation (Claude's discretion — must satisfy RDICT-04):**
- Take the correct pattern's beat array
- For distractor 1: swap one note's duration for the next longer duration (e.g., quarter → half)
- For distractor 2: swap a different note's duration for the next shorter duration (e.g., quarter → eighth)
- Validate both distractors fill the measure exactly (adjust with a rest if needed)
- The result differs by exactly one audible duration element (satisfies RDICT-04)

**Audio playback for dictation:** Schedule beats from `audioContext.currentTime` + offset per beat. Beat offset = beat index × (60 / tempo) seconds. Call `playNote('C4', { startTime: offset })` per beat (D-13).

**Card highlighting (D-09):**
```javascript
// State: { selected: null, revealed: false }
// On tap: set selected, set revealed
// Render: correct card = 'ring-2 ring-green-400 bg-green-500/20'
//         wrong card   = 'opacity-50 ring-1 ring-red-400'
//         selected wrong first: flash red → 1s → show correct green
```

**Auto-advance timing:** `setTimeout(() => nextQuestion(), correct ? 1500 : 2000)` after feedback reveals.

### Pattern 5: Game Component Structural Template

Every game component in this project follows an identical structural checklist. Deviation breaks session timeout, landscape lock, and trail navigation.

```javascript
export function RhythmReadingGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');

  // 1. Trail state from location
  const nodeId              = location.state?.nodeId || null;
  const nodeConfig          = location.state?.nodeConfig || null;
  const trailExerciseIndex  = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType   = location.state?.exerciseType ?? null;

  // 2. Landscape lock (both hooks required)
  useLandscapeLock();
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // 3. Session timeout
  const { pauseTimer, resumeTimer } = useSessionTimeout(); // try/catch pattern from MetronomeTrainer

  // 4. Shared AudioContext (DO NOT create new AudioContext inside)
  const { audioContextRef, isInterrupted, handleTapToResume } = useAudioContext();

  // 5. Piano sampler
  const { playNote } = usePianoSampler();

  // 6. Auto-start guard
  const hasAutoStartedRef = useRef(false);

  // 7. AudioInterruptedOverlay must render
  <AudioInterruptedOverlay
    isVisible={isInterrupted}
    onTapToResume={handleTapToResume}
    onRestartExercise={handleReset}
  />

  // 8. VictoryScreen with all trail fields
  <VictoryScreen
    score={score} totalPossibleScore={totalPossibleScore}
    nodeId={nodeId} exerciseIndex={trailExerciseIndex}
    totalExercises={trailTotalExercises} exerciseType={trailExerciseType}
    onNextExercise={handleNextExercise}
    onReset={handleReset} onExit={handleExit}
  />

  // 9. handleNextExercise switch covers all exercise types
  //    including 'rhythm_tap' and 'rhythm_dictation' routing to new routes
}
```

**CRITICAL constraint:** `AudioContextProvider` is applied at the route level in `App.jsx`. Do not add a second `AudioContextProvider` inside the component.

### Pattern 6: Route Registration

Add to `src/App.jsx` after the `metronome-trainer` route:

```javascript
// New in Phase 8
const RhythmReadingGame = lazyWithRetry(
  () => import('./components/games/rhythm-games/RhythmReadingGame')
);
const RhythmDictationGame = lazyWithRetry(
  () => import('./components/games/rhythm-games/RhythmDictationGame')
);

// In ProtectedRoute JSX:
<Route
  path="/rhythm-mode/rhythm-reading-game"
  element={<AudioContextProvider><RhythmReadingGame /></AudioContextProvider>}
/>
<Route
  path="/rhythm-mode/rhythm-dictation-game"
  element={<AudioContextProvider><RhythmDictationGame /></AudioContextProvider>}
/>
```

Add both paths to `LANDSCAPE_ROUTES` array (currently at line 185-191 in App.jsx).

### Pattern 7: TrailNodeModal Routing Update

Currently `rhythm_tap` and `rhythm_dictation` navigate to `/coming-soon`. Update both cases:

```javascript
case 'rhythm_tap':
  navigate('/rhythm-mode/rhythm-reading-game', { state: navState });
  break;
case 'rhythm_dictation':
  navigate('/rhythm-mode/rhythm-dictation-game', { state: navState });
  break;
```

### Pattern 8: i18n Key Structure

Add new namespace `rhythmReading` and `rhythmDictation` under `games` section in `common.json`. Alternatively use flat keys under `games.rhythmReading.*`. The `common.json` pattern uses nested objects — follow that convention.

**Minimum keys required (both EN + HE):**

```json
{
  "games": {
    "rhythmReading": {
      "title": "Rhythm Reading",
      "countIn": "Get Ready!",
      "countdown3": "3", "countdown2": "2", "countdown1": "1", "countdownGo": "GO!",
      "tapHere": "Tap Here!",
      "perfect": "PERFECT!",
      "good": "GOOD",
      "miss": "MISS",
      "exercise": "Exercise {{current}} of {{total}}"
    },
    "rhythmDictation": {
      "title": "Rhythm Dictation",
      "listenAndPick": "Listen and pick the correct rhythm",
      "replay": "Replay",
      "correct": "Correct!",
      "tryAgain": "Try Again",
      "exercise": "Exercise {{current}} of {{total}}"
    }
  }
}
```

**Existing partial i18n state:** `trail.json` already has `rhythm_tap` and `rhythm_dictation` exercise type names in both EN and HE (confirmed lines 79-80 EN, 79-80 HE). These are the TrailNodeModal labels — no change needed. The new keys above are for in-game UI only.

**Hebrew i18n for new games (INFRA-08):** The Hebrew `common.json` currently has English placeholders for `rhythm_tap` and `rhythm_dictation` exercise types in `trail.json`. For in-game UI, provide natural Hebrew translations. Key examples:
- "Rhythm Reading" → "קריאת קצב"
- "Get Ready!" → "היכונו!"
- "PERFECT!" → "מושלם!"
- "GOOD" → "טוב"
- "MISS" → "פספסת"
- "Replay" → "הפעל שוב"

### Anti-Patterns to Avoid

- **Creating a new AudioContext in game components:** The shared context from `AudioContextProvider` must be used exclusively. Creating a second context triggers Safari's 4-context limit and breaks the iOS interruption recovery system.
- **Using `Date.now()` for tap timing:** All tap timing must use `audioContextRef.current.currentTime`. `Date.now()` drifts relative to audio scheduling and produces incorrect PERFECT/GOOD/MISS judgments.
- **Calling `ctx.resume()` asynchronously before `bufferSource.start()`:** On iOS, `ctx.resume()` must be called synchronously from a user-gesture event handler. Any `await` before the call breaks iOS audio.
- **Importing WAV files through Vite:** Do not `import './note.wav'` — this bundles audio files. Use `fetch('/sounds/...')` at runtime, same pattern as `useAudioEngine.loadPianoSound()`.
- **Adding `AudioContextProvider` inside game component:** Route level wrapping in `App.jsx` is sufficient. A second wrapper creates a nested context that overrides `useAudioContext()` and severs the iOS interruption handler.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rhythm pattern generation | Custom pattern generator | `RhythmPatternGenerator.getPattern()` | Already handles curated + generative patterns, multiple time sigs, difficulty levels |
| Timing threshold calculation | Custom timing windows | `calculateTimingThresholds(tempo)` from MetronomeTrainer (copy to shared utils or each game) | Already handles tempo-scaled PERFECT/GOOD/FAIR/MISS windows with proven values |
| VexFlow staff render | Custom SVG drawing | VexFlow `Stave` + `Voice` + `Formatter` + `Beam.generateBeams` | Hand-drawn SVG will not handle beaming, dotted notes, rests correctly |
| iOS audio interruption recovery | Custom overlay + resume logic | `AudioInterruptedOverlay` + `handleTapToResume` from `AudioContextProvider` | Synchronous resume requirement is non-obvious; existing code handles it correctly |
| Audio scheduling lookahead | setTimeout-based scheduling | `audioContext.currentTime` + pre-scheduled oscillators | setTimeout drift causes audible desync at any tempo above ~60 BPM |
| Post-game XP / star / trail update | Custom XP logic | `VictoryScreen` with `nodeId` + `exerciseIndex` props | VictoryScreen handles all trail state: multi-exercise nodes, XP awards, comeback bonuses |
| Orientation lock | Media query CSS | `useLandscapeLock()` + `useRotatePrompt()` | PWA fullscreen + Android orientation API + iOS prompt — 3 different mechanisms |

---

## Common Pitfalls

### Pitfall 1: iOS AudioContext Silence After Resume

**What goes wrong:** Piano notes are scheduled but produce no sound on iOS Safari.

**Why it happens:** `AudioContext` is in `suspended` or `interrupted` state. `bufferSource.start()` (or `oscillator.start()`) called on a suspended context silently drops the note.

**How to avoid:** In `usePianoSampler.playNote()`, always check `ctx.state` before scheduling and call `ctx.resume()` synchronously if suspended. The `getOrCreateAudioContext()` function in `AudioContextProvider` already does this — call it before scheduling or use it to get the context reference.

**Warning signs:** Silent notes on physical iOS device, especially after a phone call, screen lock, or switching apps.

### Pitfall 2: Cursor Drift from audioContext.currentTime

**What goes wrong:** The scrolling cursor falls out of sync with the audio at fast tempos.

**Why it happens:** Using `Date.now()` or `performance.now()` for cursor position calculation, which drifts from `audioContext.currentTime` over time.

**How to avoid:** Compute cursor position exclusively from `audioContextRef.current.currentTime - patternStartTime`. The `requestAnimationFrame` callback receives a timestamp but cursor position must be derived from audio time, not RAF timestamp.

**Warning signs:** Cursor visually "ahead" or "behind" note highlights, especially at tempos above 100 BPM.

### Pitfall 3: VexFlow Rerender on Every RAF Frame

**What goes wrong:** VexFlow re-renders the full SVG on every animation frame for cursor updates, causing 60fps layout thrashing.

**Why it happens:** Putting cursor position in React state (`useState`) that triggers re-render of the VexFlow container.

**How to avoid:** The cursor is a CSS-positioned overlay div separate from the VexFlow SVG. Update its position via `ref.current.style.left = '${pct}%'` directly in the RAF callback — never via React state. The VexFlow SVG rerenders only when `pattern` or `tapResults` change.

**Warning signs:** Low frame rate during pattern playback, choppy cursor animation.

### Pitfall 4: Distractor Patterns That Break Measure Length

**What goes wrong:** Distractor rhythm patterns don't fill the measure, causing VexFlow to throw a voice timing error.

**Why it happens:** Swapping a note duration without compensating for the difference changes total measure duration.

**How to avoid:** After duration swap, calculate the delta and insert/adjust a rest to compensate. Validate total duration equals `timeSignature.measureLength` (in sixteenth units) before rendering. Use `RhythmPatternGenerator.validateBinaryPattern()` to check.

**Warning signs:** VexFlow console error "Voice does not have the correct number of beats", blank staff in dictation cards.

### Pitfall 5: Double-Start on Trail Auto-Navigate

**What goes wrong:** Game starts twice when navigating from trail, or starts with wrong config.

**Why it happens:** Missing `hasAutoStartedRef` guard, or `useEffect` fires before AudioContext is ready.

**How to avoid:** Follow the exact `hasAutoConfigured.current` pattern from MetronomeTrainer lines 153-199. Check AudioContext state before auto-starting; if `suspended` or `interrupted`, set `needsGestureToStart = true` and show tap-to-start overlay.

**Warning signs:** Two simultaneous count-ins, game starting in SETUP phase immediately transitioning to PLAYING.

### Pitfall 6: i18n RTL Layout for Feedback Text

**What goes wrong:** Floating "PERFECT!" text or button labels are positioned incorrectly in Hebrew RTL mode.

**Why it happens:** Using `left: X%` absolute positioning without accounting for RTL direction; or hardcoded `text-left` instead of logical CSS.

**How to avoid:** Use `start` and `end` logical CSS properties where possible (`text-start`, `ms-auto` etc). For floating text animation, test RTL by switching `i18n.language` to `he` in development. The `AccessibilityContext` provides `isRTL` flag.

---

## Code Examples

### Synthesized Tap Click Sound (D-05)

```javascript
// Source: Adapted from MetronomeTrainer createCustomMetronomeSound pattern
function playTapClick(audioContext) {
  if (!audioContext || audioContext.state !== 'running') return;
  const t = audioContext.currentTime + 0.005;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(t);
  osc.stop(t + 0.02);
}
```

### Timing Threshold Usage

```javascript
// Source: MetronomeTrainer.jsx lines 47-64 (copy or import)
const thresholds = calculateTimingThresholds(tempo); // { PERFECT: ms, GOOD: ms, FAIR: ms }
const tapDelta = Math.abs((tapTime - expectedBeatTime) * 1000); // convert to ms
const quality = tapDelta <= thresholds.PERFECT ? 'PERFECT'
              : tapDelta <= thresholds.GOOD    ? 'GOOD'
              : tapDelta <= thresholds.FAIR    ? 'FAIR'
              : 'MISS';
```

### VexFlow Rhythm-Only Note Creation

```javascript
// Source: Adapted from VexFlowStaffDisplay.jsx patterns
import { StaveNote, Stem, Dot } from 'vexflow';

function rhythmBeatToVexNote(beat) {
  // beat = { durationUnits: 4, isRest: false } from RhythmPatternGenerator
  const durMap = { 16: 'w', 8: 'h', 4: 'q', 2: '8', 1: '16', 12: 'hd', 6: 'qd', 3: '8d' };
  let dur = durMap[beat.durationUnits] || 'q';
  const isDotted = dur.endsWith('d');
  const vfDur = isDotted ? dur.slice(0, -1) : dur; // VexFlow dotted = base dur + manual Dot
  const keys = beat.isRest ? ['b/4'] : ['b/4'];
  const note = new StaveNote({
    keys,
    duration: beat.isRest ? vfDur + 'r' : vfDur,
    stem_direction: Stem.UP,
  });
  if (isDotted) {
    Dot.buildAndAttach([note], { all: true });
  }
  return note;
}
```

### Service Worker Cache Bump

```javascript
// Source: public/sw.js line 4 (current value: pianomaster-v8)
// Change to:
const CACHE_NAME = "pianomaster-v9";
```

### Scheduled Beat Playback (Dictation / Reading Pattern)

```javascript
// Schedule a full pattern for audio-only playback (RDICT-01)
function schedulePattern(pattern, tempo, audioContext, playNote) {
  const beatDuration = 60 / tempo; // seconds per quarter note
  const startTime = audioContext.currentTime + 0.1; // small buffer

  let offset = 0;
  pattern.forEach((beat) => {
    if (!beat.isRest) {
      playNote('C4', { startTime: startTime + offset, duration: beatDuration * 0.8 });
    }
    offset += beatDuration * (beat.durationUnits / 4); // durationUnits are in 16th-note units
  });

  return startTime; // Caller tracks pattern start for cursor sync
}
```

---

## State of the Art

| Old Approach | Current Approach | Status | Impact |
|--------------|------------------|--------|--------|
| Canvas-based rhythm notation (`RhythmNotationRenderer.jsx`) | VexFlow SVG via `VexFlowStaffDisplay` | In transition (MetronomeTrainer still uses canvas renderer) | New games use VexFlow directly — do NOT use canvas renderer |
| Owned AudioContext per game | Shared `AudioContextProvider` at route level | Established pattern (v2.8) | All new games must use `useAudioContext()`, never `new AudioContext()` |
| `Date.now()` for tap timing | `audioContext.currentTime` | Established (MetronomeTrainer) | Mandatory — no exceptions |

**Deprecated/outdated:**
- `RhythmNotationRenderer.jsx`: Canvas-based renderer used only by MetronomeTrainer. New games should not use this component. It is kept for MetronomeTrainer backward compatibility only.

---

## Open Questions

1. **Pattern output format compatibility with VexFlow**
   - What we know: `RhythmPatternGenerator.getPattern()` returns a binary array `[0, 1, 0, 1, ...]` where each position is a sixteenth note and `1` = note onset, `0` = sustain/rest
   - What's unclear: The exact shape of the returned object (does it include duration groups, or raw binary array only?)
   - Recommendation: Inspect the `getPattern()` return value at runtime and write a converter function that collapses runs of 0s into rest durations and runs of 1+0s into note durations. This is Claude's discretion work during implementation.

2. **VexFlow 5.0.0 rhythm-rest rendering position**
   - What we know: Rest positions in VexFlow are auto-determined for pitched staves
   - What's unclear: Whether rests render at correct staff positions when all notes are forced to `b/4`
   - Recommendation: Test quickly at implementation start. If rests render oddly, use `b/5` for rests (standard unpitched rest position) and `b/4` for notes only.

3. **RTL cursor direction for Hebrew**
   - What we know: Hebrew is RTL. The cursor should sweep left-to-right for LTR music notation (standard Western notation is always LTR regardless of UI language)
   - What's unclear: Whether VexFlow renders RTL-aware notation or always LTR
   - Recommendation: Music notation is always LTR. Keep cursor sweep LTR for all languages. This is intentional and musically correct.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | Yes | v22.15.0 | — |
| VexFlow | Notation rendering | Yes | 5.0.0 (in node_modules) | — |
| Web Audio API | usePianoSampler synthesis | Browser built-in | All target browsers | N/A |
| `public/sounds/piano/G4.mp3` | useAudioEngine (existing, unrelated) | Yes | — | — |
| `src/assets/sounds/piano/*.wav` | Phase 9 (ear training) — NOT Phase 8 | Yes (90 WAV files) | — | Not needed for Phase 8 (synthesis used) |

**Missing dependencies with no fallback:** None — phase uses only synthesis + existing infrastructure.

**Note on piano samples:** `src/assets/sounds/piano/` contains 90 WAV files (C1-B8 range). The ARCHITECTURE.md doc described a `public/sounds/piano-samples/` directory with WAV files for `usePianoSampler`. However, D-11 locks synthesis (not samples) as the approach, so no WAV copies to `public/` are needed in Phase 8. Phase 9 may choose to use these WAV files from `src/assets/` for better fidelity ear training notes.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (jsdom) |
| Config file | `vitest.config.js` at project root |
| Setup file | `src/test/setupTests.js` |
| Quick run command | `npx vitest run src/hooks/usePianoSampler.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-06 | usePianoSampler.playNote() calls oscillator.start() with correct frequency | unit | `npx vitest run src/hooks/usePianoSampler.test.js` | ❌ Wave 0 |
| INFRA-06 | playNote() resumes suspended AudioContext before scheduling | unit | same file | ❌ Wave 0 |
| INFRA-07 | Service worker CACHE_NAME equals `pianomaster-v9` | unit | `npx vitest run src/test/sw.test.js` | ❌ Wave 0 (or manual verification) |
| INFRA-08 | EN common.json contains all rhythmReading + rhythmDictation keys | unit | `npx vitest run src/locales/i18n.test.js` | ❌ Wave 0 |
| RTAP-04 | calculateTimingThresholds returns scaled values at 60 BPM vs 120 BPM | unit | `npx vitest run src/hooks/timingThresholds.test.js` | ❌ Wave 0 |
| RDICT-04 | distractor generator produces patterns differing by one duration | unit | `npx vitest run src/components/games/rhythm-games/RhythmDictationGame.test.js` | ❌ Wave 0 |
| RTAP-05, RDICT-06 | VictoryScreen renders with nodeId + exerciseIndex | existing smoke test | `npm run test:run` (no specific file) | existing pattern |

### Sampling Rate

- Per task commit: `npx vitest run src/hooks/usePianoSampler.test.js src/components/games/rhythm-games/`
- Per wave merge: `npm run test:run`
- Phase gate: Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/usePianoSampler.test.js` — covers INFRA-06 (oscillator scheduling, iOS resume guard)
- [ ] `src/components/games/rhythm-games/RhythmDictationGame.test.js` — covers RDICT-04 (distractor algorithm)
- [ ] Optional: `src/locales/i18n.test.js` — verifies required i18n keys exist in both EN + HE

**Web Audio API mocking needed for Wave 0 tests:**
```javascript
// Add to setupTests.js or test file
const mockOscillator = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), type: '', frequency: { setValueAtTime: vi.fn() } };
const mockGain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
const mockAudioContext = {
  state: 'running', currentTime: 0,
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  resume: vi.fn().mockResolvedValue(undefined),
};
```

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — all findings verified against live source files:
  - `src/contexts/AudioContextProvider.jsx` — iOS interruption handling patterns, context sharing model
  - `src/hooks/useAudioEngine.js` — oscillator synthesis technique, lookahead scheduler, piano sound loading
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` — game FSM, auto-start pattern, trail integration, tap timing
  - `src/components/games/rhythm-games/RhythmPatternGenerator.js` — pattern format, time signatures, duration constants
  - `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — VexFlow rendering patterns
  - `src/components/games/shared/AudioInterruptedOverlay.jsx` — iOS overlay interface
  - `src/components/games/VictoryScreen.jsx` — post-game integration props
  - `src/App.jsx` — route structure, AudioContextProvider wrapping, LANDSCAPE_ROUTES
  - `src/components/trail/TrailNodeModal.jsx` — current ComingSoon routing for rhythm_tap/rhythm_dictation
  - `src/locales/en/common.json` + `src/locales/he/common.json` — i18n structure
  - `src/locales/en/trail.json` + `src/locales/he/trail.json` — exercise type label state
  - `src/data/constants.js` — EXERCISE_TYPES, TRAIL_TAB_CONFIGS (Phase 7 complete)
  - `public/sw.js` — current cache version `pianomaster-v8`
  - `public/sounds/` — confirmed: `drum-stick.mp3`, `piano/G4.mp3` exist
  - `src/assets/sounds/piano/` — confirmed: 90 WAV files (A1-G7 chromatic)
  - `.planning/research/ARCHITECTURE.md` — component boundaries, usePianoSampler design
  - `docs/vexflow-notation/vexflow-guidelines.md` — VexFlow patterns
  - `.planning/phases/08-audio-infrastructure-rhythm-games/08-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

- VexFlow 5.0.0 rhythm-rest behavior — inferred from guidelines + existing VexFlowStaffDisplay usage; exact rest position at `b/4` unverified (flagged as Open Question)

### Tertiary (LOW confidence)

- None — no unverified WebSearch findings used

---

## Project Constraints (from CLAUDE.md)

| Constraint | Impact on Phase 8 |
|------------|------------------|
| SVG imports: `import Icon from './icon.svg?react'` | No SVG file imports in this phase; VexFlow renders inline SVG |
| One AudioContext shared via `AudioContextProvider` | `usePianoSampler` must call `useAudioContext()` — do NOT use `new AudioContext()` |
| `audioContext.currentTime` mandatory for timing | Tap capture and cursor position must use audio time |
| Husky pre-commit: ESLint + Prettier on staged files | Run `npm run lint:fix` + `npm run format` before committing |
| `npm run build` runs `validateTrail.mjs` as prebuild | Trail data files not modified in Phase 8 — no risk |
| Vitest test conventions: `*.test.{js,jsx}` siblings or `__tests__/` | New test files follow sibling naming convention |
| Security: auth endpoints never cached in SW | SW bump does not affect auth cache policy |
| COPPA/GDPR-K: no PII in new features | No PII risk in rhythm games or audio synthesis |
| iOS Safari special handling required | `usePianoSampler` must handle `suspended`/`interrupted` states; `AudioInterruptedOverlay` required in both games |

---

## Metadata

**Confidence breakdown:**

- usePianoSampler synthesis: HIGH — oscillator technique directly verified in useAudioEngine.js
- RhythmReadingGame FSM: HIGH — MetronomeTrainer is a complete template; pattern is identical
- VexFlow rhythm rendering: MEDIUM-HIGH — VexFlow guidelines verified, exact rest-at-b/4 behavior is Open Question
- i18n: HIGH — file structure and existing patterns directly inspected
- Distractor algorithm: MEDIUM — logic is straightforward, exact shape of pattern array from getPattern() needs runtime verification
- iOS audio safety: HIGH — AudioContextProvider iOS handling fully documented and verified

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (30 days — stable stack, no fast-moving dependencies in scope)
