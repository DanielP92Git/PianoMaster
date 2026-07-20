# Phase 02: Practice Tooling - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the sight-reading game from a **scored run** into a **deliberate-practice tool**. Four
client-only capabilities, no database:

- **PRAC-01** — replay the exercise audio on demand during the DISPLAY phase ("hear it again").
- **PRAC-02** — a played-vs-correct comparison playback in the FEEDBACK phase.
- **PRAC-03** — Practice vs Test grading modes (lenient/pitch-focused vs strict).
- **PRAC-04** — a Review-mistakes drill over only the wrong/missed notes of an attempt.
- **I18N-01** — all new strings ship EN + HE with RTL correctness.

**In scope:** a header mode toggle, a DISPLAY-phase replay button, a FEEDBACK-phase comparison
playback, a new `REVIEW` game phase with its own lightweight input handling, mode-parameterized
timing tolerances, mode-conditional score submission, feedback-panel button layout, EN+HE strings.

**Out of scope (this phase):** any Supabase/DB work (Phase 03), adaptive difficulty or tempo
(Phase 03), per-note mastery persistence (Phase 03), rush/drag coaching copy (SR-FUT-01, deferred),
raw-audio recording of the player, changes to the lives/game-over path (deferred in Phase 01).

</domain>

<decisions>
## Implementation Decisions

### Practice vs Test mode (PRAC-03) — scoring integrity is the anchor

- **D-01: Practice mode is UNSCORED.** A Practice run never submits a score, never awards XP, and
  never advances trail node/exercise progress — in trail mode _and_ free play. Test mode is the only
  graded path. `FeedbackSummary` still displays accuracy bars and stars for the attempt; they simply
  do not persist. Rationale: (a) progression integrity — a lenient run must not be able to buy the
  same 3 stars as a strict one, or a rational child always picks Practice and Test mode ceases to
  exist; (b) it closes an XP-farm vector alongside the existing `rateLimitService`; (c) it makes
  Practice psychologically safe — nothing is at stake, so nothing can be lost, which is the
  Phase 01 "motivation over punishment" posture applied to grading.

- **D-02: Mode lives in a single labeled header toggle.** A pill-style control with a **text label**
  (not an icon-only button) in the existing header control row, next to the BPM pill / metronome /
  input-mode / settings buttons. **No `PreGameSetup` wizard step** — trail exercises auto-start via
  the `hasAutoConfigured` path and never render `PreGameSetup`, so a setup-only chooser would be
  invisible to exactly the players SC-3 is written for. An icon alone cannot convey an abstract
  concept ("practice" vs "test") to an 8-year-old; the label is required, not decorative.

- **D-03: Default is Test.** The default must be the mode where things count, or a child practices
  for twenty minutes and never understands why the trail didn't move. Opting into Practice is a
  deliberate act. Persist the choice to `localStorage`, mirroring the existing
  `sightReadingInputMode` key.

- **D-04: Practice mode = wider timing windows AND a pitch-only overall score.** Both halves, per
  PRAC-03's "lenient timing tolerance, pitch-focused grading":
  - Timing tolerances scale up (early/late windows and the `TIMING_STATUS_MAP` perfect/good/okay
    thresholds).
  - `calculateOverallScore` drops the `pitch × 0.7 + rhythm × 0.3` blend and uses pitch accuracy
    alone. The rhythm accuracy bar **still renders** in `FeedbackSummary` — the player still sees
    their timing; it just stops dragging the number down.
  - Test mode behavior is **unchanged from today** in every respect.

- **D-05: The mode locks for the duration of a session.** The toggle is live before exercise #1 and
  greys out at the first `COUNT_IN`. It re-opens only at genuine session boundaries: `returnToSetup`,
  the settings gear (`openSettingsModal`), `handleStartNewSession`, and the "Try Again" on the
  Victory / encouragement screens. The mid-exercise "Try Again" inside `FeedbackSummary` keeps the
  current mode. Consequence: no mixed-mode sessions, no half-graded nodes, and no confusing state
  where "Next" silently refuses to appear.

- **D-06: Practice mode must be visibly, continuously legible.** The header pill shows an active
  state, and the feedback panel states plainly that a Practice attempt was not scored. Given D-01,
  silently discarding a child's result is not acceptable.

### Replay / "hear it again" (PRAC-01)

- **D-07: Replay button sits beside the Start Playing button** in the DISPLAY-phase guidance region
  (already rendered as an overlay near the keyboard dock, or floating when the keyboard is hidden).
  It appears exactly when replay is meaningful and disappears when performance begins.

- **D-08: Unlimited replays, both modes.** SC-1 says "any number of times" — this is locked by the
  requirement, not chosen. It is also correct: the auto-play already hands the child the answer
  aurally on every exercise, so capping replays would be theater rather than challenge.

- **D-09: The existing auto-play stays exactly as-is.** It still fires ~500ms into DISPLAY, in both
  modes. Replay is purely additive. A "silent Test mode" (read first, then check) was considered and
  **rejected for this phase**: Test is the default mode, so silencing it would quietly make the game
  harder for every child currently playing — a regression dressed as a feature. PRAC-03 defines the
  modes by _grading tolerance_, not by when audio plays. Captured as a deferred idea.

- **D-10: Replay is byte-for-byte the auto-play.** The same
  `rhythmPlayback.play(pattern.notes, onBeatChange)` call, the same note-by-note staff highlighting.
  No count-in preamble and no click track: "hear it again" should mean _again_, and at 60bpm a
  count-in would impose ~4 seconds of clicks on every tap — punishing precisely the child who needs
  the most repetitions. The pulse scaffold already lands in the `COUNT_IN` phase immediately before
  performance.

- **D-11 (landmine): the replay handler MUST clear `previewPlaybackTimeoutRef`.** The auto-play is
  scheduled behind a 500ms `setTimeout`. If the replay button is tappable before that timer fires,
  the exercise double-plays. Clear the pending timeout in the handler, or keep the button disabled
  until the auto-play has started.

### Played-vs-correct comparison (PRAC-02)

- **D-12: Reconstruct "your rendition" from `performanceResults` — do NOT record raw audio, and do
  NOT add a new capture log to the mic hot path.**
  - Raw-audio recording is rejected on principle: this milestone's stated Core Value is that
    children's data must be protected, and capturing a child's raw audio is a materially different
    privacy posture (COPPA) than storing note names. It also produces nothing at all in keyboard
    input mode.
  - A verbatim note-event log is rejected because it means writing into the mic-detection hot path
    that Phase B (PR #11) just finished optimizing (two 60Hz `setState` sources removed).
  - The reconstruction is lossy in the right places: **correct** notes carry a real,
    mic-latency-compensated `timeDiff`, so the child genuinely hears their own rush and drag;
    **missed** notes become silence, which is the lesson, not a limitation.

- **D-13: Build a synthetic pattern array and feed it to the existing hook.**
  `useRhythmPlayback.play()` consumes `{type, startTime, endTime, frequency}` objects, so "your
  rendition" needs no hook changes: correct note → `expectedStart + timeDiff`; wrong-pitch note →
  the detected pitch's frequency at the expected position; missed note → omitted entirely. Frequencies
  come from the existing `NOTE_FREQUENCIES` map already consumed by `patternBuilder.js`.

- **D-14: Sequential playback — yours first, then the correct one — behind ONE button.** Recency
  governs: the last thing in the child's ear must be the right answer. Two buttons ("hear mine" /
  "hear correct") were rejected — an 8-year-old should not have to assemble the comparison
  themselves, and with two buttons a child can end on their own wrong version. Simultaneous playback
  in contrasting timbres was rejected as muddy for a child. The staff highlights along with each
  pass (reuse `setCurrentNoteIndex`), so the comparison is heard _and_ seen.

- **D-15 (known gap, planner's discretion):** `wrong_pitch` notes are finalized in the post-exercise
  sweep with `timeDiff: 0`, so they will replay metronomically perfect. If worth closing cheaply,
  `lastWrongPitchRef` is already a per-note object and could carry `{pitch, timeDiff}` instead of a
  bare pitch — no _new_ hot-path state. Optional.

### Review-mistakes (PRAC-04)

- **D-16: Active drill, not passive playback.** Review steps to each mistake: the staff isolates the
  note, the correct pitch sounds, and the child **plays it** — untimed, no rhythm grading, advancing
  on a correct pitch. Passive stepping was rejected as recognition rather than recall; deliberate
  practice means corrective reps.

- **D-17: Review NEVER re-scores the attempt.** The exercise's recorded score is already final when
  the feedback phase is entered. Otherwise Test mode degenerates into retry-until-correct and stars
  become free.

- **D-18: Review NEVER touches combo or on-fire.** That state now lives session-wide in
  `SightReadingSessionContext` (Phase 01 D-05). A formative, unscored drill must not feed the
  engagement loop in either direction — no increments, no resets.

- **D-19: Review drills `wrong_pitch` + `missed` only.** Early/late notes were the _right_ note,
  read correctly and merely rushed or dragged; an untimed drill cannot fix a timing error, and
  telling a child who read every note correctly that they made six "mistakes" cuts against the
  Phase 01 motivation-over-punishment posture. This also keeps the phase clear of SR-FUT-01 (rush/drag
  coaching), which is explicitly deferred. Filter:
  `r.timingStatus === "missed" || r.timingStatus === "wrong_pitch"`.
  `getDetailedBreakdown()` already separates these from `tooEarly` / `tooLate`.

- **D-20: On a clean run (zero mistakes), the Review button is hidden, not disabled.**

- **D-21: Review is available in both modes.** It is formative and unscored, so it is
  mode-independent.

- **D-22: Review gets its own `GAME_PHASES.REVIEW` with a dedicated, lightweight detection handler.**
  It must **not** route through `handleNoteDetected`, which is bound to timing windows and explicitly
  bails when `gamePhaseRef.current !== GAME_PHASES.PERFORMANCE`. The review handler compares the
  detected pitch to the target pitch and advances on match — no timing windows, no scoring, no combo.

### Feedback panel information architecture

- **D-23 (user-selected): two rows — learn above, navigate below.**
  - Row 1 (secondary styling): `♫ Hear yours vs correct` · `↺ Review mistakes`
  - Row 2 (primary `GameActionButton`, unchanged): `Try Again` · `Next Pattern`
  - Visual hierarchy separates "understand what happened" from "what next." On a clean run the top
    row collapses (Review hidden per D-20), often to a single button.

### i18n (I18N-01)

- **D-24: New strings live under the existing `sightReading.*` namespace** (e.g.
  `sightReading.controls.*`, `sightReading.summary.*`), following Phase 01's D-07 principle of
  reusing established namespaces rather than minting new blocks. All new strings ship EN + HE with
  RTL correctness. Mode labels, the replay button, the compare button, the review UI, and the
  "practice run — not scored" notice all need copy.

### Claude's Discretion

The owner delegated every decision in this phase except D-23 (feedback panel layout). The following
remain genuinely open for the planner:

- The exact leniency multiplier for Practice-mode tolerances (D-04) — see the clamp landmine in
  `<code_context>`. A ~2x widening is the starting hypothesis, not a locked value.
- Whether to close the `wrong_pitch` timing gap (D-15).
- Exact copy and iconography for the mode pill, replay, compare, and review controls.
- Whether the comparison playback inserts an audible/visual divider between the two passes.
- Whether the Review drill plays the target pitch automatically on entering each note, or on demand.
- Whether Practice mode also suppresses the anti-cheat penalty modal (`showPenaltyModal` /
  `guessPenaltyRef`) — it is moot under D-01 since nothing is submitted, but the modal is a
  punishment affordance in an explicitly safe mode.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase docs

- `.planning/ROADMAP.md` §"Phase 02: Practice Tooling" — goal + the five success criteria.
- `.planning/REQUIREMENTS.md` — PRAC-01 … PRAC-04, I18N-01, and the Out-of-Scope table.
- `.planning/phases/01-engagement-hud-parity/01-CONTEXT.md` — **required.** Establishes
  motivation-over-punishment (D-01/D-02), session-wide combo in `SightReadingSessionContext` (D-05),
  reuse-shared-i18n (D-07), and reduced-motion-inside-components (D-08). D-18 above depends on it.
- `~/.claude/plans/analyze-the-entire-codebase-valiant-hejlsberg.md` (Phase D) — origin of this
  milestone's feature list.

### Primary integration surface

- `src/components/games/sight-reading-game/SightReadingGame.jsx` — ~3,900 lines. `GAME_PHASES`
  (line ~83), the header control row (~line 3606), the DISPLAY guidance region (~line 3710),
  `loadExercisePattern` + `previewPlaybackTimeoutRef` auto-play (~line 2206), `handleNoteDetected`
  and its `PERFORMANCE`-only guards, the missed-note reconciliation sweep (~line 2095), and the
  Victory / encouragement end paths (~line 3489).

### Playback, timing, and scoring

- `src/components/games/sight-reading-game/hooks/useRhythmPlayback.js` — `play(pattern, onBeatChange)`
  / `stop()`. Consumes `{type, startTime, endTime, frequency}`. Powers PRAC-01 and PRAC-02 unchanged.
- `src/components/games/sight-reading-game/hooks/useTimingAnalysis.js` — `buildTimingWindows`,
  `evaluateTiming`, and the module-level `TIMING_STATUS_MAP` (perfect ≤100ms / good ≤200 / okay ≤300).
  **The mode-parameterization target for D-04.**
- `src/components/games/sight-reading-game/constants/timingConstants.js` — `NOTE_EARLY_MS` 200,
  `NOTE_LATE_MS` 300, `FIRST_NOTE_EARLY_MS` 500.
- `src/components/games/sight-reading-game/utils/scoreCalculator.js` — `calculateOverallScore`
  (`pitch × 0.7 + rhythm × 0.3`), `getDetailedBreakdown` (the `missed` / `wrongPitch` vs
  `tooEarly` / `tooLate` split that D-19 relies on), `getPerformanceRating`.
- `src/components/games/sight-reading-game/utils/patternBuilder.js` — source of `NOTE_FREQUENCIES`
  usage for D-13's synthetic pattern.

### UI surfaces

- `src/components/games/sight-reading-game/components/FeedbackSummary.jsx` — the two-button panel
  that D-23 restructures into two rows. Uses shared `GameActionButton`.
- `src/components/games/sight-reading-game/components/SightReadingLayout.jsx` — the layout contract.
  Note the `guidance` region's three render paths (over-keyboard / floating / overlay) — D-07's
  replay button lands in the DISPLAY branch of these.
- `src/components/games/shared/hud/GameActionButton.jsx` — primary button (row 2 of D-23).

### State

- `src/contexts/SightReadingSessionContext.jsx` — session aggregation, plus the Phase 01 session-wide
  `combo` / `isOnFire` / `incrementCombo` / `resetCombo`. D-18 forbids the review drill from touching
  these. Likely home for the session-locked mode flag (D-05).

### i18n

- `src/locales/en/common.json` + `src/locales/he/common.json` — `sightReading.*` namespace (D-24)
  and the shared `games.engagement.*` block.

### Project conventions

- `.planning/codebase/CONVENTIONS.md` — naming, export patterns, Tailwind glassmorphism, i18n/RTL
  rules, localStorage preference keys.
- `CLAUDE.md` §"Testing" — Vitest + JSDOM; `*.test.jsx` siblings or `__tests__/`.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`useRhythmPlayback.play(pattern, onBeatChange)`** — already schedules pitched sine oscillators at
  rhythmic positions, skips rests, drives staff highlighting via a 50ms interval, and internally calls
  `stop()` before starting. Serves PRAC-01 (replay) and PRAC-02 (both comparison passes) **without
  modification** — the comparison just feeds it a synthetic pattern array.
- **`NOTE_FREQUENCIES`** (consumed by `patternBuilder.js`) — note-name → Hz map for reconstructing
  wrong-pitch playback.
- **`getDetailedBreakdown()`** — already partitions results into `missed` / `wrongPitch` vs
  `tooEarly` / `tooLate`, which is exactly the D-19 review filter.
- **`GameActionButton`** (`shared/hud/`) — the primary button used in `FeedbackSummary` row 2.
- **Header icon-button row** — the established slot/styling for the mode toggle (metronome, input
  mode, settings all follow the same `rounded-lg p-1.5 sm:p-2` + active-bg pattern).

### Established Patterns

- **`performanceResults[]` record shape:**
  `{ noteIndex, expected, detected, frequency, timing, timingStatus, timeDiff, isCorrect, timestamp, phase }`.
  Correct notes carry a real `timeDiff`; `missed` and `wrong_pitch` are finalized in the post-exercise
  sweep with `timeDiff: 0` and (for missed) `detected: null`. This asymmetry is the entire basis of
  D-12 / D-15.
- **Ref-mirror discipline in the mic path:** `gamePhaseRef`, `performanceResultsRef`,
  `metronomeEnabledRef` etc. exist because the pitch-detection loop holds stale closures. Any new
  mode flag read inside detection callbacks needs the same treatment. Phase B (PR #11) deliberately
  removed 60Hz `setState` sources — do not reintroduce state writes into that loop.
- **Trail entry bypasses `PreGameSetup`:** `nodeConfig`/`nodeId` from `location.state` drive a
  `hasAutoConfigured` auto-start effect (~line 340-372). This is why D-02 rejects a setup-only mode
  chooser.
- **localStorage preference keys:** `sightReadingInputMode` is the model for D-03's persisted mode.

### Integration Points

- **Mode flag** → `SightReadingSessionContext` (session-scoped, locked at first count-in per D-05),
  mirrored to a ref for detection-callback reads, persisted to `localStorage`.
- **Tolerances** → `useTimingAnalysis({ tempo, mode })` and `timingConstants.js` become
  mode-parameterized.
- **Score submission** → the existing submit path must become a no-op in Practice mode (D-01),
  covering XP, `students_score`, and `skillProgressService` node/exercise progress.
- **Replay button** → the DISPLAY branch of `SightReadingLayout`'s `guidance` region.
- **Compare + Review buttons** → a new secondary row inside `FeedbackSummary` (D-23).
- **`GAME_PHASES.REVIEW`** → a new phase value; must be added to `SightReadingLayout`'s `phase` prop
  contract and to the `activePhases` list that drives `pauseTimer()`/`resumeTimer()`
  (`SessionTimeoutContext`), or the session-timeout will fire mid-drill.

### Landmines

- **The tolerance clamp binds before the constant does.** `buildTimingWindows` computes
  `Math.min(NOTE_LATE_MS, durationMs * 0.6)` and
  `Math.min(TIMING_TOLERANCES.early, durationMs * 0.5)`. At fast tempos the duration-fraction clamp
  wins, so simply raising `NOTE_LATE_MS` buys nothing on eighth notes at 120bpm. Practice-mode
  leniency must scale **both** the base constants and the clamp fractions.
- **Double-play on replay** — see D-11 (`previewPlaybackTimeoutRef`).
- **Wider windows shift miss finalization later**, which delays the live combo break introduced in
  Phase 01 (D-04). Expected and acceptable, but worth a test.
- **`SightReadingGame.jsx` is ~149KB.** Prefer extracting the review drill and the comparison-playback
  builder into their own modules under `sight-reading-game/` rather than growing the file further.

</code_context>

<specifics>
## Specific Ideas

- The owner selected the feedback-panel layout from a mockup: a **secondary row** (`♫ Hear yours`,
  `↺ Review`) sitting directly above the existing **primary row** (`Try Again`, `Next ›`), inside the
  same glass card as the rating, stars, accuracy bars, and breakdown chips.
- Every other decision in this phase was explicitly delegated ("you decide", "you decide for best
  UX"). The decisions above are therefore Claude's, made against two standing owner principles
  carried from Phase 01: **motivation over punishment**, and **reuse shared components/namespaces
  rather than forking**.

</specifics>

<deferred>
## Deferred Ideas

- **Silent-first Test mode** (drop the DISPLAY auto-play in Test so the child reads before hearing;
  keep it in Practice as scaffolding). Pedagogically attractive — it makes the two modes differ in
  _kind_, not just tolerance, and it is arguably what "sight" reading means. Rejected for Phase 02
  because Test is the default mode and silencing it would regress the experience for every existing
  player, and because PRAC-03 defines the modes by grading tolerance only. Revisit as its own
  discussed change, not as a side effect of this phase. (D-09)
- **Rush/drag coaching that names the internal-pulse error** — already tracked as **SR-FUT-01** in
  `.planning/REQUIREMENTS.md` v2. D-19 deliberately keeps early/late notes out of the Review drill so
  this phase does not half-implement it.
- **Capped replays in Test mode** — considered and rejected (D-08); SC-1 mandates unlimited, and the
  auto-play already reveals the exercise aurally.
- **Raw-audio capture of the player's rendition** — rejected on COPPA/privacy grounds (D-12). If ever
  revisited, it needs its own `/gsd-secure-phase` pass and a parent-consent story, and it does not
  work in keyboard input mode.

</deferred>

---

_Phase: 02-practice-tooling_
_Context gathered: 2026-07-10_
