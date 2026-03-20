---
phase: 12
slug: build-tooling-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vitest.config.js (or vite.config.js with test block) |
| **Quick run command** | `npm run verify:patterns` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run verify:patterns`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run build` succeeds
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | BUILD-01 | smoke | `npm run verify:patterns` | N/A — script run | ⬜ pending |
| 12-01-02 | 01 | 1 | BUILD-01 | unit | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` | ✅ | ⬜ pending |
| 12-02-01 | 02 | 1 | BUILD-02 | manual | SQL Editor check | N/A — DB verification | ⬜ pending |
| 12-02-02 | 02 | 1 | BUILD-02 | manual smoke | Visual browser check | N/A — prod only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The `keySignatureUtils.test.js` file exists and runs. `verify:patterns` itself is the acceptance test for BUILD-01.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `student_daily_challenges` table exists with RLS | BUILD-02 | Database state in production Supabase | Run `SELECT to_regclass('public.student_daily_challenges')` in Supabase SQL Editor; verify RLS via `SELECT relrowsecurity FROM pg_class WHERE relname='student_daily_challenges'` |
| DailyChallengeCard renders real data | BUILD-02 | Requires production environment with seeded data | Open dashboard in production, verify DailyChallengeCard shows challenge content (not skeleton/error) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
