# Phase 13: Code Quality Quick Wins - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate duplicated utility code, remove dead code, and reduce teacher bundle from the main chunk. Seven requirements: consolidate 3 duplicated utilities (QUAL-01, QUAL-02, QUAL-03), delete dead code/files (QUAL-04, QUAL-05), lazy-load TeacherDashboard (QUAL-07), and complete XP terminology migration in locale files (XP-01).

Not in scope: God component refactoring, new game types, i18n audit, console.log cleanup (Phase 14), or daily goals audit (Phase 15).

</domain>

<decisions>
## Implementation Decisions

### Utility Consolidation (QUAL-01, QUAL-02)
- **D-01:** `noteNameToMidi` gets a new canonical home at `src/utils/noteUtils.js`. Both copies (VexFlowStaffDisplay.jsx:45 and KlavierKeyboard.jsx:22) are replaced with imports from the new util.
- **D-02:** `calculateStars` stays in `skillProgressService.js` (currently `_calculateStarsFromPercentage` at line 19). Export it and have `useVictoryState.js` import from there. Stars logic stays with progression.

### verifyStudentDataAccess Dedup (QUAL-03)
- **D-03:** Researcher should investigate whether `apiDatabase.js` has a circular dependency with `authorizationUtils.js` before committing to a strategy. If no circular dependency, delete the local copy (line 14) and import from `authorizationUtils.js`. If circular dependency exists, researcher recommends alternative approach.

### Dead Code Removal (QUAL-04, QUAL-05)
- **D-04:** Delete `src/pages/AchievementsLegacy.jsx` AND remove the stale rollback comment in `src/pages/Achievements.jsx` (line 2: "To rollback: swap this import to AchievementsLegacy").
- **D-05:** Delete 3 non-migration files from `supabase/migrations/`: `DEBUG_check_teacher_status.sql`, `README_USER_PREFERENCES.md`, `TEST_direct_insert.sql`.

### TeacherDashboard Lazy Load (QUAL-07)
- **D-06:** Just `React.lazy()` the main import in `App.jsx` (line 29). No sub-tab splitting — the whole 2538-line component loads as one lazy chunk. Students never download it. Use existing `src/utils/lazyWithRetry.js` if available.

### XP Terminology Migration (XP-01)
- **D-07:** JS teacher code already uses `total_xp` — no JS changes needed. Update locale strings in both EN and HE files: change remaining "Total Points" / "total points" references to "Total XP" / "total XP". ~5 occurrences across `en/common.json` and `he/common.json`.

### Plan Sequencing
- **D-08:** Split into 2 plans:
  - **Plan 13-01:** Utility deduplication (QUAL-01, QUAL-02, QUAL-03) — import rewiring with careful dependency checks
  - **Plan 13-02:** Dead code removal + lazy load + XP locale (QUAL-04, QUAL-05, QUAL-07, XP-01) — independent deletions and config changes

### Claude's Discretion
- Internal implementation of `noteNameToMidi` in the new util file (whether to use a lookup table or formula)
- Whether `lazyWithRetry.js` is suitable for the TeacherDashboard lazy import or if plain `React.lazy` suffices
- Exact locale key changes (whether to rename keys like `pointsEarnedDescription` or just change values)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Utility Deduplication Targets
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` — `noteNameToMidi` at line 45 (copy 1)
- `src/components/games/sight-reading-game/components/KlavierKeyboard.jsx` — `noteNameToMidi` at line 22 (copy 2)
- `src/services/skillProgressService.js` — `_calculateStarsFromPercentage` at line 19 (canonical calculateStars)
- `src/hooks/useVictoryState.js` — `calculateStars` at line 66 (duplicate)

### Authorization Dedup
- `src/services/apiDatabase.js` — local `verifyStudentDataAccess` at line 14 (duplicate, 6 internal callers at lines 57, 180, 388, 407, 420, 642)
- `src/services/authorizationUtils.js` — canonical `verifyStudentDataAccess` at line 19

### Dead Code
- `src/pages/AchievementsLegacy.jsx` — dead file (zero imports)
- `src/pages/Achievements.jsx` — line 2 has stale rollback comment to remove
- `supabase/migrations/DEBUG_check_teacher_status.sql` — non-migration file
- `supabase/migrations/README_USER_PREFERENCES.md` — non-migration file
- `supabase/migrations/TEST_direct_insert.sql` — non-migration file

### Lazy Load
- `src/App.jsx` — line 29: eager `import TeacherDashboard` (change to React.lazy)
- `src/utils/lazyWithRetry.js` — existing retry wrapper for lazy imports

### XP Locale Strings
- `src/locales/en/common.json` — lines 188, 551, 557 (still say "points")
- `src/locales/he/common.json` — corresponding Hebrew strings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/utils/lazyWithRetry.js` — existing utility for React.lazy with retry logic, likely suitable for TeacherDashboard
- `src/utils/xpSystem.js` — XP/level system, related to stars/progression domain
- `src/utils/musicSymbolShapes.js` — music-related utilities (not the right home for noteNameToMidi but shows the pattern)

### Established Patterns
- Utility files in `src/utils/` are single-concern: `dateUtils.js`, `ageUtils.js`, `pwaDetection.js`
- Service files import from `authorizationUtils.js` for auth checks: `apiScores.js`, `dailyGoalsService.js`, `accountDeletionService.js`, `dataExportService.js`
- Lazy imports likely use `lazyWithRetry` pattern (needs verification)

### Integration Points
- `noteNameToMidi` callers: VexFlowStaffDisplay.jsx (~4 call sites), KlavierKeyboard.jsx (~12 call sites)
- `calculateStars` callers: useVictoryState.js (2 call sites)
- `verifyStudentDataAccess` callers in apiDatabase.js: 6 functions
- TeacherDashboard: single import in App.jsx, single route usage

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions captured above.

</specifics>

<deferred>
## Deferred Ideas

- TeacherDashboard sub-tab splitting (Analytics, Recordings, Assignments into separate files/chunks) — future refactoring milestone
- Locale key renaming (e.g., `pointsEarnedDescription` → `xpEarnedDescription`) — future i18n audit

</deferred>

---

*Phase: 13-code-quality-quick-wins*
*Context gathered: 2026-03-31*
