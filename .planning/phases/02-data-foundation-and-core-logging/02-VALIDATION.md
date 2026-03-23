---
phase: 2
slug: data-foundation-and-core-logging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/services/practiceLogService.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command on specific test file for that task
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | INFRA-01, INFRA-02, INFRA-03 | migration | `supabase db push` (manual) | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | INFRA-04 | unit | `npx vitest run src/utils/dateUtils.test.js` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | LOG-03 | unit (service) | `npx vitest run src/services/practiceLogService.test.js` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | LOG-03 | unit (service) | `npx vitest run src/services/practiceLogService.test.js` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | STRK-02 | unit (service) | `npx vitest run src/services/practiceStreakService.test.js` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | STRK-02 | unit (service) | `npx vitest run src/services/practiceStreakService.test.js` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | LOG-01, LOG-02 | component (RTL) | `npx vitest run src/components/dashboard/PracticeLogCard.test.jsx` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 3 | INFRA-05 | unit | `npx vitest run src/locales/translations.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/services/practiceLogService.test.js` — stubs for LOG-03 (idempotency: unique_violation → `inserted: false`, first INSERT → `inserted: true`)
- [ ] `src/services/practiceStreakService.test.js` — stubs for STRK-02 (weekend pass logic, streak gap calculation)
- [ ] `src/components/dashboard/PracticeLogCard.test.jsx` — stubs for LOG-01, LOG-02 (3-state rendering: loading, active, completed)
- [ ] `src/utils/dateUtils.test.js` — stubs for INFRA-04 (`getCalendarDate` timezone safety)

*Existing infrastructure covers test framework setup. Only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration runs without error | INFRA-01, INFRA-02 | Requires live Supabase instance | Run `supabase db push` locally |
| RLS prevents cross-student reads | INFRA-03 | Requires authenticated Supabase session | Query `instrument_practice_logs` as student A, verify student B's logs not visible |
| `award_xp()` RPC awards exactly 25 XP | LOG-03 | Requires live DB RPC call | Call RPC with test student, verify XP increases by 25 |
| ON DELETE CASCADE removes practice data | INFRA-03 | Requires live DB FK enforcement | Delete test student, verify practice logs and streak rows removed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
