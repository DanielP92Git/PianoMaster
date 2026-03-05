# Phase 19: Notes Recognition Engagement - Research

**Researched:** 2026-03-05
**Domain:** React game mechanics — combo counter, lives system, speed bonus, on-fire animation, session-scoped note pool growth
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Combo Counter & Multiplier**
- Prominent animated counter displayed during play — central to the game feel
- Display: streak count (e.g., "x7") with a small multiplier badge (e.g., "2x") when a tier is active
- On wrong answer: counter shakes briefly, resets to 0 — quick feedback, get back to building immediately
- Combo counter visible at all times during gameplay (not only at end)

**Speed Bonus**
- Fixed 3-second threshold — answering correctly within 3s triggers speed bonus
- Visual indicator shown briefly when speed bonus triggers (e.g., "FAST!" flash)
- Threshold does not adapt per node — same 3s everywhere for consistency

**Lives System**
- 3 heart icons displayed in the HUD area
- Lives always active — both trail mode and free practice
- No invincibility window — every wrong answer costs a life immediately
- No earn-back — 3 lives is the budget for the session, no restoration
- Game ends when all 3 hearts are lost OR the question limit is reached, whichever comes first
- Works alongside the existing timed mode and question limit — three possible end conditions: lives, question limit, timer
- Game-over tone: encouraging — "Great try! You got X right!" focusing on what they achieved
- Uses existing GameOverScreen with a lives-specific encouraging message

**On-Fire Mode**
- Activates after 5 consecutive correct answers
- Subtle warm glow — background shifts slightly warmer, gentle particle drift. Noticeable but not distracting
- Visual only — no gameplay bonus
- Persists until a wrong answer
- On break: flame-out animation (~500ms) as fire fades away
- Sound cue: brief whoosh/chime sound when fire mode activates
- Reduced motion: static warm glow border + "ON FIRE" text badge (no particles)
- Respects existing AccessibilityContext reducedMotion setting

**Auto-Grow Note Pool**
- Trail mode only — free practice uses whatever notes the student configured
- After every 5 correct answers in a streak, 1 note silently added to the session pool
- Consistent cadence — always every 5 streak, no acceleration
- New notes follow trail pedagogy — next note from the next trail node's pool
- In-game banner notification (not system toast) — brief banner across the game area
- Session-scoped only — pool resets when game restarts
- New notes also appear as answer button options when added

### Claude's Discretion
- Multiplier tier thresholds and exact multiplier values (design for 8-year-old comprehension)
- Base score per correct answer with multiplier applied
- Auto-grow note pool cap (how many extra notes max per session)
- Combo counter animation style and positioning within the glass-morphism HUD
- Speed bonus visual indicator design
- Heart icon animation on life loss (shatter/fade)
- Fire mode whoosh/chime sound implementation
- How score is reported to VictoryScreen (whether combo/speed bonuses are broken down or just shown as total)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-01 | Notes Recognition shows combo/streak counter with multiplier | State management pattern: local `useRef` for combo count avoids stale closures in `handleAnswerSelect`; `useState` for display; Framer Motion `AnimatePresence` for counter pop/shake |
| GAME-02 | Student earns speed bonus for answering within 3 seconds | `performance.now()` timestamping at question display; diff in `handleAnswerSelect`; `useRef` to avoid stale closure; brief AnimatePresence overlay |
| GAME-03 | Notes Recognition uses lives system (3 lives instead of just scoring 0) | Lives as `useState(3)` + `useRef`; decrement on wrong answer; add `livesRemaining <= 0` to `handleGameOver` conditions; GameOverScreen gets `reason="lives"` prop |
| GAME-04 | Visual "on fire" mode activates after 5 correct answers in a row | Boolean `isOnFire` state driven by `comboCount >= ON_FIRE_THRESHOLD`; CSS warm radial gradient + framer-motion particle drift; reducedMotion path uses static border + badge |
| GAME-05 | Note pool auto-grows by 1 note after 5 correct answers in a streak | `sessionExtraNotes` state (array); `getNextPedagogicalNote()` util reads next trail node's `noteConfig.notePool`; `availableNotes` memo extends base pool with extras; banner via `AnimatePresence` |
</phase_requirements>

---

## Summary

Phase 19 transforms NotesRecognitionGame from a plain drill into an arcade-feel experience. All five features are pure React-layer additions — no backend changes, no new database tables, no new routes. Every integration point has been confirmed in the source.

The game's core answer flow lives in `handleAnswerSelect` (line 1462 in NotesRecognitionGame.jsx). All five features hook into this single callback. The key constraint is that this callback reads from `useRef` values (`currentNoteRef`, `totalQuestionsRef`) to avoid stale closures in the mic detection chain — new refs for `comboRef`, `livesRef`, `questionStartTimeRef`, and `sessionExtraNotesRef` must follow the same ref-plus-state pattern.

The auto-grow note pool (GAME-05) is the most architecturally significant feature because it requires expanding two parallel data structures: the question pool (used by `getRandomNote`) and the answer button pool (used by `availableNotes` memo). Both must react to the same `sessionExtraNotes` state. This is manageable but requires careful `useMemo` dependency tracking.

**Primary recommendation:** Add a single `useEngagement` hook to NotesRecognitionGame.jsx (co-located, not extracted to features/) that encapsulates combo, lives, speed timing, on-fire state, and session pool management — keeping all engagement logic testable and isolated from the existing game flow.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | Already installed | Combo counter pop/shake, on-fire particles, speed bonus flash, banner slide-in | Already used extensively in NotesRecognitionGame for button animations and feedback |
| React useState/useRef | React 18 | Combo count, lives count, on-fire state, session note pool, question start time | The ref-plus-state pattern is already the established pattern in this file |
| CSS/Tailwind | Already installed | Warm glow backgrounds, heart icons, fire border | The glassmorphism system is already defined |
| AccessibilityContext | Existing | reducedMotion gating for particles | Already consumed in this component via `useMotionTokens()` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Already installed | Heart icon (Heart or HeartCrack) | Lives display — already used in HUD (Coins, Clock3) |
| react-hot-toast | Already installed | NOT for in-game banner | Explicitly excluded per CONTEXT.md |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS radial gradient for fire glow | A canvas-based particle system | Canvas would be overkill and hard to reduce-motion-gate; CSS + Framer Motion particles are simpler and already proven in the codebase |
| `useRef` for combo tracking | Context or Redux | Context would cause re-renders in all consumers; refs in the existing pattern already prevent stale-closure issues in the mic chain |

**Installation:**
```bash
# No new packages needed — all dependencies already installed
```

---

## Architecture Patterns

### Recommended Project Structure

No new files or directories required. All additions are within:

```
src/
├── components/games/notes-master-games/
│   └── NotesRecognitionGame.jsx    # All engagement additions here (co-located)
└── components/games/
    └── GameOverScreen.jsx           # Add lives-specific message (prop-driven)
```

Optional: if on-fire particles grow complex, extract to:
```
src/
└── components/games/notes-master-games/
    └── FireParticles.jsx            # Extracted particle component (optional)
```

### Pattern 1: Ref-Plus-State for Engagement State

**What:** Use `useRef` as the source of truth for values read inside `handleAnswerSelect` (which closes over stale values via the mic callback chain). Mirror to `useState` for React rendering.

**When to use:** Any value that `handleAnswerSelect` or `handleMicNoteEvent` needs to read synchronously without stale-closure risk.

**Example (combo tracking):**
```javascript
// Source: established pattern in NotesRecognitionGame.jsx (currentNoteRef, totalQuestionsRef)
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);

// In handleAnswerSelect:
if (isCorrect) {
  comboRef.current += 1;
  setCombo(comboRef.current);
} else {
  comboRef.current = 0;
  setCombo(0);
}
```

### Pattern 2: Question Start Time Ref for Speed Bonus

**What:** Record `performance.now()` when a new question renders, compare in `handleAnswerSelect` to check the 3-second threshold.

**When to use:** Timer comparisons inside callbacks that close over stale state.

```javascript
// Source: established timing pattern in this codebase (micTiming, useTimingAnalysis)
const questionStartTimeRef = useRef(null);

// When new note appears (useEffect watching progress.currentNote):
useEffect(() => {
  questionStartTimeRef.current = performance.now();
}, [progress.currentNote]);

// In handleAnswerSelect — read ref, not state:
const elapsedMs = performance.now() - (questionStartTimeRef.current ?? performance.now());
const isSpeedBonus = isCorrect && elapsedMs <= 3000;
```

### Pattern 3: Session Extra Notes State

**What:** `useState([])` holds the extra notes added mid-session. The existing `availableNotes` useMemo and `getRandomNote` callback are extended to include these extras.

**When to use:** Any session-scoped pool expansion that must reset on `startGame`.

```javascript
// sessionExtraNotes: array of note objects (same shape as trebleNotes/bassNotes entries)
const [sessionExtraNotes, setSessionExtraNotes] = useState([]);
const sessionExtraNotesRef = useRef([]);

// In startGame(): reset both
setSessionExtraNotes([]);
sessionExtraNotesRef.current = [];

// availableNotes useMemo: add sessionExtraNotes to the pool
const availableNotes = useMemo(() => {
  // ... existing logic to build uniqueNotes ...
  const combined = [...uniqueNotes];
  for (const extra of sessionExtraNotes) {
    if (!combined.some(n => n.note === extra.note)) {
      combined.push(extra);
    }
  }
  return combined;
}, [settings.clef, settings.enableFlats, settings.enableSharps, normalizedSelectedNotes, sessionExtraNotes]);
```

### Pattern 4: Next Pedagogical Note Lookup

**What:** Pure function that, given a `nodeId` and the current `sessionExtraNotes`, finds the next note in the same trail path that the student has not yet encountered.

**When to use:** GAME-05 auto-grow, trail mode only (guarded by `nodeId !== null`).

```javascript
// Source: getNodeById from src/data/skillTrail.js (already imported)
const getNextPedagogicalNote = (nodeId, currentPool, extraNotes) => {
  if (!nodeId) return null;

  const currentNode = getNodeById(nodeId);
  if (!currentNode) return null;

  // Find the next node in the same category with a higher order
  const nextNode = SKILL_NODES
    .filter(n => n.category === currentNode.category && n.order > currentNode.order)
    .sort((a, b) => a.order - b.order)
    [0];

  if (!nextNode || !nextNode.noteConfig?.notePool) return null;

  const alreadyKnown = new Set([...currentPool, ...extraNotes.map(n => n.pitch || n.englishName)]);

  const candidatePitch = nextNode.noteConfig.notePool.find(p => !alreadyKnown.has(p));
  if (!candidatePitch) return null;

  // Find the note object from trebleNotes/bassNotes that matches this pitch
  const allNotes = currentNode.category === 'treble_clef' ? trebleNotes : bassNotes;
  return allNotes.find(n => n.pitch === candidatePitch || n.englishName === candidatePitch) ?? null;
};
```

**Key insight:** `SKILL_NODES` is already imported via `getNodeById` in this file. Need to also import `SKILL_NODES` directly, or export a helper from `skillTrail.js`.

### Pattern 5: On-Fire Visual (CSS + Framer Motion)

**What:** Overlay radial gradient on the game background when `isOnFire === true`. Particle drift as floating SVG embers positioned absolutely, animated with `framer-motion`.

**Reduced motion path:** When `reduce === true` (from `useMotionTokens()`), replace particles with a static amber ring around the note card + "ON FIRE" text badge.

```javascript
// Warm glow overlay — added inside the game container
{isOnFire && (
  <motion.div
    className="pointer-events-none absolute inset-0 rounded-inherit"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      background: 'radial-gradient(ellipse at center, rgba(251,146,60,0.12) 0%, transparent 70%)'
    }}
  />
)}
```

### Anti-Patterns to Avoid

- **Reading combo count inside mic callback from useState:** The mic callback chain creates stale closures. Always read from `comboRef.current`, not the `combo` state variable.
- **Calling setSessionExtraNotes inside handleAnswerSelect directly:** This triggers re-render during the answer feedback phase and can fight the 800ms timeout that advances to the next note. Defer via `setTimeout` after the feedback delay, or use a ref and sync to state after the transition.
- **Adding `sessionExtraNotes` as a dep of `getRandomNote`:** `getRandomNote` is a `useCallback` used in `handleAnswerSelect`. Adding `sessionExtraNotes` as a dep will cause the callback to re-create on every pool grow, which is fine for correctness but must be verified not to cause issues with the mic callback chain (which holds `handleAnswerSelect` in a closure). Use `sessionExtraNotesRef` instead.
- **Giving `isOnFire` visual to the wrong layer:** The fire glow goes on the game container background, not on the note card. The note card must remain white/readable for the student.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shake animation on combo break | Custom CSS keyframe | `framer-motion animate={{ x: [0, -6, 6, -4, 4, 0] }}` | Already used in `renderNoteButton` for wrong answer shake — exact same pattern |
| Pop animation on combo increment | Custom CSS | `framer-motion animate={{ scale: [1, 1.18, 1] }}` | Same pattern as the green correct button pop |
| Particle system for fire | Canvas or requestAnimationFrame loop | `framer-motion` with `AnimatePresence` + `motion.div` elements | `Firework.jsx` already does rAF particles; framer-motion is simpler and already installed |
| Sound loading for fire whoosh | New audio system | Extend `useSounds` hook — add `fireWhoosh` ref alongside existing refs | useSounds already has a path-array retry pattern and cleanup |
| Timer for speed bonus | `setInterval` or `Date.now()` | `performance.now()` stored in `useRef` | High-resolution, no drift, already the pattern used by `micTiming` in this file |
| Toasting "New note unlocked" | `react-hot-toast` | Custom `AnimatePresence` banner in game area | CONTEXT.md explicitly excludes react-hot-toast for in-game banner |

**Key insight:** Every animation primitive needed is already instantiated in this file. The combo counter shake uses the same keyframe as the wrong-answer button shake (line 1292). The speed bonus pop uses the same motion as the correct button pop (line 1295).

---

## Common Pitfalls

### Pitfall 1: Stale Combo Count in Mic Callback
**What goes wrong:** `comboRef` is 0 at the time the mic callback closes over `handleAnswerSelect`, so every mic-triggered answer resets a streak even when the student is correct.
**Why it happens:** `handleMicNoteEvent` → `handleAnswerSelect` — the callback chain holds the version of `handleAnswerSelect` from the render when the mic started listening.
**How to avoid:** Store combo in `comboRef.current`, read from ref inside `handleAnswerSelect`, set state only for display.
**Warning signs:** Combo counter resets on every mic-detected correct answer but not on button-click correct answers.

### Pitfall 2: Lives Deduction Racing with Feedback Timeout
**What goes wrong:** Wrong answer triggers: (1) life deduction, (2) answerFeedback highlight, (3) 800ms timeout to advance note. If lives reach 0 and game-over fires before the 800ms completes, the UI briefly shows the next note.
**Why it happens:** The game-over check in `useEffect` watching `progress.totalQuestions` fires after `handleAnswer` updates state, but the note advance `setTimeout` is also running.
**How to avoid:** Check `livesRef.current <= 0` at the top of the 800ms callback (same way `isGameEndingRef.current` is already checked at line 1501). Also call `isGameEndingRef.current = true` immediately when lives reach 0.
**Warning signs:** A note briefly flashes after the game-over screen starts rendering.

### Pitfall 3: sessionExtraNotes Dependency in getRandomNote
**What goes wrong:** `getRandomNote` is a `useCallback` that currently depends on `normalizedSelectedNotes`, `settings.clef`, etc. If `sessionExtraNotes` is added as a React state dep, the callback recreates on pool growth and the mic callback chain holds the old version.
**Why it happens:** `handleMicNoteEvent` closes over `handleAnswerSelect` which closes over `getRandomNote`.
**How to avoid:** Use `sessionExtraNotesRef` inside `getRandomNote` — read `sessionExtraNotesRef.current` to include extras without adding state as dep. Mirror state with `setSessionExtraNotes` only for `availableNotes` memo (which IS a useMemo and fine to depend on state).
**Warning signs:** After a note is added to the pool, it never appears in subsequent questions when playing via mic.

### Pitfall 4: On-Fire Sound Conflicting with Correct/Wrong Sounds
**What goes wrong:** `useSounds` pauses all other sounds before playing any sound. Fire whoosh plays after a correct answer — the correct sound (piano note) gets stopped immediately.
**Why it happens:** `playCorrectSound` pauses wrongSound, victorySound, etc. If `playFireWhoosh` is added with the same pattern, it pauses correctSound.
**How to avoid:** Fire whoosh must NOT stop the piano note. Either play it at lower volume after a delay (100ms), or use a separate Web Audio API node that doesn't interfere with the `new Audio()` instances in `useSounds`.
**Warning signs:** Piano note cuts off immediately when on-fire activates.

### Pitfall 5: Auto-Grow Banner Layout Shift
**What goes wrong:** "New note unlocked!" banner appears and pushes game layout down, causing answer buttons to jump.
**Why it happens:** If the banner is in document flow (not absolutely positioned), it adds height to the container.
**How to avoid:** Position the banner as `absolute top-0 left-0 right-0` inside the game area container with `z-50`, so it overlays without affecting layout. Use `AnimatePresence` with `y: -40` initial to slide down from top.

### Pitfall 6: Multiplier Displayed During Single-Correct (Tier 0)
**What goes wrong:** A "1x" multiplier badge showing when the student has 0 combo looks like a participation trophy — dilutes the reward feeling.
**How to avoid:** Only render the multiplier badge when `multiplierTier >= 1` (combo >= 3 or whichever threshold is chosen).

---

## Code Examples

Verified patterns from existing source files:

### Existing Shake Animation Pattern (from renderNoteButton)
```javascript
// Source: NotesRecognitionGame.jsx line 1292
animate={
  shouldShake
    ? { x: [0, -6, 6, -4, 4, 0] }
    : shouldPop
      ? { scale: [1, 1.06, 1] }
      : undefined
}
transition={reduce ? undefined : { type: "tween", duration: 0.22, ease: "easeInOut" }}
```

### Existing HudPill Component (for hearts)
```javascript
// Source: NotesRecognitionGame.jsx line 309
const HudPill = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 ...`}>
    {Icon && <Icon className="h-4 w-4 text-white/80" />}
    <span className="text-xs font-semibold text-white/80 sm:text-sm">{label}</span>
    {value !== undefined && value !== null && (
      <span className="font-mono text-sm font-bold tracking-wide sm:text-base">{value}</span>
    )}
  </div>
);
```

### Existing isGameEndingRef Guard (critical to replicate for lives)
```javascript
// Source: NotesRecognitionGame.jsx line 1500
setTimeout(() => {
  if (isGameEndingRef.current) return;  // ← lives check must use same guard
  setAnswerFeedback({ selectedNote: null, correctNote: null, isCorrect: null });
  updateProgress({ currentNote: getRandomNote() });
}, 800);
```

### Existing motion.div Overlay Pattern (for fire glow)
```javascript
// Source: NotesRecognitionGame.jsx line 1847 — background accents pattern
<div className="pointer-events-none absolute inset-0">
  <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
</div>
```

### Existing useSounds Pattern (for adding fire sound)
```javascript
// Source: useSounds.js line 7
// Pattern: add fireWhooshSound ref alongside existing refs
const fireWhooshSound = useRef(null);
const possibleFireWhooshPaths = [
  "/sounds/fire-whoosh.mp3",
  "/assets/sounds/fire-whoosh.mp3",
];
loadSound(possibleFireWhooshPaths, fireWhooshSound);
```

### Existing getNodeById + SKILL_NODES (for auto-grow)
```javascript
// Source: src/data/skillTrail.js line 269
// getNodeById is already imported in NotesRecognitionGame.jsx at line 22:
import { getNodeById } from "../../../data/skillTrail";
// Need to also import SKILL_NODES for next-node lookup:
import { getNodeById, SKILL_NODES } from "../../../data/skillTrail";
```

---

## Claude's Discretion Recommendations

### Multiplier Tier Design (8-year-old comprehension)
Keep it maximally simple — two tiers is enough:

| Combo Count | Multiplier | Badge Label | Rationale |
|-------------|------------|-------------|-----------|
| 0–2 | 1x (no badge shown) | — | Normal scoring |
| 3–7 | 2x | "x2" | First reward kick |
| 8+ | 3x | "x3" | Peak achievable |

**Base score per correct answer:** 10 points (unchanged from current). With multipliers, max per-answer score becomes 30. Speed bonus adds +5 on top of the multiplied score.

**Rationale:** Three tiers becomes confusing for 8-year-olds. Two thresholds (3 and 8) are easy to internalize. 2x and 3x are round numbers they understand.

### Auto-Grow Cap
Maximum 3 extra notes per session. Reasoning: nodes typically have 2–5 notes in their pool. Adding 3 extras from the next node is pedagogically meaningful without overwhelming a beginner who started a 2-note node and suddenly faces 5 notes.

### Combo Counter Position
Place a new dedicated combo pill in the HUD, between the score pill and the timer (when timer is active). This keeps all game stats in one row. On small screens, the combo counter is the most visually prominent element (larger font) since it's the core motivator.

```
| Back | [Score: 40] [x5 🔥] [2x] [00:30] | Settings |
             ↑                              ↑
           existing                   existing
                   ↑ new combo area ↑
```

### Heart Animation on Life Loss
Use Framer Motion `animate={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}` to "burst" the heart away (0.3s). Replace the lost heart with a greyed-out/empty heart outline. Simple, universally understood.

### Speed Bonus Visual
"FAST!" text badge that slides up and fades out over 600ms, positioned above the answer buttons area. Color: amber/yellow (`text-amber-300`). Uses `AnimatePresence` + `key={speedBonusKey}` to re-trigger on each qualifying answer.

### Score Reported to VictoryScreen
Report as a single total score (no breakdown). The existing `totalPossibleScore` will remain `totalQuestions * 10` (base). The actual `score` accumulates the multiplied + speed bonus values. This keeps the star calculation (percentage-based) meaningful without requiring VictoryScreen changes.

### Fire Mode Sound Implementation
Use a separate `new Audio()` instance that does NOT go through `useSounds` (avoiding the mutual-pause problem). Load `/sounds/fire-activate.mp3` lazily on first on-fire activation, cache in a ref, play at 0.4 volume. This is a one-line addition outside the `useSounds` hook.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Date.now()` for timing | `performance.now()` | Phase 07 (mic timing) | Higher resolution, no wall clock drift |
| Separate AudioContext per game | Shared `AudioContextProvider` | Phase 07 | Relevant: fire sound must not compete with the shared audio pipeline |
| useState for all game values | useRef + useState (ref for callbacks, state for rendering) | Phase 06-07 | Critical for all 5 engagement features |

---

## Open Questions

1. **Where does `SKILL_NODES` need to be exported from for next-node lookup?**
   - What we know: `getNodeById` is already imported in NotesRecognitionGame.jsx. `SKILL_NODES` is exported from `src/data/skillTrail.js`.
   - What's unclear: Whether importing `SKILL_NODES` directly (a 90+ node array) into NotesRecognitionGame.jsx creates any bundle concern.
   - Recommendation: It's fine — the array is already loaded as part of the app; no new bundle cost. Import `SKILL_NODES` directly or add a `getNextNodeInCategory(nodeId)` helper to skillTrail.js to keep the lookup pure.

2. **Does `handleGameOver` need to accept a `reason` parameter for lives-specific messaging?**
   - What we know: `handleGameOver` currently computes `isLost = scorePercentage < 50 || timeRanOut`. Lives depletion is a new third loss condition.
   - What's unclear: Whether `GameOverScreen` needs a new prop or just a new translation key.
   - Recommendation: Add `reason: 'lives' | 'score' | 'time'` to the game-over flow. Pass it through `progress.gameOverReason` and to `GameOverScreen` as a prop. `GameOverScreen` already has `timeRanOut` as a prop — generalize it.

3. **Fire sound asset: does `/sounds/fire-activate.mp3` exist?**
   - What we know: The sounds directory has `correct.mp3`, `wrong.mp3`, `game-over.wav`, `success-fanfare-trumpets.mp3`, `drum-stick.mp3`.
   - What's unclear: Whether a fire/whoosh sound asset needs to be added.
   - Recommendation: Plan should include a task to add a royalty-free fire-whoosh sound (or synthesize one with Web Audio API oscillator + filter sweep as a fallback requiring no asset). Web Audio approach is zero-dependency and works offline.

---

## Sources

### Primary (HIGH confidence)
- NotesRecognitionGame.jsx (full read) — All integration points confirmed at exact line numbers
- useGameProgress.js (full read) — `handleAnswer`, `finishGame`, `resetProgress` signatures confirmed
- useSounds.js (full read) — Sound loading pattern and mutual-pause behavior confirmed
- useMotionTokens.js (full read) — `reduce` boolean for reduced-motion gating confirmed
- Firework.jsx (full read) — Existing particle approach documented
- GameOverScreen.jsx (full read) — Current props and messaging confirmed
- VictoryScreen.jsx (header read) — Props including `score`, `totalPossibleScore` confirmed
- trebleUnit1Redesigned.js (full read) — `noteConfig.notePool` structure confirmed for auto-grow
- skillTrail.js (full read) — `getNodeById`, `SKILL_NODES`, category/order structure confirmed
- expandedNodes.js (full read) — Node aggregate structure confirmed
- AccessibilityContext (via CLAUDE.md) — `reducedMotion` setting confirmed
- config.json — `nyquist_validation: false` (not present) confirmed; validation section omitted

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions — All locked choices taken verbatim
- STATE.md v1.9 context — Confirmed Notes Recognition integration points

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and used in this file
- Architecture: HIGH — all integration points read from source with exact line numbers
- Pitfalls: HIGH — derived from direct reading of the existing callback chain patterns
- Auto-grow next-note logic: MEDIUM — the `SKILL_NODES` category+order traversal is straightforward but the note-object shape matching (pitch strings vs. trebleNotes array) needs careful implementation

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable library choices; no external dependencies)
