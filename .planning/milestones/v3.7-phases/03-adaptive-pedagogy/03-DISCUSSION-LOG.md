# Phase 03: Adaptive Pedagogy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-11
**Phase:** 03-adaptive-pedagogy
**Areas discussed:** In-session difficulty escalation (ADAPT-01), Adaptive tempo (ADAPT-02), Per-note mastery scope & use (ADAPT-03), Player-facing legibility & mode interaction

---

## In-session difficulty escalation (ADAPT-01)

| Option                                       | Description                                                                           | Selected |
| -------------------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| New dedicated streak counter                 | Separate from Phase 01's HUD combo; decouples engagement visuals from pedagogy tuning | ✓        |
| Reuse Phase 01's session-wide combo directly | Fires escalation at the same combo tiers driving ComboPill/OnFireBadge                |          |
| You decide                                   |                                                                                       |          |

**User's choice:** New dedicated streak counter (recommended)
**Notes:** Recommended because pedagogy sensitivity shouldn't be coupled to HUD motivational tuning.

| Option                              | Description                                        | Selected |
| ----------------------------------- | -------------------------------------------------- | -------- |
| Reuse focusNotes/contextNotes split | Same precedent as NotesRecognitionGame's auto-grow | ✓        |
| Something else                      | Describe a different source                        |          |
| You decide                          |                                                    |          |

**User's choice:** Reuse focusNotes/contextNotes split (recommended)

| Option                             | Description                                  | Selected |
| ---------------------------------- | -------------------------------------------- | -------- |
| N consecutive misses               | E.g. 2-3 misses in a row drops back one tier | ✓        |
| Rolling accuracy over last K notes | Percentage-based over a window               |          |
| You decide                         |                                              |          |

**User's choice:** N consecutive misses (recommended)

| Option                      | Description                                     | Selected |
| --------------------------- | ----------------------------------------------- | -------- |
| Next exercise boundary only | Patterns are generated as a whole, non-stateful | ✓        |
| Mid-exercise if feasible    | More responsive but substantially more complex  |          |

**User's choice:** Next exercise boundary only (recommended)

---

## Adaptive tempo (ADAPT-02)

| Option        | Description                                             | Selected |
| ------------- | ------------------------------------------------------- | -------- |
| Same lever    | Tempo bundled into ADAPT-01's difficulty tiers          | ✓        |
| Separate axis | Tempo has its own independent success/struggle tracking |          |
| You decide    |                                                         |          |

**User's choice:** Same lever (recommended)

| Option                                  | Description                                              | Selected |
| --------------------------------------- | -------------------------------------------------------- | -------- |
| Small fixed step within a bounded range | ~±10-15 BPM per tier, clamped to ~0.75x-1.25x base tempo | ✓        |
| Something else                          |                                                          |          |
| You decide                              |                                                          |          |

**User's choice:** Small fixed step within a bounded range (recommended)

| Option                      | Description                                      | Selected |
| --------------------------- | ------------------------------------------------ | -------- |
| Per-exercise boundary       | Consistent with ADAPT-01's timing decision       | ✓        |
| Continuous within a pattern | Requires rescheduling playback/timing mid-flight |          |

**User's choice:** Per-exercise boundary (recommended)

---

## Per-note mastery scope & use (ADAPT-03)

| Option           | Description                                                     | Selected |
| ---------------- | --------------------------------------------------------------- | -------- |
| Per node         | Mirrors exercise_progress JSONB-array-on-per-node-row precedent | ✓        |
| Global per pitch | One mastery map across all sight-reading regardless of node     |          |
| You decide       |                                                                 |          |

**User's choice:** Per node (recommended)

| Option                             | Description                                                | Selected |
| ---------------------------------- | ---------------------------------------------------------- | -------- |
| Actively targets weak notes        | Pattern generation biases toward historically-weak pitches | ✓        |
| Persisted but display-only for now | Write/surface data but don't change generation logic       |          |
| You decide                         |                                                            |          |

**User's choice:** Actively targets weak notes (recommended)

| Option                                      | Description                                  | Selected |
| ------------------------------------------- | -------------------------------------------- | -------- |
| Simple cumulative (correct/total per pitch) | Merged/incremented across sessions, no decay | ✓        |
| Recency-weighted (e.g. exponential decay)   | Recent attempts count more                   |          |
| You decide                                  |                                              |          |

**User's choice:** Simple cumulative (correct/total per pitch) (recommended)

| Option                                  | Description                                   | Selected |
| --------------------------------------- | --------------------------------------------- | -------- |
| Yes, minimum attempts threshold         | E.g. ≥3-5 attempts before accuracy is trusted | ✓        |
| No threshold, weight from first attempt | Simpler but noisier                           |          |
| You decide                              |                                               |          |

**User's choice:** Yes, minimum attempts threshold (recommended)

---

## Player-facing legibility & mode interaction

| Option                                                   | Description                                                   | Selected |
| -------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| Visible, positive-only cue on escalation; silent on ease | Consistent with Phase 01's motivation-over-punishment posture | ✓        |
| Fully silent both directions                             | No UI cue either way                                          |          |
| Visible both directions with careful framing             | Most transparent, most new copy                               |          |
| You decide                                               |                                                               |          |

**User's choice:** Visible, positive-only cue on escalation; silent on ease (recommended)

| Option             | Description                                                                        | Selected |
| ------------------ | ---------------------------------------------------------------------------------- | -------- |
| Both modes         | Adaptivity (what's presented) is orthogonal to grading tolerance (how it's scored) | ✓        |
| Practice mode only | Test mode stays fully static for consistent scoring                                |          |
| You decide         |                                                                                    |          |

**User's choice:** Both modes (recommended)

---

## Claude's Discretion

- Exact N for "consecutive misses" that triggers easing — starting hypothesis 2-3.
- Exact BPM step size and clamp fractions within the ±10-15 BPM / 0.75x-1.25x envelope.
- Exact minimum-attempts threshold for weak-note targeting — starting hypothesis 3-5.
- Exact copy, iconography, and animation for the escalation "leveling up" cue.
- Whether the adaptive-difficulty streak counter lives in `SightReadingSessionContext` or is scoped
  more locally.
- Exact JSONB column name/migration structure for per-node mastery (logical shape is locked:
  `{ pitch: { correct, total } }`).

## Deferred Ideas

- Display-only surfacing of per-note mastery (parent/teacher view) — not requested this phase.
- Recency-weighted / decayed mastery — rejected in favor of simple cumulative accuracy for v1.
- Separate independently-moving tempo axis — rejected in favor of one shared tier ladder.
- Visible easing with careful positive framing — rejected in favor of fully silent easing.
- Rush/drag coaching (SR-FUT-01) and cross-game adaptive-difficulty framework remain out of scope
  per `.planning/REQUIREMENTS.md` (pre-existing, not new to this discussion).
