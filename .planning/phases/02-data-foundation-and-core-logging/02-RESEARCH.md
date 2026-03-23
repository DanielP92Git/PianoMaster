# Phase 2: Data Foundation and Core Logging - Research

**Researched:** 2026-03-24
**Domain:** Supabase migrations, React Query mutation patterns, streak service architecture, dashboard card composition
**Confidence:** HIGH — all findings verified directly from codebase source files

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Standalone glass card — new `PracticeLogCard.jsx` in `src/components/dashboard/`, following DailyChallengeCard pattern.
- **D-02:** Card placement: immediately after UnifiedStatsCard. Order: UnifiedStats -> PracticeLog -> DailyChallenge -> PlayNext -> ...
- **D-03:** Practice streak counter lives inline inside the practice card (not in UnifiedStatsCard).
- **D-04:** Practice streak appears only in the practice card — not duplicated in UnifiedStatsCard. App-usage streak stays in UnifiedStatsCard, practice streak stays in PracticeLogCard.
- **D-05:** Streak presentation: `🎹 5-day practice streak` — icon + count + label in a single row.
- **D-06:** Tap response: instant state change + micro-animation (checkmark). No modal, no confirmation. Respects reduced-motion.
- **D-07:** XP feedback inline in button text: `[ Yes, I practiced! ]` → tap → `[ ✓ Logged! +25 XP ]` (hold 2s) → settle to `[ ✓ Practiced today ]`.
- **D-08:** Already-logged state (returning to dashboard): muted green tint, checkmark, "Practiced today!" text, disabled button. Streak count still visible.
- **D-09:** Practice streak icon: `Piano` from lucide-react.
- **D-10:** Practice card accent color: emerald/green (`emerald-400` border glow, `green-300` streak text, `bg-green-500/20` logged button).
- **D-11:** `instrument_practice_logs` table with `local_date` DATE column (client timezone), UNIQUE on `(student_id, practiced_on)`.
- **D-12:** `instrument_practice_streak` table — separate from `current_streak`. Independent `practiceStreakService.js`, not merged with `streakService.js`.
- **D-13:** ON DELETE CASCADE on both new tables for COPPA hard-delete compliance.
- **D-14:** XP award: 25 XP via `award_xp()` RPC, only when INSERT returns count === 1 (idempotent — no double award).
- **D-15:** Full EN/HE translations for all new UI elements.

### Claude's Discretion

- **D-16:** Practice card copy/messaging tone — Claude picks the best wording based on existing kid-friendly style.
- **D-17:** Micro-animation implementation details — checkmark animation timing, easing, reduced-motion fallback.
- **D-18:** RLS policy specifics — exact policy definitions following existing patterns in migrations.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | DB migration creates `instrument_practice_logs` and `instrument_practice_streak` tables with RLS | Migration structure verified from `20260322000001_add_feedback_submissions.sql` and `20260305000001_streak_protection.sql` — exact patterns documented below |
| INFRA-02 | New tables include `ON DELETE CASCADE` for COPPA hard-delete compliance | Pattern verified from `20260201000001_coppa_schema.sql` — every FK uses `REFERENCES students(id) ON DELETE CASCADE` |
| INFRA-03 | Practice log enforces one entry per student per day via UNIQUE constraint | `UNIQUE(student_id, practiced_on)` — same pattern as `current_streak`'s `UNIQUE(student_id)` upsert target |
| INFRA-04 | Practice log stores `local_date` (client timezone) to prevent timezone mismatch | `getCalendarDate()` helper already exists in `streakService.js` — reuse pattern documented below |
| INFRA-05 | Full EN/HE translations for all new UI elements | `locales/en/common.json` + `locales/he/common.json` — new `practice` namespace; UI-SPEC documents all 8 copy strings |
| LOG-01 | Student can log daily instrument practice via a button on the dashboard | `PracticeLogCard.jsx` with optimistic mutation — React Query `useMutation` pattern verified from existing services |
| LOG-02 | Dashboard practice card shows today's log status (logged / not-yet / loading) | 3-state card (loading / active / completed) — DailyChallengeCard.jsx is the verified reference pattern |
| LOG-03 | Student receives 25 XP for logging daily practice, once per day (idempotent via DB constraint) | `award_xp()` RPC signature verified from migration; idempotency via INSERT count check documented below |
| STRK-01 | Dedicated practice streak counter, visually distinct from app-usage streak (Piano icon, not fire) | `Piano` icon from lucide-react already imported in Dashboard.jsx — verified available in codebase |
| STRK-02 | Instrument practice streak respects weekend freeze (Shabbat pass) | `_effectiveDayGap()` + `allIntermediateDaysAreWeekend()` in `streakService.js` — copy logic to `practiceStreakService.js` |
| STRK-03 | Practice streak uses independent DB table and service (not merged with app-usage streak) | `instrument_practice_streak` table separate from `current_streak` — architecturally enforced by D-12 |

</phase_requirements>

---

## Summary

Phase 2 is a self-contained infrastructure + UI phase. All patterns exist in the codebase and need to be replicated, not invented. The core deliverables are: one SQL migration (two tables + RLS), one service file (`practiceStreakService.js`), one service file (`practiceLogService.js`), one React component (`PracticeLogCard.jsx`), locale strings in both languages, and wiring `PracticeLogCard` into `Dashboard.jsx`.

The existing `streakService.js` is the architectural blueprint for `practiceStreakService.js`. The weekend-pass logic (`_effectiveDayGap`, `allIntermediateDaysAreWeekend`, `getCalendarDate`) is already written and correct — it needs to be mirrored, not rewritten. The `DailyChallengeCard.jsx` is the blueprint for `PracticeLogCard.jsx` — same glass container, same 3-state pattern (loading / active / completed), same query key convention, same RTL flex pattern.

The XP award path (`award_xp()` RPC via `supabase.rpc()`) is proven and has no known issues. The idempotency mechanism is enforced at the database level via the UNIQUE constraint on `(student_id, practiced_on)` — the service layer checks `count === 1` on the INSERT result to decide whether to call `award_xp()`, matching Decision D-14.

**Primary recommendation:** Mirror DailyChallengeCard for the component and streakService for the service. The migration follows `20260322000001_add_feedback_submissions.sql` for table structure and RLS policy style. No third-party dependencies are needed.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x (installed) | Component tree | Project standard |
| @tanstack/react-query | v5 (installed) | Server state, `useQuery` + `useMutation` | Project standard for all data fetching |
| supabase-js | v2 (installed) | DB operations, RPC calls | Project standard — `import supabase from "./supabase"` |
| lucide-react | installed | `Piano`, `CheckCircle` icons | Project standard — already used in Dashboard.jsx |
| react-i18next | installed | EN/HE translations | Project standard — `useTranslation('common')` |
| framer-motion | installed | Entrance animations (reduced-motion gated) | Used in Dashboard.jsx via `motion.div` |
| tailwindcss | 3.x (installed) | All styling | Project standard — glassmorphism utilities |

**No new packages needed.** All dependencies for this phase are already installed.

### Supporting (already in project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/utils/useMotionTokens.js` | n/a (internal) | Reduced-motion animation tokens | Use for checkmark animation gating (D-17) |
| `src/services/streakService.js` | n/a (internal) | Weekend freeze logic source | Copy `_effectiveDayGap`, `allIntermediateDaysAreWeekend`, `getCalendarDate` |

---

## Architecture Patterns

### Recommended Project Structure (new files only)

```
supabase/migrations/
└── 20260324000001_instrument_practice_tables.sql   # INFRA-01, -02, -03, -04

src/
├── services/
│   ├── practiceLogService.js        # logPractice(), getTodayLogStatus()
│   └── practiceStreakService.js     # getPracticeStreak(), updatePracticeStreak()
├── components/dashboard/
│   └── PracticeLogCard.jsx          # LOG-01, LOG-02, LOG-03, STRK-01
└── locales/
    ├── en/common.json               # + practice namespace keys (INFRA-05)
    └── he/common.json               # + practice namespace keys (INFRA-05)
```

Dashboard.jsx gets one import addition + one JSX block addition (no structural changes).

---

### Pattern 1: Supabase Migration File Structure

**What:** All migrations follow a consistent structure: comment header, `CREATE TABLE IF NOT EXISTS`, foreign key with `ON DELETE CASCADE`, indexes, RLS enable, policies, GRANT, COMMENT.

**When to use:** Any new table.

**Example (from `20260322000001_add_feedback_submissions.sql`):**
```sql
-- Naming: YYYYMMDD000001_description.sql
CREATE TABLE IF NOT EXISTS instrument_practice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  practiced_on DATE NOT NULL,                          -- INFRA-04: local_date from client
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INFRA-03: one log per student per day
CREATE UNIQUE INDEX uq_practice_log_student_date
  ON instrument_practice_logs(student_id, practiced_on);

CREATE INDEX idx_practice_logs_student_date
  ON instrument_practice_logs(student_id, practiced_on DESC);

ALTER TABLE instrument_practice_logs ENABLE ROW LEVEL SECURITY;

-- Students can SELECT and INSERT their own rows; no UPDATE/DELETE
CREATE POLICY "Students can read own practice logs"
  ON instrument_practice_logs FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert own practice log"
  ON instrument_practice_logs FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

GRANT SELECT, INSERT ON instrument_practice_logs TO authenticated;
```

**Source:** Verified from `20260322000001_add_feedback_submissions.sql` and `20260305000001_streak_protection.sql`.

---

### Pattern 2: `instrument_practice_streak` Table

**What:** Mirrors the `current_streak` table structure for the practice-specific streak. Needs `streak_count`, `weekend_pass_enabled`, and `updated_at`. Does NOT need freeze inventory, comeback bonus, or `last_freeze_consumed_at` — those are app-usage streak features not in scope for Phase 2.

**Example:**
```sql
CREATE TABLE IF NOT EXISTS instrument_practice_streak (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  weekend_pass_enabled BOOLEAN NOT NULL DEFAULT false,
  last_practiced_on DATE,             -- DATE (local) for streak gap calculation
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE instrument_practice_streak ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own practice streak"
  ON instrument_practice_streak FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON instrument_practice_streak TO authenticated;
```

**IMPORTANT:** `last_practiced_on` is a DATE (not TIMESTAMPTZ) because gap calculation happens in JS using `getCalendarDate()` which produces YYYY-MM-DD strings. Storing a DATE avoids the timezone-conversion problem that INFRA-04 specifically prevents.

---

### Pattern 3: Service Layer Architecture (practiceLogService.js)

**What:** Matches the naming and structure of `streakService.js`. Uses module-level cooldown guards, `supabase.auth.getSession()` for auth, and named exports.

**Key function — `logPractice()`:**
```javascript
// Source: mirrors streakService.js pattern
import supabase from "./supabase";

export const practiceLogService = {
  /**
   * Inserts today's practice log (idempotent via UNIQUE constraint).
   * Returns { inserted: boolean } — true only on first log of the day.
   * Only call award_xp when inserted === true (D-14).
   *
   * @param {string} localDate  "YYYY-MM-DD" in client timezone (from getCalendarDate)
   * @returns {Promise<{ inserted: boolean }>}
   */
  async logPractice(localDate) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error, count } = await supabase
      .from('instrument_practice_logs')
      .insert({
        student_id: session.user.id,
        practiced_on: localDate,
      })
      .select()           // needed to detect count
      .single();          // or handle count separately

    if (error) {
      // PostgreSQL error code 23505 = unique_violation
      // This is the expected path on re-tap: not an error, just already logged
      if (error.code === '23505') {
        return { inserted: false };
      }
      throw error;
    }
    return { inserted: !!data };
  },
```

**CRITICAL PITFALL: Unique Violation Handling.** When a student taps the log button a second time (or on network retry), Supabase will throw `{ code: '23505' }` (unique_violation). The service MUST catch this specific code and return `{ inserted: false }` rather than propagating it as an error. The UI optimistic update ensures the user sees "Logged!" immediately — the DB constraint is just the idempotency backstop.

---

### Pattern 4: practiceStreakService.js Architecture

**What:** A simplified version of `streakService.js`. Reuses `getCalendarDate()` and `_effectiveDayGap()` logic verbatim for weekend-pass-aware streak counting.

**Key design difference from streakService.js:** No grace window (36-hour window is for app-usage streak, not instrument practice). Practice streak is calendar-day strict: practiced on DATE X, must practice on DATE X+1 (or X+2 if weekend pass bridges a Fri/Sat) to continue streak.

**Source of `weekend_pass_enabled`:** The practice streak table stores its own `weekend_pass_enabled` flag. In Phase 2, this flag defaults to `false` and is read from the same `current_streak` row as the app-usage weekend pass (since the setting is per-student, not per-streak-type). The planner should decide: either (a) sync weekend pass from `current_streak.weekend_pass_enabled` into practice streak on read, or (b) duplicate the toggle in `instrument_practice_streak` and sync it separately. Option (a) is simpler for Phase 2.

**Recommended approach for Phase 2:** Read `weekend_pass_enabled` from `current_streak` table (already queried in Dashboard). Pass it as a parameter to `updatePracticeStreak()`. This avoids a redundant DB column and a sync concern.

```javascript
// getPracticeStreak() - returns { streakCount, weekendPassEnabled }
// updatePracticeStreak(localDate, weekendPassEnabled) - increments or resets
```

---

### Pattern 5: React Query Integration in PracticeLogCard

**What:** Follows the `DailyChallengeCard.jsx` pattern exactly. One `useQuery` for read state, one `useMutation` for the log action.

**Query key convention (from codebase):**
```javascript
// Read today's practice status
const dateString = new Date().toISOString().split('T')[0];  // matches DailyChallengeCard pattern
useQuery({
  queryKey: ['practice-log-today', user?.id, dateString],
  queryFn: () => practiceLogService.getTodayStatus(dateString),
  enabled: !!user?.id,
  staleTime: 5 * 60 * 1000,  // 5 minutes — status doesn't change mid-session
});

// Mutation for logging
useMutation({
  mutationFn: () => practiceLogService.logPractice(dateString),
  onSuccess: ({ inserted }) => {
    if (inserted) {
      // award XP (via awardXP from xpSystem.js)
      // invalidate practice streak query
    }
    queryClient.invalidateQueries({ queryKey: ['practice-log-today', user?.id] });
  },
});
```

**Optimistic update strategy (D-06, D-07):** Use local `useState` for the button transition state (idle → logging → settled) rather than React Query optimistic updates. The 2-second hold is a UI timer, not a network event. Pattern:
```javascript
const [logState, setLogState] = useState('idle'); // 'idle' | 'logging' | 'settled'
// On tap: setLogState('logging') → mutate() → setTimeout 2000ms → setLogState('settled')
```

---

### Pattern 6: Dashboard.jsx Integration

**What:** Import `PracticeLogCard` and add it after `UnifiedStatsCard` in the JSX. Add a `useQuery` for practice state if needed by the card (but `PracticeLogCard` can be self-contained like `DailyChallengeCard`).

**DailyChallengeCard is self-contained** — it fetches its own data internally. `PracticeLogCard` should follow the same pattern. Dashboard.jsx does not need new props or queries at the dashboard level.

**Placement (D-02) in Dashboard.jsx JSX order:**
```jsx
{/* UNIFIED STATS CARD */}
{isStudent && <UnifiedStatsCard ... />}

{/* PRACTICE LOG CARD — Phase 2 addition */}
{isStudent && <PracticeLogCard />}

{/* PRACTICE TOOLS (3 circular buttons) */}
{isStudent && ( <section>...</section> )}

{/* COMEBACK BONUS BANNER */}
{isStudent && comebackBonus?.active && ( ... )}

{/* DAILY CHALLENGE CARD */}
{isStudent && <DailyChallengeCard />}
```

**NOTE:** The current Dashboard.jsx shows "PRACTICE TOOLS" immediately after UnifiedStatsCard (lines 697-769), then COMEBACK BONUS, then PUSH OPT-IN, then DAILY CHALLENGE. PracticeLogCard goes between UnifiedStatsCard and PRACTICE TOOLS per D-02.

---

### Pattern 7: `award_xp()` RPC Call

**What:** Existing Postgres SECURITY DEFINER function. Call signature verified from migrations.

**Verified signature:**
```javascript
// From xpSystem.js (verified)
const { data, error } = await supabase.rpc('award_xp', {
  p_student_id: studentId,
  p_xp_amount: 25  // D-14: fixed 25 XP for practice logging
});
// Returns: [{ new_total_xp, new_level, leveled_up }]
```

**CRITICAL:** `awardXP()` in `xpSystem.js` includes an `auth.uid() === studentId` check on the JS side before calling the RPC. The Postgres function also enforces this. Call `awardXP(session.user.id, 25)` from `practiceLogService.js` after a successful INSERT.

---

### Pattern 8: `getCalendarDate()` Helper

**What:** Produces `"YYYY-MM-DD"` in local timezone for a given Date. Defined in `streakService.js` but NOT exported. Phase 2 can either:
- (a) Duplicate the 4-line function in `practiceLogService.js` and `practiceStreakService.js`
- (b) Extract it to `src/utils/dateUtils.js` as a shared export

**Recommendation:** Option (b) — extract to `dateUtils.js`. This avoids duplication across two new service files. `streakService.js` can also be updated to import from the shared util.

```javascript
// src/utils/dateUtils.js (new)
export function getCalendarDate(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

---

### Pattern 9: i18n Translation Keys (INFRA-05)

**What:** New `practice` namespace under `common` in both locale files.

**All strings from UI-SPEC (verified):**
```json
// locales/en/common.json — add under "practice" key
{
  "practice": {
    "card": {
      "title": "Practice Instrument",
      "prompt": "Did you practice today?",
      "logButton": "Yes, I practiced!",
      "loggingText": "Logged!",
      "xpBadge": "+25 XP",
      "completedHeading": "Practiced today!",
      "xpEarned": "+{{xp}} XP earned"
    },
    "streak": {
      "dayLabel": "day practice streak",
      "dayLabel_plural": "day practice streak"
    }
  }
}
```

**Hebrew keys:** Same structure in `locales/he/common.json` with translated values. Hebrew uses RTL — `i18next` `count` interpolation handles Hebrew pluralization when `_plural` suffix is used.

---

### Anti-Patterns to Avoid

- **Do NOT add practice streak to UnifiedStatsCard** (D-04). The component is presentational and receives only props from Dashboard.jsx. UnifiedStatsCard already shows `streakCount` (app-usage streak). A second streak prop would entangle two different behavioral domains.
- **Do NOT merge practiceStreakService into streakService** (D-12). The two streak types have different update triggers: app-usage updates on any game completion; practice updates on explicit log tap.
- **Do NOT use UTC date for `practiced_on`** (INFRA-04). `new Date().toISOString().split('T')[0]` is UTC and will give the wrong date for students in UTC+ timezones after 8pm local time. Always use `getCalendarDate(new Date())`.
- **Do NOT derive `practiced_on` from server-side `NOW()`** in SQL. The `DEFAULT NOW()` on `created_at` is fine for audit, but `practiced_on` must come from the client JS date string.
- **Do NOT show "0-day practice streak"** — UI-SPEC specifies hiding the streak row when count is 0 (demotivating for 8-year-olds; zero-state CTA is deferred to v3+).
- **Do NOT call `award_xp()` unconditionally** — only when `INSERT` returns a new row (D-14). Check for `23505` unique violation code and treat it as a success with `inserted: false`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XP award | Custom XP update | `award_xp()` RPC | Has auth check, level calculation, leveled_up flag — already correct |
| Weekend-pass streak gap | New algorithm | Copy `_effectiveDayGap()` from `streakService.js` | Already handles Fri/Sat skipping correctly for Israeli Shabbat; battle-tested |
| Local timezone date | Manual timezone math | `getCalendarDate()` helper | Correct, tested pattern — avoids UTC/local drift bug |
| Animation tokens | `window.matchMedia` query | `useMotionTokens` hook (`src/utils/useMotionTokens.js`) | Existing hook that reads `AccessibilityContext.reducedMotion` |
| Glass card styling | Custom CSS | Tailwind glass pattern from DailyChallengeCard | `rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md` |
| Translation pluralization | Manual count logic | i18next `count` interpolation | Built-in, handles Hebrew correctly |

---

## Common Pitfalls

### Pitfall 1: UTC Date Bug for `practiced_on`

**What goes wrong:** Student practices at 9pm in Israel (UTC+3). `new Date().toISOString()` returns `"2026-03-24T18:00:00.000Z"` — the date component is March 24, not March 25 (the local date the student sees). The practice log records the wrong day.

**Why it happens:** `toISOString()` always returns UTC. For users east of UTC+0, evening sessions are always "yesterday" in UTC.

**How to avoid:** Always use `getCalendarDate(new Date())` which reads local year/month/day. Verified the existing codebase uses this in `streakService.js` for all date comparisons.

**Warning signs:** Test with a timezone offset — mock `Date` to return a time that is the next calendar day in UTC vs. local.

---

### Pitfall 2: Double XP Award on Network Retry

**What goes wrong:** Student taps, network times out, React Query retries the mutation. The INSERT succeeds on retry but `award_xp()` has already been called (or is called again), awarding 25 XP twice.

**Why it happens:** Mutation retry logic re-runs the entire `mutationFn`.

**How to avoid:** The service layer checks the INSERT result: if `error.code === '23505'` (unique_violation), the log already exists — return `{ inserted: false }` and do NOT call `award_xp()`. The idempotency is enforced by the UNIQUE constraint at the DB level. The JS layer just needs to inspect the error code rather than re-throwing.

**Warning signs:** Any mutation retry that calls `award_xp()` without checking `inserted === true` first.

---

### Pitfall 3: Dashboard.jsx Placement Order

**What goes wrong:** `PracticeLogCard` is placed after `DailyChallengeCard` instead of before it (incorrect per D-02).

**Why it happens:** The current Dashboard.jsx has several sections between UnifiedStatsCard and DailyChallengeCard (PRACTICE TOOLS, COMEBACK BONUS BANNER, PUSH OPT-IN CARD). It's easy to insert in the wrong position.

**How to avoid:** The exact target position is between `{/* UNIFIED STATS CARD */}` and `{/* PRACTICE TOOLS (3 circular buttons) */}` sections (around line 696 in current Dashboard.jsx). The card goes immediately after the closing `)}` of the UnifiedStatsCard block.

---

### Pitfall 4: RLS Blocks Practice Streak Update

**What goes wrong:** The `instrument_practice_streak` table uses `FOR ALL` policy (same as `current_streak`) but `UPDATE` permission is not granted to `authenticated` role — only SELECT and INSERT. The upsert fails silently.

**Why it happens:** Supabase RLS is row-level; GRANT controls operation-level. Both must be set.

**How to avoid:** Migration must include both `CREATE POLICY ... FOR ALL` AND `GRANT SELECT, INSERT, UPDATE ON instrument_practice_streak TO authenticated`. Verified: `current_streak` uses `FOR ALL` policy — copy that exact pattern.

---

### Pitfall 5: React Query Cache Stale After Log

**What goes wrong:** Student logs practice, button transitions to "Practiced today!", but on next page visit (or after 5-minute staleTime), the query refetches and briefly shows the "Did you practice today?" prompt before resolving to logged state.

**Why it happens:** `staleTime` default is 0. If set too low, the loading flash is visible.

**How to avoid:** Set `staleTime: 5 * 60 * 1000` (5 minutes) — today's log status cannot change during the session (it can only go from `false` to `true`, never back). Also, after the mutation succeeds, call `queryClient.setQueryData(['practice-log-today', userId, dateString], { logged: true })` for instant cache update without a network round-trip.

---

### Pitfall 6: `Piano` Icon Already Imported in Dashboard

**What goes wrong:** Attempting to add a new import for `Piano` from lucide-react in Dashboard.jsx causes a lint warning about duplicate imports.

**Why it happens:** `Piano` is already imported at line 10 of Dashboard.jsx for the "History" practice tool icon.

**How to avoid:** `PracticeLogCard` imports `Piano` from lucide-react independently (it's a self-contained component). No change needed in Dashboard.jsx imports for the icon.

---

## Code Examples

### Verified: DailyChallengeCard loading skeleton (template for PracticeLogCard)

```jsx
// Source: src/components/dashboard/DailyChallengeCard.jsx lines 85-92
if (isLoading || !challenge) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-3 h-5 w-28 animate-pulse rounded bg-white/10" />
      <div className="h-12 animate-pulse rounded-lg bg-white/5" />
    </div>
  );
}
```

### Verified: DailyChallengeCard completed state pattern (template for logged state)

```jsx
// Source: src/components/dashboard/DailyChallengeCard.jsx lines 95-147
if (isCompleted) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
        <Zap className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">...</h3>
      </div>
      {/* Completed content */}
      <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3">
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-300">Challenge Complete!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Verified: award_xp() RPC call pattern

```javascript
// Source: src/utils/xpSystem.js lines 228-232
const { data, error } = await supabase.rpc('award_xp', {
  p_student_id: studentId,
  p_xp_amount: xpAmount
});
if (error) throw error;
const result = data[0]; // { new_total_xp, new_level, leveled_up }
```

### Verified: React Query mutation in service pattern (from Dashboard.jsx queries)

```javascript
// Query key pattern: [keyName, userId, dateString]
const dateString = new Date().toISOString().split('T')[0];  // DailyChallengeCard line 19
useQuery({
  queryKey: ['daily-challenge', user?.id, dateString],
  queryFn: () => getTodaysChallenge(user.id),
  enabled: !!user?.id,
});
```

### Verified: Motion-gated animation wrapper from Dashboard.jsx

```jsx
// Source: Dashboard.jsx lines 536, 665-671
const MotionOrDiv = reducedMotion ? 'div' : motion.div;
<MotionOrDiv
  {...(!reducedMotion && {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  })}
>
```

### Verified: getCalendarDate helper (from streakService.js lines 46-49)

```javascript
function getCalendarDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

### Verified: Unique violation error code handling

```javascript
// PostgreSQL error code 23505 = unique_violation
// This is the expected pattern for idempotent inserts
if (error.code === '23505') {
  return { inserted: false };  // Already logged today — not an error
}
```

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code/config changes (SQL migrations + React components + service files). No external tools beyond existing Supabase project are required. Supabase project is already configured and running.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (detected: `vitest.config.js`) |
| Config file | `vitest.config.js` |
| Quick run command | `npx vitest run src/services/practiceLogService.test.js` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-03 | UNIQUE constraint blocks duplicate `(student_id, practiced_on)` | unit (service layer) | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 |
| INFRA-04 | `getCalendarDate()` returns local date, not UTC | unit | `npx vitest run src/utils/dateUtils.test.js` | ❌ Wave 0 |
| LOG-03 | `logPractice()` returns `{ inserted: false }` on 23505 error (no double XP) | unit (service) | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 |
| LOG-03 | `logPractice()` returns `{ inserted: true }` on first successful INSERT | unit (service) | `npx vitest run src/services/practiceLogService.test.js` | ❌ Wave 0 |
| STRK-02 | `updatePracticeStreak()` with `weekendPassEnabled=true` counts Fri+Sat as non-break | unit (service) | `npx vitest run src/services/practiceStreakService.test.js` | ❌ Wave 0 |
| STRK-02 | `updatePracticeStreak()` with `weekendPassEnabled=false` breaks streak across Fri+Sat | unit (service) | `npx vitest run src/services/practiceStreakService.test.js` | ❌ Wave 0 |
| LOG-01, LOG-02 | PracticeLogCard renders loading state, active state, completed state | component (RTL=false) | `npx vitest run src/components/dashboard/PracticeLogCard.test.jsx` | ❌ Wave 0 |
| INFRA-05 | All `practice.*` i18n keys present in en/common.json | unit | `npx vitest run src/utils/dateUtils.test.js` | ❌ Wave 0 (manual check acceptable) |

**Manual-only tests (no automation):**
- Database migration runs without error on Supabase: run `supabase db push` locally
- RLS policy prevents student A from reading student B's logs: verify via Supabase table editor
- `award_xp()` RPC awards exactly 25 XP once: verify via Supabase RPC call test

### Sampling Rate

- **Per task commit:** `npx vitest run` on the specific test file for that task
- **Per wave merge:** `npm run test:run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/utils/dateUtils.test.js` — covers INFRA-04 (`getCalendarDate` timezone safety)
- [ ] `src/services/practiceLogService.test.js` — covers LOG-03 (idempotency: unique_violation → `inserted: false`)
- [ ] `src/services/practiceStreakService.test.js` — covers STRK-02 (weekend pass logic, streak gap calculation)
- [ ] `src/components/dashboard/PracticeLogCard.test.jsx` — covers LOG-01, LOG-02 (3-state rendering)

*(The dateUtils and service tests can be pure unit tests with Supabase mocked — same pattern as `src/utils/xpSystem.test.js` which imports from the module without needing a live DB.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate streak components | Inline streak in containing card (D-03) | Phase 2 design decision | PracticeLogCard owns its own streak display — no separate StreakDisplay component needed |
| UTC timestamp for dates | Local-timezone DATE string | Established in streakService.js | All date comparisons use `getCalendarDate()` helper |

**Nothing deprecated for this phase.** All patterns used are current project standards.

---

## Open Questions

1. **Who reads `weekend_pass_enabled` for practice streak?**
   - What we know: `current_streak.weekend_pass_enabled` is the user's setting. `instrument_practice_streak` table will need to apply the same rule.
   - What's unclear: Should `instrument_practice_streak` store a duplicate `weekend_pass_enabled` column, or should `practiceStreakService.js` always join/fetch from `current_streak`?
   - Recommendation: In Phase 2, join `current_streak.weekend_pass_enabled` during `updatePracticeStreak()` call. Add a `weekend_pass_enabled` column to `instrument_practice_streak` as a denormalized copy if performance demands it later. This avoids a new Settings toggle in Phase 2 scope.

2. **Query invalidation scope after practice log**
   - What we know: After logging, the practice streak count changes. The `["practice-log-today"]` query needs invalidation. The streak query (`["practice-streak", userId]`) also needs invalidation.
   - What's unclear: Does Dashboard.jsx need a top-level `useQuery` for practice streak, or can PracticeLogCard manage it internally?
   - Recommendation: PracticeLogCard manages both queries internally (same self-contained pattern as DailyChallengeCard). No props or queries needed at Dashboard.jsx level.

---

## Sources

### Primary (HIGH confidence)

- `src/components/dashboard/DailyChallengeCard.jsx` — Template component; verified glass card, 3-state pattern, query key convention, RTL pattern, completed state styling
- `src/services/streakService.js` — Architectural blueprint for practiceStreakService; verified `getCalendarDate()`, `_effectiveDayGap()`, `allIntermediateDaysAreWeekend()`, cooldown guards, upsert patterns
- `src/components/layout/Dashboard.jsx` — Verified card insertion point (after line 695), confirmed `Piano` icon already imported, confirmed `reducedMotion` + `isRTL` + `isStudent` guard patterns
- `supabase/migrations/20260322000001_add_feedback_submissions.sql` — Reference for table structure, RLS policies, GRANT pattern
- `supabase/migrations/20260305000001_streak_protection.sql` — Reference for CHECK constraints, column documentation comments
- `supabase/migrations/20260201000001_coppa_schema.sql` — Verified `ON DELETE CASCADE` FK pattern on all student-linked tables
- `supabase/migrations/20260127000002_fix_search_path_warnings.sql` — Verified `award_xp()` signature: `(p_student_id UUID, p_xp_amount INTEGER)` returns `TABLE(new_total_xp, new_level, leveled_up)`
- `src/utils/xpSystem.js` — Verified `awardXP()` JS wrapper call pattern (`supabase.rpc('award_xp', ...)`)
- `.planning/phases/02-data-foundation-and-core-logging/02-UI-SPEC.md` — All visual states, copy strings, i18n key names, spacing, color values verified
- `vitest.config.js` + `src/test/setupTests.js` — Test infrastructure verified (Vitest + jsdom + @testing-library/jest-dom)

### Secondary (MEDIUM confidence)

- PostgreSQL error code `23505` for unique_violation — standard Postgres error code, applies to Supabase which uses PostgreSQL

### Tertiary (LOW confidence)

None.

---

## Project Constraints (from CLAUDE.md)

These directives are **mandatory** and override any research recommendations that contradict them:

1. **SVG imports:** Use `import Icon from './icon.svg?react'` with `?react` suffix (vite-plugin-svgr). Not applicable to this phase (no SVG file imports).
2. **Pre-commit hook:** Husky + lint-staged runs ESLint + Prettier on staged files. All new files must be ESLint-clean before commit.
3. **Glass card pattern:** `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg` — mandatory for new dashboard card. Confirmed by UI-SPEC.
4. **Text colors:** `text-white` (primary), `text-white/70` (secondary), `text-white/60` (tertiary). Accent numbers use `-300` variants. All confirmed in UI-SPEC.
5. **TanStack React Query v5:** Use `useQuery` and `useMutation` from `@tanstack/react-query`. Query key as array. `staleTime` required on low-frequency data.
6. **Supabase auth pattern:** Always use `supabase.auth.getSession()` (not `getUser()`) in service layer for performance (session is cached; `getUser()` hits the network).
7. **Migration naming:** `YYYYMMDD000001_description.sql` — new migration file must follow this convention.
8. **i18n:** `useTranslation(['common'])` — all strings via i18n, no hardcoded English in JSX.
9. **Testing:** Test files as `*.test.{js,jsx}` siblings or in `__tests__/` directories. Use `@testing-library/react` for component tests, plain Vitest for service/util tests.
10. **COPPA compliance:** All student data tables require `ON DELETE CASCADE` on the FK to `students(id)`. Non-negotiable.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified as installed in package.json; no new packages needed
- Architecture: HIGH — all patterns verified from actual source files (streakService.js, DailyChallengeCard.jsx, migration files)
- Pitfalls: HIGH — UTC date bug, double XP, 23505 handling all verified from existing service code patterns
- Test map: HIGH — Vitest infrastructure confirmed; test file paths follow established `*.test.js` sibling convention

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase; patterns won't drift)
