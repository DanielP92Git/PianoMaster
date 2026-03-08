# Phase 2: Refactor Score vs XP - Unify into XP-Only Scoring System - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate the parallel "points" reward system and unify all player rewards under the existing XP system. The `students_score` table stays (raw game data for analytics/goals), but "points" as a user-facing concept is removed. All reward signals become XP. Teacher views switch to XP-based analytics.

</domain>

<decisions>
## Implementation Decisions

### Free play rewards
- Free play sessions award XP (same XP pool as trail — contributes to leveling)
- VictoryScreen shows "+X XP" for both trail and free play (no more "+X points")
- XP calculation formula for free play: Claude's discretion (score-based, flat, or hybrid)
- All i18n keys use "XP" language — remove "points" translation keys

### Achievement system conversion
- Achievement rewards convert from points to XP awards (same values: 50-500)
- Earning an achievement calls `awardXP()` instead of `updateUserPoints()`
- Achievement badges/icons/titles remain unchanged — only the reward currency changes
- HIGH_SCORER achievement ("Earn 1000 total points"): Claude's discretion on conversion (XP threshold or replace with level milestone)
- Drop `student_profiles.achievement_points` column via migration
- Drop `student_achievements.points` column via migration

### Accessory unlocks
- Avatars page switches from point-balance unlocks to XP-based (total_xp thresholds)
- `UnlockRequirementModal` reads total_xp instead of totalPoints

### Score data retention
- `students_score` table stays — raw game data is useful for daily goals, weekly progress, teacher analytics
- Stop aggregating scores into "points" in the UI
- Delete `scoreComparisonService.js` and the Postgres `calculate_score_percentile` function (already unused after Phase 1)
- Teacher dashboard analytics switch to XP-based views (ClassPerformanceChart, TopPerformersLeaderboard, etc.)

### Dashboard changes
- Remove "Total Points" stat card entirely (XP ring already covers progression)
- No replacement stat needed — dashboard already has XP ring + level display

### Migration strategy
- No points-to-XP conversion for existing users — XP stands on its own
- Points data stays in DB but is no longer surfaced

### Dead code removal
- Delete: `useTotalPoints.js`, `points.js`, `scoreComparisonService.js`, `progressMigration.js`
- Delete: Postgres `calculate_score_percentile` function
- Remove "points" references from Dashboard, Avatars, useScores invalidations
- Remove points-related i18n keys (en + he), use XP keys everywhere
- Clean up `useScores` hook — remove `total-points` and `pre-total-points` query invalidations

### Claude's Discretion
- Free play XP calculation formula (score-based vs flat vs hybrid)
- HIGH_SCORER achievement conversion approach
- Teacher analytics chart adaptations (what XP data to show, how to present it)
- Order of operations for the refactor (service layer first vs UI first vs DB first)

</decisions>

<specifics>
## Specific Ideas

- The unification should feel invisible to the child — they just see "+X XP" everywhere instead of sometimes points, sometimes XP
- Teacher views should show meaningful XP-based data (levels, progress, not raw XP numbers in isolation)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `xpSystem.js`: Complete XP infrastructure — `calculateNodeXP()`, `awardXP()`, `calculateSessionXP()`, `getLevelProgress()`. Already handles stars, bonuses, comeback multiplier
- `awardXP()` RPC: Secure Postgres function with auth.uid() check. Single entry point for all XP awards
- `useVictoryState` hook (Phase 1): Already handles XP display for trail mode — extend pattern to free play

### Established Patterns
- `awardXP(studentId, xpAmount)` → RPC → returns `{ newTotalXP, newLevel, leveledUp }`
- Achievement checking via `achievementService.checkForNewAchievements()` — runs after score save
- React Query invalidation pattern: invalidate `["scores"]`, `["earned-achievements"]` after game completion

### Integration Points
- `VictoryScreen.jsx` / `useVictoryState.js`: Currently branches on `nodeId` for trail vs free play. Unify to always show XP
- `Dashboard.jsx`: Remove `useTotalPoints` import and totalPoints stat card
- `Avatars.jsx`: Switch `pointsBalance` to `total_xp` threshold checks
- `achievementService.js`: `awardAchievement()` calls `updateUserPoints()` → change to `awardXP()`
- `useScores.js`: Remove `total-points` and `pre-total-points` query invalidations
- `useGameProgress.js`: Remove `total-points` cache reads
- Teacher components: `ClassPerformanceChart`, `TopPerformersLeaderboard`, `AnalyticsDashboard`, `PracticeActivityTimeline` — switch from score aggregation to XP-based data

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system*
*Context gathered: 2026-03-08*
