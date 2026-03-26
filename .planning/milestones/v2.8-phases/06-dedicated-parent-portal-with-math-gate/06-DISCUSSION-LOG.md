# Phase 6: Dedicated Parent Portal with Math Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 06-dedicated-parent-portal-with-math-gate
**Areas discussed:** Entry point & navigation, Gate behavior, Portal content & layout, Relationship to Settings

---

## Entry Point & Navigation

### How should parents discover the parent portal?

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar/bottom nav icon | Add dedicated icon to navigation bar — always visible, tapping shows math gate | |
| Dashboard card only | A card on the student dashboard, less visible | |
| Settings section with prominent link | Keep in Settings but make visually distinct | |
| Multiple entry points | Sidebar + dashboard card + Settings link | |

**User's choice:** Custom — Sidebar on desktop (ShieldCheck icon + "Parent Zone"), top of Settings on mobile (don't overload mobile bottom nav)
**Notes:** User specifically wants to avoid adding to mobile bottom nav which already has 5+ items

### What icon and label?

| Option | Description | Selected |
|--------|-------------|----------|
| Shield + "Parent Zone" | ShieldCheck icon, "Parent Zone" label | ✓ |
| Users + "For Parents" | Users icon, direct label | |
| Lock + "Parent Area" | Lock icon, neutral label | |

**User's choice:** Shield + "Parent Zone"

### Mobile entry point location?

| Option | Description | Selected |
|--------|-------------|----------|
| Top of Settings, before other sections | Prominent card at very top | ✓ |
| Its own section after avatar | Dedicated SettingsSection | |
| Replace current subscription section | Subscription becomes portal entry | |

**User's choice:** Top of Settings, before other sections

---

## Gate Behavior

### When should the math gate appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Every visit | Gate appears every navigation to /parent-portal | ✓ |
| Once per session | Solve once, free until app closed | |
| Timed session (10 min) | Access lasts for set duration | |

**User's choice:** Every visit

### Gate UX style?

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen overlay (current pattern) | Reuse ParentGateMath as fixed overlay | ✓ |
| Inline gate page | Dedicated /parent-portal/gate page | |

**User's choice:** Full-screen overlay (current pattern)

---

## Portal Content & Layout

### What sections should the portal contain?

| Option | Description | Selected |
|--------|-------------|----------|
| Subscription management | Plan, billing, cancel/re-subscribe | ✓ |
| Practice heatmap | 52-week calendar heatmap | ✓ |
| Child's progress summary | Trail progress, stars, level/XP | ✓ |
| Notification & streak settings | Push notifications + weekend pass | ✓ |

**User's choice:** All four sections

### Progress summary detail level?

| Option | Description | Selected |
|--------|-------------|----------|
| Quick stats cards | Glass cards: level, XP, stars, nodes, streak | ✓ |
| Detailed breakdown by path | Per-path stats (Treble/Bass/Rhythm) | |
| Minimal — just level and streak | Ultra-simple, two numbers | |

**User's choice:** Quick stats cards

---

## Relationship to Settings

### Should parent-gated features move to portal?

| Option | Description | Selected |
|--------|-------------|----------|
| Move them into portal | Weekend pass + notifications move to portal, Settings becomes simpler | ✓ |
| Keep in Settings, add links | Features stay with own gates, portal links to them | |
| Move some, keep some | Weekend pass + notifications move, subscription stays in both | |

**User's choice:** Move them into portal

---

## Claude's Discretion

- Exact card layout and spacing
- Section order within portal
- BackButton destination
- Gate-solved animation/transition

## Deferred Ideas

None
