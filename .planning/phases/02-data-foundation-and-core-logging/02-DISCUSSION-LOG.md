# Phase 2: Data Foundation and Core Logging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 02-data-foundation-and-core-logging
**Areas discussed:** Practice card design, Practice streak display, Logging interaction, Streak icon & branding

---

## Practice Card Design

### Card Type

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone card | New dedicated card like DailyChallengeCard — prominent, its own glass card with icon, status text, and tap-to-log button | ✓ |
| Embedded in UnifiedStatsCard | Add a practice row inside the existing UnifiedStatsCard. Saves space but less prominent | |
| Compact toggle card | Slim single-row card with icon + text + toggle. Minimal footprint | |

**User's choice:** Standalone card
**Notes:** None

### Card Placement

| Option | Description | Selected |
|--------|-------------|----------|
| After UnifiedStatsCard | Second position — right below XP/streak/goals hero card | ✓ |
| Top of dashboard | Very first card, above UnifiedStatsCard | |
| After DailyChallengeCard | Third position — less prominent but groups action cards | |

**User's choice:** After UnifiedStatsCard
**Notes:** None

### Streak Location in Card

| Option | Description | Selected |
|--------|-------------|----------|
| Streak inline in card | Practice streak counter lives inside the practice card itself — one cohesive unit | ✓ |
| Streak separate | Practice card is just the log button. Streak counter appears elsewhere | |

**User's choice:** Streak inline in card
**Notes:** None

### Dual Display

| Option | Description | Selected |
|--------|-------------|----------|
| Practice card only | Streak appears only in the standalone practice card. Clean separation | ✓ |
| Both places | Show practice streak in both the practice card and UnifiedStatsCard | |

**User's choice:** Practice card only
**Notes:** None

---

## Practice Streak Display

### Streak Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Icon + count + label | Simple row: 🎹 5-day practice streak. Matches existing fire-icon streak style | ✓ |
| Badge with number | Circular/pill badge with streak number inside, label below | |
| You decide | Claude picks best visual treatment | |

**User's choice:** Icon + count + label
**Notes:** None

---

## Logging Interaction

### Tap Response

| Option | Description | Selected |
|--------|-------------|----------|
| Instant + micro-animation | Button immediately changes to 'Logged!' state with quick checkmark animation. Respects reduced-motion | ✓ |
| Instant, no animation | Button swaps to disabled state immediately with no flourish | |
| Confirmation prompt | Small 'Are you sure?' confirmation before logging | |

**User's choice:** Instant + micro-animation
**Notes:** None

### XP Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in button | Button text shows '+25 XP' briefly then settles to 'Logged!'. No toast | ✓ |
| Floating toast | Standard toast notification '+25 XP earned!' | |
| Both | Inline + toast | |

**User's choice:** Inline in button
**Notes:** Sequence: [ Yes, I practiced! ] → [ ✓ Logged! +25 XP ] (2s) → [ ✓ Practiced today ]

### Already-Logged State

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle completed state | Card stays visible with muted green tint, checkmark, 'Practiced today!' text, disabled button. Streak still visible | ✓ |
| Hide card entirely | Card disappears once logged | |
| Collapse to one line | Card shrinks to compact single line | |

**User's choice:** Subtle completed state
**Notes:** None

---

## Streak Icon & Branding

### Icon Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Piano keys | lucide-react 'Piano' icon. Directly communicates instrument practice | ✓ |
| Music note | lucide-react 'Music' icon. More generic | |
| Guitar/instrument | Generic instrument icon. Future-proof but less specific | |
| You decide | Claude picks best icon | |

**User's choice:** Piano keys
**Notes:** None

### Accent Color

| Option | Description | Selected |
|--------|-------------|----------|
| Emerald/green | emerald-400 border, green-300 text, bg-green-500/20 button. 'Go/done' connotation | ✓ |
| Amber/warm | Warm amber/yellow. May be too close to fire streak | |
| Indigo/blue | Matches primary palette but may blend in | |
| You decide | Claude picks best contrast color | |

**User's choice:** Emerald/green
**Notes:** Contrasts with amber/orange fire streak and indigo/purple XP ring

---

## Claude's Discretion

- Practice card copy/messaging tone
- Micro-animation implementation details (timing, easing, reduced-motion fallback)
- RLS policy specifics (exact definitions following existing patterns)

## Deferred Ideas

None — discussion stayed within phase scope.
