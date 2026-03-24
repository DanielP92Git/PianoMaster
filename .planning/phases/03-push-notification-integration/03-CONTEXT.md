# Phase 3: Push Notification Integration - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Students receive a daily "Did you practice your instrument today?" push notification that skips those who already logged, without doubling up with the existing app-usage reminder. Includes interactive action buttons on Android/desktop and URL-param auto-log on iOS.

</domain>

<decisions>
## Implementation Decisions

### Notification Architecture
- **D-01:** Extend the existing `send-daily-push` Edge Function — no new Edge Function or pg_cron job. Single pass over `push_subscriptions` at 14:00 UTC handles both practice check-in and app-usage reminder.
- **D-02:** Practice check-in takes priority. For each student: if they haven't logged instrument practice today → send practice check-in notification. If they HAVE logged practice but haven't used the app → send existing app-usage reminder. Never both.
- **D-03:** Keep existing 14:00 UTC cron schedule (~4-5pm Israel time, after-school hours).
- **D-04:** Practice check-in skip logic checks `instrument_practice_logs` table for today's date. App-usage reminder skip logic keeps existing `students_score` check. Each notification type checks its own relevant table.
- **D-05:** `last_notified_at` continues to enforce 1 notification cycle per day. A snooze + snoozed notification counts as one cycle.

### Action Button Behavior (Android/Desktop)
- **D-06:** Notification shows two action buttons: "Yes, I practiced!" and "Not yet".
- **D-07:** "Yes, I practiced!" opens the app at `/?practice_checkin=1` — same unified path as iOS. Dashboard detects the URL param and auto-logs practice via `practiceLogService`. No auth complexity in service worker.
- **D-08:** "Not yet" dismisses the notification and schedules a local SW-triggered follow-up notification in 2 hours. This snooze + snoozed notification is part of the same notification cycle (1/day rule honored). No further notifications after the snoozed one fires.
- **D-09:** If the snoozed notification fires and the student taps "Yes, I practiced!" → same auto-log path. If they tap "Not yet" again → just dismiss (no infinite snooze chain).

### iOS App-Open Flow
- **D-10:** On iOS (no action button support), tapping the notification opens the app with `?practice_checkin=1` URL param.
- **D-11:** Dashboard detects `?practice_checkin=1`, automatically calls `practiceLogService.logPractice()`, and shows the PracticeLogCard animation sequence (checkmark + "+25 XP"). Zero taps needed after opening the app. URL param cleaned up after processing.
- **D-12:** If student already logged practice today and taps the notification anyway: dashboard detects param + already-logged state, shows a brief friendly toast ("You already logged today's practice!"), no duplicate XP. URL param cleaned up.

### Notification Content
- **D-13:** Practice check-in uses simple, friendly question messages with 2-3 light rotating variants. No streak/XP context — the question is about real instrument practice, not app metrics.
- **D-14:** Tone: warm and curious, matching the app's encouraging kid-friendly style. Examples: "Did you practice your piano today? 🎹" / "How was today's practice? 🎵" — no pressure, just a gentle check-in.
- **D-15:** Notification tag: `practice-checkin` (distinct from existing `daily-practice` tag used by app-usage reminder). This allows the SW to differentiate handling.

### Claude's Discretion
- **D-16:** Exact message variant wording — Claude picks 2-3 variants following the friendly question tone.
- **D-17:** Service worker `notificationclick` handler implementation details for the new `practice-checkin` type.
- **D-18:** URL param cleanup approach (replaceState vs. navigate).
- **D-19:** Snooze scheduling mechanism in SW (setTimeout vs. SW alarm API).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Push Notification Infrastructure
- `supabase/functions/send-daily-push/index.ts` — Existing Edge Function to extend with practice check-in priority logic
- `public/sw.js` — Service worker push event handler and notificationclick routing (lines 342-540+)
- `src/services/notificationService.js` — Client-side push subscription management, VAPID key handling
- `supabase/migrations/20260304000001_add_push_subscriptions.sql` — push_subscriptions table schema (last_notified_at, is_enabled, parent_consent)

### Practice Log Infrastructure (Phase 2 output)
- `src/services/practiceLogService.js` — Practice logging service (logPractice, getPracticeStatus)
- `src/services/practiceStreakService.js` — Practice streak service (weekend freeze, streak calculation)
- `src/components/dashboard/PracticeLogCard.jsx` — Dashboard practice card with animation sequence
- `supabase/migrations/20260324000001_instrument_practice_tables.sql` — instrument_practice_logs and instrument_practice_streak tables

### Dashboard Integration
- `src/components/layout/Dashboard.jsx` — Dashboard layout where URL param detection goes
- `src/components/dashboard/PushOptInCard.jsx` — Push opt-in card pattern reference

### Settings & Consent
- `src/components/settings/NotificationPermissionCard.jsx` — 6-state permission UI (push consent already handled here)

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card pattern, toast styling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `send-daily-push/index.ts` — Existing cron Edge Function with VAPID init, push sending, rate limiting, context gathering. Extend with practice check-in priority branch.
- `sw.js` notificationclick handler — Existing action routing by `data.type`. Add `practice-checkin` type handler alongside existing `daily-practice` type.
- `practiceLogService.js` — Already has `logPractice()` and `getPracticeStatus()` from Phase 2. Dashboard auto-log calls these directly.
- `PracticeLogCard.jsx` — Already has animation sequence (checkmark + "+25 XP"). Auto-log from URL param triggers the same visual flow.

### Established Patterns
- Notification types differentiated by `data.type` field in push payload (`daily-practice`, `dashboard-practice-reminder`, `practice-reminder`).
- SW action routing: `event.action` string matching (`snooze`, `dismiss`, `open`, `practice`).
- URL-based deep linking from notifications: SW uses `clients.openWindow(url)` or `client.navigate(url)`.
- Rate limiting: `last_notified_at` column with date comparison prevents same-day re-notification.

### Integration Points
- `send-daily-push/index.ts` — Add `instrument_practice_logs` query, priority branching (practice check-in vs app-usage), new notification payload with `type: 'practice-checkin'` and action buttons.
- `sw.js` push handler — Add `actions` array for practice-checkin notifications (platform-dependent: Android shows buttons, iOS ignores them).
- `sw.js` notificationclick handler — Add `practice-checkin` type with "yes"/"not-yet" action handling, snooze scheduling.
- `Dashboard.jsx` — Add `?practice_checkin=1` URL param detection, auto-log trigger, toast for already-logged state, URL cleanup.

</code_context>

<specifics>
## Specific Ideas

- Notification flow: server push → (optional) "Not yet" snooze → snoozed local notification → done. Max 1 cycle per day.
- Snooze is one-shot: the snoozed notification's "Not yet" just dismisses (no recursive snooze).
- Auto-log path is unified across platforms: `?practice_checkin=1` triggers the same PracticeLogCard animation whether from iOS tap, Android "Yes" button, or snoozed notification "Yes" button.
- Practice check-in notification content is instrument-focused, not app-metric-focused. No streak/XP context in the notification itself.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-push-notification-integration*
*Context gathered: 2026-03-24*
