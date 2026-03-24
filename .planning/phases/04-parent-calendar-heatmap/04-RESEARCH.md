# Phase 04: Parent Calendar Heatmap — Research

**Researched:** 2026-03-24
**Domain:** React heatmap visualization, Supabase RLS, i18n/RTL, TanStack Query
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** New glass card section added below the existing subscription management card in `ParentPortalPage.jsx`. Single scrollable page: subscription status -> practice heatmap.
- **D-02:** Heatmap is always visible regardless of subscription status. Practice logging is a free-tier feature; the heatmap is a parenting tool. Future note: document for potential premium gating in a later milestone.
- **D-03:** Use `react-activity-calendar` library. Roadmap recommended this for date-math reliability. GitHub-style grid layout with built-in theme customization, responsive sizing, and tooltip support (~15KB gzipped).
- **D-04:** RTL support via CSS workaround (direction:rtl or CSS transform on container + re-flipped labels). No need for native RTL rendering — CSS approach is the standard method and sufficient.
- **D-05:** Practiced days use **emerald/green** color (`emerald-400`), matching the PracticeLogCard accent from Phase 2 (D-10). Overrides the "indigo" mentioned in original success criteria — consistency with student-facing practice card takes priority.
- **D-06:** **Binary coloring only** — two states: practiced (emerald) and not practiced (neutral gray). No intensity levels. Matches the yes/no logging model (no duration data exists to differentiate intensity).
- **D-07:** No red for missed days — neutral gray only (per success criteria PARENT-02).
- **D-08:** Glass card styling consistent with existing ParentPortalPage cards (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`).
- **D-09:** Visual heatmap grid with **summary stats** — no tooltips, no tap interactions on individual day cells. Stats shown above/below grid: total practice days, current streak, longest streak.
- **D-10:** Empty state: show the full 52-week grid in all-gray with an encouraging message. Parent understands the feature immediately even with no data.
- **D-11:** New query in `practiceLogService.js` (or new service method) to fetch 52 weeks of practice logs for a given student. Returns array of `{ practiced_on: DATE }` rows.
- **D-12:** Summary stats (total days, current streak, longest streak) can be computed client-side from the 52-week data set — at most 365 rows.

### Claude's Discretion

- **D-13:** Card header copy and summary stat labels — Claude picks kid/parent-friendly wording consistent with existing portal tone.
- **D-14:** Exact react-activity-calendar theme configuration and responsive breakpoints.
- **D-15:** Data query optimization (single query with date range vs. materialized view).
- **D-16:** Month/day labels on the heatmap grid — locale-aware formatting approach.

### Deferred Ideas (OUT OF SCOPE)

- **Premium gating of heatmap** — Currently free-tier. User plans to convert to a premium feature in a future milestone. Structure the component to allow easy wrapping with subscription check.
- **RTL calendar heatmap (PARENT-F02)** — Already in future requirements. CSS workaround is the v1 approach; native RTL rendering deferred.
- **Teacher view of all students' practice heatmaps (PARENT-F03)** — Future requirement, not in this phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PARENT-01 | Parent portal shows a calendar heatmap of the child's instrument practice history | react-activity-calendar v3.1.1 provides GitHub-style heatmap; new `getHistoricalLogs()` method on existing service; new `PracticeHeatmapCard` component added to `ParentPortalPage` |
| PARENT-02 | Calendar heatmap covers 52-week rolling window with child-appropriate coloring (no red for missed days) | Binary theme: `#34d399` (emerald, practiced) / `rgba(255,255,255,0.15)` (neutral gray, not practiced); 52-week date range query; data transformation fills all 364 days |
</phase_requirements>

---

## Summary

Phase 4 adds a `PracticeHeatmapCard` component to `ParentPortalPage.jsx`, rendering a 52-week GitHub-style activity grid using the `react-activity-calendar` npm package (v3.1.1, published 2026-01-28). The component displays binary practice data (practiced/not-practiced) in emerald-on-glass styling, matching the student-facing `PracticeLogCard` accent from Phase 2.

The data layer is straightforward: a new `getHistoricalLogs(studentId, startDate, endDate)` method on `practiceLogService.js` queries the existing `instrument_practice_logs` table (built in Phase 2). The table already has a compound index on `(student_id, practiced_on DESC)` specifically for this heatmap query. RLS allows `student_id = auth.uid()` — since the parent portal is accessed by the student's own account, no new RLS policy is needed.

The most important finding is an API discrepancy in the UI-SPEC: `react-activity-calendar` v3 does NOT have `interactive`, `hideColorLegend`, or `hideTotalCount` props. The v3 API uses `showColorLegend` (default `true`), `showTotalCount` (default `true`), and achieves non-interactivity by simply omitting `renderBlock`. The planner must use the verified v3 prop names listed in this document, not the UI-SPEC names.

**Primary recommendation:** Build the feature in two tasks — (1) service method + data transformation utility, and (2) `PracticeHeatmapCard` component + i18n keys + portal integration. The summary stats for current streak should call the already-existing `practiceStreakService.getPracticeStreak()` rather than computing from scratch.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-activity-calendar | 3.1.1 | GitHub-style heatmap grid | Locked by D-03; handles date-math, weeks alignment, responsive sizing |
| @tanstack/react-query | ^5.66.0 | Data fetching and caching | Already in project; `useQuery` pattern established in `ParentPortalPage` |
| react-i18next | ^16.3.5 | i18n translation keys | Already in project; `parentPortal` namespace already exists |
| lucide-react | ^0.344.0 | Piano icon in card header | Already in project; `Piano` icon used in `PracticeLogCard` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS 3 | ^3.4.1 | Glass card styling | All layout and color — no custom CSS needed |
| framer-motion | ^12.23.26 | (not used) | UI-SPEC explicitly excludes framer-motion for this component |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-activity-calendar | Custom SVG grid | Custom requires date-math, week alignment, responsive calculations — significant complexity for no gain |
| react-activity-calendar | react-calendar-heatmap | Not verified in Context7; react-activity-calendar is locked decision |

**Installation:**
```bash
npm install react-activity-calendar
```

**Version verified:** 3.1.1 (npm registry, published 2026-01-28)

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── parent/                       # NEW directory
│       └── PracticeHeatmapCard.jsx   # NEW component
├── services/
│   └── practiceLogService.js         # ADD getHistoricalLogs() method
├── locales/
│   ├── en/common.json                # ADD parentPortal.practiceCalendar.* keys
│   └── he/common.json                # ADD parentPortal.practiceCalendar.* keys (Hebrew)
└── pages/
    └── ParentPortalPage.jsx          # ADD import + render PracticeHeatmapCard
```

### Pattern 1: react-activity-calendar v3 Data Format

**What:** The library requires a sorted array of `Activity` objects covering ALL days in the date range (not just practiced days). Missing dates must be filled with `count: 0, level: 0`.

**When to use:** Always — the component throws or renders incorrectly if the data array has gaps.

```typescript
// Source: github.com/grubersjoe/react-activity-calendar — confirmed from types.ts
type Activity = {
  date: string;   // "YYYY-MM-DD"
  count: number;  // 0 or 1 for binary
  level: number;  // 0 (not practiced) or 1 (practiced) — with maxLevel={1}
}
```

**Full transformation pattern:**
```javascript
// Source: react-activity-calendar v3 types.ts + component source
function buildHeatmapData(practicedDates, endDate = new Date()) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const end = new Date(endDate);
  // 364 days = 52 weeks
  const start = new Date(end.getTime() - 363 * MS_PER_DAY);

  const practicedSet = new Set(practicedDates.map(r => r.practiced_on));

  const result = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + MS_PER_DAY)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    result.push({
      date: dateStr,
      count: practicedSet.has(dateStr) ? 1 : 0,
      level: practicedSet.has(dateStr) ? 1 : 0,
    });
  }
  return result;
}
```

### Pattern 2: react-activity-calendar v3 Verified Props

**CRITICAL: UI-SPEC contains incorrect prop names for v3. Use these verified names.**

```jsx
// Source: ActivityCalendar.tsx source — all prop names verified
<ActivityCalendar
  data={heatmapData}
  maxLevel={1}                    // binary: only level 0 and 1
  theme={{
    light: [
      'rgba(255,255,255,0.15)',    // level 0 — not practiced
      '#34d399',                  // level 1 — practiced (emerald-400)
    ]
  }}
  colorScheme="light"
  blockSize={12}                  // default 12px; use 10 at <sm
  blockRadius={3}                 // rounded corners
  blockMargin={3}                 // gap between cells (3px — sub-4px exception per UI-SPEC)
  showColorLegend={false}         // v3 prop (NOT hideColorLegend — that does NOT exist)
  showTotalCount={false}          // v3 prop (NOT hideTotalCount — that does NOT exist)
  showWeekdayLabels={false}
  showMonthLabels={true}
  loading={isLoading}
  // NO 'interactive' prop in v3 — non-interactivity achieved by omitting renderBlock
  labels={{ months: localeMonthNames }}
/>
```

**UI-SPEC prop name corrections (planner MUST apply these):**

| UI-SPEC used | v3 actual prop | Default |
|-------------|----------------|---------|
| `hideColorLegend={true}` | `showColorLegend={false}` | `true` |
| `hideTotalCount={true}` | `showTotalCount={false}` | `true` |
| `interactive={false}` | (no such prop — omit `renderBlock`) | non-interactive by default |

### Pattern 3: RTL CSS Transform Approach (D-04)

**What:** No native RTL in react-activity-calendar. Mirror the SVG with `scaleX(-1)`.

```jsx
// Source: D-04 decision, UI-SPEC Interaction Contract
{isRTL ? (
  <div style={{ direction: 'ltr' }}>
    <ActivityCalendar
      style={{ transform: 'scaleX(-1)' }}
      {/* month labels also get scaleX(-1) via CSS after render */}
      {...props}
    />
  </div>
) : (
  <ActivityCalendar {...props} />
)}
```

**Limitation:** Month label text also gets mirrored and must be un-flipped. The library renders month labels as `<text>` elements inside SVG — apply `transform: scaleX(-1)` to each label element via a CSS selector targeting the SVG text nodes, or pass empty month labels in RTL mode and render them separately.

**Note:** This is v1 RTL. PARENT-F02 in future requirements covers native RTL. The CSS workaround is explicitly accepted per D-04.

### Pattern 4: TanStack Query for Historical Data

```javascript
// Source: established pattern from ParentPortalPage.jsx
const {
  data: historyData,
  isLoading,
  isError,
} = useQuery({
  queryKey: ['practice-history', studentId],
  queryFn: () => practiceLogService.getHistoricalLogs(studentId, startDate, endDate),
  enabled: !!studentId,
  staleTime: 5 * 60 * 1000,  // 5 minutes per D-12 / UI-SPEC Data Contract
});
```

### Pattern 5: Summary Stats Computation

```javascript
// Total days — simple array length from DB query
const totalDays = practicedDates.length;

// Current streak — delegate to practiceStreakService (already has correct logic)
// practiceStreakService.getPracticeStreak() returns { streakCount, lastPracticedOn }

// Longest streak — compute from sorted date array
function computeLongestStreak(practicedDates) {
  if (!practicedDates.length) return 0;
  const sorted = [...practicedDates]
    .map(r => r.practiced_on)
    .sort();

  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i-1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}
```

**Decision on two queries vs. one:** Use two parallel queries — `['practice-history', studentId]` for logs array + `['practice-streak', studentId]` for current streak. This reuses the existing `practiceStreakService` without duplicating streak logic. Both queries are small and fast.

### Anti-Patterns to Avoid

- **Passing sparse data to ActivityCalendar:** The library requires a complete date range array — all 364 days. Passing only practiced dates causes rendering errors.
- **Recomputing current streak from the log array:** `practiceStreakService` handles weekend-pass logic correctly. Client-side re-implementation would diverge.
- **Using `interactive={false}`:** This prop does not exist in v3. Passing unknown props may cause React warnings but no functional harm — however, the planner must not include it.
- **Using `hideColorLegend`/`hideTotalCount`:** These are v2 prop names. In v3, use `showColorLegend={false}` / `showTotalCount={false}`.
- **Querying without date range filter:** Without `gte`/`lte` filters, the query could return thousands of rows if the student has been practicing for years.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 52-week calendar grid layout | Custom SVG/grid | react-activity-calendar | Week alignment, month label positioning, block sizing — all handled |
| Current streak calculation | Client-side streak from log array | `practiceStreakService.getPracticeStreak()` | Weekend-pass logic already correct; re-implementation risks divergence |
| Date range generation | Custom loop | `buildHeatmapData()` utility in new service method | Encapsulate for testability; used only once but the edge cases (DST, timezone) justify isolation |
| Locale month names | Hardcoded arrays | `Intl.DateTimeFormat(locale, { month: 'short' }).format(date)` | Already used in `ParentPortalPage`; handles Hebrew short month names correctly |

**Key insight:** The existing Phase 2 infrastructure (service, DB table, index) was specifically designed with Phase 4 in mind. The `idx_practice_logs_student_date` index comment in the migration even says "for heatmap in Phase 4". There is nothing to architect from scratch — only integrate.

---

## Common Pitfalls

### Pitfall 1: react-activity-calendar v3 API Divergence from UI-SPEC

**What goes wrong:** Using `interactive={false}`, `hideColorLegend={true}`, or `hideTotalCount={true}` as specified in the UI-SPEC. These are v2 prop names. In v3, they are `showColorLegend={false}` and `showTotalCount={false}`. The `interactive` prop was removed entirely.

**Why it happens:** The UI-SPEC was written before the v3 API was verified. The library changed prop naming convention from "hide*" to "show*" in v3.

**How to avoid:** Use only the verified v3 prop names documented in the Architecture Patterns section of this research.

**Warning signs:** TypeScript warnings (if TS was in use), React prop warnings in console, or legend/count still appearing despite props.

### Pitfall 2: Sparse Data Array Causes Heatmap Errors

**What goes wrong:** Passing only the `practiced_on` dates from the DB directly to `ActivityCalendar`. The library expects a complete sorted array spanning every day in the 52-week window.

**Why it happens:** It's tempting to only query and pass what exists in the DB. But `ActivityCalendar` renders week-by-week and expects all 364 entries.

**How to avoid:** Always run DB results through `buildHeatmapData()` which fills all 364 days with `count: 0, level: 0` for un-practiced days.

**Warning signs:** Component renders with gaps, throws validation error, or shows incorrect number of weeks.

### Pitfall 3: RLS — Parent Cannot Read Child's Data (Does Not Apply Here)

**What might go wrong:** You might expect to need a new RLS policy for parents to read student data. However, in this app the "parent portal" is accessed by the same account as the student (the student's own login). The existing `"Students can read own practice logs"` policy (`student_id = auth.uid()`) already allows the query to succeed.

**Clarification:** No new RLS policies are needed for Phase 4. The `instrument_practice_logs` table RLS is sufficient as-is.

**Warning signs:** If the data model ever changes so parents have separate accounts, this will need a new policy — but that is out of scope.

### Pitfall 4: RTL Month Label Double-Mirror

**What goes wrong:** Applying `scaleX(-1)` to the ActivityCalendar container mirrors the entire SVG, including the text inside `<text>` elements. Month names become mirrored/backwards.

**Why it happens:** SVG transform applies to all children including text nodes.

**How to avoid:** The UI-SPEC approach (D-04) is to apply a second `scaleX(-1)` to the month labels container after render. In practice this means targeting the SVG `<g>` that holds month labels with a CSS rule. An alternative: pass `showMonthLabels={false}` in RTL mode and render Hebrew month abbreviations separately above the heatmap.

**Warning signs:** Hebrew UI shows backwards month abbreviations (e.g., "naJ" instead of "Jan").

### Pitfall 5: Heatmap Width Overflow on Mobile

**What goes wrong:** At `blockSize={12}`, the 52-week heatmap is approximately `52 * (12 + 3) - 3 = 777px` wide. On a 375px mobile screen it overflows.

**Why it happens:** The component renders into fixed pixel widths based on `blockSize` and `blockMargin`.

**How to avoid:** Wrap `ActivityCalendar` in a `div` with `overflow-x: auto` and `max-width: 100%`. Reduce `blockSize` to `10` at `<sm` breakpoint using a responsive prop (compute based on viewport width). The UI-SPEC specifies `blockSize={10}` at `<sm`.

**Warning signs:** Horizontal scroll appearing in the parent portal page, or heatmap being clipped.

### Pitfall 6: Empty State — Do Not Hide Grid

**What goes wrong:** Conditionally rendering `null` or a placeholder image when there are no practice logs.

**Why it happens:** Normal "empty state" pattern hides the data visualization entirely.

**How to avoid:** Per D-10, the full 52-week grid in all-gray MUST render even with zero practice records. The `buildHeatmapData([])` call produces 364 entries all at `level: 0` — pass this to the component. Show the encouraging copy below the (all-gray) grid.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Service Method — getHistoricalLogs

```javascript
// Add to practiceLogService.js
// Source: existing logPractice() pattern in practiceLogService.js + Supabase docs
async getHistoricalLogs(studentId, startDate, endDate) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('instrument_practice_logs')
    .select('practiced_on')
    .eq('student_id', session.user.id)
    .gte('practiced_on', startDate)   // startDate: "YYYY-MM-DD"
    .lte('practiced_on', endDate)     // endDate: "YYYY-MM-DD"
    .order('practiced_on', { ascending: true });

  if (error) throw error;
  return data ?? [];
},
```

**Note:** Uses `session.user.id` not the passed `studentId` parameter — this enforces that the authenticated user can only query their own logs (consistent with RLS). The `studentId` prop on `PracticeHeatmapCard` is used for the TanStack Query key only.

### ActivityCalendar v3 Minimal Integration

```jsx
// Source: ActivityCalendar.tsx source (verified props list)
import { ActivityCalendar } from 'react-activity-calendar';

<ActivityCalendar
  data={heatmapData}           // Activity[] — all 364 days
  maxLevel={1}
  theme={{
    light: ['rgba(255,255,255,0.15)', '#34d399'],
  }}
  colorScheme="light"
  blockSize={12}
  blockRadius={3}
  blockMargin={3}
  showColorLegend={false}      // v3 prop name
  showTotalCount={false}       // v3 prop name
  showWeekdayLabels={false}
  showMonthLabels={true}
  loading={isLoading}
  aria-label={t('parentPortal.practiceCalendar.ariaLabel')}
/>
```

### Locale-Aware Month Labels

```javascript
// Source: Intl API — already used in ParentPortalPage.jsx
function getMonthLabels(locale) {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2024, i, 1))
  );
}
// Pass to labels prop:
// labels={{ months: getMonthLabels(locale) }}
```

### Glass Card Shell

```jsx
// Source: ParentPortalPage.jsx lines 193, 208 — exact class string match
<section
  aria-label={t('parentPortal.practiceCalendar.ariaLabel')}
  data-section="practice-heatmap"
  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6"
>
  {/* card content */}
</section>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `hideColorLegend` prop | `showColorLegend={false}` | react-activity-calendar v3 (Nov 2025) | Must use new prop name |
| `hideTotalCount` prop | `showTotalCount={false}` | react-activity-calendar v3 (Nov 2025) | Must use new prop name |
| `interactive` prop | No such prop (omit `renderBlock`) | react-activity-calendar v3 (Nov 2025) | Non-interactive by default |
| maxLevel=4 (5 intensity levels) | maxLevel=1 (binary) | Always existed; just explicit default | Pass `maxLevel={1}` for binary coloring |

**Deprecated/outdated:**
- `hideColorLegend` (v2): replaced by `showColorLegend` in v3
- `hideTotalCount` (v2): replaced by `showTotalCount` in v3
- `interactive` (v2): removed in v3; use `renderBlock` for custom interactivity

---

## Open Questions

1. **RTL month label un-flip: best approach**
   - What we know: `scaleX(-1)` on ActivityCalendar mirrors text. The UI-SPEC says "apply `scaleX(-1)` to the labels container after render" but doesn't specify HOW to target SVG text after render in React.
   - What's unclear: Does `react-activity-calendar` v3 expose a CSS class on the month label group that can be targeted? Or must we use a `ref` + `querySelectorAll('text')`?
   - Recommendation: The planner should use `showMonthLabels={false}` in RTL mode and render locale month names as a separate row above the grid. This avoids the fragile "target SVG internals" approach entirely. Since PARENT-F02 (full RTL heatmap) is deferred anyway, keeping RTL simple is acceptable.

2. **Two-query vs. single-query for stats**
   - What we know: D-12 says stats are computed client-side. `practiceStreakService.getPracticeStreak()` returns `streakCount` directly from DB. The 52-week log array lets us compute `totalDays` and `longestStreak`.
   - What's unclear: Should `PracticeHeatmapCard` make one query (logs) + one query (streak) for a total of 2 `useQuery` calls, or derive current streak from logs?
   - Recommendation: Two queries — `['practice-history', studentId]` + `['practice-streak', studentId]`. The streak service handles weekend-pass logic; re-implementing it from the log array is risky. Stale time: 5 min for both.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| react-activity-calendar | Heatmap grid | NOT YET | — | Install via `npm install react-activity-calendar` |
| @tanstack/react-query | Data fetching | Yes | ^5.66.0 | — |
| lucide-react | Piano icon | Yes | ^0.344.0 | — |
| react-i18next | i18n keys | Yes | ^25.7.0 (i18next) | — |
| Tailwind CSS 3 | Styling | Yes | ^3.4.1 | — |

**Missing dependencies with no fallback:**
- `react-activity-calendar` — must be installed before implementation. One `npm install` command, no configuration.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vite.config.js (vitest section) |
| Quick run command | `npx vitest run src/services/practiceLogService.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARENT-01 | `getHistoricalLogs()` returns correct date range | unit | `npx vitest run src/services/practiceLogService.test.js` | ✅ (extend existing) |
| PARENT-01 | `buildHeatmapData()` fills all 364 days | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 (add test) |
| PARENT-01 | `computeLongestStreak()` handles consecutive chains | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 (add test) |
| PARENT-02 | Binary theme: practiced days level=1, others level=0 | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 (add test) |
| PARENT-02 | Empty state: all 364 entries at level=0 | unit | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 (add test) |
| PARENT-01 | `PracticeHeatmapCard` renders loading skeleton | component | manual / visual | ❌ (no component tests planned) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/services/practiceLogService.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/practiceLogService.test.js` — Add tests for `getHistoricalLogs()`, `buildHeatmapData()`, `computeLongestStreak()` (file exists — extend)
- [ ] `src/components/parent/PracticeHeatmapCard.jsx` — new file, no test scaffold needed (component tests are manual per project convention)

*(No new test infrastructure needed — Vitest + testing-library already installed)*

---

## Project Constraints (from CLAUDE.md)

These directives apply to all implementation tasks in Phase 4:

- **SVG imports:** Must use `import Icon from './icon.svg?react'` with `?react` suffix if any SVG files are imported.
- **i18n:** All user-visible strings must go through `t()` with keys in `src/locales/en/common.json` and `src/locales/he/common.json`.
- **Tailwind CSS 3:** All styling via Tailwind utility classes; no new CSS files.
- **Glass card pattern:** `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg` — mandatory for new card.
- **TanStack React Query v5:** Use `useQuery` with typed query keys; do not use raw `fetch` or `useEffect` for data.
- **Testing:** Vitest + JSDOM; test files as `*.test.{js,jsx}` siblings or in `__tests__/`; mock Supabase with `vi.mock('./supabase', ...)`.
- **Pre-commit:** Husky + lint-staged runs ESLint + Prettier on staged files — code must pass before commit.
- **No custom auth/session logic:** All session access via `supabase.auth.getSession()` matching existing pattern.
- **Security:** RLS must be respected; `student_id` always set to `auth.uid()` (session user), never to a passed parameter value.
- **COPPA:** No PII beyond `student_id` (UUID) and `practiced_on` (DATE) — the query returns only `practiced_on`, not names or identifying information.

---

## Sources

### Primary (HIGH confidence)

- `src/components/ActivityCalendar.tsx` (grubersjoe/react-activity-calendar GitHub) — verified all prop names: `showColorLegend`, `showTotalCount`, absence of `interactive` prop, `maxLevel`, `blockSize`, `blockRadius`, `blockMargin`, `renderBlock` pattern
- `src/types.ts` (grubersjoe/react-activity-calendar GitHub) — verified `Activity` type: `{ date: string, count: number, level: number }`
- `npm view react-activity-calendar` — version 3.1.1, published 2026-01-28, peer deps: react ^18 || ^19
- `supabase/migrations/20260324000001_instrument_practice_tables.sql` — verified table schema, existing index, RLS policies
- `src/services/practiceLogService.js` — verified service pattern for new method
- `src/services/practiceStreakService.js` — verified `getPracticeStreak()` returns `{ streakCount, lastPracticedOn }`
- `src/pages/ParentPortalPage.jsx` — verified RTL pattern (`isRTL = i18n.dir() === 'rtl'`), existing glass card classes, `useQuery` pattern, `useUser()` hook

### Secondary (MEDIUM confidence)

- `04-UI-SPEC.md` — UI design contract for this phase (partially verified: prop names corrected from UI-SPEC to v3 actual)
- `04-CONTEXT.md` — locked decisions driving all architecture choices

### Tertiary (LOW confidence)

- None — all key claims verified against source.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-activity-calendar v3.1.1 verified from npm registry + GitHub source
- Architecture: HIGH — all patterns derived from existing codebase (ParentPortalPage, practiceLogService, practiceStreakService)
- Pitfalls: HIGH — prop name discrepancies confirmed by reading actual v3 TypeScript source

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (react-activity-calendar is a stable library; 30-day validity)
