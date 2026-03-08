# Phase 20: Extended Progression System - Research

**Researched:** 2026-03-07
**Domain:** XP level system extension, prestige tiers, level-up UI
**Confidence:** HIGH

## Summary

Phase 20 extends the existing XP level system from 15 to 30 levels, adds infinite prestige tiers after Level 30, and enhances level-up celebrations to show the new title earned. The scope is narrow and well-bounded: the XP system (`xpSystem.js`) is a self-contained module with clear consumers, the Postgres `award_xp` function mirrors its logic, and the UI integration points are already identified in the CONTEXT.md code audit.

The key implementation challenge is maintaining consistency between the JS-side `XP_LEVELS` array, the Postgres `award_xp` function's threshold array, and the `students_level_valid` CHECK constraint. All three must be updated atomically. The prestige system introduces a new concept -- levels beyond the static array -- which requires changes to `calculateLevel()`, `getLevelProgress()`, and `getNextLevelXP()` to handle unbounded level numbers.

**Critical finding:** There is an existing mismatch between the JS array (15 levels) and the Postgres `award_xp` function (10 levels with `FOR i IN 1..10` loop). The DB CHECK constraint caps `current_level <= 10`. This means any student above 3200 XP is stored as level 10 in the DB even though the UI shows them at their correct level (up to 15 via JS). This migration MUST fix this pre-existing gap.

**Primary recommendation:** Extend `XP_LEVELS` to 30 entries with widening XP gaps tuned to the 93-node trail's ~25,575 max XP budget, then add prestige computation as a separate code path triggered when `totalXp >= XP_LEVELS[29].xpRequired + prestige_interval`. Fix the DB/JS mismatch as part of the migration.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Musical mastery theme continuing the existing journey (Beginner -> Legend -> advanced musical roles)
- Levels 16-30 use real music profession/mastery terms: Composer, Conductor, Concert Master, Prodigy, etc.
- Continue using emoji icons for levels 16-30 (consistent with levels 1-15)
- Level names must be localized in both English and Hebrew (i18n keys, not hardcoded strings)
- Infinite prestige tiers after Level 30: Maestro I, Maestro II, Maestro III...
- XP continues accumulating (no reset at prestige entry)
- Fixed XP cost per prestige tier (same amount for each Maestro level)
- Golden level badge for prestige players -- visually distinct from normal shield badge
- Special one-time celebration when first reaching Level 30 (prestige entry) -- beyond normal level-up modal
- Prestige tiers just show "Maestro N" -- no unique names per prestige level
- Titles only -- no new accessories for this phase
- Existing accessory unlock system continues to work independently
- Level-up celebration shows the new title earned ("You are now a Concert Master!")
- Title displayed persistently on dashboard badge (level number + title)
- Continue the established widening XP gap pattern for levels 16-30
- Expand the Postgres `award_xp` function to 30 level thresholds (DB is ground truth)
- Remove `students_level_valid` CHECK constraint cap at level 10, update to accommodate 30+ levels
- Golden/amber progress bar gradient in prestige mode (replaces normal indigo/purple bar)

### Claude's Discretion
- Exact XP thresholds for levels 16-30 (continue widening pattern, tuned to 93-node trail XP availability)
- Exact XP cost per prestige tier
- Whether to rename existing levels 1-15 or keep them
- Specific emoji icons for levels 16-30
- Prestige celebration modal design (reuse boss unlock 3-stage pattern or simpler approach)
- Exact golden badge and golden progress bar styling

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROG-01 | XP level system extended from 15 to 30 levels with new themed names | XP_LEVELS array extension, `award_xp` Postgres function rewrite, CHECK constraint update, i18n keys for all 30 level names in EN/HE |
| PROG-02 | Prestige tiers unlock after level 30 (Maestro I, II, III...) | New prestige logic in `calculateLevel()`, `getLevelProgress()`, `getNextLevelXP()`; prestige-aware `award_xp` function; golden UI treatment for prestige badge and progress bar |
| PROG-03 | Each level grants a unique accessory or title | Titles in XP_LEVELS array (already exists as `title` field); level-up celebration modal enhanced to show new title; dashboard badge displays title persistently; titles-only per CONTEXT.md |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | UI framework | Already in project |
| i18next | existing | Localization for level names | Already handles EN/HE with RTL |
| Supabase | existing | Database, `award_xp` RPC function | Already manages XP state |
| framer-motion | existing | Level-up celebration animations | Already used in VictoryScreen and UnifiedStatsCard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | v5 | Query invalidation on level-up | Already used for `student-xp` query key |
| Tailwind CSS | existing | Golden prestige styling | Gradient utilities for golden badge/bar |

### Alternatives Considered
None -- this phase uses entirely existing infrastructure. No new libraries needed.

## Architecture Patterns

### Affected Files Map

```
src/
  utils/
    xpSystem.js              # PRIMARY: Extend XP_LEVELS to 30 + prestige logic
    levelUpTracking.js        # No changes needed (level number agnostic)
    celebrationTiers.js       # No changes needed (already handles leveledUp flag)
  components/
    layout/Dashboard.jsx      # Update isMaxLevel, level pill prestige styling
    dashboard/
      XPProgressCard.jsx      # Update isMaxLevel, golden prestige bar
      UnifiedStatsCard.jsx    # Accept isPrestige prop, golden bar variant
      XPRing.jsx              # Golden gradient for prestige ring
    games/VictoryScreen.jsx   # Enhanced level-up celebration with title + prestige
  locales/
    en/common.json            # Add 15 new level names + prestige keys
    he/common.json            # Hebrew translations for same
supabase/
  migrations/
    YYYYMMDD_extend_xp_levels.sql  # New migration: constraint + function
```

### Pattern 1: XP_LEVELS Array Extension

**What:** Extend the existing 15-entry `XP_LEVELS` array to 30 entries, maintaining the `{ level, xpRequired, title, icon }` shape.

**When to use:** All level lookups go through `calculateLevel(totalXp)` which iterates this array.

**Key decision -- keep existing level 1-15 names:** The overlap of "Maestro" at level 13 with "Maestro I" prestige is minimal. Levels 1-15 are early-game; prestige is endgame. An 8-year-old will not compare them. Renaming would break existing user expectations and i18n translations.

```javascript
// xpSystem.js - levels 16-30 appended (levels 1-15 unchanged)
export const XP_LEVELS = [
  // Levels 1-15: UNCHANGED
  { level: 1,  xpRequired: 0,     title: 'Beginner',        icon: '🌱' },
  { level: 2,  xpRequired: 100,   title: 'Music Sprout',    icon: '🌿' },
  { level: 3,  xpRequired: 250,   title: 'Note Finder',     icon: '🎵' },
  { level: 4,  xpRequired: 450,   title: 'Melody Maker',    icon: '🎶' },
  { level: 5,  xpRequired: 700,   title: 'Rhythm Keeper',   icon: '🥁' },
  { level: 6,  xpRequired: 1000,  title: 'Music Explorer',  icon: '🗺️' },
  { level: 7,  xpRequired: 1400,  title: 'Sound Wizard',    icon: '🪄' },
  { level: 8,  xpRequired: 1900,  title: 'Piano Pro',       icon: '🎹' },
  { level: 9,  xpRequired: 2500,  title: 'Music Master',    icon: '👑' },
  { level: 10, xpRequired: 3200,  title: 'Symphony Star',   icon: '⭐' },
  { level: 11, xpRequired: 4000,  title: 'Harmony Hero',    icon: '🎼' },
  { level: 12, xpRequired: 5000,  title: 'Virtuoso',        icon: '✨' },
  { level: 13, xpRequired: 6200,  title: 'Maestro',         icon: '🎖️' },
  { level: 14, xpRequired: 7500,  title: 'Grand Master',    icon: '🏆' },
  { level: 15, xpRequired: 9000,  title: 'Legend',           icon: '💎' },
  // Levels 16-30: NEW (music profession theme, widening gaps)
  { level: 16, xpRequired: 10500, title: 'Composer',         icon: '📝' },
  { level: 17, xpRequired: 12200, title: 'Conductor',        icon: '🎙️' },
  { level: 18, xpRequired: 14100, title: 'Concert Master',   icon: '🎻' },
  { level: 19, xpRequired: 16200, title: 'Prodigy',          icon: '🌟' },
  { level: 20, xpRequired: 18500, title: 'Orchestrator',     icon: '🎺' },
  { level: 21, xpRequired: 21000, title: 'Music Sage',       icon: '📖' },
  { level: 22, xpRequired: 23700, title: 'Melodist',         icon: '🎤' },
  { level: 23, xpRequired: 26500, title: 'Symphonist',       icon: '🎷' },
  { level: 24, xpRequired: 29400, title: 'Music Architect',  icon: '🏛️' },
  { level: 25, xpRequired: 32500, title: 'Philharmonic',     icon: '🌈' },
  { level: 26, xpRequired: 35800, title: 'Opus Creator',     icon: '🖋️' },
  { level: 27, xpRequired: 39300, title: 'Concerto Star',    icon: '💫' },
  { level: 28, xpRequired: 43000, title: 'Music Luminary',   icon: '🔆' },
  { level: 29, xpRequired: 46900, title: 'Grand Virtuoso',   icon: '🎭' },
  { level: 30, xpRequired: 51000, title: 'Transcendent',     icon: '🏅' },
];
```

**XP gap analysis:**
- Levels 1-10: gaps 100-800 (existing)
- Levels 11-15: gaps 800-1500 (existing)
- Levels 16-20: gaps 1500-2300 (widening)
- Levels 21-25: gaps 2500-3100 (widening further)
- Levels 26-30: gaps 3300-4100 (approaching endgame)

**XP budget vs. trail capacity:**
- 93 nodes, total base xpReward = 6,100
- Max theoretical XP (all 93 nodes, 3 stars, perfect): ~25,575
- Realistic XP (all 93 nodes, avg 2 stars): ~11,625
- Level 20 at 18,500 XP: achievable by completing ~75% of nodes at 2-3 stars
- Level 25 at 32,500 XP: requires replaying or high performance on most nodes
- Level 30 at 51,000 XP: aspirational, requires extensive replay (1.5-2x trail completion)
- Prestige: reachable only by dedicated players replaying content

### Pattern 2: Prestige Level Computation

**What:** When `totalXp >= XP_LEVELS[29].xpRequired`, compute prestige tier dynamically.

```javascript
// New prestige constants
export const MAX_STATIC_LEVEL = 30;
export const PRESTIGE_XP_PER_TIER = 3000; // Fixed XP per Maestro tier
export const PRESTIGE_BASE_XP = XP_LEVELS[XP_LEVELS.length - 1].xpRequired; // 51000

export const calculateLevel = (totalXp) => {
  // Check static levels (1-30)
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_LEVELS[i].xpRequired) {
      // At max static level, check for prestige
      if (i === XP_LEVELS.length - 1) {
        const xpBeyondMax = totalXp - PRESTIGE_BASE_XP;
        const prestigeTier = Math.floor(xpBeyondMax / PRESTIGE_XP_PER_TIER);
        if (prestigeTier > 0) {
          return {
            level: MAX_STATIC_LEVEL + prestigeTier,
            title: `Maestro ${prestigeTier}`,
            icon: '👑',
            isPrestige: true,
            prestigeTier
          };
        }
      }
      return { ...XP_LEVELS[i], isPrestige: false, prestigeTier: 0 };
    }
  }
  return { ...XP_LEVELS[0], isPrestige: false, prestigeTier: 0 };
};
```

**Prestige XP per tier rationale:** 3000 XP = roughly 5-6 node completions at 2-3 stars with bonuses. This provides meaningful progress per play session without making tiers trivially fast.

### Pattern 3: getLevelProgress with Prestige Awareness

```javascript
export const getLevelProgress = (totalXp) => {
  const currentLevelData = calculateLevel(totalXp);
  const currentLevel = currentLevelData.level;

  // Prestige levels (beyond 30)
  if (currentLevelData.isPrestige) {
    const tierStartXp = PRESTIGE_BASE_XP +
      (currentLevelData.prestigeTier * PRESTIGE_XP_PER_TIER);
    const nextTierXp = tierStartXp + PRESTIGE_XP_PER_TIER;
    const xpInTier = totalXp - tierStartXp;

    return {
      currentLevel: currentLevelData,
      nextLevelXP: nextTierXp,
      xpInCurrentLevel: xpInTier,
      xpNeededForNext: PRESTIGE_XP_PER_TIER - xpInTier,
      progressPercentage: Math.floor((xpInTier / PRESTIGE_XP_PER_TIER) * 100),
      isPrestige: true
    };
  }

  // Level 30 but not yet prestige tier 1
  if (currentLevel >= MAX_STATIC_LEVEL) {
    const xpBeyond = totalXp - PRESTIGE_BASE_XP;
    return {
      currentLevel: currentLevelData,
      nextLevelXP: PRESTIGE_BASE_XP + PRESTIGE_XP_PER_TIER,
      xpInCurrentLevel: xpBeyond,
      xpNeededForNext: PRESTIGE_XP_PER_TIER - xpBeyond,
      progressPercentage: Math.floor((xpBeyond / PRESTIGE_XP_PER_TIER) * 100),
      isPrestige: false
    };
  }

  // Normal levels 1-29 (existing logic unchanged)
  const currentLevelXP = XP_LEVELS[currentLevel - 1].xpRequired;
  const nextLevelXP = XP_LEVELS[currentLevel].xpRequired;
  const xpInCurrentLevel = totalXp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - totalXp;
  const progressPercentage = Math.floor(
    (xpInCurrentLevel / (nextLevelXP - currentLevelXP)) * 100
  );

  return {
    currentLevel: currentLevelData,
    nextLevelXP,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercentage,
    isPrestige: false
  };
};
```

### Pattern 4: Postgres Migration

```sql
-- Step 1: Drop old CHECK constraint (currently caps at 10)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_level_valid;

-- Step 2: Add new constraint (no upper bound for prestige)
ALTER TABLE students ADD CONSTRAINT students_level_valid
  CHECK (current_level >= 1);

-- Step 3: Replace award_xp function with 30-level + prestige support
DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER);

CREATE OR REPLACE FUNCTION award_xp(
  p_student_id UUID,
  p_xp_amount INTEGER
)
RETURNS TABLE(
  new_total_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN
) AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_level_thresholds INTEGER[] := ARRAY[
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
    4000, 5000, 6200, 7500, 9000,
    10500, 12200, 14100, 16200, 18500,
    21000, 23700, 26500, 29400, 32500,
    35800, 39300, 43000, 46900, 51000
  ];
  v_prestige_xp_per_tier INTEGER := 3000;
  v_leveled_up BOOLEAN;
BEGIN
  -- SECURITY CHECK
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() != p_student_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only award XP to yourself';
  END IF;

  SELECT total_xp, current_level INTO v_current_xp, v_current_level
  FROM students WHERE id = p_student_id;

  IF v_current_xp IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;

  v_new_xp := v_current_xp + p_xp_amount;

  -- Calculate level from thresholds (1-30)
  v_new_level := 1;
  FOR i IN 1..30 LOOP
    IF v_new_xp >= v_level_thresholds[i] THEN
      v_new_level := i;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Prestige tiers (beyond 30)
  IF v_new_level = 30 THEN
    DECLARE v_xp_beyond INTEGER := v_new_xp - v_level_thresholds[30];
    BEGIN
      IF v_xp_beyond >= v_prestige_xp_per_tier THEN
        v_new_level := 30 + FLOOR(v_xp_beyond::numeric / v_prestige_xp_per_tier);
      END IF;
    END;
  END IF;

  v_leveled_up := v_new_level > v_current_level;

  UPDATE students
  SET total_xp = v_new_xp, current_level = v_new_level
  WHERE id = p_student_id;

  RETURN QUERY SELECT v_new_xp, v_new_level, v_leveled_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION award_xp(UUID, INTEGER) TO authenticated;

-- Step 4: Fix existing students whose current_level is capped at 10
-- This corrects the pre-existing mismatch between JS (15 levels) and DB (10-level loop)
UPDATE students SET current_level = CASE
  WHEN total_xp >= 51000 THEN 30 + FLOOR((total_xp - 51000)::numeric / 3000)
  WHEN total_xp >= 46900 THEN 29
  WHEN total_xp >= 43000 THEN 28
  -- ... (all 30 thresholds)
  WHEN total_xp >= 100 THEN 2
  ELSE 1
END
WHERE total_xp > 3200 AND current_level <= 10;
```

### Pattern 5: UI Changes -- isMaxLevel Replacement

**All files with `level >= 15` or `isMaxLevel`:**

| File | Line | Current | Change To |
|------|------|---------|-----------|
| `xpSystem.js` | 53 | `currentLevel >= 15` | `currentLevel >= MAX_STATIC_LEVEL` (then prestige path) |
| `xpSystem.js` | 66 | `currentLevel >= 15` | `currentLevel >= MAX_STATIC_LEVEL` (then prestige path) |
| `XPProgressCard.jsx` | 50 | `level >= 15` | `false` (prestige players still see progress) |
| `Dashboard.jsx` | 199 | `level >= 15` | `false` (prestige players still see progress) |

**Key semantic change:** `isMaxLevel` no longer means "stop showing progress". With prestige, there IS no max level. The progress bar always shows progress toward the next tier. For prestige players, the bar uses golden/amber gradient instead of blue/indigo.

### Pattern 6: Golden Prestige Visual Treatment

```jsx
// Progress bar: normal vs prestige
const barClass = isPrestige
  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500'
  : 'bg-gradient-to-r from-blue-400 to-indigo-600';

const barShadow = isPrestige
  ? '0 0 8px rgba(251,191,36,0.6), 0 0 20px rgba(251,191,36,0.3)'
  : undefined;

// Level pill on Dashboard: normal vs prestige
const pillBorderGradient = isPrestige
  ? 'linear-gradient(to right, #fbbf24, #f59e0b, #fbbf24)'  // golden
  : 'linear-gradient(to right, #38bdf8, #f97316)';            // existing cyan-orange

// XPRing: golden gradient for prestige
// Replace url(#xp-ring-grad) stops with amber/gold colors when isPrestige
```

### Pattern 7: Level-Up Celebration Enhancement

**Current behavior** (VictoryScreen lines 894-900): Shows "Level Up!" text and the level title.

**Enhanced behavior:**
1. For normal level-ups (2-29): Same block but explicitly show "You are now a [Title]!" text
2. For Level 30 (prestige entry): Special prestige celebration -- golden confetti, "You've reached Prestige!" headline, one-time modal (tracked via `levelUpTracking.js` with level 30)
3. For prestige level-ups (31+): Show "Maestro [N]" with golden styling in the existing level-up block

```jsx
// VictoryScreen level-up block enhancement
{xpData.leveledUp && (
  <div className={`${reducedMotion ? '' : 'animate-bounce'} mt-2 rounded-lg px-3 py-2 text-center shadow-lg ${
    levelProgressData?.currentLevel?.isPrestige || xpData.newLevel >= 30
      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'  // Golden for prestige
      : 'bg-gradient-to-r from-purple-500 to-pink-500'   // Normal purple
  }`}>
    <div className="text-xs font-semibold text-white/90">
      {xpData.newLevel === 30
        ? t('victory.prestigeUnlocked')
        : t('victory.levelUp')}
    </div>
    <div className="text-base font-bold text-white">
      {t('victory.youAreNow', {
        title: levelProgressData?.currentLevel?.title
          ? t(`xpLevels.${levelProgressData.currentLevel.title}`,
              { defaultValue: levelProgressData.currentLevel.title })
          : t('victory.levelLabel', { level: xpData.newLevel })
      })}
    </div>
  </div>
)}
```

### Anti-Patterns to Avoid
- **Do NOT add prestige levels to XP_LEVELS array:** The array stays fixed at 30 entries. Prestige is computed dynamically from XP beyond level 30.
- **Do NOT rename existing levels 1-15:** Users have existing progress and mental associations. The "Maestro" overlap at level 13 is insignificant.
- **Do NOT use `user_metadata` for prestige state:** The DB `current_level` column is ground truth. Prestige is derived from `current_level > 30`.
- **Do NOT update only JS or only Postgres:** Level computation in both must match exactly. A mismatch causes the `leveledUp` flag to fire incorrectly.
- **Do NOT leave `isMaxLevel` semantics unchanged:** With prestige, there is no max level. Progress bars must always show progress.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Level-up deduplication | Custom dedup logic | Existing `levelUpTracking.js` | Already handles localStorage-based celebration dedup per user per level |
| Celebration animation | Custom animation system | Existing `celebrationTiers.js` + `ConfettiEffect` | Already determines tier based on stars, boss, and level-up |
| Level title localization | Hardcoded strings | Existing i18n pattern `t('xpLevels.TitleKey')` | Pattern established for all 15 levels, extend to 30 |
| Prestige entry tracking | New tracking system | Existing `levelUpTracking.js` (`markLevelCelebrated(userId, 30)`) | Level-number agnostic, works for any level including prestige entry |

**Key insight:** The existing level-up system is well-designed for extension. The main work is data entry (level definitions, thresholds, i18n) and adding the prestige computation branch, not architectural changes.

## Common Pitfalls

### Pitfall 1: JS and Postgres Level Threshold Mismatch
**What goes wrong:** `xpSystem.js` has 30 thresholds but `award_xp` Postgres function only has 10. The DB returns `new_level = 10` while JS computes `level = 25`. The `leveledUp` flag fires incorrectly.
**Why it happens:** The Postgres `award_xp` function was written with a hardcoded 10-entry array and `FOR i IN 1..10` loop bounds.
**How to avoid:** Migration MUST update both the threshold array AND the loop bound to 30. Include prestige calculation in both JS and SQL. Test with XP values that cross level boundaries.
**Warning signs:** `xpData.newLevel` from the RPC call does not match `calculateLevel(xpData.newTotalXP).level`.

### Pitfall 2: CHECK Constraint Blocking Writes
**What goes wrong:** The `students_level_valid` constraint says `current_level >= 1 AND current_level <= 10`. Any `award_xp` call that computes a level > 10 will fail with a constraint violation error.
**Why it happens:** The constraint was added in `20260124000001_add_skill_trail_system.sql` line 89 and was never updated when JS levels expanded to 15.
**How to avoid:** The migration MUST drop the old constraint and add a new one with no upper bound (just `current_level >= 1`). Do this BEFORE updating the `award_xp` function.
**Warning signs:** Postgres error `23514: new row for relation "students" violates check constraint "students_level_valid"`.

### Pitfall 3: Existing Level 10 Cap Already Active
**What goes wrong:** Students with >3200 XP currently have `current_level = 10` in the DB because `award_xp` loops `FOR i IN 1..10`. The JS displays their correct level (11-15) because `calculateLevel()` uses the 15-entry array. But any DB query checking `current_level` returns a wrong value.
**Why it happens:** JS was extended to 15 levels but the DB function was never updated.
**How to avoid:** The migration must include a data fixup step that recalculates `current_level` for all existing students based on their `total_xp` using the new 30-level thresholds.
**Warning signs:** Students showing "Level 12 - Virtuoso" on UI but `current_level = 10` in the database.

### Pitfall 4: isMaxLevel Hardcoded to 15 in Multiple Files
**What goes wrong:** `XPProgressCard.jsx:50`, `Dashboard.jsx:199` both check `level >= 15` to determine max level. If levels expand to 30, these still cap at 15, showing "MAX LEVEL" for level 15 students.
**Why it happens:** Hardcoded magic number replicated across files.
**How to avoid:** Export `MAX_STATIC_LEVEL = 30` from `xpSystem.js`. Replace all `>= 15` checks. For prestige, there is no max -- always show progress. Remove the "MAX LEVEL" concept entirely.
**Warning signs:** UI shows "MAX LEVEL" for any student at level 15 even though level 16-30 exist.

### Pitfall 5: XPRing and UnifiedStatsCard isMaxLevel Semantics
**What goes wrong:** `isMaxLevel` currently fills the progress bar to 100% and shows only total XP (no fraction). With prestige, this behavior should never trigger -- prestige players need a progress bar showing progress toward next Maestro tier.
**Why it happens:** The concept of "max level" no longer applies with infinite prestige.
**How to avoid:** `isMaxLevel` should become `false` for all players. Instead, add an `isPrestige` prop that triggers golden bar styling. Progress bars always show incremental progress.

### Pitfall 6: i18n Key Pattern for Prestige Titles
**What goes wrong:** Level titles use `t('xpLevels.Concert Master')` with the English title as key. Prestige titles ("Maestro 1", "Maestro 2", etc.) are dynamic and cannot have pre-defined keys for each tier.
**Why it happens:** Static level names work as i18n keys, but prestige tier numbers are unbounded.
**How to avoid:** Use a parameterized i18n key: `t('xpLevels.prestigeTitle', { tier: prestigeTier })` where the translation is "Maestro {{tier}}". This handles all tiers with a single key.

## Code Examples

### i18n Keys to Add

**English (`src/locales/en/common.json` -- xpLevels section):**
```json
{
  "xpLevels": {
    "Beginner": "Beginner",
    "Music Sprout": "Music Sprout",
    "Note Finder": "Note Finder",
    "Melody Maker": "Melody Maker",
    "Rhythm Keeper": "Rhythm Keeper",
    "Music Explorer": "Music Explorer",
    "Sound Wizard": "Sound Wizard",
    "Piano Pro": "Piano Pro",
    "Music Master": "Music Master",
    "Symphony Star": "Symphony Star",
    "Harmony Hero": "Harmony Hero",
    "Virtuoso": "Virtuoso",
    "Maestro": "Maestro",
    "Grand Master": "Grand Master",
    "Legend": "Legend",
    "Composer": "Composer",
    "Conductor": "Conductor",
    "Concert Master": "Concert Master",
    "Prodigy": "Prodigy",
    "Orchestrator": "Orchestrator",
    "Music Sage": "Music Sage",
    "Melodist": "Melodist",
    "Symphonist": "Symphonist",
    "Music Architect": "Music Architect",
    "Philharmonic": "Philharmonic",
    "Opus Creator": "Opus Creator",
    "Concerto Star": "Concerto Star",
    "Music Luminary": "Music Luminary",
    "Grand Virtuoso": "Grand Virtuoso",
    "Transcendent": "Transcendent",
    "prestigeTitle": "Maestro {{tier}}"
  }
}
```

**Hebrew (`src/locales/he/common.json` -- xpLevels section):**
```json
{
  "xpLevels": {
    "Beginner": "מתחילים",
    "Music Sprout": "נבט מוזיקלי",
    "Note Finder": "מוצא תווים",
    "Melody Maker": "יוצר מנגינות",
    "Rhythm Keeper": "שומר הקצב",
    "Music Explorer": "חוקר מוזיקה",
    "Sound Wizard": "קוסם הצלילים",
    "Piano Pro": "מקצוען הפסנתר",
    "Music Master": "מאסטר המוזיקה",
    "Symphony Star": "כוכב הסימפוניה",
    "Harmony Hero": "גיבור ההרמוניה",
    "Virtuoso": "וירטואוז",
    "Maestro": "מאסטרו",
    "Grand Master": "גרנד מאסטר",
    "Legend": "אגדה",
    "Composer": "מלחין",
    "Conductor": "מנצח",
    "Concert Master": "קונצרטמייסטר",
    "Prodigy": "ילד פלא",
    "Orchestrator": "מעבד תזמורתי",
    "Music Sage": "חכם המוזיקה",
    "Melodist": "מלודיסט",
    "Symphonist": "סימפוניסט",
    "Music Architect": "אדריכל המוזיקה",
    "Philharmonic": "פילהרמוני",
    "Opus Creator": "יוצר אופוס",
    "Concerto Star": "כוכב הקונצרטו",
    "Music Luminary": "גדול המוזיקה",
    "Grand Virtuoso": "וירטואוז גדול",
    "Transcendent": "נעלה",
    "prestigeTitle": "מאסטרו {{tier}}"
  }
}
```

### Additional i18n Keys Needed

```json
{
  "victory": {
    "youAreNow": "You are now a {{title}}!",
    "prestigeUnlocked": "Prestige Unlocked!",
    "prestigeEntry": "You've reached the highest level! Welcome to Maestro tier!"
  }
}
```

### Dashboard Level Pill with Title

```jsx
// Dashboard.jsx - level pill enhanced with title
<div className="flex h-6 items-center rounded-full border-2 border-transparent pl-5 pr-2 shadow -ml-7"
  style={{
    background: isPrestige
      ? "linear-gradient(to right, rgba(30,41,59,0.85), rgba(30,41,59,0.85)) padding-box, linear-gradient(to right, #fbbf24, #f59e0b, #fbbf24) border-box"
      : "linear-gradient(to right, rgba(30,41,59,0.85), rgba(30,41,59,0.85)) padding-box, linear-gradient(to right, #38bdf8, #f97316) border-box",
    boxShadow: isPrestige ? '0 2px 12px rgba(251,191,36,0.5)' : '0 2px 12px rgba(56,189,248,0.4)',
  }}
>
  <span className="ml-3 text-xs font-bold uppercase tracking-wider text-white">
    {isPrestige
      ? t('xpLevels.prestigeTitle', { tier: levelData.prestigeTier })
      : t('dashboard.header.level', { level, defaultValue: `Level ${level}` })}
  </span>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 10-level DB threshold array | Must expand to 30 + prestige | This phase | DB has been capping at level 10 while JS shows up to 15 |
| `current_level <= 10` constraint | Must remove upper bound | This phase | Currently silently blocks levels > 10 in DB |
| Hardcoded `>= 15` max level | Must use exported constant + prestige check | This phase | 4 files need updating |
| `isMaxLevel` = "stop showing progress" | `isPrestige` = "show golden progress" | This phase | Semantic inversion -- progress always visible |

**Critical pre-existing issue:** The DB `award_xp` function loops 1..10 but JS `XP_LEVELS` has 15 entries. Any student above 3200 XP has `current_level = 10` in the DB while the UI correctly shows their level from JS computation. This phase must fix this data inconsistency.

## Open Questions

1. **Pre-existing DB level cap at 10**
   - What we know: `award_xp` loops `1..10`, CHECK constraint says `<= 10`, but `XP_LEVELS` has 15 entries
   - What's unclear: How many production students are affected (anyone with >3200 XP has wrong `current_level` in DB)
   - Recommendation: Include a data fixup UPDATE in the migration that recalculates `current_level` for all students based on `total_xp` using the new 30-level thresholds. This is a one-time correction.

2. **Prestige celebration design**
   - What we know: User wants a special one-time celebration at Level 30 entry, "beyond normal level-up modal"
   - Recommendation: Keep it simple -- reuse the existing level-up celebration block in VictoryScreen but with golden styling and a special "Prestige Unlocked!" headline. Use `levelUpTracking.js` to deduplicate (level 30). A separate modal adds complexity without proportional value for a rare event. The golden confetti from `ConfettiEffect` already supports tier-based styling.

3. **Exact prestige XP per tier (3000)**
   - What we know: 3000 XP = ~5-6 node completions at 2-3 stars
   - What's unclear: Whether this feels too fast or too slow for prestige players
   - Recommendation: Start with 3000 and adjust later. The value is a single constant in both JS and SQL, trivial to tune.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (JSDOM environment) |
| Config file | vite.config.js (test section) |
| Quick run command | `npx vitest run src/utils/xpSystem.test.js -x` |
| Full suite command | `npm run test:run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROG-01 | XP_LEVELS has 30 entries with sequential thresholds | unit | `npx vitest run src/utils/xpSystem.test.js -x` | No -- Wave 0 |
| PROG-01 | calculateLevel returns correct level for all 30 thresholds | unit | same | No -- Wave 0 |
| PROG-01 | getLevelProgress returns correct XP fractions for levels 16-30 | unit | same | No -- Wave 0 |
| PROG-02 | calculateLevel returns prestige object for XP beyond level 30 | unit | same | No -- Wave 0 |
| PROG-02 | getLevelProgress computes prestige tier progress correctly | unit | same | No -- Wave 0 |
| PROG-02 | getNextLevelXP returns prestige XP cost for prestige levels | unit | same | No -- Wave 0 |
| PROG-02 | Prestige tier 0 does not trigger for XP exactly at level 30 threshold | unit | same | No -- Wave 0 |
| PROG-03 | Every level 1-30 has a non-empty title and icon | unit | same | No -- Wave 0 |
| PROG-03 | Every level 1-30 has a unique title | unit | same | No -- Wave 0 |
| PROG-03 | isPrestige flag is false for levels 1-30, true for 31+ | unit | same | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/utils/xpSystem.test.js -x`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/utils/xpSystem.test.js` -- covers PROG-01, PROG-02, PROG-03 (core XP math, prestige logic, level definitions)

## Sources

### Primary (HIGH confidence)
- `src/utils/xpSystem.js` -- current 15-level implementation, all functions requiring modification
- `supabase/migrations/20260126000001_fix_award_xp_security.sql` -- current `award_xp` function (10-level array, `FOR i IN 1..10`)
- `supabase/migrations/20260124000001_add_skill_trail_system.sql` -- `students_level_valid` CHECK constraint (line 89: `current_level <= 10`)
- `src/components/games/VictoryScreen.jsx` -- level-up celebration block (lines 894-900), xpData handling
- `src/components/layout/Dashboard.jsx` -- `isMaxLevel = level >= 15` (line 199), level pill (lines 640-653), UnifiedStatsCard integration (lines 688-704)
- `src/components/dashboard/XPProgressCard.jsx` -- `isMaxLevel = level >= 15` (line 50), progress bar styling
- `src/components/dashboard/XPRing.jsx` -- `isMaxLevel` prop, SVG gradient definition
- `src/components/dashboard/UnifiedStatsCard.jsx` -- `isMaxLevel` prop, layout structure
- `src/locales/en/common.json` -- `xpLevels` section (lines 1091-1107, 15 entries)
- `src/locales/he/common.json` -- `xpLevels` section (lines 1098-1114, 15 entries)
- `src/utils/levelUpTracking.js` -- celebration deduplication (level-number agnostic)
- `src/utils/celebrationTiers.js` -- tier determination (handles `leveledUp` flag)
- Trail XP budget calculation: 93 nodes, total base xpReward = 6,100; max theoretical with bonuses ~25,575

### Secondary (MEDIUM confidence)
- XP threshold curve design based on trail XP budget analysis. Actual player XP distribution depends on play patterns, replays, and comeback bonuses.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, entirely existing infrastructure
- Architecture: HIGH -- patterns are straightforward extensions of existing code with clear integration points
- Pitfalls: HIGH -- identified from direct code inspection; DB/JS mismatch is a verified real finding
- XP thresholds: MEDIUM -- curve tuning depends on player behavior data not available

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no external dependencies)
