# Phase 11: Arcade Rhythm Game + Rhythm Node Remapping - Research

**Researched:** 2026-03-30
**Domain:** React game component (requestAnimationFrame animation, Web Audio timing), rhythm node data remapping, Supabase DB migration
**Confidence:** HIGH

## Summary

Phase 11 has two independent workstreams: (1) building `ArcadeRhythmGame` — a new falling-tile game component, and (2) remapping all 36 existing rhythm nodes to a mixed-exercise-type distribution and clearing stale DB progress records.

The falling-tile game reuses heavy infrastructure already present in the codebase: `RhythmPatternGenerator.getPattern()` provides beat schedules, `scoreTap()` provides PERFECT/GOOD/MISS judgment, `FloatingFeedback` and `CountdownOverlay` are drop-in components, and the 3-lives/combo/on-fire state machine from `NotesRecognitionGame` is the canonical pattern to follow (not import). The game's rAF loop follows the exact pattern from `RhythmReadingGame` — `ref.style.transform` mutations, `audioContext.currentTime` as the timing clock, and no React state updates per frame.

The node remapping workstream is purely data-file editing across 8 rhythm unit files. Every non-boss node currently has one `EXERCISE_TYPES.RHYTHM` exercise; after remapping each node will have a single exercise of one of four types following the distribution formula (D-11/D-12/D-13). The DB migration must run before the remapped unit files deploy — this is a hard constraint documented in STATE.md.

The TrailNodeModal has one wired change needed: the `arcade_rhythm` case currently routes to `/coming-soon` and must be updated to `/rhythm-mode/arcade-rhythm-game`. App.jsx needs one new route and one new LANDSCAPE_ROUTES entry. Every `handleNextExercise` in every game component also needs an `arcade_rhythm` routing case added.

**Primary recommendation:** Build ArcadeRhythmGame as a single self-contained file mirroring the RhythmReadingGame FSM structure. Plan the remapping as a separate task that edits all 8 unit files in one pass, preceded by the DB migration task.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Falling Tile Visual Design**
- D-01: Single lane, full-width tiles — one column of tiles descending down center of screen. Child taps anywhere on screen when tile hits the zone.
- D-02: Color-coded tiles by duration — quarter=blue, half=green, eighth=orange. Builds duration-color association.
- D-03: Glowing line hit zone — horizontal glowing line across screen at bottom, pulsing subtly with the beat. Tiles dissolve/pop when crossing it.
- D-04: Ghost tiles for rests — semi-transparent/dimmed tiles fall for rest beats. Child learns NOT to tap. Ghost tiles pass through hit zone without penalty.

**Game Feel & Feedback**
- D-05: Floating text + tile burst on tap — "PERFECT!" / "GOOD" / "MISS" floats up from hit zone. On PERFECT, tile explodes into colored particles. On GOOD, tile dissolves. On MISS, tile grays out and falls through.
- D-06: Flame trail on-fire mode — after combo threshold, tiles gain fire/glow trail. Hit zone turns orange and pulses faster. Reuses on-fire concept from NotesRecognitionGame. Respects reducedMotion.
- D-07: Heart icons + screen shake for life loss — 3 hearts in top corner. On miss: heart breaks/drains with brief screen shake. Screen shake respects reducedMotion.
- D-08: Visual countdown + first tiles visible — "3, 2, 1, GO!" overlay with metronome clicks. First few tiles already on screen during countdown so child previews pattern.

**Difficulty Progression**
- D-09: Fixed screen travel time — tiles always take same time to cross screen. At higher tempo, tiles appear closer together (denser patterns).
- D-10: Fixed difficulty per session — all 10 patterns in session use same tempo and complexity from node config.

**Node Remapping Strategy**
- D-11: Mixed exercise types from the start — every unit has a mix of all available exercise types from Unit 1 onward.
- D-12: Per-unit proportional split — each unit independently follows ~40% MetronomeTrainer / ~30% RhythmReading / ~20% Dictation / ~10% Arcade.
- D-13: Arcade Rhythm for all boss nodes — every rhythm boss node uses arcade_rhythm exercise type.

### Claude's Discretion
- Exact color palette for duration-coded tiles (within glass design system) — NOTE: UI-SPEC has already resolved this
- Tile dimensions (width, height, border-radius, gap) — NOTE: UI-SPEC has already resolved this
- Glowing line animation details (pulse speed, glow radius, color) — NOTE: UI-SPEC has resolved this
- Particle burst effect implementation (count, spread, duration)
- Flame trail visual details (gradient, animation speed, opacity)
- Combo threshold number for on-fire activation — NOTE: UI-SPEC locked this to 5 (matching NotesRecognitionGame)
- Ghost tile opacity and visual treatment — NOTE: UI-SPEC resolved this
- Countdown animation timing and typography — NOTE: CountdownOverlay reused as-is
- Exact per-node exercise type assignment (following D-11/D-12/D-13 rules)
- Screen travel time constant (2.5s vs 3s vs 3.5s)
- PERFECT/GOOD/MISS timing windows — NOTE: existing scoreTap() thresholds apply directly
- FloatingFeedback animation reuse vs new component — NOTE: reuse confirmed

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCR-01 | Falling tiles descend synced to beat schedule using requestAnimationFrame | `buildBeatTimes()` pattern from RhythmReadingGame; `rAF + ref.style.transform` architecture locked in STATE.md |
| ARCR-02 | Hit zone at bottom with PERFECT/GOOD/MISS judgment display | `scoreTap()` from `rhythmScoringUtils.js` is directly reusable; `FloatingFeedback` component is drop-in |
| ARCR-03 | 3-lives system (miss = lose life, 0 lives = GameOverScreen) | Pattern confirmed in `NotesRecognitionGame`; `GameOverScreen` accepts `livesLost={true}` prop |
| ARCR-04 | Combo counter and on-fire mode for consecutive hits | Pattern in `NotesRecognitionGame` (`ON_FIRE_THRESHOLD = 5`, flame icon); state machine pattern to copy |
| ARCR-05 | Session completes through VictoryScreen with star rating and XP | `VictoryScreen` props pattern identical to all other rhythm games; trail props: `nodeId`, `exerciseIndex`, `totalExercises`, `exerciseType`, `onNextExercise` |
| RMAP-01 | Existing 36 rhythm nodes remapped to mixed exercise types | All 8 unit files confirmed: 6 non-boss nodes + 1 boss node per unit; boss nodes → arcade_rhythm (D-13); 5 non-boss nodes per unit need 40/30/20 MetronomeTrainer/RhythmReading/Dictation split |
| RMAP-02 | DB migration resets exercise_progress for remapped nodes before data changes deploy | Pattern from Phase 10 migration (`CREATE OR REPLACE`); SQL UPDATE on `student_skill_progress` where node_id starts with 'rhythm_' or 'boss_rhythm_' |
| RMAP-03 | All remapped nodes playable end-to-end through VictoryScreen | Requires: TrailNodeModal arcade_rhythm routing fix + App.jsx route + LANDSCAPE_ROUTES entry + handleNextExercise arcade_rhythm case in all 7 game components |
</phase_requirements>

---

## Standard Stack

This phase uses no new dependencies. Everything is already installed.

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Component rendering | Project standard |
| requestAnimationFrame | Browser API | Tile descent animation | Locked in STATE.md — GPU compositor path, no framer-motion |
| Web Audio API / audioContext.currentTime | Browser API | Tap timing precision | Locked in STATE.md — mandatory tap clock |
| lucide-react | installed | Heart/Zap/Flame icons | Project standard |
| react-i18next | installed | i18n keys for PERFECT/GOOD/MISS | Reuse existing `games.rhythmReading.tapArea.accuracy.*` keys |

### No New Installations Required
All infrastructure is present:
- `RhythmPatternGenerator.getPattern()` — beat schedule generation
- `scoreTap()` / `calculateTimingThresholds()` — tap judgment
- `FloatingFeedback` — PERFECT/GOOD/MISS floating text
- `CountdownOverlay` — 3-2-1-GO countdown
- `GameOverScreen` with `livesLost` prop
- `VictoryScreen` with full trail props
- `AudioInterruptedOverlay` — iOS audio interruption handling
- `useLandscapeLock` + `useRotatePrompt` — orientation
- `useSessionTimeout` — child safety inactivity timer
- `useAudioContext` — shared AudioContext
- `usePianoSampler` — C4 note playback

---

## Architecture Patterns

### Recommended Project Structure

ArcadeRhythmGame is a single file following the rhythm games pattern:

```
src/components/games/rhythm-games/
├── ArcadeRhythmGame.jsx          # NEW — falling tile game component
├── RhythmReadingGame.jsx         # Reference: FSM + rAF pattern
├── MetronomeTrainer.jsx          # Reference: handleNextExercise pattern
├── RhythmDictationGame.jsx       # Reference: trail integration
├── RhythmPatternGenerator.js     # Reuse: getPattern()
├── utils/
│   └── rhythmScoringUtils.js     # Reuse: scoreTap()
└── components/
    ├── FloatingFeedback.jsx      # Reuse as-is
    ├── CountdownOverlay.jsx      # Reuse as-is
    └── MetronomeDisplay.jsx      # Optional: beat indicator
```

### Pattern 1: Game Phase FSM (CRITICAL — copy from RhythmReadingGame)

```javascript
// Source: src/components/games/rhythm-games/RhythmReadingGame.jsx lines 31-37
const GAME_PHASES = {
  SETUP: 'setup',
  COUNTDOWN: 'countdown',    // Replaces READY — shows 3-2-1-GO
  PLAYING: 'playing',
  FEEDBACK: 'feedback',
  SESSION_COMPLETE: 'session-complete',
};
```

The arcade game differs from RhythmReadingGame in one FSM detail: the READY phase (looping metronome waiting for beat-1 tap) does not apply here. Instead, use a COUNTDOWN phase that runs the `CountdownOverlay` while tiles begin slowly descending, then transitions to PLAYING when countdown ends.

### Pattern 2: rAF Tile Animation Loop (CRITICAL)

```javascript
// Source: STATE.md locked decision + RhythmReadingGame.jsx RAF pattern
// Tiles are DOM refs mutated via style.transform — no React state per frame
const tileRefs = useRef([]); // array of refs, one per tile

function animateTiles() {
  const ctx = audioContextRef.current;
  if (!ctx) return;
  const now = ctx.currentTime;

  tileRefs.current.forEach((ref, i) => {
    if (!ref || missedRef.current.has(i)) return;
    const tile = tilesRef.current[i];
    const elapsed = now - tile.spawnTime; // spawnTime in audioContext.currentTime
    const progress = elapsed / SCREEN_TRAVEL_TIME; // constant e.g. 3.0 seconds
    const yPercent = progress * 100;
    ref.style.transform = `translateY(${yPercent}%)`;

    // Hit zone detection: progress > 0.9 and not yet scored
    if (progress >= 1.0 && !scoredRef.current.has(i) && !tile.isRest) {
      // Tile exited without tap — MISS
      handleMiss(i);
    }
  });

  if (gamePhase === GAME_PHASES.PLAYING) {
    rafIdRef.current = requestAnimationFrame(animateTiles);
  }
}
```

Key constraint: tile spawn times are derived from `buildBeatTimes()` (same as RhythmReadingGame). Each beat's `scheduledBeatTimes[i]` is the `audioContext.currentTime` when that beat should cross the hit zone. The tile spawns at `scheduledBeatTimes[i] - SCREEN_TRAVEL_TIME` seconds before that moment.

### Pattern 3: Tile Spawn Scheduling

Beat times from `buildBeatTimes()` give the moment each beat should be at the hit zone. Tiles need to be spawned earlier:

```javascript
// spawnTime = beatTime - SCREEN_TRAVEL_TIME
// SCREEN_TRAVEL_TIME = 3.0 seconds (Claude's discretion — recommend 3.0s)
const SCREEN_TRAVEL_TIME = 3.0;

// All tiles for a pattern are pre-computed once at exercise start:
const tileDefs = beats.map((beat, i) => ({
  beatIndex: i,
  isRest: beat.isRest,
  durationUnits: beat.durationUnits,
  spawnTime: scheduledBeatTimes[i] - SCREEN_TRAVEL_TIME, // may be in the past for first tiles
  beatTime: scheduledBeatTimes[i], // when it should cross the hit zone
}));
```

During countdown, tiles with negative elapsed time (spawnTime before countdown ends) are shown at the top of screen moving slowly — this is the "first tiles visible during countdown" behavior (D-08).

### Pattern 4: Lives / Combo / On-Fire State

```javascript
// Source: NotesRecognitionGame.jsx (pattern to copy, not import)
const INITIAL_LIVES = 3;      // line 380
const ON_FIRE_THRESHOLD = 5;  // line 381

const [lives, setLives] = useState(INITIAL_LIVES);
const [combo, setCombo] = useState(0);
const [isOnFire, setIsOnFire] = useState(false);

function handleHit(quality) {
  if (quality === 'MISS') {
    setCombo(0);
    setIsOnFire(false);
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) triggerGameOver();
      return next;
    });
  } else {
    setCombo(prev => {
      const next = prev + 1;
      if (next >= ON_FIRE_THRESHOLD) setIsOnFire(true);
      return next;
    });
  }
}
```

### Pattern 5: Trail handleNextExercise (CRITICAL — must include arcade_rhythm case)

Every game component's `handleNextExercise` switch statement currently lacks an `arcade_rhythm` case. It must be added to all 7 existing game files AND the new ArcadeRhythmGame:

```javascript
// Add to MetronomeTrainer, RhythmReadingGame, RhythmDictationGame,
// NotesRecognitionGame, SightReadingGame, MemoryGame, IntervalGame,
// NoteComparisonGame, AND the new ArcadeRhythmGame
case 'arcade_rhythm':
  navigate('/rhythm-mode/arcade-rhythm-game', { state: navState });
  break;
```

### Pattern 6: Node Config Extraction

Existing rhythm nodes have `rhythmConfig` as top-level plus `exercises[0].config`. The new ArcadeRhythmGame should extract config the same way all other rhythm games do:

```javascript
// From location.state — same as MetronomeTrainer / RhythmReadingGame
const tempo = nodeConfig?.tempo ?? nodeConfig?.config?.tempo ?? 90;
const timeSignatureStr = nodeConfig?.timeSignature ?? nodeConfig?.config?.timeSignature ?? '4/4';
const difficulty = nodeConfig?.difficulty ?? nodeConfig?.config?.difficulty ?? 'beginner';
```

### Pattern 7: MISS Detection (when tile exits without tap)

Unlike the tap-scoring game, the arcade game must detect when tiles exit the hit zone WITHOUT a tap:

```javascript
// In the rAF loop, when progress >= 1.0 and tile hasn't been scored:
// → Non-rest tile: MISS (lose life, reset combo)
// → Rest tile (ghost): passes through silently, no scoring
if (progress >= 1.0 && !scoredRef.current.has(i)) {
  if (!tile.isRest) {
    handleMiss(i);  // triggers life loss
  }
  scoredRef.current.add(i); // prevents repeated calls
}
```

### Pattern 8: Tap-to-Score (Hit Zone Press)

```javascript
// Tap handler on the hit zone — scores nearest unscoredtile within timing window
function handleHitZoneTap() {
  const ctx = audioContextRef.current;
  if (!ctx || gamePhase !== GAME_PHASES.PLAYING) return;
  const tapTime = ctx.currentTime; // mandatory — audioContext.currentTime clock

  // Find the nearest unscored non-rest tile within GOOD threshold
  const { quality, noteIdx, newNextBeatIndex } = scoreTap(
    tapTime,
    activeBeatTimesRef.current,   // only non-rest beat times
    nextBeatIndexRef.current,
    tempo
  );

  nextBeatIndexRef.current = newNextBeatIndex;
  // Mark tile as scored and animate accordingly
  scoredRef.current.add(noteIdx);
  handleHit(quality); // updates lives/combo/on-fire
}
```

### Pattern 9: DB Migration Structure

```sql
-- Source: Phase 10 migration pattern (supabase/migrations/20260329000001_add_ear_training_free_nodes.sql)
-- Run BEFORE updated unit files deploy

-- Reset all rhythm node progress (exercise_progress JSONB + stars)
-- Covers rhythm_X_Y nodes and boss_rhythm_X nodes across all 8 units
UPDATE student_skill_progress
SET
  exercise_progress = '[]'::jsonb,
  stars = 0,
  best_score = NULL
WHERE node_id LIKE 'rhythm_%'
   OR node_id LIKE 'boss_rhythm_%';
```

The migration timestamp must be earlier than the Netlify deploy that carries the new JS files. See STATE.md blocker: "Explicit deploy sequencing plan required."

### Pattern 10: Node Remapping Formula (D-12/D-13)

Each unit has 7 nodes: 6 non-boss + 1 boss. Per D-13, boss → arcade_rhythm. For the 6 non-boss nodes, D-12 says ~40/30/20 split (MetronomeTrainer/RhythmReading/Dictation with ~10% Arcade across all units):

With 6 non-boss nodes per unit, the per-unit split:
- 2-3 nodes → `EXERCISE_TYPES.RHYTHM` (MetronomeTrainer, ~40%)
- 2 nodes → `EXERCISE_TYPES.RHYTHM_TAP` (RhythmReading, ~30%)
- 1-2 nodes → `EXERCISE_TYPES.RHYTHM_DICTATION` (Dictation, ~20%)
- 0-1 nodes → `EXERCISE_TYPES.ARCADE_RHYTHM` (Arcade, ~10%)

Practical per-unit assignment (6 nodes, all whole-number):
- Node positions 1,2 → MetronomeTrainer (RHYTHM) — familiar, low-stakes intro nodes
- Node position 3 → RhythmReading (RHYTHM_TAP)
- Node position 4 → Dictation (RHYTHM_DICTATION)
- Node position 5 → RhythmReading (RHYTHM_TAP)
- Node position 6 → MetronomeTrainer (RHYTHM) — speed round stays familiar
- Node 7 (boss) → Arcade (ARCADE_RHYTHM)

This gives per unit: 2×MetronomeTrainer + 2×RhythmReading + 1×Dictation + 1×Arcade = totals across 8 units: 16+16+8+8=48 exercises for 36 nodes (boss nodes = 8 Arcade, non-boss = 40 spread across 3 types). Satisfies D-11 (variety from Unit 1), D-12 (per-unit proportional), D-13 (boss = Arcade).

### Anti-Patterns to Avoid

- **Using React state for per-frame tile positions:** Causes 60fps re-renders and jank. Use `ref.style.transform` in rAF.
- **Using Date.now() for tap timing:** Will desync from scheduled beat times. MUST use `audioContext.currentTime`.
- **Framer-motion for tile descent:** STATE.md locked this as rAF-only.
- **Importing lives/combo state from NotesRecognitionGame:** Copy the pattern, do not create a shared dependency.
- **Deploying remapped unit files before DB migration:** Breaks existing player progress data — migration MUST run first.
- **Using window.location.reload() for arcade_rhythm navigation:** RhythmReadingGame uses this hack for same-route navigation; arcade rhythm navigates TO a different route, so `navigate()` is sufficient.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Beat schedule generation | Custom pattern parser | `RhythmPatternGenerator.getPattern()` + `buildBeatTimes()` | Already handles all time signatures, difficulty levels, rest placement |
| Tap timing judgment | Custom threshold logic | `scoreTap()` from `rhythmScoringUtils.js` | Pure function, already tested, handles lookahead for multi-beat patterns |
| PERFECT/GOOD/MISS display | Custom floating text | `FloatingFeedback` component | Already handles reducedMotion, CSS transitions, i18n labels, aria-live |
| 3-2-1-GO countdown | Custom overlay | `CountdownOverlay` component | Already handles reducedMotion, i18n, aria-live role |
| iOS audio interruption | Custom modal | `AudioInterruptedOverlay` | Already handles all iOS edge cases |
| Orientation lock | Custom orientation code | `useLandscapeLock` + `useRotatePrompt` | Already handles PWA vs browser, iOS vs Android |
| VexFlow tile labels | VexFlow notation in tiles | CSS colored rectangles | Tiles are colored rectangles with optional duration text, not notation |
| Timing thresholds | Custom ms windows | `calculateTimingThresholds(tempo)` | Returns tempo-scaled PERFECT/GOOD thresholds |

**Key insight:** The core complexity of this game (timing precision) is already solved. The new work is purely visual — animating colored tiles downward and detecting when they exit the hit zone.

---

## Runtime State Inventory

> Rename/migration phase — must document all 5 categories.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `student_skill_progress` table: rows where `node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%'` contain stale `exercise_progress` JSONB and `stars` values from old single-exercise structure | DB migration: `UPDATE student_skill_progress SET exercise_progress = '[]'::jsonb, stars = 0, best_score = NULL WHERE ...` — must run BEFORE updated JS files deploy |
| Live service config | None — rhythm nodes are not referenced in n8n workflows, Netlify config, or Supabase Edge Functions | None |
| OS-registered state | None — no OS-level registrations reference rhythm node IDs | None |
| Secrets/env vars | None — no env vars reference rhythm node IDs | None |
| Build artifacts | None — rhythm unit files are ESM source, no compiled artifacts to invalidate | None |

**Critical deploy constraint:** Supabase migration runs via `supabase db push` or the Supabase dashboard. Netlify deploy must not go live until the migration has completed. The safest approach: run migration first via CLI, verify in Supabase dashboard, then trigger Netlify deploy.

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — all tools and services are existing project infrastructure)

---

## Common Pitfalls

### Pitfall 1: Tile Position Drift Due to rAF Scheduling Gaps
**What goes wrong:** rAF callbacks can be delayed by browser tab switching, iOS backgrounding, or heavy GC. A tile's visual position drifts from its musical position.
**Why it happens:** `progress` is calculated from `audioContext.currentTime` (which keeps running), but rAF pauses when tab is hidden.
**How to avoid:** Always compute tile position from `(audioContext.currentTime - spawnTime) / SCREEN_TRAVEL_TIME` — not from a frame counter. Position is always "where should it be RIGHT NOW" regardless of missed frames.
**Warning signs:** Tiles visually lag behind their audio cue on devices that background the tab.

### Pitfall 2: Double-Scoring a Tile
**What goes wrong:** A tap scores the same beat twice — once on tap, once in the miss-detection loop.
**Why it happens:** The rAF loop runs after a tap has already scored a tile, and the miss check fires for the same tile index.
**How to avoid:** Maintain a `scoredRef` Set. Both the tap handler and the miss-detection loop check `scoredRef.current.has(i)` before scoring and add to it immediately.
**Warning signs:** Lives decrease by 2 on some taps, or combo resets unexpectedly.

### Pitfall 3: Rest Tiles Triggering Miss
**What goes wrong:** Ghost tiles (rest beats) cause a life-loss event when they exit the hit zone.
**Why it happens:** The miss-detection loop treats all exiting tiles as misses.
**How to avoid:** In miss-detection: `if (!tile.isRest) { handleMiss(i); }` — rest tiles exit silently.
**Warning signs:** Player loses life on rest beats even without tapping.

### Pitfall 4: audioContext Not Ready on Auto-Start
**What goes wrong:** `audioContext.currentTime` is 0 or AudioContext is suspended when the game auto-starts from trail.
**Why it happens:** iOS requires a user gesture to create/resume AudioContext. Auto-start happens before the gesture.
**How to avoid:** Check `ctx.state === 'suspended' || ctx.state === 'interrupted'` before auto-starting (same guard in RhythmReadingGame lines 158-161). Show AudioInterruptedOverlay if interrupted.
**Warning signs:** All tiles spawn at once at top of screen; timing is wildly off.

### Pitfall 5: Missing arcade_rhythm Case in handleNextExercise
**What goes wrong:** After completing an ArcadeRhythmGame exercise in a multi-exercise trail node, `handleNextExercise` falls through to `navigate('/trail')` instead of routing to the correct next game.
**Why it happens:** All 7 existing game files have handleNextExercise switch statements that currently lack an `arcade_rhythm` case.
**How to avoid:** Add `case 'arcade_rhythm': navigate('/rhythm-mode/arcade-rhythm-game', { state: navState }); break;` to ALL handleNextExercise switch statements — MetronomeTrainer, RhythmReadingGame, RhythmDictationGame, NotesRecognitionGame, SightReadingGame, MemoryGame, IntervalGame, NoteComparisonGame.
**Warning signs:** Trail navigation breaks silently — user is sent to trail map instead of next exercise.

### Pitfall 6: DB Migration After JS Deploy
**What goes wrong:** Users who have completed rhythm nodes have their progress reset mid-session, or the new multi-exercise node structure conflicts with single-exercise progress records.
**Why it happens:** Deploy order is wrong — JS files ship before the migration clears stale records.
**How to avoid:** Run `supabase db push` (or apply migration manually in Supabase dashboard) and verify it completed BEFORE merging the feature branch to main/triggering Netlify deploy. See STATE.md note: "Rhythm node remapping DB migration must run before data file changes deploy."
**Warning signs:** VictoryScreen shows wrong exercise count; stars calculation uses stale exercise_progress JSONB.

### Pitfall 7: Tile Height vs Duration Confusion
**What goes wrong:** Whole notes (durationUnits=16) render as physically taller tiles that take longer to cross the screen, making them appear slower.
**Why it happens:** Tile height in pixels is proportional to duration, but descent speed is constant (D-09).
**How to avoid:** UI-SPEC specifies tile heights by duration (whole=80px, half=64px, quarter=56px, eighth=44px). These are visual proportional representations, not physics. The tile's "crossing" event is at a single point (its top edge crossing the hit zone line), not its full height.
**Warning signs:** Whole-note tiles appear to be "in the hit zone" for much longer than their actual scoring window.

### Pitfall 8: validateTrail.mjs Blocking Build
**What goes wrong:** `npm run build` fails because remapped node exercise type strings are invalid.
**Why it happens:** `validateTrail.mjs` (prebuild hook) validates all exercise type strings against `EXERCISE_TYPES` constants.
**How to avoid:** Use `EXERCISE_TYPES.RHYTHM_TAP`, `EXERCISE_TYPES.RHYTHM_DICTATION`, `EXERCISE_TYPES.ARCADE_RHYTHM` (already registered in constants.js from Phase 7) — not raw strings. Run `npm run verify:trail` after editing unit files to catch errors before build.
**Warning signs:** Build fails with "unknown exercise type" error from validateTrail.mjs.

---

## Code Examples

Verified patterns from codebase inspection:

### Route Registration (App.jsx)
```javascript
// Add to LANDSCAPE_ROUTES array (App.jsx line 193):
"/rhythm-mode/arcade-rhythm-game",

// Add route inside the protected routes block (after rhythm-dictation-game route):
<Route
  path="/rhythm-mode/arcade-rhythm-game"
  element={
    <AudioContextProvider>
      <ArcadeRhythmGame />
    </AudioContextProvider>
  }
/>
```

### TrailNodeModal Fix (TrailNodeModal.jsx line 237-238)
```javascript
// Replace:
case 'arcade_rhythm':
  navigate('/coming-soon', { state: { ...navState, gameName: t('trail:exerciseTypes.arcade_rhythm') } });
// With:
case 'arcade_rhythm':
  navigate('/rhythm-mode/arcade-rhythm-game', { state: navState });
```

### Remapped Node Exercise Array (example — rhythm_1_1 before and after)
```javascript
// BEFORE (all 36 nodes currently look like this):
exercises: [
  {
    type: EXERCISE_TYPES.RHYTHM,
    config: { tempo: 65, timeSignature: '4/4', difficulty: 'easy' }
  }
]

// AFTER — example for position-1 node (MetronomeTrainer preserved):
exercises: [
  {
    type: EXERCISE_TYPES.RHYTHM,  // unchanged for pos 1,2 nodes
    config: { tempo: 65, timeSignature: '4/4', difficulty: 'easy' }
  }
]

// AFTER — example for position-3 node (RhythmReading):
exercises: [
  {
    type: EXERCISE_TYPES.RHYTHM_TAP,  // changed
    config: { tempo: 65, timeSignature: '4/4', difficulty: 'easy' }
  }
]

// AFTER — boss node (Arcade):
exercises: [
  {
    type: EXERCISE_TYPES.ARCADE_RHYTHM,  // changed
    config: { tempo: 75, timeSignature: '4/4', difficulty: 'intermediate' }
  }
]
```

### DB Migration Template
```sql
-- File: supabase/migrations/20260330000001_reset_rhythm_node_progress.sql
-- Phase 11: Reset exercise_progress and stars for all remapped rhythm nodes
-- MUST run before updated rhythmUnit*.js files deploy to production

UPDATE public.student_skill_progress
SET
  exercise_progress = '[]'::jsonb,
  stars = 0,
  best_score = NULL
WHERE node_id LIKE 'rhythm_%'
   OR node_id LIKE 'boss_rhythm_%';

COMMENT ON TABLE public.student_skill_progress IS
  'Updated 2026-03-30: Phase 11 reset all rhythm node exercise_progress (nodes remapped to mixed exercise types — stale single-exercise progress cleared)';
```

### ArcadeRhythmGame Skeleton (key differences from RhythmReadingGame)
```javascript
// src/components/games/rhythm-games/ArcadeRhythmGame.jsx

// Key additions over RhythmReadingGame:
const INITIAL_LIVES = 3;
const ON_FIRE_THRESHOLD = 5;
const SCREEN_TRAVEL_TIME = 3.0; // seconds — constant tile descent duration

const [lives, setLives] = useState(INITIAL_LIVES);
const [combo, setCombo] = useState(0);
const [isOnFire, setIsOnFire] = useState(false);
const [countdownValue, setCountdownValue] = useState(null); // 3|2|1|'GO'|null
const tileRefs = useRef([]);    // DOM refs for each tile (rAF mutations)
const scoredRef = useRef(new Set()); // prevents double-scoring
const tilesRef = useRef([]);    // tile defs: { beatIndex, isRest, durationUnits, spawnTime, beatTime }
const activeBeatTimesRef = useRef([]); // non-rest beat times for scoreTap()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All 36 rhythm nodes use `EXERCISE_TYPES.RHYTHM` (MetronomeTrainer) | Mixed types after Phase 11 | Phase 11 | `exercises[0].type` can now be RHYTHM, RHYTHM_TAP, RHYTHM_DICTATION, or ARCADE_RHYTHM |
| `arcade_rhythm` routes to `/coming-soon` | Routes to `/rhythm-mode/arcade-rhythm-game` | Phase 11 | EXERCISE_TYPES.ARCADE_RHYTHM becomes playable |
| `handleNextExercise` has no arcade_rhythm case | All 8 game files gain arcade_rhythm case | Phase 11 | Multi-exercise nodes can chain through arcade_rhythm |

**Deprecated/outdated:**
- The ComingSoon placeholder for arcade_rhythm (introduced in Phase 7) is replaced in Phase 11.

---

## Open Questions

1. **Screen travel time constant**
   - What we know: D-09 says fixed, Claude's discretion on exact value
   - What's unclear: 2.5s vs 3.0s vs 3.5s — affects how "busy" the screen looks at higher tempos
   - Recommendation: Use 3.0s as default. At 120 BPM (1 beat/0.5s), tiles are 1.5 tile-heights apart. At 60 BPM (1 beat/1s), tiles are well-spaced. 3.0s gives comfortable visual density across typical tempo range (60-100 BPM).

2. **Particle burst implementation approach**
   - What we know: D-05 specifies "tile explodes into colored particles" on PERFECT; Claude's discretion on count/spread/duration
   - What's unclear: CSS keyframe approach vs canvas vs multiple div elements
   - Recommendation: CSS keyframes with 6-8 absolutely-positioned small divs per tile burst, spawned on PERFECT hit and removed after 600ms. Avoids canvas complexity, respects reducedMotion (simply don't spawn divs). Pattern matches project's existing CSS animation approach.

3. **Deploy sequencing for Netlify + Supabase**
   - What we know: STATE.md flags this as needing explicit plan. Migration must run before JS deploys.
   - What's unclear: The exact Netlify deploy trigger workflow — whether the planner should specify a manual step or rely on CI ordering.
   - Recommendation: Plan must include an explicit task: "Apply DB migration via Supabase CLI before merging to main." This is a manual human step, not automatable through Netlify build hooks.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vite.config.js` (Vitest inline config) |
| Quick run command | `npx vitest run src/components/games/rhythm-games/` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCR-01 | Tiles spawn at correct screen position relative to beat time | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | ❌ Wave 0 |
| ARCR-02 | scoreTap() returns correct quality for arcade timing | unit | `npx vitest run src/components/games/rhythm-games/utils/rhythmScoringUtils.test.js` | ✅ (existing, covers scoreTap) |
| ARCR-03 | Life loss on miss, GameOverScreen at 0 lives | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | ❌ Wave 0 |
| ARCR-04 | Combo increments on hit, resets on miss; on-fire at threshold 5 | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | ❌ Wave 0 |
| ARCR-05 | SESSION_COMPLETE triggers VictoryScreen with correct props | unit | `npx vitest run src/components/games/rhythm-games/ArcadeRhythmGame.test.js` | ❌ Wave 0 |
| RMAP-01 | All 36 remapped node exercise type strings are valid EXERCISE_TYPES | unit (validate trail) | `npm run verify:trail` | ✅ (existing script validates) |
| RMAP-02 | DB migration SQL is syntactically valid | manual | Run in Supabase dashboard | N/A |
| RMAP-03 | TrailNodeModal routes arcade_rhythm to correct path | unit | `npx vitest run src/components/trail/TrailNodeModal.test.js` | ❌ Wave 0 (if test needed) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/games/rhythm-games/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green + `npm run verify:trail` passes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/games/rhythm-games/ArcadeRhythmGame.test.js` — covers ARCR-01, ARCR-03, ARCR-04, ARCR-05
  - Test the lives/combo state machine logic in isolation
  - Test that GAME_PHASES transitions correctly: COUNTDOWN → PLAYING → SESSION_COMPLETE
  - Mock audioContext, rAF, and scoreTap for deterministic testing
- Note: ARCR-02 is covered by existing `rhythmScoringUtils.test.js` — scoreTap() tests already pass.
- Note: RMAP-01 is covered by `npm run verify:trail` — no new test file needed.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `RhythmReadingGame.jsx` — FSM pattern, rAF cursor loop, buildBeatTimes, handleTap, handleNextExercise
- Direct codebase inspection: `MetronomeTrainer.jsx` — handleNextExercise switch with all exercise type cases
- Direct codebase inspection: `rhythmScoringUtils.js` — scoreTap() API and return shape
- Direct codebase inspection: `rhythmTimingUtils.js` — calculateTimingThresholds() algorithm and BASE values
- Direct codebase inspection: `FloatingFeedback.jsx` — props: quality, feedbackKey, reducedMotion
- Direct codebase inspection: `CountdownOverlay.jsx` — props: countdownValue, reducedMotion
- Direct codebase inspection: `GameOverScreen.jsx` — props: livesLost, onReset, score, correctAnswers
- Direct codebase inspection: `TrailNodeModal.jsx` — arcade_rhythm case routes to /coming-soon (lines 237-238)
- Direct codebase inspection: `App.jsx` — LANDSCAPE_ROUTES array (line 193), rhythm route registrations (lines 353-373)
- Direct codebase inspection: `constants.js` — EXERCISE_TYPES.ARCADE_RHYTHM confirmed registered
- Direct codebase inspection: `rhythmUnit1Redesigned.js` through `rhythmUnit8Redesigned.js` — 7 nodes per unit confirmed (6 non-boss + 1 boss), all use EXERCISE_TYPES.RHYTHM
- Direct codebase inspection: `STATE.md` — locked decisions: rAF+ref.style.transform, audioContext.currentTime, migration-before-deploy constraint
- Direct codebase inspection: Phase 10 migration — DB migration pattern, CREATE OR REPLACE approach
- Direct codebase inspection: `11-UI-SPEC.md` — visual contract already resolved; tile colors, sizes, hit zone glow, combo threshold (5), INITIAL_LIVES (3) all locked

### Secondary (MEDIUM confidence)
- None needed — all critical decisions are sourced from codebase

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all infrastructure verified present in codebase
- Architecture: HIGH — patterns sourced directly from existing game components
- Pitfalls: HIGH — identified from examining actual code patterns and existing similar games
- Node remapping formula: HIGH — D-11/D-12/D-13 rules applied to confirmed node counts
- DB migration: HIGH — pattern from Phase 10 migration verified

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable codebase, no fast-moving external dependencies)
