# Pitfalls Research

**Domain:** Instrument practice tracking added to existing children's piano learning PWA
**Researched:** 2026-03-23
**Confidence:** HIGH (system-specific pitfalls verified against live codebase; platform limitations verified via MDN, Apple Developer Forums, and community sources)

---

## Critical Pitfalls

### Pitfall 1: iOS PWA Silently Drops Notification Action Buttons

**What goes wrong:**
The `actions` property in `showNotification()` — the mechanism for "Yes, I practiced" / "Not yet" buttons — is silently ignored on iOS Safari PWA. The notification shows but none of the action buttons appear. `notificationclick` fires without `event.action` being set to any custom value, so the handler falls through to the default case. If the default case opens the app to `/trail`, the user has no way to log practice directly from the notification without manually finding the right UI.

**Why it happens:**
Apple's WebKit implementation of the Web Notifications API does not support the `actions` property for Home Screen PWAs. This is an engine-level limitation, not a configuration error. All browsers on iOS (Chrome, Firefox, Edge, Brave) use the same WebKit engine, so no alternative browser fixes it. The existing `sw.js` already defines `actions: [{action: 'open'}, {action: 'close'}]` — these render on Android Chrome but are completely invisible on iOS.

**How to avoid:**
Design with "iOS fallback first":
1. The notification tap (no action, `event.action === ''`) must navigate to a URL that includes a query param signaling the check-in intent, e.g., `/dashboard?practice_checkin=1`.
2. The dashboard detects that query param on mount and presents an immediate yes/no prompt — the user does not need to hunt for a card.
3. Action buttons (`log_yes`, `log_no`) are an enhancement for Android only. The fallback URL route is the primary design path, not an afterthought.
4. Never make action buttons the only way to complete the check-in flow.

**Warning signs:**
- Testing only on Android emulator or Chrome desktop and declaring the feature done
- The sw.js `notificationclick` handler has `log_yes` / `log_no` action cases but the `event.action === ''` default case opens `/trail` with no check-in trigger

**Phase to address:**
Phase 1 (core practice logging and push notification integration). Must be a hard acceptance criterion: "tested on physical iOS device as installed PWA."

---

### Pitfall 2: Two Push Notifications Reach the Same Child on the Same Day

**What goes wrong:**
The existing `send-daily-push` Edge Function fires once per day, guarded by `last_notified_at = today UTC`. The new "Did you practice?" notification is a second server-side notification. If both run as separate cron jobs without coordination, a student who hasn't opened the app gets two push notifications from PianoMaster on the same day. Research shows that 2+ notifications per week causes ~43% of users to disable push notifications; 5+ per week causes ~60% to quit the app entirely.

**Why it happens:**
The natural implementation path creates a new Edge Function for the practice check-in (separation of concerns feels clean). But both notifications use the same browser permission slot. The `push_subscriptions` table has a single `last_notified_at` column — if both functions check it independently and the first to run writes it, the second is silently blocked on that day, making the practice check-in unreliable. If neither checks it first, both fire.

**How to avoid:**
Extend the existing `send-daily-push` to include practice check-in as its highest-priority message tier. When the student has not yet logged instrument practice today, the notification body becomes the "Did you practice your instrument?" message. The existing priority chain (streak at risk > XP level-up > daily goals > generic) gets a new top-priority tier. One notification. One cron job. One `last_notified_at` update.

If a separate cron is truly required (e.g., different send time), add a separate `last_practice_notified_at` column and enforce that the total of all notification types per student per day does not exceed one — checked before sending.

**Warning signs:**
- A new Edge Function created with its own cron schedule that does not consult `last_notified_at`
- The practice notification fires and then the streak notification also fires the same UTC day because `last_notified_at` was written by the practice function before the streak function checked it

**Phase to address:**
Phase 1 (Edge Function architecture). Decide the single-vs-extended approach before writing any notification code.

---

### Pitfall 3: Practice Streak and App-Usage Streak Are Indistinguishable to the Child

**What goes wrong:**
The app already has an app-usage streak (tracks `students_score` entries, stored in `current_streak`). Adding an instrument practice streak creates two flame/fire icons, two streak counts, and two sets of freeze shields visible on the dashboard. The 8-year-old sees both and doesn't understand which is which or why they differ. When the app streak shows 12 and the instrument streak shows 3, the child perceives the lower number as failure or a broken feature, and parents receive confusing questions.

**Why it happens:**
The feature brief correctly requests a separate streak (the two measure different behaviors: app engagement vs. real-world instrument practice at home). But the UI treatment defaults to reusing the fire icon and streak card pattern, making the two visually identical.

**How to avoid:**
Give each streak a distinct visual identity:
- App streak: existing fire icon, existing label ("Practice Streak" or "Streak")
- Instrument streak: piano or music note icon, new label ("Home Practice" or "Instrument Streak")

Do not show both in the same card. The instrument streak belongs in a dedicated "Home Practice" card on the dashboard. Duolingo's research shows that decoupling streak mechanism from daily goal progress (giving each its own visual identity) increased 7+ day streaks by 40% — the separation reduced confusion rather than adding to it.

At the data layer: the instrument practice streak must live in a new dedicated table (e.g., `instrument_streak`). Do not add an `instrument_streak_count` column to `current_streak` — that table's semantics are already well-defined and mixed concerns would make the streak service brittle.

**Warning signs:**
- Two fire icons on the same screen
- A combined card showing "Streak: 12 | Home Practice: 3" with no visual differentiation between them
- `instrument_streak_count` column added to the existing `current_streak` Supabase table

**Phase to address:**
Phase 1 (database schema — separate table) and Phase 2 (dashboard UI — distinct card with distinct icon).

---

### Pitfall 4: Timezone Mismatch Breaks "Did I Practice Today?" Logic

**What goes wrong:**
The existing `streakService.js` uses `getCalendarDate()` which returns `YYYY-MM-DD` in the **client's local timezone**. The `send-daily-push` Edge Function uses `now.toISOString().split('T')[0]` — pure UTC. An Israeli student (UTC+3) who logs instrument practice at 11 PM local time (20:00 UTC) has the client record it as "today" local date. But the Edge Function running at 14:00 UTC on the same calendar day will correctly skip sending. After 21:00 UTC, the same action records as "tomorrow" in UTC but correctly "today" in local time.

The weekly report compounds this: `daysPracticed` is computed by splitting `created_at` on `T` — a UTC date split. A user who practices at 11 PM in Israel before midnight UTC will have that session counted on the UTC date, which is "tomorrow" local. Seven days of practice can appear as only 6 in the parent email.

**Why it happens:**
The existing system made a deliberate local-timezone choice for the client streak (consistent with how children experience days), while the Edge Functions used UTC for simplicity. The new feature introduces a third system. If the new practice log stores only a UTC timestamp, the calendar heatmap's JS code must derive the local date from that timestamp — which it can do. But if the Edge Function ever needs to answer "did this student log practice today?" using only UTC, it will be wrong for late-evening users.

**How to avoid:**
Store both values. In the practice log table, include:
- `practiced_at TIMESTAMPTZ` — the UTC instant (always store UTC)
- `local_date DATE` — the client's local calendar date sent from the browser at log time

```javascript
// Client sends:
const localDate = getCalendarDate(new Date()); // YYYY-MM-DD in local timezone
await supabase.from('instrument_practice_log').upsert({ student_id, practiced_at: new Date().toISOString(), local_date: localDate });
```

The Edge Function and the weekly report query `local_date`, not a UTC date split from `practiced_at`. The heatmap renders from `local_date`. Never derive a local date on the server.

**Warning signs:**
- Migration does not include a `local_date DATE` column
- Edge Function computing "practiced today" via `new Date().toISOString().split('T')[0]`
- Hebrew-locale test users reporting heatmap entries appearing on the wrong day

**Phase to address:**
Phase 1 (database migration). The `local_date` column is a structural decision that cannot be easily backfilled after launch.

---

### Pitfall 5: XP Awarded Twice for the Same Day (Double-Tap / Retry)

**What goes wrong:**
The practice log XP award and the practice log write are two separate operations. Without an idempotency guard, a user who taps "Yes, I practiced" while on a slow connection, sees a spinner, and taps again will:
1. Trigger two INSERT attempts
2. Potentially receive XP twice if both complete before the first response returns

This is especially likely on mobile devices with intermittent connectivity. The existing `award_xp()` Postgres function has no built-in dedup for this case.

**Why it happens:**
Client-side disabling of the button during the request helps but does not prevent duplicate requests on retry, page refresh, or network replay. The naive service layer calls `award_xp()` unconditionally after a successful INSERT.

**How to avoid:**
Use a Postgres `UNIQUE` constraint on `(student_id, local_date)` in the practice log table. The upsert uses `ignoreDuplicates: true`. Award XP only when the upsert results in an actual insert (not a no-op). Pattern:

```javascript
const { count } = await supabase
  .from('instrument_practice_log')
  .upsert(
    { student_id, local_date, practiced: true, practiced_at: new Date().toISOString() },
    { onConflict: 'student_id,local_date', ignoreDuplicates: true, count: 'exact' }
  );
// count === 1 means inserted (first time); count === 0 means already existed
if (count === 1) {
  await awardPracticeXP(studentId);
}
```

Also define: logging `practiced: false` (a "no, didn't practice" confirmation) should never award XP. Only `practiced: true` on the first log of the day earns XP.

**Warning signs:**
- No `UNIQUE` constraint on `(student_id, local_date)` in the migration
- `award_xp()` called unconditionally after every upsert response
- The XP award happens in the notification action handler in sw.js (service worker cannot safely call authenticated Supabase endpoints)

**Phase to address:**
Phase 1 (database schema — UNIQUE constraint) and Phase 2 (practice logging service — conditional XP award).

---

### Pitfall 6: Retroactive "Yesterday" Server-Side Enforcement Missing

**What goes wrong:**
The feature spec limits retroactive logging to "yesterday only." The dashboard UI hides the "yesterday" option after it lapses. But if the RLS policy for INSERT on the practice log table only checks `auth.uid() = student_id` with no date constraint, a manipulated client request can write any date in the past. A student (or a parent trying to be helpful) can fill in a full week of practice they didn't do, inflating the streak and earning XP for non-existent practice.

**Why it happens:**
UI-level enforcement feels sufficient because "users can only see yesterday's button when applicable." But the Supabase RLS `WITH CHECK` policy operates independently of what the UI shows. Any authenticated client can issue a raw INSERT with any `local_date`.

**How to avoid:**
Add a date constraint to the RLS INSERT policy:

```sql
CREATE POLICY "Students can log own practice within allowed window"
  ON instrument_practice_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND local_date >= CURRENT_DATE - INTERVAL '1 day'
    AND local_date <= CURRENT_DATE
  );
```

This is a UTC approximation (±1 day window accommodates timezone variation for Israeli users near midnight). For an 8-year-old audience, this is sufficient protection.

**Warning signs:**
- RLS `WITH CHECK` only contains `auth.uid() = student_id`
- No Supabase policy test for a `local_date` in the past being rejected
- Dashboard UI is the only date enforcement mechanism

**Phase to address:**
Phase 1 (database migration and RLS policy). Must be verified in the migration file before any client code is written.

---

### Pitfall 7: COPPA Hard-Delete Does Not Cover the New Practice Log Table

**What goes wrong:**
The existing COPPA hard-delete Edge Function (`send-consent-email` and the deletion cron) cascades deletions across all student data tables. The new `instrument_practice_log` (and `instrument_streak`) tables are created after the deletion function was written. If the deletion function is not updated, these tables' rows persist after a student account is permanently deleted — a direct COPPA compliance violation. The April 22, 2026 compliance deadline makes this high priority.

**Why it happens:**
The deletion Edge Function was written before these tables existed. New tables require explicit additions to the deletion routine unless the table uses a foreign key with `ON DELETE CASCADE` to the `students` table — a pattern the existing tables may or may not follow.

**How to avoid:**
Two-layer defense:
1. Add `REFERENCES students(id) ON DELETE CASCADE` to the `student_id` foreign key in the new migration. This handles most cases automatically.
2. Add explicit `DELETE FROM instrument_practice_log WHERE student_id = $1` and `DELETE FROM instrument_streak WHERE student_id = $1` to the deletion Edge Function as belt-and-suspenders. Cascade is silent; explicit deletion is auditable.

Verify in the migration file that the FK constraint includes `ON DELETE CASCADE` before deploying.

**Warning signs:**
- Migration does not include `ON DELETE CASCADE` on `student_id` FK
- The deletion Edge Function is not updated alongside the migration PR
- No test that deleting a student account also cleans up practice log rows

**Phase to address:**
Phase 1 (database migration). The `ON DELETE CASCADE` constraint must be in the initial migration, not a follow-up.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse `current_streak` table for instrument streak | No migration needed | Streak table semantics become ambiguous; existing streak service becomes entangled with new feature; impossible to apply separate freeze logic | Never — create `instrument_streak` table |
| Use UTC date in Edge Function for "practiced today" check | Simple, no timezone logic | Israeli users appear to have practiced "tomorrow" after 9 PM local; push incorrectly fires | Never — store `local_date` from client |
| Skip iOS action button fallback | Faster to implement | iOS users (majority of Hebrew market; Israel has high iPhone penetration) cannot log from notification | Never — fallback is the primary path |
| Award XP in client code without server idempotency | Simpler service layer | Duplicate XP on retry or slow connection; no audit trail | Never — XP awards must be server-side and idempotent |
| Omit `ON DELETE CASCADE` and handle deletion only in Edge Function | Single place to maintain | Edge Function can fail; orphaned rows violate COPPA | Never — use both FK cascade AND explicit deletion |
| Single `is_practiced` boolean on the student row (not a log table) | No separate table | Cannot store history; heatmap impossible; retroactive logging impossible | Never for this feature set |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `send-daily-push` Edge Function | Creating a new `send-practice-push` Edge Function with independent cron and no coordination | Extend `send-daily-push` with a new highest-priority message tier for practice check-in; one notification per student per day |
| `streakService.js` | Reading `current_streak.streak_count` and displaying it alongside a new instrument streak metric | Query a new `instrument_streak` table; never co-locate both streak types in one service call or DB table |
| `send-weekly-report` Edge Function | Repurposing the existing `daysPracticed` variable (game session days) to also mean instrument practice days | Add a separate `instrumentDaysPracticed` stat from `instrument_practice_log`; show both stats as distinct rows in the email |
| `notificationclick` handler in `sw.js` | Adding `log_yes` / `log_no` action cases without a fallback for `event.action === ''` (the iOS tap-without-action case) | Always handle `event.action === ''` by navigating to `/dashboard?practice_checkin=1` |
| `ParentGateMath` COPPA gate | Treating the practice check-in notification as a new consent trigger requiring a new gate flow | The existing push subscription was already parent-gated; instrument practice logging uses the existing consent — no new gate needed |
| `award_xp()` Postgres function | Calling it from the client or calling it unconditionally after every upsert | Wrap in an RPC or call only when the upsert results in a new INSERT (`count === 1`); never trust the client for XP amount |
| Heatmap RTL support | Using physical CSS (`margin-left`, `text-align: right`) rather than logical properties | Use CSS logical properties (`margin-inline-start`, `padding-inline-end`) or explicitly mirror grid column order via `isRTL` prop |
| TanStack Query cache | Not invalidating `['instrument-practice']` queries after a log action | Explicitly call `queryClient.invalidateQueries(['instrument-practice'])` and `['instrument-streak']` after every successful log write |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full `instrument_practice_log` history for heatmap | Slow heatmap render; full table scan as history grows | Query only last 52 weeks (364 rows max per student); `index on (student_id, local_date)` | From day 1 without index/limit |
| N+1 in weekly report: per-student instrument log query inside loop | Edge Function slow; Supabase free tier connection pressure | Bulk-query all students' instrument logs in one query before the loop; filter in JS | When >50 active students receive weekly emails |
| Heatmap re-renders on every dashboard mount | Visible flash of empty grid before data loads | Use TanStack Query `staleTime: 5 * 60 * 1000` for practice log (data doesn't change mid-session) | On every navigation to dashboard |
| Generating 52-week calendar grid in JS on every render | Low-end Android frame drops | Memoize the empty grid structure with `useMemo`; only hydrate with data when query resolves | On older/mid-range Android devices |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS allows any authenticated user to INSERT for any `student_id` | Another user or teacher could log practice on behalf of a child | `WITH CHECK (auth.uid() = student_id)` on practice log INSERT policy — standard pattern already used throughout codebase |
| No date range in RLS INSERT policy | Client can backfill arbitrary past dates to inflate streak | `AND local_date >= CURRENT_DATE - INTERVAL '1 day'` in the INSERT `WITH CHECK` |
| Practice log contains behavioral absence data visible on device lock screen | "You haven't practiced today!" reveals that child didn't practice to anyone viewing the device | Keep notification body generic; never reveal behavioral state in notification text |
| `instrument_practice_log` rows not deleted on COPPA hard-delete | Behavioral log data (daily practice habits, timing) persists after account deletion | `ON DELETE CASCADE` on FK + explicit deletion in the deletion Edge Function |
| XP awarded via client-side code without server validation | Client can forge practice awards by replaying requests | Use Supabase RPC with server-side idempotency check; never compute XP on the client |
| Practice log data used or shared beyond its stated purpose | COPPA 2025 amended rule requires stated retention periods and no repurposing without new consent | Add `instrument_practice_log` to the Privacy Policy data inventory; document retention period (e.g., deleted with account, or max 2 years); do not use practice habit data for analytics or third-party sharing |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Heatmap uses green-red color-only encoding for practiced vs. missed days | 8% of males are colorblind and cannot distinguish green from red; WCAG 1.4.1 violation | Green fill + checkmark icon for practiced days; empty/outlined cell for not practiced; color is additive, not the sole signal |
| Heatmap RTL direction not handled: oldest-to-newest reads left-to-right in Hebrew mode | Hebrew users expect time to flow right-to-left; recent days should be on the right, not left | In RTL mode, reverse the week columns so the most recent week is rightmost (consistent with Hebrew text direction) |
| Dashboard shows "0 day instrument streak" on first visit | New feature immediately signals failure to the child (streak anxiety before any chance to succeed) | Do not render the streak counter until the child has logged at least one practice; first state is a call-to-action card, not a zero counter |
| "Did you practice?" push arrives at 8 AM when child is in school | Child cannot answer accurately; notification is irrelevant and annoying | Send between 4–7 PM local time; either use timezone-aware scheduling (store user timezone at registration) or hard-code the cron for 14:00 UTC (5 PM Israel / 10 AM US East — acceptable compromise for the primary Hebrew market) |
| Logging "no, I didn't practice" shows negative feedback (sad emoji, red color) | 8-year-olds are sensitive to shame; negative reinforcement increases avoidance | Neutral, warm acknowledgement: "Thanks for checking in! Tomorrow is a new day." No sad faces, no score decrease on screen, no red color on the log-no response |
| Two streak counters displayed with identical visual treatment (both fire icons) | Child asks "why do I have two fires?" and perceives the lower number as broken | Distinct icon for instrument streak (piano or music note); instrument streak lives in its own card, not on the same card as the app streak |

---

## "Looks Done But Isn't" Checklist

- [ ] **iOS action buttons:** Feature tested on physical iOS device as installed Home Screen PWA — action buttons are absent (confirming iOS limitation), tap-to-app with `?practice_checkin=1` query param correctly triggers the in-app check-in UI
- [ ] **Timezone correctness:** Practice log tested with simulated UTC+3 user logging at 10 PM local time — heatmap shows the correct local date (not the UTC-shifted "tomorrow" date)
- [ ] **XP idempotency:** "Yes, I practiced" tapped twice rapidly — XP awarded only once; second tap is a silent no-op; verified in DB before/after
- [ ] **Duplicate notification prevention:** Both streak notification and practice check-in tested on the same calendar day — only one notification arrives at the device
- [ ] **COPPA hard-delete coverage:** Deleting a test student account confirms `instrument_practice_log` and `instrument_streak` rows are removed — either via CASCADE FK or explicit deletion in the Edge Function
- [ ] **RTL heatmap direction:** Calendar heatmap rendered in Hebrew locale (isRTL=true) — most recent week is on the right side of the grid
- [ ] **"Yesterday" RLS enforcement:** Supabase policy tester confirms that an INSERT with `local_date = '2020-01-01'` is rejected by the RLS policy
- [ ] **Empty state (no logs yet):** Dashboard practice card renders without errors when `instrument_practice_log` has no rows for the student
- [ ] **Weekly email shows instrument data separately:** Parent email preview contains a distinct "Instrument Practice" stat row; the existing "Days Practiced" row (game sessions) is unchanged and clearly labeled
- [ ] **Instrument streak freeze independence:** Instrument streak has its own freeze inventory; expending an instrument streak freeze does not reduce the app streak's `streak_freezes` count in `current_streak`
- [ ] **"No" log does not award XP:** Logging `practiced: false` for yesterday does not trigger any XP award
- [ ] **Retroactive "yesterday" only:** Dashboard UI correctly hides the "Log yesterday" option when it is more than 24 hours past midnight of the previous day

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| iOS action buttons not implemented as fallback | MEDIUM | Add `?practice_checkin=1` URL to push notification `data.url`; add query param detection to dashboard; no schema changes |
| Two notifications firing same day | LOW | Update `send-daily-push` message selection to include practice check-in as top-priority tier; redeploy Edge Function; no schema changes |
| UTC/local date mismatch in production | HIGH | Requires migration to add `local_date` column; backfilling existing rows from UTC timestamp is inaccurate (timezone unknown); partial data quality accepted; announce to affected users |
| Duplicate XP awarded | MEDIUM | One-time Postgres script to identify duplicate XP events and apply corrections; add missing UNIQUE constraint; deploy idempotency fix |
| Two streak systems visually confused | LOW | UI-only change: rename labels, swap icon for instrument streak; no schema changes; deploy immediately |
| COPPA hard-delete missing new tables | MEDIUM | Add explicit DELETE statements to deletion Edge Function; deploy; run a manual audit query to confirm no orphaned rows exist for already-deleted students |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| iOS action buttons silently dropped | Phase 1 (notification design) | Physical iOS device test: buttons absent, tap-to-app check-in works via query param |
| Two push notifications same day | Phase 1 (Edge Function architecture) | Single notification confirmed per student per day in integration test |
| Two streaks visually indistinguishable | Phase 1 (schema: separate table) + Phase 2 (dashboard UI) | Design review: distinct icons; migration review: no instrument streak column on `current_streak` |
| Timezone date mismatch | Phase 1 (database schema) | `local_date` column present in migration; Edge Function reads `local_date` not UTC split |
| XP double-award | Phase 1 (UNIQUE constraint) + Phase 2 (conditional award) | Double-tap test; DB XP diff before/after |
| Retroactive logging abuse | Phase 1 (RLS policy) | Policy tester: past-date INSERT rejected |
| COPPA hard-delete gap | Phase 1 (schema FK cascade) + Phase 1 (deletion function update) | Test account deletion removes all practice log rows |
| Color-only heatmap encoding | Phase 3 (parent heatmap UI) | Axe accessibility scan; grayscale mode manual test |
| RTL heatmap direction | Phase 3 (parent heatmap UI) | Hebrew locale smoke test: most recent week is rightmost |
| Weekly email conflates two "days practiced" metrics | Phase 4 (email integration) | Parent email preview: distinct stat rows for game days vs. instrument practice days |

---

## Sources

- Apple Developer Forums — iOS PWA notification action buttons support status: https://developer.apple.com/forums/thread/726793
- MDN — `ServiceWorkerGlobalScope: notificationclick event`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event
- MDN — `ServiceWorkerRegistration: showNotification()`: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
- MagicBell — PWA iOS Limitations and Safari Support [2026]: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- InsiderOne — Web Push Support for Mobile Safari: https://academy.insiderone.com/docs/web-push-support-for-mobile-safari
- Trophy — Handling Time Zones in Global Gamification Features: https://trophy.so/blog/handling-time-zones-gamification
- Tiger Abrodi — Implementing a Daily Streak System: https://tigerabrodi.blog/implementing-a-daily-streak-system-a-practical-guide
- Securiti — FTC 2025 COPPA Final Rule Amendments: https://securiti.ai/ftc-coppa-final-rule-amendments/
- Loeb & Loeb — Children's Online Privacy in 2025: The Amended COPPA Rule: https://www.loeb.com/en/insights/publications/2025/05/childrens-online-privacy-in-2025-the-amended-coppa-rule
- W3C — Understanding WCAG 1.4.1 Use of Color: https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html
- The A11Y Collective — Accessible Charts: https://www.a11y-collective.com/blog/accessible-charts/
- Appbot — Push Notification Best Practices 2026: https://appbot.co/blog/app-push-notifications-2026-best-practices/
- Reteno — 14 Push Notification Best Practices 2026: https://reteno.com/blog/push-notification-best-practices-ultimate-guide-for-2026
- Medium/Premjit Singha — Duolingo streak system detailed breakdown: https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f
- Supabase Docs — Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- JavaScriptRoom — waitUntil + async/await service worker pitfall: https://www.javascriptroom.com/blog/service-workers-async-await-in-combination-with-waituntil-is-not-working-properly/
- Codebase (live review): `src/services/streakService.js`
- Codebase (live review): `supabase/functions/send-daily-push/index.ts`
- Codebase (live review): `supabase/functions/send-weekly-report/index.ts`
- Codebase (live review): `public/sw.js` — push handler and notificationclick handler

---

*Pitfalls research for: v2.7 Instrument Practice Tracking — adding practice logging to existing children's piano PWA*
*Researched: 2026-03-23*
