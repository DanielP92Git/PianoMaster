---
phase: 17-push-notifications
verified: 2026-03-04T12:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Enable push notifications end-to-end on a real device"
    expected: "Math gate appears, correct answer triggers browser permission prompt, subscription saved to push_subscriptions table, green 'enabled' state shown in Settings"
    why_human: "Browser PushManager and VAPID key registration require a live browser environment with a deployed service worker and Edge Function"
  - test: "Tap a received push notification"
    expected: "Trail page (/trail) opens or gains focus"
    why_human: "Server-sent Web Push requires deployed Edge Function, pg_cron job, and a real device with push subscription registered"
  - test: "Disable push notifications from Settings"
    expected: "'Turn off' button removes browser subscription and DB row shows is_enabled=false; re-enable button appears without math gate"
    why_human: "Requires live browser PushManager state to verify unsubscribe success"
  - test: "PushOptInCard appears after first week on Dashboard"
    expected: "Card visible for students with account older than 7 days who have not dismissed it and have no active subscription; card absent for new accounts"
    why_human: "Account age check and localStorage state require a real session with a dated account"
---

# Phase 17: Push Notifications Verification Report

**Phase Goal:** Parents can opt-in to receive push notifications on behalf of their child, with COPPA-compliant consent separate from the existing parental consent flow, and students receive at most one context-aware notification per day with full control to disable.

**Verified:** 2026-03-04T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A parent must solve a math problem before push notifications can be enabled for the first time | VERIFIED | `ParentGateMath.jsx` exists with `generateMathProblem()` (20-60 + 15-40 addition), correct answer calls `onConsent()`, wrong answer resets problem and increments attempts. `NotificationPermissionCard.jsx` renders `<ParentGateMath>` in `default` pushState. |
| 2 | After initial consent, re-enabling notifications skips the math gate (DB flag persists) | VERIFIED | `NotificationPermissionCard.jsx` checks `parent_consent_granted` from DB on mount; sets `pushState = 'consent_skip'` when consent was previously granted but `is_enabled = false`. The `consent_skip` render branch shows re-enable button directly, calling `handleReEnable()` without showing `ParentGateMath`. |
| 3 | Enabling push notifications requests browser permission and saves the subscription to the push_subscriptions table | VERIFIED | `performSubscription()` in `NotificationPermissionCard.jsx` calls `requestNotificationPermission()`, then `subscribeToPushNotifications(vapidKey)`, then `savePushSubscription(studentId, subscriptionJSON)`. `savePushSubscription` in `notificationService.js` upserts to `push_subscriptions` with `is_enabled: true`, `parent_consent_granted: true`, `parent_consent_at`. Defense-in-depth auth check: `user.id !== studentId` throws Unauthorized. |
| 4 | Disabling push notifications unsubscribes from the browser push manager and updates the DB row | VERIFIED | `handleDisable()` calls `removePushSubscription(studentId)`. `removePushSubscription` in `notificationService.js` calls `unsubscribeFromPushNotifications()` (browser PushManager unsubscribe) then updates DB: `is_enabled: false, subscription: null`. Auth check present. |
| 5 | Tapping a daily-practice push notification opens the trail page | VERIFIED | `public/sw.js` lines 505-529: `notificationType === 'daily-practice'` block navigates to `/trail` via `client.navigate(urlToOpen)` with `fallback to openWindow`. Matches the `tag: 'daily-practice'` payload from `send-daily-push/index.ts`. |
| 6 | Students receive at most one push notification per day | VERIFIED | `send-daily-push/index.ts`: checks `last_notified_at.split('T')[0] === todayUtc` and skips if already notified today. Also skips if `practiceCount > 0` (already practiced today). `last_notified_at` column updated after successful send. `push_subscriptions` table has this column as TIMESTAMPTZ. |
| 7 | Notifications are context-aware (streak at risk, XP near level-up, daily goals) | VERIFIED | `selectNotification()` pure function in `send-daily-push/index.ts` implements 4-tier priority: streak > 0 → streak messages; xpToNextLevel <= 50 → XP messages; hasIncompleteGoals → goals messages; fallback generic. Each tier has 3 child-friendly emoji variants with random selection. |
| 8 | Expired subscriptions (410 Gone) are automatically disabled | VERIFIED | `send-daily-push/index.ts` catch block checks `err.message.includes('410')` or `'gone'`; on match sets `is_enabled: false, subscription: null` for that student. |
| 9 | A one-time dismissible dashboard card appears after the student's first week, linking to notification settings | VERIFIED | `PushOptInCard.jsx` checks: `isPushNotificationSupported()`, account age > 7 days, `localStorage.getItem('push_optin_dismissed') !== 'true'`, and `getPushSubscriptionStatus` not `is_enabled`. Shows Bell icon card with Link to `/settings` and dismiss button setting `push_optin_dismissed=true`. |
| 10 | Student or parent can disable notifications from settings | VERIFIED | `NotificationPermissionCard.jsx` `enabled` state renders a "Turn off" Disable button that calls `handleDisable()` → `removePushSubscription()`. AppSettings passes `studentId={user?.id}` to the card. |
| 11 | All new notification UI text has English and Hebrew translations | VERIFIED | `en/common.json` and `he/common.json` both contain `parentGate`, `pushNotifications`, and `pushOptIn` keys under `pages.settings.notifications`. All 7 keys per section present in both languages. |
| 12 | push_subscriptions table has COPPA consent schema (parent_consent_granted, parent_consent_at, last_notified_at) and RLS | VERIFIED | `20260304000001_add_push_subscriptions.sql`: all columns present with correct types. RLS enabled. 4 policies (SELECT/INSERT/UPDATE/DELETE) using `auth.uid() = student_id`. Partial index on `is_enabled = true`. Updated_at trigger present. pg_cron setup documented as manual step. |

**Score:** 12/12 truths verified

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260304000001_add_push_subscriptions.sql` | push_subscriptions table with RLS policies | VERIFIED | 131 lines. Contains `CREATE TABLE`, all required columns, RLS `ENABLE ROW LEVEL SECURITY`, 4 policies, partial index, updated_at trigger, pg_cron docs. |
| `supabase/functions/send-daily-push/index.ts` | Daily push notification Edge Function | VERIFIED | 359 lines. Contains `webpush` import, `selectNotification`, `pushTextMessage`, cron-secret auth, practiced-today check, streak/XP/goals context, 410 Gone cleanup, summary response. |
| `supabase/config.toml` | Edge Function config with verify_jwt = false | VERIFIED | Lines 319-321: `[functions.send-daily-push]` with `verify_jwt = false`. |

### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/settings/ParentGateMath.jsx` | Math problem parent verification gate | VERIFIED | 134 lines. `generateMathProblem()`, state (problem/answer/error/attempts), glass card overlay, RTL support, i18n via `useTranslation`. |
| `src/components/settings/NotificationPermissionCard.jsx` | Upgraded push notification card with parent gate flow | VERIFIED | 330 lines. Imports `ParentGateMath`. Full state machine: loading/enabled/consent_skip/default/denied/unsupported. `handleConsentGranted`, `handleDisable`, `handleReEnable`. |
| `src/services/notificationService.js` | savePushSubscription and removePushSubscription functions | VERIFIED | 291 lines. `savePushSubscription` (upsert with consent fields, auth check), `removePushSubscription` (browser unsubscribe + DB update, auth check), `getPushSubscriptionStatus`. |
| `src/components/dashboard/PushOptInCard.jsx` | One-time dismissible dashboard card | VERIFIED | 127 lines. All 4 visibility conditions enforced. `useRef(true)` cleanup pattern. Link to `/settings`. localStorage dismiss. |
| `public/sw.js` | daily-practice notificationclick handler | VERIFIED | Lines 505-529: `notificationType === 'daily-practice'` block navigates to `/trail`. |

---

## Key Link Verification

### Plan 01 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `send-daily-push/index.ts` | `push_subscriptions` table | Supabase service role query | WIRED | `from('push_subscriptions').select(...)` and `.update(...)` calls present. |
| `send-daily-push/index.ts` | `current_streak` view | Supabase service role join | WIRED | `from('current_streak').select('streak_count').eq('student_id', studentId).maybeSingle()` present. |

### Plan 02 Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `NotificationPermissionCard.jsx` | `ParentGateMath.jsx` | Renders when consent not yet granted | WIRED | `import ParentGateMath from "./ParentGateMath"` present. `{showGate && <ParentGateMath onConsent={handleConsentGranted} onCancel={...} />}` in default state render. |
| `NotificationPermissionCard.jsx` | `notificationService.js` | Calls savePushSubscription after subscribe | WIRED | `import { ..., savePushSubscription, ... }` at top. `await savePushSubscription(studentId, subscriptionJSON)` called in `performSubscription()`. |
| `PushOptInCard.jsx` | `/settings` route | Link to settings notification section | WIRED | `<Link to="/settings">` present at line 99. |
| `public/sw.js` | `/trail` route | notificationclick opens trail page | WIRED | `const urlToOpen = new URL('/trail', self.location.origin).href` inside `daily-practice` block. |
| `Dashboard.jsx` | `PushOptInCard.jsx` | Import + render with props | WIRED | `import PushOptInCard from '../dashboard/PushOptInCard'`. Rendered at line 669-675 with `studentId={user.id}` and `createdAt={profileData?.created_at}`. |
| `AppSettings.jsx` | `NotificationPermissionCard.jsx` | Passes studentId prop | WIRED | `studentId={user?.id}` passed at line 452. `useUser` imported and destructured. |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NOTIF-01 | 17-02 | Parent can opt-in to push notifications for their child with COPPA-compliant consent | SATISFIED | `ParentGateMath.jsx` implements knowledge-based math gate. `parent_consent_granted` and `parent_consent_at` columns written on consent. `savePushSubscription` enforces auth before DB write. |
| NOTIF-02 | 17-02 | App requests Web Push API permission and registers service worker subscription | SATISFIED | `subscribeToPushNotifications()` calls `pushManager.subscribe()` with VAPID key. `savePushSubscription()` upserts the serialized subscription to `push_subscriptions`. |
| NOTIF-03 | 17-01 | Student receives max 1 push notification per day | SATISFIED | `last_notified_at` column prevents repeat sends in `send-daily-push/index.ts`. `practiceCount > 0` skip prevents notification if student already practiced today. |
| NOTIF-04 | 17-01 | Notifications include context-aware messages (streak at risk, XP near level-up, daily goals waiting) | SATISFIED | `selectNotification()` function with 4-priority system. Queries `current_streak`, student XP, and `student_daily_goals` per student. Child-friendly emoji messages in all tiers. |
| NOTIF-05 | 17-02 | Student or parent can disable notifications from settings | SATISFIED | `handleDisable()` in `NotificationPermissionCard.jsx` calls `removePushSubscription()` which unsubscribes browser PushManager and sets `is_enabled=false` in DB. |

All 5 requirement IDs accounted for. No orphaned requirements detected (no NOTIF-* IDs assigned to Phase 17 in REQUIREMENTS.md that are missing from plans).

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | No anti-patterns found in phase 17 files |

Notes on benign patterns:
- `PushOptInCard.jsx:76` — `if (!visible) return null` is a correct conditional render guard, not a stub.
- `notificationService.js:115,124` — `return null` from `getCurrentPushSubscription` and `getPushSubscriptionStatus` are correct absence-of-data returns, not stubs.
- `send-daily-push/index.ts:43` — `return null` from `getXpToNextLevel` signals max level reached (valid sentinel), not a stub.

---

## Human Verification Required

### 1. End-to-End Push Opt-In Flow

**Test:** Open AppSettings as a student. In the Notifications section, click "Turn on practice reminders". Verify the math problem gate appears. Solve it correctly.
**Expected:** Browser permission prompt appears. After granting, the card shows green "Practice reminders are on!" with a "Turn off" button. Check Supabase dashboard — `push_subscriptions` table should have a row for the student with `is_enabled=true` and `parent_consent_granted=true`.
**Why human:** Requires live browser PushManager, VAPID environment variables, and a deployed service worker.

### 2. Received Push Notification Click Navigation

**Test:** Trigger the `send-daily-push` Edge Function manually (or wait for pg_cron at 14:00 UTC). Receive the push notification on a device. Tap it.
**Expected:** The app opens to the `/trail` page (Trail Map). If the app is already open, the existing window navigates to `/trail`.
**Why human:** Server-sent Web Push requires a deployed Edge Function, real pg_cron job, and live push subscription registration.

### 3. Disable and Re-Enable Without Math Gate

**Test:** After enabling (test 1), click "Turn off" in Settings. Verify the card transitions to the re-enable state. Click "Turn back on".
**Expected:** No math gate appears on re-enable (consent_skip state). Browser re-subscribes. DB shows `is_enabled=true`. `parent_consent_granted` remains true throughout.
**Why human:** Requires live browser PushManager state to verify the unsubscribe and re-subscribe cycle.

### 4. PushOptInCard Dashboard Visibility

**Test:** Log in as a student whose account was created more than 7 days ago, who has not previously dismissed the card, and who has no active push subscription. Check the Dashboard.
**Expected:** The PushOptInCard appears between the DailyGoalsCard and the stats grid, showing a bell icon, "Never miss practice time!" title, a "Turn on" link to Settings, and a "Not now" dismiss button.
**Why human:** Account age check depends on a real `created_at` date. localStorage state and DB subscription status require a real session.

---

## Gaps Summary

No gaps found. All 12 observable truths are VERIFIED with substantive implementations that are correctly wired together. The phase achieves its goal:

- **COPPA consent (NOTIF-01, NOTIF-02):** The math gate (`ParentGateMath.jsx`) blocks first-time opt-in. Consent is persisted in `parent_consent_granted` and re-enabling skips the gate. All DB writes have defense-in-depth auth checks.
- **1/day limit and context-aware messages (NOTIF-03, NOTIF-04):** The `send-daily-push` Edge Function enforces the daily rate limit via `last_notified_at` and skips students who already practiced. The `selectNotification()` function implements the 4-tier priority system with child-friendly messages.
- **Disable control (NOTIF-05):** The state machine in `NotificationPermissionCard.jsx` provides disable, and re-enable states. The dashboard `PushOptInCard` provides a gentle first-week discoverable opt-in path.
- **Service worker wiring:** The `daily-practice` handler in `sw.js` navigates to `/trail` on notification tap, completing the user journey.

Four items require human verification because they involve live browser APIs, a deployed Edge Function, and a registered pg_cron job — none of which can be verified programmatically against the codebase.

---

_Verified: 2026-03-04T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
