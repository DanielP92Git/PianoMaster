# Phase 15: Verification & Deploy - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

All operational loose ends are closed: daily goals work with all game types, deploy process is documented, and pending manual verification items are completed. Three requirements: GOAL-01, DEPLOY-01, UAT-01.

Not in scope: New game types, trail content, god component refactoring, i18n audit, or any feature work.

</domain>

<decisions>
## Implementation Decisions

### Daily Goals Audit (GOAL-01)

- **D-01:** Verify + add tests. Read `dailyGoalsService.js`, confirm all 5 goal types (complete_exercises, earn_three_stars, practice_new_node, perfect_score, maintain_streak) work with all 11 exercise types. Fix only if bugs are found.
- **D-02:** Always add regression tests regardless of whether bugs are found. Tests prove the service handles all game types and prevent future breakage if someone adds a category filter.
- **D-03:** Current code appears to count all game types already (no category filter in `calculateDailyProgress`). The audit should confirm this and verify edge cases (e.g., do ear training scores appear in `students_score`? Do arcade rhythm nodes appear in `student_skill_progress`?).

### Deploy Sequencing Doc (DEPLOY-01)

- **D-04:** Doc lives in `docs/` folder (alongside DESIGN_SYSTEM.md and SECURITY_GUIDELINES.md). Persistent, discoverable.
- **D-05:** Doc covers four areas: (1) deploy order (Supabase migration first, then Netlify), (2) rollback steps, (3) environment variable names only (no secret values — names are safe to commit), (4) Edge Function deploy process.
- **D-06:** Environment variables listed by name only (e.g., `CRON_SECRET`, `VAPID_PUBLIC_KEY`). No actual values in the doc.

### UAT Verification (UAT-01)

- **D-07:** Claude creates a guided step-by-step testing checklist with exact actions and expected results. User runs it on device and reports pass/fail.
- **D-08:** Target devices: Android phone (PWA), iOS phone (Safari/PWA), Desktop browser. All 5 items tested on all applicable devices.
- **D-09:** If a UAT item fails, fix it within this phase. Don't defer failures to a future milestone.

### Claude's Discretion

- Test file naming and structure for daily goals tests
- Deploy doc formatting (markdown sections, tables, etc.)
- UAT checklist formatting and grouping by device

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Daily Goals

- `src/services/dailyGoalsService.js` -- All 5 goal types and `calculateDailyProgress` function
- `src/data/constants.js` -- `EXERCISE_TYPES` enum (11 types including v2.9 additions)

### Deploy Infrastructure

- `supabase/migrations/` -- Database migration files (deploy order context)
- `supabase/functions/` -- Edge Functions that need separate deploy
- `docs/SECURITY_GUIDELINES.md` -- Security patterns relevant to deploy (auth caching, RLS)

### UAT Items

- `.planning/milestones/v2.9-phases/08-audio-infrastructure-rhythm-games/08-HUMAN-UAT.md` -- 5 pending test items with expected results

### Existing Patterns

- `src/test/setupTests.js` -- Vitest test setup
- `docs/DESIGN_SYSTEM.md` -- Design system reference

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `dailyGoalsService.js` -- Already queries `students_score` without game_type filter; `exercisesCompleted` = `todaysScores.length + todaysNodeProgress.length`
- `src/services/authorizationUtils.js` -- `verifyStudentDataAccess` used in daily goals service
- `src/data/constants.js` -- `EXERCISE_TYPES` has all 11 types for test assertions

### Established Patterns

- Vitest with JSDOM for component tests, plain Vitest for service/utility tests
- `@testing-library/react` + `@testing-library/jest-dom` for component tests
- Test files as `*.test.{js,jsx}` siblings or in `__tests__/` directories

### Integration Points

- `students_score` table -- Where game results are stored (queried by daily goals)
- `student_skill_progress` table -- Node progress (queried by daily goals)
- Netlify deploy pipeline -- Triggered by git push to main
- Supabase dashboard -- Migration and Edge Function management

</code_context>

<specifics>
## Specific Ideas

- Environment variable names are safe to list in docs (user confirmed this practice)
- UAT checklist should be device-specific with clear pass/fail columns
- Daily goals tests should cover all 11 exercise types from `EXERCISE_TYPES` constant

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

_Phase: 15-verification-deploy_
_Context gathered: 2026-03-31_
