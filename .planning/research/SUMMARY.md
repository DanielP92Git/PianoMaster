# Project Research Summary

**Project:** PianoApp2 — v2.7 Instrument Practice Tracking
**Domain:** Gamified habit tracking layer for children's piano learning PWA
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

Milestone v2.7 adds a distinct instrument practice tracking system running parallel to the existing app-usage streak. The core distinction is behavioral: the existing streak measures in-app game activity, while the new system measures whether the child actually practiced their instrument at home. Every major competitor (Modacity, Tonara, Simply Piano, Duolingo) conflates "used the app" with "practiced" — this milestone closes that gap, which is the primary differentiator. The recommended approach is a minimal data model (two new tables, one new Edge Function, one existing function extended) built entirely on established codebase patterns. One new npm package (`react-activity-calendar@^3.1.1`) handles the parent calendar heatmap; all other UI and logic follows patterns already in production.

The critical architectural decision is separating all instrument practice data from the existing `current_streak` system. This is non-negotiable: merging them would entangle two distinct behavioral domains and make both streak systems harder to reason about and test. The notification architecture is similarly constrained — iOS Safari does not render custom notification action buttons at all, so the app-open URL-param fallback is the primary design path and action buttons are a Chrome/Android enhancement only. The service worker must never attempt direct Supabase calls due to the absence of an auth session in SW scope; the postMessage-to-React-app pattern is the correct and secure approach.

The seven critical pitfalls identified (iOS action button silence, duplicate notifications, indistinguishable streak UIs, timezone mismatch, XP double-award, retroactive log abuse, COPPA cascade gap) all have clear prevention strategies rooted in the codebase's existing conventions. Five of the seven must be addressed in Phase 1 at the database and Edge Function architecture level — they cannot be retrofitted cheaply after launch. The two remaining (heatmap accessibility, weekly email differentiation) belong to later phases and carry lower recovery costs if they slip.

---

## Key Findings

### Recommended Stack

The milestone adds exactly one new npm package and two to three new database tables. All other capabilities (XP system, push notifications, streak logic, glassmorphism UI, weekly email) are already in production and require no new dependencies.

**Core technologies:**
- `react-activity-calendar@^3.1.1` (new): GitHub-style calendar heatmap for the parent portal. Selected over `react-calendar-heatmap` (abandoned since 2022) and `@uiw/react-heat-map` (weaker dark mode API). Active maintenance, v3.1.1 released March 2026, React 18 peer dep only, named import `{ ActivityCalendar }`. Note: ARCHITECTURE.md argues for a bespoke SVG heatmap (~100 lines); STACK.md argues for the library to avoid date-math edge cases. Both are defensible — the library is the lower-risk choice for the parent-facing view where accuracy on edge cases (leap years, 53-week years, locale week starts) matters.
- `supabase-js` (existing): `instrument_practice_logs` table (one row per student per day, UNIQUE constraint on `(student_id, practiced_on)`), `instrument_practice_streak` table (mirrors `current_streak` structure). RLS policies follow established codebase patterns.
- `@negrel/webpush` in Edge Functions (existing): New `send-practice-checkin-push` cron function reuses the VAPID push pattern verbatim from `send-daily-push`. OR extend `send-daily-push` with a new message priority tier to prevent duplicate notifications (see Pitfalls — this is the preferred architecture).
- TanStack React Query v5 (existing): New query keys `["instrument-practice-today", userId]`, `["instrument-practice-streak", userId]`, `["instrument-practice-calendar", userId, year]`; invalidated after each log write.
- `framer-motion`, `react-hot-toast`, `lucide-react` (existing): Log confirmation animation, XP toast, streak icons — no new packages.

**Explicitly avoided:**
- `date-fns` / `dayjs` — inline date formatting matches existing `streakService.js` pattern.
- Supabase calls from service worker — auth session unavailable; use postMessage or URL param fallback.
- Columns added to `current_streak` — instrument streak must live in its own table.

### Expected Features

**Must have (table stakes — v2.7 core):**
- `instrument_practice_logs` DB table with RLS — root dependency for all other features.
- Daily yes/no practice log button on dashboard — primary logging surface, three states: logged / not-yet / loading.
- Dedicated practice streak counter on dashboard — separate from app-usage streak, distinct icon (piano/music note, not fire).
- XP reward for daily practice log — 25 XP via existing `award_xp()`, once per day, idempotency via UNIQUE constraint.
- Weekend freeze for practice streak — reuse `weekend_pass_enabled` flag from existing streak system.
- Parent calendar heatmap in parent portal — 52-week rolling window, indigo/gray color scheme (no red for missed days).
- Practice summary in weekly parent email — extend `send-weekly-report` Edge Function with a distinct `instrumentDaysPracticed` stat.
- "Did you practice today?" push notification — new cron trigger, separate from app-usage reminder, coordinated to prevent dual notifications on same day.

**Should have (differentiators — v2.7.x after validation):**
- Interactive push notification action buttons ("Yes, I practiced!" / "Not yet") — Chrome/Android enhancement; iOS fallback (tap-to-app with `?log_practice=1`) is the primary path.
- Retroactive yesterday-only logging — grace feature capped at 24 hours, enforced at RLS layer not just UI.
- Practice milestone celebrations (5, 10, 21, 30 days) — reuse existing VictoryScreen milestone system.
- Practice card on dashboard with distinct icon (dedicated "Home Practice" card, visually separated from app streak).

**Defer to v3+:**
- Teacher view of all students' practice heatmaps.
- Duration logging (minutes) — adult feature, adds friction for 8-year-olds.
- Mic-verified practice detection (COPPA risk, complexity).
- Streak repair / XP buy-back (no spendable XP economy yet).
- Social practice leaderboards (COPPA prohibition on social comparison without parental consent).

**Anti-features (confirmed not to build):**
- Quality rating (1-5 stars) — developmentally inappropriate for 8-year-olds.
- Push notification reply text input — unsupported on iOS, COPPA data burden.
- Notification frequency escalation — uninstall trigger for parents.
- Never-breaking streak (removes the motivating signal).

### Architecture Approach

The architecture is additive and isolated: a new `practiceLogService.js` (standalone, mirrors `streakService.js` structure), two new database tables, one new Edge Function, one modified Edge Function, one modified service worker branch, and two new UI components. Nothing in the existing streak, XP, or game systems changes. The notification action flow uses postMessage from the service worker to the React app window (which holds the valid Supabase session), with URL param fallback when no window is open. The heatmap lives exclusively in `/parent-portal` — not on the student dashboard — to avoid adding a 365-row history query to the already query-heavy dashboard mount.

**Major components:**
1. `practiceLogService.js` — logPractice(), getPracticeState(), getPracticeCalendar(); standalone, not merged into streakService.
2. `PracticeLogCard.jsx` — Dashboard card showing today's status, log button, practice streak count. Distinct visual identity from app-usage streak card.
3. `PracticeCalendarHeatmap.jsx` — SVG or `react-activity-calendar`-based heatmap in parent portal only; 52-week window; binary coloring (practiced / not yet).
4. `instrument_practice_logs` table — append-only, UNIQUE(student_id, practiced_on), `local_date DATE` column (not UTC timestamp derivation) to prevent timezone mismatch.
5. `instrument_practice_streak` table — separate from `current_streak`; mirrors its structure for weekend pass compatibility.
6. `send-practice-checkin-push` Edge Function (or extended `send-daily-push`) — cron-triggered, skips already-logged students, enforces one-notification-per-student-per-day.
7. `send-weekly-report` modification — adds `instrumentDaysPracticed` stat row distinct from existing game-session days row.
8. `public/sw.js` modification — new `practice-checkin` notification tag branch in notificationclick handler; postMessage path + URL param fallback; iOS graceful degradation.

**Build order (driven by dependencies):**
1. Migration (tables + RLS) — blocks everything else.
2. `practiceLogService.js` — blocks all UI and notification components.
3. `PracticeLogCard.jsx` + dashboard integration.
4. Service worker modification.
5. `send-practice-checkin-push` Edge Function.
6. `PracticeCalendarHeatmap.jsx` + parent portal integration.
7. `send-weekly-report` modification.

### Critical Pitfalls

1. **iOS PWA silently drops notification action buttons** — Design with the fallback as the primary path. The notification body tap (no action, `event.action === ''`) must navigate to `/?practice_checkin=1`. The dashboard detects this param on mount and presents an immediate yes/no prompt. Action buttons are an Android-only enhancement, not the baseline.

2. **Two push notifications reach the same child on the same day** — Either extend `send-daily-push` to include practice check-in as its highest-priority message tier (one notification, one cron, one `last_notified_at` write), or add a `last_practice_notified_at` column and enforce total-notifications-per-day <= 1 across all types. This architecture decision must be made before any notification code is written.

3. **Timezone mismatch breaks "practiced today" logic** — Store both `logged_at TIMESTAMPTZ` (UTC) and `local_date DATE` (client-sent YYYY-MM-DD in user's local timezone) in the practice log table. Edge Functions and weekly report query `local_date` exclusively. Never derive local date from a UTC timestamp split on the server. This is a Phase 1 schema decision that cannot be backfilled accurately.

4. **XP awarded twice on double-tap or retry** — Use the UNIQUE constraint on `(student_id, practiced_on)` with `ignoreDuplicates: true` upsert. Award XP only when `count === 1` (first insert, not duplicate). Never call `award_xp()` unconditionally.

5. **COPPA hard-delete does not cascade to new tables** — Add `REFERENCES students(id) ON DELETE CASCADE` to both new tables' FK constraints. Also add explicit DELETE statements to the deletion Edge Function as an auditable belt-and-suspenders. Both must be in the initial migration — cannot be remediated after the April 2026 COPPA compliance deadline.

6. **Retroactive log abuse (backdating streak inflation)** — Add a date-range constraint to the RLS INSERT policy: `AND local_date >= CURRENT_DATE - INTERVAL '1 day' AND local_date <= CURRENT_DATE`. UI-only enforcement is insufficient.

7. **Two streak counters are visually indistinguishable** — Use a piano/music note icon (not the existing fire icon) for the instrument streak. The instrument streak lives in its own dedicated card. Do not render both in the same card with the same icon. Do not show a "0 day streak" counter on first visit — show a call-to-action card until at least one practice is logged.

---

## Implications for Roadmap

Based on combined research, the natural phase structure follows strict dependency order: schema first (everything depends on it), core logging service and UI second, notifications third, parent-facing features fourth.

### Phase 1: Data Foundation and Core Logging

**Rationale:** The practice log table is the root dependency for every other feature. Timezone correctness, COPPA cascade, RLS date enforcement, and XP idempotency are all structural decisions that must be made here — they cannot be cheaply retrofitted. Nothing else can be meaningfully developed until the table and service exist.

**Delivers:** Database migration with both new tables and correct RLS policies; `practiceLogService.js` with logPractice(), getPracticeState(), and idempotent XP award; `PracticeLogCard.jsx` on the dashboard with today's status and log button; practice streak counter on dashboard with distinct visual identity.

**Addresses:** practice_logs DB table, dashboard log button, practice streak counter, XP reward, weekend freeze.

**Avoids (critical):** Timezone mismatch (local_date column), XP double-award (UNIQUE constraint + conditional award), COPPA hard-delete gap (ON DELETE CASCADE in migration), retroactive log abuse (RLS date constraint), streak table conflation (separate new table).

**Research flag:** Standard patterns — no additional research needed. All patterns verified against live codebase.

---

### Phase 2: Push Notification Integration

**Rationale:** Notifications depend on Phase 1 (need the practice log table for skip-if-already-practiced logic). Notification architecture must be decided before writing any notification code. This phase has the highest platform complexity due to iOS limitations.

**Delivers:** "Did you practice today?" push notification (cron-triggered, skips students who already logged, respects one-notification-per-day limit); service worker `notificationclick` handler extended with `practice-checkin` tag; iOS fallback via `/?practice_checkin=1` URL param; dashboard `useEffect` detecting the URL param and surfacing the log prompt.

**Addresses:** "Did you practice?" push notification, interactive action buttons (Android enhancement), notification deduplication.

**Avoids (critical):** iOS action button silence (fallback as primary path), dual notification on same day (extend send-daily-push OR add per-type last_notified_at coordination).

**Research flag:** Notification architecture decision (extend `send-daily-push` vs. new independent cron function) must be an explicit ADR in this phase's spec. PITFALLS.md recommends extending the existing function to share `last_notified_at`; STACK.md recommends a new separate function. These are reconcilable but the choice must be recorded before implementation starts.

---

### Phase 3: Parent Calendar Heatmap

**Rationale:** Parent-facing features can be deferred until the core student-facing loop (log + streak + XP + notification) is working and validated. The heatmap is the highest-value parent deliverable of this milestone. Keeping it in its own phase prevents the history query from being added to the dashboard mount waterfall.

**Delivers:** `PracticeCalendarHeatmap.jsx` component in `/parent-portal`; 52-week rolling window; indigo/gray binary color scheme; RTL support for Hebrew locale; accessibility (color not the sole signal, icon for practiced days).

**Addresses:** Parent calendar heatmap, heatmap in parent portal, RTL direction, colorblind accessibility.

**Avoids:** Color-only encoding (WCAG 1.4.1 violation), RTL heatmap direction reversal (most recent week rightmost in Hebrew mode), fetching history on every dashboard mount.

**Research flag:** Library vs. bespoke SVG decision should be recorded as an explicit ADR. Recommendation: use `react-activity-calendar` for date-math correctness on edge cases (leap years, week-start locale, 53-week years). If glassmorphism CSS integration requires heavy overrides, bespoke SVG (~100 lines) is the fallback.

---

### Phase 4: Weekly Email Integration and Polish

**Rationale:** Lowest coupling — extends an existing Edge Function with one additional DB query and one additional email stat row. Can be done at any point after Phase 1. P2 features (milestone celebrations, retroactive yesterday logging) fit here as incremental additions to the working system.

**Delivers:** `send-weekly-report` modified with a distinct `instrumentDaysPracticed` stat row (separate from existing game-session days row); practice milestone celebrations (5, 10, 21, 30 day triggers via existing VictoryScreen system); retroactive yesterday-only logging with RLS enforcement.

**Addresses:** Practice summary in weekly email, milestone celebrations, retroactive logging.

**Avoids:** Weekly email conflating two "days practiced" metrics (distinct labels required), milestone XP overclaim (award XP only on first log of each milestone day).

**Research flag:** Standard patterns. Weekly email extension is low risk and directly precedented in the codebase.

---

### Phase Ordering Rationale

- **Schema-first ordering is mandatory:** Every UI component, Edge Function, and notification flow depends on `instrument_practice_logs` and `instrument_practice_streak` existing with correct constraints and RLS.
- **Core student loop before parent features:** Parents subscribe to see the child's engagement. An empty or broken heatmap because the logging flow isn't solid yet is worse than delaying the heatmap.
- **Notifications in Phase 2, not Phase 1:** The notification architecture decision (extend vs. new cron) requires the schema to exist first so skip-logic can be verified. Decoupling it from Phase 1 also reduces the blast radius if the iOS fallback requires iteration.
- **Email and polish last:** Lowest regression risk, highest independence from other phases. Retroactive logging is a P2 feature — the core practice tracking must work before introducing that UX complexity.

---

### Research Flags

Phases needing additional decisions before implementation:

- **Phase 2:** Notification architecture decision (extend `send-daily-push` vs. new cron + shared deduplication) must be explicit in the phase spec before writing any Edge Function code.
- **Phase 3:** Library vs. bespoke SVG heatmap decision should be recorded as an ADR in the phase spec.

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 1:** All patterns mirror existing codebase code directly. Confidence HIGH.
- **Phase 4:** Weekly email extension follows the exact same pattern as existing `send-weekly-report` additions. VictoryScreen milestone system is already implemented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | One new package verified against GitHub releases and README. All other stack decisions derived from existing production codebase via direct file inspection. |
| Features | MEDIUM-HIGH | Table stakes and anti-features grounded in competitor analysis and child psychology sources. P2 features have clear implementation paths but require iOS device testing to validate the action button fallback. |
| Architecture | HIGH | All architectural decisions verified against live codebase (streakService.js, sw.js, send-daily-push, send-weekly-report, current_streak schema). Anti-patterns identified from direct codebase inspection. |
| Pitfalls | HIGH | Seven critical pitfalls have codebase-verified prevention strategies. iOS action button limitation confirmed via Apple Developer Forums and multiple independent developer sources. COPPA compliance risk tied to April 2026 deadline. |

**Overall confidence:** HIGH

### Gaps to Address

- **Notification architecture decision:** STACK.md and PITFALLS.md give slightly different recommendations (new Edge Function vs. extending existing). The Phase 2 spec must resolve this with an explicit ADR.
- **Heatmap library vs. bespoke SVG:** STACK.md recommends `react-activity-calendar`; ARCHITECTURE.md recommends bespoke SVG. Library recommended here for date-math reliability. If glassmorphism CSS integration proves painful, bespoke SVG is the fallback.
- **iOS action button behavior in 2026:** iOS 18.4 Declarative Web Push (in beta March 2026) does not add action button support. Fallback-first design remains correct. If Apple ships action button support in a future release, the Chrome/Android enhancement path already in place will cover it.
- **XP amount for practice log (25 XP proposed):** Review against existing XP economy before finalizing. Goal is meaningful without being more rewarding than trail node completion (50-150 XP).

---

## Sources

### Primary (HIGH confidence)
- `C:/Development/PianoApp2/src/services/streakService.js` — streak service pattern verified
- `C:/Development/PianoApp2/public/sw.js` — push/notificationclick handler structure verified
- `C:/Development/PianoApp2/supabase/functions/send-daily-push/index.ts` — cron pattern, VAPID, skip logic verified
- `C:/Development/PianoApp2/supabase/functions/send-weekly-report/index.ts` — email extension pattern verified
- MDN: ServiceWorkerRegistration.showNotification() — actions array structure confirmed
- MDN: NotificationEvent.action — event.action property confirmed
- web.dev: Push Notifications Notification Behavior — notificationclick patterns confirmed
- W3C WCAG 2.1 Understanding 1.4.1 Use of Color — accessibility requirement confirmed
- react-activity-calendar README (official repo) — data format `{ date, count, level }`, named import, props verified

### Secondary (MEDIUM confidence)
- Apple Developer Forums thread 726793 — iOS action button support status (silently dropped)
- WebVentures: Web Push iOS One Year Anniversary 2024 — real-world iOS push limitations
- MagicBell: PWA iOS Limitations and Safari Support 2026 — iOS action button not supported confirmed
- react-activity-calendar GitHub Releases — v3.1.1 published March 2026 confirmed
- Duolingo blog: How Duolingo streak builds habit — streak psychology and milestone design
- caniuse.com Notification.maxActions — no Safari/iOS support confirmed
- Appbot: Push Notification Best Practices 2026 — dual-notification uninstall risk rates
- Reteno: Push Notification Best Practices 2026 — notification frequency guidance

### Tertiary (MEDIUM-LOW confidence)
- Child psychology / habit formation sources — 8-year-old milestone preferences (5/10/21/30 days), positive framing, no-red-for-missed-days recommendation
- COPPA 2025 amended rule sources — April 2026 compliance deadline, behavioral log data retention requirements

---

*Research completed: 2026-03-23*
*Ready for roadmap: yes*
