---
phase: 04-parent-calendar-heatmap
verified: 2026-03-24T18:30:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Visual rendering of practice heatmap in parent portal"
    expected: "Heatmap card appears below subscription card at /parent-portal with emerald green cells for practiced days and neutral gray for others. Glass card styling visible. Summary stats row (days practiced, current streak, longest streak) renders above the grid."
    why_human: "React rendering and CSS visual output cannot be verified programmatically from source alone."
  - test: "Hebrew locale RTL rendering"
    expected: "In Hebrew locale, card header shows Piano icon on the right, Hebrew title text, heatmap grid is mirrored (most recent week rightmost), and stats row text is right-aligned. No mirrored month labels (showMonthLabels=false in RTL)."
    why_human: "CSS scaleX(-1) transform and RTL direction correctness requires visual inspection in a running browser."
  - test: "Empty state with no practice records"
    expected: "Full gray 52-week grid renders (all level=0 cells), and 'No practice logged yet' text appears below the grid."
    why_human: "Requires a parent account with no child practice logs to verify the real data state."
  - test: "Heatmap visibility regardless of subscription status"
    expected: "PracticeHeatmapCard renders both when effectiveDetail is null (no subscription) and when it is populated (active subscription)."
    why_human: "Requires testing two account states in a running browser."
---

# Phase 4: Parent Calendar Heatmap Verification Report

**Phase Goal:** Parents can see a 52-week rolling calendar of their child's instrument practice history in the parent portal
**Verified:** 2026-03-24T18:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Parent visits /parent-portal and sees a calendar heatmap spanning the past 52 weeks | ? HUMAN | PracticeHeatmapCard wired into ParentPortalPage.jsx (line 279-281), outside effectiveDetail conditional — visual confirmation required |
| 2 | Practiced days shown in emerald green (#34d399); non-practiced in neutral gray (rgba(255,255,255,0.15)); no red | ✓ VERIFIED | `theme={{ light: ['rgba(255,255,255,0.15)', '#34d399'] }}` confirmed in PracticeHeatmapCard.jsx lines 178, 196; no red color values in heatmap data path |
| 3 | Hebrew locale renders heatmap mirrored (most recent week rightmost, RTL) via scaleX(-1) | ✓ VERIFIED (code) / ? HUMAN (visual) | `style={{ transform: 'scaleX(-1)' }}` at line 176; direction:ltr wrapper at line 174; `isRTL = i18n.dir() === 'rtl'` condition verified in code |

**Automated score:** 9/9 artifact and link checks pass. 3/3 success criteria implementation verified in code. Human confirmation needed for 4 visual behaviors.

---

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/services/practiceLogService.js` | getHistoricalLogs, buildHeatmapData, computeLongestStreak | ✓ VERIFIED | All 3 exports present at lines 112, 143, 174. File is 197 lines. Substantive: real Supabase query chain (.gte().lte().order()), date-math loop, Set dedup. |
| `src/services/practiceLogService.test.js` | Unit tests for all new functions, min_lines: 200 | ✓ VERIFIED | File is 389 lines. Three new describe blocks: getHistoricalLogs() (5 tests), buildHeatmapData() (7 tests), computeLongestStreak() (6 tests = 18 new tests). Import line 20 includes buildHeatmapData and computeLongestStreak. |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/parent/PracticeHeatmapCard.jsx` | Heatmap card with loading/empty/populated/error states, min_lines: 80 | ✓ VERIFIED | File is 233 lines. All 4 states implemented: loading (lines 107-131), empty (lines 212-222), error (lines 224-228), populated (lines 134-231). |
| `src/pages/ParentPortalPage.jsx` | Portal page with PracticeHeatmapCard integration | ✓ VERIFIED | `import PracticeHeatmapCard` at line 21; `<PracticeHeatmapCard studentId={user?.id} />` at line 280 inside mt-6 wrapper. |
| `src/locales/en/common.json` | English i18n keys under parentPortal.practiceCalendar | ✓ VERIFIED | All 11 keys present at lines 1411-1423: title, statTotalLabel, statStreakLabel, statLongestLabel, statDaySingular, statDayPlural, emptyHeading, emptyBody, ariaLabel, loadingLabel, errorMessage. |
| `src/locales/he/common.json` | Hebrew i18n keys under parentPortal.practiceCalendar | ✓ VERIFIED | All 11 Hebrew keys present at lines 1418-1430. title = "יומן תרגול", matching plan spec exactly. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PracticeHeatmapCard.jsx` | `practiceLogService.js` | useQuery calling getHistoricalLogs and buildHeatmapData | ✓ WIRED | `buildHeatmapData` imported line 29; `computeLongestStreak` imported line 30; `practiceLogService.getHistoricalLogs(startDate, endDate)` called at line 76; `buildHeatmapData(historyData ?? [], ...)` called at line 91. |
| `PracticeHeatmapCard.jsx` | `practiceStreakService.js` | useQuery calling getPracticeStreak | ✓ WIRED | `practiceStreakService` imported line 32; `practiceStreakService.getPracticeStreak()` called at line 84 inside useQuery with key `['practice-streak', studentId]`. |
| `ParentPortalPage.jsx` | `PracticeHeatmapCard.jsx` | import and render | ✓ WIRED | `import PracticeHeatmapCard from '../components/parent/PracticeHeatmapCard'` at line 21; rendered at line 280 with `studentId={user?.id}`. |
| `practiceLogService.js` | `instrument_practice_logs` table | supabase.from('instrument_practice_logs').select().gte().lte() | ✓ WIRED | Pattern `instrument_practice_logs.*practiced_on` confirmed at lines 119-124: `.from('instrument_practice_logs').select('practiced_on').eq('student_id', ...).gte('practiced_on', startDate).lte('practiced_on', endDate).order(...)` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `PracticeHeatmapCard.jsx` | `heatmapData` (ActivityCalendar data prop) | `buildHeatmapData(historyData ?? [])` → `practiceLogService.getHistoricalLogs()` → `instrument_practice_logs` Supabase query | Yes — real Supabase `.gte().lte().order()` query chain with RLS enforcement via `session.user.id` | ✓ FLOWING |
| `PracticeHeatmapCard.jsx` | `currentStreak` | `practiceStreakService.getPracticeStreak()` → `streakData?.streakCount ?? 0` | Yes — queries practiceStreakService which accesses Supabase | ✓ FLOWING |
| `PracticeHeatmapCard.jsx` | `longestStreak` | `computeLongestStreak(historyData ?? [])` — derived from same history query | Yes — pure computation over real DB data | ✓ FLOWING |
| `PracticeHeatmapCard.jsx` | `totalDays` | `(historyData ?? []).length` | Yes — count of real DB rows returned | ✓ FLOWING |

No hardcoded empty values passed to ActivityCalendar. When `historyData` is undefined (loading), `historyData ?? []` produces empty array which `buildHeatmapData` fills with 364 level-0 entries — correct behavior for loading/empty state.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — the heatmap requires a running dev server and authenticated Supabase session to produce meaningful output. Module-level checks not applicable for this React component. Visual spot-checks routed to human verification.

---

### Requirements Coverage

Both Phase 4 plans declare `requirements: [PARENT-01, PARENT-02]`.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PARENT-01 | Plans 01 + 02 | Parent portal shows a calendar heatmap of the child's instrument practice history | ✓ SATISFIED | PracticeHeatmapCard.jsx renders ActivityCalendar with 52-week data; wired into ParentPortalPage.jsx at line 279-281. |
| PARENT-02 | Plans 01 + 02 | Calendar heatmap covers 52-week rolling window with child-appropriate coloring (no red for missed days) | ✓ SATISFIED | buildHeatmapData() produces exactly 364 entries (52 × 7); theme uses emerald green (#34d399) for practiced days and neutral gray (rgba(255,255,255,0.15)) for missed days — no red. |

**Orphaned requirements check:** REQUIREMENTS.md maps PARENT-01 and PARENT-02 exclusively to Phase 4. Both are accounted for. No orphaned requirements.

---

### Anti-Patterns Found

Scanned `src/services/practiceLogService.js`, `src/components/parent/PracticeHeatmapCard.jsx`, `src/pages/ParentPortalPage.jsx`.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODO/FIXME/PLACEHOLDER comments. No empty implementations (`return null`, `return []`, `return {}`). No hardcoded empty data passed to rendered components. No console.log-only handlers. The `historyData ?? []` fallback is intentional initial state, not a stub — it is overwritten by the useQuery result once loaded.

---

### Human Verification Required

#### 1. Heatmap Card Visual Rendering

**Test:** Start dev server (`npm run dev`), navigate to `http://localhost:5174/parent-portal` as a logged-in parent.
**Expected:** Practice Calendar card appears below the subscription card (or below the "no subscription" CTA). Glass card styling visible (semi-transparent background, rounded corners, border). Three stat chips (days practiced, current streak, longest streak) display above the heatmap grid.
**Why human:** React component rendering and CSS glassmorphism visual output require browser inspection.

#### 2. Hebrew Locale RTL Rendering

**Test:** Switch app language to Hebrew via the language toggle. Navigate to `/parent-portal`.
**Expected:** Piano icon appears on the right side of the card header. Hebrew title "יומן תרגול" displays. Heatmap grid is mirrored so the most recent week is on the right. Stats row text is right-aligned. No month labels visible (showMonthLabels=false in RTL mode per 04-RESEARCH.md Pitfall 4).
**Why human:** CSS scaleX(-1) transform and i18n.dir() RTL layout requires visual browser inspection; the code is correct but visual output must be confirmed.

#### 3. Empty State Appearance

**Test:** Log in as a parent whose child has no practice records. Navigate to `/parent-portal`.
**Expected:** Full 52-week gray grid renders (all neutral gray cells, no emerald). Below the grid, the text "No practice logged yet" and the encouraging body copy appear.
**Why human:** Requires a specific data state (no practice logs) that cannot be triggered programmatically from source inspection.

#### 4. Heatmap Visibility with No Subscription

**Test:** Log in as a parent with no active subscription (no entry in `parent_subscriptions`). Navigate to `/parent-portal`.
**Expected:** The "No active subscription" card renders at the top, AND the Practice Calendar heatmap card renders below it. The heatmap is not gated behind subscription status.
**Why human:** Requires a specific account state to confirm the `PracticeHeatmapCard` outside the `effectiveDetail &&` conditional renders correctly in both subscription and no-subscription branches.

---

### Gaps Summary

No automated gaps found. All code artifacts exist, are substantive, are wired correctly, and data flows from real Supabase queries through to the rendered ActivityCalendar component. Requirements PARENT-01 and PARENT-02 are both satisfied by the implementation evidence.

The four human verification items are confirmations of working code, not blockers — the implementation is complete and correct. They require visual browser inspection to close the human-verify checkpoint that was explicitly left open in Plan 02 (Task 2: `checkpoint:human-verify`).

---

_Verified: 2026-03-24T18:30:00Z_
_Verifier: Claude (gsd-verifier)_
