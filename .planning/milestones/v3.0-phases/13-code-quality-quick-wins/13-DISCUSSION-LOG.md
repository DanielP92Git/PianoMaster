# Phase 13: Code Quality Quick Wins - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 13-code-quality-quick-wins
**Areas discussed:** XP-01 scope, apiDatabase migration, utility consolidation target, TeacherDashboard lazy-load, AchievementsLegacy safety, plan sequencing

---

## XP-01 Scope Clarification

| Option                         | Description                                                                                            | Selected |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | -------- |
| Update locale strings too      | Change 'Total Points' to 'Total XP' in both EN and HE locale files. Completes XP migration end-to-end. | ✓        |
| Skip locale strings            | Mark XP-01 as done since JS code is already correct. Locale cleanup for future i18n audit.             |          |
| Mark XP-01 as already complete | Consider XP-01 already satisfied since 0 JS occurrences remain.                                        |          |

**User's choice:** Update locale strings too (Recommended)
**Notes:** JS teacher code already uses total_xp. ~5 locale string occurrences remain and should be updated.

---

## apiDatabase.js Migration

| Option                                       | Description                                                                  | Selected |
| -------------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| Delete local, import from authorizationUtils | Remove local function, add import. Same pattern as other services.           |          |
| Investigate first, then decide               | Have researcher check for circular dependency before committing to strategy. | ✓        |

**User's choice:** Investigate first, then decide
**Notes:** User prefers safety — researcher should verify no circular dependency between apiDatabase.js and authorizationUtils.js before planning the migration.

---

## Utility Consolidation Target — noteNameToMidi

| Option                               | Description                                                      | Selected |
| ------------------------------------ | ---------------------------------------------------------------- | -------- |
| New src/utils/noteUtils.js           | Clean separation. Pure utility for note name to MIDI conversion. | ✓        |
| Add to existing musicSymbolShapes.js | Reuse existing music file, but may mix concerns.                 |          |
| You decide                           | Claude picks based on codebase patterns.                         |          |

**User's choice:** New src/utils/noteUtils.js (Recommended)
**Notes:** None

---

## Utility Consolidation Target — calculateStars

| Option                          | Description                                                 | Selected |
| ------------------------------- | ----------------------------------------------------------- | -------- |
| Keep in skillProgressService.js | Already there as \_calculateStarsFromPercentage. Export it. | ✓        |
| Move to xpSystem.js             | Stars are part of XP/reward system.                         |          |
| You decide                      | Claude picks based on import patterns.                      |          |

**User's choice:** Keep in skillProgressService.js (Recommended)
**Notes:** None

---

## TeacherDashboard Lazy Load

| Option                                  | Description                                                                            | Selected |
| --------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| Just React.lazy() the main import       | Change App.jsx to lazy import. Students never download 2538-line bundle. Minimal risk. | ✓        |
| Also split sub-tabs into separate files | Extract sub-components into own files, lazy-load each tab. More savings but more risk. |          |

**User's choice:** Just React.lazy() the main import (Recommended)
**Notes:** None

---

## AchievementsLegacy Safety

| Option                         | Description                                                         | Selected |
| ------------------------------ | ------------------------------------------------------------------- | -------- |
| Delete file + remove comment   | File is dead code (zero imports), comment is stale. Clean deletion. | ✓        |
| Delete file only, keep comment | Remove file but preserve rollback note as historical context.       |          |

**User's choice:** Delete file + remove comment (Recommended)
**Notes:** Verified: only reference is a stale rollback comment in Achievements.jsx line 2. Zero actual imports.

---

## Plan Sequencing

| Option                     | Description                                                                                  | Selected |
| -------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Two plans: dedup + cleanup | Plan 1: QUAL-01/02/03 (import rewiring). Plan 2: QUAL-04/05/07 + XP-01 (deletions + config). | ✓        |
| One plan for everything    | All 7 requirements in single plan. Simpler tracking, larger blast radius.                    |          |
| Three plans by risk        | Safe deletions, import rewiring, lazy load + XP as separate plans.                           |          |

**User's choice:** Two plans: dedup + cleanup (Recommended)
**Notes:** None

---

## Claude's Discretion

- Internal implementation of noteNameToMidi in new util file
- Whether lazyWithRetry.js is suitable for TeacherDashboard lazy import
- Exact locale key changes (rename keys vs just change values)

## Deferred Ideas

- TeacherDashboard sub-tab splitting — future refactoring milestone
- Locale key renaming (pointsEarnedDescription → xpEarnedDescription) — future i18n audit
