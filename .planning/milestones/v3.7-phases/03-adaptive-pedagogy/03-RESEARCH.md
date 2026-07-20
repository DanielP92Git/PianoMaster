# Phase 03: Adaptive Pedagogy - Research

**Researched:** 2026-07-12
**Domain:** In-session adaptive difficulty/tempo engine + cross-session per-note mastery persistence (Supabase JSONB + RLS), sight-reading game only
**Confidence:** HIGH (all core claims verified directly against this repo's source; no external library research needed — this phase is pure application logic + one schema migration)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**In-session difficulty escalation (ADAPT-01)**

- **D-01:** A new, dedicated adaptive-difficulty streak counter drives escalation/easing — separate from Phase 01's session-wide HUD combo (`SightReadingSessionContext`). Decouples pedagogy-tuning thresholds from motivational-HUD tuning (combo tiers 3/8, on-fire at 5).
- **D-02:** Escalation widens into the node's `contextNotes`, reusing the `focusNotes`/`contextNotes` split already established by `NotesRecognitionGame`'s auto-grow-note-pool precedent. Widening stays scoped to notes the node author already defined as a stretch — never notes outside the node's own pedagogy.
- **D-03:** Easing triggers on N consecutive misses (concretely: 2-3 in a row, planner's discretion on exact N) and drops back one difficulty tier — narrows toward the node's core `focusNotes`, removes rests, lowers tempo. First "shrink" mechanism in the codebase; no existing precedent.
- **D-04:** Escalation/ease events apply only at the next exercise boundary, never mid-pattern. Patterns are generated as a whole via config-in/config-out (`patternBuilder.js` `generatePatternData`) with baked-in `startTime`/`endTime` — regenerating mid-pattern is unsupported and risks mic-timing bugs. The adaptive engine mutates the `gameSettings` fed into the _next_ `generatePatternData` call.

**Adaptive tempo (ADAPT-02)**

- **D-05:** Tempo is the SAME lever as ADAPT-01's difficulty tiers, not a separate axis. One streak counter drives one tier ladder; tempo is one property bundled into each tier alongside note range and rests.
- **D-06:** BPM moves in small fixed steps within a bounded range — target ~±10-15 BPM per tier step, clamped to roughly 0.75x-1.25x of the node's configured base tempo (`gameSettings.tempo`). Exact step size/clamp fractions are planner's discretion within this envelope.
- **D-07:** Tempo changes apply only at exercise boundaries (same constraint as D-04) — part of `gameSettings` fed into the next pattern generation call.

**Per-note mastery scope & use (ADAPT-03)**

- **D-08:** Mastery is tracked per node, not globally per pitch. Mirrors the existing `exercise_progress` JSONB-array-on-per-(student,node)-row precedent.
- **D-09:** Persisted mastery actively targets weak notes, not display-only. Future-session pattern generation should bias toward historically-weak pitches more often — strictly _within_ the node's existing note pool.
- **D-10:** Mastery value shape is simple cumulative accuracy: `{ pitch: { correct, total } }`, merged/incremented across sessions — no recency-weighting or decay.
- **D-11:** Weak-note targeting requires a minimum-attempts threshold before it influences selection — e.g. ≥3-5 recorded attempts (exact N planner's discretion). Prevents a single missed note from permanently flagging a pitch as "weak."

**Player-facing legibility & mode interaction**

- **D-12:** Escalation gets a visible, positive-only cue; easing is silent. A brief "leveling up" moment plays on escalation (same spirit as celebrating on-fire). Easing back down happens with NO explicit UI signal. Exact copy/animation is planner's discretion but must respect `prefers-reduced-motion`.
- **D-13:** Adaptivity (ADAPT-01/02) applies in BOTH Practice and Test grading modes from Phase 02. Adaptivity governs _what's presented_; Phase 02's grading mode governs _how it's scored_. Orthogonal.

### Claude's Discretion

- Exact N for "consecutive misses" that triggers easing (D-03) — starting hypothesis 2-3.
- Exact BPM step size and clamp fractions within the D-06 envelope (±10-15 BPM, 0.75x-1.25x base).
- Exact minimum-attempts threshold for weak-note targeting (D-11) — starting hypothesis 3-5.
- Exact copy, iconography, and animation for the escalation "leveling up" cue (D-12).
- Whether the adaptive-difficulty streak counter (D-01) lives in `SightReadingSessionContext` alongside combo/mode-lock state, or is scoped more locally — planner's call, but the established pattern in that context (parallel `useState`/`useRef` pairs, reset in `startSession`/`resetSession`) should be followed if it does.
- The exact JSONB column name and shape for per-node mastery (D-10 fixes the logical shape `{ pitch: { correct, total } }`; column name/migration structure/nesting is implementation detail).

### Deferred Ideas (OUT OF SCOPE)

- Display-only surfacing of per-note mastery (parent/teacher view) — not requested this phase.
- Recency-weighted / decayed mastery — rejected in favor of simple cumulative accuracy (D-10).
- Separate independently-moving tempo axis — rejected (D-05) in favor of tempo riding the same tier ladder.
- Visible easing with careful positive framing — rejected (D-12) in favor of fully silent easing.
- Rush/drag coaching (SR-FUT-01) and cross-game adaptive-difficulty framework remain out of scope per `.planning/REQUIREMENTS.md`.
- Lives/game-over mechanics (permanently deferred, Phase 01 D-01/D-02).
- Changes to Phase 02's grading-mode logic itself (Practice unscored / Test scored).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID                      | Description                                                                                                                     | Research Support                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADAPT-01                | Within a session, difficulty progresses on sustained success (widen note range / add rests / raise tempo) and eases on struggle | See "Architecture Patterns" (tier ladder), "Landmine: stale-closure gameSettings at exercise boundary", "Landmine: sight-reading nodes have no real focusNotes/contextNotes split"                  |
| ADAPT-02                | Tempo adapts to performance — slows on struggle, speeds up on success                                                           | See "Tempo & timing" findings — `gameSettings.tempo` single source, `buildTimingWindows` clamp-fraction interaction at tempo extremes                                                               |
| ADAPT-03                | Per-note mastery persists across sessions via a JSONB field on the student progress row, enabling weak-note targeting           | See "Persistence & Plumbing Gap" — full write-path trace from `SightReadingGame.jsx` through `VictoryScreen`/`useVictoryState` to `skillProgressService.js`, and the session-level accumulation gap |
| ADAPT-04                | Persisted per-note mastery is written/read only for the authenticated student under RLS, mirroring `student_skill_progress`     | See "RLS Verification" — table-level row policies already cover new columns automatically; teacher-SELECT nuance documented                                                                         |
| I18N-01 (cross-cutting) | New adaptive-coaching / leveling-up copy ships EN+HE with RTL correctness                                                       | See "i18n" section — `sightReading.*` namespace, existing EN/HE parity convention                                                                                                                   |

</phase_requirements>

## Summary

This phase adds no new dependencies and touches no new architectural layers the codebase hasn't already established — it is a config-in/config-out difficulty engine plus one new JSONB column with row-level policies that already exist. The real risk in this phase is **integration plumbing, not algorithm design**: the decisions in CONTEXT.md correctly identify the _shapes_ to reuse (tier ladder, `focusNotes`/`contextNotes`, JSONB merge-on-upsert), but three concrete gaps in the actual current code will bite the planner if not called out explicitly:

1. **Sight-reading trail nodes do not carry a genuine `focusNotes`/`contextNotes` split at the exercise level.** The `nodeConfig` object `SightReadingGame.jsx` receives via `location.state` is the **exercise's** `config` (just `{ notePool, ... }`), not the **node's** top-level `noteConfig` (which has `focusNotes`/`contextNotes`). Verified across every `SIGHT_READING`-bearing node in `src/data/units/`: `focusNotes` is **always empty** on sight-reading exercises (sight-reading only ever runs on already-taught notes). The genuine "stretch" pool — when one exists — is the node's `noteConfig.notePool` (superset) vs. the exercise's own `config.notePool` (subset); e.g. `bass_4_4`/`bass_4_5`/`treble_4_4` all show the exercise config deliberately narrower than the node pool. `getNodeById(nodeId)` is already imported in `SightReadingGame.jsx` (used elsewhere at line ~879) and is the correct lookup for this superset.
2. **The `gameSettings` state has a stale-closure risk at the exact adaptive mutation point.** `handleNextExercise` calls `goToNextExercise()` then `loadExercisePattern()` in the same callback; `loadExercisePattern` is a `useCallback` closing over the `gameSettings` state from the render that created it. If the adaptive engine does `setGameSettings(tierAdjusted)` and then immediately calls `loadExercisePattern()` synchronously, the pattern will generate from the **pre-adjustment** settings (React state updates are async). This needs the same ref-mirror treatment (`gameSettingsRef`) already established for `comboRef`/`gradingModeRef`, or `loadExercisePattern` needs to accept an explicit settings override parameter.
3. **`perNoteAccuracy` is computed per-exercise but the write path to persist it doesn't exist yet, and neither does session-level accumulation.** `summaryStats.perNoteAccuracy` (SightReadingGame.jsx ~1453-1484) is overwritten every exercise; nothing currently merges it across a 10-exercise session. The actual DB write for trail progress happens once, in `useVictoryState.js`, at session end (`VictoryScreen` render, gated by `suppressPersistence={isPracticeMode}`) via `updateExerciseProgress`/`updateNodeProgress` in `skillProgressService.js` — neither of which currently accepts or touches per-note data at all. This is new plumbing across 4 layers (component state → prop → hook → service → DB), not a one-line addition to an existing call.

None of this contradicts CONTEXT.md's decisions — it's the concrete "here's exactly where and how" the planner needs to turn D-01 through D-13 into tasks.

**Primary recommendation:** Introduce a small new module (e.g. `sight-reading-game/utils/adaptiveEngine.js`) holding the tier ladder (pure functions: `computeNextTier`, `applyTierToSettings`), keep the streak counter in `SightReadingSessionContext` alongside `combo` (ref-mirrored, reset with session), have `handleNextExercise` call the engine to compute the next tier and pass an **explicit settings object** into `loadExercisePattern` (avoid relying on the `gameSettings` state closure alone), and add a session-scoped `sessionMasteryRef` that accumulates `perNoteAccuracy` across the 10 in-session exercises, persisted once at session end through a new optional param threaded through `useVictoryState` → `skillProgressService.updateExerciseProgress`/`updateNodeProgress` → new `note_mastery` JSONB column (mirrors the `exercise_progress` migration pattern exactly).

## Architectural Responsibility Map

| Capability                                         | Primary Tier                                                        | Secondary Tier                                                  | Rationale                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| In-session streak tracking (D-01)                  | Browser/Client (React context)                                      | —                                                               | Ephemeral per-session UI state; no persistence needed mid-session                                              |
| Difficulty/tempo tier ladder (D-01/D-02/D-05/D-06) | Browser/Client (game component + new util module)                   | —                                                               | Pure config transformation feeding `generatePatternData`; no server round-trip needed per tier change          |
| Pattern (re)generation                             | Browser/Client (`patternBuilder.js`)                                | —                                                               | Deterministic, config-in/config-out, already client-side only                                                  |
| Per-note mastery read (bias note selection)        | Browser/Client (fetch on node/session start)                        | Database/Storage (`student_skill_progress.note_mastery` column) | Read happens once per node-session start to seed selection weighting; source of truth lives in Postgres        |
| Per-note mastery write (persist across sessions)   | Database/Storage (Postgres upsert via `skillProgressService.js`)    | Browser/Client (accumulate in-session before one write)         | Cross-session persistence requirement (ADAPT-03) mandates DB; client only aggregates before the single upsert  |
| RLS enforcement (ADAPT-04)                         | Database/Storage (Postgres RLS policies)                            | Browser/Client (`verifyStudentDataAccess` JS gate)              | Defense-in-depth: DB is ground truth, JS gate improves error UX and fails closed before a request is even sent |
| Escalation UI cue (D-12)                           | Browser/Client (React component, respects `prefers-reduced-motion`) | —                                                               | Pure presentational feedback, no persistence                                                                   |
| i18n strings (I18N-01)                             | Browser/Client (`src/locales/{en,he}/common.json`)                  | —                                                               | Static translation resources bundled with the client                                                           |

## Standard Stack

No new libraries are required for this phase. All work uses the existing stack (React 18 state/context, Supabase JS client, existing `patternBuilder.js`/`rhythmGenerator.js` utilities).

### Core

| Library    | Version | Purpose | Why Standard                                                           |
| ---------- | ------- | ------- | ---------------------------------------------------------------------- |
| (none new) | —       | —       | Phase is pure application logic + 1 SQL migration on an existing table |

### Don't add

- No state-machine library (XState, etc.) for the tier ladder — a small array of tier objects + an index (mirrors `COMBO_TIERS` pattern already used in `NotesRecognitionGame.jsx`) is sufficient and consistent with project conventions.
- No weighted-random-selection package for weak-note biasing — this is a ~10-line pure function (cumulative-weight array + `Math.random()`), already the pattern `patternBuilder.js` uses for plain random note selection. Verified: no existing weighted-random utility anywhere in `src/` (`grep` for "weighted" found nothing) — this is new code, not a hand-roll of a solved problem.

**Installation:** N/A — no new packages.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Exercise boundary (handleNextExercise / loadExercisePattern)        │
│                                                                       │
│  performanceResults (last exercise)                                 │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────┐   correct/miss streak    ┌──────────────────┐ │
│  │ Adaptive streak   │ ───────────────────────► │ Tier ladder      │ │
│  │ counter (D-01)    │                          │ (D-01/02/03/05/  │ │
│  │ SightReadingSess- │ ◄─── escalate/ease ────  │  06) — pure fn   │ │
│  │ ionContext         │                          │ adaptiveEngine.js│ │
│  └──────────────────┘                          └────────┬─────────┘ │
│                                                            │ tier →   │
│                                                   {tempo, selectedNotes,│
│                                                    rhythmSettings}   │
│                                                            ▼          │
│                                          ┌──────────────────────────┐│
│                                          │ gameSettings (next)      ││
│                                          │ — explicit object passed ││
│                                          │  to generatePattern(),   ││
│                                          │  NOT read from stale     ││
│                                          │  closure (landmine #2)   ││
│                                          └────────────┬─────────────┘│
│                                                        ▼              │
│                                          generatePatternData()        │
│                                          (patternBuilder.js, unchanged)│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Session-end persistence (VictoryScreen / useVictoryState)            │
│                                                                        │
│  Each exercise's summaryStats.perNoteAccuracy                        │
│         │  (merge-accumulate across 10 in-session exercises)         │
│         ▼                                                             │
│  sessionMasteryRef.current: { pitch: { correct, total } }             │
│         │  (passed as new prop through VictoryScreen → useVictoryState)│
│         ▼                                                             │
│  updateExerciseProgress(studentId, nodeId, ..., masteryDelta)         │
│  / updateNodeProgress(...)  [skillProgressService.js — EXTENDED]      │
│         │  read existing note_mastery → merge counts → upsert         │
│         ▼                                                             │
│  student_skill_progress.note_mastery JSONB  ◄── RLS: student_id =    │
│  (Postgres, new column, same row as stars/  auth.uid() (existing      │
│   exercise_progress)                        table-level policies)     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Next-session read (weak-note targeting, D-09/D-11)                    │
│                                                                        │
│  Node/session start → fetch note_mastery for (studentId, nodeId)      │
│         │  filter to pitches with total >= MIN_ATTEMPTS (D-11)        │
│         ▼                                                             │
│  weightedNotePool = bias selection toward low-accuracy pitches        │
│  (within node's own notePool — never outside, per D-09)               │
│         │                                                             │
│         ▼                                                             │
│  fed into gameSettings.selectedNotes for generatePatternData()        │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/components/games/sight-reading-game/
├── utils/
│   ├── patternBuilder.js         # unchanged — config-in/config-out
│   ├── adaptiveEngine.js         # NEW: tier ladder, computeNextTier(),
│   │                              #      applyTierToSettings(), weightedNoteSelection()
│   └── adaptiveEngine.test.js    # NEW: pure-function unit tests (no DOM needed)
├── constants/
│   └── adaptiveTiers.js          # NEW: tier definitions (mirrors gradingModes.js style)
├── SightReadingGame.jsx           # wires streak/tier state, calls adaptiveEngine
└── hooks/
    └── usePatternGeneration.js   # unchanged

src/contexts/
└── SightReadingSessionContext.jsx # + adaptive streak/tier useState+useRef pairs (D-01)

src/services/
└── skillProgressService.js       # EXTENDED: updateExerciseProgress/updateNodeProgress
                                   #   accept optional perNoteMastery param, merge JSONB

supabase/migrations/
└── 2026071Xhhmmss_add_note_mastery.sql   # NEW column + comment + GIN index (mirrors
                                            #   20260125000001_add_exercise_progress.sql)
```

### Pattern 1: Ref-mirror for adaptive state read inside stale-closure-prone callbacks

**What:** Every piece of session-scoped state that must be read inside a callback that might close over a stale render (mic-detection handlers, `loadExercisePattern`) needs a `useRef` mirror updated synchronously alongside `useState`.
**When to use:** Any new adaptive streak counter / current-tier value that `handleNextExercise`/`loadExercisePattern`/mic callbacks need to read.
**Example (existing precedent, `SightReadingSessionContext.jsx`):**

```javascript
// Source: src/contexts/SightReadingSessionContext.jsx (existing, verified)
const [gradingMode, setGradingModeState] = useState(GRADING_MODES.TEST);
const gradingModeRef = useRef(GRADING_MODES.TEST);
// ... every setter writes both:
gradingModeRef.current = mode;
setGradingModeState(mode);
```

### Pattern 2: Config-in/config-out tier application (no internal state in patternBuilder)

**What:** `generatePatternData()` never needs to know about streaks or tiers — it only ever receives a fully-resolved `gameSettings`-shaped object.
**When to use:** Applying an escalated/eased tier. Compute the new settings object explicitly (don't rely on `setGameSettings` + reading `gameSettings` in the same tick).
**Example (illustrative, following D-04/D-07):**

```javascript
// In handleNextExercise, BEFORE calling loadExercisePattern:
const nextTier = computeNextTier(streakRef.current, currentTierRef.current);
const adaptedSettings = applyTierToSettings(
  gameSettings,
  nextTier,
  nodeConfig,
  nodeNoteConfig
);
setGameSettings(adaptedSettings);
currentTierRef.current = nextTier;
// loadExercisePattern must read `adaptedSettings` directly (param) or from a
// gameSettingsRef mirror — NOT solely from the `gameSettings` closure.
```

### Pattern 3: JSONB merge-on-upsert (existing `exercise_progress` precedent, directly reusable)

**What:** Read current row → merge new values into the JSONB field → upsert with `onConflict: 'student_id,node_id'`.
**When to use:** The `note_mastery` write in `skillProgressService.js`.
**Example:**

```javascript
// Source: src/services/skillProgressService.js updateExerciseProgress (existing, verified)
let nodeProgress = await getNodeProgress(studentId, nodeId);
let exerciseProgressArray = nodeProgress?.exercise_progress || [];
// ... merge logic ...
const progressData = {
  student_id: studentId,
  node_id: nodeId,
  // ... existing fields ...
  exercise_progress: exerciseProgressArray,
  last_practiced: new Date().toISOString(),
};
const { data, error } = await supabase
  .from("student_skill_progress")
  .upsert(progressData, { onConflict: "student_id,node_id" })
  .select()
  .maybeSingle();
```

For `note_mastery`, the merge is `{ correct: existing.correct + delta.correct, total: existing.total + delta.total }` per pitch, per D-10 — no decay, pure addition.

### Anti-Patterns to Avoid

- **Don't apply tier changes mid-pattern** — D-04/D-07 explicitly forbid this; `startTime`/`endTime` are baked into the pattern at generation time and mic-timing windows derive from them.
- **Don't call `setGameSettings()` then immediately read `gameSettings` in the same function body** expecting the new value — classic stale-closure bug, verified present risk at `handleNextExercise`/`loadExercisePattern`.
- **Don't widen note selection beyond the node's own pool** — D-02/D-09 both explicitly scope widening/biasing to notes already in the node's pedagogy (`noteConfig.notePool` at most, never `TREBLE_NOTE_DATA`/`BASS_NOTE_DATA` at large).
- **Don't write `note_mastery` from a game type other than sight-reading** — `updateExerciseProgress`/`updateNodeProgress` are shared across `NotesRecognitionGame`, `MemoryGame`, `MetronomeTrainer`, and `SightReadingGame`. The new param must default to a no-op (`undefined`/omitted) so other games' calls are byte-for-byte unaffected.

## Don't Hand-Roll

| Problem                                            | Don't Build                          | Use Instead                                                                                                                                                | Why                                                                                                                                                                                        |
| -------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JSONB read-merge-upsert for per-node student state | A new persistence helper/table       | Extend `updateExerciseProgress`/`updateNodeProgress` in `skillProgressService.js`                                                                          | Exact existing precedent (`exercise_progress`); a new table would fragment RLS surface and duplicate `verifyStudentDataAccess` gating                                                      |
| RLS for the new column                             | New per-column policies              | Nothing — existing row-level policies (`student_skill_progress_select_consolidated`, `_insert_own`, `_update_own`) already cover any new column on the row | Postgres RLS is row-level, not column-level; a new column on an already-protected row is automatically protected. `/gsd-secure-phase` should confirm this rather than author new policies. |
| Stale-closure-safe session state                   | Redux/Zustand/external state library | `useState` + `useRef` mirror pair (established `SightReadingSessionContext` pattern)                                                                       | Project has explicitly chosen Context + ref-mirror for this exact problem across 3 phases now (combo, gradingMode, and this phase's streak/tier)                                           |
| Weighted note selection                            | A probability/sampling npm package   | ~10-line cumulative-weight array + `Math.random()`                                                                                                         | Trivial algorithm; no edge cases (locale, i18n, security) that would justify a dependency                                                                                                  |

**Key insight:** Every piece of new infrastructure this phase needs (ref-mirrored session state, JSONB merge-upsert, RLS-already-covers-new-columns) has a direct, verified precedent already shipped in this codebase for the two prior v3.7 phases and the original skill-trail system. This phase's job is extension, not invention.

## Common Pitfalls

### Pitfall 1: Assuming sight-reading nodes have a real focusNotes/contextNotes "stretch" pool to widen into

**What goes wrong:** Planner writes a task assuming `nodeConfig.focusNotes`/`contextNotes` (as passed to `SightReadingGame` via `location.state`) exists and has non-empty `focusNotes` to widen into, mirroring `NotesRecognitionGame`.
**Why it happens:** CONTEXT.md's D-02 references the "focusNotes/contextNotes split already established," which is real — but it lives on the **node's top-level `noteConfig`** (`src/data/skillTrail.js`/unit files), not on the **exercise-level `config`** object that `TrailNodeModal.jsx` passes as `nodeConfig` (see `TrailNodeModal.jsx:340`: `nodeConfig: exercise.config`). Verified across every `SIGHT_READING` exercise in `src/data/units/*.js`: `focusNotes` is always `[]` at exercise time (sight-reading only ever runs after all its notes were already taught via `NOTE_RECOGNITION`/`NOTE_CATCH`).
**How to avoid:** The "stretch" pool for a sight-reading node is the **diff between `getNodeById(nodeId).noteConfig.notePool` (superset) and the exercise's own `config.notePool` (subset, == current `gameSettings.selectedNotes` baseline)**. `getNodeById` is already imported in `SightReadingGame.jsx`. Where the exercise config already equals the full node pool (the common case — verified in ~20 of the sight-reading nodes sampled), there is genuinely nothing to widen into for note range; the tier ladder should degrade gracefully to tempo/rest-only escalation for those nodes. Free-play (non-trail, `nodeConfig === null`) sessions have no node at all — no widening lever is available; only tempo/rests apply.
**Warning signs:** A task that reads `nodeConfig.focusNotes` directly instead of calling `getNodeById(nodeId)` will silently do nothing (array is always empty), and the resulting feature will "work" in tests with mocked data but do nothing in production.

### Pitfall 2: Stale `gameSettings` closure at the exact adaptive mutation point

**What goes wrong:** `setGameSettings(tierAdjustedSettings)` is called in `handleNextExercise`, immediately followed by `loadExercisePattern()` in the same callback body. `loadExercisePattern` is a `useCallback` with `[gameSettings, ...]` in its dependency array — it was created with the **previous** render's `gameSettings`, so the pattern generates from stale (pre-tier-change) settings, not the newly escalated/eased ones.
**Why it happens:** React state setters are async; reading `gameSettings` (state) synchronously after calling its setter in the same tick does not reflect the update. This is the same class of bug the codebase already solved for `combo`/`gradingMode` via ref-mirroring, but the fix hasn't been applied to `gameSettings` itself because nothing previously needed to mutate it _and_ immediately consume it in the same synchronous call chain.
**How to avoid:** Either (a) compute the adapted settings object explicitly in `handleNextExercise` and pass it as an argument into a modified `loadExercisePattern(overrideSettings)`, or (b) maintain a `gameSettingsRef` mirror (write-through on every `setGameSettings` call, matching Pattern 1) and have `loadExercisePattern` read from the ref instead of the closed-over state.
**Warning signs:** Adaptive tempo/note-range changes appear to have a one-exercise delay (tier N's settings apply to exercise N+2, not N+1) — this exact symptom is the tell.

### Pitfall 3: perNoteAccuracy is per-exercise; nothing accumulates it across the session, and no write path exists yet

**What goes wrong:** A plan assumes persisting mastery is "just persist `summaryStats.perNoteAccuracy`" — but `summaryStats` is overwritten every exercise (the FEEDBACK-phase effect at ~1434-1522 recomputes it fresh each time), and it is never currently passed to `VictoryScreen`/`useVictoryState`, which is the only place `updateExerciseProgress`/`updateNodeProgress` (the DB write) is called — once, at session end.
**Why it happens:** `perNoteAccuracy` was added (per the existing code comment) "for future per-note mastery tracking... but is intentionally not surfaced" — it was scaffolded for exactly this phase but the plumbing stops at `summaryStats`.
**How to avoid:** Add a session-scoped accumulator (ref, e.g. `sessionMasteryRef` in `SightReadingGame.jsx` or `SightReadingSessionContext`) that merges each exercise's `perNoteAccuracy` into a running `{ pitch: { correct, total } }` total across all exercises in the session (accumulate in the same effect/place that already calls `recordSessionExercise` — `handleNextExercise`). Pass the accumulated total as a new prop through `VictoryScreen` into `useVictoryState`, then into extended `updateExerciseProgress`/`updateNodeProgress` calls. This is 4 layers of new plumbing (component state → prop → hook param → service param → DB column), not a one-line change.
**Warning signs:** A task titled "persist perNoteAccuracy" that only touches `SightReadingGame.jsx` and doesn't touch `VictoryScreen.jsx`/`useVictoryState.js`/`skillProgressService.js` is incomplete.

### Pitfall 4: Practice-mode persistence-skip precedent — mastery writes probably should follow it, but this isn't explicitly decided

**What goes wrong:** The existing per-exercise `students_score` write (`SightReadingGame.jsx` ~1527-1613) explicitly skips persistence in Practice mode (`gradingModeRef.current === GRADING_MODES.PRACTICE → setScoreSyncStatus("skipped")`), and `useVictoryState`'s trail-progress write is skipped via `suppressPersistence={isPracticeMode}` (passed from `SightReadingGame.jsx` at the `VictoryScreen` render). CONTEXT.md's D-13 says adaptivity (note range/tempo) applies in both modes, but does NOT explicitly say whether **mastery persistence** should also be Practice-mode-gated.
**Why it happens:** D-13 is scoped to ADAPT-01/02 behavior (what's presented), not ADAPT-03 (what's persisted) — a reasonable but real gap.
**How to avoid:** Given the project's consistent "Practice mode persists nothing" convention (both the score write and the trail-progress write already skip in Practice mode), the natural default is to gate the mastery write the same way (`suppressPersistence`/`isPracticeMode` check) — but this should be called out explicitly as a planning decision (see Open Questions) rather than assumed silently, since getting it wrong either loses data (never persisting in the only mode kids might actually use for low-stakes retries) or breaks the "Practice mode persists nothing" invariant kids/parents may rely on for psychological safety.
**Warning signs:** A plan that persists mastery unconditionally (ignoring grading mode) contradicts the established Practice-mode-skip pattern; a plan that never persists mastery in Practice mode but Test mode is rarely used by a given player could starve the mastery data of samples.

### Pitfall 5: Tempo tolerance clamp binds before D-06's BPM bounds at speed extremes

**What goes wrong:** `buildTimingWindows` (`useTimingAnalysis.js`) computes `scaledLate = Math.min(effectiveLate, durationMs * lateClampFraction)`. Raising tempo shortens `durationMs` for every note. At sufficiently high tempo (near the top of D-06's 1.25x envelope, especially for 8th notes), the clamp fraction (0.6 in Test mode, 0.85 in Practice) can bind **before** the raw `NOTE_LATE_MS`/`PRACTICE_TIMING` constants would, effectively giving less timing tolerance than intended at exactly the moment tempo escalation makes timing hardest.
**Why it happens:** The clamp was designed (Phase 02) to prevent tolerance-window overlap between adjacent fast notes — a legitimate concern — but it wasn't tuned with this phase's tempo-escalation range in mind.
**How to avoid:** When implementing D-06, explicitly test/verify timing-window behavior at the top of the tempo range (1.25x base, for the fastest allowed note duration in that node's `rhythmSettings.allowedNoteDurations`) in both grading modes. If the clamp binds unacceptably tight, this is a cross-phase tuning conversation (Phase 02's constants), not something to silently work around in Phase 03.
**Warning signs:** Escalated-tempo exercises produce a disproportionate rise in "late" misses independent of actual playing accuracy.

### Pitfall 6: Teacher SELECT access to the new mastery column (RLS nuance, not a bug)

**What goes wrong:** A `/gsd-secure-phase` reviewer might flag that a teacher (via the existing `student_skill_progress_select_consolidated` policy, which includes a teacher-connected-student branch) can read the new `note_mastery` column, and read ADAPT-04's wording ("only... the authenticated owning student") as violated.
**Why it happens:** ADAPT-04 in `REQUIREMENTS.md` is phrased narrowly ("only for the authenticated student"), while CONTEXT.md's D-04 clarifies the actual intent: "mirroring existing `student_skill_progress` row-level protections" — which already include teacher SELECT (by design, for teacher dashboards elsewhere in the app).
**How to avoid:** Treat D-04 (CONTEXT.md, the locked decision) as authoritative over the shorter `REQUIREMENTS.md` phrasing — mirroring existing protections is correct and intentional; do not add a column-level carve-out to exclude teachers from SELECT unless a human explicitly asks for that during `/gsd-secure-phase`. Document this nuance explicitly in that pass so it isn't flagged as a false-positive finding.
**Warning signs:** A migration that tries to write a new, narrower RLS policy scoped only to this one column — Postgres RLS doesn't work at column granularity via `USING`/`WITH CHECK` the way this would require without `SECURITY DEFINER` view tricks; simpler to leave the existing row-level policies as-is per D-04's own guidance.

## Code Examples

### Existing perNoteAccuracy calculation (the exact shape D-10 persists)

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx (~1453-1484, verified)
const perNoteAccuracy = currentPattern.notes
  .filter((event) => event.type === "note" && event.pitch)
  .reduce((acc, event) => {
    const key = event.pitch;
    if (!key) return acc;
    if (!acc[key]) {
      acc[key] = { total: 0, correct: 0, label: getNoteLabel(key) };
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
```

### Existing trail-node lookup already available in SightReadingGame.jsx

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:879 (verified, existing usage)
import { getNodeById, getTrailTabForNode } from "../../../data/skillTrail";
// ...
const node = getNodeById(nodeId);
// node.noteConfig.notePool  → full node pool (superset)
// node.noteConfig.focusNotes / contextNotes → node-level split (NOT exercise-level)
```

### Existing exercise-boundary hook point for adaptive mutation

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:2552-2575 (verified)
const handleNextExercise = useCallback(
  () => {
    if (isSessionComplete) return;
    stopMetronomePlayback();
    if (summaryStats && !exerciseRecorded) {
      recordSessionExercise(
        summaryStats.overallScore ?? 0,
        SESSION_MAX_EXERCISE_SCORE
      );
      setExerciseRecorded(true);
    }
    goToNextExercise();
    loadExercisePattern(); // <-- adaptive tier must be applied BEFORE this call resolves
  },
  [
    /* ... */
  ]
);
```

### Existing migration pattern to follow for the new column

```sql
-- Source: supabase/migrations/20260125000001_add_exercise_progress.sql (verified, existing)
ALTER TABLE student_skill_progress
ADD COLUMN IF NOT EXISTS exercise_progress JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN student_skill_progress.exercise_progress IS '...';

CREATE INDEX IF NOT EXISTS idx_student_skill_progress_exercise_progress
ON student_skill_progress USING GIN (exercise_progress);

-- New migration for this phase follows the identical shape:
-- ALTER TABLE student_skill_progress
-- ADD COLUMN IF NOT EXISTS note_mastery JSONB DEFAULT '{}'::jsonb;
-- (per-node, keyed by pitch: { "C4": { "correct": 7, "total": 9 }, ... })
```

### Existing RLS — no new policy needed (verified precedent)

```sql
-- Source: supabase/migrations/20260124000001_add_skill_trail_system.sql (verified, existing)
-- Row-level, not column-level — any new column on this table is automatically covered:
CREATE POLICY student_skill_progress_insert_own
  ON student_skill_progress FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY student_skill_progress_update_own
  ON student_skill_progress FOR UPDATE
  USING (student_id = auth.uid());
```

## State of the Art

| Old Approach                                                 | Current Approach                                                     | When Changed          | Impact                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `perNoteAccuracy` computed and discarded                     | `perNoteAccuracy` merged into a persisted `note_mastery` JSONB field | This phase (Phase 03) | Enables ADAPT-03/09 weak-note targeting; first consumer of previously-dead data          |
| Note pool only ever grows (`NotesRecognitionGame` auto-grow) | First "shrink" mechanism in the codebase (D-03 easing)               | This phase            | New pattern — no prior precedent to copy; plan for genuinely new logic here, not a reuse |
| Combo/gradingMode are the only ref-mirrored session state    | Adaptive streak/tier joins the ref-mirrored session state list       | This phase            | Extends, doesn't replace, the Phase 01/02 pattern                                        |

**Deprecated/outdated:** Nothing in this phase deprecates existing behavior — it is additive (new column, new session state, new tier logic layered on top of unchanged `generatePatternData`/`useTimingAnalysis`).

## Assumptions Log

| #   | Claim                                                                                                                                                                                                     | Section                          | Risk if Wrong                                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Mastery persistence (the DB write) should be gated by Practice/Test mode the same way the existing `students_score` write and `useVictoryState`'s `suppressPersistence` are (i.e., skip in Practice mode) | Pitfall 4                        | If wrong, either mastery data is under-sampled (if truly skipped and Practice is the dominant mode) or the "Practice mode persists nothing" UX invariant is silently broken (if it should have been skipped but isn't) — recommend confirming with the user/CONTEXT before implementation, not assuming silently |
| A2  | The node's top-level `noteConfig.notePool` (vs. the exercise's own `config.notePool`) is the correct/only legitimate "stretch" pool for D-02 widening, when one exists                                    | Pitfall 1, Architecture Patterns | If wrong (e.g., if the intended stretch pool was meant to be the full clef range, not just the node's declared superset), escalation would feel more limited than intended — but this reading is directly supported by D-02's own wording ("stay inside the node's pedagogy")                                    |
| A3  | For non-trail free-play sight-reading sessions (`nodeConfig === null`), only tempo/rest escalation applies (no note-range widening lever exists, since there's no node pool to bound it)                  | Pitfall 1                        | If wrong, free-play adaptivity would feel incomplete vs. trail-mode adaptivity — but this follows directly from D-02's "never notes outside the node's own pedagogy," and free play has no node                                                                                                                  |

**If this table is empty:** N/A — see above; all three assumptions are grounded in explicit CONTEXT.md wording but require the stated confirmations/verifications before implementation.

## Open Questions (RESOLVED)

_All three questions were decided during phase planning; the deciding plan/task is noted inline under each._

1. **Should the per-note mastery DB write be skipped in Practice mode, matching the existing persistence-skip convention?**
   - What we know: Both existing persistence paths in this exact file/flow (`students_score` write, trail-progress write via `useVictoryState`) already skip entirely in Practice mode.
   - What's unclear: CONTEXT.md's D-13 only addresses ADAPT-01/02 (in-session behavior), not ADAPT-03 (cross-session persistence) — it's silent on whether Practice-mode attempts should contribute to the mastery dataset.
   - Recommendation: Default to gating mastery writes the same way as the other two persistence paths (skip in Practice mode) for consistency and to avoid contradicting the established "Practice mode persists nothing" UX invariant; flag this as a one-line confirmation for the planner/discuss-phase rather than silently deciding either way.
   - **RESOLVED:** Plan 03-06 Task 1 — the mastery write is threaded through `useVictoryState` AFTER the existing `suppressPersistence` early-return, so Practice mode skips the mastery write "for free" (matching the other two persistence paths). No extra gate added.

2. **Where exactly should the weak-note-mastery READ happen to seed the next node-session's selection weighting?**
   - What we know: `generatePatternData` is synchronous logic but is already invoked through an `async function` wrapper (`usePatternGeneration.generatePattern`); the trail-entry flow (`buildTrailSettingsFromNode`, `TrailNodeModal.jsx` navigation) doesn't currently fetch `student_skill_progress` before navigating.
   - What's unclear: Whether the mastery fetch should happen in `TrailNodeModal.jsx` before navigation (adding an extra round-trip before the game even mounts) or inside `SightReadingGame.jsx`'s own auto-configure effect (`buildTrailSettingsFromNode`) via a fresh `getNodeProgress(studentId, nodeId)` call.
   - Recommendation: Fetch inside `SightReadingGame.jsx`'s existing node-auto-configure effect (co-located with where `nodeConfig`/`nodeId` are already consumed) rather than in `TrailNodeModal.jsx`, to keep the mastery-aware pattern generation self-contained to the sight-reading game (per the "sight-reading only, no cross-game framework" scope constraint).
   - **RESOLVED:** Plan 03-06 Task 2 — the mastery read is a `getNodeProgress(studentId, nodeId)` call inside `SightReadingGame.jsx`'s node-auto-configure effect, seeding the weighted note pool there (not in `TrailNodeModal.jsx`).

3. **Exact tier count and step granularity for the D-01/D-05 ladder.**
   - What we know: D-03 specifies "drops back one difficulty tier" (implying a small ordered list of discrete tiers, not a continuous scale); D-06 bounds tempo to ±10-15 BPM per step within 0.75x-1.25x of base.
   - What's unclear: How many discrete tiers total (e.g., 3? 5?), and whether "one tier" of easing exactly undoes "one tier" of escalation symmetrically.
   - Recommendation: A small symmetric ladder (e.g., 5 tiers: -2, -1, 0/baseline, +1, +2) where tier 0 is the node's authored baseline settings, each step changes tempo by a fixed amount within the D-06 envelope and toggles rest-inclusion/note-pool-widening at the extremes, keeps the "one tier at a time" semantics of D-03 simple and testable.
   - **RESOLVED:** Plan 03-01 Task 1 — `ADAPTIVE_TIERS` is exactly the 5-tier symmetric ladder (-2, -1, 0/baseline, +1, +2) with baseline at index 0, fixed `tempoDeltaBpm` per step inside the D-06 envelope and rest/note-pool widening toggled at the positive tiers.

## Environment Availability

| Dependency                                    | Required By                                                              | Available                                                                                                                                   | Version                    | Fallback                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase CLI                                  | Migration authoring/local apply                                          | ✗ (not found on PATH in this environment)                                                                                                   | —                          | Author SQL migration file in repo per established convention (migrations are committed, then applied separately by the project owner via Supabase dashboard/CLI outside this session — confirmed pattern: the v3.5 `20260601000001_phase1_rhythm_pedagogy.sql` migration was "committed to repo, NOT applied" until owner-gated) |
| Node.js / npm                                 | Running tests, build, lint                                               | ✓                                                                                                                                           | Node v22.15.0 / npm 11.7.0 | —                                                                                                                                                                                                                                                                                                                                |
| Vitest                                        | Unit/component tests for new adaptive logic                              | ✓                                                                                                                                           | ^3.2.4 (package.json)      | —                                                                                                                                                                                                                                                                                                                                |
| Supabase project reachability (live DB check) | Verifying RLS behavior against the actual `student_skill_progress` table | Not verified this session — no Supabase MCP tool was available in this agent's toolset despite being referenced in environment instructions | —                          | `/gsd-secure-phase` pass (explicitly required by this phase, per CONTEXT.md) should perform live RLS verification against the Supabase project directly                                                                                                                                                                          |

**Missing dependencies with no fallback:** None — the Supabase CLI absence has a clear, already-established fallback (author-then-apply-separately), consistent with every prior migration in this repo.

**Missing dependencies with fallback:** Supabase CLI (see above); live DB RLS verification (deferred to the mandatory `/gsd-secure-phase` pass this phase already requires per its own Depends-on note).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Framework          | Vitest ^3.2.4 (jsdom environment)                                                                     |
| Config file        | `vitest.config.js` (repo root)                                                                        |
| Quick run command  | `npx vitest run src/components/games/sight-reading-game/utils/adaptiveEngine.test.js` (once authored) |
| Full suite command | `npm run test:run`                                                                                    |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                                                          | Test Type                                                                                                  | Automated Command                                                                                                                                                                   | File Exists?                         |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| ADAPT-01 | Streak-driven tier escalation/easing (note range/rests/tempo) at exercise boundary                                | unit                                                                                                       | `npx vitest run src/components/games/sight-reading-game/utils/adaptiveEngine.test.js`                                                                                               | ❌ Wave 0                            |
| ADAPT-01 | `handleNextExercise` applies the freshly-computed tier, not a stale one (Pitfall 2 regression guard)              | component/integration                                                                                      | `npx vitest run src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx` (new, following `.combo.test.jsx`/`.practiceMode.test.jsx` naming convention) | ❌ Wave 0                            |
| ADAPT-02 | Tempo moves within the D-06 bounded envelope and timing windows remain sane at extremes (Pitfall 5)               | unit                                                                                                       | `npx vitest run src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` (extend existing file)                                                                     | ✅ (extend existing)                 |
| ADAPT-03 | `perNoteAccuracy` accumulates correctly across a session and merges correctly on upsert                           | unit                                                                                                       | `npx vitest run src/services/skillProgressService.test.js` (extend existing)                                                                                                        | ✅ (extend existing)                 |
| ADAPT-04 | RLS: a student cannot read/write another student's `note_mastery`; teacher SELECT still works per existing policy | manual-only (DB-level RLS test requires a live Supabase project / `/gsd-secure-phase` tooling, not Vitest) | N/A — covered by the phase's mandatory `/gsd-secure-phase` pass                                                                                                                     | N/A                                  |
| I18N-01  | New adaptive-coaching copy has EN+HE parity, RTL-correct                                                          | existing pattern                                                                                           | Existing locale-parity test/lint (per CLAUDE.md/prior-phase convention — locate via `grep -rl "parity" src/test` or similar established test)                                       | ✅ (existing infra, extend key list) |

### Sampling Rate

- **Per task commit:** targeted `npx vitest run <file>` for the file(s) touched
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`, PLUS a dedicated `/gsd-secure-phase` pass before merge (this phase's explicit, non-negotiable extra gate per its Depends-on note)

### Wave 0 Gaps

- [ ] `src/components/games/sight-reading-game/utils/adaptiveEngine.js` + `.test.js` — new module, no existing file to extend
- [ ] `src/components/games/sight-reading-game/__tests__/SightReadingGame.adaptive.test.jsx` — new integration test covering the stale-closure regression (Pitfall 2) explicitly
- [ ] `supabase/migrations/<timestamp>_add_note_mastery.sql` — new migration, follow `20260125000001_add_exercise_progress.sql` shape exactly

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies        | Standard Control                                                                                                                                                                                                                                                                              |
| --------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | No (unchanged) | Existing Supabase Auth, unaffected by this phase                                                                                                                                                                                                                                              |
| V3 Session Management | No (unchanged) | —                                                                                                                                                                                                                                                                                             |
| V4 Access Control     | Yes            | RLS row-level policies on `student_skill_progress` (existing, verified to auto-cover new columns) + `verifyStudentDataAccess()` JS gate before every service call (existing pattern, reused unchanged)                                                                                        |
| V5 Input Validation   | Yes            | New JSONB merge logic must validate pitch keys/shape before merging (avoid arbitrary key injection into `note_mastery` from malformed client state) — mirror the existing `updateExerciseProgress` pattern of trusting only server-recomputed values, not raw client payloads, where feasible |
| V6 Cryptography       | No             | Not applicable — no new secrets/crypto in this phase                                                                                                                                                                                                                                          |

### Known Threat Patterns for this stack

| Pattern                                                                                                           | STRIDE                                       | Standard Mitigation                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client sends a manipulated `perNoteAccuracy`/mastery payload to inflate/deflate another pitch's recorded accuracy | Tampering                                    | RLS already restricts the row to `student_id = auth.uid()` — the worst a malicious client can do is corrupt their **own** mastery data (no cross-student tampering possible); still worth a shape/range validation in the service layer (correct ≤ total, both non-negative integers) before upsert, consistent with existing `Math.round(Math.max(...))` clamping patterns in `skillProgressService.js` |
| Teacher/other-role over-read of a specific student's weak-note profile                                            | Information Disclosure                       | Already governed by the existing teacher-SELECT branch of `student_skill_progress_select_consolidated` — this is an accepted, existing behavior mirrored intentionally per D-04, not a new exposure introduced by this phase                                                                                                                                                                             |
| Rate-limit bypass via rapid mastery-only writes (separate from the existing `checkRateLimit` on stars/score)      | Denial of Service (of the rate-limit budget) | If the mastery write is folded into the SAME upsert call as `updateExerciseProgress`/`updateNodeProgress` (recommended, Pattern 3), it inherits the existing `checkRateLimit(studentId, nodeId)` gate for free — no separate rate limit needed. Avoid a separate stand-alone mastery-write function that bypasses this.                                                                                  |

## Sources

### Primary (HIGH confidence) — all verified directly against this repository in this session

- `src/components/games/sight-reading-game/SightReadingGame.jsx` (lines ~200-430, ~1400-1620, ~2340-2600, ~3770-3800) — trail nodeConfig wiring, perNoteAccuracy calculation, exercise-boundary handlers, VictoryScreen invocation
- `src/contexts/SightReadingSessionContext.jsx` (full file) — ref-mirror pattern precedent
- `src/components/games/sight-reading-game/utils/patternBuilder.js` (full file) — config-in/config-out confirmed, note-selection randomization logic
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js`, `constants/gradingModes.js` — tempo/timing-window clamp interaction
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` (lines ~300-360, ~1660-1720) — `buildInitialTrailPool`, auto-grow precedent, confirms no "shrink" precedent exists
- `src/services/skillProgressService.js` (full file) — `updateExerciseProgress`/`updateNodeProgress` JSONB merge-upsert pattern
- `src/hooks/useVictoryState.js` (full file) — confirmed persistence write site, `suppressPersistence` gating, confirmed `perNoteAccuracy` is NOT currently threaded through
- `src/components/trail/TrailNodeModal.jsx` (line ~340) — confirmed `nodeConfig: exercise.config`, NOT the node's top-level `noteConfig`
- `src/data/units/trebleUnit1Redesigned.js`, `trebleUnit4Redesigned.js`, `bassUnit4Redesigned.js` (direct reads + scripted scan across all `treble*`/`bass*Redesigned.js` files) — verified `focusNotes` is always empty on `SIGHT_READING`-typed exercises; verified node-level `noteConfig.notePool` superset vs. exercise-level `config.notePool` subset in `bass_4_4`/`bass_4_5`/`treble_4_4`
- `supabase/migrations/20260124000001_add_skill_trail_system.sql`, `20260125000001_add_exercise_progress.sql`, `20260128000001_consolidate_rls_policies.sql`, `20260127000003_optimize_rls_auth_plan.sql` — RLS policy history and JSONB-column migration precedent
- `src/services/authorizationUtils.js` (full file) — `verifyStudentDataAccess` JS-gate confirmed, including teacher-access branch
- `.planning/phases/03-adaptive-pedagogy/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — locked decisions, requirement text, project history

### Secondary (MEDIUM confidence)

- None — no external library research was needed for this phase; all findings verified directly against the codebase.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new dependencies; confirmed via direct grep that no weighted-random utility exists to reuse/duplicate
- Architecture: HIGH — every integration point (exercise boundary, VictoryScreen plumbing, node lookup) verified by direct file reads, not inference
- Pitfalls: HIGH — all 6 pitfalls are traced to specific line ranges in the current codebase, not hypothetical

**Research date:** 2026-07-12
**Valid until:** Effectively indefinite for the architectural findings (won't go stale without a refactor of `SightReadingGame.jsx`/`skillProgressService.js`); the "Standard Stack: no new deps" conclusion should be re-checked if the planner considers any external library during planning.
