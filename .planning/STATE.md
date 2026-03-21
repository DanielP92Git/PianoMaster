---
gsd_state_version: 1.0
milestone: v2.5
milestone_name: Launch Prep
status: unknown
stopped_at: Completed 14-01-PLAN.md
last_updated: "2026-03-21T13:08:24.605Z"
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Phase 14 — coppa-hard-delete

## Current Position

Phase: 14 (coppa-hard-delete) — EXECUTING
Plan: 2 of 2 (Plan 01 complete)

## Performance Metrics

**Velocity:**

- Total plans completed: ~141 (across all shipped milestones)
- 15 milestones shipped in 48 days (2026-01-31 to 2026-03-19)

## Accumulated Context

### Decisions

All v2.4 decisions archived in `.planning/milestones/v2.4-ROADMAP.md`.

**v2.5 phase ordering rationale:**

- Phase 12 before Phase 14: Production DB state must be confirmed before the hard-delete pre-implementation schema audit is meaningful
- Phase 13 before Phase 14: ESLint cleanup touching auth/security files during COPPA compliance work creates unnecessary regression risk
- Phase 14 before Phase 15: QA checklist must include the full COPPA deletion flow end-to-end
- Phase 15 last: Validates all preceding phases against a documented pass/fail spec
- [Phase 12-build-tooling-fixes]: Fixed .js extension on all three keySignatureConfig consumers (not just the critical one) to ensure ESM compliance across any future raw-Node scripts and for codebase consistency
- [Phase 12-build-tooling-fixes]: Used `migration repair --status applied` instead of `db push` — all migrations had been applied via dashboard. Renamed duplicate timestamp file 20260127000003 → 20260127100000
- [Phase 13-eslint-cleanup]: Added node globals to vitest test file override because rhythmGenerator.test.js uses require() (CJS Node global not in vitest globals)
- [Phase 13-eslint-cleanup]: Used eslint-disable-next-line (not block-level) for all react-refresh suppressions to keep lint granular; each includes written rationale after --
- [Phase 13-eslint-cleanup]: Removed dead handleResetProgress (~100 lines) from TrailMap.jsx — contained direct Supabase call bypassing RLS, unsuitable for production
- [Phase 13-eslint-cleanup]: Used underscore-prefix for legacy backward-compat params in usePitchDetection (noteFrequencies, tolerance) rather than removing — preserves API compatibility for callers
- [Phase 13]: react-hooks/exhaustive-deps: audioEngine from useAudioEngine returns new object each render -- suppress with rationale rather than adding as dep
- [Phase 13]: react-hooks/exhaustive-deps: debugLog moved to module scope in useGameTimer (stable ref, no suppression needed)
- [Phase 14-coppa-hard-delete]: CASCADE delete via students table row removal — simpler, relies on existing FK cascade constraints
- [Phase 14-coppa-hard-delete]: LS cancel failure blocks deletion and increments failed counter — orphan billing prevention
- [Phase 14-coppa-hard-delete]: Email failure does not block deletion — confirmation is a courtesy, data is already gone

### Blockers/Concerns

**Phase 12 pre-checks (required before coding):**

- Run `SELECT to_regclass('public.student_daily_challenges')` to check if table already exists in production before `supabase db push` — migration lacks IF NOT EXISTS guards

**Phase 13 risk:**

- Process `react-hooks/exhaustive-deps` warnings last and one file at a time — audio-heavy game components (SightReadingGame, NotesRecognitionGame) have intentional dep omissions; bulk fix risks infinite render loops

**Phase 14 pre-checks (required before coding):**

- Run `SELECT conname, confdeltype FROM pg_constraint WHERE confrelid = 'students'::regclass` in Supabase SQL Editor to confirm parent_subscriptions FK cascade status
- `dataExportService.js` STUDENT_DATA_TABLES does not include `parent_subscriptions` or `push_subscriptions` — must add as part of Phase 14
- Brevo parent email must be read and stored in a local variable BEFORE any row deletion begins

**COPPA deadline:** April 22, 2026 — Phase 14 is time-critical

## Session Continuity

Last session: 2026-03-20T23:48:40.671Z
Stopped at: Completed 14-01-PLAN.md
Resume file: None

**Next action:**

- Execute Plan 02 (14-02): Register pg_cron schedule and verify end-to-end COPPA deletion pipeline

---
*State initialized: 2026-01-31*
*Last updated: 2026-03-20 — v2.5 roadmap created*
