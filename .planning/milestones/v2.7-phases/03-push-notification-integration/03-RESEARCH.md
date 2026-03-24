# Phase 3: Push Notification Integration - Research

**Researched:** 2026-03-24
**Domain:** Web Push Notifications, Service Worker action buttons, URL param deep-link, Supabase Edge Function extension
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Extend the existing `send-daily-push` Edge Function — no new Edge Function or pg_cron job. Single pass over `push_subscriptions` at 14:00 UTC handles both practice check-in and app-usage reminder.
- **D-02:** Practice check-in takes priority. For each student: if they haven't logged instrument practice today → send practice check-in notification. If they HAVE logged practice but haven't used the app → send existing app-usage reminder. Never both.
- **D-03:** Keep existing 14:00 UTC cron schedule (~4-5pm Israel time, after-school hours).
- **D-04:** Practice check-in skip logic checks `instrument_practice_logs` table for today's date. App-usage reminder skip logic keeps existing `students_score` check. Each notification type checks its own relevant table.
- **D-05:** `last_notified_at` continues to enforce 1 notification cycle per day. A snooze + snoozed notification counts as one cycle.
- **D-06:** Notification shows two action buttons: "Yes, I practiced!" and "Not yet".
- **D-07:** "Yes, I practiced!" opens the app at `/?practice_checkin=1` — same unified path as iOS. Dashboard detects the URL param and auto-logs practice via `practiceLogService`. No auth complexity in service worker.
- **D-08:** "Not yet" dismisses the notification and schedules a local SW-triggered follow-up notification in 2 hours. This snooze + snoozed notification is part of the same notification cycle (1/day rule honored). No further notifications after the snoozed one fires.
- **D-09:** If the snoozed notification fires and the student taps "Yes, I practiced!" → same auto-log path. If they tap "Not yet" again → just dismiss (no infinite snooze chain).
- **D-10:** On iOS (no action button support), tapping the notification opens the app with `?practice_checkin=1` URL param.
- **D-11:** Dashboard detects `?practice_checkin=1`, automatically calls `practiceLogService.logPractice()`, and shows the PracticeLogCard animation sequence (checkmark + "+25 XP"). Zero taps needed after opening the app. URL param cleaned up after processing.
- **D-12:** If student already logged practice today and taps the notification anyway: dashboard detects param + already-logged state, shows a brief friendly toast ("You already logged today's practice!"), no duplicate XP. URL param cleaned up.
- **D-13:** Practice check-in uses simple, friendly question messages with 2-3 light rotating variants. No streak/XP context — the question is about real instrument practice, not app metrics.
- **D-14:** Tone: warm and curious, matching the app's encouraging kid-friendly style. Examples: "Did you practice your piano today? 🎹" / "How was today's practice? 🎵" — no pressure, just a gentle check-in.
- **D-15:** Notification tag: `practice-checkin` (distinct from existing `daily-practice` tag used by app-usage reminder). This allows the SW to differentiate handling.

### Claude's Discretion

- **D-16:** Exact message variant wording — Claude picks 2-3 variants following the friendly question tone.
- **D-17:** Service worker `notificationclick` handler implementation details for the new `practice-checkin` type.
- **D-18:** URL param cleanup approach (replaceState vs. navigate).
- **D-19:** Snooze scheduling mechanism in SW (setTimeout vs. SW alarm API).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUSH-01 | Student receives a daily "Did you practice today?" push notification (cron-triggered, separate from existing timer reminder) | Edge Function `send-daily-push` extended with practice check-in branch; D-01/D-02 pattern identified |
| PUSH-02 | Practice check-in notification skips students who already logged for the day | Query `instrument_practice_logs` for today's `practiced_on`; D-04 pattern confirmed, table schema verified |
| PUSH-03 | Notification coordinates with existing push system to prevent multiple notifications on the same day | D-02 priority branching pattern + `last_notified_at` rate-limit (D-05); existing mechanism confirmed in `send-daily-push/index.ts` |
| PUSH-04 | On Android/desktop, notification shows interactive action buttons ("Yes, I practiced!" / "Not yet") | Web Push `actions` array in SW `showNotification` options; existing pattern in sw.js lines 385-397; platform rendering researched |
| PUSH-05 | On iOS, tapping the notification opens the app with a practice log prompt (URL param fallback as primary path) | `useSearchParams` from React Router v7 used in `ConsentVerifyPage` and `TrailMap` — precedent confirmed; D-10/D-11 pattern |
</phase_requirements>

---

## Summary

Phase 3 extends two existing files (`send-daily-push/index.ts` and `public/sw.js`) and adds URL-param handling in `Dashboard.jsx`. All infrastructure is already in place: the Edge Function has VAPID init, Supabase access, and `last_notified_at` rate-limiting; the service worker has `push` and `notificationclick` event handlers with existing type-based routing; `practiceLogService.logPractice()` is idempotent and safe to call on duplicate; `PracticeLogCard` exposes its animation sequence via its internal `logState` FSM.

The central implementation challenge is coordinating the priority branching in the Edge Function (practice check-in first, fall through to app-usage reminder if already logged), and implementing the one-shot snooze in the service worker using `setTimeout` inside `event.waitUntil`. No new database migrations are needed — both `instrument_practice_logs` and `push_subscriptions` tables already exist with the correct schema.

The URL-param auto-log path (`?practice_checkin=1`) is the unified flow for iOS tap and Android "Yes" action. The Dashboard needs a `useSearchParams` hook (already used in `ConsentVerifyPage.jsx` as precedent) to detect this param, call `practiceLogService.logPractice()`, trigger PracticeLogCard's settled state visually, and clean up the URL with `replaceState`.

**Primary recommendation:** Four discrete change sets in four files: (1) `send-daily-push/index.ts` — add practice check-in priority branch; (2) `sw.js` — add `practice-checkin` push and click handlers with snooze; (3) `Dashboard.jsx` — add URL param detection and auto-log; (4) `src/locales/en/common.json` + `he/common.json` — add notification translation keys.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jsr:@negrel/webpush` | current (JSR) | VAPID + Web Push from Deno Edge Function | Already in use in `send-daily-push/index.ts` |
| `@supabase/supabase-js` | 2.x | Edge Function DB access (service role) | Already in use |
| React Router v7 `useSearchParams` | 7.x | URL param reading in Dashboard.jsx | Already in use in `ConsentVerifyPage.jsx`, `TrailMap.jsx` |
| `react-hot-toast` | current | Toast for "already logged" feedback | Already in Dashboard.jsx imports |
| Web Push API (`actions` array) | Browser standard | Action buttons in notifications | Already scaffolded in sw.js push handler |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SW `setTimeout` (built-in) | — | 2-hour snooze scheduling inside `event.waitUntil` | D-08 snooze: only option in SW without Notification API alarm |
| `self.registration.showNotification` | SW standard | Show snoozed local notification from SW | Required to show notification from SW context without a push event |

**Installation:** No new packages required. All dependencies are already installed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SW `setTimeout` for snooze | SW Notification Triggers API / Alarm API | Alarm API has ~0% browser support as of 2026; `setTimeout` in `event.waitUntil` is the only viable cross-browser approach |
| `window.history.replaceState` for URL cleanup | React Router `useNavigate` with `replace` | `replaceState` is slightly simpler and avoids a re-render; `useNavigate` + replace also works fine — either is acceptable per D-18 |
| Extending existing Edge Function | New Edge Function | D-01 is locked — no new function |

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
supabase/functions/send-daily-push/
├── index.ts                    # MODIFY: add practice check-in priority branch

public/
├── sw.js                       # MODIFY: add practice-checkin push + click handlers

src/components/layout/
├── Dashboard.jsx               # MODIFY: add ?practice_checkin=1 param detection

src/locales/en/
├── common.json                 # MODIFY: add push notification translation keys

src/locales/he/
├── common.json                 # MODIFY: matching Hebrew keys
```

No new files needed for the core feature. Tests will be added as siblings to existing test files.

---

### Pattern 1: Edge Function Priority Branching

**What:** Inside the per-student loop in `send-daily-push/index.ts`, after the `last_notified_at` rate-limit check, add a two-branch decision: check `instrument_practice_logs` first; if no entry found for today, send the practice check-in notification and update `last_notified_at`; otherwise fall through to the existing `students_score` check for the app-usage reminder.

**Current code structure (lines 264-370):**
```typescript
for (const row of enabledSubscriptions ?? []) {
  // Rate-limit check (last_notified_at) — keep as-is
  // EXISTING: skip if students_score entry exists today -> send app-usage reminder

  // NEW INSERTION POINT:
  // 1. Check instrument_practice_logs for today's practiced_on
  // 2. If NOT logged today -> send practice check-in notification, update last_notified_at, continue
  // 3. If logged today -> fall through to existing students_score check for app-usage reminder
}
```

**Key detail on the practice-logged check:** The existing `students_score` check uses `created_at >= todayUtcMidnight`. The `instrument_practice_logs` check must use `practiced_on = localDate` — but in the Edge Function we only have UTC. The correct query uses `practiced_on = todayUtc` (the DATE string "2026-03-24"). This is intentional: the server uses UTC date for the push skip decision. A student who practiced at 11pm their local time (= next UTC day) would still receive the notification that day — acceptable given the primary goal is reducing notifications for students who clearly practiced.

**The practice check-in notification payload:**
```typescript
{
  title: "Did you practice your piano today? 🎹",  // one of 3 variants
  body: "Tap to log your practice and keep your streak alive!",
  tag: 'practice-checkin',
  data: {
    url: '/?practice_checkin=1',
    type: 'practice-checkin',
  },
  actions: [
    { action: 'yes', title: 'Yes, I practiced!' },
    { action: 'not-yet', title: 'Not yet' },
  ]
}
```

**On the Edge Function side:** The `actions` array in the push payload is informational to the service worker. The SW reads it and includes it in `showNotification` options. The Edge Function just sends the JSON payload — the SW decides what `actions` to show.

---

### Pattern 2: Service Worker Push Handler Extension

**What:** The existing `push` event handler (lines 342-402 in sw.js) creates a single generic notification with hardcoded `open`/`close` actions. The handler must be extended to detect `type: 'practice-checkin'` and show a notification with practice-specific actions.

**Current push handler structure:**
```javascript
self.addEventListener("push", (event) => {
  // Parses payload -> builds notificationData
  // Always shows: actions: [{ action: 'open' }, { action: 'close' }]
  event.waitUntil(self.registration.showNotification(...))
});
```

**Extended pattern (type-specific actions):**
```javascript
// After parsing notificationData:
let actions = [
  { action: 'open', title: 'Open' },
  { action: 'close', title: 'Dismiss' },
];

if (notificationData.tag === 'practice-checkin') {
  actions = [
    { action: 'yes', title: 'Yes, I practiced!' },
    { action: 'not-yet', title: 'Not yet' },
  ];
}

// Pass actions into showNotification options
```

**Source:** MDN Notification.actions (HIGH confidence) — action buttons are defined in the `showNotification` call in the service worker, not in the push payload.

---

### Pattern 3: Service Worker Click Handler — Practice Check-In Type

**What:** Add a new type branch in the `notificationclick` handler (after line 517 in sw.js, before the default fallback) for `type === 'practice-checkin'`.

**Three sub-cases:**

**Case A: action === 'yes' (Android "Yes, I practiced!")**
```javascript
event.notification.close();
const urlToOpen = new URL('/?practice_checkin=1', self.location.origin).href;
// focus existing window at that URL, or openWindow
```

**Case B: action === 'not-yet' (Android "Not yet" — one-shot snooze)**
```javascript
event.notification.close();
// Check if this is already a snoozed notification (to prevent infinite snooze)
const isSnoozed = event.notification.data?.snoozed === true;
if (!isSnoozed) {
  // Schedule snoozed follow-up in 2 hours
  event.waitUntil(
    new Promise(resolve => {
      setTimeout(async () => {
        await self.registration.showNotification("Still time to practice! 🎹", {
          body: "Did you get a chance to practice today?",
          tag: 'practice-checkin-snoozed',
          icon: '/icons/favicon_192x192.png',
          badge: '/icons/favicon_96x96.png',
          data: {
            type: 'practice-checkin',
            url: '/?practice_checkin=1',
            snoozed: true,   // <-- marks this as already-snoozed (D-09)
          },
          actions: [
            { action: 'yes', title: 'Yes, I practiced!' },
            { action: 'not-yet', title: 'Not yet' },
          ],
        });
        resolve();
      }, 2 * 60 * 60 * 1000); // 2 hours
    })
  );
}
// If isSnoozed: just close (D-09 — no infinite snooze chain)
```

**Case C: no action (iOS tap — notification body tap)**
```javascript
event.notification.close();
const urlToOpen = new URL('/?practice_checkin=1', self.location.origin).href;
// focus existing window navigated to urlToOpen, or openWindow
```

**Snooze flag pattern:** Pass `snoozed: true` in `data` of the snoozed notification. When the snoozed notification's "Not yet" is tapped, `event.notification.data.snoozed === true` prevents re-scheduling. This is the same `data` field that the SW uses for `type` and `url` — fully controlled within the SW.

---

### Pattern 4: Dashboard URL Param Detection

**What:** `Dashboard.jsx` (rendered at `/`) detects `?practice_checkin=1` on mount, calls `practiceLogService.logPractice()`, triggers PracticeLogCard visual update, then cleans up the URL.

**Precedent in codebase:** `ConsentVerifyPage.jsx` uses `useSearchParams` from React Router v7 identically:
```javascript
const [searchParams] = useSearchParams();
const token = searchParams.get('token');
```

**Dashboard implementation:**
```javascript
import { useSearchParams } from 'react-router-dom';

// In Dashboard() component:
const [searchParams] = useSearchParams();
const hasPracticeCheckin = searchParams.get('practice_checkin') === '1';

useEffect(() => {
  if (!hasPracticeCheckin || !user?.id || !isStudent) return;

  // Clean URL immediately (before async work) to prevent re-trigger on re-render
  window.history.replaceState({}, '', '/');  // D-18: replaceState approach

  const localDate = practiceLogService.getCalendarDate();

  practiceLogService.logPractice(localDate)
    .then(({ inserted }) => {
      if (inserted) {
        // Invalidate practice-log-today query → PracticeLogCard will transition to settled
        queryClient.invalidateQueries({ queryKey: ['practice-log-today', user.id, localDate] });
        queryClient.invalidateQueries({ queryKey: ['practice-streak', user.id] });
        queryClient.invalidateQueries({ queryKey: ['xp'] });
      } else {
        // D-12: already logged — show friendly toast
        toast.success(t('practice.notification.alreadyLogged'));
      }
    })
    .catch((err) => {
      console.error('[Dashboard] practice_checkin auto-log failed:', err);
      // Silent failure — user can tap PracticeLogCard manually
    });
}, [hasPracticeCheckin, user?.id, isStudent]);
```

**Why `replaceState` over `useNavigate({ replace: true })`:** `replaceState` is synchronous and avoids a navigation re-render cycle. Both are valid (D-18 is Claude's discretion). `replaceState('')` replaces with current pathname (root `/`), stripping the query string.

**PracticeLogCard integration:** `PracticeLogCard` already listens to the `['practice-log-today', user.id, localDate]` React Query cache. When Dashboard invalidates that query, the card re-fetches `getTodayStatus()`, which returns `{ logged: true }`, causing the card's `useEffect` to set `logState` to `'settled'` — the completed animation plays automatically. Zero additional props needed on PracticeLogCard.

---

### Pattern 5: Translation Keys for Notifications

**Location:** `src/locales/en/common.json` and `src/locales/he/common.json`

New keys needed under the `practice` namespace:
```json
{
  "practice": {
    "notification": {
      "alreadyLogged": "You already logged today's practice!"
    }
  }
}
```

The notification content (title/body of the push itself) is constructed server-side in the Edge Function in TypeScript — those strings are not in the i18n files. The toast message for the "already logged" case IS client-side and needs a translation key.

---

### Anti-Patterns to Avoid

- **Checking `instrument_practice_logs` by `created_at` in the Edge Function:** The table uses `practiced_on` (a DATE column, client local timezone). The server should query `practiced_on = todayUtc` — this is the only date column available. Querying by `created_at` would cause timezone confusion.
- **Re-scheduling snooze from the snoozed notification's "Not yet":** D-09 is explicit — no infinite snooze chain. The `snoozed: true` data flag prevents this.
- **Calling `practiceLogService.logPractice()` before cleaning the URL:** Clean the URL with `replaceState` first to prevent a race condition where a React re-render re-triggers the `useEffect` before the async `logPractice` completes.
- **Adding action buttons to the push payload JSON instead of the SW `showNotification` call:** Action buttons must be defined in `showNotification` options in the service worker, not in the raw push payload. The payload can carry `actions` as metadata, but the SW ignores that field and defines its own.
- **Using `event.notification.close()` after async work in the click handler:** Call `close()` before `event.waitUntil()` — closing a notification is synchronous; the async work belongs inside `waitUntil`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent practice log on notification tap | Custom "already-logged" state tracking in SW | `practiceLogService.logPractice()` returns `{ inserted: false }` on 23505 duplicate | DB UNIQUE constraint + error code handling already implemented |
| Rate-limit second notification | Custom per-student tracking | Existing `last_notified_at` column + date comparison in Edge Function | Already enforced for all notification types; D-05 confirms it covers snooze cycle too |
| Snooze notification timer | Web Alarms API / Background Sync | SW `setTimeout` inside `event.waitUntil` | Only cross-browser solution; Alarms API has no browser support |
| URL param cleanup | Navigation state machine | `window.history.replaceState({}, '', '/')` | One-liner; existing pattern in ecosystem |

**Key insight:** The architecture for this entire phase is additive, not structural. Every component — the DB tables, the rate-limit mechanism, the push sending pipeline, the practice log service, the animation sequence — already exists and works. This phase adds one new path through the existing infrastructure.

---

## Common Pitfalls

### Pitfall 1: SW `event.waitUntil` and setTimeout for Snooze

**What goes wrong:** If `setTimeout` is called but not wrapped in a Promise inside `event.waitUntil`, the service worker may terminate before the 2-hour timer fires.

**Why it happens:** Service workers are killed when idle. `event.waitUntil` keeps the SW alive, but only for the Promise passed to it. A bare `setTimeout` without a wrapping Promise is not tracked.

**How to avoid:** Wrap the entire setTimeout in a `new Promise(resolve => setTimeout(async () => { ...; resolve(); }, 2h))` and pass that to `event.waitUntil`. This keeps the SW alive for 2 hours.

**Warning signs:** Snooze timer appears to work in DevTools (where SW stays alive) but silently fails on a real device with the browser backgrounded.

**Important caveat (MEDIUM confidence):** Even with `event.waitUntil`, browsers can kill SWs before a 2-hour timer fires on low-memory devices or when the browser session is terminated. The MDN spec states `waitUntil` prevents termination "until the promise settles or is rejected" — but OS-level process management can override this. The snooze is best-effort, which matches the "gentle check-in" tone of the feature.

---

### Pitfall 2: `actions` Array Platform Support

**What goes wrong:** Android shows the "Yes, I practiced!" / "Not yet" buttons. iOS ignores the `actions` array entirely. Desktop Chrome/Edge shows them. Firefox may show 0-2 depending on version.

**Why it happens:** The Web Push `actions` array is displayed by the OS notification system. iOS's notification system does not expose Web Push action buttons at all (as of 2026).

**How to avoid:** This is by design (D-06, D-10). iOS users tap the notification body → `action === ''` (empty string, not `'yes'`) → the click handler's "no action" branch opens `/?practice_checkin=1`. This is D-10's explicit design.

**Warning signs:** If the iOS branch is accidentally routed to the same `action === 'yes'` check, iOS taps will silently fail to open the app. Ensure the "no action" branch (`!action` or `action === ''`) opens the URL.

---

### Pitfall 3: Practice Check-In Skip Logic Uses UTC Date vs. Local Date

**What goes wrong:** Edge Function queries `instrument_practice_logs` using `todayUtc` (`YYYY-MM-DD` in UTC). But `practiced_on` was written from the client using the local calendar date (client's timezone). A student in Israel (UTC+2/+3) who practiced at 11pm local time writes `practiced_on = '2026-03-24'`. The Edge Function runs at 14:00 UTC = 16:00/17:00 Israel time, so `todayUtc = '2026-03-24'` — same date. No mismatch for after-school hours. Edge case: a student who practiced after midnight UTC (2am Israel time) could receive a notification anyway. This edge case is acceptable given the cron runs at 14:00 UTC.

**How to avoid:** Do not attempt to compensate for timezone in the Edge Function. Use `todayUtc` as the `practiced_on` comparison value. The existing pattern for `students_score` also uses UTC date — be consistent.

---

### Pitfall 4: `last_notified_at` and the Snooze Notification Cycle

**What goes wrong:** `last_notified_at` is updated when the first notification is sent. The snoozed notification fires 2 hours later from the SW (locally, not from the server). By design (D-05), this snoozed notification counts as part of the same cycle — `last_notified_at` is already set, so the server will not send another notification later the same day.

**Why this works:** The SW-triggered snooze does NOT call the Edge Function or update `last_notified_at`. It fires entirely client-side. The next day's cron run will see `last_notified_at.date !== todayUtc` and process normally.

**Verify:** After the server sends a practice check-in notification and updates `last_notified_at`, a student who snoozes will get one local snoozed notification. The server's next run (next day) correctly processes them again. No DB changes needed for snooze.

---

### Pitfall 5: Dashboard `useEffect` Re-Trigger on React Re-Render

**What goes wrong:** If the URL param is not cleaned before the async `logPractice` call, React may re-render (due to `logPractice` triggering query invalidation), re-evaluate the `useEffect` dependencies, and call `logPractice` again before the first call resolves.

**How to avoid:** Call `window.history.replaceState({}, '', '/')` synchronously at the top of the `useEffect` body, before the `logPractice` call. Since `hasPracticeCheckin` is derived from `useSearchParams`, once the URL is cleaned, the next render will have `hasPracticeCheckin = false` and the effect will not re-trigger.

**Why `replaceState` is safe here:** The app uses React Router's history integration. `replaceState` updates the browser URL directly; React Router detects the change and updates its internal `location` state, which causes `useSearchParams` to return an empty `practice_checkin` on the next render.

---

## Code Examples

### Edge Function: Practice Check-In Priority Branch

```typescript
// Source: analysis of existing send-daily-push/index.ts + D-02/D-04 decisions

// STEP 1: Check instrument_practice_logs for today's practiced_on
// Insert this BEFORE the existing students_score check in the per-student loop.
const { count: instrumentPracticeCount, error: instrumentPracticeError } = await supabase
  .from('instrument_practice_logs')
  .select('id', { count: 'exact', head: true })
  .eq('student_id', studentId)
  .eq('practiced_on', todayUtc);  // todayUtc = "2026-03-24" (DATE string)

if (instrumentPracticeError) {
  console.error(`send-daily-push: error checking instrument practice for ${studentId}:`, instrumentPracticeError);
  failed++;
  continue;
}

if (!instrumentPracticeCount || instrumentPracticeCount === 0) {
  // BRANCH A: Student has NOT logged instrument practice today → send practice check-in
  const checkinVariants = [
    {
      title: "Did you practice your piano today? 🎹",
      body: "Tap Yes to log your practice and keep your streak going!",
    },
    {
      title: "How was today's practice? 🎵",
      body: "Let us know you practiced — it only takes a tap!",
    },
    {
      title: "Time for your daily piano check-in! 🎶",
      body: "Did you play today? Tap to log your practice!",
    },
  ];
  const checkin = checkinVariants[Math.floor(Math.random() * checkinVariants.length)];

  const subscriber = appServer.subscribe(row.subscription);
  await subscriber.pushTextMessage(
    JSON.stringify({
      title: checkin.title,
      body: checkin.body,
      tag: 'practice-checkin',
      data: { url: '/?practice_checkin=1', type: 'practice-checkin' },
    }),
    {},
  );

  // Update last_notified_at (same as existing pattern)
  await supabase.from('push_subscriptions')
    .update({ last_notified_at: now.toISOString() })
    .eq('student_id', studentId);

  sent++;
  continue;  // Skip app-usage check — D-02: never both
}

// BRANCH B: Student HAS logged instrument practice today
// Fall through to existing students_score check (app-usage reminder).
// [Existing code continues here unchanged]
```

---

### Service Worker: `push` Handler — Type-Specific Actions

```javascript
// Source: analysis of existing sw.js push handler + Web Push API

// Replace the hardcoded actions array in the push handler options:
let notificationActions = [
  { action: 'open', title: 'Open' },
  { action: 'close', title: 'Dismiss' },
];

if (notificationData.tag === 'practice-checkin') {
  notificationActions = [
    { action: 'yes', title: 'Yes, I practiced!' },
    { action: 'not-yet', title: 'Not yet' },
  ];
}

const options = {
  body: notificationData.body,
  icon: notificationData.icon,
  badge: notificationData.badge,
  vibrate: [100, 50, 100],
  tag: notificationData.tag,
  requireInteraction: false,
  data: {
    ...notificationData.data,
    dateOfArrival: Date.now(),
    clickAction: notificationData.data.url || '/',
  },
  actions: notificationActions,
};
```

---

### Service Worker: `notificationclick` — Practice Check-In Branch

```javascript
// Source: pattern from existing daily-practice handler in sw.js (lines 519-555)

if (notificationType === 'practice-checkin') {
  event.notification.close();

  const isSnoozed = event.notification.data?.snoozed === true;

  if (action === 'yes' || !action) {
    // "Yes, I practiced!" (Android) or notification body tap (iOS)
    const urlToOpen = new URL('/?practice_checkin=1', self.location.origin).href;
    event.waitUntil(
      (async () => {
        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
          if ('focus' in client) {
            try {
              await client.navigate(urlToOpen);
              return client.focus();
            } catch (_e) {
              client.postMessage({ type: 'NAVIGATE', url: '/?practice_checkin=1' });
              return client.focus();
            }
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })()
    );
    return;
  }

  if (action === 'not-yet') {
    if (isSnoozed) {
      // D-09: snoozed notification's "Not yet" → just dismiss, no further scheduling
      return;
    }
    // Schedule one-shot 2-hour snooze
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await self.registration.showNotification('Still time to practice! 🎹', {
              body: "Did you get a chance to practice today?",
              tag: 'practice-checkin-snoozed',
              icon: '/icons/favicon_192x192.png',
              badge: '/icons/favicon_96x96.png',
              vibrate: [100, 50, 100],
              data: {
                type: 'practice-checkin',
                url: '/?practice_checkin=1',
                snoozed: true,
              },
              actions: [
                { action: 'yes', title: 'Yes, I practiced!' },
                { action: 'not-yet', title: 'Not yet' },
              ],
            });
          } catch (err) {
            console.error('sw: snooze showNotification failed:', err);
          }
          resolve();
        }, 2 * 60 * 60 * 1000);
      })
    );
    return;
  }
}
```

---

### Dashboard: URL Param Detection and Auto-Log

```javascript
// Source: ConsentVerifyPage.jsx pattern + practiceLogService API

import { useSearchParams } from 'react-router-dom';
import { practiceLogService } from '../../services/practiceLogService';
import { toast } from 'react-hot-toast';

// Inside Dashboard() component, after existing hooks:
const [searchParams] = useSearchParams();
const hasPracticeCheckin = searchParams.get('practice_checkin') === '1';

useEffect(() => {
  if (!hasPracticeCheckin || !user?.id || !isStudent) return;

  // Clean URL synchronously before async work (Pitfall 5)
  window.history.replaceState({}, '', '/');

  const localDate = practiceLogService.getCalendarDate();

  practiceLogService.logPractice(localDate)
    .then(({ inserted }) => {
      if (inserted) {
        // Triggers PracticeLogCard settled state via React Query cache invalidation
        queryClient.invalidateQueries({ queryKey: ['practice-log-today', user.id, localDate] });
        queryClient.invalidateQueries({ queryKey: ['practice-streak', user.id] });
        queryClient.invalidateQueries({ queryKey: ['xp'] });
      } else {
        // D-12: already logged today
        toast.success(t('practice.notification.alreadyLogged'));
      }
    })
    .catch((err) => {
      console.error('[Dashboard] practice_checkin auto-log failed:', err);
      // Silent failure — PracticeLogCard remains interactive for manual tap
    });
}, [hasPracticeCheckin, user?.id, isStudent]);
// Note: queryClient and t are stable refs, no need to list in deps for lint
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SW notification actions defined in push payload | Actions defined in `showNotification` options in SW; payload only carries metadata | Always the Web Push spec | Phase must set actions in SW `push` handler, not Edge Function JSON |
| Web Push Alarm API for deferred notifications | `setTimeout` inside `event.waitUntil` (best effort) | Alarm API never shipped | Snooze is best-effort; documented in pitfall |
| iOS notification action buttons | Not supported; URL param fallback is primary iOS path | iOS 16.4 added Web Push but no action buttons | D-10 is correct — iOS path is notification tap → URL param |

**Deprecated/outdated:**
- `navigator.serviceWorker.ready` without timeout: Can hang indefinitely if SW is unregistered. Already handled in `notificationService.js` with the `getServiceWorkerRegistration()` helper.

---

## Open Questions

1. **SW 2-hour `setTimeout` reliability on backgrounded mobile**
   - What we know: `event.waitUntil` keeps SW alive until promise resolves. Browsers may kill SWs under memory pressure.
   - What's unclear: Whether Android Chrome or iOS Safari will reliably fire a 2-hour `setTimeout` while the app is backgrounded.
   - Recommendation: Implement as specified (best-effort snooze). Document in code comments. The snoozed notification missing is acceptable — the student already dismissed once. Do NOT block the feature on this uncertainty.

2. **`window.history.replaceState` in React Router v7 context**
   - What we know: `replaceState` is used by React Router internally; calling it directly from user code updates the URL and React Router's location state in React Router v7 via the history API.
   - What's unclear: Whether React Router v7 reacts synchronously to `replaceState` and updates `useSearchParams` before the next render cycle.
   - Recommendation: Use `replaceState` as specified. If React Router v7 has any issue with this (LOW risk), fall back to `const [, setSearchParams] = useSearchParams(); setSearchParams({}, { replace: true })`.

---

## Environment Availability

Step 2.6: This phase modifies an existing Supabase Edge Function and a service worker. No new external dependencies. Environment availability for the existing push infrastructure was verified during Phase 17 (VAPID keys, pg_cron, push_subscriptions table). No audit needed.

---

## Validation Architecture

> `workflow.nyquist_validation` key absent from config.json — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/components/layout/Dashboard.test.jsx` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PUSH-01 | Edge Function sends practice check-in notification when no log today | unit | `npx vitest run src/services/__tests__/sendDailyPush.test.ts` (if added) | ❌ Wave 0 |
| PUSH-02 | Edge Function skips student who already logged practice today | unit | same as above | ❌ Wave 0 |
| PUSH-03 | `last_notified_at` prevents double notification; never both notification types | unit | same as above | ❌ Wave 0 |
| PUSH-04 | SW push handler sets `practice-checkin` actions in `showNotification` | unit | `npx vitest run src/services/__tests__/sw.test.js` (if added) | ❌ Wave 0 |
| PUSH-05 | Dashboard auto-logs when `?practice_checkin=1` param present; toast on already-logged | unit | `npx vitest run src/components/layout/Dashboard.test.jsx` | ❌ Wave 0 |

**Note on Edge Function and SW testing:** These are Deno/browser SW contexts. Testing them with Vitest requires significant mocking. The most practical approach is to test the pure logic (branching decisions, message selection) in isolation, and validate SW handler behavior via integration test with a `self` mock.

### Sampling Rate

- **Per task commit:** `npm run test:run` (full suite, ~10s)
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/layout/Dashboard.test.jsx` — covers PUSH-05 (URL param detection, auto-log, already-logged toast)
- [ ] Logic test for Edge Function priority branching — can be tested as a pure TypeScript function extracted from the handler if desired; otherwise manual verification via Supabase Function logs
- [ ] SW handler test is optional (browser environment mocking overhead is high) — recommend manual testing in DevTools

*(Existing infrastructure: `vitest.config.js`, `src/test/setupTests.js`, `@testing-library/react` all present — no framework install needed.)*

---

## Project Constraints (from CLAUDE.md)

- **SVG imports:** Use `import Icon from './icon.svg?react'` — not relevant to this phase.
- **Pre-commit hooks:** Husky + lint-staged runs ESLint + Prettier on staged files. All new code must pass.
- **Styling:** Glass card pattern for any new UI. Toast via `react-hot-toast` (already imported in Dashboard.jsx).
- **i18n:** All client-side strings via `useTranslation` and i18n keys. Edge Function strings (notification title/body) are TypeScript constants — not i18n (correct, no localization needed for system notifications).
- **Testing:** Vitest + `@testing-library/react`. Test files as `*.test.{js,jsx}` siblings.
- **Security:** Auth endpoints never cached in SW. Practice log auto-call goes through `practiceLogService` which verifies session via `supabase.auth.getSession()` — no credentials in SW.
- **Supabase RLS:** `practiceLogService.logPractice()` uses `student_id = auth.uid()` (RLS enforced). The Edge Function uses service role key for `instrument_practice_logs` read (intentional bypass for server-side skip logic — same pattern as existing `students_score` check).
- **COPPA:** No PII logged or stored. Student UUID only. Notification content has no PII.
- **`__APP_VERSION__`:** Not relevant to this phase.

---

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `supabase/functions/send-daily-push/index.ts` — full file read, understood existing loop structure, VAPID init, rate-limit mechanism
- Codebase analysis: `public/sw.js` — full file read, confirmed existing type-based routing pattern, push handler structure, notification click handler
- Codebase analysis: `src/services/practiceLogService.js` — confirmed `logPractice()` is idempotent, returns `{ inserted: boolean }`, handles 23505
- Codebase analysis: `src/components/dashboard/PracticeLogCard.jsx` — confirmed `logState` FSM, React Query invalidation pattern, `settled` state trigger via `useEffect`
- Codebase analysis: `src/components/layout/Dashboard.jsx` — confirmed `useQuery` patterns, `queryClient` availability, `toast` import, PracticeLogCard is rendered
- Codebase analysis: `src/pages/ConsentVerifyPage.jsx` + `src/components/trail/TrailMap.jsx` — confirmed `useSearchParams` precedent in codebase
- Codebase analysis: `supabase/migrations/20260324000001_instrument_practice_tables.sql` — confirmed `instrument_practice_logs` schema: `practiced_on DATE`, `UNIQUE(student_id, practiced_on)`
- Codebase analysis: `supabase/migrations/20260304000001_add_push_subscriptions.sql` — confirmed `push_subscriptions` schema, `last_notified_at`, RLS policies

### Secondary (MEDIUM confidence)

- MDN Web Push API (knowledge base, Aug 2025): `Notification.actions` must be defined in `showNotification` options, not in push payload; iOS action button support absent as of 2026
- Web Push spec behavior: `event.waitUntil` in service worker keeps SW alive until promise settles; `setTimeout` inside is best-effort on backgrounded mobile

### Tertiary (LOW confidence)

- SW 2-hour `setTimeout` reliability on backgrounded Android Chrome and iOS Safari — behavior may vary by device/OS. Documented as best-effort in Pitfall 1.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use; no new dependencies
- Architecture: HIGH — all integration points verified by reading actual source files
- Edge Function changes: HIGH — exact insertion point and query pattern identified
- SW changes: HIGH — existing handler pattern confirmed, new branch is additive
- Dashboard URL param: HIGH — `useSearchParams` precedent confirmed in codebase
- Snooze reliability: MEDIUM — browser behavior is best-effort; documented honestly

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable APIs, no fast-moving dependencies)
