# Phase 17: Push Notifications - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

COPPA-compliant parent opt-in to push notifications, service worker Web Push registration, server-enforced 1/day rate limit, context-aware notification messages, and disable/re-enable from settings. Notification content creation, scheduling infrastructure, and settings UI changes are in scope. Streak mechanics, game changes, and new content are separate phases.

</domain>

<decisions>
## Implementation Decisions

### COPPA Consent Mechanism
- In-app parent gate (not a separate email flow) — when notification toggle is first enabled, show a math problem verification ("Solve 47 + 28 to confirm you're a parent")
- Consent stored in database on first successful verification — subsequent toggles do not require re-consent
- Gate uses COPPA "knowledge-based" standard (similar to YouTube Kids pattern)
- Re-enabling after disable does NOT require parent re-consent — DB flag persists

### Opt-In Prompt Surface
- Primary: Settings > Notifications — upgrade existing NotificationPermissionCard with parent gate
- Secondary: One-time dismissible dashboard card shown after first week of use, linking to settings
- No aggressive or repeated prompting — discoverable, not pushy

### Notification Trigger & Scheduling
- Supabase pg_cron triggers a daily scheduled function (no external scheduler)
- Fixed afternoon send time (e.g., 4-5pm in student's timezone) — after school, before dinner window
- Skip students who already practiced today (check students_score for today's entries)
- 1/day rate limit enforced via `last_notified_at` timestamp column on push subscription table
- pg_cron calls an Edge Function that queries eligible students and sends Web Push via web-push library

### Message Content & Tone
- Messages written for the child (age 8), not the parent — fun, encouraging, 8-year-old-friendly
- Musical emojis used in titles and bodies for engagement
- 3-4 trigger types with 2-3 message variants each (~10-12 total messages):
  - Streak at risk (highest priority)
  - XP near level-up
  - Daily goals waiting
  - Generic encouragement (fallback)
- Priority order when multiple triggers apply: streak > XP > goals > generic — only one notification sent
- Random variant selected within the winning trigger type

### Opt-Out & Re-Enable Flow
- Toggle off in settings immediately unsubscribes the Web Push subscription AND updates DB flag
- Simple on/off — no "pause for X days" option
- Re-enabling re-subscribes and re-registers push subscription (browser may re-prompt for permission if previously revoked)

### Notification Click Action
- Tapping notification opens the app to the trail page (continue learning)
- Existing service worker notificationclick handler extended with new notification type

### Claude's Discretion
- VAPID key generation and storage approach
- Exact pg_cron schedule expression and timezone handling
- Edge Function architecture (single function vs. separate query + send)
- Push subscription database table schema details
- Dashboard opt-in card design and dismissal persistence
- Math problem difficulty and randomization

</decisions>

<specifics>
## Specific Ideas

- Math problem gate inspired by YouTube Kids' parent verification pattern
- Dashboard prompt should feel like a helpful suggestion, not a nag — show only once, after the family has had a week to get comfortable with the app
- Messages should feel like a friend reminding the kid, not a teacher demanding practice

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/notificationService.js`: Full push notification service with subscribe/unsubscribe/VAPID key conversion — ready to use, just needs VAPID key wiring
- `src/components/settings/NotificationPermissionCard.jsx`: Existing card for browser permission request — needs parent gate wrapper added
- `public/sw.js` (lines 329-539): Push event listener and notificationclick handler already implemented with payload parsing, tag support, and action buttons
- `src/services/reminderService.js` and `src/services/dashboardReminderService.js`: Existing local reminder patterns (can inform notification UX but are separate from Web Push)
- `src/pages/AppSettings.jsx`: Full notification settings section with toggles, quiet hours, reminder time — integration point for push toggle

### Established Patterns
- Edge Functions: webhook, create-checkout, cancel-subscription patterns established in v1.8
- Brevo email Edge Function from v1.1 — similar serverless function pattern
- Supabase RLS: client SELECT-only, service_role writes pattern from subscription tables
- `SubscriptionContext` pattern for global state — could inform push notification state management

### Integration Points
- `AppSettings.jsx` notification section: add push notification toggle with parent gate
- `Dashboard.jsx`: add one-time opt-in prompt card
- `sw.js`: extend notificationclick for new push notification type (open trail page)
- Database: new push_subscriptions table with student_id, subscription JSON, consent flag, last_notified_at
- Supabase Edge Function: new function for sending Web Push notifications
- pg_cron: scheduled job to trigger daily notification Edge Function

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-push-notifications*
*Context gathered: 2026-03-04*
