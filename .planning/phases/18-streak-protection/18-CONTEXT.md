# Phase 18: Streak Protection - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the streak system from a punitive midnight-cutoff counter into a forgiving, motivating mechanic. Adds streak freeze consumables (earned every 7 days, max 3), a 36-hour grace window from last practice time, auto-consume freeze on miss, 2x XP comeback bonus for 3 days after a broken streak, and a parent-gated weekend pass toggle (Friday + Saturday). Does not change game mechanics, XP level system structure, or notification content.

</domain>

<decisions>
## Implementation Decisions

### Streak Freeze Earning
- Earn 1 freeze for every 7-day streak milestone (day 7, 14, 21, 28, etc.)
- Maximum inventory cap of 3 freezes — earning at cap does not add more
- Toast notification on earn: "You earned a Streak Freeze!" with freeze icon
- Freeze count persisted in database (new column or table for inventory)

### Streak Freeze Display
- Freeze count shown inside the existing StreakDisplay card component (not a separate card)
- Small freeze icon + count (e.g., "2x snowflake") below the streak counter in the card variant
- Minimal new UI — keeps streak info centralized in one component

### Grace Period (36 hours)
- Grace window calculated from last practice timestamp, NOT from midnight
- A student who practices at 11pm has until 11am two days later (36 hours)
- Grace is the primary protection layer — no freeze consumed during grace window
- If grace expires AND student has a freeze, freeze is auto-consumed (two layers)
- If grace expires AND no freeze available, streak breaks

### Grace Period UI
- During grace window (haven't practiced yet today): StreakDisplay shows amber/yellow warning state
- Message: "Practice today to keep your streak!" — encouraging, not alarming
- No countdown timer — just the nudge

### Freeze Auto-Consume Notification
- On next login after a freeze was consumed: toast "A Streak Freeze saved your streak!"
- StreakDisplay briefly annotates "Freeze used yesterday" in the card
- Student understands what happened without confusion

### Comeback Bonus
- 2x XP multiplier for 3 days after a streak breaks (past grace + freeze exhausted)
- Activates on first exercise completion after the streak breaks (NOT on login)
- Prevents "open and close app" from consuming the bonus window
- Multiplier applies to total XP (base + all bonuses), not just base XP
- Available every time a streak breaks — no monthly or lifetime limit
- 8-year-olds won't game the system; always give a reason to come back

### Comeback Bonus UI
- Dashboard: prominent "2x XP Active! X days left" banner
- VictoryScreen: small "2x" badge near the XP counter showing the doubled amount
- Two touchpoints: awareness (dashboard) + reinforcement (in-game)

### Weekend Pass
- Toggle in AppSettings only (not ParentPortal, not teacher dashboard)
- Under a "Streak Settings" or "Practice Schedule" section
- Requires COPPA parent gate (reuse ParentGateMath from Phase 17)
- Once parent_consent_granted is true, subsequent toggles skip the gate
- Covers Friday + Saturday (Israeli user base, Shabbat-aligned)
- When active, streak evaluation skips Fri/Sat entirely — Thursday practice connects to Sunday
- Skip is silent — streak counter just doesn't count those days, no badge or indicator
- A student practicing on Fri/Sat still gets XP and progress, the day just isn't required for streak

### Claude's Discretion
- Database schema for streak freeze inventory (column on students vs. new table)
- Exact streak evaluation algorithm refactor in streakService.js
- How to track comeback bonus state (start date, expiry)
- Grace period calculation edge cases (timezone handling)
- Toast timing and duration for freeze-related notifications
- StreakDisplay component layout adjustments for freeze count
- Dashboard banner design for comeback bonus
- Whether MAINTAIN_STREAK daily goal logic needs updating for grace window

</decisions>

<specifics>
## Specific Ideas

- Grace + freeze = two layers of safety for 8-year-olds who can't control their schedule
- Weekend pass uses Friday + Saturday specifically for Israeli families (Shabbat)
- Comeback bonus on first exercise (not login) prevents window waste
- The whole system should feel protective, not punitive — "we've got your back"

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/streakService.js`: Current streak CRUD with `getStreak()`, `updateStreak()`, `getLastPracticeDate()` — core refactor target for 36-hour grace window
- `src/components/streak/StreakDisplay.jsx`: Card variant with milestone tiers, progress bar — integration point for freeze count and grace warning
- `src/hooks/useStreakWithAchievements.js`: Mutation hook that updates streak + checks achievements — needs freeze earn check added
- `src/components/settings/ParentGateMath.jsx`: COPPA math gate component from Phase 17 — reuse for weekend pass toggle
- `src/utils/xpSystem.js`: `calculateNodeXP()`, `awardXP()`, XP_REWARDS bonuses — integration point for 2x comeback multiplier
- `src/components/games/VictoryScreen.jsx`: Shows XP earned — needs 2x badge when comeback active
- `src/pages/AppSettings.jsx`: Settings page with sections — add "Streak Settings" section with weekend pass toggle

### Established Patterns
- Database views: `current_streak`, `last_practiced_date`, `highest_streak` — streak state stored via Supabase views/tables
- Streak uses client-side calendar day comparison with `getCalendarDate()` helper
- `streakService.updateStreak()` does upsert on `current_streak` table
- Toast notifications via `react-hot-toast` (used throughout app)
- ParentGateMath pattern: math verification, DB flag `parent_consent_granted`, subsequent toggles skip gate

### Integration Points
- `streakService.js` `updateStreak()`: Refactor midnight-cutoff to 36-hour grace window + freeze auto-consume
- `StreakDisplay.jsx`: Add freeze count display, amber grace warning state
- `Dashboard.jsx`: Add comeback bonus banner when active
- `VictoryScreen.jsx`: Add 2x XP badge when comeback bonus active
- `xpSystem.js`: Apply 2x multiplier in XP calculation when comeback active
- `AppSettings.jsx`: Add weekend pass toggle section with parent gate
- `dailyGoalsService.js`: MAINTAIN_STREAK goal may need updating for grace window semantics
- Database: New columns/table for freeze inventory, weekend pass flag, comeback bonus state

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-streak-protection*
*Context gathered: 2026-03-04*
