# Phase 19: Post-Game Trail Return - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 19-post-game-trail-return
**Areas discussed:** Free play trail button, Challenge mode, GameOverScreen, POST-01 verification

---

## Free Play Trail Button

**User's initial clarification:** Instead of confusing kids with button options, implement Duolingo trail logic:

- Trail games: app navigates back to trail to continue to the next node
- Free play games: "Back to Games" / "Play Again"

This reframed the entire discussion — no "Go to Trail" button needed in free play mode.

| Option                         | Description                                                            | Selected |
| ------------------------------ | ---------------------------------------------------------------------- | -------- |
| Add as third button            | Keep Play Again + add "Go to Trail" + "To Games Mode"                  |          |
| Replace "To Games Mode"        | Replace exit button with "Go to Trail"                                 |          |
| Side-by-side row               | Split row with "Go to Trail" and "To Games Mode"                       |          |
| Duolingo-style (user proposed) | Trail: single CTA back to trail. Free play: Play Again + Back to Games |          |

**User's choice:** Duolingo-style — trail games get single CTA to trail, free play keeps Play Again + Back to Games
**Notes:** User explicitly wanted to avoid confusing kids with too many button options

### CTA Label Sub-Discussion

| Option           | Description                 | Selected |
| ---------------- | --------------------------- | -------- |
| "Continue"       | Generic, Duolingo default   |          |
| "Onward!"        | Short, fun, Duolingo energy |          |
| "Next Adventure" | Exciting and forward-moving |          |
| "Claim XP"       | Reward-focused              |          |
| "Back to Map"    | Clear and literal           |          |

**User's choice:** "Next Adventure"
**Notes:** User wanted something more exciting than generic "Continue", suggested "Claim XP" / "Next Adventure" as examples

### Next Node Navigation Sub-Discussion

| Option                           | Description                                               | Selected |
| -------------------------------- | --------------------------------------------------------- | -------- |
| Always return to trail           | Duolingo-style: go back to trail map so kid sees progress |          |
| Keep direct "Continue to [Node]" | Skip trail map and jump into next node                    |          |

**User's choice:** Always return to trail
**Notes:** None

### Mid-Node Exercise Flow

| Option                            | Description                                            | Selected |
| --------------------------------- | ------------------------------------------------------ | -------- |
| Keep stepping through exercises   | Within a node, step through all exercises sequentially |          |
| Return to trail between exercises | Go back to trail after each individual exercise        |          |

**User's choice:** Keep stepping through exercises
**Notes:** None

### Single Button vs Play Again

| Option                       | Description                                            | Selected |
| ---------------------------- | ------------------------------------------------------ | -------- |
| Single button only           | Clean Duolingo-style: "Next Adventure" only, no replay |          |
| Keep Play Again as secondary | "Next Adventure" primary + small "Play Again" below    |          |

**User's choice:** Single button only
**Notes:** None

---

## Challenge Mode

| Option            | Description                                               | Selected |
| ----------------- | --------------------------------------------------------- | -------- |
| Back to Trail     | Trail is home now, consistent with Phase 17 approach      |          |
| Back to Dashboard | Keep current behavior, challenges launched from dashboard |          |
| You decide        | Claude picks                                              |          |

**User's choice:** Back to Trail
**Notes:** Consistent with trail-first navigation philosophy from Phase 17

---

## GameOverScreen

| Option                        | Description                                                                                        | Selected |
| ----------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| Same pattern as VictoryScreen | Trail: "Try Again" + "Back to Trail". Free play: "Try Again" + "Back to Games". Fix hardcoded URL. |          |
| Keep as-is                    | Stay generic, only fix hardcoded URL                                                               |          |
| Trail: auto-return only       | No "Try Again" for trail games, encourage break                                                    |          |

**User's choice:** Same pattern as VictoryScreen
**Notes:** None

---

## POST-01 Verification

Verified current trail-mode VictoryScreen behavior and identified changes needed:

- Remove "Continue to [Node Name]" direct jump
- Remove secondary "Play Again" + "Back to Trail" row
- Replace all trail action buttons with single "Next Adventure" CTA
- Keep mid-node "Next Exercise" stepping

No separate question needed — covered through the free play discussion.

---

## Claude's Discretion

- Button styling for "Next Adventure" (color, gradient)
- GameOverScreen prop threading approach
- Translation key naming for new labels
- Smart tab routing on GameOverScreen's "Back to Trail"

## Deferred Ideas

None — discussion stayed within phase scope
