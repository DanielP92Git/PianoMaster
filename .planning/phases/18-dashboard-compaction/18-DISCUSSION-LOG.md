# Phase 18: Dashboard Compaction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 18-dashboard-compaction
**Areas discussed:** Hero treatment, Card layout & density, Recordings access, Practice Tools placement, Loading skeleton, Onboarding Tour, DailyMessageBanner styling, Practice check-in URL handling

---

## Hero Treatment

| Option           | Description                                                                                         | Selected |
| ---------------- | --------------------------------------------------------------------------------------------------- | -------- |
| Remove entirely  | Delete hero image/fireflies. Start with compact greeting bar (avatar + name + level). Saves ~220px. | ✓        |
| Shrink to ~100px | Keep background image but reduce height by half. Drop fireflies.                                    |          |
| Keep as-is       | Just removing PlayNextButton is enough to shift the vibe.                                           |          |

**User's choice:** Remove entirely
**Notes:** None

### Follow-up: Greeting bar style

| Option               | Description                                                                             | Selected |
| -------------------- | --------------------------------------------------------------------------------------- | -------- |
| Glass card strip     | Thin glass card containing avatar + name + level pill. Consistent with dashboard cards. | ✓        |
| Inline text, no card | Avatar + greeting + level on purple gradient background. Lighter feel.                  |          |
| You decide           | Claude picks the approach.                                                              |          |

**User's choice:** Glass card strip

### Follow-up: Greeting bar info

| Option                         | Description                                                                | Selected |
| ------------------------------ | -------------------------------------------------------------------------- | -------- |
| Avatar + Name + Level pill     | Same info as current hero but compact. Level pill gradient already exists. | ✓        |
| Avatar + Name only             | Minimal — level info already in UnifiedStatsCard.                          |          |
| Avatar + Name + Level + Streak | Add streak flame count for at-a-glance.                                    |          |

**User's choice:** Avatar + Name + Level pill

---

## Card Layout & Density

| Option                   | Description                                                                                    | Selected |
| ------------------------ | ---------------------------------------------------------------------------------------------- | -------- |
| Tighter single column    | Keep single column, reduce gaps from space-y-12 to space-y-4/6. Cards internally more compact. | ✓        |
| 2-column grid on desktop | Single column mobile, 2-col grid desktop. Reduces scrolling on larger screens.                 |          |
| Merge small cards        | Combine related cards. Fewer cards = less visual noise.                                        |          |

**User's choice:** Tighter single column

### Follow-up: Card count

| Option                   | Description                                                                       | Selected |
| ------------------------ | --------------------------------------------------------------------------------- | -------- |
| Keep all cards           | DASH-03 requires all remain visible. Tighten gaps, make cards internally compact. | ✓        |
| Collapse some by default | Auto-collapse less critical ones with expand toggles.                             |          |
| Remove PushOptIn         | Move PushOptInCard to Settings.                                                   |          |

**User's choice:** Keep all cards

### Follow-up: Card order

| Option                  | Description                               | Selected |
| ----------------------- | ----------------------------------------- | -------- |
| Keep current order      | Already prioritizes most important info.  | ✓        |
| Reorder for stats-first | UnifiedStats first, then DailyGoals, etc. |          |
| You decide              | Claude picks the order.                   |          |

**User's choice:** Keep current order

---

## Recordings Access

| Option                            | Description                                                              | Selected |
| --------------------------------- | ------------------------------------------------------------------------ | -------- |
| Existing History button is enough | Practice Tools already has History circle linking to /practice-sessions. | ✓        |
| Add a dedicated Recordings card   | New glass card showing recent recordings.                                |          |
| Link in greeting bar              | Small icon button in greeting bar.                                       |          |

**User's choice:** Existing History button is enough

### Follow-up: Rename History

| Option                       | Description                                                       | Selected |
| ---------------------------- | ----------------------------------------------------------------- | -------- |
| Rename History to Recordings | Label says "History" but leads to recordings. Change for clarity. | ✓        |
| Make it more discoverable    | Circle button may not be prominent enough.                        |          |
| Desktop sidebar still has it | Only matters for mobile.                                          |          |

**User's choice:** Rename History to Recordings

### Follow-up: Change icon

| Option                                   | Description                                   | Selected |
| ---------------------------------------- | --------------------------------------------- | -------- |
| Change icon from Piano to Mic/Headphones | Piano icon doesn't represent recordings well. | ✓        |
| Link directly from Record button too     | After recording, show link to view all.       |          |
| Done                                     | Move on.                                      |          |

**User's choice:** Change icon from Piano to Mic/Headphones

---

## Practice Tools Placement

| Option                     | Description                                    | Selected |
| -------------------------- | ---------------------------------------------- | -------- |
| Keep as standalone section | 3 circles with heading. Tighten spacing.       | ✓        |
| Merge into greeting bar    | Move buttons into greeting bar as small icons. |          |
| Move to bottom of page     | Secondary actions at bottom.                   |          |
| Wrap in a glass card       | Put circles inside a glass card.               |          |

**User's choice:** Keep as standalone section

---

## Loading Skeleton

| Option           | Description                                            | Selected |
| ---------------- | ------------------------------------------------------ | -------- |
| You decide       | Claude updates skeleton to match final compact layout. | ✓        |
| I want to see it | Show skeleton mockup before implementing.              |          |

**User's choice:** You decide (Claude's discretion)

---

## Onboarding Tour

| Option            | Description                                                               | Selected |
| ----------------- | ------------------------------------------------------------------------- | -------- |
| Move to trail     | Trail is first thing new students see. Onboarding should introduce trail. | ✓        |
| Keep on dashboard | Dashboard has stats/tools onboarding might explain.                       |          |
| Remove entirely   | May be stale or unnecessary.                                              |          |

**User's choice:** Move to trail

### Follow-up: Scope

| Option                       | Description                                                  | Selected |
| ---------------------------- | ------------------------------------------------------------ | -------- |
| Do it in this phase          | Small move — relocate render from Dashboard to TrailMapPage. |          |
| Just remove, defer trail add | Remove from dashboard. Adding to trail is future task.       |          |

**User's choice:** You decide (Claude's discretion)

---

## DailyMessageBanner Styling

| Option                 | Description                                                                | Selected |
| ---------------------- | -------------------------------------------------------------------------- | -------- |
| Keep as-is             | Already lightweight. Tighter spacing makes it feel more compact naturally. | ✓        |
| Make it smaller/inline | Reduce padding, smaller text, or inline into greeting bar.                 |          |
| You decide             | Claude picks treatment.                                                    |          |

**User's choice:** Keep as-is

---

## Practice Check-in URL

| Option                                  | Description                                                   | Selected |
| --------------------------------------- | ------------------------------------------------------------- | -------- |
| Update to /dashboard?practice_checkin=1 | Fix push URL in Edge Function and Dashboard.jsx replaceState. | ✓        |
| Handle on trail page instead            | Move auto-log logic to TrailMapPage.                          |          |
| You decide                              | Claude picks cleanest approach.                               |          |

**User's choice:** Update to /dashboard?practice_checkin=1

---

## Claude's Discretion

- Loading skeleton design (match final compact layout)
- Onboarding Tour relocation (move to trail in this phase or defer)
- Exact card gap size (space-y-4 vs space-y-6)
- Recordings icon choice (Mic, Headphones, or other Lucide icon)

## Deferred Ideas

None — discussion stayed within phase scope
