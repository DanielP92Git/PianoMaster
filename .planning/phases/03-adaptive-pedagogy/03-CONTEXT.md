# Phase 03: Adaptive Pedagogy - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The sight-reading game adapts in real time to how the player is doing — widening or narrowing
difficulty and tempo within a session — and remembers per-note weaknesses across sessions so
future practice can target them. This is the only phase in v3.7 that touches the database; it
gets its own `/gsd-secure-phase` pass before merge.

**In scope:**

- **ADAPT-01** — in-session difficulty escalation/easing (note range, rests, tempo) driven by a
  new dedicated success/struggle streak counter.
- **ADAPT-02** — adaptive tempo, implemented as the same lever/tier ladder as ADAPT-01 (not a
  separate axis).
- **ADAPT-03** — per-note mastery (accuracy per pitch, scoped per node) persisted via a new JSONB
  field on `student_skill_progress`, actively used to bias note selection toward historically-weak
  pitches in later sessions.
- **ADAPT-04** — RLS protection on the new field, mirroring existing `student_skill_progress`
  row-level protections; verified by a dedicated `/gsd-secure-phase` pass.
- **I18N-01** (cross-cutting) — any new adaptive-coaching / leveling-up copy ships EN+HE with RTL
  correctness.

**Out of scope (this phase):**

- Any lives/game-over mechanics (deferred permanently per Phase 01 D-01/D-02).
- Changes to Phase 02's grading-mode logic itself (Practice unscored / Test scored) — Phase 03
  only makes adaptivity apply within both modes, it does not touch scoring rules.
- Rush/drag coaching that names the internal-pulse error (tracked as SR-FUT-01, v2 backlog).
- Cross-game adaptive-difficulty framework — this milestone keeps adaptivity scoped to
  sight-reading only (explicit REQUIREMENTS.md Out of Scope entry).
- Display-only surfacing of mastery data in parent/teacher views (not requested; targeting is the
  only surfaced use of the persisted data in this phase).

</domain>

<decisions>
## Implementation Decisions

### In-session difficulty escalation (ADAPT-01)

- **D-01: A new, dedicated adaptive-difficulty streak counter drives escalation/easing** —
  separate from Phase 01's session-wide HUD combo (`SightReadingSessionContext`). This decouples
  pedagogy-tuning thresholds from motivational-HUD tuning (combo tiers 3/8, on-fire at 5): the two
  systems can use different sensitivities without one dragging on the other, and the HUD combo's
  reset-on-any-miss semantics don't have to double as the difficulty-easing signal.
- **D-02: Escalation widens into the node's `contextNotes`, reusing the `focusNotes`/`contextNotes`
  split** already established by `NotesRecognitionGame`'s auto-grow-note-pool precedent
  (`hiddenNodeNotesRef`/`buildInitialTrailPool`). Widening stays scoped to notes the node author
  already defined as a stretch — never notes outside the node's own pedagogy.
- **D-03: Easing triggers on N consecutive misses** (concretely: 2-3 in a row, planner's discretion
  on exact N) and drops back one difficulty tier — narrows toward the node's core `focusNotes`,
  removes rests, lowers tempo. This is the first "shrink" mechanism in the codebase; there is no
  existing precedent to reuse (NotesRecognitionGame's auto-grow only ever grows).
  _Owner-confirmed 2026-07-12: implemented as >=3 missed notes WITHIN one exercise, evaluated at the
  exercise boundary (per-exercise miss count, not a live consecutive-miss run). This interpretation is
  final — execute/verify should not re-flag it._
- **D-04: Escalation/ease events apply only at the next exercise boundary**, never mid-pattern.
  Patterns are generated as a whole via a config-in/config-out call (`patternBuilder.js`
  `generatePatternData`) with baked-in `startTime`/`endTime` values for playback and mic timing
  windows — regenerating or rescheduling mid-pattern is not supported by the current architecture
  and risks mic-timing bugs. The adaptive engine mutates the `gameSettings` fed into the _next_
  `generatePatternData` call, exactly like `usePatternGeneration` already does per-exercise.

### Adaptive tempo (ADAPT-02)

- **D-05: Tempo is the SAME lever as ADAPT-01's difficulty tiers, not a separate axis.** One streak
  counter (D-01) drives one tier ladder; tempo is one of the properties bundled into each tier
  alongside note range and rests. This avoids two independently-moving adaptive state machines.
- **D-06: BPM moves in small fixed steps within a bounded range** — target ~±10-15 BPM per tier
  step, clamped to roughly 0.75x-1.25x of the node's configured base tempo (`gameSettings.tempo`).
  Exact step size and clamp fractions are planner's discretion within this envelope. The bound
  exists so tempo changes are felt but never break the node's rhythmic character (e.g. turning
  quarter notes into an unreadable blur, or into an untestable crawl).
- **D-07: Tempo changes apply only at exercise boundaries** (same constraint as D-04) — tempo is
  part of `gameSettings` fed into the next pattern generation call. `useRhythmPlayback` and
  `useTimingAnalysis` both re-derive from `gameSettings.tempo`, but only cleanly at a fresh
  pattern's generation, not mid-pattern (the current pattern's timings are already baked in).

### Per-note mastery scope & use (ADAPT-03)

- **D-08: Mastery is tracked per node, not globally per pitch.** Mirrors the existing
  `exercise_progress` JSONB-array-on-per-(student,node)-row precedent
  (`skillProgressService.js`, migration `20260125000001_add_exercise_progress.sql`). A pitch's
  difficulty is node-contextual — e.g. C4 in a beginner node vs. C4 in a key-signature node are
  different skills — so a single global "C4 accuracy" number would blur meaningfully different
  contexts together.
- **D-09: Persisted mastery actively targets weak notes, not display-only.** Per ADAPT-03's
  explicit "enabling weak-note targeting across sessions," future-session pattern generation should
  bias toward including a student's historically-weak pitches more often — but strictly _within_
  the node's existing note pool (same "stay inside the node's pedagogy" principle as D-02). No
  external notes are introduced by mastery targeting.
- **D-10: Mastery value shape is simple cumulative accuracy: `{ pitch: { correct, total } }`**,
  merged/incremented across sessions — no recency-weighting or decay algorithm. This directly
  reuses the additive shape of the in-session `perNoteAccuracy` calculation already present in
  `SightReadingGame.jsx` (lines ~1453-1484, currently computed then discarded); persisting it is
  now a merge-and-increment operation rather than a new algorithm.
- **D-11: Weak-note targeting requires a minimum-attempts threshold before it influences
  selection** — e.g. ≥3-5 recorded attempts on a pitch before its accuracy is trusted enough to
  bias selection (exact N is planner's discretion). Prevents a single missed note — possibly a
  mic-detection false negative rather than a real mistake — from permanently flagging a pitch as
  "weak" after just one encounter.

### Player-facing legibility & mode interaction

- **D-12: Escalation gets a visible, positive-only cue; easing is silent.** A brief "leveling up"
  style moment (in keeping with Phase 01's motivation-over-punishment posture — the same spirit as
  celebrating on-fire) plays when difficulty/tempo rises. Easing back down after a struggle happens
  with no explicit UI signal — a child is never shown a "you're doing worse" message. Exact
  copy/animation is planner's discretion but must respect `prefers-reduced-motion` per established
  project convention.
- **D-13: Adaptivity (ADAPT-01/02) applies in BOTH Practice and Test grading modes** from Phase 02.
  Adaptivity governs _what's presented_ (note range, rests, tempo); Phase 02's grading mode governs
  _how it's scored_ (lenient vs. strict tolerances). These are orthogonal — a Test-mode session
  still benefits from staying in the child's flow zone, and Test's strict timing tolerances are
  unaffected by which notes/tempo get chosen for the next exercise.

### Claude's Discretion

- Exact N for "consecutive misses" that triggers easing (D-03) — starting hypothesis 2-3.
- Exact BPM step size and clamp fractions within the D-06 envelope (±10-15 BPM, 0.75x-1.25x base).
- Exact minimum-attempts threshold for weak-note targeting (D-11) — starting hypothesis 3-5.
- Exact copy, iconography, and animation for the escalation "leveling up" cue (D-12).
- Whether the adaptive-difficulty streak counter (D-01) lives in `SightReadingSessionContext`
  alongside combo/mode-lock state, or is scoped more locally — planner's call, but the established
  pattern in that context (parallel `useState`/`useRef` pairs, reset in `startSession`/
  `resetSession`) should be followed if it does.
- The exact JSONB column name and shape for per-node mastery (D-10 fixes the logical shape
  `{ pitch: { correct, total } }`; the column name, migration structure, and whether it nests under
  a new top-level key vs. a new column is implementation detail for the researcher/planner).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase docs

- `.planning/ROADMAP.md` §"Phase 03: Adaptive Pedagogy" — goal + five success criteria.
- `.planning/REQUIREMENTS.md` — ADAPT-01 … ADAPT-04, I18N-01, and the Out-of-Scope table
  (explicitly excludes a cross-game adaptive-difficulty framework — sight-reading only).
- `.planning/phases/01-engagement-hud-parity/01-CONTEXT.md` — **required.** Establishes
  motivation-over-punishment (D-01/D-02 there), session-wide combo in `SightReadingSessionContext`
  (D-05 there, distinct from this phase's D-01), reuse-shared-i18n conventions.
- `.planning/phases/02-practice-tooling/02-CONTEXT.md` — **required.** Establishes Practice/Test
  grading-mode architecture (D-01 through D-06 there) that this phase's D-13 makes adaptivity
  apply orthogonally to.
- `~/.claude/plans/analyze-the-entire-codebase-valiant-hejlsberg.md` (Phase D) — origin of this
  milestone's feature list, items 8-10 (adaptive difficulty, adaptive tempo, per-note mastery).

### Primary integration surface

- `src/components/games/sight-reading-game/SightReadingGame.jsx` — `~3,900` lines. The existing
  per-exercise `perNoteAccuracy` calculation (~line 1453-1484, keyed by pitch:
  `{ [pitch]: { total, correct, label, accuracy } }`), attached to `summaryStats` (~line 1507) but
  currently discarded — this is what D-10 persists instead of discarding.

### Pattern generation & difficulty knobs

- `src/components/games/sight-reading-game/utils/patternBuilder.js` — `generatePatternData({
difficulty, timeSignature, tempo, selectedNotes, clef, measuresPerPattern, rhythmSettings,
rhythmComplexity, keySignature })`. Config-in/config-out, deterministic per call — no internal
  adaptive state. The mutation target for D-01/D-02/D-03/D-06/D-09: the adaptive engine changes the
  `gameSettings` object fed into this call between exercises.
- `src/components/games/sight-reading-game/hooks/usePatternGeneration.js` — thin `useCallback`
  wrapper around `generatePatternData`.

### Tempo & timing

- `gameSettings.tempo` (`SightReadingGame.jsx` ~line 272, `DEFAULT_SETTINGS`) is the single tempo
  source. Feeds pattern generation, `useRhythmPlayback({ tempo })`
  (`hooks/useRhythmPlayback.js:9`), and `useTimingAnalysis({ tempo })`
  (`hooks/useTimingAnalysis.js:21-28`). Mic-timing windows also derive directly from
  `gameSettings?.tempo` (`SightReadingGame.jsx` ~line 970-991).

### Session state

- `src/contexts/SightReadingSessionContext.jsx` — session aggregation. Current shape: exercise
  counters, scoring, session status, Phase 01's `combo`/`isOnFire` (+ refs, `ON_FIRE_THRESHOLD=5`),
  Phase 02's `gradingMode`/`isModeLocked` (+ refs). Established pattern for new session-scoped
  adaptive state (D-01's streak counter, current difficulty tier): parallel `useState`/`useRef`
  pairs, reset in both `startSession` and `resetSession`, exposed via the memoized context value.

### Note-pool precedent

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — auto-grow-note-pool logic
  (~line 1687-1718; constants ~line 322-324: `ON_FIRE_THRESHOLD=5`, `MAX_EXTRA_NOTES=3`,
  `GROW_INTERVAL=3`). `hiddenNodeNotesRef`/`buildInitialTrailPool` build the `focusNotes`/
  `contextNotes` split D-02 reuses. Note: this file has no "shrink" counterpart — D-03's easing
  mechanism is new.
- `src/data/skillTrail.js` — `getNextNodeInCategory()` (~line 488-500) exists but is dead code
  (unused, referenced only in a comment). Not relevant to this phase's per-node scoping (D-08).

### Persistence precedent & RLS

- `src/services/skillProgressService.js` (~line 385-494) — `updateExerciseProgress()`, the direct
  precedent for the D-08/D-10 JSONB shape: reads/updates a JSONB field on the
  `student_skill_progress` row, upserts via `.upsert(progressData, { onConflict:
'student_id,node_id' })`. **Note:** this JSONB array uses the key `index`, not `exerciseIndex` —
  established project convention.
- `supabase/migrations/20260125000001_add_exercise_progress.sql` — migration precedent: `ALTER
TABLE ... ADD COLUMN IF NOT EXISTS exercise_progress JSONB DEFAULT '[]'::jsonb` + `COMMENT ON
COLUMN` + GIN index. Template for the new mastery-field migration.
- `supabase/migrations/20260124000001_add_skill_trail_system.sql` (lines ~30-63) and
  `supabase/migrations/20260128000001_consolidate_rls_policies.sql` (lines ~15-29) — existing RLS
  policies on `student_skill_progress` (`student_skill_progress_select_consolidated`,
  `_insert_own`, `_update_own`, teacher-view policy). ADAPT-04's mirroring target: the new JSONB
  column is a new column on an already-RLS-protected row, so existing row-level policies cover it
  automatically — the `/gsd-secure-phase` pass should confirm this explicitly rather than assume it
  needs new policies.

### i18n

- `src/locales/en/common.json` + `src/locales/he/common.json` — `sightReading.*` namespace
  (established in Phase 02 D-24) is where any new escalation-cue copy (D-12) should live, per the
  reuse-established-namespaces convention from Phase 01/02.

### Project conventions

- `.planning/codebase/ARCHITECTURE.md` — provider hierarchy, service-layer pattern
  (`verifyStudentDataAccess()` before every DB operation), defense-in-depth authorization.
- `.planning/codebase/INTEGRATIONS.md` §"Content Gate" and §"Key Database Tables" —
  `student_skill_progress` row shape and RLS gate pattern.
- `CLAUDE.md` §"Gamification Trail System" → "Key Database Concepts" — confirms
  `student_skill_progress` per-node stars/best-score/`exercise_progress` JSONB shape.
- `CLAUDE.md` §"Testing" — Vitest + JSDOM; `*.test.jsx` siblings or `__tests__/`.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`perNoteAccuracy` calculation** (`SightReadingGame.jsx` ~1453-1484) — already computes exactly
  the per-pitch `{ correct, total }` shape D-10 needs; currently discarded on component
  unmount/reset. Persisting it is a merge-and-increment against the existing DB value, not a new
  calculation.
- **`focusNotes`/`contextNotes` split + `hiddenNodeNotesRef`/`buildInitialTrailPool`**
  (`NotesRecognitionGame.jsx`) — direct precedent for D-02's escalation note-pool source.
- **`updateExerciseProgress()`** (`skillProgressService.js`) — direct precedent for reading/merging
  a JSONB field on `student_skill_progress` via upsert.
- **Ref-mirror pattern** (`comboRef`, `gradingModeRef`, etc. in `SightReadingSessionContext.jsx`) —
  the established way to expose new session-scoped adaptive state (streak counter, current tier) to
  the mic-detection callbacks that hold stale closures.

### Established Patterns

- **Config-in/config-out pattern generation:** `generatePatternData()` takes a full settings object
  and returns a pattern; it has no memory of prior calls. Adaptive state must live outside this
  function (in session context or a hook) and be threaded into `gameSettings` before each call —
  this function itself does not need new adaptive logic, only new inputs.
- **`gameSettings.tempo` single-source:** confirmed only one seam to change tempo; downstream hooks
  re-derive automatically, but only correctly at pattern-generation boundaries (see D-04/D-07).
- **JSONB-on-per-(student,node)-row:** the established shape for anything that needs to persist
  per-node, per-student state without a new table (`exercise_progress` is the existing example;
  this phase's mastery field follows the same shape).

### Integration Points

- **Adaptive streak counter + current tier** → new session-scoped state in
  `SightReadingSessionContext`, following the Phase 01/02 `useState`+`useRef` pattern.
- **Tier → `gameSettings` mutation** → wherever the next exercise's `gameSettings` is assembled
  before calling `usePatternGeneration`/`generatePatternData`.
- **Mastery read** → on session/node start, fetch the persisted per-pitch mastery from
  `student_skill_progress` and feed it into note-pool weighting for generation.
- **Mastery write** → on exercise/session completion, merge this attempt's `perNoteAccuracy` into
  the persisted mastery field via an upsert alongside (or inside) the existing
  `updateExerciseProgress()`/`updateNodeProgress()` flow (`useVictoryState.js`).
- **Escalation cue** → a new, reduced-motion-aware UI moment, likely near the existing on-fire
  splash/badge rendering (`shared/hud/OnFireBadge.jsx`/`OnFireSplash.jsx`) for visual consistency,
  though this is a distinct concept from combo and should not literally reuse those components
  without a naming/meaning check.

### Landmines

- **Tempo tolerance clamp** (documented in 02-CONTEXT.md, still relevant): `buildTimingWindows`
  clamps to `Math.min(NOTE_LATE_MS, durationMs * 0.6)` etc. — raising tempo shortens `durationMs`,
  which can bind the clamp before D-06's BPM bounds do. The planner should re-verify timing-window
  behavior at the tempo extremes this phase introduces.
- **`gamePhaseRef`-style stale closures:** any new adaptive streak/tier state read inside the
  mic-detection callback needs the same ref-mirror treatment as combo/mode, or it will read stale
  values (established landmine, not new to this phase).
- **`SightReadingGame.jsx` is ~150KB+** (grew further in Phase 02). Prefer extracting the adaptive
  engine (tier logic, mastery merge) into its own module under `sight-reading-game/` rather than
  growing this file further — same guidance Phase 02's context gave for the review drill.
- **Minimum-attempts threshold (D-11) needs a "cold start" fallback:** a node with no prior
  mastery data (first-ever session) has zero pitches meeting the threshold — targeting logic must
  degrade gracefully to uniform/default selection, not error or bias toward nothing.

</code_context>

<specifics>
## Specific Ideas

- The owner explicitly followed the "recommended" option on nearly every question in this
  discussion (11 of 13 primary decisions), consistent with the delegation pattern from Phase 02:
  trust Claude's proposed defaults when they're grounded in existing code precedent, engage more
  actively only when a decision has real product-shape consequences (which here showed up as two
  free-response-style choices being implicitly validated by picking the precedent-grounded option
  each time — the owner is optimizing for reuse and internal consistency across all three phases of
  this milestone).
- Both standing owner principles from Phase 01/02 apply directly here: **motivation over
  punishment** (D-12's silent-easing/visible-escalation asymmetry) and **reuse shared
  components/namespaces rather than forking** (D-02, D-08, D-10 all explicitly reuse existing
  shapes/precedents rather than inventing new ones).

</specifics>

<deferred>
## Deferred Ideas

- **Display-only surfacing of per-note mastery** (e.g., a parent/teacher view of a child's weak
  notes) — not requested this phase; D-09 scopes persisted mastery to active targeting only. Could
  be a future dashboard/parent-portal feature once the underlying data exists.
- **Recency-weighted / decayed mastery** — considered and rejected in favor of simple cumulative
  accuracy (D-10). If a child's weak notes turn out to be "sticky" forever under the cumulative
  model even after they improve, decay is the natural follow-up, but it's unvalidated complexity
  for v1.
- **Separate independently-moving tempo axis** — considered and rejected (D-05) in favor of tempo
  riding the same tier ladder as note-range/rest escalation. Could be revisited if user testing
  shows the coupling feels wrong (e.g., a child who's rhythmically solid but pitch-shaky gets
  tempo increases they don't want alongside note-range increases they do).
- **Visible easing with careful positive framing** — considered and rejected (D-12) in favor of
  fully silent easing, to minimize any risk of a struggle-triggered UI reading as punishment even
  with careful copy. Revisit only if playtesting shows silent easing feels confusing rather than
  protective.
- Rush/drag coaching (SR-FUT-01) and cross-game adaptive-difficulty framework remain out of scope
  per `.planning/REQUIREMENTS.md` — already tracked there, not new to this discussion.

</deferred>

---

_Phase: 03-adaptive-pedagogy_
_Context gathered: 2026-07-11_
