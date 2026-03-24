# Phase 5: Milestone Celebrations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 05-milestone-celebrations
**Areas discussed:** Celebration trigger, Presentation style, Milestone tracking, Visual treatment
**Mode:** --auto (all areas auto-selected, recommended options chosen)

---

## Celebration Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| After logPractice mutation onSuccess | Check new streak count in PracticeLogCard after successful log | Y |
| On dashboard load | Check streak count when dashboard renders | |
| Deferred check via service worker | Background check and notification | |

**User's choice:** [auto] After logPractice mutation onSuccess (recommended default)
**Notes:** Natural flow — celebration appears immediately after the action that earned it. No extra page loads needed.

---

## Presentation Style

| Option | Description | Selected |
|--------|-------------|----------|
| Lightweight modal overlay + ConfettiEffect | Centered modal with confetti, auto-dismiss, emerald theme | Y |
| Full VictoryScreen | Reuse game-end VictoryScreen component | |
| Inline card expansion | Expand the PracticeLogCard to show celebration in-place | |

**User's choice:** [auto] Lightweight modal overlay + ConfettiEffect (recommended)
**Notes:** VictoryScreen is a page-level game-end component (stars, XP, next exercise) — contextually wrong for a dashboard card interaction. Inline expansion would be too subtle for a milestone celebration.

---

## Milestone Tracking

| Option | Description | Selected |
|--------|-------------|----------|
| `last_milestone_celebrated` INTEGER column | Single column on instrument_practice_streak table, stores highest celebrated milestone | Y |
| `celebrated_milestones` JSONB array | Array of celebrated milestone values | |
| Client-side localStorage | Track celebrated milestones per device | |

**User's choice:** [auto] `last_milestone_celebrated` INTEGER column (recommended)
**Notes:** Simplest approach — one column, no parsing. JSONB is overkill for 4 milestones. localStorage would lose state across devices.

---

## Visual Treatment

| Option | Description | Selected |
|--------|-------------|----------|
| Emerald modal + confetti + auto-dismiss 4s | Badge icon, streak number, encouraging message, 4s timer | Y |
| Minimal toast notification | Small toast at bottom of screen | |
| Full-screen takeover | Full viewport celebration animation | |

**User's choice:** [auto] Emerald modal + confetti + auto-dismiss 4s (recommended)
**Notes:** Balanced — celebratory enough to feel rewarding, brief enough not to disrupt flow. Matches existing BossUnlockModal pattern.

---

## Claude's Discretion

- Celebration message copy per milestone tier
- Modal animation timing and easing
- `last_milestone_celebrated` update mechanism (client-side optimistic vs service call)

## Deferred Ideas

None — discussion stayed within phase scope.
