# Roadmap: PianoApp v1.2

**Version:** v1.2 Trail System Stabilization
**Created:** 2026-02-03
**Phases:** 2 (Phases 6-7 — continues from v1.1)

## Overview

This milestone commits and validates existing trail redesign work (Phases 1-2 from the educational psychology-driven redesign). The work is already implemented but uncommitted.

| Phase | Name | Goal | Requirements | Status |
|-------|------|------|--------------|--------|
| 6 | Trail Stabilization | Commit, test, and fix trail redesign work | TRAIL-01-04, MEM-01-05, NAV-01-04, CLEAN-01-02 | Complete |
| 7 | Tech Debt Cleanup | Address 4 minor tech debt items from audit | DEBT-01-04 | Complete |

**Total requirements:** 15
**Coverage:** 100%

---

## Phase 6: Trail Stabilization

**Goal:** Commit existing trail work, validate through testing, fix any bugs found

**Requirements covered:**
- TRAIL-01, TRAIL-02, TRAIL-03, TRAIL-04 (Trail Foundation)
- MEM-01, MEM-02, MEM-03, MEM-04, MEM-05 (Memory Game Integration)
- NAV-01, NAV-02, NAV-03, NAV-04 (Navigation)
- CLEAN-01, CLEAN-02 (Cleanup)

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Commit all trail redesign files (foundation + integration + migrations)
- [x] 06-02-PLAN.md — Execute TEST_PLAN.md manual testing and fix discovered bugs
- [x] 06-03-PLAN.md — Remove temporary documentation and debug files

**Success criteria:**
1. User can navigate to any of the 26 treble clef nodes on the trail map
2. User can start Memory Game from nodes treble_1_4, treble_2_5, treble_3_8
3. Memory Game auto-starts with correct configuration (notes, grid size) from trail
4. User can complete a multi-exercise node, navigating between different exercise types
5. Progress persists after page refresh (stars visible on completed nodes)
6. No console errors during normal trail navigation and game completion

**Approach:**
1. **Commit existing work** — Stage and commit all trail-related files with proper structure
2. **Test execution** — Run through TEST_PLAN.md test cases manually
3. **Bug fixes** — Address any issues discovered during testing
4. **Cleanup** — Remove temporary documentation files from repo root

**Wave Structure:**
| Wave | Plans | Notes |
|------|-------|-------|
| 1 | 06-01 | Commit work (autonomous) |
| 2 | 06-02 | Test + fix (requires human verification) |
| 3 | 06-03 | Cleanup (autonomous) |

---

## Phase 7: Tech Debt Cleanup

**Goal:** Address 4 minor tech debt items identified in milestone audit

**Requirements covered:**
- DEBT-01: Create missing 05-VERIFICATION.md (documentation gap)
- DEBT-02: Add memory_game case to getExerciseTypeName() in TrailNodeModal
- DEBT-03: Remove duplicate verifyStudentDataAccess from apiScores.js (use import)
- DEBT-04: Remove window.supabase debug code from main.jsx

**Plans:** 1 plan

Plans:
- [x] 07-01-PLAN.md — Fix all 4 tech debt items (docs, i18n, refactor, debug removal)

**Success criteria:**
1. Phase 05 has VERIFICATION.md file documenting completion
2. TrailNodeModal shows "Memory Game" instead of "memory_game" for memory exercises
3. apiScores.js imports verifyStudentDataAccess from authorizationUtils.js
4. main.jsx has no window.supabase assignment

**Approach:**
1. Create verification doc for Phase 05
2. Fix UI string in TrailNodeModal + add i18n translations
3. Refactor apiScores.js to use shared utility
4. Remove debug code from main.jsx

**Wave Structure:**
| Wave | Plans | Notes |
|------|-------|-------|
| 1 | 07-01 | All 4 tasks (autonomous, independent) |

---

## Dependencies

- None — all work is already implemented

## Risks

| Risk | Mitigation |
|------|------------|
| Memory Game bugs | Existing TEST_PLAN.md covers all scenarios |
| Navigation edge cases | Multi-exercise flow already tested conceptually |
| Circular dependency issues | Already resolved in Phase 1 |

---

*Roadmap created: 2026-02-03*
*Last updated: 2026-02-03 — Phase 7 complete*
