# Phase 02: Practice Tooling - Research

**Researched:** 2026-07-10
**Domain:** Client-only React game-feature integration (sight-reading game: playback, timing tolerances, grading modes, review drill, i18n)
**Confidence:** HIGH — every integration claim below was verified by reading the actual source in this worktree; no new external libraries are involved.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Practice vs Test mode (PRAC-03) — scoring integrity is the anchor

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

#### Replay / "hear it again" (PRAC-01)

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

#### Played-vs-correct comparison (PRAC-02)

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

#### Review-mistakes (PRAC-04)

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

#### Feedback panel information architecture

- **D-23 (user-selected): two rows — learn above, navigate below.**
  - Row 1 (secondary styling): `♫ Hear yours vs correct` · `↺ Review mistakes`
  - Row 2 (primary `GameActionButton`, unchanged): `Try Again` · `Next Pattern`
  - Visual hierarchy separates "understand what happened" from "what next." On a clean run the top
    row collapses (Review hidden per D-20), often to a single button.

#### i18n (I18N-01)

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

### Deferred Ideas (OUT OF SCOPE)

- **Silent-first Test mode** (drop the DISPLAY auto-play in Test so the child reads before hearing;
  keep it in Practice as scaffolding). Rejected for Phase 02 because Test is the default mode and
  silencing it would regress the experience for every existing player, and because PRAC-03 defines
  the modes by grading tolerance only. Revisit as its own discussed change. (D-09)
- **Rush/drag coaching that names the internal-pulse error** — already tracked as **SR-FUT-01** in
  `.planning/REQUIREMENTS.md` v2. D-19 deliberately keeps early/late notes out of the Review drill so
  this phase does not half-implement it.
- **Capped replays in Test mode** — considered and rejected (D-08); SC-1 mandates unlimited, and the
  auto-play already reveals the exercise aurally.
- **Raw-audio capture of the player's rendition** — rejected on COPPA/privacy grounds (D-12). If ever
  revisited, it needs its own `/gsd-secure-phase` pass and a parent-consent story, and it does not
  work in keyboard input mode.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                              | Research Support                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRAC-01 | During the read/display phase the player can replay the exercise audio on demand ("hear it again"), beyond the single existing auto-play | `useRhythmPlayback.play()` verified reusable as-is (internally calls `stop()` first); guidance-region DISPLAY branch located (SightReadingGame.jsx:3710-3720); double-play landmine confirmed and clearance point identified (`previewPlaybackTimeoutRef`, declared :583, scheduled :2250, already cleared in `beginPerformanceWithPattern` :2978)                                                      |
| PRAC-02 | Feedback-phase played-vs-correct comparison playback                                                                                     | `performanceResults` record shape verified; synthetic-pattern construction path verified (`NOTE_FREQUENCIES` in `constants/staffPositions.js:168`); sequential-pass chaining mechanism found (`onBeatChange(-1)` end-of-pattern signal, useRhythmPlayback.js:173-179); **visual-highlight gap discovered** (see Pitfall 6)                                                                              |
| PRAC-03 | Practice vs Test grading modes (lenient/pitch-focused vs strict)                                                                         | All tolerance surfaces mapped (`TIMING_STATUS_MAP`, `timingConstants.js`, clamp fractions in `buildTimingWindows`, raw `NOTE_LATE_MS` uses in miss sweep); ALL score-persistence paths enumerated for D-01 gating (per-exercise `updateStudentScore` effect :1420-1496, `useVictoryState` trail progress + free-play XP + streak + daily challenge)                                                     |
| PRAC-04 | Review-mistakes mode stepping through only wrong/missed notes                                                                            | `getDetailedBreakdown()` filter verified; input-routing choke points identified (`handleNoteEvent` :932, `handleKeyboardNoteInput` :1976, PC-keydown :2010 — all guarded by `canScoreNow`, which returns `false` for any new phase); `audioEngine.playPianoSound(volume, pitchName)` verified for target-pitch playback; layout/timeout/keyboard-band phase lists that must include `REVIEW` enumerated |
| I18N-01 | All new strings EN+HE with RTL correctness and locale parity                                                                             | `sightReading.*` namespace verified at exact 52/52 EN↔HE parity today; parity-gate test template exists (`src/locales/__tests__/scaffolding-card-parity.test.js`); RTL convention verified (`i18n.dir() === "rtl"`, CONVENTIONS.md:322-329)                                                                                                                                                            |

</phase_requirements>

## Summary

This phase is pure client-side integration work inside an already-hardened game. **No new npm
packages are needed** — every capability maps onto existing, verified assets: `useRhythmPlayback`
for both replay and comparison playback, `NOTE_FREQUENCIES` for synthetic-pitch reconstruction,
`getDetailedBreakdown()` for the review filter, `GameActionButton` for the feedback panel, and the
established localStorage / ref-mirror / parity-test patterns for mode persistence and i18n gating.

The research confirms CONTEXT.md's decisions are implementable as written, and surfaces **five
material additions** the planner must design around: (1) `useVictoryState` awards XP **even in free
play** and triggers streak updates at ≥80% — D-01's "never awards XP" requires gating the
VictoryScreen write path, not just the per-exercise score submit; (2) `canScoreNow()` returns
`false` for any phase it doesn't know, so the REVIEW drill's input must branch **before** that
guard in `handleNoteEvent` / `handleKeyboardNoteInput`; (3) `setCurrentNoteIndex` produces **no
visible staff highlight** outside the performance/feedback coloring paths — D-14's "staff
highlights along with each pass" needs a small `VexFlowStaffDisplay` extension, it does not come
for free; (4) `useRhythmPlayback` has no completion callback, but `onBeatChange(-1)` fires exactly
once at end-of-pattern and is a reliable done-signal for chaining the two comparison passes;
(5) the miss-finalization sweep and completion check use raw `NOTE_LATE_MS` as fallbacks — the
primary path reads `windowEnd` from the (mode-scalable) timing windows, so practice leniency flows
through automatically, but the two raw-constant fallbacks must be scaled too or documented as
accepted.

**Primary recommendation:** Extract the three new capabilities into their own modules
(`utils/comparisonPattern.js`, a review-drill hook/component, a mode constants module) rather than
growing the 3,995-line `SightReadingGame.jsx`; put the mode flag in `SightReadingSessionContext`
with a ref mirror; gate all four persistence paths behind one `isPracticeMode` check; and ship a
Wave-0 `sightReading.*` EN↔HE parity test (passes today at 52/52) before adding any strings.

## Architectural Responsibility Map

| Capability                                     | Primary Tier                               | Secondary Tier               | Rationale                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Replay button (PRAC-01)                        | Browser/Client (React game component)      | —                            | Reuses in-memory pattern + Web Audio scheduling; no data leaves the client                                                      |
| Comparison playback (PRAC-02)                  | Browser/Client                             | —                            | Reconstruction from in-memory `performanceResults`; explicitly no persistence (D-12, COPPA)                                     |
| Mode toggle + tolerances (PRAC-03)             | Browser/Client (context + hooks)           | Browser localStorage         | Grading is client-computed today; mode is a UI preference persisted like `sightReadingInputMode`                                |
| Practice-mode score suppression (PRAC-03/D-01) | Browser/Client (service-call gating)       | Backend (Supabase) untouched | The client simply does not call `updateStudentScore` / trail-progress / XP paths; no RLS or schema change — DB work is Phase 03 |
| Review drill (PRAC-04)                         | Browser/Client                             | —                            | New game phase + lightweight input handler; no persistence by design (D-17)                                                     |
| i18n strings (I18N-01)                         | Browser/Client (locale JSON + parity test) | —                            | Static resources, gated by Vitest parity test                                                                                   |

**Sanity check:** nothing in this phase belongs to the API/DB tier. Any plan task that writes a
migration, touches RLS, or adds a Supabase call is out of scope (Phase 03 owns DB work).

## Standard Stack

### Core (all existing — zero new dependencies)

| Asset                                           | Location                                             | Purpose                                                                                                                                                                                                                                                                       | Status                                    |
| ----------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `useRhythmPlayback`                             | `sight-reading-game/hooks/useRhythmPlayback.js`      | Replay (PRAC-01) + both comparison passes (PRAC-02). `play(pattern, onBeatChange)` consumes `{type, startTime, endTime, frequency}`; skips rests; calls `stop()` internally before starting; 50ms highlight interval; emits `onBeatChange(-1)` once at pattern end (:173-179) | [VERIFIED: file read] Reusable unchanged  |
| `NOTE_FREQUENCIES`                              | `sight-reading-game/constants/staffPositions.js:168` | Note-name → Hz map for synthetic wrong-pitch playback. **Correction to CONTEXT.md:** it lives in `staffPositions.js`, not `patternBuilder.js` (which imports it)                                                                                                              | [VERIFIED: grep]                          |
| `useTimingAnalysis`                             | `sight-reading-game/hooks/useTimingAnalysis.js`      | Mode-parameterization target: module-level `TIMING_STATUS_MAP` (perfect ≤100 / good ≤200 / okay ≤300, :4-8), `buildTimingWindows` clamps (:53-56), `evaluateTiming` (:82-100)                                                                                                 | [VERIFIED: file read]                     |
| `timingConstants.js`                            | `sight-reading-game/constants/timingConstants.js`    | `NOTE_EARLY_MS` 200, `NOTE_LATE_MS` 300, `FIRST_NOTE_EARLY_MS` 500                                                                                                                                                                                                            | [VERIFIED: file read]                     |
| `scoreCalculator.js`                            | `sight-reading-game/utils/scoreCalculator.js`        | `calculateOverallScore` (pitch×0.7 + rhythm×0.3, :55-57) — practice mode swaps to pitch-only; `getDetailedBreakdown` (:103-149) — the D-19 review filter                                                                                                                      | [VERIFIED: file read]                     |
| `SightReadingSessionContext`                    | `src/contexts/SightReadingSessionContext.jsx`        | Home for the session-locked mode flag; already owns combo/on-fire (D-18 forbids review touching `incrementCombo`/`resetCombo`)                                                                                                                                                | [VERIFIED: file read]                     |
| `GameActionButton`                              | `games/shared/hud/GameActionButton.jsx`              | Primary row-2 buttons in FeedbackSummary (already used there)                                                                                                                                                                                                                 | [VERIFIED: FeedbackSummary.jsx:4,187-203] |
| `audioEngine.playPianoSound(volume, pitchName)` | `src/hooks/useAudioEngine.js:533`                    | Review-drill target-pitch playback; accepts a note-name string (pitch-shifts from G4 sample) — already used by `handleKeyboardNoteInput` (:1979)                                                                                                                              | [VERIFIED: file read]                     |
| i18next + `common.json`                         | `src/locales/{en,he}/common.json`                    | `sightReading.*` (52 keys, exact EN↔HE parity today) + shared `games.engagement.*`                                                                                                                                                                                           | [VERIFIED: node script over both files]   |

### Supporting

| Asset                             | Location                                                | When to Use                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FEEDBACK_COLORS`                 | `sight-reading-game/constants/feedbackPalette.js`       | Review-drill UI coloring — reuse the colorblind-safe palette already used by breakdown chips                                                      |
| Parity-test template              | `src/locales/__tests__/scaffolding-card-parity.test.js` | Copy `collectPaths` pattern for a `sightReading.*` EN↔HE gate (Wave 0)                                                                           |
| Component-test template           | `SightReadingGame.combo.test.jsx`                       | The Phase 01 mock harness (stateful `useSightReadingSession` mock, captured `onNoteEvent`, `vi.hoisted` spies) is the direct model for PRAC tests |
| `localStorage` preference pattern | SightReadingGame.jsx:324 (read), :604 (write effect)    | Mirror for the D-03 mode key (suggest `sightReadingGradingMode`, allowlist-validated)                                                             |

### Alternatives Considered

| Instead of                                                                         | Could Use                                               | Tradeoff                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onBeatChange(-1)` end signal for chaining comparison passes                       | Add an `onComplete` param to `useRhythmPlayback.play()` | The `-1` signal exists today and requires zero hook changes, but is subtle; an explicit optional `onComplete` is a 5-line additive change and self-documenting. Either is acceptable; do NOT compute durations and chain with bare `setTimeout` (drifts vs the audio clock and breaks if `stop()` is called) |
| Extending `VexFlowStaffDisplay` with a playback-highlight prop for feedback/review | Accept audio-only comparison                            | D-14 explicitly promises "heard _and_ seen"; see Pitfall 6 — a small additive prop is the honest fix                                                                                                                                                                                                         |
| Mode flag in `SightReadingSessionContext` + ref mirror in the game                 | Local `useState` in SightReadingGame                    | Context matches D-05's session-lock semantics and Phase 01 precedent; a ref mirror is mandatory either way for detection-callback reads                                                                                                                                                                      |

**Installation:** none — no new packages. [VERIFIED: all capabilities map to existing code]

## Architecture Patterns

### System Architecture Diagram

```
                       ┌──────────────────────────────────────────────────────────┐
                       │ SightReadingSessionContext (session-scoped)               │
                       │  combo/onFire (P1) · NEW: gradingMode + lock state        │
                       └───────────────▲──────────────────────────────────────────┘
                                       │ mode read/lock at boundaries
 localStorage ──(load on mount)──► mode│                    localStorage ◄─(persist on change)
                                       │
 ┌─────────────────────────────────────┴───────────────────────────────────────────┐
 │ SightReadingGame.jsx — phase state machine                                       │
 │                                                                                  │
 │ SETUP ─► DISPLAY ─► COUNT_IN ─► PERFORMANCE ─► FEEDBACK ─► (NEW) REVIEW          │
 │           │  ▲          ▲            │             │  ▲         │                │
 │           │  │          │            │             │  └─────────┘ enter/exit     │
 │  auto-play│  │replay    │mode LOCKS  │misses via   │                             │
 │  (500ms   │  │(PRAC-01) │here (D-05) │windowEnd    │compare (PRAC-02)            │
 │  timeout) │  │          │            │sweep        │= synthetic pattern ─┐       │
 │           ▼  │          │            ▼             ▼                     │       │
 │      ┌────────────┐     │      performanceResults[]──► buildPlayedRendition()    │
 │      │useRhythm-  │◄────┼──────────────────────────────────────┘        │       │
 │      │Playback    │◄─── correct pattern (pass 2) ◄────────────────────── ┘       │
 │      └─────┬──────┘                                                              │
 │            │ onBeatChange(idx | -1 at end)                                       │
 │            ▼                                                                     │
 │      setCurrentNoteIndex ──► VexFlowStaffDisplay (NEEDS playback-highlight       │
 │                              extension for feedback/review phases — Pitfall 6)   │
 │                                                                                  │
 │ INPUT ROUTING (mic + keyboard):                                                  │
 │  useMicNoteInput.onNoteEvent ─► handleNoteEvent ─┬─ phase==REVIEW? ─► NEW review │
 │  KlavierKeyboard ─► handleKeyboardNoteInput ─────┤   handler (pitch-match only,  │
 │  PC keydown ─────────────────────────────────────┘   no canScoreNow, no combo)   │
 │                                        └─ else ─► handleNoteDetected (unchanged, │
 │                                                   PERFORMANCE-gated)             │
 │                                                                                  │
 │ PERSISTENCE GATE (D-01 — Practice mode short-circuits ALL of these):             │
 │  FEEDBACK effect ─► updateStudentScore (students_score row)        [skip]        │
 │  VictoryScreen ─► useVictoryState ─► updateExercise/NodeProgress,  [skip/gate]   │
 │                    awardXP (trail AND free play), streak update,                 │
 │                    completeDailyChallenge                                        │
 │  recordSessionExercise ─► session totals (display-only — keep)                   │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (additions only)

```
src/components/games/sight-reading-game/
├── constants/
│   └── gradingModes.js            # NEW: MODE constants, PRACTICE multipliers, localStorage key
├── hooks/
│   ├── useTimingAnalysis.js       # MODIFIED: accepts { tempo, mode }
│   └── useReviewDrill.js          # NEW: mistake list, current target, advance-on-match
├── utils/
│   ├── comparisonPattern.js       # NEW: buildPlayedRendition(patternNotes, performanceResults)
│   ├── comparisonPattern.test.js  # NEW: pure-function tests (the PRAC-02 core logic)
│   └── scoreCalculator.js         # MODIFIED: mode-aware overall score
├── components/
│   ├── FeedbackSummary.jsx        # MODIFIED: two-row layout (D-23), practice notice (D-06)
│   ├── ReviewDrillPanel.jsx       # NEW: review UI (staff isolation info, progress, exit)
│   └── VexFlowStaffDisplay.jsx    # MODIFIED (small): playback-highlight for feedback/review
src/locales/__tests__/
└── sight-reading-parity.test.js   # NEW (Wave 0): sightReading.* EN↔HE gate
```

Rationale: `SightReadingGame.jsx` is 3,995 lines [VERIFIED: `grep -c`]. CONTEXT.md's instruction to
extract is correct; the mode/pattern/drill logic is all pure or hook-shaped and testable in isolation.

### Pattern 1: Ref-mirror for detection-callback reads

**What:** Any flag read inside mic/keyboard callbacks needs a `useRef` mirror updated alongside
state, because the pitch-detection loop holds stale closures (`gamePhaseRef`,
`performanceResultsRef`, `metronomeEnabledRef` all exist for this reason).
**When to use:** the new `gradingModeRef` and any review-drill target ref.
**Example (existing precedent):**

```javascript
// Source: src/contexts/SightReadingSessionContext.jsx:27-48 (Phase 01)
const [combo, setCombo] = useState(0);
const comboRef = useRef(0);
const incrementCombo = useCallback(() => {
  comboRef.current += 1;
  setCombo(comboRef.current);
  // ...
}, []);
```

Phase B (PR #11) removed two 60Hz `setState` sources from the mic hot path — do not reintroduce
state writes inside detection callbacks. The review handler should mutate refs and issue at most
one `setState` per _advance_ (a per-correct-note event, not per-frame).

### Pattern 2: Mode-parameterized timing (both constants AND clamps)

**What:** `buildTimingWindows` computes `scaledLate = Math.min(NOTE_LATE_MS, durationMs * 0.6)` and
`early = Math.min(TIMING_TOLERANCES.early, durationMs * 0.5)` (useTimingAnalysis.js:53-56). At fast
tempos the duration-fraction clamp wins, so raising only the constants buys nothing on eighth notes
at 120bpm. Practice leniency must scale both.
**Recommended shape (2x hypothesis, clamps bounded below full overlap):**

```javascript
// NEW: constants/gradingModes.js
export const GRADING_MODES = { PRACTICE: "practice", TEST: "test" };
export const PRACTICE_TIMING = {
  toleranceMultiplier: 2, // NOTE_EARLY 200→400, NOTE_LATE 300→600, FIRST_EARLY 500→1000
  lateClampFraction: 0.85, // vs 0.6 in Test
  earlyClampFraction: 0.75, // vs 0.5 in Test
  statusMultiplier: 2, // TIMING_STATUS_MAP 100/200/300 → 200/400/600
};
```

Keep clamp fractions < 1.0: window matching picks the earliest pending window containing the
detection (SightReadingGame.jsx:1608-1662), so overlap is tolerated but grows misattribution risk
on repeated pitches. Test mode passes through untouched (D-04: "unchanged in every respect").

Wiring: `useTimingAnalysis({ tempo, mode })` — `mode` must be a dependency of `buildTimingWindows`
so `timingWindowsRef` rebuilds via the existing effect (SightReadingGame.jsx:1031-1039). Since D-05
locks the mode before the first COUNT_IN and windows rebuild on every pattern load, no mid-exercise
rebuild ever occurs.

### Pattern 3: Synthetic pattern for "your rendition" (D-13)

See Code Examples. Key verified facts: correct results carry real `timeDiff` (:1845);
missed/wrong-pitch are finalized in the sweep with `timeDiff: 0` (:2117-2127); `lastWrongPitchRef`
values are **bare pitch strings** (:1924) — CONTEXT.md's D-15 wording ("already a per-note object")
refers to the ref being a per-note _map_; closing the gap means storing `{pitch, timeDiff}` as the
value, and `timeDiff` is already computed in scope at the wrong-pitch site, so it is genuinely cheap.

### Pattern 4: localStorage preference with allowlist validation

```javascript
// Source pattern: SightReadingGame.jsx:322-330 (sightReadingInputMode)
const stored = localStorage.getItem("sightReadingGradingMode");
const initialMode =
  stored === GRADING_MODES.PRACTICE
    ? GRADING_MODES.PRACTICE
    : GRADING_MODES.TEST;
```

Default-to-Test on any unrecognized value satisfies D-03 and closes the "tampered localStorage"
edge (see Security Domain).

### Pattern 5: Locale parity gate before copy lands (Wave 0)

Copy `src/locales/__tests__/scaffolding-card-parity.test.js`'s `collectPaths` approach against
`enCommon.sightReading` / `heCommon.sightReading`. Verified to pass today (52/52 exact parity), so
the gate is green at introduction and becomes load-bearing the moment Phase 02 strings land.

### Anti-Patterns to Avoid

- **Routing review input through `handleNoteDetected`:** it requires `wallClockStartTimeRef`
  (:1544 hard-returns without it) and `canScoreNow` — both meaningless in REVIEW. D-22 is
  structurally enforced by the code; branch in `handleNoteEvent`/`handleKeyboardNoteInput` instead.
- **Chaining comparison passes with duration-computed `setTimeout`:** drifts from the audio clock
  and breaks on early `stop()`. Use the `onBeatChange(-1)` end signal (or an added `onComplete`).
- **Growing `SightReadingGame.jsx`:** extract; the file is at 3,995 lines.
- **New i18n namespace blocks:** D-24 mandates `sightReading.*`.
- **State writes in the mic hot path:** Phase B regression risk.

## Don't Hand-Roll

| Problem                                    | Don't Build                                     | Use Instead                                               | Why                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scheduling pitched playback with envelopes | New oscillator scheduling for replay/comparison | `useRhythmPlayback.play()`                                | Already handles attack/sustain/decay envelopes, rest-skipping, cleanup, highlight interval, and self-stop; verified byte-for-byte suitable (D-10) |
| Pitch → frequency conversion               | A local note→Hz table                           | `NOTE_FREQUENCIES` (staffPositions.js:168)                | Single source of truth; already covers accidentals (F#4 tested in patternBuilder.test.js:281-289)                                                 |
| Mistake classification                     | Re-deriving wrong/missed from raw results       | `getDetailedBreakdown()` + the D-19 `timingStatus` filter | Already distinguishes `missed`/`wrongPitch` from `tooEarly`/`tooLate` with the exact semantics D-19 needs                                         |
| Single-note audition in review             | New oscillator for target pitch                 | `audioEngine.playPianoSound(0.6, pitchName)`              | Same call the keyboard uses (:1979) — identical timbre to what the child plays                                                                    |
| Star thresholds / rating labels            | New rating logic for practice display           | `getPerformanceRating()` → `calculateStarsFromPercentage` | Keeps in-game stars consistent with trail persistence thresholds (95/80/60)                                                                       |
| EN↔HE drift detection                     | Manual locale review                            | Vitest parity gate (template exists)                      | i18next silently falls back on missing keys; only a static test makes drift unshippable                                                           |
| Primary action buttons                     | Custom buttons in FeedbackSummary row 2         | `GameActionButton` (`tone="retry"`/`"advance"`)           | v3.6 shared HUD single-source-of-truth                                                                                                            |

**Key insight:** this codebase already contains a complete audio/timing/scoring toolkit for
sight-reading; every PRAC feature is a _recomposition_ of verified parts plus thin new UI. The main
genuinely-new logic is ~50 lines: the synthetic-pattern builder and the review-drill state machine.

## Common Pitfalls

### Pitfall 1: Double-play on replay (D-11) — confirmed, with exact mechanics

**What goes wrong:** `loadExercisePattern` schedules auto-play behind a 500ms `setTimeout`
(:2250-2255). A replay tap before it fires plays immediately; then the timer fires and `play()`
restarts the pattern from the top (its internal `stop()` kills the in-flight replay — so the
symptom is a restart, still wrong).
**How to avoid:** the replay handler clears `previewPlaybackTimeoutRef` first — exactly as
`beginPerformanceWithPattern` already does (:2978-2981). Copy that block.
**Warning sign in tests:** assert `rhythmPlayback.play` called exactly once after tap + timer flush.

### Pitfall 2: D-01 has FOUR persistence paths, not one

**What goes wrong:** gating only the per-exercise `updateStudentScore` effect (:1420-1496) leaves
Practice runs still writing trail progress, XP, streak, and daily-challenge completion at session
end. Verified in `src/hooks/useVictoryState.js`: trail `updateExerciseProgress`/`updateNodeProgress`

- `awardXP` (:344-500), **free-play XP** (:501-516), **streak update when score ≥80%** (:329-332),
  and `completeDailyChallenge` (imported in VictoryScreen.jsx:12).
  **How to avoid:** the plan must decide the Practice-mode session-end path explicitly. Cleanest
  options: (a) in Practice mode, route session completion to the encouragement-style screen (with
  practice-appropriate copy) and never render `VictoryScreen`; or (b) pass a `suppressPersistence`
  prop through `VictoryScreen` → `useVictoryState`. Option (a) avoids touching the shared
  `useVictoryState` used by other games; note the encouragement screen currently shows
  `sightReading.session.totalXp` copy (:3540-3543), which is misleading in Practice mode and needs a
  variant string.
  **Warning signs:** a Practice run moving the trail, extending the streak, or completing a daily goal.

### Pitfall 3: `canScoreNow()` silently eats REVIEW input

**What goes wrong:** `canScoreNow` (:1042-1051) returns `false` for any phase other than
COUNT_IN/PERFORMANCE. `handleKeyboardNoteInput` (:1989) and the PC-keydown listener (:2019) both
gate on it, and `handleNoteDetected` gates via it too. In REVIEW, on-screen keys will make a sound
(`playPianoSound` runs unconditionally, :1979) but never reach any handler — a review drill that
"hears nothing."
**How to avoid:** branch on `gamePhaseRef.current === GAME_PHASES.REVIEW` **before** the
`canScoreNow` guards — in `handleNoteEvent` (mic path, :932) and in `handleKeyboardNoteInput` / the
keydown listener (keyboard paths) — routing to the dedicated review handler (D-22).

### Pitfall 4: REVIEW must be added to three phase lists or the drill breaks

**Where (all verified):**

1. Session-timeout `activePhases` (:264-268 — currently COUNT_IN, DISPLAY, PERFORMANCE) — without
   it, `resumeTimer()` runs during review and the child-safety timeout can fire mid-drill.
2. `showPlayableKeyboardBand` (:3748-3752 — DISPLAY, COUNT_IN, PERFORMANCE) — without it, keyboard
   users have no input surface in REVIEW.
3. The audio-interruption pause effect (:3369-3376) excludes only SETUP/FEEDBACK — decide REVIEW
   behavior deliberately (recommended: treat like an active phase).
   Also: `SightReadingLayout`'s `phase` prop is a documented union (SightReadingLayout.jsx:14) —
   extend the contract comment; unknown phases fall into the generic overlay path
   (`showGuidanceOverlay`, :56-57), which renders guidance as a fixed top overlay — acceptable but
   should be a conscious choice.
   **Mic lifecycle:** mic listening is started for performance and stopped afterward; entering REVIEW
   in mic mode must call `startListeningSync()` (the review-entry button tap is the required user
   gesture) and `stopListeningSync()` on exit.

### Pitfall 5: The tolerance clamp binds before the constant (verified mechanics)

**What goes wrong:** at 120bpm an eighth note is 250ms; Test-mode late window =
`min(300, 250*0.6) = 150ms`. Doubling `NOTE_LATE_MS` to 600 still yields 150ms. Practice leniency
that only touches `timingConstants.js` is a no-op exactly where children struggle most.
**How to avoid:** scale constants AND clamp fractions (Pattern 2). Also note the two raw
`NOTE_LATE_MS` uses in the sweep: `missToleranceMs` fallback (:2065, used only when a timing window
is missing, :2101-2104) and the completion threshold (:2162-2168). The primary miss path reads
`windowEnd` from the mode-scaled windows, so leniency flows through automatically — but the
completion threshold should use the scaled value too, or the last note's widened window can outlive
the performance completion check and finalize as a miss incorrectly.
**Expected side effect (accepted in CONTEXT):** wider windows delay miss finalization, which delays
the live combo break — worth one test.

### Pitfall 6: `setCurrentNoteIndex` does NOT visibly highlight during feedback/display — D-14/D-10 gap

**What goes wrong (verified in VexFlowStaffDisplay.jsx):** `highlightNote(_noteIndex)` **ignores
its argument** (:1646-1670) and recolors all notes via `getNoteColor(idx)`, which returns black
outside performance/feedback (:1629-1631) and result-colors during feedback (:1634-1635). The only
thing `currentNoteIndex` drives is multi-bar auto-scroll, which is performance-phase-only (:1734).
So: during the DISPLAY auto-play there is **no moving staff highlight today**, and during a
FEEDBACK comparison playback the result coloring will win and nothing will move.
**How to avoid:** for PRAC-01, "byte-for-byte the auto-play" (D-10) is satisfied by reusing the
call — replay inherits today's (highlight-free) display behavior, no work needed. For PRAC-02,
D-14 promises "heard _and_ seen": add a small additive mechanism to `VexFlowStaffDisplay` (e.g., a
`playbackHighlightIndex` prop that, when ≥0 in feedback/review, draws an outline/glow on that note
group without disturbing result fills). Also note the synthetic "yours" pass omits missed notes, so
its playback indices don't equal staff note indices — the comparison driver must map synthetic
index → original `noteIndex` (carry `noteIndex` on the synthetic objects; `play()` ignores extra
fields — verified, it destructures only `type/startTime/endTime/frequency`, useRhythmPlayback.js:73-79).
**Warning sign:** comparison playback that sounds right but shows a frozen staff.

### Pitfall 7: Stale-closure mode flag in detection callbacks

**What goes wrong:** reading React state for the mode inside `handleNoteDetected` / the sweep gives
last-render values.
**How to avoid:** `gradingModeRef` mirror (Pattern 1); read the ref anywhere inside callbacks; the
lock at first COUNT_IN (D-05) means the ref is stable for the whole exercise anyway.

### Pitfall 8: FeedbackSummary "Try Again" must keep, and boundaries must unlock, the mode (D-05)

**Verified boundary inventory:** lock at `beginPerformanceWithPattern`'s `setGamePhase(COUNT_IN)`
(:3011, first invocation per session). Unlock sites: `returnToSetup` (:2544), `openSettingsModal`
(:2584), `handleStartNewSession` (:2435), Victory `onReset={handleStartNewSession}` (:3495), and
the encouragement screen's Try Again (:3552, also `handleStartNewSession`). The mid-exercise
`replayPattern` (:2445) must NOT unlock. Since `handleStartNewSession` is the single funnel for
three of five boundaries, unlocking inside it plus `returnToSetup`/`openSettingsModal` covers all
of D-05 with three call sites.

### Pitfall 9: Practice-mode penalty machinery (discretionary, but wire consciously)

`guessPenaltyRef` subtracts from `baseScore` in the summary effect (:1344-1345) and
`showPenaltyModal` interrupts play. Under D-01 the penalty affects only the _displayed_ practice
number. If the planner suppresses the modal in Practice (per the open discretion item), also decide
whether `penaltyPoints` still displays — recommend suppressing both for coherence ("safe mode").

## Code Examples

### 1. Replay handler (PRAC-01)

```javascript
// Pattern verified against SightReadingGame.jsx:2250-2255 (schedule) and :2978-2981 (clear)
const handleReplayPreview = useCallback(() => {
  const pattern = currentPatternRef.current;
  if (!pattern || gamePhaseRef.current !== GAME_PHASES.DISPLAY) return;
  if (previewPlaybackTimeoutRef.current) {
    // D-11: kill pending auto-play
    clearTimeout(previewPlaybackTimeoutRef.current);
    previewPlaybackTimeoutRef.current = null;
  }
  rhythmPlayback.play(pattern.notes, (index) => {
    // play() self-stops any prior run
    setCurrentNoteIndex(index);
  });
}, [rhythmPlayback]);
```

### 2. Synthetic "your rendition" builder (PRAC-02, D-13)

```javascript
// NEW: utils/comparisonPattern.js — shapes verified against
// SightReadingGame.jsx:1838-1849 (correct), :2117-2127 (missed/wrong_pitch sweep),
// useRhythmPlayback.js:73-82 (consumed fields), staffPositions.js:168 (NOTE_FREQUENCIES)
import { NOTE_FREQUENCIES } from "../constants/staffPositions";

export function buildPlayedRendition(patternNotes, performanceResults) {
  const byIndex = new Map(performanceResults.map((r) => [r.noteIndex, r]));
  const rendition = [];
  patternNotes.forEach((ev, i) => {
    if (ev.type !== "note") return; // rests: playback skips them anyway
    const r = byIndex.get(i);
    if (!r || r.timingStatus === "missed") return; // missed → silence (the lesson)
    const pitch = r.isCorrect ? ev.pitch : r.detected; // wrong pitch → what they played
    const frequency = NOTE_FREQUENCIES[pitch];
    if (!frequency) return;
    const offsetSec = (r.timeDiff || 0) / 1000; // wrong_pitch: 0 today (D-15 gap)
    rendition.push({
      type: "note",
      startTime: Math.max(0, ev.startTime + offsetSec),
      endTime: Math.max(
        ev.startTime + offsetSec + 0.05,
        ev.endTime + offsetSec
      ),
      frequency,
      noteIndex: i, // extra field is ignored by play(); needed for staff-highlight mapping
    });
  });
  return rendition;
}
```

### 3. Sequential comparison chaining via the end-of-pattern signal (D-14)

```javascript
// Verified: useRhythmPlayback.js:173-179 fires onBeatChange(-1) exactly once when
// elapsed > lastNote.endTime + 0.5s, then stops itself.
const startComparison = useCallback(() => {
  const pattern = currentPatternRef.current;
  const yours = buildPlayedRendition(
    pattern.notes,
    performanceResultsRef.current
  );
  const playPass = (notes, mapIndex, onDone) => {
    rhythmPlayback.play(notes, (index) => {
      if (index === -1) {
        onDone();
        return;
      }
      setPlaybackHighlightIndex(mapIndex(index));
    });
  };
  playPass(
    yours,
    (i) => yours[i]?.noteIndex ?? -1,
    () => {
      // optional divider beat here (planner discretion)
      playPass(
        pattern.notes,
        (i) => i,
        () => setPlaybackHighlightIndex(-1)
      );
    }
  );
}, [rhythmPlayback]);
```

Edge case: if `yours` is empty (everything missed), skip pass 1 and play only the correct pass.

### 4. Review input routing (PRAC-04, D-22)

```javascript
// In handleNoteEvent (mic, :932) and handleKeyboardNoteInput (:1976), BEFORE canScoreNow guards:
if (gamePhaseRef.current === GAME_PHASES.REVIEW) {
  reviewDrill.handlePitch(event.pitch); // pitch-match only; refs internally; no combo (D-18)
  return;
}
// Review target list (D-19), verified against getDetailedBreakdown semantics:
const mistakes = performanceResults.filter(
  (r) => r.timingStatus === "missed" || r.timingStatus === "wrong_pitch"
);
```

Reuse the existing enharmonic matching (`__tests__/enharmonicMatching.test.js` documents
`noteToMidi` semantics) for the pitch comparison so C#4 vs Db4 doesn't strand a child.

### 5. Mode-aware overall score (D-04)

```javascript
// MODIFIED: utils/scoreCalculator.js (current formula verified :55-57)
export function calculateOverallScore(
  pitchAccuracy,
  rhythmAccuracy,
  mode = "test"
) {
  if (mode === "practice") return pitchAccuracy; // pitch-focused grading
  return pitchAccuracy * 0.7 + rhythmAccuracy * 0.3; // Test: unchanged
}
```

Call sites to update: summary effect (SightReadingGame.jsx:1343) and `FeedbackSummary`'s fallback
(:67-69 — needs the mode via prop or context).

### 6. Locale parity gate (I18N-01, Wave 0)

```javascript
// NEW: src/locales/__tests__/sight-reading-parity.test.js
// Template verified: src/locales/__tests__/scaffolding-card-parity.test.js
// Passes today: sightReading.* is at exact 52/52 EN↔HE parity [VERIFIED: node script]
const enPaths = collectPaths(enCommon.sightReading || {});
const hePaths = collectPaths(heCommon.sightReading || {});
expect([...enPaths].filter((p) => !hePaths.has(p))).toEqual([]); // and the reverse
```

## State of the Art

No external-ecosystem movement is relevant — this phase composes existing in-repo infrastructure.
The relevant "current approaches" in this codebase, for planner orientation:

| Concern               | Current Approach (post Phases A–C, v3.6, P1)                                                 | Implication                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Audio scheduling      | Web Audio oscillators via `useRhythmPlayback` / `useAudioEngine`; PERF-4 memoized identities | Reuse; never new scheduling code                                                                                                    |
| Hot-path state        | Ref mirrors; zero per-frame setState (PR #11)                                                | Review handler must follow                                                                                                          |
| Shared HUD            | v3.6 `shared/hud/` components (`GameActionButton`, `ComboPill`, `ScorePill`)                 | Mode pill should visually match the header pill family (`rounded-lg p-1.5 sm:p-2`, active bg like the metronome's `bg-fuchsia-500`) |
| Score retry semantics | `existingScoreId` in-place update (RLS migration 20260707120000)                             | Practice gating sits ABOVE this — simply don't call                                                                                 |
| i18n                  | `sightReading.*` 52 keys, exact parity; RTL via `i18n.dir()`                                 | Extend namespace; add parity gate                                                                                                   |

## Assumptions Log

| #   | Claim                                                                                                                                                         | Section       | Risk if Wrong                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | ~2x tolerance multiplier + clamp fractions 0.85/0.75 make Practice feel meaningfully lenient without wrecking window attribution                              | Pattern 2     | Practice feels identical to Test (too small) or notes misattribute to neighbors (too big); tunable constants, low blast radius — validate by manual play [ASSUMED]                                           |
| A2  | Practice-mode session end should route to the encouragement-style screen rather than a persistence-suppressed VictoryScreen                                   | Pitfall 2     | If owner expects the full victory celebration in Practice, plan needs option (b) (suppression prop through `useVictoryState`) instead [ASSUMED]                                                              |
| A3  | Practice runs should NOT extend the daily streak (falls out of D-01 gating, since streak updates live inside `useVictoryState` at ≥80%)                       | Pitfall 2     | Product question: "I practiced today" arguably deserves streak credit even unscored; if so, the plan must call `updateStreakWithAchievements` explicitly on practice completion — surface to owner [ASSUMED] |
| A4  | A small additive `playbackHighlightIndex` prop on `VexFlowStaffDisplay` is the right way to satisfy D-14's "seen" without disturbing feedback result-coloring | Pitfall 6     | If VexFlow group styling fights the outline approach, fall back to audio-only pass-1 + a "now playing: yours/correct" label; D-14's visual promise weakens [ASSUMED]                                         |
| A5  | The review drill needs no time limit and no attempt cap per note (untimed per D-16); a child stuck on one pitch can replay the target or exit                 | Review design | If a child can soft-lock (e.g., mic can't hear the target pitch), need an escape hatch — recommend a per-note "skip" affordance regardless [ASSUMED]                                                         |

## Open Questions

1. **Practice mode and the streak (A3)** — the one place D-01's blanket "never persists" collides
   with a motivation system the owner cares about. What we know: streak update fires inside
   `useVictoryState` at ≥80% session score. Recommendation: surface to owner at plan review;
   default to NOT extending (strict D-01 reading) since under-claiming is reversible.
2. **Divider between comparison passes** (owner-delegated) — recommendation: a single soft
   metronome-style tick + ~400ms gap, plus the on-screen "yours / correct" label switching; purely
   additive, no new audio infra (`audioEngine.createMetronomeClick` exists, :2269).
3. **Review target-pitch autoplay** (owner-delegated) — recommendation: play the target once
   automatically on entering each mistake (recall support for an 8-year-old), plus a replay-target
   button; in mic mode, delay the autoplay until after mic is listening to avoid the tone being
   picked up as input — or gate the review handler for ~500ms after autoplay (same phantom-note
   concern that led Phase 01 to drop the fire sound).
4. **Penalty modal in Practice** (owner-delegated) — recommendation: suppress modal and penalty
   display in Practice (Pitfall 9); keep anti-cheat tracking code running (zero-cost, avoids
   divergent code paths).
5. **D-15 (wrong-pitch timeDiff)** — recommendation: close it; verified one-line-shaped change at
   :1924 (`lastWrongPitchRef.current[i] = { pitch: detectedNote, timeDiff }`) plus reading the
   object in the sweep (:2113-2115) and in `buildPlayedRendition`. No new hot-path state.

## Environment Availability

Skipped — this phase is code/config-only within the existing React + Vitest toolchain; no new
external tools, services, or runtimes are required. (Existing dev environment already runs the full
suite: 1,975 tests green at Phase 01 close per STATE.md.)

## Validation Architecture

### Test Framework

| Property           | Value                                                    |
| ------------------ | -------------------------------------------------------- |
| Framework          | Vitest 3.2.4, jsdom, globals enabled                     |
| Config file        | `vitest.config.js` (includes `test.env` Supabase stubs)  |
| Quick run command  | `npx vitest run src/components/games/sight-reading-game` |
| Full suite command | `npm run test:run`                                       |

### Phase Requirements → Test Map

| Req ID           | Behavior                                                                                                                                                                               | Test Type                                   | Automated Command                                                                               | File Exists? |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------ |
| PRAC-01          | Replay tap clears pending auto-play timeout and calls `rhythmPlayback.play` exactly once; button absent outside DISPLAY                                                                | component (fake timers, combo-test harness) | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.replay.test.jsx`       | ❌ Wave 0    |
| PRAC-02          | `buildPlayedRendition`: correct→offset by timeDiff, wrong→detected pitch @ expected slot, missed→omitted, rests skipped, empty-results edge                                            | unit (pure)                                 | `npx vitest run src/components/games/sight-reading-game/utils/comparisonPattern.test.js`        | ❌ Wave 0    |
| PRAC-02          | One button triggers yours-then-correct sequential passes (chained on `onBeatChange(-1)`)                                                                                               | component                                   | same replay/compare test file                                                                   | ❌ Wave 0    |
| PRAC-03          | Practice widens windows AND status thresholds (incl. clamp-bound fast-tempo case); Test unchanged                                                                                      | unit (`renderHook`)                         | `npx vitest run src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js`        | ❌ Wave 0    |
| PRAC-03          | Practice overall score = pitch-only; Test = 0.7/0.3 blend unchanged                                                                                                                    | unit (extend existing)                      | `npx vitest run src/components/games/sight-reading-game/utils/scoreCalculator.test.js`          | ✅ extend    |
| PRAC-03          | Practice mode: `updateStudentScore` NOT called in FEEDBACK; Test mode: called                                                                                                          | component                                   | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.practiceMode.test.jsx` | ❌ Wave 0    |
| PRAC-03          | Mode locks at first COUNT_IN; unlocks at `handleStartNewSession`/`returnToSetup`; `replayPattern` keeps mode; localStorage persist + allowlist default                                 | component + unit                            | same practiceMode test file                                                                     | ❌ Wave 0    |
| PRAC-04          | Mistake filter = `missed`+`wrong_pitch` only; advance on matching pitch (incl. enharmonic); no `incrementCombo`/`resetCombo` calls; no score writes; Review button hidden on clean run | unit (drill hook) + component               | `npx vitest run src/components/games/sight-reading-game/hooks/useReviewDrill.test.js`           | ❌ Wave 0    |
| PRAC-04          | REVIEW added to session-timeout `activePhases` (pauseTimer called) and keyboard band renders                                                                                           | component                                   | practiceMode/review test file                                                                   | ❌ Wave 0    |
| I18N-01          | `sightReading.*` EN↔HE exact parity (both directions)                                                                                                                                 | unit (static)                               | `npx vitest run src/locales/__tests__/sight-reading-parity.test.js`                             | ❌ Wave 0    |
| D-04 side effect | Wider practice windows delay miss finalization → later combo reset (regression guard)                                                                                                  | component                                   | extend `SightReadingGame.combo.test.jsx`                                                        | ✅ extend    |

Manual-only (justified): audible correctness of the comparison passes and replay timbre (audio
output can't be asserted in jsdom beyond call-shape); Hebrew RTL visual mirroring on device —
consistent with prior milestones' deferred device checks.

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/games/sight-reading-game src/locales/__tests__`
- **Per wave merge:** `npm run test:run` (full suite, ~1,975+ tests) + `npm run lint`
- **Phase gate:** full suite green + `npm run build` (prebuild trail validation) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/locales/__tests__/sight-reading-parity.test.js` — covers I18N-01 (passes green today at 52/52; becomes load-bearing when strings land)
- [ ] `src/components/games/sight-reading-game/utils/comparisonPattern.test.js` — covers PRAC-02 core
- [ ] `src/components/games/sight-reading-game/hooks/useTimingAnalysis.test.js` — covers PRAC-03 windows (no test exists for this hook today)
- [ ] Component test files modeled on `SightReadingGame.combo.test.jsx`'s mock harness (stateful session-context mock, `capturedOnNoteEvent`) — covers PRAC-01/03/04 integration
- Framework install: none needed (Vitest + RTL already configured)

## Security Domain

`security_enforcement` not set in `.planning/config.json` → treated as enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies                 | Standard Control                                                                                                                                                                                         |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no                      | No auth surface changes; existing `useUser`/`verifyStudentDataAccess` untouched                                                                                                                          |
| V3 Session Management | no                      | No session changes (child-safety `SessionTimeoutContext` must keep working in REVIEW — Pitfall 4)                                                                                                        |
| V4 Access Control     | yes (unchanged posture) | Practice mode _removes_ writes; it must not create a bypass where Practice results reach `students_score`/trail via any path (Pitfall 2 enumerates all four) — RLS ground truth untouched this phase     |
| V5 Input Validation   | yes                     | Allowlist-validate the localStorage mode value (`"practice"`\|`"test"`, default Test); never interpolate it into class names/queries. Detected pitches already validated against `NOTE_FREQUENCIES` keys |
| V6 Cryptography       | no                      | None — never hand-roll; nothing here needs it                                                                                                                                                            |

### Known Threat Patterns for this stack

| Pattern                                                        | STRIDE                 | Standard Mitigation                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XP/score farming via lenient mode                              | Tampering/Elevation    | D-01: Practice submits nothing (client) + existing `rateLimitService` and subscription RLS remain the server backstop for Test                                                                                                |
| localStorage tampering (`sightReadingGradingMode` set to junk) | Tampering              | Allowlist parse with Test default (D-03 alignment)                                                                                                                                                                            |
| Child audio capture (COPPA)                                    | Information Disclosure | D-12: no raw-audio recording anywhere in this phase; comparison is note-name reconstruction only; no new PII, no new storage                                                                                                  |
| Client-only gate mistaken for security                         | Spoofing               | Mode gating is UX/product integrity, not a security boundary — server-side `students_score` RLS (migrations 20260707120000, 20260708120000) is unchanged ground truth; a tampered client can still only write what RLS allows |

## Project Constraints (from CLAUDE.md)

- **Testing:** Vitest + JSDOM; test files as `*.test.{js,jsx}` siblings or `__tests__/`; single-file run via `npx vitest run <path>`.
- **Pre-commit:** Husky + lint-staged (ESLint + Prettier on staged files); `npm run lint` must pass.
- **Design system:** glassmorphism on purple gradient — new controls use `bg-white/10 border-white/20`, text `text-white`/`text-white/70`, hover `hover:bg-white/10`; header icon buttons follow `rounded-lg p-1.5 sm:p-2` + active-bg pattern (verified in headerRegion :3606-3696).
- **Game session flow:** `idle → in-progress → complete`, 10 exercises/session, VictoryScreen/GameOverScreen endings — REVIEW is an intra-exercise sub-phase and must not disturb this contract.
- **Session timeout:** games must call `pauseTimer()` during gameplay / `resumeTimer()` when idle — REVIEW counts as gameplay (Pitfall 4).
- **VictoryScreen trail behavior:** `updateExerciseProgress`/`updateNodeProgress`, XP only on node completion, comeback multiplier — the D-01 gate must respect this machinery, not fork it.
- **i18n:** EN + HE with RTL; use `i18n.dir()`; Hebrew nikud conventions owner-approved (do not alter existing HE strings).
- **Audio:** all audio through `useAudioContext()`/`useAudioEngine`; iOS Safari interruption handling exists — resume audio context on user gestures (replay/compare/review buttons are gestures; `beginPerformanceWithPattern` shows the resume pattern :2989-2990).
- **No new routes** → the LANDSCAPE_ROUTES/gameRoutes dual-array rule is not triggered this phase.
- **Security guidelines:** `docs/SECURITY_GUIDELINES.md` — PII minimization (D-12 aligns), RLS everywhere (untouched).

## Sources

### Primary (HIGH confidence — direct file reads in this worktree, 2026-07-10)

- `src/components/games/sight-reading-game/SightReadingGame.jsx` (3,995 lines) — GAME_PHASES :80-86; session-timeout activePhases :264-276; localStorage inputMode :324/:604; trail auto-start :352-371; `previewPlaybackTimeoutRef` :583/:2250/:2978; `useTimingAnalysis` call :689-691; `handleNoteEvent` :932-974; `canScoreNow` :1042-1051; summary effect :1337-1415; score-submit effect :1420-1496; `handleNoteDetected` :1527-1965 (correct-record + `incrementCombo` :1838-1879, wrong-pitch :1920-1942); keyboard input :1976-2029; miss sweep :2061-2169; `loadExercisePattern` :2206-2263; handlers :2410-2605; `beginPerformanceWithPattern` :2960-3024; interruption effect :3369-3376; header :3606-3696; guidance :3710-3746; keyboard band :3748-3752; feedback panel :3781-3793; Victory/encouragement :3489-3577
- `hooks/useRhythmPlayback.js` — full read (play/stop contract, `-1` end signal :173-179)
- `hooks/useTimingAnalysis.js`, `constants/timingConstants.js` — full reads (clamps :53-56, STATUS_MAP :4-8)
- `utils/scoreCalculator.js`, `utils/patternBuilder.js` (:400-469), `constants/staffPositions.js` (NOTE_FREQUENCIES :168 via grep)
- `components/FeedbackSummary.jsx`, `components/SightReadingLayout.jsx`, `components/VexFlowStaffDisplay.jsx` (:1600-1850) — full/targeted reads
- `src/contexts/SightReadingSessionContext.jsx` — full read
- `src/hooks/useVictoryState.js` (grep: trail progress :344-500, free-play XP :501-516, streak :329-332), `src/components/games/VictoryScreen.jsx` (imports/props)
- `src/services/apiScores.js` — full `updateStudentScore` read
- `src/hooks/useAudioEngine.js` — `playPianoSound` :533-553
- `src/locales/{en,he}/common.json` — parity verified programmatically (node script, 52/52)
- `src/locales/__tests__/scaffolding-card-parity.test.js`, `SightReadingGame.combo.test.jsx` (test harness)
- `.planning/phases/02-practice-tooling/02-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONVENTIONS.md` (RTL :322-329, localStorage :234)

### Secondary (MEDIUM confidence)

- `CLAUDE.md` and memory files — VictoryScreen trail behavior, Phase B perf history (consistent with code reads)

### Tertiary (LOW confidence)

- None — no external web research was required for this phase (no new libraries, no ecosystem questions).

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all assets read directly; zero new dependencies
- Architecture: HIGH — every integration point verified with line numbers; the five CONTEXT.md corrections/additions (free-play XP, canScoreNow gap, highlight gap, `-1` end signal, raw NOTE_LATE_MS fallbacks) were each confirmed in source
- Pitfalls: HIGH — all nine derived from verified code, not speculation
- Discretionary tuning values (multipliers, copy, divider): LOW by nature — flagged in Assumptions Log for owner/manual validation

**Research date:** 2026-07-10
**Valid until:** ~2026-08-10 (internal codebase research; invalidated earlier if `main` merges touch `sight-reading-game/` — re-verify line anchors after any rebase)
