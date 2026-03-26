# Phase 1: Introductory Single-Note Game - Research

**Researched:** 2026-03-25
**Domain:** React game component, framer-motion animation, trail system integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Speed card format — notes flash by at a pace, child taps when target note (e.g., middle C) appears
- **D-02:** Speed ramps up — start slow (~2 sec per card), gradually increase speed as the child scores correct taps
- **D-03:** Distractor cards show real notes on the staff (D4, E4, F4, G4 etc.), NOT shapes or symbols
- **D-04:** Session size (total cards, target ratio) — Claude's discretion based on age-appropriate attention span research
- **D-05:** Notes displayed on a treble/bass clef staff — consistent with all other games
- **D-06:** Cards slide in from the right and out to the left (conveyor belt animation)
- **D-07:** Tap anywhere on screen to "catch" the target note — large tap target for 8-year-olds on mobile
- **D-08:** Correct catch: card flashes green + happy sound + combo counter increments
- **D-09:** Wrong tap (tapping on non-target): card flashes red, combo resets, NO lives lost, NO punishment
- **D-10:** Missed target note (didn't tap in time): Claude's discretion based on common game patterns
- **D-11:** Apply to `treble_1_1` (notePool: `['C4']`) AND `bass_1_1` (notePool: `['C4']`)
- **D-12:** Does NOT apply to rhythm first nodes
- **D-13:** REPLACES the current `note_recognition` exercise on these nodes (not added alongside)
- **D-14:** New exercise type added to `EXERCISE_TYPES` in `src/data/constants.js` (e.g., `NOTE_CATCH` or similar)
- **D-15:** New game component (e.g., `NoteSpeedCards.jsx`) in `src/components/games/`
- **D-16:** New case added to `TrailNodeModal.jsx` switch statement for routing
- **D-17:** Must support trail auto-start via `hasAutoStartedRef` pattern
- **D-18:** Must flow into VictoryScreen with trail progress + XP on completion

### Claude's Discretion

- Session card count and target-to-distractor ratio (D-04)
- Missed note behavior — whether to hint, highlight, or silently pass (D-10)
- Speed ramp curve (how aggressive the acceleration is)
- Component naming and file structure within existing game directories

### Deferred Ideas (OUT OF SCOPE)

- Expanding speed card game to rhythm first nodes
- Multiple-choice quiz variant ("Which is middle C?")
- Silly shapes/symbols as distractors
- Adding speed card as a SECOND exercise alongside note_recognition
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-01 | New `NOTE_CATCH` exercise type in `EXERCISE_TYPES` | constants.js pattern confirmed — single line addition |
| REQ-02 | `NoteSpeedCards.jsx` game component | framer-motion AnimatePresence confirmed for conveyor animation; NoteImageDisplay reuse confirmed |
| REQ-03 | TrailNodeModal routing case for `NOTE_CATCH` | Switch statement pattern confirmed; new route at `/notes-master-mode/note-speed-cards` |
| REQ-04 | App.jsx route registration | lazyWithRetry import pattern confirmed |
| REQ-05 | treble_1_1 and bass_1_1 node data updated | Both files read; exercise type swap is a single-field change per node |
| REQ-06 | Trail auto-start via `hasAutoStartedRef` | Pattern fully documented from NotesRecognitionGame.jsx |
| REQ-07 | VictoryScreen integration | VictoryScreen props interface confirmed; same as all other game components |
| REQ-08 | i18n strings in en/he locales | `src/locales/en/common.json` + `src/locales/he/common.json` pattern confirmed |
| REQ-09 | Trail validator passes after node data changes | `scripts/validateTrail.mjs` validates exercise types indirectly via node structure |
</phase_requirements>

---

## Summary

This phase adds a "speed card" game — a new exercise type (`NOTE_CATCH`) to the trail system. Cards showing musical notes on a staff slide across the screen in a conveyor belt pattern; the child taps the screen when the target note (middle C) appears. This replaces the `note_recognition` exercise on the first treble and bass clef nodes, which is trivially easy with a single-note pool.

The implementation follows a well-established pattern that already exists four times in the codebase (NotesRecognitionGame, MemoryGame, SightReadingGame, MetronomeTrainer). The same integration points are used each time: `EXERCISE_TYPES` constant, `TrailNodeModal` switch case, `App.jsx` lazy route, `hasAutoStartedRef` auto-start, and `VictoryScreen` post-game flow. The NoteImageDisplay component already renders note images from a note object — but for this game, notes need to be rendered on a staff (VexFlow or the existing note image assets), which requires a decision on rendering approach.

The primary new technical work is the conveyor animation using framer-motion's `AnimatePresence` + `motion.div` with `x` axis transitions, plus the game loop using `useInterval` or `useRef`-based timing to advance cards and escalate speed.

**Primary recommendation:** Place the new component at `src/components/games/notes-master-games/NoteSpeedCards.jsx`, matching the colocation of all other note-mastery games. Use framer-motion `AnimatePresence` for card slide animation. Use `NoteImageDisplay` for note rendering (existing note image assets). The exercise type key should be `NOTE_CATCH` (constant value: `'note_catch'`).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.23.26 | Card slide animation + feedback flash | Already used throughout the app for game animations |
| React 18 | ^18.3.1 | Component + hooks | App's core framework |
| Tailwind CSS 3 | (project-wide) | Styling | App's styling system |
| i18next | (project-wide) | Translation strings | All user-facing strings must be i18n'd |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useMotionTokens | internal | Reduced-motion-aware spring configs | All animated transitions in this app |
| useSounds | internal | Correct/wrong sound effects | Game audio feedback |
| useSessionTimeout | internal | Pause inactivity timer during gameplay | Required for all game components |
| useLandscapeLock | internal | Android PWA fullscreen + orientation | Required for all game components |
| useRotatePrompt | internal | iOS non-PWA rotate overlay | Required for all game components |

### No New Dependencies Required
All required libraries are already installed. This phase adds only new files using existing infrastructure.

---

## Architecture Patterns

### Recommended File Structure
```
src/components/games/notes-master-games/
├── NoteSpeedCards.jsx          # NEW — the game component
src/data/
├── constants.js                # MODIFY — add NOTE_CATCH to EXERCISE_TYPES
├── units/
│   ├── trebleUnit1Redesigned.js  # MODIFY — treble_1_1 exercise type
│   └── bassUnit1Redesigned.js    # MODIFY — bass_1_1 exercise type
src/components/trail/
└── TrailNodeModal.jsx          # MODIFY — add note_catch routing case
src/App.jsx                     # MODIFY — add lazy route
src/locales/en/common.json      # MODIFY — add noteSpeedCards i18n namespace
src/locales/he/common.json      # MODIFY — add Hebrew translations
```

### Pattern 1: Trail Integration — hasAutoStartedRef Auto-Start

Every trail game component uses this exact pattern. The new component must follow it:

```javascript
// Source: NotesRecognitionGame.jsx lines 505-564
const hasAutoStartedRef = useRef(false);
const nodeId = location.state?.nodeId || null;
const nodeConfig = location.state?.nodeConfig || null;
const trailExerciseIndex = location.state?.exerciseIndex ?? null;
const trailTotalExercises = location.state?.totalExercises ?? null;

// Reset on nodeId change
useEffect(() => {
  hasAutoStartedRef.current = false;
  // reset game state...
}, [nodeId]);

// Auto-start from trail
useEffect(() => {
  if (nodeConfig && !hasAutoStartedRef.current) {
    hasAutoStartedRef.current = true;
    // configure + start game
    setTimeout(() => startGame(), 50);
  }
}, [nodeConfig, nodeId]);
```

### Pattern 2: TrailNodeModal Routing

The switch statement in `TrailNodeModal.jsx` (lines 187-207) must receive a new case:

```javascript
// Source: TrailNodeModal.jsx lines 187-207
case 'note_catch':
  navigate('/notes-master-mode/note-speed-cards', { state: navState });
  break;
```

The `navState` object is constructed above the switch and passed identically to all exercise types — no changes needed to `navState` construction.

### Pattern 3: handleNextExercise for Multi-Exercise Nodes

If the node ever has multiple exercises, the new component needs `handleNextExercise` matching the pattern in NotesRecognitionGame.jsx lines 591-633. For treble_1_1 and bass_1_1 (single exercise each), this is invoked only for completeness. The VictoryScreen's `onNextExercise` prop receives this callback.

### Pattern 4: App.jsx Route Registration

```javascript
// Source: App.jsx lines 66-73 (existing lazy pattern)
const NoteSpeedCards = lazyWithRetry(() =>
  import("./components/games/notes-master-games/NoteSpeedCards")
    .then(m => ({ default: m.NoteSpeedCards }))
);

// In route definitions:
<Route
  path="/notes-master-mode/note-speed-cards"
  element={<NoteSpeedCards />}
/>
```

Note: The existing game routes do NOT wrap NoteSpeedCards in `<AudioContextProvider>` unless microphone input is used. This game has no mic input — the child taps the screen. So no `AudioContextProvider` wrapper needed.

### Pattern 5: framer-motion Conveyor Belt Animation

```javascript
// Slide card in from right, out to left
// Source: framer-motion AnimatePresence pattern used in NotesRecognitionGame.jsx (motion.div)
<AnimatePresence mode="wait">
  <motion.div
    key={currentCard.id}                // unique key forces re-mount per card
    initial={{ x: '100%', opacity: 0 }}
    animate={{ x: '0%', opacity: 1 }}
    exit={{ x: '-100%', opacity: 0 }}
    transition={soft}                   // from useMotionTokens
  >
    {/* note image on staff */}
  </motion.div>
</AnimatePresence>
```

For the feedback flash (green/red), overlay a `motion.div` with `backgroundColor` animation on top of the card, keyed by tap result, with a short duration.

### Pattern 6: VictoryScreen Integration

```javascript
// Source: VictoryScreen.jsx lines 14-30
<VictoryScreen
  score={correctCatches}
  totalPossibleScore={totalTargetCards}
  onReset={handleReset}
  onExit={() => navigate('/trail')}
  nodeId={nodeId}
  exerciseIndex={trailExerciseIndex}
  totalExercises={trailTotalExercises}
  exerciseType="note_catch"
  onNextExercise={handleNextExercise}
/>
```

VictoryScreen handles all XP award, star calculation, trail progress update, and "Next Exercise" / "Back to Trail" button logic internally via `useVictoryState`.

### Pattern 7: getExerciseTypeName in TrailNodeModal

`TrailNodeModal.jsx` also calls `getExerciseTypeName(type, t)` (lines 24-38) to display the exercise name in the exercise list. A new case must be added:

```javascript
case 'note_catch':
  return t('trail:exerciseTypes.note_catch');
```

And the translation key `exerciseTypes.note_catch` must be added to `src/locales/en/trail.json` and `src/locales/he/trail.json`.

### Anti-Patterns to Avoid

- **AudioContextProvider wrapper on route:** This game has no mic input. Don't wrap in `<AudioContextProvider>` (unlike NotesRecognitionGame and SightReadingGame).
- **Hand-rolling animation timers with setInterval inside component body:** Use `useRef` for the interval ID so it can be cleared on unmount. Do not use `setInterval` in an effect without proper cleanup.
- **Stale closure in game loop:** The card timer callback will capture stale state if it reads React state directly. Use refs (e.g., `isGameActiveRef`, `currentCardRef`) inside interval callbacks, mirroring the `comboRef`, `livesRef` pattern in NotesRecognitionGame.
- **Blocking tap handler:** The entire screen is the tap target (D-07). Do not restrict tap to only the card area — this frustrates children on small screens.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card slide animation | CSS transitions or custom JS animator | framer-motion `AnimatePresence` + `motion.div` | Already used app-wide; handles exit animations correctly with `mode="wait"` |
| Reduced-motion compliance | Manual `prefers-reduced-motion` media query | `useMotionTokens()` | App-standard hook returns zero-duration tokens when reduced motion is enabled |
| Sound effects | New Audio() instances inline | `useSounds()` hook | Handles path resolution, cleanup, and mutual-stop logic |
| Session inactivity | Custom timer | `useSessionTimeout()` hook | Required for child safety; games must call `pauseTimer()` / `resumeTimer()` |
| Landscape handling | Custom orientation API | `useLandscapeLock()` + `useRotatePrompt()` | Already handles Android PWA fullscreen and iOS rotate overlay |
| Trail progress + XP | Custom DB write | `VictoryScreen` + `useVictoryState` | Handles `updateExerciseProgress`, star calculation, comeback multiplier, accessory unlocks |

---

## Session Design (Claude's Discretion — D-04, D-10)

### Recommended Session Parameters

**Card count:** 20 total cards per session. At age 8, attention spans support 2-4 minutes of focused activity. At the initial 2-second pace with 20 cards, the session takes ~40 seconds (pure pace), growing shorter as speed ramps. With feedback delays, total session time is 90-120 seconds, appropriate for a first-node discovery exercise.

**Target-to-distractor ratio:** 1:3 (5 target notes, 15 distractors). With only one known note (middle C), the child needs enough distractor cards to feel the discrimination challenge without being overwhelmed. A ratio of 1:3 is standard in attention-based children's games (similar to Duolingo tapping exercises). The 5 targets ensure sufficient correct-tap opportunities to achieve 3 stars.

**Distractor pool for treble_1_1:** D4, E4, F4, G4, A4 — the 5 notes immediately above C4 on the treble staff. These are visually distinct from middle C (different staff position) without being too far away. For bass_1_1 (C4 on bass clef): B3, A3, G3, F3, E3.

**Speed ramp curve:**
- Cards 1-5: 2000ms interval (learning pace)
- Cards 6-10: 1500ms interval (warming up)
- Cards 11-15: 1200ms interval (challenge)
- Cards 16-20: 1000ms interval (fast!)
- Each correct catch reduces next interval by 100ms (floor: 700ms) — rewards accuracy with speed increase

**Missed target behavior (D-10):** After the target card exits the screen without a tap, briefly show a small "missed!" banner (200ms flash) in the card zone — not a red flash on the background (which would feel punishing), but a neutral visual cue like the card exit animation ending with a brief amber outline. No lives lost, no combo reset for a miss. This gives learning feedback without punishment, matching the "no punishment philosophy" in the CONTEXT.md specifics.

### Star Threshold

| Stars | Condition |
|-------|-----------|
| 1 star | Caught 60%+ of target notes (3/5) |
| 2 stars | Caught 80%+ of target notes (4/5) |
| 3 stars | Caught 100% of target notes (5/5) AND no wrong taps |

This mirrors the app-wide 60/80/95% thresholds but is adapted for a binary catch-or-miss mechanic. The `score` passed to VictoryScreen should be `(correctCatches * 20)` (percentage as 0-100) to match the scoring convention in other games.

---

## Common Pitfalls

### Pitfall 1: Card Timing With React State
**What goes wrong:** Using `useState` for `currentCardIndex` inside a `setInterval` callback reads stale state, causing the wrong card to display or the interval to use old timing.
**Why it happens:** `setInterval` closures capture the value of variables at the time of creation, not at call time.
**How to avoid:** Use `useRef` for any value read inside an interval callback. Use the functional form of `setState` (e.g., `setIndex(prev => prev + 1)`) to avoid stale reads. See the `comboRef` + `setCombo` double-tracking pattern in NotesRecognitionGame.jsx lines 668-670.
**Warning signs:** The same card appears twice, or the interval fires at wrong speed.

### Pitfall 2: AnimatePresence mode="wait" vs "sync"
**What goes wrong:** Without `mode="wait"`, the enter and exit animations overlap, causing both the incoming and outgoing card to be visible simultaneously. This looks broken on a conveyor belt.
**Why it happens:** Default `AnimatePresence` mode allows concurrent entry/exit.
**How to avoid:** Use `mode="wait"` so the exit animation completes before the enter animation starts. This adds ~100ms visual pause between cards, which is acceptable for this age group.
**Warning signs:** Two card images visible at the same time.

### Pitfall 3: Trail Validation Failure After Node Data Change
**What goes wrong:** `npm run build` fails with "trail validation error" after modifying node exercise types.
**Why it happens:** `scripts/validateTrail.mjs` runs as a prebuild hook and validates all node data. If the exercise type string doesn't match an expected value, or if a prerequisite chain is broken, the build fails.
**How to avoid:** After updating `EXERCISE_TYPES` in `constants.js`, update the node data files. Run `npm run verify:trail` before committing. The validator checks for broken prerequisites and duplicate IDs but does NOT check exercise type values against `EXERCISE_TYPES` enum (types are freeform strings in the validator). So the risk is only a broken import, not a validation rule failure.
**Warning signs:** Build exits with code 1 and "ERROR:" lines from validateTrail.

### Pitfall 4: getExerciseTypeName Missing Case
**What goes wrong:** TrailNodeModal renders the exercise list with `undefined` as the display name for the `note_catch` exercise type, or throws a translation key miss.
**Why it happens:** `getExerciseTypeName()` in `TrailNodeModal.jsx` (lines 24-38) is a switch with explicit cases — new types must be added manually.
**How to avoid:** Add `case 'note_catch':` to `getExerciseTypeName` AND add `exerciseTypes.note_catch` to both `en/trail.json` and `he/trail.json`.
**Warning signs:** Exercise list shows the raw string `"note_catch"` instead of a human-readable name.

### Pitfall 5: NoteImageDisplay Expects a Note Object, Not a Pitch String
**What goes wrong:** Passing `'C4'` (a pitch string) to `NoteImageDisplay` renders nothing or throws.
**Why it happens:** `NoteImageDisplay` expects a note object with `{ ImageComponent, note, englishName, pitch, __clef }` shape, not a raw pitch string.
**How to avoid:** Use the same note lookup as NotesRecognitionGame — build a note object from the `TREBLE_NOTES` / `BASS_NOTES` arrays imported from `sight-reading-game/constants/gameSettings`. Alternatively, use VexFlow to render notes on a staff (more complex). The simplest path is to reuse the note image assets via note object lookup.
**Warning signs:** Blank card area where the note should appear.

### Pitfall 6: Missing Route Registration
**What goes wrong:** Navigating to `/notes-master-mode/note-speed-cards` shows the "Not Found" page.
**Why it happens:** App.jsx must have both the lazy import AND the `<Route>` element.
**How to avoid:** Add BOTH the `lazyWithRetry` import AND the `<Route path="/notes-master-mode/note-speed-cards">` inside the protected routes block (lines 310-338 area).

### Pitfall 7: No AudioContextProvider but Session Timeout Still Required
**What goes wrong:** Session inactivity timer fires during gameplay, logging the child out.
**Why it happens:** Games must call `useSessionTimeout().pauseTimer()` during active play and `resumeTimer()` on completion. This is separate from `AudioContextProvider`.
**How to avoid:** Follow the same `pauseTimer` / `resumeTimer` pattern from NotesRecognitionGame.jsx lines 483-503. The `useSessionTimeout()` call is wrapped in a try/catch because the component may not always be inside a `SessionTimeoutContext`.

---

## Code Examples

### Game Loop Timing (Ref-Based to Avoid Stale Closure)
```javascript
// Source: NotesRecognitionGame.jsx stale-closure pattern (refs for interval-read values)
const isGameActiveRef = useRef(false);
const currentSpeedRef = useRef(2000);

useEffect(() => {
  if (!isGameActive) {
    isGameActiveRef.current = false;
    return;
  }
  isGameActiveRef.current = true;

  const advance = () => {
    if (!isGameActiveRef.current) return;
    setCurrentCardIndex(prev => prev + 1);
  };

  const id = setTimeout(advance, currentSpeedRef.current);
  return () => clearTimeout(id);
}, [currentCardIndex, isGameActive]); // re-runs after each card advance
```

### Feedback Flash Animation
```javascript
// Source: framer-motion pattern + useMotionTokens
const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'wrong' | null

const handleTap = useCallback(() => {
  const isTarget = currentCard.isTarget;
  setFeedbackState(isTarget ? 'correct' : 'wrong');
  setTimeout(() => setFeedbackState(null), 300);
  if (isTarget) {
    playCorrectSound();
    setCombo(c => c + 1);
  } else {
    playWrongSound();
    setCombo(0);
  }
}, [currentCard]);

// In JSX:
<AnimatePresence>
  {feedbackState && (
    <motion.div
      key={feedbackState + feedbackKey}
      className={`absolute inset-0 rounded-3xl ${
        feedbackState === 'correct' ? 'bg-green-400/40' : 'bg-red-400/40'
      }`}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    />
  )}
</AnimatePresence>
```

### Note Object Lookup for NoteImageDisplay
```javascript
// Source: NotesRecognitionGame.jsx lines 35-36
import { TREBLE_NOTES, BASS_NOTES } from '../sight-reading-game/constants/gameSettings';

// In component:
const noteObjects = clef === 'bass' ? BASS_NOTES : TREBLE_NOTES;
const noteObj = noteObjects.find(n => n.pitch === pitchString);
// then: <NoteImageDisplay note={{ ...noteObj, __clef: clef }} />
```

---

## Integration Checklist (Critical Path)

These are the exact files that must be modified or created, in dependency order:

1. `src/data/constants.js` — add `NOTE_CATCH: 'note_catch'` to `EXERCISE_TYPES`
2. `src/components/games/notes-master-games/NoteSpeedCards.jsx` — new game component
3. `src/App.jsx` — add lazy import + route
4. `src/components/trail/TrailNodeModal.jsx` — add `case 'note_catch'` in routing switch AND in `getExerciseTypeName`
5. `src/data/units/trebleUnit1Redesigned.js` — change `treble_1_1` exercise type from `NOTE_RECOGNITION` to `NOTE_CATCH`, update config
6. `src/data/units/bassUnit1Redesigned.js` — change `bass_1_1` exercise type from `NOTE_RECOGNITION` to `NOTE_CATCH`, update config
7. `src/locales/en/trail.json` — add `exerciseTypes.note_catch: "Speed Cards"`
8. `src/locales/he/trail.json` — add Hebrew translation

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase adds React components using existing installed libraries only)

---

## Validation Architecture

`workflow.nyquist_validation` key is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already installed) |
| Config file | `vite.config.js` (Vitest uses Vite config) |
| Quick run command | `npx vitest run src/components/games/notes-master-games/` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | `EXERCISE_TYPES.NOTE_CATCH` exported correctly | unit | `npx vitest run src/data/` | ❌ Wave 0 |
| REQ-02 | Card sequence generation (correct target/distractor ratio) | unit | `npx vitest run src/components/games/notes-master-games/NoteSpeedCards.test.js` | ❌ Wave 0 |
| REQ-02 | Speed ramp curve returns correct intervals per card index | unit | same file | ❌ Wave 0 |
| REQ-02 | Score calculation (correctCatches → percentage → stars) | unit | same file | ❌ Wave 0 |
| REQ-05 | treble_1_1 and bass_1_1 exercise type is 'note_catch' | unit | `npx vitest run src/data/` | ❌ Wave 0 |
| REQ-08 | i18n keys exist in en locale | manual | `npm run build` (no missing key errors) | N/A |
| REQ-09 | Trail validator passes | integration | `npm run verify:trail` | N/A (existing script) |

### Sampling Rate
- **Per task commit:** `npm run verify:trail`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** `npm run build` (runs trail validator as prebuild) + `npm run test:run` green

### Wave 0 Gaps
- [ ] `src/components/games/notes-master-games/NoteSpeedCards.test.js` — covers REQ-02 (card generation, speed ramp, score calc)
- [ ] `src/data/constants.test.js` — covers REQ-01, REQ-05 (or inline in NoteSpeedCards.test.js)

---

## Sources

### Primary (HIGH confidence)
- Direct code reading of `NotesRecognitionGame.jsx` — auto-start pattern, combo/lives mechanics, stale closure avoidance
- Direct code reading of `TrailNodeModal.jsx` — routing switch, `getExerciseTypeName`, nav state construction
- Direct code reading of `App.jsx` — lazy import pattern, route registration, AudioContextProvider usage
- Direct code reading of `VictoryScreen.jsx` — props interface
- Direct code reading of `src/data/constants.js` — `EXERCISE_TYPES` structure
- Direct code reading of `trebleUnit1Redesigned.js`, `bassUnit1Redesigned.js` — node data structure
- Direct code reading of `useMotionTokens.js` — animation token API
- Direct code reading of `useSounds.js` — sound hook API

### Secondary (MEDIUM confidence)
- framer-motion v12 AnimatePresence `mode="wait"` behavior — confirmed by reading existing usage in NotesRecognitionGame.jsx; framer-motion API is consistent across v10-v12 for this feature
- Age-appropriate session length (2-3 min, ~20 cards) — based on children's cognitive load research (common knowledge in educational game design)

### Tertiary (LOW confidence)
- Target-to-distractor ratio 1:3 — informed by Duolingo-style mechanics reference in CONTEXT.md; no specific source verified beyond general children's game design practice

---

## Metadata

**Confidence breakdown:**
- Integration pattern: HIGH — all integration points read directly from source code
- Animation approach: HIGH — framer-motion already used in the app; pattern is well-established
- Session design (card count, ratio, speed curve): MEDIUM — derived from educational principles and the CONTEXT.md intent; specific numbers are Claude's discretion items that can be tuned post-implementation
- i18n key locations: HIGH — locale file structure confirmed

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable codebase; risk of staleness is low for internal patterns)
