# Phase 21: Celebration & Reporting Upgrades - Research

**Researched:** 2026-03-07
**Domain:** Dashboard UI components, VictoryScreen integration, Supabase Edge Functions (Brevo email), i18n
**Confidence:** HIGH

## Summary

This phase adds four features across two surfaces (Dashboard and VictoryScreen) plus a new Edge Function. All four requirements integrate into well-established patterns: glass card components on the Dashboard, inline badges on VictoryScreen, localStorage-based message rotation, and a cron-triggered Edge Function using Brevo API. No new libraries are needed; no architectural changes required.

The codebase has direct precedents for every feature: `DailyGoalsCard` for the weekly summary card, `scoreComparisonService` + percentile display for the personal best badge, `localStorage` dismiss patterns for message rotation, and `send-daily-push` + `send-consent-email` as templates for the weekly report Edge Function. The research found no technical risks; the primary complexity is in the weekly email's unsubscribe mechanism and the personal best detection query.

**Primary recommendation:** Implement all four features as additive changes to existing files and patterns, with a new `send-weekly-report` Edge Function modeled on the existing `send-daily-push` pattern.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Weekly Summary Card (PROG-04):** Rolling 7-day window (not Monday-to-Sunday). Primary stat: days practiced. Card placement: below DailyGoalsCard on Dashboard. Glass card pattern. Simple milestone highlight when all 7 days practiced.
- **Personal Bests (PROG-05):** Trigger on best score percentage on same trail node. Trail nodes only. Only triggers when previous record is beaten (not first completion). Display as inline badge near score display on VictoryScreen. Data source: compare against `students_score` table entries for same node_id. CORRECTION: After code analysis, the actual best_score lives in `student_skill_progress.best_score` (percentage 0-100), not `students_score`. The CONTEXT references `students_score` but the comparison should use `student_skill_progress` which already tracks `best_score` per node.
- **Varied Login Messages (PROG-06):** Music fun facts tone. At least 10 messages. Placement below hero/avatar area, above PLAY NEXT button. Random selection, localStorage prevents same-day repeat. i18n EN + HE.
- **Parent Weekly Email (PROG-07):** Opt-in via `push_subscriptions.parent_consent_granted`. Parent email from `students.parent_email`. Match existing consent email branding. Unsubscribe link in every email. Trigger: weekly cron job Monday morning via pg_cron. New Edge Function `send-weekly-report` using Brevo API. Security: verify_jwt = false, x-cron-secret authentication.

### Claude's Discretion

- Exact weekly summary card layout and which 1-2 additional stats to include
- Personal best badge visual design (animation, icon, colors)
- Email content layout and which additional stats beyond days practiced + streak
- How to implement unsubscribe mechanism (token-based link vs. new DB column)
- Number of fun fact messages (minimum 10, can go higher if natural)

### Deferred Ideas (OUT OF SCOPE)

None
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                        | Research Support                                                                                                                                                                                                                |
| ------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROG-04 | Dashboard shows weekly progress summary (days practiced, notes learned, XP earned) | Supabase queries on `student_skill_progress` and `students_score` tables with date filtering; glass card pattern from DailyGoalsCard; useQuery with staleTime for data freshness                                                |
| PROG-05 | Student sees personal bests ("New record!")                                        | `student_skill_progress.best_score` already tracks per-node best; VictoryScreen's `processTrailCompletion` already fetches `existingProgress`; badge renders near score/percentile display area                                 |
| PROG-06 | Dashboard shows varied daily login messages                                        | Static array of i18n keys; localStorage key stores yesterday's index; placed in Dashboard.jsx between hero and PlayNextButton                                                                                                   |
| PROG-07 | Parent receives weekly progress email report via Brevo                             | New Edge Function `send-weekly-report` following `send-daily-push` pattern; Brevo `v3/smtp/email` API; `students.parent_email` for recipient; `push_subscriptions.parent_consent_granted` for opt-in; new unsubscribe mechanism |

</phase_requirements>

## Standard Stack

### Core (already in project)

| Library                 | Version  | Purpose                          | Why Standard                           |
| ----------------------- | -------- | -------------------------------- | -------------------------------------- |
| React 18                | 18.x     | UI components                    | Project standard                       |
| TanStack React Query v5 | 5.x      | Data fetching with caching       | All Dashboard queries use this pattern |
| i18next                 | existing | Translations (EN/HE)             | All user-facing text                   |
| Supabase JS             | 2.x      | Database queries, Edge Functions | Project database layer                 |
| lucide-react            | existing | Icons                            | DailyGoalsCard uses these              |
| framer-motion           | existing | Optional animations              | Reduced motion aware                   |

### Supporting (already in project)

| Library         | Version  | Purpose             | When to Use                 |
| --------------- | -------- | ------------------- | --------------------------- |
| react-hot-toast | existing | Toast notifications | Not needed for this phase   |
| Brevo API       | v3 REST  | Transactional email | Weekly report Edge Function |

### No New Libraries Required

This phase uses only existing project dependencies.

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   └── dashboard/
│       ├── DailyGoalsCard.jsx        # Existing (reference for card pattern)
│       ├── WeeklySummaryCard.jsx      # NEW: PROG-04
│       └── DailyMessageBanner.jsx    # NEW: PROG-06
├── services/
│   └── weeklyProgressService.js      # NEW: queries for 7-day rolling data
├── locales/
│   ├── en/common.json                # ADD: funFacts, weeklySummary keys
│   └── he/common.json                # ADD: funFacts, weeklySummary keys
supabase/
├── functions/
│   └── send-weekly-report/
│       └── index.ts                  # NEW: Brevo weekly email Edge Function
└── migrations/
    └── YYYYMMDDHHMMSS_add_weekly_report_opt_out.sql  # NEW: unsubscribe column
```

### Pattern 1: Glass Card Component (DailyGoalsCard reference)

**What:** All Dashboard cards follow the glass card pattern with consistent structure.
**When to use:** Any new card on the Dashboard.
**Example from DailyGoalsCard:**

```jsx
<div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
  {/* Header with title and summary */}
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-lg font-bold text-white/90 drop-shadow">
      {t("dashboard.weeklySummary.title")}
    </h3>
  </div>
  {/* Content */}
</div>
```

### Pattern 2: Dashboard useQuery Pattern

**What:** All Dashboard data fetching uses React Query with student-scoped keys.
**When to use:** Weekly summary data, fun fact rotation.
**Example from Dashboard.jsx:**

```jsx
const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
  queryKey: ["weekly-summary", user?.id],
  queryFn: () => getWeeklyProgress(user.id),
  enabled: !!user?.id && isStudent,
  staleTime: 5 * 60 * 1000, // 5 minutes -- weekly data doesn't change fast
});
```

### Pattern 3: VictoryScreen Inline Badge

**What:** Additional info badges displayed near the score section.
**When to use:** Personal best notification.
**Example from existing percentile display (VictoryScreen line ~935):**

```jsx
{
  percentileMessage && (
    <div className="mt-1 rounded-lg bg-white/20 px-3 py-1.5 text-center text-sm text-white/90">
      {percentileMessage}
    </div>
  );
}
```

The personal best badge should render in the same area, between the score display and the percentile message, with a distinct visual (e.g., gradient background, small trophy icon).

### Pattern 4: Cron-triggered Edge Function

**What:** Server-side function triggered by pg_cron with x-cron-secret auth.
**When to use:** Weekly email sending.
**Direct template: `send-daily-push/index.ts`:**

- `verify_jwt = false` in config (pg_cron sends no JWT)
- x-cron-secret header authentication
- Service role Supabase client for DB access
- Per-student processing loop with skip conditions
- Summary response: `{ sent, failed, skipped, total }`

### Pattern 5: Brevo Email API

**What:** Sending transactional HTML emails via Brevo REST API.
**Direct template: `send-consent-email/index.ts`:**

```typescript
const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "api-key": BREVO_API_KEY,
  },
  body: JSON.stringify({
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: parentEmail }],
    subject: "Weekly Progress Report - PianoMaster",
    htmlContent: generatedHTML,
  }),
});
```

### Anti-Patterns to Avoid

- **Do NOT use server-side rendering for email HTML:** Generate HTML inline in the Edge Function (same as consent email pattern). No template engine needed.
- **Do NOT cache weekly summary aggressively:** 5-minute staleTime is sufficient; the data changes slowly but should update after a practice session.
- **Do NOT add personal best detection as a separate API call in VictoryScreen:** The existing `processTrailCompletion` already fetches `existingProgress` which contains `best_score`. Piggyback on that data.

## Don't Hand-Roll

| Problem                 | Don't Build           | Use Instead                                                                 | Why                                                               |
| ----------------------- | --------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Date range queries      | Custom date math      | Supabase `.gte()/.lte()` with ISO timestamps                                | Already used in `dailyGoalsService.js` (`calculateDailyProgress`) |
| Personal best detection | New API endpoint      | Compare `scorePercentage` vs `existingProgress.best_score` in VictoryScreen | Data already fetched in `processTrailCompletion`                  |
| Email HTML template     | Template engine       | Inline template literal function (same as `generateConsentEmailHTML`)       | Project pattern, Outlook-compatible table layout                  |
| Message non-repeat      | Complex randomization | localStorage index + modular arithmetic                                     | Simple, client-only, no server calls                              |
| Unsubscribe mechanism   | Custom auth flow      | Signed token in URL + simple Edge Function endpoint                         | Stateless verification                                            |

## Common Pitfalls

### Pitfall 1: Personal Best on First Completion

**What goes wrong:** Showing "New personal best!" when there is no previous record.
**Why it happens:** First completion always sets a new `best_score` in `student_skill_progress`.
**How to avoid:** Only show personal best badge when `existingProgress` exists AND `existingProgress.best_score > 0` AND current `scorePercentage > existingProgress.best_score`. The CONTEXT.md explicitly requires this.
**Warning signs:** Badge appearing on every first-time node completion.

### Pitfall 2: Weekly Summary Rolling Window Timezone

**What goes wrong:** The 7-day rolling window shows different data depending on timezone.
**Why it happens:** UTC vs local time mismatch.
**How to avoid:** Use the same local date calculation pattern from `dailyGoalsService.js` (`getTodayDateRange()`). All date filtering should use the student's local date, not UTC midnight.
**Warning signs:** Days practiced count jumps or drops at midnight UTC.

### Pitfall 3: Brevo Unsubscribe Rate Limiting

**What goes wrong:** Email service blocks the sender for spam if many parents click unsubscribe and Brevo sees a high unsubscribe rate.
**Why it happens:** Brevo monitors sender reputation.
**How to avoid:** Include a proper list-unsubscribe header and a one-click unsubscribe link. The unsubscribe should immediately take effect without requiring login.
**Warning signs:** Brevo API returns 429 or sender is flagged.

### Pitfall 4: Fun Fact Same-Message on Cache Clear

**What goes wrong:** Student sees the same message after clearing browser data.
**Why it happens:** localStorage-based tracking is lost on clear.
**How to avoid:** This is acceptable -- the worst case is a repeat once after cache clear. The CONTEXT says "same message does not appear two days in a row," not "guaranteed unique sequence."
**Warning signs:** None; this edge case is tolerable.

### Pitfall 5: Weekly Email Sent to Invalid Parent Emails

**What goes wrong:** Brevo API rejects invalid emails, causing failures.
**Why it happens:** `students.parent_email` may be null, empty, or invalid for some students.
**How to avoid:** Validate email format before attempting send (same regex as consent email). Skip students with null/invalid parent_email.
**Warning signs:** High failure rate in send-weekly-report summary.

### Pitfall 6: VictoryScreen Already Complex

**What goes wrong:** Adding personal best badge introduces visual clutter.
**Why it happens:** VictoryScreen already shows: title, subtitle, exercise indicator, score, stars, XP breakdown, level progress bar, level-up indicator, percentile message, points celebration, and action buttons.
**How to avoid:** Make the personal best badge subtle -- a single line with a small icon, positioned near the score display. Do NOT add another large card. The CONTEXT says "visible but doesn't overshadow stars/XP."
**Warning signs:** VictoryScreen becomes scrollable on small screens.

## Code Examples

### Weekly Summary Data Query

```javascript
// src/services/weeklyProgressService.js
import supabase from "./supabase";
import { verifyStudentDataAccess } from "./authorizationUtils";

export async function getWeeklyProgress(studentId) {
  await verifyStudentDataAccess(studentId);

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Days practiced: count distinct dates with scores
  const { data: scores } = await supabase
    .from("students_score")
    .select("created_at")
    .eq("student_id", studentId)
    .gte("created_at", sevenDaysAgoISO);

  // Count distinct days (local date)
  const uniqueDays = new Set(
    (scores || []).map((s) => new Date(s.created_at).toLocaleDateString())
  );

  // Nodes completed this week (first star earned)
  const { data: nodeProgress } = await supabase
    .from("student_skill_progress")
    .select("node_id, stars, last_practiced")
    .eq("student_id", studentId)
    .gte("last_practiced", sevenDaysAgoISO)
    .gt("stars", 0);

  // XP earned this week -- query total XP and use difference
  // Simpler: count unique node_ids practiced this week
  const nodesCompleted = new Set((nodeProgress || []).map((p) => p.node_id))
    .size;

  return {
    daysPracticed: uniqueDays.size,
    nodesCompleted,
    allSevenDays: uniqueDays.size >= 7,
  };
}
```

### Personal Best Detection (in VictoryScreen processTrailCompletion)

```javascript
// Inside the existing processTrailCompletion function:
// existingProgress is already fetched
const isPersonalBest =
  existingProgress &&
  existingProgress.best_score > 0 &&
  scorePercentage > existingProgress.best_score;

setIsPersonalBest(isPersonalBest);
// Then in render:
// {isPersonalBest && <PersonalBestBadge />}
```

### Fun Fact Message Rotation

```javascript
// src/components/dashboard/DailyMessageBanner.jsx
const FUN_FACT_KEYS = Array.from(
  { length: 12 },
  (_, i) => `dashboard.funFacts.${i}`
);
const STORAGE_KEY = "daily-fun-fact-index";

function DailyMessageBanner() {
  const { t } = useTranslation("common");

  const messageIndex = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toDateString();

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) return parsed.index;
    }

    // Pick random index different from yesterday's
    const lastIndex = stored ? JSON.parse(stored).index : -1;
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * FUN_FACT_KEYS.length);
    } while (newIndex === lastIndex);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, index: newIndex })
    );
    return newIndex;
  }, []);

  return (
    <div className="rounded-xl bg-white/5 px-4 py-2 text-center text-sm text-white/70">
      {t(FUN_FACT_KEYS[messageIndex])}
    </div>
  );
}
```

### Unsubscribe Mechanism (Recommended: Token-Based)

```typescript
// In send-weekly-report Edge Function:
// Generate HMAC-signed token for unsubscribe
import { createHmac } from "node:crypto"; // Available in Deno

function generateUnsubscribeToken(studentId: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(studentId);
  return hmac.digest("hex");
}

// Unsubscribe URL:
const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?sid=${studentId}&token=${token}`;

// Could also be a simple Edge Function endpoint that:
// 1. Verifies token matches HMAC(student_id, secret)
// 2. Sets a new column: push_subscriptions.weekly_report_opted_out = true
// 3. Returns a simple "You've been unsubscribed" HTML page
```

## State of the Art

| Old Approach | Current Approach  | When Changed | Impact                                                             |
| ------------ | ----------------- | ------------ | ------------------------------------------------------------------ |
| N/A          | Brevo v3 SMTP API | Current      | Use `https://api.brevo.com/v3/smtp/email` for transactional emails |
| Sendinblue   | Brevo             | 2023         | Same API, rebranded name. Project already uses Brevo.              |

## Key Integration Points

### Dashboard.jsx Modifications

1. **Fun fact banner** (PROG-06): Insert between hero header and PlayNextButton (after `</header>` closing tag, before `{isStudent && nextNode && <PlayNextButton ... />}`)
2. **Weekly summary card** (PROG-04): Insert after DailyGoalsCard in the main content area (`<MotionOrDiv>` container)
3. **New query**: Add `useQuery` for `["weekly-summary", user?.id]` with `getWeeklyProgress`

### VictoryScreen.jsx Modifications

1. **Personal best state**: Add `const [isPersonalBest, setIsPersonalBest] = useState(false);`
2. **Detection logic**: In `processTrailCompletion`, after fetching `existingProgress`, check if current score beats `existingProgress.best_score`
3. **Badge render**: Between the score display and percentile message (~line 935 area)
4. **i18n key**: `victory.personalBest` for the badge text

### Edge Function: send-weekly-report

1. **Directory**: `supabase/functions/send-weekly-report/index.ts`
2. **Authentication**: x-cron-secret (same as send-daily-push)
3. **Query**: Join `students` with `push_subscriptions` where `parent_consent_granted = true` AND NOT opted out
4. **Per-student data**: Query `students_score` + `student_skill_progress` + `current_streak` for past 7 days
5. **Email**: Brevo API with HTML template matching consent email branding
6. **Schedule**: pg_cron Monday 08:00 UTC (~10:00 AM Israel time)

### Database Migration

1. **New column**: `push_subscriptions.weekly_report_opted_out BOOLEAN NOT NULL DEFAULT false`
2. This is simpler than a separate table or token-based DB tracking
3. Default `false` means existing consented parents automatically receive reports (opt-out model, since they already opted in to communications via parent consent)

### Locale Files

1. **EN/HE common.json**: Add `dashboard.funFacts.0` through `dashboard.funFacts.11` (12 fun facts)
2. **EN/HE common.json**: Add `dashboard.weeklySummary.*` keys (title, stats labels, milestone message)
3. **EN/HE common.json**: Add `victory.personalBest` key

## Design Recommendations (Claude's Discretion)

### Weekly Summary Card - Additional Stats

Recommend: **XP earned** and **nodes completed** as the 1-2 additional stats.

- XP earned is the primary currency students care about
- Nodes completed gives a sense of tangible progress
- Both are easily queryable from existing tables
- Stars earned was considered but overlaps with nodes completed

### Personal Best Badge Visual

Recommend: A compact inline badge with a trophy icon and text.

```jsx
<div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 px-3 py-1">
  <Trophy className="h-4 w-4 text-amber-300" />
  <span className="text-sm font-bold text-amber-200">
    {t("victory.personalBest")}
  </span>
</div>
```

Warm amber gradient matches the XP/gold theme without competing with blue XP cards or purple celebration titles.

### Unsubscribe Mechanism

Recommend: **New DB column** (`weekly_report_opted_out`) over token-based approach.

- Simpler implementation: just add a column to `push_subscriptions`
- The unsubscribe link includes an HMAC-signed token for security (prevents guessing)
- A small Edge Function (`unsubscribe-weekly-report`) handles the unsubscribe GET request
- Returns a simple HTML page confirming unsubscription
- No login required (parent may not have an account)

### Fun Fact Count

Recommend: **12 messages** (slightly above minimum of 10).

- Provides enough variety for 12 days without repeat
- Manageable translation burden (12 x 2 languages = 24 strings)
- Music fun facts appropriate for 8-year-olds

### Email Additional Stats

Recommend: **Nodes completed** and **current level** alongside days practiced + streak.

- Current level gives parents a sense of overall progress
- Nodes completed shows concrete learning milestones
- Both are positive metrics that reinforce practice value

## Open Questions

1. **pg_cron setup for weekly report**
   - What we know: Daily push uses pg_cron + pg_net to trigger the Edge Function. Same pattern applies.
   - What's unclear: Whether the pg_cron job is set up in a migration or manually in the Supabase dashboard.
   - Recommendation: Document the pg_cron SQL in the migration file as a comment (like send-daily-push) but set up manually in production.

2. **Unsubscribe Edge Function routing**
   - What we know: Supabase Edge Functions handle POST/OPTIONS. An unsubscribe link needs to work with a simple GET click.
   - What's unclear: Whether Supabase Edge Functions can return HTML pages for GET requests (they can -- Deno.serve handles any HTTP method).
   - Recommendation: Create a small `unsubscribe-weekly-report` Edge Function that accepts GET with query params, validates HMAC, updates DB, returns HTML confirmation page.

## Validation Architecture

> `workflow.nyquist_validation` is not present in config.json -- treating as enabled.

### Test Framework

| Property           | Value                                            |
| ------------------ | ------------------------------------------------ |
| Framework          | Vitest (existing)                                |
| Config file        | `vitest.config.js` or inline in `vite.config.js` |
| Quick run command  | `npx vitest run --reporter=verbose`              |
| Full suite command | `npm run test:run`                               |

### Phase Requirements -> Test Map

| Req ID  | Behavior                                                                  | Test Type   | Automated Command                                                       | File Exists? |
| ------- | ------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- | ------------ |
| PROG-04 | Weekly summary queries 7-day rolling data correctly                       | unit        | `npx vitest run src/services/weeklyProgressService.test.js -x`          | Wave 0       |
| PROG-05 | Personal best only triggers when previous best_score exists and is beaten | unit        | `npx vitest run src/components/games/VictoryScreen.test.js -x`          | Wave 0       |
| PROG-06 | Fun fact rotation never repeats same index on consecutive days            | unit        | `npx vitest run src/components/dashboard/DailyMessageBanner.test.js -x` | Wave 0       |
| PROG-07 | Weekly email Edge Function skips opted-out students                       | manual-only | N/A (Edge Function in Deno runtime, not Vitest-testable)                | N/A          |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/weeklyProgressService.test.js` -- covers PROG-04 date range queries
- [ ] `src/components/dashboard/DailyMessageBanner.test.js` -- covers PROG-06 non-repeat logic

_(VictoryScreen personal best is a small conditional addition; testing via existing VictoryScreen test infrastructure or manual validation is sufficient. Edge Function tested via deployment.)_

## Sources

### Primary (HIGH confidence)

- **Codebase analysis** -- Dashboard.jsx, VictoryScreen.jsx, DailyGoalsCard.jsx, send-daily-push/index.ts, send-consent-email/index.ts, skillProgressService.js, apiScores.js, celebrationMessages.js, celebrationTiers.js, scoreComparisonService.js
- **Supabase migrations** -- 20260201000001_coppa_schema.sql (parent_email column), 20260304000001_add_push_subscriptions.sql (parent_consent_granted column)
- **i18n locale files** -- en/common.json structure confirmed: `dashboard.*`, `victory.*`, `celebration.*` key namespaces

### Secondary (MEDIUM confidence)

- **Brevo API** -- `https://api.brevo.com/v3/smtp/email` endpoint verified via existing send-consent-email implementation

### Tertiary (LOW confidence)

- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- every component has a direct existing precedent in the codebase
- Pitfalls: HIGH -- identified from actual code analysis (VictoryScreen complexity, timezone handling, Brevo patterns)
- Personal best data source: HIGH -- confirmed `student_skill_progress.best_score` is the correct comparison target (not `students_score`)

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- no external library dependencies)
