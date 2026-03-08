---
phase: 02-refactor-score-vs-xp-unify-into-xp-only-scoring-system
verified: 2026-03-08T11:09:08Z
status: passed
score: 15/15 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 14/15
  gaps_closed:
    - "No user-visible text says 'points' -- only 'XP' (TeacherDashboard.jsx fully migrated)"
  gaps_remaining: []
  regressions: []
---

# Phase 2: Refactor score vs XP - unify into XP-only scoring system Verification Report

**Phase Goal:** Eliminate the parallel "points" reward system and unify all player rewards under the existing XP system. The students_score table stays (raw game data for analytics/goals), but "points" as a user-facing concept is removed. All reward signals become XP. Teacher views switch to XP-based analytics.
**Verified:** 2026-03-08T11:09:08Z
**Status:** passed
**Re-verification:** Yes -- after gap closure (Plan 02-05)

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Achievement rewards call awardXP() instead of updateUserPoints() | VERIFIED | achievementService.js line 7 imports awardXP; line 202 calls `await awardXP(studentId, achievement.points)`. No `updateUserPoints` exists anywhere. |
| 2  | Free play games can earn XP via calculateFreePlayXP() | VERIFIED | xpSystem.js line 360 exports `calculateFreePlayXP`. useVictoryState.js line 479 calls it in free play branch. |
| 3  | Accessory unlock 'points_earned' type evaluates against total_xp | VERIFIED | accessoryUnlocks.js lines 54-58: dual case `xp_earned`/`points_earned` checks `userProgress.totalXP`. |
| 4  | points.js, useTotalPoints.js, and scoreComparisonService.js are deleted | VERIFIED | All three files confirmed absent from filesystem. Zero references to any of them across src/. |
| 5  | HIGH_SCORER achievement uses XP-based condition | VERIFIED | achievementService.js: `condition: "total_xp >= 1000"`, category: `"xp"`. |
| 6  | Free play VictoryScreen shows '+X XP' instead of '+X points' | VERIFIED | VictoryScreen.jsx: free play XP badge uses `t('victory.xpEarned', { xp: animatedXPGain })`. No points references. |
| 7  | Free play VictoryScreen awards XP via awardXP() using calculateFreePlayXP() | VERIFIED | useVictoryState.js line 479: `calculateFreePlayXP(scorePercentage, ...)` then line 481: `awardXP(user.id, freePlayXP)`. |
| 8  | Dashboard no longer imports or uses useTotalPoints | VERIFIED | Dashboard.jsx line 36: imports `getStudentXP` from xpSystem.js. No `useTotalPoints` reference. |
| 9  | No React Query key 'total-points' or 'pre-total-points' exists in codebase | VERIFIED | grep across entire src/ returns zero matches for both patterns. |
| 10 | useVictoryState no longer imports useTotalPoints or scoreComparisonService | VERIFIED | useVictoryState.js line 12 imports `awardXP, calculateSessionXP, calculateFreePlayXP` from xpSystem. No deleted module references. |
| 11 | Avatars page shows XP balance for accessory purchases | VERIFIED | Avatars.jsx line 163: `availableXP = pointsBalance?.available`; line 176: `totalXP: pointsBalance?.earned`; line 866-867: uses `t("avatars.shop.availableXP")`. |
| 12 | Achievements page shows XP totals instead of points totals | VERIFIED | Achievements.jsx line 69: queries `students.total_xp`; line 245: uses `xpReward` i18n key. |
| 13 | All 'points' i18n keys are replaced with XP equivalents in both en and he | VERIFIED | Both common.json files contain `xpEarned`, `xpReward`, `availableXP`, `notEnoughXP`, `xpSpent`, `xpEarnedDescription`, etc. Components use new XP keys. |
| 14 | Teacher charts show XP instead of points | VERIFIED | TopPerformersLeaderboard.jsx: reads `student.total_xp`, imports `calculateLevel`. ClassPerformanceChart.jsx: maps `student.total_xp`, dataKey `"xp"`. AnalyticsDashboard.jsx: dropdown value `"xp"`. |
| 15 | No user-visible text says 'points' -- only 'XP' | VERIFIED | **GAP CLOSED.** TeacherDashboard.jsx now uses `total_xp` throughout (lines 1131, 1135, 1457, 1721-1724, 1755-1756, 2197-2198, 2324-2336, 2523-2525). apiTeacher.js returns `total_xp` and `current_level` from students table (lines 116, 138-139, 223-224, 397). Zero `total_points` references remain in entire src/ directory. Only `cursor-pointer` CSS class contains the substring "point". |

**Score:** 15/15 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/xpSystem.js` | calculateFreePlayXP function | VERIFIED | Exported at line 360; included in default export at line 415 |
| `src/services/achievementService.js` | XP-based achievement awarding | VERIFIED | Imports awardXP (line 7); calls it in awardAchievement (line 202) |
| `src/utils/accessoryUnlocks.js` | XP-based unlock checks | VERIFIED | Uses totalXP (line 58); dual case xp_earned/points_earned (lines 54-55) |
| `src/services/apiAccessories.js` | total_xp query | VERIFIED | getUserPointBalance queries students.total_xp (line 141) |
| `src/hooks/useVictoryState.js` | Unified XP for trail + free play | VERIFIED | Imports calculateFreePlayXP (line 12); free play XP path (lines 479-481) |
| `src/components/games/VictoryScreen.jsx` | XP display for free play | VERIFIED | Free play XP badge; no points references |
| `src/components/layout/Dashboard.jsx` | Dashboard without points | VERIFIED | No useTotalPoints import; uses getStudentXP (line 36) |
| `src/components/Avatars.jsx` | XP-based accessory UI | VERIFIED | availableXP, earnedXP, spentXP variables; totalXP in userProgress |
| `src/pages/Achievements.jsx` | XP-based achievement display | VERIFIED | Direct total_xp query; XP reward labels |
| `src/locales/en/common.json` | English XP translations | VERIFIED | Contains xpEarned, xpReward, availableXP, notEnoughXP, etc. |
| `src/locales/he/common.json` | Hebrew XP translations | VERIFIED | Mirrors English XP keys with Hebrew translations |
| `src/components/charts/TopPerformersLeaderboard.jsx` | XP-based leaderboard | VERIFIED | Metric "xp", reads total_xp, shows "X XP (Lv. Y)" format |
| `src/components/charts/ClassPerformanceChart.jsx` | XP-based performance chart | VERIFIED | Maps total_xp, dataKey "xp" |
| `src/components/charts/AnalyticsDashboard.jsx` | XP metric option | VERIFIED | Dropdown option value="xp" label="XP" |
| `supabase/migrations/20260308000001_drop_points_columns.sql` | Migration to drop points columns | VERIFIED | Drops achievement_points, student_achievements.points, calculate_score_percentile |
| `src/services/apiTeacher.js` | Student objects with total_xp | VERIFIED | Queries total_xp, current_level from students table (line 116); assigns to student objects (lines 138-139, 223-224) |
| `src/components/layout/TeacherDashboard.jsx` | XP-based teacher UI | VERIFIED | Shows "Total XP" (line 1131), sorts by total_xp (lines 1755-1756), filters by xpRange (lines 1721-1724), student list shows XP (line 2523) |
| `src/utils/points.js` | DELETED | VERIFIED | File does not exist |
| `src/hooks/useTotalPoints.js` | DELETED | VERIFIED | File does not exist |
| `src/services/scoreComparisonService.js` | DELETED | VERIFIED | File does not exist |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| achievementService.js | xpSystem.js | import awardXP | WIRED | Line 7: import; line 202: await call |
| apiAccessories.js | students table | total_xp query | WIRED | Line 141: `.select("total_xp")`; line 151: reads result |
| useVictoryState.js | xpSystem.js | import calculateFreePlayXP, awardXP | WIRED | Line 12: imports; lines 479-481: calls both in free play path |
| VictoryScreen.jsx | useVictoryState.js | xpData for free play | WIRED | Destructures xpData; renders XP badge for non-trail games |
| Avatars.jsx | useAccessories.js | usePointBalance (returns XP) | WIRED | Imports usePointBalance; uses availableXP, earnedXP values |
| TopPerformersLeaderboard.jsx | students table | total_xp field | WIRED | Reads a.total_xp for sorting; displays with calculateLevel |
| apiTeacher.js | students table | select total_xp, current_level | WIRED | Line 116: selects both fields; lines 138-139: maps to student objects |
| TeacherDashboard.jsx | student.total_xp | display and filter/sort logic | WIRED | Line 1135: displays total_xp; lines 1721-1724: xpRange filter; lines 1755-1756: sort by total_xp |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| XP-SERVICE | 02-01 | Service layer uses XP exclusively | SATISFIED | awardXP replaces updateUserPoints; apiAccessories reads total_xp |
| XP-ACHIEVE | 02-01 | Achievement system uses XP | SATISFIED | achievementService imports/calls awardXP; HIGH_SCORER uses total_xp condition |
| XP-DEAD-CODE | 02-01 | Dead code files removed | SATISFIED | points.js, useTotalPoints.js, scoreComparisonService.js all deleted; zero references remain |
| XP-FREEPLAY | 02-02 | Free play games award XP | SATISFIED | calculateFreePlayXP in xpSystem; called in useVictoryState free play path |
| XP-VICTORY | 02-02 | VictoryScreen shows XP for all modes | SATISFIED | Both trail and free play show XP badge; no points display |
| XP-DASHBOARD | 02-02 | Dashboard free of points references | SATISFIED | No useTotalPoints import; uses getStudentXP |
| XP-HOOKS | 02-02 | All hooks clean of points queries | SATISFIED | Zero total-points/pre-total-points query keys in codebase |
| XP-AVATARS | 02-03 | Avatars use XP for purchases | SATISFIED | availableXP, earnedXP; XP i18n keys; totalXP in progress |
| XP-ACHIEVEMENTS | 02-03 | Achievements display XP | SATISFIED | Queries total_xp; shows XP reward labels |
| XP-I18N | 02-03 | Both en/he translations use XP | SATISFIED | Both files contain new XP keys; old keys kept for backward compat |
| XP-TEACHER | 02-04, 02-05 | Teacher views use XP | SATISFIED | Chart components (02-04) and TeacherDashboard (02-05) fully migrated. apiTeacher.js returns total_xp from students table. |
| XP-DB-CLEANUP | 02-04 | DB migration drops points columns | SATISFIED | Migration drops achievement_points, student_achievements.points, calculate_score_percentile |

All 12 requirement IDs from the ROADMAP are accounted for and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | - |

No anti-patterns found. Previous anti-patterns (calculateGameplayPoints stub and total_points references in TeacherDashboard.jsx) were resolved by Plan 02-05.

### Human Verification Required

### 1. Free Play XP Award Flow

**Test:** Complete a free play game (from /practice-modes) with a non-zero score and check the VictoryScreen.
**Expected:** VictoryScreen shows "+X XP" badge (blue gradient, same style as trail mode). The XP amount should be 10-50 based on score percentage.
**Why human:** Cannot verify visual rendering and the full XP award -> DB -> cache invalidation flow programmatically.

### 2. Accessory Purchase with XP

**Test:** Navigate to /avatars, check that the balance shows "X XP available", and attempt to purchase an accessory.
**Expected:** Balance displayed as XP. Purchase deducts from XP pool. "Not enough XP" message appears if insufficient.
**Why human:** Cannot verify the full purchase flow and correct display of XP values.

### 3. Teacher Dashboard XP Display (NEW -- verifying gap closure)

**Test:** Log in as a teacher and navigate to the student list view. Click into a student detail modal.
**Expected:** Student list cards show "X XP" (not "pts" or "Points"). Student detail modal header shows "Total XP" with level info. Sort dropdown has "XP High-Low" / "XP Low-High" options. Filter dropdown shows "XP" range options. Charts show correct XP values (not 0).
**Why human:** Cannot verify the full teacher UI rendering, especially that charts now receive correct total_xp data from apiTeacher.js (fixes the latent 0-value bug).

### 4. Achievement XP Rewards

**Test:** View the Achievements page and check that earned achievements show "+X XP" instead of "+X points".
**Expected:** Stats summary shows "Total XP" with value from students.total_xp. Achievement rewards display as "+X XP". Hebrew translations work correctly.
**Why human:** Cannot verify visual rendering and i18n display.

### Gap Closure Summary

The single gap from the initial verification -- TeacherDashboard.jsx having 7 `total_points` references -- has been fully resolved by Plan 02-05:

- **apiTeacher.js** (commit d041c10): Removed 77 lines of points RPC + fallback computation. Now reads `total_xp` and `current_level` directly from the students table. Student objects include `total_xp` and `current_level` fields.
- **TeacherDashboard.jsx** (commit 7aaa7e3): Replaced all points references with XP. Removed `calculateGameplayPoints` stub and `getAchievementPointsTotal` import. Student detail modal shows "Total XP" with level info. Filters use `xpRange`, sort uses `total_xp`, student cards show XP.

**Codebase-wide confirmation:** `grep -rn "total_points" src/` returns zero matches. The "points" concept no longer exists anywhere in user-facing code.

No regressions detected. All 14 previously-verified truths remain intact.

---

_Verified: 2026-03-08T11:09:08Z_
_Verifier: Claude (gsd-verifier)_
