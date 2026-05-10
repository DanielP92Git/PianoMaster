# Phase 35: ArcadeRhythmGame Portrait - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 35-ArcadeRhythmGame Portrait
**Areas discussed:** Spike scope/format, Decision criteria, Tablet behavior, Fallback path cleanup

---

## Pre-discussion code reality check

Before entering questions, Claude scouted `ArcadeRhythmGame.jsx` and surfaced a meaningful framing surprise:

- The backlog memo (`backlog_arcade_portrait_phase.md`, 2026-05-07) and ROADMAP SC #3 framed the phase as "vertical-lane redesign vs. always-landscape-with-prompt," implying the current code uses horizontal lanes.
- The actual code (`ArcadeRhythmGame.jsx:1213-1246`) is already a single full-width vertical lane: tiles `absolute left-4 right-4`, lane is `absolute inset-0`, `laneHeightRef = offsetHeight` dynamically.
- This collapsed the spike question from "design a new layout" to "does removing the landscape lock and letting the existing single-lane code render in a taller portrait viewport feel good?"

The user accepted this framing and the discussion proceeded with the smaller spike scope.

---

## Area 1 — Spike scope/format

### Q1: What's the actual spike?

| Option              | Description                                                                                                           | Selected |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| Unlock & feel-test  | Remove `useDeclareNeedsLandscape(true)` from existing single-lane code; play 10–15 min on real phone. Smallest spike. | ✓        |
| Multi-lane redesign | Spike a 2–3 column lane variant (Guitar-Hero-style). Bigger investment.                                               |          |
| HTML mockup first   | Sketch in static HTML/CSS, no rAF/audio wiring. Cheaper visual iteration but doesn't answer timing/feel questions.    |          |
| You decide          | Pick based on what we learn about the code.                                                                           |          |

**User's choice:** Unlock & feel-test (Recommended).
**Notes:** Aligned with the pre-discussion code reality check. The existing code is already vertical-scrolling — no redesign needed in the spike itself.

### Q2: Where does the spike live?

| Option                   | Description                                                                                                    | Selected |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| In-place behind dev flag | `?spike-portrait` URL param in `ArcadeRhythmGame.jsx` flips the declaration. Prod unaffected. One-line revert. | ✓        |
| Throwaway branch         | Standalone spike branch / `.planning/spikes` entry. Cleaner isolation but more friction to run on real phone.  |          |
| Separate dev-only route  | New `/rhythm-mode/arcade-rhythm-game-portrait-spike` route. Keeps prod untouched but adds routing surface.     |          |

**User's choice:** In-place behind dev flag (Recommended).
**Notes:** Mirrors Phase 34 Plan 08's `?measures` dev-only URL helper pattern. Tear-out is trivial.

### Q3: What devices/patterns does the spike test? (multiSelect)

| Option                                      | Description                                                                   | Selected |
| ------------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| iPhone SE portrait (375×667)                | Floor target — matches Phase 34 D-12.                                         | ✓        |
| Larger phone portrait (e.g., iPhone 14)     | One-minute sanity check on a typical aspect ratio.                            | ✓        |
| Tablet-portrait (iPad)                      | Folds tablet data into the spike. Otherwise Area 3 decides tablet separately. | ✓        |
| Spike across pattern lengths (2-bar, 4-bar) | Tile density may drive a "cramped" verdict on long patterns + small screen.   | ✓        |

**User's choice:** All four.
**Notes:** Full test surface; tablet data informs Area 3.

---

## Area 2 — Decision criteria

### Q1: What's the primary decision criterion?

| Option                            | Description                                                                                        | Selected |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Subjective feel-test              | Owner plays 10–15 min and judges "ship to 8yo or not". Matches v3.4 ship-don't-gold-plate posture. | ✓        |
| Objective quality bars            | Hard metrics: 80%+ PERFECT/GOOD at 90 BPM, zero clipped UI, one-thumb hit zone reach.              |          |
| Comparison to landscape baseline  | "As good or better than landscape" → ship.                                                         |          |
| Hybrid: feel + dealbreaker checks | Subjective primary but with hard gates (one-handed reach, no clipping, not cramped).               |          |

**User's choice:** Subjective feel-test (Recommended).
**Notes:** Beta-launch posture, no extra UAT infrastructure.

### Q2: Who else tests besides you?

| Option                      | Description                                             | Selected |
| --------------------------- | ------------------------------------------------------- | -------- |
| Just you                    | Owner is the calibration point. Kid feedback post-beta. | ✓        |
| You + 1–2 kid testers       | Higher-fidelity signal but coordination friction.       |          |
| Defer kid testing post-ship | Owner decides; kids get a follow-up phase if needed.    |          |

**User's choice:** Just you (Recommended).

### Q3: How is the spike verdict recorded?

| Option                                 | Description                                                                           | Selected |
| -------------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| `35-SPIKE.md` with outcome + rationale | Single file: device, time, what felt right/wrong, verdict. Audit trail for ARCADE-01. | ✓        |
| Embedded in CONTEXT.md update          | Append to `<decisions>` once decided. One file but bigger.                            |          |
| GitHub issue / commit message          | Verdict lives in the flag-flip commit. Lightweight but hard to reference later.       |          |

**User's choice:** `35-SPIKE.md` (Recommended).

### Q4: If you're on the fence after the feel-test, what happens?

| Option                          | Description                                                                            | Selected |
| ------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| Default to rotate-prompt        | Safer path — declare `needsLandscape=true`. One-line change vs. shipping uncertain UX. | ✓        |
| Default to ship-vertical        | Bias toward better mobile UX, accept polish later.                                     |          |
| Escalate to redesign mini-spike | Try multi-column lanes before deciding. Defers the call.                               |          |

**User's choice:** Default to rotate-prompt (Recommended).

---

## Area 3 — Tablet behavior

### Q1: How should ArcadeRhythmGame behave on tablet?

| Option                                                  | Description                                                                                           | Selected |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Same single-vertical-lane in both orientations          | Tablet portrait + landscape both use existing single-lane code. SC #3 wording corrected as docs slip. | ✓        |
| Single-vertical-lane on phone, tablet always plays      | Same as above with explicit `useDeclareNeedsLandscape(false)` on tablet.                              |          |
| Add a tablet-only multi-column variant                  | Phone single-lane (or prompt); tablet gets a 2–3 column redesign. Bigger scope.                       |          |
| Keep tablet-landscape locked, prompt on tablet-portrait | Most conservative; contradicts Phase 34 D-12 tablet-never-prompts.                                    |          |

**User's choice:** Same single-vertical-lane in both orientations (Recommended).
**Notes:** Confirmed via preview that all four phone/tablet × portrait/landscape quadrants render the same vertical-lane renderer.

### Q2: Tablet renders regardless of phone spike outcome — confirm?

| Option                             | Description                                                                                                 | Selected |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- |
| Yes, tablet always plays           | Tablet (≥768) calls `useDeclareNeedsLandscape(false)` unconditionally. Even if phone spike → rotate-prompt. | ✓        |
| Tablet inherits phone decision     | Simpler logic but contradicts tablet-never-prompts.                                                         |          |
| Spike on tablet first, then decide | Don't lock the tablet rule before the spike.                                                                |          |

**User's choice:** Yes, tablet always plays (Recommended).

### Q3: ROADMAP SC #3 wording — fix it as part of this phase?

| Option                                     | Description                                                   | Selected |
| ------------------------------------------ | ------------------------------------------------------------- | -------- |
| Fix SC #3 in ROADMAP early                 | Update wording before planning. Small docs commit.            | ✓        |
| Note inconsistency, fix during planning    | Flag in CONTEXT, planner updates ROADMAP.                     |          |
| Leave SC #3 as-is, document interpretation | Don't touch ROADMAP. Risk: future audits see literal wording. |          |

**User's choice:** Fix SC #3 in ROADMAP early (Recommended).

### Q4 (clarifier): Tablet breakpoint — which width gets the "never prompt, always play" rule?

| Option                                  | Description                                                                                    | Selected |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| ≥768px                                  | Matches Phase 34 RotatePromptOverlay viewport gate. Consistency.                               | ✓        |
| ≥1024px                                 | Stricter — only iPad-Pro-and-up plays. Different threshold.                                    |          |
| Defer — rely on Phase 34's overlay gate | Don't add new logic; declare `true` and let overlay's `<768` filter suppress prompt on tablet. |          |

**User's choice:** ≥768px (Recommended).
**Notes:** Explicit viewport-aware declaration in component is needed because Phase 34 D-19 also gates the Android-PWA `screen.orientation.lock('landscape')` on context value — relying solely on the overlay gate would still force iPads to lock landscape, which we don't want.

---

## Area 4 — Fallback path cleanup

### Q1: If spike outcome is rotate-prompt, what's the cleanup scope?

| Option                                               | Description                                                                                           | Selected |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Minimal: keep current code, remove TODO + spike flag | Spike flag goes; line 122-127 TODO replaced with permanent comment citing 35-SPIKE.md. Single commit. | ✓        |
| Add viewport-aware declaration                       | `useDeclareNeedsLandscape(viewportWidth < 1024)`. Phone true, tablet false.                           |          |
| Extract to a `needsLandscape` helper like Phase 34   | Match Phase 34 helper + unit test pattern. Overkill for binary decision.                              |          |

**User's choice:** Minimal cleanup (Recommended).
**Notes:** During Q4 clarifier, the actual chosen tablet gate is `<768` (not `<1024` as the preview text suggested). CONTEXT.md D-10 captures the correct gate.

### Q2: If spike outcome is ship-vertical, what's the cleanup scope?

| Option                            | Description                                                                                                                            | Selected |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Promote spike behavior to default | Remove flag; `useDeclareNeedsLandscape` becomes viewport-aware (false on phone + tablet). Add responsive polish surfaced during spike. | ✓        |
| Promote + multi-pass polish phase | Ship unlock + bundle tile sizing / hit zone / header fixes into Phase 35 plans.                                                        |          |
| Ship behind a feature flag        | Keep spike flag in prod (default off), roll out via flag. Overkill for v3.4 beta.                                                      |          |

**User's choice:** Promote spike behavior to default (Recommended).
**Notes:** Polish punch list (if any) is bundled into Phase 35 plans unless planner judges it too large to fit.

---

## Claude's Discretion

- Exact mechanism for viewport-aware declaration (inline `matchMedia` vs. small reusable hook).
- Exact phrasing of the post-decision comment replacing the line 122-127 TODO.
- `35-SPIKE.md` format (prose vs. structured form).
- Whether `35-SPIKE.md` lives in `.planning/phases/35-.../` (project record) or `.planning/spikes/` (separate namespace) — in-phase is the default.
- Whether to bundle spike-surfaced polish into Phase 35 plans or split into a "Phase 35.5" follow-up. Planner judges based on punch list size.

## Deferred Ideas

- Multi-column / Guitar-Hero-style lane redesign — if both spike outcomes (ship-vertical + rotate-prompt) feel wrong long-term, future phase.
- `needsLandscape(viewport)` extracted helper + unit test — Phase 34 style, rejected here as overkill for a binary check.
- Kid tester feedback loop — post-beta, no formalized infra in this phase.
- Tile sizing / hit zone / header polish punch list — bundled into Phase 35 OR split into "Phase 35.5 portrait polish" follow-up based on planner judgment.
