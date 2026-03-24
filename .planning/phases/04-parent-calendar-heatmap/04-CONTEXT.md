# Phase 4: Parent Calendar Heatmap - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Parents can see a 52-week rolling calendar heatmap of their child's instrument practice history in the parent portal. This phase delivers: a new glass card section in ParentPortalPage with a GitHub-style heatmap grid, summary stats, historical data query, and RTL support via CSS workaround.

</domain>

<decisions>
## Implementation Decisions

### Heatmap Placement
- **D-01:** New glass card section added below the existing subscription management card in `ParentPortalPage.jsx`. Single scrollable page: subscription status -> practice heatmap.
- **D-02:** Heatmap is always visible regardless of subscription status. Practice logging is a free-tier feature; the heatmap is a parenting tool. **Future note:** document for potential premium gating in a later milestone.

### Library Choice
- **D-03:** Use `react-activity-calendar` library. Roadmap recommended this for date-math reliability. GitHub-style grid layout with built-in theme customization, responsive sizing, and tooltip support (~15KB gzipped).
- **D-04:** RTL support via CSS workaround (direction:rtl or CSS transform on container + re-flipped labels). No need for native RTL rendering — CSS approach is the standard method and sufficient.

### Color & Visual Style
- **D-05:** Practiced days use **emerald/green** color (`emerald-400`), matching the PracticeLogCard accent from Phase 2 (D-10). Overrides the "indigo" mentioned in original success criteria — consistency with student-facing practice card takes priority.
- **D-06:** **Binary coloring only** — two states: practiced (emerald) and not practiced (neutral gray). No intensity levels. Matches the yes/no logging model (no duration data exists to differentiate intensity).
- **D-07:** No red for missed days — neutral gray only (per success criteria PARENT-02).
- **D-08:** Glass card styling consistent with existing ParentPortalPage cards (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`).

### Interactivity
- **D-09:** Visual heatmap grid with **summary stats** — no tooltips, no tap interactions on individual day cells. Stats shown above/below grid: total practice days, current streak, longest streak.
- **D-10:** Empty state: show the full 52-week grid in all-gray with an encouraging message ("Practice days will appear here as your child logs practice"). Parent understands the feature immediately even with no data.

### Data Layer
- **D-11:** New query in `practiceLogService.js` (or new service method) to fetch 52 weeks of practice logs for a given student. Returns array of `{ practiced_on: DATE }` rows.
- **D-12:** Summary stats (total days, current streak, longest streak) can be computed client-side from the 52-week data set — at most 365 rows.

### Claude's Discretion
- **D-13:** Card header copy and summary stat labels — Claude picks kid/parent-friendly wording consistent with existing portal tone.
- **D-14:** Exact react-activity-calendar theme configuration and responsive breakpoints.
- **D-15:** Data query optimization (single query with date range vs. materialized view).
- **D-16:** Month/day labels on the heatmap grid — locale-aware formatting approach.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Parent Portal
- `src/pages/ParentPortalPage.jsx` — Existing parent portal page where heatmap card will be added (below subscription card)
- `src/App.jsx` — Route definition for `/parent-portal`

### Practice Log Infrastructure (Phase 2 output)
- `src/services/practiceLogService.js` — Practice logging service (needs new historical query method)
- `src/services/practiceStreakService.js` — Practice streak service (current streak, longest streak data)
- `src/utils/dateUtils.js` — `getCalendarDate()` for local timezone dates
- `supabase/migrations/20260324000001_instrument_practice_tables.sql` — `instrument_practice_logs` table schema (student_id, practiced_on DATE, RLS)

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card pattern, text colors, accent numbers

### i18n
- `src/locales/en/common.json` — English translations (parentPortal namespace exists)
- `src/locales/he/common.json` — Hebrew translations

### Streak Display Patterns
- `src/components/streak/StreakDisplay.jsx` — Existing streak display component (visual pattern reference)
- `src/components/dashboard/PracticeLogCard.jsx` — Student-facing practice card (emerald/green accent reference)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ParentPortalPage.jsx` — Already has RTL support (`i18n.dir()`), TanStack Query, lucide-react icons, glass card pattern, `useUser()` hook. Add new section below existing subscription card.
- `practiceLogService.js` — Has `getTodayStatus()` and `logPractice()`. Needs new `getHistoricalLogs(startDate, endDate)` method for 52-week data.
- `practiceStreakService.js` — Has streak calculation logic. Summary stats can reuse or derive from this.
- `useMotionTokens` hook — Available for any animated transitions if needed.

### Established Patterns
- Dashboard/portal cards: glass card styling (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`).
- Data fetching: TanStack React Query with `useQuery`, query keys like `["practice-history", userId]`.
- RTL: `isRTL = i18n.dir() === 'rtl'` pattern already in ParentPortalPage.
- Locale-aware formatting: `Intl.DateTimeFormat` and `Intl.NumberFormat` already used in ParentPortalPage.

### Integration Points
- `ParentPortalPage.jsx` — Add new `PracticeHeatmapCard` component import and render below subscription card.
- `practiceLogService.js` — Add `getHistoricalLogs()` method querying `instrument_practice_logs` with date range filter.
- `locales/en/common.json` + `locales/he/common.json` — New `parentPortal.practice*` translation keys.
- `package.json` — Add `react-activity-calendar` dependency.

</code_context>

<specifics>
## Specific Ideas

- Emerald/green accent matches the student-facing PracticeLogCard — parent sees the same color language for practice.
- Summary stats above the heatmap: "42 days practiced", "12-day current streak", "21-day longest streak".
- Empty state shows full gray grid with encouraging message — parent understands the feature even with no data.
- Future premium gating: the heatmap section should be structured so a subscription check wrapper can be added later without refactoring the component.

</specifics>

<deferred>
## Deferred Ideas

- **Premium gating of heatmap** — Currently free-tier. User plans to convert to a premium feature in a future milestone. Structure the component to allow easy wrapping with subscription check.
- **RTL calendar heatmap (PARENT-F02)** — Already in future requirements. CSS workaround is the v1 approach; native RTL rendering deferred.
- **Teacher view of all students' practice heatmaps (PARENT-F03)** — Future requirement, not in this phase.

</deferred>

---

*Phase: 04-parent-calendar-heatmap*
*Context gathered: 2026-03-24*
