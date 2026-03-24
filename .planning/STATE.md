---
gsd_state_version: 1.0
milestone: v2.7
milestone_name: Instrument Practice Tracking
status: Ready to plan
stopped_at: "Completed 02-02-PLAN.md (checkpoint:human-verify at Task 3)"
last_updated: "2026-03-24T12:01:38.683Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 6
  completed_plans: 6
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 02 — data-foundation-and-core-logging

## Current Position

Phase: 3
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: ~170 (across all shipped milestones)
- 17 milestones shipped in 52 days (2026-01-31 to 2026-03-24)

## Accumulated Context

### Decisions

All v2.6 decisions archived in `.planning/milestones/v2.6-ROADMAP.md`.

Phase 1 (Signup Flow Redesign) decisions:

- [Phase 01-signup-flow-redesign / Plan 00]: Real test for SignupForm checks current age step (not future role step) to avoid false failure before redesign
- [Phase 01-signup-flow-redesign / Plan 00]: useSignup.test.js has no real test — hook requires QueryClientProvider/Router context deferred to Plan 01
- [Phase 01-signup-flow-redesign / Plan 01]: birthYear integer stored as YYYY-01-01 (D-10 convention), account_status always active at signup (D-13)
- [Phase 01-signup-flow-redesign / Plan 01]: Removed unused parentEmail and refetchStatus from useAccountStatus destructure after consent block removed
- [Phase 01-signup-flow-redesign / Plan 02]: AgeGate calls onSubmit(parsedYear integer) — Plan 03 derives under-13 status from year
- [Phase 01-signup-flow-redesign / Plan 02]: ParentEmailStep is optional with Skip button — email collection is opt-in not required
- [Phase 01-signup-flow-redesign / Plan 03]: Role selection is Step 1; STUDENT_STEPS/TEACHER_STEPS drive StepDots + back-navigation; isUnder13 derived at render time from birthYear integer
- [Phase 01-signup-flow-redesign]: Removed misleading email confirmation toast — accounts are immediately active (D-13)

v2.7 roadmap decisions:

- Phase 2 is the root dependency: both new DB tables must exist before any UI, notification, or heatmap work begins
- instrument_practice_streak is a separate table from current_streak — merging them would entangle two distinct behavioral domains
- local_date DATE column (not UTC timestamp derivation) is mandatory in Phase 2 schema — cannot be backfilled accurately after launch
- UNIQUE constraint on (student_id, practiced_on) + award_xp only when count === 1 prevents XP double-award
- ON DELETE CASCADE on both new tables required for COPPA hard-delete compliance (April 2026 deadline)
- Phase 3 notification architecture decision (extend send-daily-push vs. new cron) must be resolved as an explicit ADR before implementation
- Phase 4 heatmap library vs. bespoke SVG decision should be recorded as ADR in phase spec; react-activity-calendar recommended for date-math reliability
- iOS action button support does not exist in 2026; URL param fallback (?practice_checkin=1) is the primary path, not the fallback
- [Phase 02-data-foundation-and-core-logging]: practiced_on is DATE not TIMESTAMPTZ — prevents UTC drift bug in local calendar day tracking
- [Phase 02-data-foundation-and-core-logging]: instrument_practice_streak is SEPARATE from current_streak — independent instrument streak per D-12
- [Phase 02-data-foundation-and-core-logging]: XP award failure is non-blocking — practice log recorded even if awardXP throws
- [Phase 02-data-foundation-and-core-logging]: logState FSM (idle/logging/settled) prevents double-tap and manages 2-second hold (D-06, D-07)

### Roadmap Evolution

- Phase 1 (Signup Flow Redesign) — COMPLETE (4/4 plans, all waves), running in parallel worktree
- Milestone v2.7 roadmap defined: Phases 2-5 (Instrument Practice Tracking)

### Blockers/Concerns

**COPPA deadline:** April 22, 2026

- Both new tables need ON DELETE CASCADE before launch — this is in Phase 2 schema and must not be deferred

## Session Continuity

Last session: 2026-03-24T00:06:55.414Z
Stopped at: Completed 02-02-PLAN.md (checkpoint:human-verify at Task 3)
Resume file: None

**Next action:**

- Run `/gsd:plan-phase 2` to plan Phase 2: Data Foundation and Core Logging
- Phase 2 covers: INFRA-01 through INFRA-05 (DB migration + RLS), LOG-01/02/03 (service + card + XP), STRK-01/02/03 (streak counter + weekend freeze + separate table)
- Research flag resolved: all Phase 2 patterns mirror existing codebase directly (streakService.js, award_xp, RLS conventions)

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-24 — v2.7 roadmap created, Phases 2-5 defined*
