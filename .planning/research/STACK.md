# Stack Research

**Domain:** Instrument practice tracking — daily yes/no logging, dedicated streak, XP rewards, interactive push notification action buttons, parent calendar heatmap
**Researched:** 2026-03-23
**Confidence:** HIGH (push action button iOS limitations verified via multiple sources; heatmap library verified via GitHub releases; all other decisions follow existing patterns)

---

## Context: What Already Exists (Do Not Re-research)

The following are in production and require NO new packages:

- React 18 + Vite 6 + React Router v7
- Supabase (auth, database, real-time, Edge Functions)
- TanStack React Query v5
- Tailwind CSS 3 + glassmorphism design system
- Web Push notifications (VAPID, `@negrel/webpush` in Edge Functions, service worker `push`/`notificationclick` handlers in `public/sw.js`)
- `streakService.js` — app-usage streak with 36-hour grace, freeze shields, weekend pass, comeback bonus
- `xpSystem.js` — 30-level + prestige XP system
- `send-weekly-report` Edge Function — Brevo HTML emails, HMAC unsubscribe
- `lucide-react`, `framer-motion`, `recharts`, `react-confetti`, `react-hot-toast`
- i18next with EN/HE

This milestone adds ONE new npm package and two to three new database tables. Everything else is pure extension of existing patterns.

---

## Recommended Stack — New Additions Only

### New npm Package

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `react-activity-calendar` | `^3.1.1` | GitHub-style calendar heatmap for parent practice view | Active maintenance (v3.0 released November 15, 2025; v3.1.1 published March 2026), pure ESM, TypeScript, React 18 peer dep only, Floating UI tooltips (headless, no external dep), supports custom colors per level, dark/light mode, localization. ~87 kB minified (reduced ~33% in v3 from v2). Better maintained than `react-calendar-heatmap` (stale since 2022) and more feature-complete than `@uiw/react-heat-map`. |

**Install:**
```bash
npm install react-activity-calendar@^3.1.1
```

### Data Format and Integration

`react-activity-calendar` v3 uses a named export (breaking change from v2 which had a default export):

```javascript
import { ActivityCalendar } from 'react-activity-calendar';

// Binary practice data: level 0 = missed, level 4 = practiced
// count is required but can be 0 or 1 for yes/no tracking
const practiceData = [
  { date: '2026-01-01', count: 0, level: 0 }, // missed
  { date: '2026-01-02', count: 1, level: 4 }, // practiced
  // Must include an entry for every date in the range
];

<ActivityCalendar
  data={practiceData}
  maxLevel={4}
  colorScheme="dark"
  theme={{
    dark: [
      'rgba(255,255,255,0.08)', // level 0: missed — glass-like background
      '#4338ca',                // level 1 (unused for binary, but required)
      '#4f46e5',
      '#6366f1',
      '#818cf8',               // level 4: practiced — indigo-400
    ],
  }}
  weekStart={0}               // Sunday start (adjust for HE locale if needed)
  showColorLegend={false}     // binary = no legend needed
  showMonthLabels={true}
  showTotalCount={false}      // parent doesn't need total count display
  hideTotalCount={false}      // v3 uses showTotalCount prop (not hideTotalCount)
/>
```

Color choices align with existing indigo-400/indigo-600 design tokens and glass background.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `react-activity-calendar@3.1.1` | `react-calendar-heatmap` (kevinsqi/hackclub fork) | Last published 2022; no TypeScript types; abandoned by original author |
| `react-activity-calendar@3.1.1` | `@uiw/react-heat-map` | Works but weaker built-in dark mode and tooltip API; less actively maintained; react-activity-calendar has more GitHub stars and recent releases |
| `react-activity-calendar@3.1.1` | Build from scratch (SVG + Tailwind + date math) | Date math edge cases (leap years, week-start locale, 53-week years) add implementation risk; a vetted library eliminates this; the component is parent-facing so perfection on edge cases matters |
| `react-activity-calendar@3.1.1` | recharts (already installed) | recharts has no calendar/heatmap chart type; would require a custom renderer anyway |

---

## New Database Tables

No new npm packages required — all follows Supabase/Postgres patterns already established in the codebase.

### Table 1: `instrument_practice_logs`

Source of truth for the heatmap and streak. One row per student per calendar day.

```sql
CREATE TABLE instrument_practice_logs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  practiced_on   date NOT NULL,                      -- calendar date (client-determined local tz)
  logged_at      timestamptz NOT NULL DEFAULT now(),  -- server timestamp
  is_retroactive boolean NOT NULL DEFAULT false,      -- true when logging yesterday
  source         text NOT NULL DEFAULT 'dashboard',   -- 'dashboard' | 'notification_action'
  UNIQUE (student_id, practiced_on)                  -- one entry per student per day
);

ALTER TABLE instrument_practice_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student own rows" ON instrument_practice_logs
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE INDEX idx_ipl_student_date ON instrument_practice_logs (student_id, practiced_on);
```

Heatmap query: `SELECT practiced_on FROM instrument_practice_logs WHERE student_id = $1 AND practiced_on >= $2 ORDER BY practiced_on`.

### Table 2: `instrument_practice_streak`

Separate from `current_streak` (which tracks app-usage). Instrument practice streak is a distinct concept.

```sql
CREATE TABLE instrument_practice_streak (
  student_id    uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  streak_count  integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE instrument_practice_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student own rows" ON instrument_practice_streak
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());
```

Weekend pass for instrument streak reuses the `weekend_pass_enabled` column from `current_streak` (same parent toggle controls both) rather than duplicating the column. This is a roadmap phase decision.

---

## Interactive Push Notification Action Buttons

### Implementation Pattern

The existing service worker (`public/sw.js`) already has `push` and `notificationclick` event listeners. The action button pattern requires:

1. Include `actions` array in the `showNotification()` call inside the `push` listener
2. Check `event.action` in the `notificationclick` listener
3. Call back to Supabase to log the practice (via postMessage to app window or URL navigation)

```javascript
// In push listener (sw.js) — new practice-checkin notification type
self.addEventListener('push', (event) => {
  const data = event.data ? JSON.parse(event.data.text()) : {};

  if (data.type === 'practice-checkin') {
    const options = {
      body: data.body,
      tag: 'practice-checkin',  // distinct from existing 'daily-practice' tag
      actions: [
        { action: 'yes', title: 'Yes, I practiced!' },
        { action: 'no',  title: 'Not yet' },
      ],
      data: { url: '/', type: 'practice-checkin' },
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
    return;
  }

  // ... existing daily-practice handler unchanged
});

// In notificationclick listener (sw.js) — extend existing handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.tag === 'practice-checkin') {
    if (event.action === 'yes') {
      // Open app at special URL that triggers log-on-mount
      event.waitUntil(
        clients.openWindow('/?log_practice=1&source=notification_action')
      );
    } else {
      // 'no' action or plain tap — just open the app
      event.waitUntil(clients.openWindow('/'));
    }
    return;
  }

  // ... existing daily-practice click handler unchanged
});
```

**Authentication approach for logging from notification:** The service worker does not have the Supabase JWT. Rather than embedding tokens in notification payloads (security risk), the chosen pattern is to open the app at a URL with a `?log_practice=1` query param. The app's dashboard (or a lightweight route handler) detects this param on mount, verifies the user session is active, and calls the log API. This is the simplest correct approach — no new auth patterns, no token management.

### Cross-Platform Reality (Verified)

| Platform | Action Buttons Render | Notes |
|----------|----------------------|-------|
| Chrome/Android PWA | YES — full support | Primary platform for this app's users; works as expected |
| Chrome Desktop | YES — full support | |
| Firefox Desktop | YES — full support | |
| Edge Desktop | YES — full support | |
| Safari macOS 14+ | YES — works | macOS push fully supported |
| **iOS Safari PWA (16.4+)** | **NO — actions silently dropped** | Confirmed via Apple Developer Forums (thread 726793) and independent developer testing: the `actions` array is accepted without error but action buttons never render on iOS. The notification appears, `notificationclick` fires on tap, but iOS exposes no action UI. |
| iOS Safari in EU | NO — push not supported | EU regulatory restriction (browser choice screen); push only works for home screen installs outside EU |

**iOS fallback:** The "Did you practice?" notification fires without action buttons on iOS. Tapping the notification (no action) opens the app to the dashboard where the manual log button handles the logging. This is acceptable — iOS is a secondary platform for 8-year-old learners (Android PWA is primary). No polyfill needed.

**Safari iOS 18.4 Declarative Web Push:** Apple shipped a new "Declarative Web Push" format in iOS/iPadOS 18.4 (currently in beta as of March 2026) that removes the service worker requirement for basic notifications. It does not add action button support. Not relevant to this milestone.

---

## New Edge Functions

### `log-instrument-practice`

New authenticated Edge Function (NOT a cron — requires user JWT):

```
POST /functions/v1/log-instrument-practice
Authorization: Bearer <supabase_jwt>
Body: { "practiced_on": "2026-03-23", "is_retroactive": false, "source": "dashboard" }
```

Responsibilities:
1. Validate JWT (standard Supabase auth, `verify_jwt = true`)
2. Parse `practiced_on` date; reject future dates; allow yesterday only for retroactive
3. Upsert into `instrument_practice_logs` (idempotent — safe to call twice)
4. Update `instrument_practice_streak.streak_count` using same weekend-pass logic as `streakService.js`
5. Award XP via existing `award_xp()` Postgres function (amount TBD by roadmap phase)
6. Return `{ logged: boolean, streak: number, xpAwarded: number, alreadyLoggedToday: boolean }`

Follows the pattern of `create-checkout` and `send-consent-email` (authenticated Edge Functions, not cron).

### `send-practice-checkin-push`

New cron Edge Function, separate from `send-daily-push`:

- Cron trigger: different time from app-usage reminder (e.g., 18:00 UTC = 8-9pm Israel time)
- Skips students who already have an `instrument_practice_logs` entry for today
- Skips students whose `last_practice_asked_at` is already today (dedup)
- Sends notification with `type: 'practice-checkin'`, `tag: 'practice-checkin'`
- Reuses `@negrel/webpush` + VAPID pattern from `send-daily-push` verbatim
- Tracks `last_practice_asked_at` on `push_subscriptions` (new column) or a new slim table

---

## Weekly Email Integration

Extend `send-weekly-report` Edge Function (no new Edge Function needed):

```typescript
// Add to WeeklyReportParams interface
interface WeeklyReportParams {
  // ...existing fields...
  daysPracticedInstrument: number;  // new: 0-7 days
}

// Add to generateWeeklyReportHTML() — new row in the stats table
// "Days practiced at home: X / 7"
```

Query to add to the existing weekly report loop:
```sql
SELECT COUNT(*) FROM instrument_practice_logs
WHERE student_id = $1
  AND practiced_on >= NOW() - INTERVAL '7 days'
```

---

## No New Packages Needed For

| Capability | Why No New Package Needed |
|-----------|--------------------------|
| Instrument practice streak logic | Pure JS, mirrors `streakService.js` — new `instrumentPracticeStreakService.js` |
| XP award for logging | Existing `award_xp()` Postgres function |
| Dashboard practice card | React + Tailwind glassmorphism pattern, TanStack Query data fetching |
| Weekly email practice summary | Extend existing `send-weekly-report` Edge Function |
| Retroactive yesterday logging | Date math only, no library needed |
| Streak display icons | Existing `lucide-react` (flame, shield icons already used) |
| Log confirmation animation | Existing `framer-motion` (already in `package.json`) |
| XP award toast | Existing `react-hot-toast` (already in `package.json`) |
| Practice logging UI | Plain React + Tailwind — a button and a status indicator |

**Explicitly avoid:**

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `date-fns` or `dayjs` | `getCalendarDate()` helper in `streakService.js` handles all needed date math; adding a date library for 3 lines of code is over-engineering | Inline date formatting (same pattern as `streakService.js`) |
| Embedding auth tokens in push notification payload | Security risk — tokens in push payload can be captured by malicious service workers or logged | Open `/?log_practice=1` URL and authenticate via existing session on app mount |
| Modifying `current_streak` table for instrument tracking | App-usage streak and instrument practice streak must remain independent | Separate `instrument_practice_streak` table |
| Modifying `send-daily-push` to add practice checkin | Two different notifications with different triggers and skip conditions must not share one cron job | New `send-practice-checkin-push` Edge Function with its own cron schedule |
| `recharts` for the heatmap | No calendar chart type in recharts | `react-activity-calendar` |

---

## Integration Points with Existing Infrastructure

| Existing System | How v2.7 Integrates |
|-----------------|---------------------|
| `streakService.js` | New `instrumentPracticeStreakService.js` mirrors its JS structure. Does NOT touch app-usage streak logic. |
| `current_streak` table | Read-only: `weekend_pass_enabled` column may be read by instrument streak logic. Not written. |
| `push_subscriptions` table | New `last_practice_asked_at` column added (or separate tracking table). Existing columns unchanged. |
| `send-daily-push` Edge Function | NOT modified. New cron function is fully independent. |
| `send-weekly-report` Edge Function | Extended with one additional stat (days practiced instrument). HTML template updated. |
| `award_xp()` Postgres function | Called from `log-instrument-practice` Edge Function after successful log. |
| `xpSystem.js` / `students.total_xp` | XP flows into existing level display automatically. No UI changes needed. |
| TanStack Query cache | New query keys: `["instrument-practice-today", userId]`, `["instrument-practice-streak", userId]`, `["instrument-practice-calendar", userId, year]`. Invalidate after log. |
| Service worker `notificationclick` handler | Extended with `practice-checkin` tag branch. Existing `daily-practice` branch unchanged. |
| Dashboard layout | New practice card component inserted into dashboard grid. Follows glass card pattern. |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|----------------|-------|
| `react-activity-calendar` | `^3.1.1` (new) | React `^18.3.1` (peer dep) | Matches existing React 18 install. Pure ESM — matches project `"type": "module"`. |

`react-activity-calendar` v3 dropped the default export. Import as `import { ActivityCalendar } from 'react-activity-calendar'`. No other breaking changes affect this use case.

---

## Sources

- [react-activity-calendar GitHub](https://github.com/grubersjoe/react-activity-calendar) — confirmed active maintenance, v3.0 November 2025 (MEDIUM confidence — GitHub scrape)
- [react-activity-calendar Releases](https://github.com/grubersjoe/react-activity-calendar/releases) — v3.1.1 latest, published March 2026 (MEDIUM confidence — GitHub releases page)
- [react-activity-calendar README](https://github.com/grubersjoe/react-activity-calendar/blob/main/README.md) — data format `{ date, count, level }`, named import, available props (HIGH confidence — official repo README)
- [web.dev: Push Notifications Notification Behavior](https://web.dev/push-notifications-notification-behaviour/) — `actions` array structure, `notificationclick` event.action pattern (HIGH confidence — official Google web.dev documentation)
- [MDN: NotificationEvent.action](https://developer.mozilla.org/en-US/docs/Web/API/NotificationEvent/action) — `event.action` property confirmed (HIGH confidence — MDN official)
- [MDN: ServiceWorkerRegistration.showNotification()](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification) — actions options confirmed (HIGH confidence — MDN official)
- [Apple Developer Forums thread 726793: Notification Actions on iOS 16.4](https://developer.apple.com/forums/thread/726793) — iOS action button support status questioned; actions appear to be silently dropped (MEDIUM confidence — Apple Developer Forums, Apple engineers involved)
- [WebVentures: Web Push iOS One Year Anniversary (2024)](https://webventures.rejh.nl/blog/2024/web-push-ios-one-year/) — real-world iOS push limitations; actions array silently ignored (MEDIUM confidence — independent developer blog with empirical testing)
- [mdn/browser-compat-data Issue #22959](https://github.com/mdn/browser-compat-data/issues/22959) — notificationclick confirmed firing on iOS but automated tests may have incorrectly marked features as supported (MEDIUM confidence — MDN compat data tracking issue)
- [Push Notifications in Safari iOS PWAs (April 2024)](https://iwritecodesometimes.net/2024/04/23/push-notifications-in-safari-progressive-web-apps/) — confirms actions array defined in code works in some configurations (MEDIUM confidence — blog, April 2024; may be outdated)
- [WebKit: Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/) — iOS 18.4 Declarative Web Push beta; does not address action buttons (HIGH confidence — official WebKit blog)
- [iOS PWA Push Notifications 2026 (webscraft.org)](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en) — iOS limitations including no action buttons confirmed (MEDIUM confidence — blog, March 2026)
- `C:/Development/PianoApp2/package.json` — installed dependencies confirmed (HIGH confidence — direct read)
- `C:/Development/PianoApp2/public/sw.js` — existing push/notificationclick handler structure confirmed (HIGH confidence — direct read)
- `C:/Development/PianoApp2/supabase/functions/send-daily-push/index.ts` — cron pattern, VAPID pattern, skip-if-practiced logic confirmed (HIGH confidence — direct read)
- `C:/Development/PianoApp2/src/services/streakService.js` — streak logic pattern for `instrumentPracticeStreakService.js` to mirror (HIGH confidence — direct read)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| Heatmap library (`react-activity-calendar`) | HIGH | Active, recent releases; correct peer deps; data format verified from README |
| Push action buttons (Android/Chrome) | HIGH | Fully supported standard Web API; documented on MDN and web.dev |
| Push action buttons (iOS PWA) | MEDIUM | Multiple developer sources confirm actions are silently dropped; Apple's official docs don't explicitly document this limitation but consistent community evidence supports it. The URL-navigation fallback is designed around this. |
| Database schema design | HIGH | Follows established `current_streak` / `last_practiced_date` patterns exactly |
| Edge Function patterns | HIGH | Mirrors `send-daily-push` (cron) and `create-checkout` (authenticated) patterns verbatim |
| Weekly email extension | HIGH | Extends existing function; same Brevo pattern |
| No new packages beyond heatmap | HIGH | All capabilities verified present in installed package set |

---

*Stack research for: v2.7 Instrument Practice Tracking — PianoApp2*
*Researched: 2026-03-23*
