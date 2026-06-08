# Phase 36: Game Screen UI Unification - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract NotesRecognitionGame's inline HUD/shell into reusable shared components under
`src/components/games/shared/hud/`, then adopt them across the other 8 game screens **where they
fit** — component-based reuse, not forced uniformity. HUD presentation only; no game-mechanics,
scoring, or pattern-generation changes. NotesRecognitionGame is the reference and must come out of
the extraction with zero visual/behavioral regression.

The HUD is split into two layers for adoption purposes:

- **Base shell** — X-of-N progress bar, score pill, back/exit nav, answer feedback.
- **Engagement layer** — lives/hearts, combo pill, on-fire mode, speed-bonus flash, tier-up popup.

</domain>

<spec_lock>

## Requirements (locked via SPEC.md)

**7 requirements are locked.** See `36-SPEC.md` for full requirements, boundaries, and acceptance
criteria. Downstream agents MUST read `36-SPEC.md` before planning or implementing. Requirements
are not duplicated here.

**In scope (from SPEC.md):**

- Extract NotesRecognition HUD → shared components in `src/components/games/shared/` (this phase: `shared/hud/`)
- Refactor NotesRecognitionGame to consume the extracted components (no regression)
- Adopt shared HUD in other games per the agreed adoption matrix (see D-01..D-04 below)
- De-duplicate ArcadeRhythmGame's inline lives/combo/on-fire
- Unify MixedLessonGame's progress-bar style with the shared component
- Visual/design-system consistency pass on adopted HUD elements

**Out of scope (from SPEC.md):**

- Game mechanics / scoring logic changes (HUD presentation only)
- VexFlow notation rendering internals; tile/card grid layouts; piano-keyboard reveals
- The mic "listen" button and accidentals picker (game-specific)
- `UnifiedGameSettings` (already shared) and VictoryScreen/GameOverScreen internals (wiring only)
- New gameplay features, new game modes, or new engagement mechanics
- Non-game screens (dashboard, trail map, settings pages)

</spec_lock>

<decisions>
## Implementation Decisions

### Adoption Matrix

- **D-01: Base shell goes to ALL exercise-based games.** Progress bar (X-of-N) + score pill +
  back/exit nav + answer feedback are adopted by every game that runs a fixed-length session:
  SightReadingGame, RhythmReadingGame, RhythmDictationGame, MixedLessonGame, NoteComparisonGame,
  IntervalGame, MemoryGame, and MetronomeTrainer (in trail/exercise mode). Maximum
  "looks like NotesRecognition" consistency. NotesRecognitionGame is the reference and consumes all
  of it.
- **D-02: Engagement layer goes to FAST-RECALL games only.** Combo pill + on-fire + speed-bonus +
  tier-up reach the ear-training games (NoteComparisonGame, IntervalGame) and ArcadeRhythmGame
  (which already has its own inline versions → de-dup target). Slow/staff-based games
  (SightReading, RhythmReading, RhythmDictation, MixedLesson, Memory, Metronome) get **base shell
  only** — no combo/on-fire/lives. Rationale: the arcade engagement feel suits fast quiz pacing,
  not slow staff reading or a metronome practice tool.
- **D-03: MixedLessonGame's divergent progress bar is replaced by the shared `ProgressBar`** (locked
  REQ-04). MixedLesson currently has its own progress-bar style — unify it onto the shared component.
- **D-04: NotesRecognition-only pieces stay in NotesRecognition.** The timer (timed mode) and the
  trail-mode new-note unlock banner (auto-grow note pool) are not forced onto other games. The
  `TimerDisplay` may still be extracted as a shared component for cleanliness, but NotesRecognition
  is its only consumer this phase. The unlock banner is game-specific and is not extracted.

### Sequencing (layer-by-layer)

- **D-05: Three waves, each fully lands before the next.**
  - **Wave 1** — Extract the base-shell components into `shared/hud/` and refactor
    NotesRecognitionGame to consume them, proving zero visual/behavioral regression against the
    reference. (Base shell delivers most of the value; prove it on the gold standard first.)
  - **Wave 2** — Roll the base shell out to all other exercise-based games (D-01), including the
    MixedLesson progress-bar unification (D-03).
  - **Wave 3** — Extract the engagement layer, de-duplicate ArcadeRhythmGame onto it, and add
    combo/on-fire to the ear-training games (D-02, D-08).
- **D-06: Smallest blast radius per step.** This ordering keeps the risky reference refactor (Wave 1)
  isolated and lets base-shell rollout (the bulk of the consistency win) ship before any
  engagement-layer behavior is touched.

### Lives & GameOver

- **D-07: No new GameOver paths this phase.** The only games with a lives→GameOverScreen path remain
  the two that already have it: NotesRecognitionGame and ArcadeRhythmGame. `LivesDisplay` is
  extracted and consumed by exactly those two.
- **D-08: Ear-training gets combo/on-fire but NO lives.** NoteComparisonGame and IntervalGame keep
  their always-finish-all-questions model — wrong answers cost no life, no early GameOver, always
  end on VictoryScreen. They gain the combo pill + on-fire glow for engagement only. Rationale:
  audio-discrimination drills are hard; ending a short ear-training session early on a miss is more
  punishing than motivating. Satisfies REQ-05's "games where game-over does not apply are documented
  (not forced)."
- **D-09: ArcadeRhythmGame's existing lives/combo/on-fire behavior is preserved exactly** after
  de-duplication onto the shared components (REQ-03) — including its current GameOver path and
  landscape lock.

### Component API & Naming

- **D-10: Hybrid contract — value-in props, animation encapsulated.** Each shared HUD component
  receives plain values/flags as props (e.g. `combo={5}`, `lives={2}`, `onFire={true}`,
  `value`/`label` for the score pill) and internally runs its own transient animations (combo
  shake, on-fire splash, tier-up fly-to-score) when props change. Parents never manage animation
  timers. Components read reduced-motion from `AccessibilityContext` themselves (no
  `reducedMotion`/`shouldShake` prop wiring per game). Not pure-presentational (too much duplicated
  animation orchestration) and not self-contained-stateful (would couple game logic into the HUD).
- **D-11: Score pill is one configurable component.** `ScorePill` takes a `value` + optional
  `label`/unit + optional combo-tint flag. Each game passes what it actually tracks: XP for
  NotesRecognition, "X correct" for ear-training, score/accuracy for rhythm/sight-reading.
  Combo-tint is enabled only where the engagement layer is present (D-02). No game is forced to
  start computing per-question XP it doesn't already track.
- **D-12: `src/components/games/shared/hud/` subfolder with clean names.** Components live in a
  dedicated `hud/` subfolder using the audit's clean names — `ProgressBar`, `ScorePill`,
  `LivesDisplay`, `ComboPill`, `OnFireBadge`/`OnFireSplash`, `TimerDisplay`, `SpeedBonusFlash`,
  `TierUpPopup`. The folder namespaces them (imports read as `hud/ProgressBar`), avoiding collisions
  with any generic/dashboard progress bars — no verbose prefixes needed.

### Sequencing vs v3.5

- **D-13: Independent of v3.5 owner UAT — proceed in parallel.** Per SPEC, this phase touches
  game-screen UI, not rhythm trail data, and has no hard dependency on v3.5's pending owner UAT.
  Milestone-roll (archive v3.5 / update STATE.md) stays deferred to `/gsd-complete-milestone`.

### Claude's Discretion

- Exact prop names and signatures within the hybrid contract (D-10) — planner/executor settle the
  precise API following existing component conventions in the codebase.
- Whether `TimerDisplay` is extracted as a shared component (single consumer) or left inline in
  NotesRecognitionGame (D-04) — planner judges based on extraction cleanliness.
- Whether the on-fire effect ships as one component or the `OnFireBadge` + `OnFireSplash` split the
  audit named — planner decides based on how the inline JSX factors out.
- How finely Wave 2 is split into plans (per-game vs per-cluster) — planner sizes the plans.
- Plan-level decisions about per-game wiring of the configurable `ScorePill` label/value (D-11).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap

- `.planning/phases/36-game-screen-ui-unification/36-SPEC.md` — **Locked requirements (7), boundaries,
  acceptance criteria. MUST read before planning.** Contains the full UI gap matrix (9 games) and the
  clean-extraction candidate list.
- `.planning/ROADMAP.md` (v3.6 / Phase 36 section) — Goal, seeded REQ-01..REQ-07, numbering note
  (phase is 36 not 01, deliberate).

### Carried-Forward Phase Context (load-bearing)

- `.planning/phases/35-arcaderhythmgame-portrait/35-CONTEXT.md` — ArcadeRhythmGame is landscape-aware
  via `NeedsLandscapeContext`; de-dup must not break its landscape lock. Ship-don't-gold-plate +
  owner-UAT-on-real-devices posture (D-04..D-07).
- `.planning/phases/34-responsive-rhythm-renderers-non-arcade/34-CONTEXT.md` — Rhythm games declare
  `needsLandscape` via `useDeclareNeedsLandscape` (D-15..D-17); manual UAT gate on iPhone SE + iPad
  (D-12); glass-pattern design-system conversion precedent (D-18). Shared HUD must preserve these.

### Design System & Constraints

- `docs/DESIGN_SYSTEM.md` — Glassmorphism on purple gradient; the visual contract all adopted HUD
  pieces follow (REQ-04).
- `CLAUDE.md` (Design System + Game Session Flow + Game Component Integration sections) — Glass Card
  Pattern classes; the `handleNextExercise`/`hasAutoStartedRef` trail-integration pattern each game
  uses; the dual-array game-route registration rule.

### Existing Code Surface

- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — **The reference.** Inline HUD
  to extract: progress bar, score pill, lives (3 hearts), combo pill, on-fire badge/splash,
  speed-bonus flash, tier-up popup, timer, answer feedback. Must come out zero-regression.
- `src/components/games/shared/` — Destination root; existing shared pieces (`UnifiedGameSettings`,
  `AudioInterruptedOverlay`, `noteSelectionUtils`). New components go in `shared/hud/` (D-12).
- `src/components/games/VictoryScreen.jsx`, `src/components/games/GameOverScreen.jsx` — Already shared;
  wiring only, internals out of scope.
- `src/contexts/AccessibilityContext.jsx` — Reduced-motion source the HUD components read internally
  (D-10).
- Adoption targets (base shell unless noted):
  - `src/components/games/sight-reading-game/SightReadingGame.jsx`
  - `src/components/games/rhythm-games/RhythmReadingGame.jsx`
  - `src/components/games/rhythm-games/RhythmDictationGame.jsx`
  - `src/components/games/rhythm-games/MixedLessonGame.jsx` (progress-bar unify, D-03)
  - `src/components/games/rhythm-games/MetronomeTrainer.jsx` (trail/exercise mode)
  - `src/components/games/notes-master-games/MemoryGame.jsx`
  - `src/components/games/ear-training-games/NoteComparisonGame.jsx` (base shell + engagement, no lives)
  - `src/components/games/ear-training-games/IntervalGame.jsx` (base shell + engagement, no lives)
  - `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` (de-dup engagement layer, D-09)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **NotesRecognitionGame inline HUD** — the source of truth for every shared component; extraction is
  "lift the JSX + its animation logic into `hud/`, swap reduced-motion lookups to internal."
- **`shared/UnifiedGameSettings`, `shared/AudioInterruptedOverlay`** — precedent for the shared-game
  component pattern and folder placement.
- **`VictoryScreen` / `GameOverScreen`** — already shared end-of-game screens; games adopting the
  base shell wire to these (no internals changes).
- **`NeedsLandscapeContext` + `useDeclareNeedsLandscape`** (Phase 34/35) — landscape behavior the
  rhythm games + ArcadeRhythm rely on; HUD adoption must not disturb it.

### Established Patterns

- **Glass Card Pattern** (`bg-white/10 backdrop-blur-md border-white/20`, `-300` accent numbers,
  `text-white/70` secondaries) — all HUD components follow it.
- **`hasAutoStartedRef` / `handleNextExercise` trail integration** — each game's exercise loop; the
  HUD plugs into existing session state, it does not change the loop.
- **Reduced-motion via `AccessibilityContext`** — every HUD animation must honor it (read internally
  per D-10).
- **Dual-array game-route registration** (`LANDSCAPE_ROUTES` in App.jsx + `gameRoutes` in
  AppLayout.jsx) — not changed by this phase, but a known landmine when touching game screens.

### Integration Points

- Shared HUD components mount inside each game's existing render tree, fed by that game's existing
  state (score, current question index, combo, lives where present).
- ArcadeRhythmGame swaps its inline lives/combo/on-fire JSX for `hud/` imports while preserving its
  landscape-locked layout.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly likes **NotesRecognitionGame's UI** (progress bar, nav buttons, feedback
  screen, score, hearts) and wants the other screens to look like it — NotesRecognition is the
  gold standard, others adopt the fitting subset.
- The split into **base shell** (everyone) vs **engagement layer** (fast-recall only) is the
  organizing principle the user endorsed — consistency without forcing an arcade feel onto slow
  staff/practice games.

</specifics>

<deferred>
## Deferred Ideas

- **Engagement layer (combo/on-fire/lives) on slow/staff games** — SightReading, RhythmReading,
  RhythmDictation, MixedLesson, Memory deliberately excluded this phase (D-02). If a future phase
  wants to arcade-ify them, that's its own scope.
- **Lives→GameOver for ear-training** — considered and rejected for this phase (D-08); revisit only
  if owner testing shows kids want the stakes.
- **Trail-mode new-note unlock banner as a shared component** — stays NotesRecognition-specific
  (D-04); could be generalized later if another game grows an auto-expanding pool.

None of these block Phase 36 — discussion stayed within scope.

</deferred>

---

_Phase: 36-game-screen-ui-unification_
_Context gathered: 2026-06-08_
