---
phase: 16
plan: 02
subsystem: gamification-ui
tags: [xp-system, animations, trail-map, accessibility, victory-screen]
completed: 2026-02-09
duration: 4min

requires:
  - phase: 16
    plan: 01
    for: "levelUpTracking.js utility and getLevelProgress function"
  - phase: 15
    plan: 03
    for: "VictoryScreen celebration tier integration"
  - phase: 13
    plan: 01
    for: "useCountUp hook in VictoryScreen"

provides:
  - "XP count-up animation in VictoryScreen (0 to total over 1 second)"
  - "Mini XP progress bar showing level context after XP gain"
  - "Level-up celebration deduplication via localStorage"
  - "Trail map header with compact XP summary (level icon + name)"

affects:
  - future: "Phase 17 (Practice Session UI) may adopt similar XP count-up patterns"
  - future: "Phase 18 (Final Polish) should verify all XP displays are consistent"

tech-stack:
  added: []
  patterns:
    - "useCountUp hook for animated number transitions"
    - "useMemo for derived level progress data"
    - "localStorage deduplication pattern for one-time celebrations"
    - "React Query with 1-minute stale time for header data"

key-files:
  created: []
  modified:
    - path: "src/components/games/VictoryScreen.jsx"
      lines: 926
      changes: "+57, -6"
      purpose: "XP count-up animation, mini progress bar, level-up deduplication"
    - path: "src/pages/TrailMapPage.jsx"
      lines: 73
      changes: "+27, -6"
      purpose: "Compact XP summary in trail header"

decisions:
  - id: "xp-animation-duration-1s"
    decision: "XP count-up animates over 1 second (vs. 1.4s for points)"
    rationale: "Faster animation keeps VictoryScreen snappy; XP is secondary to points display"
    alternatives: ["1.4s to match points animation", "500ms for instant feel"]

  - id: "mini-bar-only-when-not-leveled-up"
    decision: "Hide mini progress bar when user levels up"
    rationale: "Level-up celebration banner is more important; avoid visual clutter"
    alternatives: ["Show both mini bar and level-up", "Always show mini bar below"]

  - id: "level-name-in-header"
    decision: "Trail header shows level icon + name only (no XP/progress bar)"
    rationale: "Keep header minimal; Dashboard XP Card has full detail"
    alternatives: ["Add mini progress bar in header", "Show XP numbers"]

  - id: "dedup-at-level-up-trigger"
    decision: "Mark level celebrated in useEffect that triggers confetti"
    rationale: "Ensures level is marked immediately when confetti fires, preventing re-trigger"
    alternatives: ["Mark when VictoryScreen mounts", "Mark when user dismisses screen"]
---

# Phase 16 Plan 02: XP Count-Up Animation & Trail Header Display Summary

**One-liner:** XP gains now animate from 0 to total with mini progress bar; level-up confetti deduplicated; trail header shows level badge.

## What Was Built

Enhanced VictoryScreen XP feedback and added persistent XP visibility on Trail Map.

### 1. VictoryScreen XP Count-Up Animation

**Implementation:**
- Reused existing `useCountUp` hook (already in VictoryScreen for points animation)
- XP gain now animates from 0 to total over 1 second (vs. 1.4s for points)
- Respects `reducedMotion` setting (instant display when enabled)

**Code pattern:**
```javascript
const animatedXPGain = useCountUp(0, xpData?.totalXP || 0, 1000, !!xpData?.totalXP, reducedMotion);
```

Replaces static `+{xpData.totalXP} XP Earned` with `+{animatedXPGain} XP Earned`.

### 2. Mini XP Progress Bar

**Purpose:** Show level context immediately after XP is awarded, without requiring navigation to Dashboard.

**Visibility logic:**
- **Shows:** When `xpData` exists AND user did NOT level up
- **Hides:** When user levels up (replaced by level-up celebration banner)

**Display elements:**
- Level icon + level name (e.g., "🎵 Note Finder")
- Progress bar (blue gradient, animates fill over 1s)
- XP fraction (e.g., "75 / 150 XP")

**Data source:** `getLevelProgress(xpData.newTotalXP)` calculated via useMemo.

**Accessibility:** Progress bar animation respects `reducedMotion` (100ms opacity transition vs. 1000ms all transition).

### 3. Level-Up Celebration Deduplication

**Problem:** Without deduplication, visiting VictoryScreen multiple times for the same level triggers confetti repeatedly.

**Solution:**
- Import `hasLevelBeenCelebrated` and `markLevelCelebrated` from `levelUpTracking.js` (created in Plan 16-01)
- Added useEffect that checks localStorage before triggering confetti
- Marks level as celebrated immediately when confetti fires

**Code pattern:**
```javascript
useEffect(() => {
  if (!xpData?.leveledUp || !user?.id) return;
  if (reducedMotion) return;

  if (hasLevelBeenCelebrated(user.id, xpData.newLevel)) {
    return; // Skip confetti
  }

  setShowConfetti(true);
  markLevelCelebrated(user.id, xpData.newLevel);
}, [xpData?.leveledUp, xpData?.newLevel, user?.id, reducedMotion]);
```

**Note:** This effect is ADDITIONAL to the existing tier-based confetti trigger (which handles boss/perfect celebrations). Both can coexist.

### 4. Enhanced Level-Up Indicator

**Before:** `Level {xpData.newLevel}!` (just number)
**After:** Shows "Level Up!" label + level name (e.g., "Note Finder")

Uses `levelProgressData?.currentLevel?.title` for name display.

### 5. Trail Map Header XP Summary

**Location:** Trail navigation bar, between page title and "Free Practice" link.

**Display:**
- Level icon (emoji)
- Level name (e.g., "Music Sprout")
- Minimal styling: `bg-white/10 px-2.5 py-1`

**Data fetching:**
- React Query with `['student-xp', user?.id]` key
- Calls `getStudentXP(user.id)` from xpSystem.js
- 1-minute stale time (balances freshness with performance)
- Gracefully handles loading (only renders when data available)

**RTL support:** Flex container uses `flex-row-reverse` when `isRTL` is true.

## Deviations from Plan

None. Plan executed exactly as written.

## Testing Completed

**Automated:**
- ✅ `npm run lint` passes (no new errors/warnings)
- ✅ `npm run build` completes successfully
- ✅ Grep confirms `hasLevelBeenCelebrated`/`markLevelCelebrated` imported and used
- ✅ Grep confirms `getLevelProgress` imported and used
- ✅ Grep confirms `animatedXPGain` and `levelProgressData` implemented

**Manual verification required:**
- [ ] Play trail node, verify XP count-up animates from 0
- [ ] Verify mini progress bar shows below XP breakdown
- [ ] Level up, verify celebration shows level name
- [ ] Replay same session, verify confetti doesn't re-trigger
- [ ] Navigate to trail, verify header shows level icon + name
- [ ] Enable reduced motion, verify animations simplify to opacity

## Known Issues

None identified.

## Dependencies & Integration

**Imports added to VictoryScreen.jsx:**
```javascript
import { getLevelProgress } from "../../utils/xpSystem";
import { hasLevelBeenCelebrated, markLevelCelebrated } from '../../utils/levelUpTracking';
```

**Imports added to TrailMapPage.jsx:**
```javascript
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../features/authentication/useUser';
import { getStudentXP } from '../utils/xpSystem';
```

**localStorage keys used:**
- `celebrated-levels-{userId}-v1` (array of level numbers)

**React Query keys:**
- `['student-xp', userId]` (cached for 1 minute)

## Code Quality

**Lines of code:**
- VictoryScreen.jsx: +57 lines, -6 lines (net +51)
- TrailMapPage.jsx: +27 lines, -6 lines (net +21)
- Total: +72 lines

**Patterns used:**
- ✅ useCountUp hook for animations
- ✅ useMemo for derived data
- ✅ useEffect for side effects (confetti, localStorage)
- ✅ Conditional rendering based on state
- ✅ Accessibility-first (reducedMotion checks)

**Accessibility compliance:**
- ✅ All animations respect `reducedMotion` setting
- ✅ No motion when user prefers reduced motion
- ✅ Progress bar uses semantic color contrast (blue-900 on blue-50)

## Next Phase Readiness

**Blockers:** None.

**Concerns:** None.

**Recommendations for Phase 16-03 (if applicable):**
- Verify XP displays across Dashboard, VictoryScreen, and Trail are visually consistent
- Consider adding XP gain toast notification when user earns XP outside trail context

## Performance Impact

**Bundle size:** +0.47 kB (3,815.27 → 3,815.74 kB) — negligible.

**Runtime performance:**
- Count-up animation runs for 1s per VictoryScreen render (acceptable)
- Mini progress bar calculation via useMemo (cached until XP changes)
- Trail header XP query cached for 1 minute (reduces API calls)

**Perceived performance:** Improved — users see animated XP feedback immediately.

## Commits

| Commit | Message | Files | Lines |
|--------|---------|-------|-------|
| 0ce559d | feat(16-02): add XP count-up animation, mini progress bar, and level-up deduplication to VictoryScreen | VictoryScreen.jsx | +57, -6 |
| b7dad5e | feat(16-02): add compact XP summary to Trail Map header | TrailMapPage.jsx | +27, -6 |

**Duration:** 4 minutes (2026-02-09 00:24:03Z → 00:27:59Z)

---

**Status:** ✅ Complete — All success criteria met.
