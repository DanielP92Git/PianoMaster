# Phase 3: Push Notification Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 03-push-notification-integration
**Areas discussed:** Notification architecture, Action button behavior, iOS app-open flow, Notification content

---

## Notification Architecture

### Q1: Edge Function approach

| Option | Description | Selected |
|--------|-------------|----------|
| Extend send-daily-push (Recommended) | Add practice check-in logic into same Edge Function. One cron, one pass. Built-in dedup. | ✓ |
| New send-practice-push function | Separate Edge Function + pg_cron. More modular but two cron jobs to maintain. | |
| Single function, two cron calls | One function with type param, two pg_cron entries at different times. | |

**User's choice:** Extend send-daily-push
**Notes:** Simplest approach, no new infrastructure.

### Q2: Notification priority

| Option | Description | Selected |
|--------|-------------|----------|
| Practice check-in first (Recommended) | If no practice log → send practice check-in. If practiced but no app use → send app-usage reminder. | ✓ |
| App-usage reminder first | Keep existing as default, practice check-in only if app used but no practice logged. | |
| Always practice check-in | Replace app-usage reminder entirely. | |

**User's choice:** Practice check-in first
**Notes:** Aligns with v2.7 milestone focus on instrument practice tracking.

### Q3: Cron timing

| Option | Description | Selected |
|--------|-------------|----------|
| Keep 14:00 UTC (Recommended) | Same after-school time slot. No new cron entry needed. | ✓ |
| Earlier: 11:00 UTC | Midday nudge, ~1-2pm Israel. | |
| Later: 17:00 UTC | Evening reminder, ~7-8pm Israel. | |

**User's choice:** Keep 14:00 UTC
**Notes:** None.

### Q4: Skip logic tables

| Option | Description | Selected |
|--------|-------------|----------|
| Check instrument_practice_logs only (Recommended) | Each notification type checks its own table. | ✓ |
| Check both tables | Skip if any activity today. More aggressive dedup. | |

**User's choice:** Check instrument_practice_logs only
**Notes:** Clean separation between practice check-in and app-usage reminder skip logic.

---

## Action Button Behavior

### Q5: How "Yes, I practiced!" logs practice

| Option | Description | Selected |
|--------|-------------|----------|
| Open app + auto-log (Recommended) | SW opens /?practice_checkin=1. Dashboard auto-logs. Unified with iOS. No SW auth complexity. | ✓ |
| SW direct fetch to Supabase | SW makes fetch with stored auth token. No app open needed. Auth complexity in SW. | |
| SW postMessage to open tab | Depends on tab being open. Fragile. | |

**User's choice:** Open app + auto-log
**Notes:** Unified path for all platforms.

### Q6: What "Not yet" does

| Option | Description | Selected |
|--------|-------------|----------|
| Just dismiss (Recommended) | Close notification silently. No follow-up. | |
| Dismiss + snooze 2h | Close and schedule local follow-up in 2 hours. | ✓ |
| Open app to dashboard | Close and open dashboard. Gentle nudge. | |

**User's choice:** Dismiss + snooze 2h
**Notes:** User clarified snooze cycle: server push → optional snooze → snoozed notification → done. Counts as 1/day. No infinite snooze chain.

### Q7: Snooze vs 1/day rule conflict

| Option | Description | Selected |
|--------|-------------|----------|
| Drop snooze, just dismiss | Honor PUSH-03 strictly. | |
| Snooze is exempt from 1/day | Local SW reminder ≠ server push. | |
| Snooze replaces, not adds | The snooze IS the day's notification, just delayed. | |

**User's choice:** Other — "The expected logic: user gets 1 notification → then snoozes if they want → receives the snoozed notification, and that's it, no more notifications. This cycle counts as 1 per day."
**Notes:** Snooze is part of the same notification cycle, not a separate notification. One-shot snooze only.

---

## iOS App-Open Flow

### Q8: App behavior on ?practice_checkin=1

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-log + flash confirmation (Recommended) | Dashboard auto-calls logPractice(), shows animation. Zero taps. URL param cleaned up. | ✓ |
| Highlight practice card + prompt | Scroll to card, pulsing highlight. Student taps manually. | |
| Mini-modal overlay | "Did you practice?" modal over dashboard. More intrusive. | |

**User's choice:** Auto-log + flash confirmation
**Notes:** Zero-friction unified path.

### Q9: Already-logged state handling

| Option | Description | Selected |
|--------|-------------|----------|
| Show "Already logged" toast (Recommended) | Brief friendly toast, no duplicate XP, URL param cleaned. | ✓ |
| Silently ignore | Load dashboard normally. | |
| Show practice card in completed state | Scroll to card already in green completed state. | |

**User's choice:** Show "Already logged" toast
**Notes:** None.

---

## Notification Content

### Q10: Content style

| Option | Description | Selected |
|--------|-------------|----------|
| Simple with light variants (Recommended) | 2-3 rotating messages asking "Did you practice?" No streak/XP context. | ✓ |
| Context-aware variants | Include practice streak in message, mirror existing push style. | |
| Single fixed message | Always same message. Predictable, no randomization. | |

**User's choice:** Simple with light variants
**Notes:** Practice check-in is about real instrument practice, not app metrics.

### Q11: Notification tone

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly question (Recommended) | Warm and curious. "Did you practice your piano today? 🎹" No pressure. | ✓ |
| Enthusiastic encouragement | Energetic. "Time to check in! Did you rock the piano?" More pushy. | |
| Minimal and neutral | "Daily practice check-in." Functional, no personality. | |

**User's choice:** Friendly question
**Notes:** Matches app's encouraging kid-friendly style.

---

## Claude's Discretion

- D-16: Exact message variant wording
- D-17: SW notificationclick handler implementation for practice-checkin type
- D-18: URL param cleanup approach
- D-19: Snooze scheduling mechanism in SW

## Deferred Ideas

None.
