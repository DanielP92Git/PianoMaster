# Phase 4: Parent Calendar Heatmap - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 04-parent-calendar-heatmap
**Areas discussed:** Heatmap placement, Library choice, Color & visual style, Interactivity

---

## Heatmap Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below subscription card | Add heatmap as a new glass card section below subscription management. Single scrollable page. | ✓ |
| Above subscription card | Practice heatmap first, subscription second. Prioritizes what parents care about most. | |
| Separate tab or page | New route or tab. Keeps subscription and practice separated. | |

**User's choice:** Below subscription card
**Notes:** None

### Visibility Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Practice logging is free-tier. Heatmap shows regardless of subscription. | ✓ |
| Subscription-gated | Only visible to subscribed parents. Premium upsell incentive. | |
| You decide | Claude picks. | |

**User's choice:** Always visible
**Notes:** "Currently always visible, but later I will convert it to a premium feature. So document it."

---

## Library Choice

| Option | Description | Selected |
|--------|-------------|----------|
| react-activity-calendar | GitHub-style calendar. Built-in tooltip, theme, responsive. ~15KB. Roadmap recommended. | ✓ |
| Bespoke SVG | Zero dependency, full control. ~200-300 lines of code. | |
| react-calendar-heatmap | Simpler API, SVG-based. ~8KB. Less maintained. | |

**User's choice:** react-activity-calendar
**Notes:** None

### RTL Sub-question

| Option | Description | Selected |
|--------|-------------|----------|
| CSS workaround is fine | direction:rtl or CSS transform. Standard approach for Hebrew. | ✓ |
| Must be native RTL | Strongly favors bespoke SVG. | |
| You decide | Claude picks. | |

**User's choice:** CSS workaround is fine
**Notes:** None

---

## Color & Visual Style

### Color Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Emerald/green (match practice card) | Consistency with PracticeLogCard's emerald accent (Phase 2, D-10). | ✓ |
| Indigo (per success criteria) | Follow success criteria literally. Matches app's primary indigo theme. | |
| You decide | Claude picks. | |

**User's choice:** Emerald/green
**Notes:** None

### Intensity Levels

| Option | Description | Selected |
|--------|-------------|----------|
| Binary only | Two states: practiced (colored) or not (gray). Matches yes/no model. | ✓ |
| Intensity with streaks | Lighter for single days, brighter for consecutive streak days. | |

**User's choice:** Binary only
**Notes:** None

---

## Interactivity

### Interaction Level

| Option | Description | Selected |
|--------|-------------|----------|
| Visual only with summary stats | No tooltips/taps. Summary stats: total days, current streak, longest streak. | ✓ |
| Tooltips on hover/tap | Hover/tap a day cell to see date. | |
| Pure visual only | Just the grid. No stats, no tooltips. | |
| You decide | Claude picks. | |

**User's choice:** Visual only with summary stats
**Notes:** None

### Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Empty grid + encouraging message | Full 52-week grid in all-gray with friendly message. | ✓ |
| Hide heatmap section entirely | Don't show until first practice log. | |
| You decide | Claude picks. | |

**User's choice:** Empty grid + encouraging message
**Notes:** None

---

## Claude's Discretion

- Card header copy and summary stat labels
- Exact react-activity-calendar theme configuration and responsive breakpoints
- Data query optimization approach
- Month/day label locale-aware formatting

## Deferred Ideas

- Premium gating of heatmap (user plans to convert in future milestone)
- Native RTL rendering (CSS workaround for now)
- Teacher view of all students' heatmaps (PARENT-F03)
