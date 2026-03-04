# Phase 16: Dashboard XP Prominence - Research

**Researched:** 2026-02-09
**Domain:** React UI components, animation hooks, XP/leveling systems
**Confidence:** HIGH

## Summary

This phase makes the existing XP system visible and motivating through a dedicated Dashboard XP card, level-up celebrations, and VictoryScreen XP animations. The app already has a complete XP infrastructure (`xpSystem.js`, `awardXP()`, `getLevelProgress()`) and celebration system (Phase 15). Research confirms that:

1. **No new libraries needed** - The codebase already has a custom `useCountUp` hook in `VictoryScreen.jsx` that respects accessibility, matching the pattern needed for XP count-up animations
2. **Existing celebration infrastructure** - Phase 15's celebration tier system (`celebrationTiers.js`, `ConfettiEffect.jsx`) handles level-up moments with duration tiers and accessibility support
3. **Progress bar patterns established** - `Progress.jsx` component and `DailyGoalsCard.jsx` provide horizontal fill bar patterns with accessibility
4. **localStorage tracking pattern** - VictoryScreen uses localStorage to track shown accessory unlocks with versioning (`SHOWN_UNLOCKS_VERSION`), same pattern applies to level-up celebration deduplication

The implementation is primarily UI composition using existing utilities, not new infrastructure.

**Primary recommendation:** Build XP card and level-up celebration using existing `useCountUp`, `ConfettiEffect`, and `Progress` patterns. Track celebrated levels in localStorage with version control to prevent repeat celebrations.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component framework | Project foundation |
| TanStack Query | 5.x | XP data fetching | Already used for `getStudentXP()` |
| Tailwind CSS | 3.x | Styling | Design system foundation |
| i18next | Latest | Localization | App-wide translation |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-confetti | Latest | Confetti effects | Level-up celebrations (Phase 15) |
| lucide-react | Latest | Icon library | Level badge icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useCountUp | react-countup npm | Custom hook already exists in VictoryScreen, respects accessibility, no bundle increase needed |
| localStorage | Database storage | localStorage sufficient for client-side celebration deduplication, faster, no network calls |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/dashboard/
│   ├── DailyGoalsCard.jsx        # Existing - reference for card styling
│   └── XPProgressCard.jsx        # NEW - XP card component
├── utils/
│   ├── xpSystem.js                # Existing - XP calculations
│   ├── celebrationTiers.js        # Existing - tier determination
│   └── levelUpTracking.js         # NEW - localStorage level-up tracking
└── components/games/
    └── VictoryScreen.jsx          # Modify - add XP count-up + mini progress bar
```

### Pattern 1: Custom useCountUp Hook (Accessibility-Aware)

**What:** Custom React hook for animating numbers with accessibility support
**When to use:** XP gain animations, any numeric count-up that needs reduced motion support
**Example:**
```javascript
// Source: VictoryScreen.jsx lines 27-61 (existing implementation)
const useCountUp = (start, end, duration = 1400, shouldAnimate = true, reducedMotion = false) => {
  const [value, setValue] = useState(() => {
    if (reducedMotion || !shouldAnimate) {
      return end ?? start ?? 0;
    }
    return start ?? 0;
  });

  useEffect(() => {
    if (start === undefined || end === undefined) return;
    if (reducedMotion || !shouldAnimate || start === end) {
      setValue(end);
      return;
    }
    let frame;
    const startTime = performance.now();
    const change = end - start;

    const runFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      setValue(Math.round(start + change * easedProgress));

      if (progress < 1) {
        frame = requestAnimationFrame(runFrame);
      }
    };

    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [start, end, duration, shouldAnimate, reducedMotion]);

  return value;
};

// Usage in component:
const { reducedMotion } = useAccessibility();
const animatedXP = useCountUp(0, totalXP, 1000, true, reducedMotion);
```

**Key features:**
- Instant display if `reducedMotion` is true (100ms opacity transition only)
- Cubic ease-out easing for natural deceleration
- requestAnimationFrame for smooth 60fps animation
- Cleanup on unmount to prevent memory leaks

### Pattern 2: Horizontal Progress Bar (Duolingo-Style)

**What:** Left-to-right fill bar showing XP progress within current level
**When to use:** XP card on dashboard, mini XP bar in VictoryScreen
**Example:**
```javascript
// Source: DailyGoalsCard.jsx lines 111-121 (progress bar pattern)
<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
  <div
    className={`h-full transition-all duration-500 ${
      goal.completed
        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
    }`}
    style={{ width: `${progressPercentage}%` }}
  />
</div>

// For XP card (white background context):
<div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
  <div
    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
    style={{ width: `${(xpInCurrentLevel / xpNeededForLevel) * 100}%` }}
  />
</div>
```

**Key features:**
- `overflow-hidden rounded-full` for smooth rounded edges
- `transition-all duration-500` for smooth width changes
- Gradient backgrounds for visual appeal
- Percentage-based width via inline style

### Pattern 3: Level-Up Celebration with Deduplication

**What:** One-time confetti celebration when user crosses level threshold
**When to use:** VictoryScreen when `xpData.leveledUp === true`
**Example:**
```javascript
// Source: VictoryScreen.jsx lines 213-219, 481-486 (celebration pattern)
const [showConfetti, setShowConfetti] = useState(false);

// Trigger confetti for full/epic tiers
useEffect(() => {
  if (!isProcessingTrail && celebrationData.config.confetti && !reducedMotion) {
    setShowConfetti(true);
  }
}, [isProcessingTrail, celebrationData.config.confetti, reducedMotion]);

// Render confetti
{showConfetti && (
  <ConfettiEffect
    tier={celebrationData.tier}
    onComplete={() => setShowConfetti(false)}
  />
)}

// NEW: Level-up deduplication using localStorage
const CELEBRATED_LEVELS_VERSION = 1;
const storageKey = `celebrated-levels-${user.id}-v${CELEBRATED_LEVELS_VERSION}`;

useEffect(() => {
  if (!xpData?.leveledUp) return;

  // Check if level already celebrated
  const celebratedLevels = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (celebratedLevels.includes(xpData.newLevel)) {
    return; // Already celebrated this level
  }

  // Show confetti
  setShowConfetti(true);

  // Mark as celebrated
  celebratedLevels.push(xpData.newLevel);
  localStorage.setItem(storageKey, JSON.stringify(celebratedLevels));
}, [xpData?.leveledUp, xpData?.newLevel, user.id]);
```

**Key features:**
- localStorage array tracks celebrated levels per user
- Version control allows cache invalidation if logic changes
- Prevents duplicate celebrations on page refresh or replay
- User-scoped to prevent cross-contamination

### Pattern 4: Level Badge with Color Progression

**What:** Icon/badge that changes color/style as user progresses through levels
**When to use:** XP card level display, dashboard header
**Example:**
```javascript
// Source: xpSystem.js lines 14-30 (level definitions)
export const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Beginner', icon: '🌱' },
  { level: 2, xpRequired: 100, title: 'Music Sprout', icon: '🌿' },
  { level: 3, xpRequired: 250, title: 'Note Finder', icon: '🎵' },
  // ... 15 levels total
];

// Color progression pattern (Claude's discretion - recommendation):
const LEVEL_COLORS = [
  { level: 1-3, color: 'from-gray-400 to-gray-500', textColor: 'text-gray-700' },     // Bronze
  { level: 4-6, color: 'from-blue-400 to-blue-600', textColor: 'text-blue-900' },     // Silver
  { level: 7-9, color: 'from-amber-400 to-amber-600', textColor: 'text-amber-900' },  // Gold
  { level: 10-12, color: 'from-purple-400 to-purple-600', textColor: 'text-purple-900' }, // Platinum
  { level: 13-15, color: 'from-pink-400 via-purple-500 to-indigo-600', textColor: 'text-white' } // Rainbow/Legend
];

// Usage in component:
const currentLevel = calculateLevel(totalXP);
const colorConfig = LEVEL_COLORS.find(c => currentLevel.level <= c.maxLevel);

<div className={`rounded-full bg-gradient-to-br ${colorConfig.color} p-1`}>
  <span className={`text-2xl ${colorConfig.textColor}`}>{currentLevel.icon}</span>
</div>
```

**Colorblind-safe progression:**
- Gray → Blue → Gold → Purple → Rainbow ensures maximum distinction
- Matches Phase 14's node type color research (blue/purple/green palette)
- Emoji icons add redundant encoding (shape + color)

### Pattern 5: VictoryScreen Mini XP Bar

**What:** Compact XP progress bar showing before/after state on VictoryScreen
**When to use:** Below XP breakdown, shows level progress context
**Example:**
```javascript
// NEW component structure for VictoryScreen
{xpData && xpData.totalXP > 0 && (
  <div className="relative mt-2">
    {/* XP Breakdown (existing) */}
    <div className="relative space-y-1.5 rounded-xl bg-white/90 px-4 py-2.5">
      <p className="text-base font-bold text-blue-600">+{xpData.totalXP} XP Earned</p>
      {/* Breakdown items... */}
    </div>

    {/* NEW: Mini XP progress bar */}
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs text-white/80">
        <span>{currentLevel.title}</span>
        <span>{currentLevel.level}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-1000"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="text-center text-xs text-white/70">
        {xpInCurrentLevel} / {xpNeededForLevel} XP
      </div>
    </div>
  </div>
)}
```

**Key features:**
- Compact 2-line design (label row, bar, stats row)
- Uses same gradient as main XP card for visual consistency
- Shows level context without overwhelming victory screen
- 1000ms transition syncs with XP count-up animation

### Anti-Patterns to Avoid

- **Animating on every render:** Only animate when XP changes, not on re-renders. Use `useEffect` dependencies to control animation triggers.
- **Ignoring reducedMotion:** Always check `AccessibilityContext.reducedMotion` before applying animations. VictoryScreen pattern is the gold standard.
- **Hardcoded level thresholds:** Always use `XP_LEVELS` array from `xpSystem.js`. Never duplicate threshold logic.
- **Database queries for level-up status:** Calculate `leveledUp` client-side by comparing old/new levels. Database stores `total_xp` only, not celebration state.
- **Blocking UI on XP award:** XP awarding is async in VictoryScreen. Show loading state, then update UI when promise resolves.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number count-up animation | New requestAnimationFrame logic | Existing `useCountUp` hook from VictoryScreen | Already respects accessibility, tested in production, handles edge cases (unmount cleanup, instant display) |
| Confetti celebration | Canvas-based particle system | `ConfettiEffect.jsx` from Phase 15 | Tier-based configs, accessibility support, matches existing celebration system |
| Progress bar | Custom SVG or canvas | `Progress.jsx` or inline `<div>` pattern | Existing component has accessibility, or inline pattern is 3 lines (sufficient for simple use case) |
| Level calculation | Custom threshold logic | `calculateLevel()` from `xpSystem.js` | Single source of truth, tested, returns full level object with title/icon |
| Celebration deduplication | Database table | localStorage array pattern from VictoryScreen | Faster (no network), client-side concern, follows existing accessory unlock pattern |

**Key insight:** The app already has every primitive needed for this phase. The work is composition and layout, not building new utilities.

## Common Pitfalls

### Pitfall 1: Animation Performance on Low-End Devices
**What goes wrong:** Multiple simultaneous animations (XP count-up + progress bar fill + confetti) cause jank on 8-year-old's school Chromebooks
**Why it happens:** requestAnimationFrame callbacks firing simultaneously, large confetti particle count
**How to avoid:**
- Stagger animations by 200ms (confetti → XP count → progress bar)
- Reduce confetti particle count for level-up (200 pieces, not 500 epic tier)
- Use CSS transitions for progress bar (GPU-accelerated), not JS animation
**Warning signs:** Frame drops in Chrome DevTools Performance panel, stuttering on 4GB RAM devices

### Pitfall 2: Level-Up Celebration Spam
**What goes wrong:** User sees level-up confetti every time they view VictoryScreen after crossing threshold
**Why it happens:** Celebration triggers on `xpData.leveledUp` without deduplication
**How to avoid:**
- localStorage tracking per user: `celebrated-levels-${userId}-v1`
- Check array before showing confetti
- Version control allows invalidation if logic changes
**Warning signs:** User reports "seeing the same celebration over and over"

### Pitfall 3: XP Data Race Conditions
**What goes wrong:** VictoryScreen shows old XP total, then jumps to new total after 2 seconds
**Why it happens:** `getStudentXP()` query has stale cache, `awardXP()` updates database but cache not invalidated
**How to avoid:**
- VictoryScreen already calls `queryClient.invalidateQueries({ queryKey: ["student-xp", user.id] })` after `awardXP()`
- XP card should use same query key: `["student-xp", user.id]`
- Set `staleTime: 0` for XP queries on Dashboard (always fresh)
**Warning signs:** XP numbers don't match between VictoryScreen and Dashboard, delayed updates

### Pitfall 4: Reduced Motion Violations
**What goes wrong:** Progress bar still animates with `duration-500` transition when `reducedMotion` is true
**Why it happens:** CSS transitions not gated by accessibility context
**How to avoid:**
```javascript
const { reducedMotion } = useAccessibility();
<div
  className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 ${
    reducedMotion ? 'transition-opacity duration-100' : 'transition-all duration-500'
  }`}
  style={{ width: `${percentage}%` }}
/>
```
**Warning signs:** User reports motion sickness, accessibility audit fails, animations visible when preference is "reduce motion"

### Pitfall 5: Overcomplicating the XP Card
**What goes wrong:** XP card tries to show lifetime stats, daily XP, weekly trends, achievements, etc. (feature creep)
**Why it happens:** Wanting to maximize information density
**How to avoid:**
- Phase requirements are explicit: level name, progress bar, "X XP to next level", current/threshold display
- This is for 8-year-olds - simplicity is the feature
- Duolingo shows only current level progress, not lifetime stats
**Warning signs:** Card taller than DailyGoalsCard, cognitive overload, slow rendering

## Code Examples

Verified patterns from official sources and existing codebase:

### Dashboard XP Card Structure
```javascript
// Source: Composite of DailyGoalsCard.jsx and xpSystem.js patterns
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../../features/authentication/useUser';
import { getStudentXP } from '../../utils/xpSystem';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const XPProgressCard = () => {
  const { user } = useUser();
  const { reducedMotion } = useAccessibility();
  const { t } = useTranslation();

  // Fetch XP data
  const { data: xpData, isLoading } = useQuery({
    queryKey: ['student-xp', user?.id],
    queryFn: () => getStudentXP(user.id),
    enabled: !!user?.id,
    staleTime: 0, // Always fresh for dashboard
    refetchInterval: 60 * 1000 // Refresh every minute
  });

  if (isLoading || !xpData) {
    return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 animate-pulse" />;
  }

  const { levelData, progress } = xpData;
  const { currentLevel, xpInCurrentLevel, xpNeededForNext, progressPercentage } = progress;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white/90">
          {t('dashboard.xpCard.title', { defaultValue: 'Your Progress' })}
        </h3>
        <div className="rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-2">
          <span className="text-2xl">{currentLevel.icon}</span>
        </div>
      </div>

      {/* Level name (headline) */}
      <div className="mb-3 text-center">
        <h2 className="text-2xl font-bold text-white drop-shadow">
          {currentLevel.title}
        </h2>
        <p className="text-sm text-white/60">
          {t('dashboard.xpCard.level', { level: currentLevel.level })}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className={`h-full bg-gradient-to-r from-blue-400 to-indigo-600 ${
              reducedMotion ? 'transition-opacity duration-100' : 'transition-all duration-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* XP stats */}
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>{xpData.totalXP} XP</span>
        <span className="font-semibold">{xpNeededForNext} XP to Level {currentLevel.level + 1}</span>
      </div>

      {/* Current / threshold display */}
      <div className="mt-1 text-center text-xs text-white/60">
        {xpInCurrentLevel} / {progress.nextLevelXP - (progress.nextLevelXP - xpNeededForNext - xpInCurrentLevel)} XP
      </div>
    </div>
  );
};

export default XPProgressCard;
```

### VictoryScreen XP Gain Animation
```javascript
// Source: Extends existing VictoryScreen.jsx lines 736-788
// NEW: Mini XP bar addition
{xpData && xpData.totalXP > 0 && (
  <div className="relative mt-2">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 via-purple-200/30 to-pink-200/40 opacity-70 blur-lg" />
    <div className="relative space-y-1.5 rounded-xl border-white/60 bg-white/90 px-4 py-2.5 shadow-lg">
      {/* Total XP header with count-up */}
      <div className="text-center">
        <p className="text-base font-bold text-blue-600">
          +{useCountUp(0, xpData.totalXP, 1000, true, reducedMotion)} XP Earned
        </p>
      </div>

      {/* XP Breakdown (existing code) */}
      <div className="space-y-0.5 text-xs text-gray-600">
        {/* ... existing breakdown items ... */}
      </div>

      {/* NEW: Mini XP progress bar */}
      {!xpData.leveledUp && ( // Hide if leveled up (show full celebration instead)
        <div className="mt-3 space-y-1 rounded-lg bg-blue-50/50 p-2">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span>{xpData.currentLevel?.title || 'Current Level'}</span>
            <span>Level {xpData.currentLevel?.level || 1}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 ${
                reducedMotion ? 'transition-opacity duration-100' : 'transition-all duration-1000'
              }`}
              style={{
                width: `${((xpData.newTotalXP - xpData.currentLevelStartXP) / (xpData.nextLevelXP - xpData.currentLevelStartXP)) * 100}%`
              }}
            />
          </div>
          <div className="text-center text-xs text-blue-700">
            {xpData.newTotalXP - xpData.currentLevelStartXP} / {xpData.nextLevelXP - xpData.currentLevelStartXP} XP
          </div>
        </div>
      )}

      {/* Level up indicator (existing code) */}
      {xpData.leveledUp && (
        <div className={`${reducedMotion ? '' : 'animate-bounce'} mt-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 text-center text-xs font-bold text-white shadow-lg`}>
          Level {xpData.newLevel}!
        </div>
      )}
    </div>
  </div>
)}
```

### Level-Up Celebration Deduplication
```javascript
// Source: Adapted from VictoryScreen.jsx accessory unlock pattern (lines 106-290)
// NEW utility: src/utils/levelUpTracking.js

const CELEBRATED_LEVELS_VERSION = 1;

/**
 * Get list of celebrated levels for a user
 * @param {string} userId - User ID
 * @returns {number[]} Array of celebrated level numbers
 */
export const getCelebratedLevels = (userId) => {
  if (!userId || typeof window === 'undefined') return [];

  const storageKey = `celebrated-levels-${userId}-v${CELEBRATED_LEVELS_VERSION}`;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load celebrated levels:', error);
    return [];
  }
};

/**
 * Mark a level as celebrated
 * @param {string} userId - User ID
 * @param {number} level - Level number to mark
 */
export const markLevelCelebrated = (userId, level) => {
  if (!userId || typeof window === 'undefined') return;

  const storageKey = `celebrated-levels-${userId}-v${CELEBRATED_LEVELS_VERSION}`;
  const celebratedLevels = getCelebratedLevels(userId);

  if (!celebratedLevels.includes(level)) {
    celebratedLevels.push(level);
    window.localStorage.setItem(storageKey, JSON.stringify(celebratedLevels));
  }
};

/**
 * Check if a level has been celebrated
 * @param {string} userId - User ID
 * @param {number} level - Level number to check
 * @returns {boolean} True if already celebrated
 */
export const hasLevelBeenCelebrated = (userId, level) => {
  const celebratedLevels = getCelebratedLevels(userId);
  return celebratedLevels.includes(level);
};

// Usage in VictoryScreen:
import { hasLevelBeenCelebrated, markLevelCelebrated } from '../../utils/levelUpTracking';

useEffect(() => {
  if (!xpData?.leveledUp || !user?.id) return;

  // Check if already celebrated
  if (hasLevelBeenCelebrated(user.id, xpData.newLevel)) {
    console.log(`Level ${xpData.newLevel} already celebrated, skipping confetti`);
    return;
  }

  // Show confetti for level-up
  if (!reducedMotion) {
    setShowConfetti(true);
  }

  // Mark as celebrated
  markLevelCelebrated(user.id, xpData.newLevel);
}, [xpData?.leveledUp, xpData?.newLevel, user?.id, reducedMotion]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Database-stored celebration flags | localStorage celebration tracking | Phase 15 (Jan 2026) | Faster, no network latency, client-side concern |
| Manual number interpolation | Custom `useCountUp` hook | VictoryScreen implementation | Accessibility-aware, reusable across components |
| Separate level/XP systems | Unified `xpSystem.js` with 15 levels | Trail system redesign (v1.3) | Single source of truth, music-themed level names |
| Points-based levels (LevelDisplay.jsx) | XP-based levels (xpSystem.js) | Trail system redesign | Consistent with trail progression, clearer metrics |

**Deprecated/outdated:**
- **Points-based leveling (`LevelDisplay.jsx`)**: Uses old `totalPoints` calculation from scores. XP system (`xpSystem.js`) is the current standard with music-themed titles and clear thresholds.
- **Manual confetti setup**: Phase 15 introduced `ConfettiEffect.jsx` wrapper with tier-based configs. Never use `react-confetti` directly.
- **Hardcoded celebration messages**: Phase 15 introduced `celebrationMessages.js` for centralized messaging. Always use `getCelebrationMessage()`.

## Open Questions

Things that couldn't be fully resolved:

1. **XP Card Placement on Dashboard**
   - What we know: Dashboard has DailyGoalsCard (left), Continue Learning button (center), stats cards (bottom)
   - What's unclear: Exact grid position for XP card - should it replace a stat card or be a new row?
   - Recommendation: Place XP card in top row alongside DailyGoalsCard (equal visual weight), push Continue Learning to second row. User explicitly said "same visual weight as Daily Goals and Continue Learning".

2. **Trail Map Header XP Summary**
   - What we know: User wants "compact XP summary in the trail map header"
   - What's unclear: TrailMapPage.jsx header only shows navigation links, no existing stats area
   - Recommendation: Add XP summary to right side of header (replace "Free Practice" link with dropdown menu, add XP display). Keep it minimal: just level icon + "Level 3" text.

3. **Level Badge Animation on Dashboard**
   - What we know: User wants "animated badge update (XP card's level badge pulses/animates on load)"
   - What's unclear: Animation trigger - on every dashboard load, or only when level changes?
   - Recommendation: Only animate when `localStorage.getItem('last-seen-level')` !== current level. Update localStorage after animation completes. Prevents animation spam on every page load.

## Sources

### Primary (HIGH confidence)
- **VictoryScreen.jsx** (lines 27-61) - Custom `useCountUp` hook implementation with accessibility
- **xpSystem.js** - XP level definitions, calculation utilities, `awardXP()` function
- **celebrationTiers.js** - Tier determination logic (Phase 15)
- **ConfettiEffect.jsx** - Confetti component with tier configs (Phase 15)
- **DailyGoalsCard.jsx** - Progress bar UI pattern reference
- **Progress.jsx** - Existing progress bar component with accessibility
- **AccessibilityContext.jsx** - Reduced motion preference management

### Secondary (MEDIUM confidence)
- [react-countup - npm](https://www.npmjs.com/package/react-countup) - Verified alternative to custom hook (not needed, but validates approach)
- [use-count-up - npm](https://www.npmjs.com/package/use-count-up) - Lightweight alternative (not needed, but confirms pattern)
- [Building an Animated Counter with React and CSS - DEV Community](https://dev.to/cooljasonmelton/building-an-animated-counter-with-react-and-css-59ee) - requestAnimationFrame best practices

### Tertiary (LOW confidence)
- None required - all patterns exist in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed, verified in package.json and imports
- Architecture: HIGH - Patterns extracted from working production code (VictoryScreen, DailyGoalsCard, xpSystem)
- Pitfalls: HIGH - Based on existing accessibility implementation and known React animation gotchas
- Level badge color progression: MEDIUM - Recommended palette based on Phase 14 research, but exact progression is Claude's discretion per user

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (30 days - stable patterns, unlikely to change)
