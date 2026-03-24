# Phase 2: Data Foundation and Core Logging - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Students can log daily instrument practice from the dashboard, earn XP for logging, and see a dedicated practice streak counter. This phase delivers: DB migration (two new tables with RLS), practice logging service, dashboard practice card, and practice streak logic with weekend freeze support.

</domain>

<decisions>
## Implementation Decisions

### Practice Card Design
- **D-01:** Standalone glass card — new dedicated card component (`PracticeLogCard.jsx`) in `src/components/dashboard/`, following DailyChallengeCard pattern.
- **D-02:** Card placement: immediately after UnifiedStatsCard (second position in dashboard card stack). Order: UnifiedStats -> PracticeLog -> DailyChallenge -> PlayNext -> ...
- **D-03:** Practice streak counter lives inline inside the practice card (not in UnifiedStatsCard). Single cohesive unit showing: prompt + log button + streak count.
- **D-04:** Practice streak appears only in the practice card — not duplicated in UnifiedStatsCard. App-usage streak stays in UnifiedStatsCard, practice streak stays in PracticeLogCard. Clean separation.

### Practice Streak Display
- **D-05:** Streak presentation: icon + count + label in a single row — `🎹 5-day practice streak`. Matches the existing fire-icon streak style for visual consistency.

### Logging Interaction
- **D-06:** Tap response: instant state change + micro-animation (checkmark). No modal, no confirmation prompt. Button immediately transitions to logged state. Respects reduced-motion.
- **D-07:** XP feedback: inline in button text. Sequence: `[ Yes, I practiced! ]` → tap → `[ ✓ Logged! +25 XP ]` (hold 2s) → settle to `[ ✓ Practiced today ]`. No toast notification.
- **D-08:** Already-logged state (returning to dashboard): card stays visible in subtle completed state — muted green tint, checkmark icon, "Practiced today!" text, disabled button. Streak count still visible. Follows DailyChallengeCard completed-state pattern.

### Streak Icon & Branding
- **D-09:** Practice streak icon: Piano keys icon from lucide-react (`Piano`). Directly communicates "instrument practice", clearly distinct from fire/flame app-usage streak.
- **D-10:** Practice card accent color: emerald/green (`emerald-400` border glow, `green-300` streak text, `bg-green-500/20` logged button). Contrasts with amber/orange fire streak and indigo/purple XP ring.

### Infrastructure (from roadmap — locked)
- **D-11:** `instrument_practice_logs` table with `local_date` DATE column (client timezone), UNIQUE constraint on `(student_id, practiced_on)`.
- **D-12:** `instrument_practice_streak` table — separate from `current_streak`. Independent service (`practiceStreakService.js`), not merged with existing `streakService.js`.
- **D-13:** ON DELETE CASCADE on both new tables for COPPA hard-delete compliance.
- **D-14:** XP award: 25 XP via `award_xp()` RPC, only when INSERT returns count === 1 (idempotent — no double award on re-tap or retry).
- **D-15:** Full EN/HE translations for all new UI elements.

### Claude's Discretion
- **D-16:** Practice card copy/messaging tone — Claude picks the best wording based on existing kid-friendly style (e.g., "Did you practice today?" vs "Time to practice!").
- **D-17:** Micro-animation implementation details — checkmark animation timing, easing, reduced-motion fallback approach.
- **D-18:** RLS policy specifics — exact policy definitions following existing patterns in migrations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dashboard & Card Patterns
- `src/components/layout/Dashboard.jsx` — Dashboard layout with card ordering, streak queries, XP queries
- `src/components/dashboard/DailyChallengeCard.jsx` — Reference pattern for standalone dashboard card (glass card, states, animation)
- `src/components/dashboard/UnifiedStatsCard.jsx` — Existing stats card with app-usage streak (do NOT add practice streak here)
- `src/components/dashboard/XPRing.jsx` — XP ring component (for understanding dashboard visual hierarchy)

### Streak & XP Patterns
- `src/services/streakService.js` — Existing app-usage streak service (reference for practice streak service architecture, weekend freeze logic, grace window)
- `src/utils/xpSystem.js` — XP system with `award_xp()` RPC usage, level calculation

### Database Patterns
- `supabase/migrations/20260305000001_streak_protection.sql` — Reference for streak table schema (current_streak table, weekend_pass, freeze fields)
- `supabase/migrations/20260322000001_add_feedback_submissions.sql` — Most recent migration (naming convention reference)
- `supabase/migrations/20260321000001_coppa_hard_delete.sql` — COPPA cascade delete patterns

### Design System
- `docs/DESIGN_SYSTEM.md` — Glass card pattern, text colors, button styles

### Existing Streak UI
- `src/components/streak/StreakDisplay.jsx` — Existing streak display component (fire icon pattern reference)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DailyChallengeCard.jsx` — Pattern for standalone dashboard card with multiple states (active/completed/loading). Direct template for PracticeLogCard.
- `streakService.js` — Weekend freeze logic (`isWeekendPassDay()`), grace window calculation, streak state machine. Practice streak service can mirror this architecture.
- `award_xp()` RPC — Existing Postgres function for XP awards with auth check (SECURITY DEFINER). Reuse directly.
- `getCalendarDate()` helper in streakService.js — Local timezone date formatting. Can be extracted or duplicated for practice service.
- `useMotionTokens` hook — Existing reduced-motion animation tokens. Use for checkmark micro-animation.

### Established Patterns
- Dashboard cards: glass card styling (`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl`), imported as named components in Dashboard.jsx.
- Data fetching: TanStack React Query with `useQuery` hook, query keys like `["streak", userId]`, `staleTime` for low-frequency data.
- Service layer: named exports for individual functions, Supabase client via `import supabase from "./supabase"`, cooldown/dedup guards.
- Migration naming: `YYYYMMDD000001_description.sql`.
- RLS policies: `auth.uid()` verification, CASCADE delete for COPPA.

### Integration Points
- `Dashboard.jsx` — Import and place PracticeLogCard after UnifiedStatsCard. Add useQuery for practice state.
- `locales/en/common.json` + `locales/he/common.json` — New `practice` namespace keys.
- `supabase/migrations/` — New migration file for both tables.
- `src/services/` — New `practiceLogService.js` (or `instrumentPracticeService.js`).

</code_context>

<specifics>
## Specific Ideas

- Practice card visual: emerald/green accent color scheme to differentiate from orange/amber fire streak and indigo/purple XP ring.
- Button state sequence: `[ Yes, I practiced! ]` → `[ ✓ Logged! +25 XP ]` (2s) → `[ ✓ Practiced today ]`.
- Streak format: `🎹 5-day practice streak` — icon + count + label in a single row.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-data-foundation-and-core-logging*
*Context gathered: 2026-03-24*
