# Phase 02: Practice Tooling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-10
**Phase:** 02-practice-tooling
**Areas discussed:** Practice/Test mode + scoring, Replay affordance & limits, Comparison playback fidelity, Review-mistakes model

---

## Area selection

| Option                       | Description                                                   | Selected |
| ---------------------------- | ------------------------------------------------------------- | -------- |
| Practice/Test mode + scoring | Toggle placement, grading changes, does Practice award stars? | ✓        |
| Replay affordance & limits   | Button placement, replay cap, staff highlighting              | ✓        |
| Comparison playback fidelity | Reconstruct vs capture vs record raw audio; presentation      | ✓        |
| Review-mistakes model        | Passive vs active drill; what counts as a mistake             | ✓        |

**User's choice:** All four areas.

---

## Practice/Test mode + scoring

### Q1 — Does a Practice-mode trail exercise award stars, XP, and node progress?

| Option                    | Description                                                                                    | Selected   |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| No — Practice is unscored | Never submits, never awards XP, never advances trail. Protects progression integrity.          | ✓ (Claude) |
| Yes — same rewards        | One code path, but a lenient run buys the same stars — Test mode ceases to exist in practice.  |            |
| Yes, but capped           | Practice submits at reduced stars/XP. Preserves some reward; more logic through VictoryScreen. |            |

**User's choice:** "you decide"
**Notes:** Chose unscored. Three reasons: a lenient run must not buy the same 3 stars as a strict one
or a rational child always picks Practice; it closes an XP-farm vector alongside `rateLimitService`;
and it makes Practice psychologically safe (nothing at stake = nothing lost), which is Phase 01's
motivation-over-punishment posture applied to grading. Feedback panel still shows stars/accuracy for
the attempt — they just don't persist. → D-01

### Q2 — Where does the player choose the mode?

| Option                     | Description                                                                             | Selected   |
| -------------------------- | --------------------------------------------------------------------------------------- | ---------- |
| Header toggle (both modes) | Third control in the existing header row. Reaches trail players, who skip PreGameSetup. | ✓ (Claude) |
| PreGameSetup step only     | A wizard step. Invisible to trail exercises, which auto-start. Fails SC-3 for trail.    |            |
| Both: setup step + header  | Setup sets the default, header overrides. Two surfaces to keep in sync.                 |            |

**User's choice:** "you decide for best UX"
**Notes:** Header toggle, but **labeled with text, not icon-only** — an 8-year-old cannot decode an
icon for an abstract concept like "practice vs test". Persist to localStorage mirroring
`sightReadingInputMode`. Default = Test, because the default must be the mode where things count.
→ D-02, D-03, D-06

### Q3 — What changes when Practice mode is on?

| Option                           | Description                                                                      | Selected   |
| -------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| Wider windows + pitch-only score | Scale tolerances AND drop rhythm from the overall score. Rhythm bar still shown. | ✓ (Claude) |
| Wider windows only               | One knob, but a pitch-perfect / rhythm-loose run still scores poorly.            |            |
| Pitch-only score, same windows   | Doesn't deliver the "lenient" half; notes outside the window still miss.         |            |

**User's choice:** "You decide"
**Notes:** Both halves, per PRAC-03's literal wording. Surfaced the clamp landmine:
`buildTimingWindows` uses `Math.min(NOTE_LATE_MS, durationMs * 0.6)`, so raising the constant alone
buys nothing at fast tempos — the tolerances must become a mode-parameterized object with scaled
clamp fractions. → D-04

### Q4 — Mixed modes within one multi-exercise trail node?

| Option                           | Description                                                                        | Selected   |
| -------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| Practice exercises don't advance | Honest, but a child can get stuck wondering why "Next" never appears.              |            |
| Lock mode for the whole session  | Toggle greys out at first count-in. No mixed state, no half-graded nodes.          | ✓ (Claude) |
| Practice advances, node unscored | Free movement, but the loss is only discovered at the end — worst feedback timing. |            |

**User's choice:** "You decide"
**Notes:** Session-lock. Re-opens only at genuine session boundaries (`returnToSetup`, settings gear,
`handleStartNewSession`, victory/encouragement "Try Again"). The mid-exercise `FeedbackSummary`
"Try Again" keeps the current mode. → D-05

---

## Replay affordance & limits

### Q1 — Placement and cap

| Option                               | Description                                                                    | Selected   |
| ------------------------------------ | ------------------------------------------------------------------------------ | ---------- |
| Beside Start Playing, unlimited      | Contextual to DISPLAY phase; appears when meaningful, vanishes at performance. | ✓ (Claude) |
| Header icon, unlimited               | Always present, but competes in an already-crowded header row.                 |            |
| Beside Start Playing, capped in Test | Preserves "read at sight" challenge; needs a counter UI and spent-state.       |            |

**User's choice:** "You decide"
**Notes:** Unlimited isn't really a choice — SC-1 mandates "any number of times". It's also correct:
the auto-play already hands the child the answer aurally every exercise, so a cap would be theater.
→ D-07, D-08

### Q2 — Should the existing auto-play stay?

| Option                         | Description                                                                | Selected   |
| ------------------------------ | -------------------------------------------------------------------------- | ---------- |
| Keep auto-play as-is           | Replay purely additive. Zero regression risk, smallest diff.               | ✓ (Claude) |
| Keep in Practice, drop in Test | Makes the modes pedagogically distinct — read first, then check.           |            |
| Drop auto-play entirely        | Purest sight-reading; silently changes behavior for every existing player. |            |

**User's choice:** "You decide"
**Notes:** Kept as-is. Option 2 is genuinely appealing but Test is the _default_ mode, so silencing
it would quietly make the game harder for every child currently playing. PRAC-03 defines the modes by
grading tolerance, not by when audio plays. Captured as a deferred idea. Also flagged the
`previewPlaybackTimeoutRef` double-play landmine. → D-09, D-11

### Q3 — What does the replay play?

| Option                              | Description                                                 | Selected   |
| ----------------------------------- | ----------------------------------------------------------- | ---------- |
| Same as auto-play + count-in clicks | Adds a one-bar pulse scaffold before the notes.             |            |
| Identical to auto-play              | Same `play()` call, same highlighting. Instant, repeatable. | ✓ (Claude) |
| Notes + metronome throughout        | Strongest pulse scaffold; clicks compete with pitches.      |            |

**User's choice:** "you decide for best User Experience"
**Notes:** "Hear it again" should mean _again_. A count-in imposes ~4s of clicks at 60bpm on every
tap, punishing the child who needs the most repetitions. The pulse scaffold already lands in the
`COUNT_IN` phase right before performance. → D-10

---

## Comparison playback fidelity

### Q1 — How do we produce "your rendition"?

| Option                              | Description                                                                         | Selected   |
| ----------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| Reconstruct from performanceResults | Synthesize from recorded per-note data. No new capture code, no privacy escalation. | ✓ (Claude) |
| Capture a real note-event log       | Higher fidelity for wrong/missed; touches the mic hot path Phase B just optimized.  |            |
| Record raw mic audio                | Highest fidelity; COPPA escalation, no keyboard-mode equivalent, large new surface. |            |

**User's choice:** "you decide"
**Notes:** Raw audio rejected on principle — the milestone's Core Value is that children's data must
be protected, and capturing a child's raw audio is a materially different privacy posture than
storing note names; it also yields nothing in keyboard mode. A verbatim event log means writing into
the mic-detection hot path PR #11 just optimized. The reconstruction is lossy in the right places:
correct notes carry real mic-latency-compensated `timeDiff` (so rush/drag is audible), missed notes
become silence (the lesson, not a limitation). Noted the `wrong_pitch` / `timeDiff: 0` gap as an
optional cheap fix via `lastWrongPitchRef`. → D-12, D-13, D-15

### Q2 — Presentation

| Option                          | Description                                              | Selected   |
| ------------------------------- | -------------------------------------------------------- | ---------- |
| Sequential: yours, then correct | One button. Ends on the right answer.                    | ✓ (Claude) |
| Two buttons, play either        | More agency; a child can end on their own wrong version. |            |
| Simultaneous, different timbres | Timing divergence instantly audible; muddy for a child.  |            |

**User's choice:** "you decide"
**Notes:** Recency governs — the last thing in the child's ear must be the right answer, so their
version plays first. One button, because an 8-year-old shouldn't have to assemble the comparison
themselves. Staff highlights along with each pass. → D-14

---

## Review-mistakes model

### Q1 — What does Review actually do?

| Option                            | Description                                                            | Selected   |
| --------------------------------- | ---------------------------------------------------------------------- | ---------- |
| Active drill — replay each note   | Isolate, hear the correct pitch, play it. Untimed. Corrective reps.    | ✓ (Claude) |
| Passive — step through and listen | Much smaller build; recognition rather than recall.                    |            |
| Passive list, no stepping         | Cheapest; a report, not a review mode. Arguably fails "steps through". |            |

**User's choice:** "you decide"
**Notes:** Deliberate practice means corrective reps, not watching. Locked two guardrails alongside
it: Review never re-scores (or Test degenerates into retry-until-correct and stars become free), and
Review never touches combo/on-fire (that state is session-wide in `SightReadingSessionContext` per
Phase 01 D-05). Needs its own `GAME_PHASES.REVIEW` and a lightweight detection handler — it must not
route through `handleNoteDetected`, which bails outside `PERFORMANCE`. → D-16, D-17, D-18, D-21, D-22

### Q2 — Which notes go into the drill?

| Option                                  | Description                                                         | Selected   |
| --------------------------------------- | ------------------------------------------------------------------- | ---------- |
| Wrong pitch + missed only               | Matches SC-4 literally. Shorter drill, higher signal.               | ✓ (Claude) |
| Everything not 'correct'                | Includes early/late; tells a correct reader they made 6 "mistakes". |            |
| Wrong + missed, timing shown separately | Honest and complete, but rush/drag coaching is SR-FUT-01, deferred. |            |

**User's choice:** "you decide"
**Notes:** Early/late notes were the _right_ note, merely rushed or dragged — an untimed drill cannot
fix a timing error, and flagging them as "mistakes" cuts against the motivation-over-punishment
posture. Also keeps the phase clear of SR-FUT-01. Filter:
`timingStatus === "missed" || timingStatus === "wrong_pitch"`. On a clean run the button is hidden,
not disabled. → D-19, D-20

---

## Feedback panel information architecture

### Q1 — Four actions in one panel (Try Again · Next · Compare · Review)

| Option                                        | Description                                                       | Selected     |
| --------------------------------------------- | ----------------------------------------------------------------- | ------------ |
| Two rows: learn above, navigate below         | Secondary practice tools above the primary Try Again / Next pair. | ✓ (**user**) |
| Compare on the staff, not in the panel        | Speaker icon on the notation card; three buttons in the panel.    |              |
| Review replaces Try Again when mistakes exist | Never more than three buttons; removes a choice from the child.   |              |

**User's choice:** **Two rows — learn above, navigate below** (the only decision the owner made
directly rather than delegating).
**Notes:** Visual hierarchy separates "understand what happened" from "what next." On a clean run the
top row collapses since Review is hidden. → D-23

---

## Claude's Discretion

The owner delegated **every** question in this phase except the feedback-panel layout, responding
"you decide" / "you decide for best UX" to all ten. All decisions above were made against two
standing owner principles carried forward from Phase 01: **motivation over punishment**, and **reuse
shared components and namespaces rather than forking**.

Remaining open for the planner (recorded in CONTEXT.md `### Claude's Discretion`):

- The exact leniency multiplier for Practice-mode tolerances (~2x is a hypothesis, not a lock).
- Whether to close the `wrong_pitch` / `timeDiff: 0` gap via `lastWrongPitchRef`.
- Copy and iconography for the mode pill, replay, compare, and review controls.
- Whether the comparison playback inserts an audible/visual divider between passes.
- Whether the Review drill auto-sounds the target pitch on entering each note, or on demand.
- Whether Practice mode suppresses the anti-cheat penalty modal (moot under D-01, but it's a
  punishment affordance in an explicitly safe mode).

## Deferred Ideas

- **Silent-first Test mode** — drop the DISPLAY auto-play in Test (keep it in Practice). Rejected for
  this phase: Test is the default, so silencing it regresses every existing player, and PRAC-03
  defines the modes by grading tolerance only. Worth its own discussion later.
- **Capped replays in Test mode** — rejected; SC-1 mandates unlimited and the auto-play already
  reveals the exercise aurally.
- **Raw-audio capture of the player's rendition** — rejected on COPPA/privacy grounds. Would need its
  own `/gsd-secure-phase` pass and a parent-consent story, and does not work in keyboard input mode.
- **Rush/drag coaching** — already tracked as SR-FUT-01 in REQUIREMENTS.md v2. D-19 deliberately keeps
  early/late notes out of the Review drill so this phase doesn't half-implement it.
