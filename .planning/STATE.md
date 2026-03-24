---
gsd_state_version: 1.0
milestone: v2.7
milestone_name: Instrument Practice Tracking
status: Ready to execute
stopped_at: Completed 04-01-PLAN.md (data layer for parent calendar heatmap)
last_updated: "2026-03-24T17:45:57.112Z"
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 10
  completed_plans: 9
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 04 — parent-calendar-heatmap

## Current Position

Phase: 04 (parent-calendar-heatmap) — EXECUTING
Plan: 2 of 2

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

Auth i18n & language toggle (2026-03-24, post-Phase 1):

- LoginForm.jsx now sets `dir`, `lang`, and Hebrew font on root div — RTL works on auth pages
- Created AuthLanguageToggle component (EN/HE pill, top-right corner of login/signup)
- SignupForm.jsx, AgeGate.jsx, ParentEmailStep.jsx: all hardcoded English strings replaced with `t()` calls
- Full Hebrew translations added under `auth.signup.*` keys in both locale files
- RTL fixes: role cards use `text-start`, back arrows swap ArrowLeft/ArrowRight by direction
- PWAInstallPrompt.jsx: all 12 hardcoded strings translated under `install.prompt.*` keys
- Terms line (LoginForm bottom) now uses translation keys and proper link targets (/terms, /privacy)
- SignupForm.test.jsx: added `import "../../i18n"` so tests work with translated strings (11/11 pass)

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
- [Phase 03-push-notification-integration]: Practice check-in priority: instrument_practice_logs queried before students_score so students without a practice log get check-in notification instead of app-usage reminder
- [Phase 03-push-notification-integration]: last_notified_at updated in both practice check-in and app-usage branches, enforcing 1 notification/day invariant (D-05)
- [Phase 03-push-notification-integration / Plan 02]: action string is 'yes-practiced' (not 'yes') to match UI-SPEC and avoid collision with generic 'open' action
- [Phase 03-push-notification-integration / Plan 02]: replaceState before async logPractice() call — prevents URL param re-triggering on React re-renders
- [Phase 03-push-notification-integration / Plan 02]: snoozed notification tag 'practice-checkin-snoozed' with data.snoozed:true prevents recursive snooze chain
- [Phase 04-parent-calendar-heatmap]: getHistoricalLogs uses session.user.id (not passed studentId) — enforces RLS; studentId prop on UI component is for TanStack Query key only
- [Phase 04-parent-calendar-heatmap]: buildHeatmapData and computeLongestStreak are named exports (not on service object) — pure functions directly testable without Supabase mock

### Roadmap Evolution

- Phase 1 (Signup Flow Redesign) — COMPLETE (4/4 plans, all waves), running in parallel worktree
- Milestone v2.7 roadmap defined: Phases 2-5 (Instrument Practice Tracking)

### Blockers/Concerns

**COPPA deadline:** April 22, 2026

- Both new tables need ON DELETE CASCADE before launch — this is in Phase 2 schema and must not be deferred

## Session Continuity

Last session: 2026-03-24T17:45:57.099Z
Stopped at: Completed 04-01-PLAN.md (data layer for parent calendar heatmap)
Resume file: None

**Next action:**

- Phase 03 complete — all 2 plans executed (03-01 Edge Function + 03-02 SW + Dashboard)
- Phase 04 (parent heatmap) or Phase 05 (production deployment) can proceed next

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-24 — Phase 03 push-notification-integration complete (both plans)*
