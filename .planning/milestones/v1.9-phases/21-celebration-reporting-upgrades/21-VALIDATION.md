---
phase: 21
slug: celebration-reporting-upgrades
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing) |
| **Config file** | `vitest.config.js` / inline in `vite.config.js` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | PROG-04 | unit | `npx vitest run src/services/weeklyProgressService.test.js -x` | Wave 0 | pending |
| 21-01-02 | 01 | 1 | PROG-05 | unit | `npx vitest run src/components/games/VictoryScreen.test.js -x` | Wave 0 | pending |
| 21-01-03 | 01 | 1 | PROG-06 | unit | `npx vitest run src/components/dashboard/DailyMessageBanner.test.js -x` | Wave 0 | pending |
| 21-02-01 | 02 | 2 | PROG-07 | manual-only | N/A (Edge Function in Deno runtime) | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/services/weeklyProgressService.test.js` — stubs for PROG-04 date range queries
- [ ] `src/components/dashboard/DailyMessageBanner.test.js` — stubs for PROG-06 non-repeat logic

*VictoryScreen personal best is a small conditional addition; testing via existing VictoryScreen test infrastructure or manual validation is sufficient. Edge Function tested via deployment.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Weekly email sends correctly via Brevo | PROG-07 | Edge Function runs in Deno runtime (not Vitest-testable) | 1. Deploy send-weekly-report function 2. Invoke with cron secret header 3. Verify email received with correct data and branding |
| Personal best badge appears on VictoryScreen | PROG-05 | Visual integration on existing dense screen | 1. Complete a trail node 2. Replay and beat the score 3. Verify "New personal best" badge appears near score |
| Weekly summary card renders on Dashboard | PROG-04 | Visual layout integration | 1. Practice on multiple days 2. Check Dashboard shows correct days practiced, XP earned |
| Fun fact messages rotate daily | PROG-06 | localStorage-dependent rotation | 1. Open app on Day 1, note message 2. Open app on Day 2, verify different message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
