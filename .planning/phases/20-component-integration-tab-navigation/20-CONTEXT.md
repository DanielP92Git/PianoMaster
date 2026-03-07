# Phase 20: Extended Progression System - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the XP level system from 15 to 30 levels with themed musical mastery names, add infinite prestige tiers (Maestro I, II, III...) after Level 30, and show per-level title rewards in the level-up celebration. Requires database migration (award_xp thresholds, CHECK constraint), JS-side level definitions, and UI updates for prestige visual treatment. No new accessories — titles only.

</domain>

<decisions>
## Implementation Decisions

### Level Names & Theme
- Musical mastery theme continuing the existing journey (Beginner -> Legend -> advanced musical roles)
- Levels 16-30 use real music profession/mastery terms: Composer, Conductor, Concert Master, Prodigy, etc.
- Continue using emoji icons for levels 16-30 (consistent with levels 1-15)
- Claude's discretion on whether to rename existing levels 1-15 for a more coherent 1-30 arc vs. keeping them and working around existing titles (Maestro at 13, Virtuoso at 12)
- Level names must be localized in both English and Hebrew (i18n keys, not hardcoded strings)

### Prestige Tiers
- Infinite prestige tiers after Level 30: Maestro I, Maestro II, Maestro III...
- XP continues accumulating (no reset at prestige entry)
- Fixed XP cost per prestige tier (same amount for each Maestro level)
- Golden level badge for prestige players — visually distinct from normal shield badge
- Special one-time celebration when first reaching Level 30 (prestige entry) — beyond normal level-up modal
- Prestige tiers just show "Maestro N" — no unique names per prestige level

### Per-Level Rewards
- Titles only — no new accessories for this phase
- Existing accessory unlock system continues to work independently (games_played, streak, etc.)
- Level-up celebration shows the new title earned ("You are now a Concert Master!")
- Title displayed persistently on dashboard badge (level number + title)

### XP Curve Design
- Continue the established widening XP gap pattern for levels 16-30
- Expand the Postgres `award_xp` function to 30 level thresholds (DB is ground truth)
- Remove `students_level_valid` CHECK constraint cap at level 10, update to accommodate 30+ levels
- Fixed XP per prestige tier (Claude determines exact amount based on available XP from 93-node trail)
- Golden/amber progress bar gradient in prestige mode (replaces normal indigo/purple bar)

### Claude's Discretion
- Exact XP thresholds for levels 16-30 (continue widening pattern, tuned to 93-node trail XP availability)
- Exact XP cost per prestige tier
- Whether to rename existing levels 1-15 or keep them
- Specific emoji icons for levels 16-30
- Prestige celebration modal design (reuse boss unlock 3-stage pattern or simpler approach)
- Exact golden badge and golden progress bar styling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/xpSystem.js`: XP_LEVELS array (15 entries), calculateLevel(), getLevelProgress(), getNextLevelXP(), awardXP() — all need extension
- `src/components/ui/AccessoryUnlockModal.jsx`: Treasure chest unlock animation — pattern reusable for prestige celebration
- `src/hooks/useAccessories.js`: useAccessoriesList(), useUserAccessories() — accessory system fully built, supports `unlock_requirement.type='level'`
- `src/components/ui/UnlockRequirementModal.jsx`: Already handles level-based unlock progress display
- `src/utils/celebrationTiers.js`: Tiered celebration logic — could inform prestige celebration tier
- `src/hooks/useBossUnlockTracking.js`: Boss unlock 3-stage modal pattern — reusable for prestige celebration

### Established Patterns
- Level calculation done both in Postgres (`award_xp` function with threshold array) and JS (`xpSystem.js`)
- DB `award_xp` returns `{ new_total_xp, new_level, leveled_up }` — prestige needs to fit this interface
- `students.current_level` stored in DB, used for rendering and accessory unlock checks
- VictoryScreen already handles `xpData.leveledUp` flag to show level-up celebration
- Level titles displayed via `calculateLevel(totalXp).title` — titles come from XP_LEVELS array

### Integration Points
- `src/components/games/VictoryScreen.jsx:526-539`: Level-up celebration block — needs title display + prestige check
- `src/components/dashboard/XPProgressCard.jsx:50`: `isMaxLevel = level >= 15` — needs update
- `src/components/layout/Dashboard.jsx:199`: `isMaxLevel = level >= 15` — needs update
- `src/utils/xpSystem.js:53,66`: `currentLevel >= 15` hardcoded max — needs expansion
- `supabase/migrations/20260126000001_fix_award_xp_security.sql`: `award_xp` function with 10-level array — needs 30+ levels
- `supabase/migrations/20260124000001_add_skill_trail_system.sql:89`: CHECK constraint `current_level <= 10` — needs removal/update
- Locales: `src/locales/en/` and `src/locales/he/` need level name i18n keys

</code_context>

<specifics>
## Specific Ideas

- Musical mastery titles should feel aspirational for 8-year-olds: real music roles they can dream about
- Golden badge and golden progress bar create a clear "I'm in endgame" feeling for prestige players
- Special prestige entry celebration at Level 30 should feel like a significant achievement — this is a major milestone
- Titles on dashboard badge reinforce identity: "I'm a Concert Master" is more motivating than "I'm Level 20"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 20-extended-progression-system*
*Context gathered: 2026-03-07*
