# Architecture Research

**Domain:** Piano learning PWA — instrument practice tracking integration (v2.7)
**Researched:** 2026-03-23
**Confidence:** HIGH (all findings from direct codebase inspection + verified against MDN and official docs)

## Context: What Is Being Added

This milestone adds a **separate instrument practice tracking system** that runs parallel to
the existing app-usage streak (`current_streak` table). The key distinction:

- **Existing streak** = did the student open the app and play a game today?
- **Instrument practice streak** = did the student physically practice their instrument today?

These are deliberately separate: a student can practice piano at home without opening the app,
and the app should reward both behaviors. The two streaks display side-by-side on the Dashboard.

---

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                    React 18 + Vite 6 (PWA)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      Dashboard.jsx                           │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │ │
│  │  │ UnifiedStatsCard│  │ PracticeLogCard  │  │ (existing   │ │ │
│  │  │ (MODIFIED:      │  │ (NEW dashboard   │  │  cards)     │  │ │
│  │  │  add practice   │  │  card)           │  └─────────────┘  │ │
│  │  │  streak to      │  └────────┬─────────┘                   │ │
│  │  │  right side)    │           │ usePracticeLog()             │ │
│  │  └─────────────────┘           │ (React Query)                │ │
│  └──────────────────────────────┬─┴─────────────────────────────┘ │
│                                 │                                  │
│  ┌──────────────────────────────▼─────────────────────────────┐   │
│  │         Parent Portal / ParentHeatmapCard (NEW page)        │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  PracticeCalendarHeatmap (NEW — SVG, no deps)        │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────── ┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │               Service Layer                                 │   │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ practiceLogService.js│  │ streakService.js          │   │   │
│  │  │  (NEW — standalone)  │  │  (UNCHANGED — app usage)  │   │   │
│  │  └──────────┬───────────┘  └──────────────────────────┘   │   │
│  └─────────────┴──────────────────────────────────────────────┘   │
│                │ supabase-js (RLS, auth.uid())                     │
└────────────────┼──────────────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────────────┐
│                      Supabase Platform                             │
│  ┌────────────────────────┐  ┌────────────────────────────────┐   │
│  │  instrument_practice_log│  │  instrument_practice_streak    │   │
│  │  (NEW table)            │  │  (NEW table — mirrors          │   │
│  │  - student_id           │  │   current_streak structure)    │   │
│  │  - practice_date (DATE) │  │  - streak_count                │   │
│  │  - logged_at            │  │  - weekend_pass_enabled        │   │
│  │  - xp_awarded           │  │  - last_practiced_date         │   │
│  └────────────────────────┘  └────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                 Edge Functions                              │   │
│  │  ┌──────────────────────────┐  ┌───────────────────────┐   │   │
│  │  │ send-practice-check-push │  │  send-weekly-report   │   │   │
│  │  │  (NEW Edge Function)     │  │  (MODIFIED: add        │   │   │
│  │  │  cron-triggered daily    │  │  practice_days_logged) │   │   │
│  │  └──────────────────────────┘  └───────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                Service Worker (public/sw.js)                │   │
│  │  MODIFIED: add "did-you-practice" notification type        │   │
│  │  Action buttons: "yes-practiced" | "no-not-yet"            │   │
│  │  - "yes-practiced" action: fetch POST to log-practice Edge │   │
│  │    Function (no auth token — handled via JWT workaround)   │   │
│  │  OR: postMessage to React app to trigger log               │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New or Modified |
|-----------|---------------|-----------------|
| `practiceLogService.js` | logPractice(), getPracticeStreak(), getPracticeHistory(), getPracticeCalendar() | NEW |
| `instrument_practice_log` table | Append-only log of practice dates per student | NEW |
| `instrument_practice_streak` table | Current practice streak count + weekend pass state | NEW |
| `PracticeLogCard.jsx` | Dashboard card: today's status + log button + practice streak | NEW |
| `PracticeCalendarHeatmap.jsx` | GitHub-style 365-day SVG heatmap for parent portal | NEW |
| `send-practice-check-push` Edge Function | Daily "Did you practice?" push notification (cron) | NEW |
| `send-weekly-report` Edge Function | Add practice_days_logged stat to email body | MODIFIED |
| `public/sw.js` | Handle "did-you-practice" notification type + action buttons | MODIFIED |
| `streakService.js` | App-usage streak (unchanged) | UNCHANGED |
| `UnifiedStatsCard.jsx` | Optionally surface practice streak alongside app streak | MODIFIED (minor) |

---

## Recommended Project Structure

New files to create:

```
src/
├── services/
│   └── practiceLogService.js        # logPractice(), getPracticeStreak(),
│                                    # getPracticeHistory(), getPracticeCalendar()
├── components/
│   ├── dashboard/
│   │   └── PracticeLogCard.jsx      # Dashboard card with log button + streak
│   └── parent/
│       └── PracticeCalendarHeatmap.jsx  # SVG heatmap, no external deps

supabase/
├── migrations/
│   └── 20260323000001_instrument_practice_tracking.sql
└── functions/
    └── send-practice-check-push/
        └── index.ts                 # New Edge Function

public/
└── sw.js                            # Modified (add did-you-practice handler)
```

### Structure Rationale

- **`practiceLogService.js` is standalone:** Not merged into `streakService.js`. The instrument
  practice streak has different semantics (yes/no daily log vs. automatic app-session detection).
  Separate service keeps both services testable in isolation and prevents coupling.
- **`PracticeCalendarHeatmap.jsx` in `components/parent/`:** This view is parent-facing, not
  student-facing. Keeps parent portal components grouped together.
- **Heatmap built without npm package:** The glass-morphism design system uses custom SVG
  already (XPRing uses SVG foreignObject). A bespoke heatmap of ~80 lines SVG + Tailwind avoids
  a 30-50kb dependency and integrates with the app's purple palette naturally.

---

## Data Model

### New Table: `instrument_practice_log`

```sql
CREATE TABLE instrument_practice_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  practice_date DATE        NOT NULL,          -- local date (client sends YYYY-MM-DD)
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  xp_awarded    INTEGER     NOT NULL DEFAULT 0, -- XP given for this log entry
  source        TEXT        NOT NULL DEFAULT 'dashboard', -- 'dashboard' | 'notification_action'

  UNIQUE (student_id, practice_date)           -- one entry per day per student
);
```

RLS: `auth.uid() = student_id` for SELECT/INSERT. No UPDATE/DELETE (append-only integrity).
Parent access: JOIN through `teacher_student_connections` for calendar view.

### New Table: `instrument_practice_streak`

```sql
CREATE TABLE instrument_practice_streak (
  student_id              UUID        PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  streak_count            INTEGER     NOT NULL DEFAULT 0,
  last_practiced_date     DATE,                -- the last date a practice was logged
  weekend_pass_enabled    BOOLEAN     NOT NULL DEFAULT false,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

RLS: mirrors `current_streak` table — `auth.uid() = student_id` for SELECT/UPDATE (upsert).
No freeze mechanic for v2.7 (simpler than app streak — can be added later).

**Why two separate tables instead of adding columns to `current_streak`?**
The instrument practice streak is independently queryable for the heatmap, has different
update semantics (client logs a date, not a timestamp), and adding 5+ columns to `current_streak`
would make a core table harder to reason about. Clean boundary.

---

## Architectural Patterns

### Pattern 1: Separate Service, Parallel to streakService

**What:** `practiceLogService.js` follows the exact same module-level cooldown + in-flight
dedup pattern as `streakService.js`. It is not a subclass or composition of streakService.

**When to use:** When a new domain concept (instrument practice) has its own data lifecycle
and would otherwise require awkward parameter threading through the existing service.

**Trade-offs:**
- Pro: streakService.js stays unchanged (no regression risk)
- Pro: practiceLogService.js is independently testable
- Con: Two similar-looking modules (acceptable — code duplication is preferable to wrong coupling)

**Key functions:**
```javascript
// practiceLogService.js
export const practiceLogService = {
  // Log today's (or yesterday's) practice. Idempotent via unique constraint.
  async logPractice(dateStr),          // dateStr: 'YYYY-MM-DD' in local time

  // Returns { streakCount, weekendPassEnabled, lastPracticedDate, loggedToday }
  async getPracticeState(),

  // Returns array of { practice_date } for calendar heatmap rendering
  // Fetches up to 365 days of history. Cached generously (staleTime 10min).
  async getPracticeCalendar(studentId),

  // Award XP for logging practice (calls awardXP from xpSystem.js)
  async awardPracticeXP(studentId),
};
```

### Pattern 2: Notification Action Button Flow (postMessage, not fetch from SW)

**What:** The "Did you practice?" push notification includes two action buttons. Tapping
an action button fires `notificationclick` in the service worker. The recommended approach
for this app is to **route the action through postMessage to the React app** rather than
making a direct Supabase REST call from the service worker.

**Why postMessage over direct fetch:**
- The service worker has no auth token. The Supabase client in `sw.js` does not have a
  live session; using `fetch` directly to the REST API would fail RLS (`auth.uid()` returns
  null without a JWT in the Authorization header).
- Storing the JWT in the service worker scope is a security risk (persistent across sessions).
- The React app already has a valid Supabase session; routing through postMessage delegates
  the authenticated operation to the right context.

**The flow:**
```
User taps "Yes, I practiced!" action button on notification
    ↓
notificationclick fires in sw.js (event.action === 'log-practiced')
    ↓
sw.js calls self.clients.matchAll() to find open app windows
    ↓ (if app is open)
client.postMessage({ type: 'LOG_INSTRUMENT_PRACTICE', date: 'YYYY-MM-DD' })
    ↓
React app listens via navigator.serviceWorker.addEventListener('message', ...)
    ↓
practiceLogService.logPractice(date) — authenticated, goes through RLS
    ↓
React Query invalidation of ['practice-state', userId] and ['student-xp', userId]
    ↓
Dashboard updates immediately (PracticeLogCard shows "Logged!")
```

**When app is NOT open (notification tapped with no window):**
```
notificationclick fires (event.action === 'log-practiced')
    ↓
sw.js opens new window: self.clients.openWindow('/?practice_logged=YYYY-MM-DD')
    ↓
React app on load reads URL param, calls practiceLogService.logPractice()
    ↓
URL param removed via history.replaceState (no bookmark pollution)
```

**Platform caveat (HIGH confidence):** iOS Safari does NOT support notification action buttons
at all. On iOS, only the main notification body tap is handled. The service worker must
gracefully fall back: the main notification body tap (no action) opens the app to the dashboard,
where the PracticeLogCard provides the manual log button.

**When to use:** Any time a notification action needs to mutate authenticated data.

**Trade-offs:**
- Pro: No auth token leakage into service worker scope
- Pro: Consistent with existing SECURITY guidelines (auth endpoints never cached)
- Con: Requires the app to be resumable on specific URL params

### Pattern 3: Calendar Heatmap — Bespoke SVG, No External Package

**What:** Build a 52-week × 7-day SVG grid directly in React, colored by `instrument_practice_log`
entries. No `react-calendar-heatmap` or `@uiw/react-heat-map` npm package needed.

**Why bespoke:**
- The app's design system uses glassmorphism + purple palette. npm heatmap packages ship
  their own CSS/color systems that fight Tailwind and require override effort.
- The data shape is binary (practiced/not practiced) — far simpler than GitHub's 4-level
  intensity model that these packages are optimized for.
- Estimated ~100 lines of JSX. Dependency adds 30–50kb. Not worth it.
- Consistent with existing SVG patterns (XPRing in `XPRing.jsx` uses SVG directly).

**Caching:** `staleTime: 10 * 60 * 1000` — calendar history rarely changes mid-session.
Initial fetch loads 365 days of `instrument_practice_log` rows for the student. The parent
portal fetches via teacher's service role join (practiceLogService surfaces this).

**When to use:** When the data is simple binary and the UI design system would require heavy
overrides of an external package.

### Pattern 4: XP Award on Practice Log

**What:** When a student logs instrument practice, award a fixed XP amount (25 XP recommended
— more than daily_streak bonus of 25 but less than completing a trail node at 50+).

**Flow:**
```javascript
// practiceLogService.logPractice()
const { data, error } = await supabase
  .from('instrument_practice_log')
  .insert({ student_id, practice_date, source })
  .select('id')
  .single();

if (!error) {
  // Update practice streak
  await updatePracticeStreak(studentId, practice_date);

  // Award XP (reuses existing awardXP from xpSystem.js)
  await awardXP(studentId, PRACTICE_LOG_XP);  // 25 XP
}
```

Idempotency: The UNIQUE constraint on `(student_id, practice_date)` means double-tapping
the log button returns a constraint violation that the service catches and ignores silently
(already logged today = no error shown to user, no double XP).

**When to use:** Every practice log event, once per date per student.

---

## Data Flow

### Critical Flow: Notification Tap → Practice Log → Streak Update → XP Award

```
[pg_cron: 16:00 UTC daily]
    ↓
send-practice-check-push Edge Function
    - Queries push_subscriptions WHERE is_enabled = true
    - Skips students who already logged practice today (instrument_practice_log)
    - Skips students already notified today via this function (new last_practice_notified_at col)
    - Sends push notification with actions: ['log-practiced', 'remind-later']
    - Payload: { type: 'did-you-practice', date: 'YYYY-MM-DD' (today local? use UTC), ... }
    ↓
[Service Worker: notificationclick event]
    - event.action === 'log-practiced':
        IF app window open → postMessage({ type: 'LOG_INSTRUMENT_PRACTICE', date })
        IF no window → openWindow('/?practice_logged=' + date)
    - event.action === 'remind-later' or no action:
        Close notification, open app to '/'
    ↓
[React App: message listener in practiceLogService OR URL param on mount]
    - Calls practiceLogService.logPractice(date)
    - supabase INSERT into instrument_practice_log (unique constraint deduplication)
    - supabase UPSERT into instrument_practice_streak (streak count update)
    - awardXP(studentId, 25) via existing xpSystem.js
    ↓
[React Query invalidation]
    - queryClient.invalidateQueries(['practice-state', userId])
    - queryClient.invalidateQueries(['student-xp', userId])
    ↓
[UI update]
    - PracticeLogCard shows "Logged today!" with checkmark
    - UnifiedStatsCard XP ring animates to reflect new XP
```

### Dashboard Manual Log Flow

```
[Student opens app, sees PracticeLogCard]
    ↓
PracticeLogCard fetches ['practice-state', userId] via useQuery
    ↓ (renders one of three states)
State A: logged_today = true → show checkmark, streak count, "Great job!"
State B: logged_today = false, is_yesterday = possible → show "Log today" + "Log yesterday" buttons
State C: loading → skeleton
    ↓
Student taps "Log today"
    ↓
practiceLogService.logPractice(todayDateStr)
    ↓ (same as notification flow from "React App" step above)
```

### Parent Heatmap Data Flow

```
Parent navigates to /parent-portal
    ↓
ParentHeatmapCard fetches ['practice-calendar', studentId] via useQuery
    - staleTime: 10 minutes
    - queryFn: practiceLogService.getPracticeCalendar(studentId)
    - Returns: Set<YYYY-MM-DD> of all logged dates
    ↓
PracticeCalendarHeatmap receives practicedDates prop
    - Renders 52-week × 7-day SVG grid
    - Green cell = date in practicedDates Set
    - Gray cell = date not in Set (future dates: no fill)
    - Today marker: orange dot
```

### Weekly Email Data Flow

```
send-weekly-report Edge Function (MODIFIED)
    ↓
For each student, add one additional query:
    SELECT COUNT(*) FROM instrument_practice_log
    WHERE student_id = $1
    AND practice_date >= $2  -- sevenDaysAgo
    ↓
Pass practice_days_logged to generateWeeklyReportHTML()
    ↓
Email shows new row: "🎹 Days Practiced at Home: 4/7 days"
    (distinct from existing "Days in App" row which comes from students_score)
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current approach is fine. `instrument_practice_log` rows grow at 1/day max per student. |
| 1k-10k users | Add index on `(student_id, practice_date DESC)` for calendar queries. Already planned. |
| 10k+ users | Calendar query (365 rows per student) is negligible. The send-practice-check-push loop is O(n students). Consider batching or pg_cron parallelism if >10k push subscriptions. |

### Scaling Priorities

1. **First bottleneck:** `send-practice-check-push` loop making 3 DB queries per student.
   Mitigation: consolidate into a single JOIN query like `send-daily-push` already does.
2. **Second bottleneck:** Calendar heatmap fetching 365 rows. At scale, a date-aggregation
   function on the DB (returning an array of practiced dates) is more efficient than
   returning individual row objects.

---

## Anti-Patterns

### Anti-Pattern 1: Merging Instrument Streak Into `current_streak`

**What people do:** Add `instrument_streak_count`, `instrument_last_practiced` columns to
the existing `current_streak` table to avoid a new migration.

**Why it's wrong:** `current_streak` is already queried on every Dashboard render and
every app-usage event. Adding instrument-practice columns conflates two distinct concepts.
The weekend pass logic in `streakService.js` would need to be branched for each streak type.
Debugging "why did my streak break?" becomes ambiguous.

**Do this instead:** New `instrument_practice_streak` table with the same student_id PRIMARY KEY
pattern. Two clean rows for one student = one per streak type.

### Anti-Pattern 2: Making Direct Supabase Calls From Service Worker notificationclick

**What people do:** Import `supabase-js` into `sw.js`, create a client with the anon key,
and call `supabase.from('instrument_practice_log').insert(...)` directly.

**Why it's wrong:** The service worker has no user session. `auth.uid()` returns NULL in
that context, so RLS blocks the INSERT. Storing the JWT in IndexedDB within the SW scope
creates session persistence security risks (violates the existing security guidelines that
say "Auth endpoints must NEVER be cached").

**Do this instead:** postMessage to the React app window, which has a valid authenticated
session, or open a new window with a URL parameter that triggers the log on mount.

### Anti-Pattern 3: Reusing `last_practiced_date` Table For Instrument Practice

**What people do:** Store instrument practice in the existing `last_practiced_date` table
(which tracks app-usage practice) to avoid a migration.

**Why it's wrong:** `last_practiced_date.practiced_at` is an ISO timestamp updated by
`streakService.updateStreak()` on every game session. Overloading it with instrument practice
logs destroys the existing streak semantics. The `streakService.getLastPracticeDate()` function
reads from that table and expects it to reflect app game sessions only.

**Do this instead:** New `instrument_practice_log` table with a `practice_date` DATE column
(not timestamp — instrument practice is a daily yes/no, not a session timestamp).

### Anti-Pattern 4: Fetching 365 Rows On Every Dashboard Render

**What people do:** Add the calendar heatmap to the main student Dashboard and fetch history
on every Dashboard mount.

**Why it's wrong:** The Dashboard already makes 6+ parallel queries (streak, goals, XP, weekly
summary, next node, push subscription). Adding a 365-row history fetch increases the mount
waterfall with data only parents care about.

**Do this instead:** Calendar heatmap lives in `/parent-portal` only. The student Dashboard
shows only the `instrument_practice_streak` row (2 columns — cheap). History is parent-only.

---

## Integration Points

### Existing Services That Must Stay Unchanged

| Service | Why Unchanged |
|---------|---------------|
| `streakService.js` | App-usage streak completely independent of instrument practice |
| `streakService.updateStreak()` | Called by game VictoryScreen — no instrument practice involved |
| `awardXP()` in `xpSystem.js` | Reused as-is for practice log XP award |
| `send-daily-push` Edge Function | Unchanged — separate "practice reminder" vs "did you practice?" |

### Modified Integration Points

| Component/Service | Change Required |
|-------------------|----------------|
| `public/sw.js` | Add `did-you-practice` notification type handler (new `if` block in `notificationclick`) |
| `send-weekly-report` Edge Function | Add one extra query + one email row for `practice_days_logged` |
| `Dashboard.jsx` | Import + render new `PracticeLogCard` in the card grid |
| `UnifiedStatsCard.jsx` (optional) | Surface `instrumentStreakCount` prop alongside app streak |
| `/parent-portal` page | Add `ParentHeatmapCard` section containing `PracticeCalendarHeatmap` |

### External Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| SW notificationclick → React app | postMessage (window messaging) | Standard Web API |
| React app → `instrument_practice_log` | supabase-js REST via RLS | auth.uid() = student_id |
| `send-practice-check-push` → DB | service_role client | Bypasses RLS intentionally |
| `send-practice-check-push` → VAPID | VAPID push (same @negrel/webpush pattern) | Copy from send-daily-push |

---

## Build Order Recommendation

Dependencies drive this order:

1. **Migration first** — `instrument_practice_log` + `instrument_practice_streak` tables with RLS.
   Nothing else can be built until the tables exist.

2. **`practiceLogService.js`** — Core service used by all subsequent components. Build and
   unit-test in isolation (Vitest, no DOM required).

3. **`PracticeLogCard.jsx`** — Dashboard card with manual log button. Integration testable
   with the service in place.

4. **`Dashboard.jsx` integration** — Import PracticeLogCard into the existing card grid.
   Confirm it renders without breaking existing queries.

5. **Service worker modifications** — Add `did-you-practice` notificationclick handler
   (postMessage + URL param fallback). Can be done in parallel with step 3-4.

6. **`send-practice-check-push` Edge Function** — New cron-triggered push function. Requires
   VAPID config (already exists), instrument_practice_log table (step 1), and push_subscriptions
   table (already exists).

7. **`PracticeCalendarHeatmap.jsx` + parent portal integration** — SVG heatmap component +
   parent portal page section. Depends on `getPracticeCalendar()` from step 2.

8. **`send-weekly-report` modification** — Add practice_days_logged query + email section.
   Low risk isolated change; can be done at any point after step 1.

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `instrument_practice_streak` table | Clean boundary; different semantics from app-usage streak |
| postMessage (not SW fetch) for notification action | No auth token in SW scope; consistent with security guidelines |
| URL param fallback when no window open | Notification action must work even if app is closed |
| Append-only log with UNIQUE constraint | Idempotency for double-tap; full audit trail for parent heatmap |
| Bespoke SVG heatmap (no npm package) | Binary data model; design system integration; 0kb extra deps |
| 25 XP for practice log | Between daily_streak (25) and basic node completion (50); feels fair |
| `practice_date` as DATE not TIMESTAMPTZ | Instrument practice is a daily yes/no; local date semantics |
| New Edge Function `send-practice-check-push` | Separate from `send-daily-push`; different trigger logic and content |
| Retroactive log for yesterday only | Cap complexity; prevents gaming the streak with old dates |
| iOS notification action graceful fallback | iOS Safari does not support action buttons at all; dashboard card is primary path |

---

## Sources

- MDN: [ServiceWorkerGlobalScope: notificationclick event](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event) — MEDIUM confidence (action buttons have limited cross-browser support; iOS has no support)
- Chrome Developers: [Notification Actions in Chrome 48](https://developer.chrome.com/blog/notification-actions) — action button baseline support established
- [PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — iOS push works but action buttons NOT supported on iOS
- Direct codebase inspection: `streakService.js`, `public/sw.js`, `supabase/migrations/`, `send-daily-push/index.ts`, `send-weekly-report/index.ts`, `Dashboard.jsx` — HIGH confidence
- [react-activity-calendar](https://github.com/grubersjoe/react-activity-calendar) and [@uiw/react-heat-map](https://github.com/uiwjs/react-heat-map) — surveyed as alternatives, rejected in favor of bespoke SVG

---
*Architecture research for: Instrument Practice Tracking integration (v2.7)*
*Researched: 2026-03-23*
